#!/usr/bin/env python3
"""逐帧确定性渲染 <期>/build/index.html（render(t) 是时间的纯函数）
  python3 core/render.py <期> snap 5.0 20.3 ...        → build/snap_<t>.png
  python3 core/render.py <期> part a b out.mp4         → 只渲第 a..b 帧（无声）
  python3 core/render.py <期> final [--jobs 3]         → 并行分段 → 拼接 → 混入 build/mix.wav → out/老杨魔方_<标题>.mp4
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

HQ = json.load(open("lines.json")).get("layout") == "v3"
async def part(pg):
    a, b, out = int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "png" if HQ else "mjpeg", "-i", "-",
                           "-c:v", "libx264", "-preset", "slow" if HQ else "medium", "-crf", "14" if HQ else "18", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for f in range(a, b):   # v3 高精度：逐帧 PNG（无损）→ x264 crf14 slow；v2 期数照旧 JPEG q92 → crf18
        await pg.evaluate(f"render({f / FPS})"); ff.stdin.write(await pg.screenshot(type="png") if HQ else await pg.screenshot(type="jpeg", quality=92))
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
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "build/parts/list.txt", "-i", "build/mix.wav",
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], check=True)
    print("成片：", os.path.join(EP, out))

mode = sys.argv[2]
if mode == "final": final()
else: asyncio.run(session(snap if mode == "snap" else part))
