#!/usr/bin/env python3
"""画面多样性体检（深度 v5 逻辑图谱版，STANDARD_DEEP_V5.md §5）。
build 对 v>=3 的深度版自动调用。lines.json 写 "layout": "v5" 时，硬规则不过就拦构建；其余期数只提示。
也可单独跑：python3 core/lint_visual.py <期目录>"""
import json, os, sys
from collections import Counter

TEXTY = {"text", "punch", "question", "shift", "list", "quote", "hook", "fxtext", "focus", "index", "close", "check"}   # 以文字为主的卡
STRUCT = {"map", "stack", "chain", "flow", "link", "routes", "split", "duo", "bignum", "bars", "chart", "line", "waterfall", "balance", "matrix", "myth",
          "cycle", "tree", "funnel", "pyramid", "venn", "timeline", "iceberg", "sankey", "donut", "versus", "ladder", "dots", "forces"}
LOGIC = {"map", "chain", "matrix", "balance", "waterfall", "cycle", "tree", "funnel", "pyramid", "venn", "timeline", "iceberg", "sankey", "donut", "versus", "ladder", "dots", "forces", "stack", "line"}

def lint(D):
    C = D.get("cards") or []; n = len(C)
    if not n: return [], []
    E, W = [], []
    types = [c["type"] for c in C]; cnt = Counter(types)
    texty = sum(1 for t in types if t in TEXTY); share = texty / n
    logic = sorted({t for t in types if t in LOGIC})
    if share > 0.45: E.append(f"文字卡占 {texty}/{n}（{share:.0%}），超过 45%：把讲关系的段落换成逻辑图（见 V5 §2 识别表）。")
    if len(logic) < 4: E.append(f"逻辑图只有 {len(logic)} 种（{'、'.join(logic) or '无'}），至少 4 种不同的逻辑图。")
    run = 1
    for a, b in zip(types, types[1:]):
        run = run + 1 if a == b else 1
        if run == 3 and a not in ("map",): E.append(f"同一种卡「{a}」连续 3 张：观众会觉得每张都一样，换一种图。")
    over = [f"{t}×{k}" for t, k in cnt.items() if t in ("punch", "question", "text", "shift", "list") and k > 3]
    if over: E.append("同类文字卡太多：" + "、".join(over) + "（每种最多 3 张）。")
    W.append(f"画面：{n} 张卡，文字卡 {share:.0%}，逻辑图 {len(logic)} 种：{'、'.join(logic)}")
    return E, W

if __name__ == "__main__":
    D = json.load(open(os.path.join(sys.argv[1], "lines.json")))
    e, w = lint(D); [print("提示：", x) for x in w]; [print("未通过：", x) for x in e]; sys.exit(1 if e and D.get("layout") == "v5" else 0)
