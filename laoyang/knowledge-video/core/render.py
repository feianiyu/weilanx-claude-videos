#!/usr/bin/env python3
"""逐帧确定性渲染 <期>/build/index.html（render(t) 是时间的纯函数）
  python3 core/render.py <期> snap 5.0 20.3 ...        → build/snap_<t>.png
  python3 core/render.py <期> part a b out.mp4         → 只渲第 a..b 帧（无声）
  python3 core/render.py <期> final [--jobs 3]         → 并行分段 → 拼接 → 混入 build/mix.wav → out/老杨魔方_<标题>.mp4
     meta.intro 为真时（深度版每期默认）开头接电影片头 core/assets/intro/intro_v2.mp4：片头 3.6s 起 0.5s 溶进正片，正片整体后移 3.6s
     meta.trans 非空时（深度版每期默认）在章节交界叠魔方转场镜头 core/assets/trans/<id>.mp4（声音 build 已混进 mix.wav）
"""
import sys, os, json, subprocess, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _browser import launch_args
from playwright.async_api import async_playwright
EP = os.path.abspath(sys.argv[1])
if len(sys.argv) > 5 and sys.argv[2] == "part": sys.argv[5] = os.path.abspath(sys.argv[5])
os.chdir(EP)
URL = "file://" + os.path.abspath("build/index.html") + "?capture=1"
FPS = 30
# 深度版：暗部渐变多，帧用 PNG 无损截图 + crf 15，避免底图色带和糊
DEEP = json.load(open("lines.json")).get("style") == "deep"
CRF = "15" if DEEP else "18"

async def session(fn):
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        errs = []; pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None); pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        await fn(pg)
        if errs: print("console errors:", errs[:8])
        await br.close()

async def snap(pg):
    for ts in sys.argv[3:]:
        await pg.evaluate(f"render({float(ts)})"); await pg.screenshot(path=f"build/snap_{float(ts):06.2f}.png")

async def part(pg):
    a, b, out = int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "png" if DEEP else "mjpeg", "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", CRF, "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for f in range(a, b):
        await pg.evaluate(f"render({f / FPS})"); ff.stdin.write(await pg.screenshot(type="png") if DEEP else await pg.screenshot(type="jpeg", quality=92))
        if (f - a) % 300 == 0: print(f"  [{a}-{b}] frame {f}", flush=True)
    ff.stdin.close(); ff.wait()

def final():
    meta = json.load(open("build/meta.json")); D = json.load(open("lines.json"))
    if meta.get("audio_missing"): print("!! 警告：有音频是静音占位，成片没有 BGM/音效：", len(meta["audio_missing"]), "个")
    jobs = int(sys.argv[sys.argv.index("--jobs") + 1]) if "--jobs" in sys.argv else 3
    n = int(round(meta["dur"] * FPS)); os.makedirs("build/parts", exist_ok=True); os.makedirs("out", exist_ok=True)
    cuts = [round(n * i / jobs) for i in range(jobs + 1)]
    ps = [subprocess.Popen([sys.executable, __file__, EP, "part", str(cuts[i]), str(cuts[i + 1]), f"build/parts/p{i}.mp4"]) for i in range(jobs)]
    for p in ps:
        if p.wait(): sys.exit("分段渲染失败")
    open("build/parts/list.txt", "w").write("".join(f"file 'p{i}.mp4'\n" for i in range(jobs)))
    out = f"out/老杨魔方_{D['series']['title']}.mp4"
    if meta.get("intro") or meta.get("trans"):
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "build/parts/list.txt", "-c", "copy", "build/parts/body.mp4"], check=True)
        compose("build/parts/body.mp4", "build/mix.wav", out, bool(meta.get("intro")), meta.get("trans") or [])
    else:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "build/parts/list.txt", "-i", "build/mix.wav",
                        "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], check=True)
    print("成片：", os.path.join(EP, out))

INTRO_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "intro", "intro_v2.mp4")
INTRO_AT, INTRO_XF = 3.60, 0.50   # 与 brand_intro/edit_v2.py 的 XF_AT / XF 一致：片头最后的金雾里溶进第 1 张卡

TRANS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "trans")
TR_FADE = 0.3   # 转场镜头淡入 / 淡出各 0.3s，中间最满的一段盖住换卡那一刻

def compose(body, wav, out, intro, trans):
    """正片 + 章节转场（叠在章节交界，声音 build 已混好）+ 片头（3.6s 起 0.5s 溶进正片，正片声音后移 3.6s）。只编码一次。"""
    if intro and not os.path.exists(INTRO_FILE): sys.exit(f"缺电影片头素材：{INTRO_FILE}（用 brand_intro/edit_v2.py --asset 重出，或 lines.json 写 \"intro\": false）")
    ins = ["-i", body, "-i", wav]; fc = [f"[0:v]fps={FPS},format=yuv420p,setpts=PTS-STARTPTS[b0]"]; k = 2
    for n, tr in enumerate(trans):
        f = os.path.join(TRANS_DIR, tr["id"] + ".mp4")
        if not os.path.exists(f): sys.exit(f"缺转场素材：{f}（或 lines.json 写 \"chapterTrans\": false）")
        t0 = max(0.0, tr["t"] - tr["peak"]); ins += ["-i", f]
        fc.append(f"[{k}:v]fps={FPS},format=yuva420p,noise=alls=7:allf=t,setpts=PTS-STARTPTS+{t0}/TB,"
                  f"fade=t=in:st={t0}:d={TR_FADE}:alpha=1,fade=t=out:st={t0 + tr['len'] - TR_FADE:.3f}:d={TR_FADE}:alpha=1[t{n}];"
                  f"[b{n}][t{n}]overlay=eof_action=pass:format=yuv420[b{n + 1}]"); k += 1
    last = f"[b{len(trans)}]"
    if intro:
        ms = int(INTRO_AT * 1000); ins += ["-i", INTRO_FILE]
        fc.append(f"[{k}:v]trim=0:{INTRO_AT + INTRO_XF},setpts=PTS-STARTPTS,fps={FPS},noise=alls=7:allf=t,format=yuv420p[ia];"
                  f"[ia]{last}xfade=transition=fade:duration={INTRO_XF}:offset={INTRO_AT}[v];"
                  f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo[iau];"
                  f"[1:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d={INTRO_XF},adelay={ms}|{ms}[ea];"
                  f"[iau][ea]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89:level=false[aout]")
        vmap, amap = "[v]", "[aout]"
    else:
        fc.append(f"{last}null[v]"); vmap, amap = "[v]", "1:a"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *ins, "-filter_complex", ";".join(fc), "-map", vmap, "-map", amap,
                    "-c:v", "libx264", "-preset", "medium", "-crf", CRF, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-movflags", "+faststart", out], check=True)

mode = sys.argv[2]
if mode == "final": final()
else: asyncio.run(session(snap if mode == "snap" else part))
