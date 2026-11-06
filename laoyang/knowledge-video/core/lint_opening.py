#!/usr/bin/env python3
"""深度 v2 稿子体检（开场钩子 + 决策桥接）。build 在 lines.json 写了 "v": 2 时自动调用；也可单独跑：python3 core/lint_opening.py <期目录>
规则见 STANDARD_DEEP_V2.md §2。错误 = 不让出片；警告 = 提示。"""
import json, os, re, sys

BAN = [  # (正则, 说明)  —— 开场前两句不许出现的「开章名义」套话
    (r"^(大家好|各位|哈喽|hello|欢迎|你好)", "开场问候"),
    (r"(今天|本期|这期|这一期|这次|今儿|咱们今天)[^，。？！]{0,10}(讲|聊|说|分析|解读|拆解|分享|看看|研究|带大家|给大家|为大家)", "「今天我们这期讲/分析……」式开章名义"),
    (r"(深度|详细|系统|全面)(分析|解读|拆解|解析)", "「深度分析/解读」自我介绍式"),
    (r"(接下来|下面|下面我们|首先我们|让我们)[^，。]{0,6}(来|一起|看|聊|讲)", "「接下来我们来……」式过门"),
    (r"(研究报告|这份报告|这篇报告|报告)[^，。？！]{0,8}(指出|显示|认为|表示)", "「报告指出」式开头（结论放后面，开头先放冲突）"),
]
HOOK = [r"\d", r"[？?]", r"你", r"没想到|其实|居然|竟然|反而|却|才|只|多花|少了|亏|赔|赚|慌"]

WRITTEN = ["归功于", "显著", "沉淀", "口径", "赋能", "闭环", "抓手", "落地", "聚焦", "由此可见", "综上", "值得注意的是", "高绩效", "重新排一遍", "不仅", "而且更"]   # 书面腔 / 「AI 味」词：只提示，不拦

def lint(L, keys, D):
    errs, warns = [], []
    first = [L[k]["sub"] for k in keys[:2]]
    for i, t in enumerate(first):
        for rx, why in BAN:
            if re.search(rx, t): errs.append(f"第{i+1}句「{t[:24]}…」命中 {why}。开场必须直接给冲突/反常数字/具体场景，不许宣布「我要讲什么」。")
    for k in keys:
        hit = [w for w in WRITTEN if w in L[k]["sub"]]
        if hit: warns.append(f"{k} 有书面腔 / AI 味的词：{'、'.join(hit)}。口播里怎么说就怎么写（换成「说白了」「其实」「差不多」这类话）。")
    n1 = len(re.sub(r"[，。？！、：；\s]", "", first[0]))
    if n1 > 30: errs.append(f"第1句 {n1} 字，太长（≤30 字，v2 语速下 ≈5 秒内必须抛出钩子）。")
    if not any(re.search(h, first[0]) for h in HOOK): warns.append("第1句看不出钩子特征（数字 / 提问 / 「你」/ 转折反常）；再检查一遍。")
    if not re.search(r"[？?]", "".join(first)) and not re.search(r"\d", "".join(first)): warns.append("前两句既没有问句也没有数字：先有一个观众答不上来的问题或一个说不通的数。")
    if not (D.get("decision") or "").strip(): errs.append("缺 lines.json → decision（这期看完，企业家要重新想一想的那个具体决策，一句话；见选题测试）。")
    if D.get("decision") and not any(c.get("type") in ("check", "close") for c in D.get("cards", [])): warns.append("没有 check / close 卡：v2 要求结尾有一张「回去重新想的决策」桥接卡。")
    return errs, warns

if __name__ == "__main__":
    EP = os.path.abspath(sys.argv[1]); D = json.load(open(os.path.join(EP, "lines.json"), encoding="utf-8"))
    cut = set(D.get("cut", [])); keys = [k for k in D["lines"] if k not in cut]
    e, w = lint(D["lines"], keys, D)
    for x in w: print("提示：", x)
    for x in e: print("错误：", x)
    sys.exit(1 if e else 0)
