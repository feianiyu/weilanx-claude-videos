#!/usr/bin/env python3
"""空白检查：python3 core/blankcheck.py <期> [--step 0.5] [--max 0.8]
在页面里隐藏底图和遮罩，每 step 秒渲一帧，统计中间区（x130–950 / y560–1360）偏离中位亮度的像素占比。
占比 < 0.5% 视为「空白」；连续空白超过 max 秒就报出来（「收一拍」那一拍除外）。不用重新构建，读现成的 build/index.html。"""
import sys, os, io, json, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _browser import launch_args
from playwright.async_api import async_playwright
import numpy as np
from PIL import Image
EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
arg = lambda k, d: float(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
STEP, MAXB, THR = arg("--step", 0.5), arg("--max", 0.8), 0.5
meta = json.load(open("build/meta.json")); D = json.load(open("lines.json"))
rest = None
if D.get("restBefore") and D.get("beat"):
    r1 = meta["timeline"][D["restBefore"]][0]; rest = (r1 - D["beat"]["period"] - 0.05, r1 + 0.05)

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        await pg.goto("file://" + os.path.abspath("build/index.html") + "?capture=1"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        await pg.evaluate("for(const id of ['bg','shade'])document.getElementById(id).style.display='none'")
        out = []; t = STEP / 2
        while t < meta["dur"] - 2.6:   # 片尾留白不算
            await pg.evaluate(f"render({t})")
            a = np.asarray(Image.open(io.BytesIO(await pg.screenshot(type="png", clip={"x": 130, "y": 560, "width": 820, "height": 800}))).convert("L")).astype(float)
            out.append((round(t, 2), float((np.abs(a - np.median(a)) > 25).mean() * 100))); t += STEP
        await br.close(); return out

fr = asyncio.run(main()); runs = []; cur = None
for t, v in fr:
    blank = v < THR and not (rest and rest[0] <= t <= rest[1])
    if blank: cur = [t, t] if cur is None else [cur[0], t]
    else:
        if cur: runs.append(cur); cur = None
if cur: runs.append(cur)
bad = [(a, b) for a, b in runs if b - a + STEP > MAXB]
for a, b in bad: print(f"空白 {a:6.2f}–{b + STEP / 2:6.2f}s（{b - a + STEP:.1f}s）")
print(f"抽 {len(fr)} 帧，空白超过 {MAXB}s 的段：{len(bad)}" + ("" if not bad else "  → 给这些时段加画面（挂在当时配音的词上），见 STANDARD §5.1"))
sys.exit(1 if bad else 0)
