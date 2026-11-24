#!/usr/bin/env python3
"""高留存脚本体检（留存六拍，STANDARD_RETENTION_SCRIPT.md §8 的软规则）。
build 在 lines.json 写了 "v" >= 3 时自动调用，只给提示，不拦出片；也可单独跑：python3 core/lint_retention.py <期目录>
位置按字数估算（配音前就能跑）：CPS 是口播每秒字数的估计值，只用来算「大约第几秒」。"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lint_opening import FEEL_SUB, WHO

CPS = 5.0          # 实测：EP.14 4.9、EP.15 5.4、EP.18 4.8 字/秒（去标点，含句间停顿）
PULL_GAP = 30.0    # 两次「拉一把」之间最多隔多少秒
LONG_SEC = 300.0   # 超过这个秒数按深度长视频再查一遍（STANDARD_DEEP_LONG.md）
PAYOFF_SEC = 60.0  # 干货最晚从第几秒开始（EP.26 平均播放 53 秒，v1.2）
SHAPE = r"[一二两三四五六七八九十几\d]\s*(类|档|层|件事|条|种|个信号|步|个问题|个变化|个坑|个办法|招)"
CHOICE = r"[A-DＡ-Ｄ][^A-Za-z]|还是|选哪|哪一类|哪一个|哪一条|打字母|打数字"
TURN = r"但|可是|可(?=[^以能见])|却|不过|其实|反而|偏偏|问题是|问题在|关键是|真正|没想到|然而|更[^，。]{0,6}的是"
ASK = r"[？?]|到底|为什么|凭什么|怎么会|怎么办|谁来|哪一"
PROMISE = ASK + r"|建议|结论|判断|怎么看|怎么研究|怎么应对|答案|警告|预言"
NUM = r"\d|[一二两三四五六七八九十百千万亿半]+多?(成|倍|个点|%|亿|万)|一半|翻了?一?倍|减半"
PROOF = r"\d|[一二两三四五六七八九十百千万亿]+(成|倍|个点|%)|《|报告|公告|通报|新闻稿|调查|数据|条文|判决|联合国|安理会|发布会|大会上|访谈|听证会|原话"
AI_WORDS = r"值得注意的是|综上所述|总而言之|不仅如此|与此同时|换句话说|从某种意义上|赋能|抓手|底层逻辑|深度解析|让我们"
FILLER = r"话不多说|废话不多说|进入正题|下面我们|下面来看|接下来我们|我们来看|我们先来|先来说说|开始之前|首先我们"   # v1.3 丝滑过渡：过渡句要带新悬念，不说空话
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
    # 16 预告提前（v1.3，Jenny Hoyos「钩子 3 秒 + 3–5 秒内说清结尾会发生什么」；我们按句算：第 3 句以内）
    if len(subs) >= 3 and not any(re.search(PROMISE, subs[i]) or re.search(SHAPE, subs[i]) for i in range(3)):
        W.append("前 3 句里没有预告（问句、「建议 / 答案 / 判断」，或「三类人」这种带数量的清单）：钩子之后要马上告诉观众结尾会拿到什么（§3.2）。")
    # 17 结尾不留空尾巴（v1.3）
    if float(D.get("tailSec", 2.6)) > 1.0:
        W.append(f"tailSec={D.get('tailSec', '未填（默认 2.6）')}：最后一句说完画面还停 1 秒以上，等于给观众划走的时间。lines.json 写 \"tailSec\": 0.8（§3.2）。")
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
    # 11b 评论区选择题（v1.2：EP.15、EP.26 开放式结尾评论率都只有 0.02%）
    if subs and not re.search(CHOICE, subs[-1]): W.append("最后一句不是选择题：写成「A … B … C …，评论区打字母」或「X 还是 Y？」，答一个字母比写一句话容易得多。")
    # 14 答案先行（v1.2：EP.26 平均只看 53 秒，「谁会多交」要到约 3 分钟才出来）
    first15 = "".join(subs[i] for i in head)
    if not re.search(SHAPE, first15): W.append("前 15 秒没有点出答案的形状（「三类人」「四件事」「两个信号」这种带数量的预告）：观众要先知道清单有几条，才会等。")
    pk = D.get("payoff")
    if not pk: W.append("没填 payoff（干货从第几句开始，比如对号入座的名单、给老板的几条）：填进 lines.json，体检才能算它出现得够不够早。")
    elif pk in keys:
        j = keys.index(pk)
        if t0[j] > PAYOFF_SEC: W.append(f"干货（payoff {pk}）在{at(j)}才开始：要在 {PAYOFF_SEC:.0f} 秒内开始给第一条。背景压到一两句，当证据用，或者挪到干货后面。")
        bg = [i for i in range(len(subs)) if t0[i] >= 15 and i < j]
        if len(bg) > 8: W.append(f"开场之后、干货之前有 {len(bg)} 句铺垫（第{bg[0]+1}–{bg[-1]+1}句）：超过 8 句，平均播放时长内观众拿不到干货。")
    # 12 口语
    for i, t in enumerate(subs):
        m = re.search(AI_WORDS, t)
        if m: W.append(f"第{i+1}句有书面套话「{m.group(0)}」：换成饭桌上会说的话。")
        m = re.search(FILLER, t)
        if m and i > 0: W.append(f"第{i+1}句「{m.group(0)}」是空过渡：换成一句带新悬念的承接，比如「所以他们干了一件更狠的事」（§3.2）。")
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
    # 15 深度长视频（v1，2026-11-20，EP.29 老杨反馈：开场慢、7 分钟沉闷）——超过 300 秒才查
    if dur > LONG_SEC:
        src = D.get("source") or {}
        who = src.get("who") if isinstance(src, dict) else None
        if who and not any(who in subs[i] for i in head[:2]): W.append(f"长片解读开场：前两句没点出「{who}」。第一句就说清谁、写了 / 说了什么，第二句给核心观点（STANDARD_DEEP_LONG §2）。")
        cards = D.get("cards") or []
        chap = [c for c in cards if c.get("rel") == "章节"]
        if len(chap) < 3: W.append(f"长片只有 {len(chap)} 张章节卡：{dur / 60:.0f} 分钟要分 3–5 章，每章用一张 fxtext 章节卡开头，观众知道自己在第几章、还剩几章（§3）。")
        ci = {c["at"] for c in chap}
        for c in chap:
            j = keys.index(c["at"]) if c["at"] in keys else -1
            if j > 0 and not re.search(r"[？?]|下一|接下来|更关键|最后|还有|而且更", subs[j - 1]): W.append(f"章节卡 {c['id']} 前一句没有「钩下一章」（预告 / 问句）：章与章之间最容易流失（§3）。")
        short = [i + 1 for i in range(len(subs)) if n[i] < 8 and t0[i] < dur * 0.3]
        if len(short) > 2: W.append(f"前 30% 有 {len(short)} 句不到 8 个字（第{'、'.join(map(str, short[:6]))}句）：碎句加停顿会显得慢，并到相邻句里（§4）。")
        pause = [i + 1 for i in range(len(subs)) if t0[i] < 20 and re.search(r"一顿|(?<!不)放慢|留白", str(L[keys[i]].get('emo', '')))]
        if pause: W.append(f"开场 20 秒内第{'、'.join(map(str, pause))}句的语气写了放慢 / 一顿：开场要利落，慢读留给本质句（§4）。")
    return W

if __name__ == "__main__":
    EP = os.path.abspath(sys.argv[1]); D = json.load(open(os.path.join(EP, "lines.json"), encoding="utf-8"))
    cut = set(D.get("cut", [])); keys = [k for k in D["lines"] if k not in cut]
    W = lint(D["lines"], keys, D)
    for x in W: print("留存提示：", x)
    print(f"留存体检：{len(W)} 条提示")
