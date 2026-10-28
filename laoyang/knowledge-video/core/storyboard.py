#!/usr/bin/env python3
"""v4 分镜表：python3 core/storyboard.py <期>   （先 build）
每张卡一行：时间、对应的句子、讲解模式、主角、节拍、落位停留；并检查 v4 规则，最后渲一张「分镜联系表」out/分镜.png（每张卡取落位后的一帧）。
用户确认分镜表之后才进入画面细修和出片（STANDARD「v4 流程」）。"""
import sys, os, json, subprocess
CORE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
M = json.load(open("build/meta.json")); A = M["anchors"]; C = M["cards"]; DUR = M["dur"]; TL = M["timeline"]; SECS = M["secs"]
NAME = {"big": "大数字揭示", "grid": "占比格", "vs": "数字对比", "before": "过去→现在", "chain": "因果链", "myth": "误区→真相", "steps": "步骤清单",
        "analogy": "类比", "set": "高光时刻", "quote": "引句（旧）", "stat": "数字卡（旧）", "trio": "三数（旧）", "compare": "横条对比（旧）", "list": "清单（旧）", "chips": "标签（旧）"}
def hero(c):
    t = c["type"]
    if t in ("big", "stat"): return f'{c["num"]}{c.get("unit", "")}'
    if t == "grid": return f'{c.get("hit")} / {c.get("total")}'
    if t == "vs": return next((f'{x["label"]} {x["num"]}{x.get("unit", "")}' for x in c["items"] if x.get("win")), "（没标 win）")
    if t == "before": return c["after"]["t"]
    if t == "chain": return c["items"][-1]["t"]
    if t == "myth": return c["fact"].replace("*", "")
    if t in ("steps", "list"): return c.get("title") or f'{len(c["items"])} 项'
    if t == "analogy": return c["share"]
    if t in ("set", "quote"): return c["lines"][1]
    return "—"
def beats(o):   # 卡里所有挂了锚点的字段（at / xxAt），递归
    out = []
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str) and (k == "at" or k.endswith("At")) and v in A: out.append(A[v] - 0.15)
            else: out += beats(v)
    elif isinstance(o, list):
        for v in o: out += beats(v)
    return out
rows, warn = [], []
sec_of = lambda t: next((s["id"] for s in SECS if s["start"] - 0.05 <= t < s["end"] - 0.05), SECS[-1]["id"])
sets = {}
for i, c in enumerate(C):
    t0 = c["t"]; t1 = C[i + 1]["t"] if i + 1 < len(C) else DUR
    bs = sorted(set(round(b, 2) for b in beats(c) if t0 - 0.01 <= b < t1)) or [t0]
    last = max(bs + [t0]); hold = t1 - (last + 0.5)
    lines = [k for k, (a, b) in TL.items() if a < t1 - 0.05 and b > t0 + 0.05]
    gaps = [b - a for a, b in zip([t0] + bs, bs + [t1 - 1.0])]
    no = f"K{i + 1:02d}"; sec = sec_of(t0)
    if c["type"] == "set": sets.setdefault(sec, []).append(no)
    w = []
    if hold < 1.0 and i + 1 < len(C): w.append(f"落位停留 {hold:.1f}s <1s")
    if t1 - t0 < 2.5: w.append(f"镜头只有 {t1 - t0:.1f}s（短句并入相邻卡）")
    if c["type"] == "set" and len(gaps) > 1: gaps = gaps[:-1] + [min(gaps[-1], 4.0) if gaps[-1] <= 5.0 else gaps[-1]]   # 高光时刻落位后允许停到 5 秒
    if gaps and max(gaps) > 4.0: w.append(f"节拍间隔 {max(gaps):.1f}s >4s（加节拍或拆卡）")
    if "旧" in NAME.get(c["type"], "旧"): w.append("旧卡片，建议换 v4 模式")
    warn += [f"{no} {x}" for x in w]
    rows.append(f"| {no} | {t0:5.1f}–{t1:5.1f}s | {sec} | {' '.join(lines)} | {NAME.get(c['type'], c['type'])} | {hero(c)} | {len(bs)} | {hold:.1f}s | {'；'.join(w) or '✓'} |")
for s_, v in sets.items():
    if len(v) > 1: warn.append(f"{s_} 有 {len(v)} 个高光时刻（每章 ≤1）：{v}")
md = ["# 分镜表（v4）", "", f"时长 {DUR:.1f}s · {len(C)} 张卡 · 高光时刻 {sum(len(v) for v in sets.values())} 个", "",
      "| 卡 | 时间 | 章 | 句子 | 讲解模式 | 主角 | 节拍 | 落位停留 | 检查 |", "|---|---|---|---|---|---|---|---|---|"] + rows
md += ["", "## 句子原文", ""] + [f"- {k}：{t}" for k, t in M["lines"].items()]
md += ["", "## 检查结果", ""] + ([f"- {x}" for x in warn] or ["- 全部通过"])
os.makedirs("out", exist_ok=True); open("out/分镜表.md", "w", encoding="utf-8").write("\n".join(md) + "\n")
print("\n".join(md[:len(rows) + 6])); print("检查：", warn or "全部通过")
# 分镜联系表：每张卡取「下一张卡开始前 0.55s」那一帧（离场前、落位后）（落位后的样子）
ts = [round((C[i + 1]["t"] if i + 1 < len(C) else DUR - 0.5) - 0.55, 2) for i in range(len(C))]
subprocess.run([sys.executable, f"{CORE}/qc.py", EP] + [str(t) for t in ts], capture_output=True)
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype(f"{CORE}/assets/NotoSansSC.ttf", 26); W, H = 360, 640; n = len(ts); cols = min(5, n); rws = (n + cols - 1) // cols
out = Image.new("RGB", (cols * (W + 12), rws * (H + 52)), (18, 18, 18)); d = ImageDraw.Draw(out)
for i, t in enumerate(ts):
    im = Image.open(f"build/qc/q_{t:06.2f}.png").resize((W, H), Image.LANCZOS); x, y = (i % cols) * (W + 12), (i // cols) * (H + 52)
    out.paste(im, (x, y + 46)); d.text((x + 6, y + 8), f"K{i + 1:02d} {NAME.get(C[i]['type'], C[i]['type'])}", font=F, fill=(255, 212, 92))
out.save("out/分镜.png"); print("分镜联系表：", os.path.join(EP, "out/分镜.png"))
