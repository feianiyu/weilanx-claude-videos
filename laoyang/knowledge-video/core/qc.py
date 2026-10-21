#!/usr/bin/env python3
"""质检：python3 core/qc.py <期> [t1 t2 ...]
 不给时间点 = 每秒一帧 + 联系表 build/qc_sheet.png；逐帧检查：中间区越界、字幕位置/溢出、控制台报错；
 并列出 meta.json 里缺失的音频。成片做完后再跑：python3 core/qc.py <期> --video  （响度 + 闪烁）"""
import sys, os, json, asyncio, subprocess, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _browser import launch_args
from playwright.async_api import async_playwright
EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
from _checks import CHECK

async def frames(times):
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(viewport={"width": 1080, "height": 1920}); errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") else None); pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file://" + os.path.abspath("build/index.html") + "?capture=1"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        os.makedirs("build/qc", exist_ok=True); bad = 0
        for ts in times:
            await pg.evaluate(f"render({ts})"); iss = sorted(set(await pg.evaluate(CHECK)))
            await pg.screenshot(path=f"build/qc/q_{ts:06.2f}.png")
            if iss: bad += 1; print(f"{ts:6.2f}s", iss[:6])
        print("帧问题：", bad, "  控制台：", errs or "无"); await br.close()

def video():
    meta = json.load(open("build/meta.json")); D = json.load(open("lines.json"))
    v = f"out/老杨魔方_{D['series']['title']}.mp4"
    o = subprocess.run(["ffmpeg", "-i", v, "-af", "ebur128=framelog=quiet:peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    print("响度 I =", re.findall(r"I:\s+(-?[\d.]+) LUFS", o)[-1], "LUFS（目标 −14±0.5）  真峰值", re.findall(r"Peak:\s+(-?[\d.]+) dBFS", o)[-1], "dBFS")
    o = subprocess.run(["ffmpeg", "-i", v, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"], capture_output=True, text=True).stderr
    y = [float(x) for x in re.findall(r"YAVG=([\d.]+)", o)]; j = [abs(y[i + 1] - y[i]) for i in range(len(y) - 1)]
    print(f"亮度跳变 最大 {max(j):.1f}（应 < 20，不做频闪）")

if "--video" in sys.argv: video(); sys.exit()
meta = json.load(open("build/meta.json"))
if meta.get("audio_missing"): print("!! 缺音频（静音占位）：", meta["audio_missing"])
ts = [float(x) for x in sys.argv[2:]] or [i + 0.5 for i in range(int(meta["dur"]))]
asyncio.run(frames(ts))
if len(sys.argv) <= 2:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-pattern_type", "glob", "-i", "build/qc/q_*.png", "-vf", "scale=216:384,tile=12x6:padding=4", "-frames:v", "1", "build/qc_sheet.png"])
    print("联系表：", os.path.join(EP, "build/qc_sheet.png"))
