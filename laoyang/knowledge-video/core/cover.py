#!/usr/bin/env python3
"""封面：python3 core/cover.py <期> → out/封面.png（文字取 lines.json→cover；底图同正片）。
封面规则 v2（2026-11-04，老杨）：绿色大标题必须直接点出「这期讨论什么」——标题里要含 cover.topic（主题词，如「增值税法」「唐朝盛世转衰」）；
悬念、反问、情绪词放到白色副标。标题最多两行，字号自动缩小到放得下（最小 96px，仍放不下报错）；副标最多两行，自动缩到 44px。"""
import asyncio, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _browser import launch_args
from playwright.async_api import async_playwright
CORE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
D = json.load(open("lines.json")); C = D["cover"]; os.makedirs("out", exist_ok=True); os.makedirs("build", exist_ok=True)
h = open(f"{CORE}/cover.html", encoding="utf-8").read().replace("__FONT__", f"file://{CORE}/assets/NotoSansSC.ttf").replace("__BG__", "file://" + os.path.abspath(D.get("bg") or (D["bgs"][0]["file"] if D.get("bgs") else "assets/bg.jpg")))
import re as _re
plain = lambda x: _re.sub(r"<br\s*/?>", "", x)
topic = C.get("topic", "")
if topic and topic not in plain(C["title"]):
    sys.exit(f"封面标题必须直接点出主题：title 里要含 topic「{topic}」（现在是：{plain(C['title'])}）。悬念放到 sub。")
if D.get("style") == "deep" and not topic:
    sys.exit("深度版封面必须写 cover.topic（这期讨论的主题词），标题里要含它。")
if len(C["title"].split("<br>")) > 2 or len(C.get("sub", "").split("<br>")) > 2:
    sys.exit("封面标题、副标各最多两行（用 <br> 分行）")
h = h.replace("__EY__", C.get("eyebrow", "—— 老杨魔方 · 经营信号 ——")).replace("__TT__", C["title"]).replace("__SS__", C["sub"])
open("build/cover.html", "w", encoding="utf-8").write(h)
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        await pg.goto("file://" + os.path.abspath("build/cover.html")); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        # 自动缩字号：最宽一行放进 60–1020px（宽 960）；标题最小 96px、副标最小 44px
        fit = """(([id,v,max,min])=>{const e=document.getElementById(id);let f=max;
          const w=()=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return [b.left,b.right]};
          document.body.style.setProperty(v,f+'px');
          while(f>min){const [l,r]=w();if(l>=60&&r<=1020)break;f-=2;document.body.style.setProperty(v,f+'px')}
          const [l,r]=w();return [f,Math.round(l),Math.round(r)]})"""
        for args in (["tt", "--tfs", 150, 96], ["ss", "--sfs", 66, 44]):
            f, l, r = await pg.evaluate(fit + "(" + json.dumps(args) + ")")
            print(f"{args[0]} 字号 {f}px，宽 {l}–{r}")
            if l < 60 or r > 1020: sys.exit(f"!! 封面文字超宽（{args[0]} {l}–{r}），再缩短文字")
        await pg.screenshot(path="out/封面.png"); await br.close(); print("封面：", os.path.join(EP, "out/封面.png"))
asyncio.run(main())
