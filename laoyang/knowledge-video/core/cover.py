#!/usr/bin/env python3
"""封面：python3 core/cover.py <期> → out/封面.png（文字取 lines.json→cover；底图同正片）。标题/副标若超出 60–1020px 会报警。"""
import asyncio, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _browser import launch_args
from playwright.async_api import async_playwright
CORE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
D = json.load(open("lines.json")); C = D["cover"]; os.makedirs("out", exist_ok=True); os.makedirs("build", exist_ok=True)
h = open(f"{CORE}/cover.html", encoding="utf-8").read().replace("__FONT__", f"file://{CORE}/assets/NotoSansSC.ttf").replace("__BG__", "file://" + os.path.abspath(D.get("bg", "assets/bg.jpg")))
h = h.replace("__EY__", C.get("eyebrow", "—— 老杨魔方 · 经营信号 ——")).replace("__TT__", C["title"]).replace("__SS__", C["sub"])
open("build/cover.html", "w", encoding="utf-8").write(h)
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        await pg.goto("file://" + os.path.abspath("build/cover.html")); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        bx = await pg.evaluate("[...document.querySelectorAll('#tt,#ss')].map(e=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return [Math.round(b.left),Math.round(b.right)]})")
        for l, r in bx:
            if l < 60 or r > 1020: print("!! 封面文字超宽", l, r, "——缩短标题或在 title 里加 <br>")
        await pg.screenshot(path="out/封面.png"); await br.close(); print("封面：", os.path.join(EP, "out/封面.png"))
asyncio.run(main())
