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

# §2.6 感觉词（2026-11-08，视频号 81 条实测：有感觉词、无知识框架词的一组，播放中位 2016，3 秒划走 33%；
# 只有知识框架词的一组，播放中位 614，3 秒划走 47%）。词表从自己账号的爆款里来，可以往里加。
FEEL = ("危险|断裂|透支|焦虑|不确定|无限责任|至暗|生死|生存|活不|活下去|困|慌|颓|狂|输|苦|憋屈|委屈|累|怕|"
        "白干|白换|保不住|扛不住|撑不住|拖垮|拖下去|卡住|卡死|被卡|要命|吃亏|亏|赔|罚|多交|白交|踩雷|翻出来|查实|"
        "来不及|最后一年|到头|说变就变|说不清|对不上|难做|难熬|不再有人|落幕|心寒|睡不着|睡得着|没想到|明明|却|反而|偷偷")
WHO = r"你|老板|我们|咱们"
# 知识框架词：放在第 1 句 = 报题目（这组 3 秒划走 47%）。STRICT 在第 1 句直接报错；SOFT 只提示。
FRAME_STRICT = r"解读|研报|新规|范式|赛道|从哪里来|长坡厚雪|新范式|一文看懂|科普"
FRAME_SOFT = r"如何|路径|模式|机制|重构|榜单|[三四五六七八九十\d]+\s*(个|条|步|件)"
# 标签（§2.6.5）：主标签必带，冷门词和跑题词不用
TAG_MAIN = "#民营企业"
TAG_BAN = r"#(vibe知识大赏|Vibe知识大赏|Deepseek故障|朱婷|上热门|热搜)"
# 视频号短标题规则（与发布台 ~/publish-hub/hub.py 的 SPH_TITLE_OK / 6–16 字检查一致；不合格发布台会拒收）
SPH_TITLE_OK = set(" 《》“”‘’\"'：:+＋？?%％℃")

def lint_publish(D, first):
    """lines.json → publish：{"title": 短标题, "desc": 描述, "tags": [...]}。build 用它生成 发布文案.md。"""
    errs, warns = [], []
    P = D.get("publish")
    if not P:
        warns.append("缺 lines.json → publish（短标题 / 描述 / 标签，§2.6.4–5）：发布台会没有按规则写的发布文案。")
        return errs, warns
    t = (P.get("title") or "").strip()
    n = len(t)   # 发布台按原样计数（空格、问号都算）
    if not t: errs.append("publish.title 为空。")
    else:
        if n > 16: errs.append(f"publish.title {n} 字，超过 16 字（视频号短标题上限，发布台会拒收）。")
        if n < 6: errs.append(f"publish.title {n} 字，少于 6 字（发布台会拒收）。")
        badc = "".join(dict.fromkeys(ch for ch in t if not (ch.isalnum() or ch in SPH_TITLE_OK)))
        if badc: errs.append(f"publish.title 含视频号不允许的符号「{badc}」：逗号、顿号、句号都用空格代替（只允许《》“”：+？%）。")
        if re.search(FRAME_STRICT, t): errs.append(f"publish.title「{t}」用了知识框架词（解读/新规/赛道……）：标题写老板的处境或代价，不写知识点。")
        if not re.search(FEEL, t) and not re.search(r"[？?]", t): warns.append(f"publish.title「{t}」看不出感觉词，也不是问句；再检查一遍。")
    d = (P.get("desc") or "").strip()
    if not d: errs.append("publish.desc 为空：描述第一行就写开口句。")
    elif first and d.split("\n")[0][:8] != first[:8]: warns.append("publish.desc 第一行不是开口句：信息流只露这一行，直接用第 1 句。")
    tags = P.get("tags") or []
    if TAG_MAIN not in tags: errs.append(f"publish.tags 缺主标签 {TAG_MAIN}。")
    if not 3 <= len(tags) <= 4: warns.append(f"publish.tags {len(tags)} 个；固定 3–4 个（1 主 + 1 支柱 + 1–2 题）。")
    bad = [x for x in tags if re.search(TAG_BAN, x)]
    if bad: errs.append(f"publish.tags 有跑题标签：{'、'.join(bad)}。")
    return errs, warns

def lint(L, keys, D):
    errs, warns = [], []
    first = [L[k]["sub"] for k in keys[:2]]
    for i, t in enumerate(first):
        for rx, why in BAN:
            if re.search(rx, t): errs.append(f"第{i+1}句「{t[:24]}…」命中 {why}。开场必须直接给冲突/反常数字/具体场景，不许宣布「我要讲什么」。")
    n1 = len(re.sub(r"[，。？！、：；\s]", "", first[0]))
    if n1 > 30: errs.append(f"第1句 {n1} 字，太长（≤30 字，v2 语速下 ≈5 秒内必须抛出钩子）。")
    if not any(re.search(h, first[0]) for h in HOOK): warns.append("第1句看不出钩子特征（数字 / 提问 / 「你」/ 转折反常）；再检查一遍。")
    if not re.search(r"[？?]", "".join(first)) and not re.search(r"\d", "".join(first)): warns.append("前两句既没有问句也没有数字：先有一个观众答不上来的问题或一个说不通的数。")
    if re.search(FRAME_STRICT, first[0]): errs.append(f"第1句「{first[0][:24]}…」用了知识框架词（解读/新规/赛道/从哪里来……）＝报题目。第1句写老板的处境和代价，知识点放到第3句以后。")
    elif re.search(FRAME_SOFT, first[0]): warns.append(f"第1句「{first[0][:24]}…」有知识框架词（如何/模式/X个……），容易像课本开头；能改成处境句就改。")
    two = "".join(first)
    if not re.search(FEEL, two): warns.append("前两句没有感觉词（危险/白干/保不住/说不清/明明……却……，§2.6）：只有信息没有情绪，3 秒留不住人。")
    if not re.search(WHO, two): warns.append("前两句没有「你/老板/我们」：观众代入不进去。")
    pe, pw = lint_publish(D, first[0] if first else "")
    errs += pe; warns += pw
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
