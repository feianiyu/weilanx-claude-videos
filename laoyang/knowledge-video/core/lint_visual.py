#!/usr/bin/env python3
"""画面体检（深度 v5，STANDARD_DEEP_V5.md §5）：按内容选表现方式，不按模板。
每张卡写 "rel"（这一段的内容关系），体检看三件事：
  1. 卡片类型和 rel 对得上（讲证据就用知识卡，讲机制就用逻辑图——不是谁多谁少，而是对不对）
  2. 画面不单调：同一种卡不连排 3 张；文字类卡每种 ≤3 张；全期 ≥5 种不同的画面
  3. 和上一期不撞脸：主图类型、卡片顺序和上一期太像就提示
lines.json 写 "layout": "v5" 时 1、2 不过就拦构建；其余期数只提示。单独跑：python3 core/lint_visual.py <期目录>"""
import json, os, sys, glob
from collections import Counter
from difflib import SequenceMatcher

# 内容关系 → 合适的卡（前面的更推荐）。知识卡和逻辑图并列，按内容挑。
REL = {
 # —— 知识卡擅长的：事实、证据、故事、观点 ——
 "钩子": ["hook"], "金句": ["punch"], "提问": ["question"], "评论区": ["question", "map", "cycle", "tree", "pyramid"],
 "出处": ["text", "quote", "focus"], "原文": ["quote", "text"], "故事": ["text", "focus", "timeline", "map"],
 "一个数": ["bignum", "dots", "duo"], "两个数": ["duo", "bars", "shift", "balance"], "口径变化": ["shift", "versus", "duo"],
 "几个发现": ["list", "index", "check", "tree"], "清单": ["list", "check"], "决策": ["check", "close", "list"],
 "排名": ["bars", "chart"], "趋势": ["line", "chart", "bars"], "误解": ["myth", "versus", "iceberg"],
 # —— 逻辑图擅长的：关系、机制、结构 ——
 "比例": ["dots", "donut", "bignum"], "构成": ["donut", "bignum", "sankey", "chart"], "分流": ["sankey", "split", "flow"],
 "筛选": ["funnel", "dots"], "账目变化": ["waterfall", "sankey"], "循环": ["cycle"], "拆解": ["tree", "map", "list"],
 "层级": ["pyramid", "stack", "map"], "阶段": ["timeline", "ladder", "line"], "演进": ["ladder", "timeline", "stack"],
 "交集": ["venn", "matrix"], "表象本质": ["iceberg", "myth"], "新旧": ["versus", "shift", "map"], "拉扯": ["forces", "balance"],
 "取舍": ["balance", "forces", "matrix", "split"], "分类": ["matrix", "tree", "venn"], "传导": ["chain", "map", "flow", "link"],
 "组织": ["map", "stack", "tree"],
 "分化": ["diverge", "pnbar", "versus", "bars"], "涨跌对比": ["pnbar", "bars", "duo"], "地区分布": ["tilemap", "bars"], "流向": ["flowmap", "sankey", "flow", "link"], "两维定位": ["bubble", "matrix"], "迁移": ["bubble", "flowmap", "versus"], "排名变化": ["race", "bars", "chart"], "路径": ["routes", "map", "timeline"], "两端": ["link", "flow", "map"],
}
TEXTY = {"text", "punch", "question", "shift", "list", "quote"}
LOGIC = {"map", "chain", "matrix", "balance", "waterfall", "cycle", "tree", "funnel", "pyramid", "venn", "timeline", "iceberg",
         "sankey", "donut", "versus", "ladder", "dots", "forces", "stack", "line", "tilemap", "flowmap", "bubble", "race", "diverge", "pnbar"}

def _prev_episode(ep_dir):
    if not ep_dir: return None
    here = os.path.basename(os.path.abspath(ep_dir)); root = os.path.dirname(os.path.abspath(ep_dir))
    eps = sorted(d for d in os.listdir(root) if not d.startswith("_") and d < here and os.path.exists(os.path.join(root, d, "lines.json")))
    return os.path.join(root, eps[-1]) if eps else None

def main_graph(types):
    lg = [t for t in types if t in LOGIC]
    return Counter(lg).most_common(1)[0][0] if lg else None

def lint(D, ep_dir=None):
    C = D.get("cards") or []; n = len(C)
    if not n: return [], []
    E, W = [], []
    types = [c["type"] for c in C]
    # 1 对不对
    norel = [c["id"] for c in C if not c.get("rel") and c["type"] != "hook"]
    if norel: E.append("这些卡没写 rel（内容关系）：" + "、".join(norel) + "。先判断这一段讲的是什么关系，再选卡（V5 §2）。")
    for c in C:
        r = c.get("rel")
        if not r: continue
        if r not in REL: W.append(f"{c['id']} 的 rel「{r}」不在识别表里（可用：{'、'.join(REL)}）。"); continue
        if c["type"] not in REL[r]: E.append(f"{c['id']} 讲的是「{r}」，用 {c['type']} 不合适：试试 {' / '.join(REL[r])}。")
    # 2 单调不单调
    run = 1
    for i, (a, b) in enumerate(zip(types, types[1:])):
        run = run + 1 if a == b else 1
        if run == 3 and a != "map": E.append(f"「{a}」连排 3 张（到 {C[i+1]['id']}）：观众会觉得每张都一样。")
    over = [f"{t}×{k}" for t, k in Counter(types).items() if t in TEXTY and k > 3]
    if over: E.append("同一种文字卡超过 3 张：" + "、".join(over) + "。")
    kinds = len(set(types))
    if kinds < 5: E.append(f"全期只有 {kinds} 种画面，至少 5 种。")
    tx = sum(t in TEXTY for t in types) / n; lg = sorted({t for t in types if t in LOGIC})
    W.append(f"{n} 张卡、{kinds} 种画面；文字卡 {tx:.0%}，逻辑图 {len(lg)} 种（{'、'.join(lg) or '无'}）——比例由内容决定，这里只报告。")
    # 3 和上一期比
    pv = _prev_episode(ep_dir)
    if pv:
        pt = [c["type"] for c in json.load(open(os.path.join(pv, "lines.json"))).get("cards", [])]
        sim = SequenceMatcher(None, types, pt).ratio(); mg, pmg = main_graph(types), main_graph(pt)
        if sim > 0.6: W.append(f"卡片顺序和上一期（{os.path.basename(pv)}）相似度 {sim:.0%}：换一换开场后的第一张图和主图。")
        if mg and mg == pmg and mg != "map": W.append(f"主图和上一期一样都是 {mg}：同一种主图别连用两期。")
    return E, W

if __name__ == "__main__":
    ep = sys.argv[1]; D = json.load(open(os.path.join(ep, "lines.json")))
    e, w = lint(D, ep); [print("提示：", x) for x in w]; [print("未通过：", x) for x in e]; sys.exit(1 if e and D.get("layout") in ("v5", "v6") else 0)
