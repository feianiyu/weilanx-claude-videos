#!/usr/bin/env python3
"""封面：python3 core/cover.py <期> → out/封面.png（文字取 lines.json→cover；底图同正片）。
封面模板 v3（2026-11-06，老杨给样板）：超大橙色粗体主标题（左对齐，最多 3 行）压在压暗的实景底图上 → 英文副标 → 一句话摘要（≤2 行）→ 橙色药丸标签 → 底部品牌条。
内容全部放在 3:4 裁切安全区（y240–1680）内，视频号 / 抖音竖封面裁成 3:4 也不丢字。
封面规则 v2 继续有效（2026-11-04）：主标题必须直接点出「这期讨论什么」——标题里要含 cover.topic；悬念、反问、数字钩子放摘要。
机械魔方封面（2026-11-28 起深度版默认，老杨：不要固定一版，随机挑）：底图从 assets/cover_cube/ 图库里挑（manifest.json 登记），
按期目录名打散排序、避开前 3 期挑中的图；cover.look = "classic" 用回老模板，cover.bg = "A"…"H" 指定某张图。
字段：title（必填，≤3 行，用 <br> 分行）、topic（深度版必填）、en（英文副标，可选）、sub（摘要，可选，≤2 行）、tag（药丸大字，默认取 frame.ep）、tag2（药丸小字，默认「深度拆解」）。
标题 / 英文 / 摘要字号自动缩小到放得下（标题最小 110px），仍放不下报错，不截断。"""
import asyncio, os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _browser import launch_args
from playwright.async_api import async_playwright
CORE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
D = json.load(open("lines.json", encoding="utf-8")); C = D["cover"]; os.makedirs("out", exist_ok=True); os.makedirs("build", exist_ok=True)
plain = lambda x: re.sub(r"<br\s*/?>", "", x or "")
nl = lambda x: len((x or "").split("<br>"))
topic = C.get("topic", "")
if topic and topic not in plain(C["title"]):
    sys.exit(f"封面标题必须直接点出主题：title 里要含 topic「{topic}」（现在是：{plain(C['title'])}）。悬念放到 sub。")
if D.get("style") == "deep" and not topic:
    sys.exit("深度版封面必须写 cover.topic（这期讨论的主题词），标题里要含它。")
if nl(C["title"]) > 3: sys.exit("封面主标题最多三行（用 <br> 分行）")
if nl(C.get("sub", "")) > 2: sys.exit("封面摘要最多两行（用 <br> 分行）")
ep = (D.get("frame") or {}).get("ep", "")
tag, tag2 = C.get("tag", ep), C.get("tag2", "深度拆解" if D.get("style") == "deep" else "")
CUBE = D.get("style") == "deep" and C.get("look", "cube") == "cube"
LIB = os.path.join(CORE, "assets", "cover_cube")

def cube_pick(ep_dir, n_avoid=3):
    """机械魔方底图：按期目录名打散排序取第一张，避开前 n_avoid 期（同目录里按名字排在前面的期）各自的首选图。确定性：同一期重出封面不变。"""
    import hashlib
    items = json.load(open(os.path.join(LIB, "manifest.json"), encoding="utf-8"))["items"]
    rank = lambda name: sorted(items, key=lambda it: hashlib.sha1((name + it["id"]).encode()).hexdigest())
    name = os.path.basename(ep_dir.rstrip("/")); parent = os.path.dirname(ep_dir.rstrip("/"))
    prev = sorted(x for x in os.listdir(parent) if x < name and not x.startswith(("_", ".")) and os.path.isdir(os.path.join(parent, x)))[-n_avoid:]
    used = {rank(x)[0]["id"] for x in prev}
    return next((it for it in rank(name) if it["id"] not in used), rank(name)[0])

if CUBE:
    items = {it["id"]: it for it in json.load(open(os.path.join(LIB, "manifest.json"), encoding="utf-8"))["items"]}
    it = items[C["bg"]] if C.get("bg") in items else cube_pick(EP)
    print(f"封面底图：机械魔方 {it['id']}（{it['desc']}）")
    h = (open(f"{CORE}/cover_cube.html", encoding="utf-8").read().replace("__BG__", "file://" + os.path.join(LIB, it["id"] + ".jpg"))
         .replace("__DY__", str(it.get("dy", 0))).replace("__SC__", str(it.get("sc", 1))).replace("__FULL__", "full" if it.get("sc", 1) >= 1 and not it.get("dy") else ""))
else:
    bgf = D.get("bg") or (D["bgs"][0]["file"] if D.get("bgs") else "assets/bg.jpg")
    h = open(f"{CORE}/cover.html", encoding="utf-8").read().replace("__BG__", "file://" + os.path.abspath(bgf))
h = h.replace("__FONT__", f"file://{CORE}/assets/NotoSansSC.ttf")
h = (h.replace("__CHIP__", C.get("chip", "老杨魔方 · 企业经营观察")).replace("__TT__", C["title"]).replace("__EN__", C.get("en", ""))
     .replace("__SS__", C.get("sub", "")).replace("__TAG__", tag).replace("__TAG2__", tag2))
open("build/cover.html", "w", encoding="utf-8").write(h)
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        await pg.goto("file://" + os.path.abspath("build/cover.html")); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        if not C.get("en"): await pg.evaluate("document.getElementById('en').style.display='none'")
        if not C.get("sub"): await pg.evaluate("document.getElementById('ss').style.display='none'")
        if not (tag or tag2): await pg.evaluate("document.getElementById('pill').style.display='none'")
        # 自动缩字号：最宽一行放进 x60–1020；标题整体高度 ≤ 760px；最小字号见下
        fit = """(([id,v,max,min,maxh])=>{const e=document.getElementById(id);let f=max;
          const box=()=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return [b.left,b.right,b.height]};
          const set=()=>document.body.style.setProperty(v,f+'px');set();
          while(f>min){const [l,r,h]=box();if(l>=60&&r<=1020&&(!maxh||h<=maxh))break;f-=2;set()}
          const [l,r,h]=box();return [f,Math.round(l),Math.round(r),Math.round(h)]})"""
        # 机械魔方版：标题压在上方暗部（≤600px 高），摘要和期号药丸并排在魔方下方，摘要右边界让出药丸
        if CUBE: await pg.evaluate("(()=>{const p=document.getElementById('pill');window._R=p.style.display==='none'?1020:p.getBoundingClientRect().left-24})()")
        fit = fit.replace("r<=1020", "r<=(e.id==='ss'&&window._R?window._R:1020)")
        for args in ((["tt", "--tfs", 176, 110, 600], ["en", "--efs", 40, 26, 0], ["ss", "--sfs", 36, 26, 0]) if CUBE else
                     (["tt", "--tfs", 210, 110, 760], ["en", "--efs", 44, 28, 0], ["ss", "--sfs", 42, 32, 0])):
            if args[0] == "en" and not C.get("en"): continue
            if args[0] == "ss" and not C.get("sub"): continue
            f, l, r, hh = await pg.evaluate(fit + "(" + json.dumps(args) + ")")
            print(f"{args[0]} 字号 {f}px，宽 {l}–{r}，高 {hh}")
            if l < 59 or r > (await pg.evaluate("window._R||1020") if args[0] == "ss" else 1020) + 1 or (args[4] and hh > args[4] + 1): sys.exit(f"!! 封面文字放不下（{args[0]} {l}–{r}，高 {hh}），再缩短文字")
        await pg.screenshot(path="out/封面.png"); await br.close(); print("封面：", os.path.join(EP, "out/封面.png"))
asyncio.run(main())
