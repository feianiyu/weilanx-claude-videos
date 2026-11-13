#!/usr/bin/env python3
"""分镜联系表（深度 v6，STANDARD_DEEP_V6.md §1）：确认文案时一起发给老杨，出片前就能在手机上看到全期画面顺序。
每张卡取它讲完时的画面（所有 step 都长出来），排成网格，标上：序号、时间、内容关系、卡片类型、这张卡开头那句话。
用占位配音（按字数估时）和占位底图，云端就能跑，不需要配音凭证。
  python3 core/storyboard.py episodes/<期>     → episodes/<期>/build/分镜联系表.jpg
"""
import json, os, sys, subprocess, asyncio, shutil
CORE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, CORE)
from _browser import launch_args
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
TYPE_CN = {"hook": "钩子大字", "punch": "金句", "question": "提问", "text": "文字", "list": "清单", "shift": "口径变化", "quote": "原文", "bignum": "大数字",
 "duo": "双数对比", "bars": "柱状", "chart": "堆叠柱", "line": "折线", "waterfall": "瀑布", "balance": "天平", "matrix": "四象限", "check": "决策清单",
 "chain": "因果链", "flow": "流程线", "link": "两端流动", "routes": "多线路", "split": "分账条", "myth": "误解", "focus": "焦点", "index": "目录", "close": "收束",
 "map": "结构图", "stack": "层级柱", "cycle": "飞轮", "tree": "拆解树", "funnel": "漏斗", "pyramid": "金字塔", "venn": "交集", "timeline": "时间轴",
 "iceberg": "冰山", "sankey": "分流", "donut": "构成环", "versus": "新旧对照", "ladder": "阶梯", "dots": "单位图", "forces": "力场",
 "tilemap": "中国方块地图", "flowmap": "流向图", "bubble": "气泡图", "race": "排名赛跑", "diverge": "分叉图", "pnbar": "正负条形"}

pre = set(os.listdir(".")); had_vo = os.path.isdir("vo"); had_assets = os.path.isdir("assets"); keep = os.path.exists("lines.json") and json.load(open("lines.json"))
# 1 占位构建（不改动真配音：只有没有 vo/ 时才生成占位）
if not had_vo: subprocess.run([sys.executable, f"{CORE}/fake_vo.py", EP], check=True, stdout=subprocess.DEVNULL)
if not had_assets:
    os.makedirs("assets", exist_ok=True)
    for b in keep.get("bgs", []):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x2a2119:s=3008x2000", "-frames:v", "1", b["file"]], check=True)
r = subprocess.run([sys.executable, f"{CORE}/build.py", EP], capture_output=True, text=True)
if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:]); sys.exit("构建没过，先修稿子 / 卡片")
html = open("build/index.html", encoding="utf-8").read()
cards = json.loads(html.split('"cards": ', 1)[1].split(', "seriesFs"', 1)[0]) if '"cards": ' in html else None
if cards is None:
    import re; cards = json.loads(re.search(r'"cards":\s*(\[.*?\])\s*,\s*"seriesFs"', html, re.S).group(1))
D = json.load(open("lines.json")); src = {c["id"]: c for c in D["cards"]}
T = [max(c["t0"] + 0.6, min(c["t1"] - 0.6, (max(c["st"]) if c["st"] else c["t0"]) + 1.6)) for c in cards]

async def snap():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        await pg.goto("file://" + os.path.abspath("build/index.html") + "?capture=1"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        out = []
        for i, t in enumerate(T):
            await pg.evaluate(f"render({t})"); f = f"build/sb_{i:02d}.png"; await pg.screenshot(path=f, clip={"x": 60, "y": 360, "width": 960, "height": 1020}); out.append(f)
        await br.close(); return out
shots = asyncio.run(snap())

# 2 拼图：每行 3 张，手机竖着看
F = lambda s: ImageFont.truetype(f"{CORE}/assets/NotoSansSC.ttf", s)
TW, TH, CAP, COLS, PAD = 340, 361, 118, 3, 16
rows = (len(shots) + COLS - 1) // COLS; W = COLS * TW + (COLS + 1) * PAD; H = 130 + rows * (TH + CAP + PAD) + PAD
img = Image.new("RGB", (W, H), (14, 13, 12)); dr = ImageDraw.Draw(img)
dr.text((PAD, 24), f"分镜联系表 · {D['series']['title']}", font=F(40), fill=(245, 166, 35))
kinds = len({c["type"] for c in cards})
dr.text((PAD, 80), f"{len(cards)} 张卡 · {kinds} 种画面 · 约 {cards[-1]['t1']:.0f} 秒（按字数估时）", font=F(24), fill=(185, 179, 168))
subs = {k: v["sub"] for k, v in D["lines"].items()}
for i, (c, f) in enumerate(zip(cards, shots)):
    x = PAD + (i % COLS) * (TW + PAD); y = 130 + (i // COLS) * (TH + CAP + PAD)
    img.paste(Image.open(f).resize((TW, TH)), (x, y))
    s = src.get(c["id"], {}); rel = s.get("rel", ""); at = s.get("at", "").split("|")[0]
    dr.text((x, y + TH + 8), f"{i+1:02d}  {int(c['t0'])//60}:{int(c['t0'])%60:02d}", font=F(22), fill=(245, 166, 35))
    dr.text((x + 100, y + TH + 8), f"{TYPE_CN.get(c['type'], c['type'])}" + (f" · {rel}" if rel else ""), font=F(22), fill=(244, 241, 234))
    line = subs.get(at, ""); line = line if len(line) <= 30 else line[:29] + "…"
    for j in range(0, min(len(line), 30), 15): dr.text((x, y + TH + 42 + j // 15 * 32), line[j:j + 15], font=F(22), fill=(150, 145, 136))
img.save("build/分镜联系表.jpg", quality=88); [os.remove(f) for f in shots]
if not had_vo: shutil.rmtree("vo", ignore_errors=True)
if not had_assets: shutil.rmtree("assets", ignore_errors=True)
[os.remove(f) for f in set(os.listdir(".")) - pre if os.path.isfile(f)]   # 构建顺手生成的发布文案等：原来没有就删掉
json.dump(keep, open("lines.json", "w"), ensure_ascii=False, indent=1)   # 还原 lines.json（占位配音会往里写 dur）
print("分镜联系表：", os.path.abspath("build/分镜联系表.jpg"))
