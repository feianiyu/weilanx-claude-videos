#!/usr/bin/env python3
"""高留存脚本体检（留存六拍，STANDARD_RETENTION_SCRIPT.md §8 的软规则）。
build 在 lines.json 写了 "v" >= 3 时自动调用，只给提示，不拦出片；也可单独跑：python3 core/lint_retention.py <期目录>
位置按字数估算（配音前就能跑）：CPS 是口播每秒字数的估计值，只用来算「大约第几秒」。"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lint_opening import FEEL_SUB, WHO

CPS = 5.0          # 实测：EP.14 4.9、EP.15 5.4、EP.18 4.8 字/秒（去标点，含句间停顿）
PULL_GAP = 30.0    # 两次「拉一把」之间最多隔多少秒
TURN = r"但|可是|可(?=[^以能见])|却|不过|其实|反而|偏偏|问题是|问题在|关键是|真正|没想到|然而|更[^，。]{0,6}的是"
ASK = r"[？?]|到底|为什么|凭什么|怎么会|怎么办|谁来|哪一"
PROMISE = ASK + r"|建议|结论|判断|怎么看|怎么研究|怎么应对|答案|警告|预言"
NUM = r"\d|[一二两三四五六七八九十百千万亿半]+多?(成|倍|个点|%|亿|万)|一半|翻了?一?倍|减半"
PROOF = r"\d|[一二两三四五六七八九十百千万亿]+(成|倍|个点|%)|《|报告|公告|通报|新闻稿|调查|数据|条文|判决"
AI_WORDS = r"值得注意的是|综上所述|总而言之|不仅如此|与此同时|换句话说|从某种意义上|赋能|抓手|底层逻辑|深度解析|让我们"
strip = lambda t: re.sub(r"[，。？！、：；“”‘’《》（）\s]", "", t)

def lint(L, keys, D):
    W = []
    subs = [L[k]["sub"] for k in keys]; n = [len(strip(t)) for t in subs]; tot = sum(n) or 1
    t0 = [sum(n[:i]) / CPS for i in range(len(n))]; dur = tot / CPS
    pos = [sum(n[:i]) / tot for i in range(len(n))]          # 每句开头在全片的位置 0–1
    at = lambda i: f"第{i+1}句（约 {t0[i]:.0f} 秒）"
    # 4 入口卡
    miss = [k for k in ("situation", "tension", "essence", "decision") if not (D.get(k) or "").strip()]
    if miss: W.append("入口卡没填全：缺 " + "、".join(miss) + "（§2：处境 / 说不通 / 本质句 / 决策）。")
    ess = strip(D.get("essence") or "")
    if len(ess) > 30: W.append(f"essence（本质句）{len(ess)} 字，超过 30 字：要短到观众能原样转述。")
    # 6 证
    if len(subs) >= 3 and not re.search(PROOF, subs[1] + subs[2]): W.append("第 2–3 句里看不出硬证据（数字 / 案例 / 出处）：只有钩子没有证据，像标题党。")
    # 7 约
    head = [i for i in range(len(subs)) if t0[i] < 15]
    if not any(re.search(PROMISE, subs[i]) for i in head): W.append("前 15 秒没有预告答案（问句，或「建议 / 结论 / 判断 / 怎么看 / 到底 / 为什么」）：观众不知道听完能得到什么。")
    # 8 拉一把的间隔
    pull = [i for i, t in enumerate(subs) if re.search(ASK, t) or re.search(TURN, t) or re.search(FEEL_SUB, t) or re.search(NUM, t)]
    marks = [0.0] + [t0[i] for i in pull] + [dur]; idx = [0] + pull + [len(subs) - 1]
    for a, b, ia, ib in zip(marks, marks[1:], idx, idx[1:]):
        if b - a > PULL_GAP: W.append(f"{at(ia)} 到 {at(ib)} 之间约 {b - a:.0f} 秒没有「拉一把」（问句 / 转折 / 感觉句 / 带参照的数字）：中间插一句。")
    # 平铺：连续 4 句既不问也不转
    run = 0
    for i in range(len(subs)):
        run = 0 if (i in pull or t0[i] < 15) else run + 1   # 前 15 秒归开场规则管
        if run == 4: W.append(f"第{i-2}–{i+1}句连续 4 句平铺，没有问句、转折、感觉词或数字。")
    # 抽象推演：连续 40 秒以上没有数字（兰德那期 3:00–4:25 的跳过率高位段）
    a = None
    for i in range(len(subs) + 1):
        has = i < len(subs) and re.search(NUM, subs[i])
        if i < len(subs) and not has and a is None: a = i
        if (has or i == len(subs)) and a is not None:
            span = (t0[i] if i < len(subs) else dur) - t0[a]
            if span > 40: W.append(f"第{a+1}–{i}句约 {span:.0f} 秒没有一个数字：抽象推演太长，口播只说结论，链条交给画面。")
            a = None
    # 9 回钩
    mid = [i for i in range(len(subs)) if 0.35 <= pos[i] <= 0.6]
    if mid and not any(re.search(ASK, subs[i]) or re.search(TURN, subs[i]) for i in mid): W.append("片长 35%–60% 之间没有回钩（问句或转折）：中段最容易走神。")
    # 10 本质句的位置
    if ess:
        key = ess[:6]; hit = [i for i, t in enumerate(subs) if key in strip(t)]
        if not hit: W.append(f"口播里找不到本质句「{(D.get('essence') or '')[:16]}…」的开头六个字：本质句要原样说出来。")
        elif not any(0.55 <= pos[i] <= 0.85 for i in hit): W.append(f"本质句在{at(hit[0])}，位置 {pos[hit[0]]:.0%}：放到 55%–85% 之间，不要留到最后一句，也不要太早。")
    if not any(c.get("type") == "punch" for c in D.get("cards", [])): W.append("没有 punch 卡：本质句要单独一张卡。")
    # 11 落
    tail = [i for i in range(len(subs)) if pos[i] >= 0.8]
    if not any(re.search(WHO + "|企业|公司", subs[i]) for i in tail): W.append("最后 20% 没有「你 / 老板 / 企业」：缺决策桥接。")
    if subs and not re.search(r"[？?]", subs[-1]): W.append("最后一句不是问句：结尾留一个能用一个词或一个数回答的评论区问题。")
    # 12 口语
    for i, t in enumerate(subs):
        m = re.search(AI_WORDS, t)
        if m: W.append(f"第{i+1}句有书面套话「{m.group(0)}」：换成饭桌上会说的话。")
    long_ = [i + 1 for i, x in enumerate(n) if x > 45]
    if long_: W.append("单句超过 45 字：第 " + "、".join(map(str, long_)) + " 句。拆开，或把清单交给画面。")
    avg = tot / len(n)
    if avg > 30: W.append(f"全片平均句长 {avg:.0f} 字，超过 30 字。")
    # 13 时长
    if dur > 180:
        midp = [i for i in range(len(subs)) if 0.35 <= pos[i] <= 0.65]
        if not any(re.search(r"后面|接下来|最后|等一下|先说|再说|一会儿", subs[i]) for i in midp): W.append(f"估算时长约 {dur:.0f} 秒：中段（35%–65%）要再预告一次答案，别让观众自己拖进度条。")
        first90 = "".join(subs[i] for i in range(len(subs)) if t0[i] < 90)
        if len(re.findall(NUM, first90)) < 2: W.append("前 90 秒里带数字的句子太少：平均播放时长只有一分多钟，这段要讲完第一个完整的发现。")
    return W

if __name__ == "__main__":
    EP = os.path.abspath(sys.argv[1]); D = json.load(open(os.path.join(EP, "lines.json"), encoding="utf-8"))
    cut = set(D.get("cut", [])); keys = [k for k in D["lines"] if k not in cut]
    W = lint(D["lines"], keys, D)
    for x in W: print("留存提示：", x)
    print(f"留存体检：{len(W)} 条提示")
