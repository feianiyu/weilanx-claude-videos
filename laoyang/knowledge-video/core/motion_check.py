#!/usr/bin/env python3
"""v4 动作检查：python3 core/motion_check.py <期> [--fps 5]
逐帧（默认 5 帧/秒）截内容区（x100–980 / y470–1300，不含标题、字幕），缩到 220×208 灰度，帧间平均差 <阈值记为「静止」。
判据（STANDARD「v4 节奏」）：静止连续 >3.0s → 报出（给这一段加节拍 / 动作，或拆卡）；收一拍那段除外。"""
import sys, os, json, asyncio, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _browser import launch_args
from playwright.async_api import async_playwright
import numpy as np
from PIL import Image
EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
FPS = float(sys.argv[sys.argv.index("--fps") + 1]) if "--fps" in sys.argv else 5.0; TH = 0.6
M = json.load(open("build/meta.json")); DUR = M["dur"]
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        await pg.goto("file://" + os.path.abspath("build/index.html") + "?capture=1"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.getElementById('bg').style.visibility='hidden';document.getElementById('shade').style.visibility='hidden'")
        prev = None; still = []; t = 0.0
        while t < DUR - 0.5:
            await pg.evaluate(f"render({t})")
            a = np.asarray(Image.open(io.BytesIO(await pg.screenshot(type="png", clip={"x": 100, "y": 470, "width": 880, "height": 830}))).convert("L").resize((220, 208)), float)
            if prev is not None: still.append((t, float(np.abs(a - prev).mean()) < TH))
            prev = a; t += 1 / FPS
        await br.close()
    runs = []; s0 = None
    for t, st in still + [(DUR, False)]:
        if st and s0 is None: s0 = t
        if not st and s0 is not None:
            if t - s0 > 3.0: runs.append((s0, t))
            s0 = None
    for a, b in runs: print(f"静止 {a:6.1f}–{b:6.1f}s（{b - a:.1f}s）")
    print(f"抽 {len(still)} 帧，静止超过 3s 的段：{len(runs)}" + ("  → 给这些时段加节拍 / 动作，或拆卡" if runs else ""))
asyncio.run(main())
