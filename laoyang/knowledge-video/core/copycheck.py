#!/usr/bin/env python3
"""文案去 AI 味检查：python3 core/copycheck.py <期>   （查 lines.json 的口播、顶部金句、卡片文字）
规则来源：jiji262/humanizer-chinese（MIT，36 条中文 AI 写作模式，上游 blader/humanizer ← Wikipedia「Signs of AI writing」）
        KKKKhazix/human-writing「活人感写作」（MIT，成稿禁令）。按口播短视频裁剪，说明见 STANDARD「文案去 AI 味」。
硬伤（✗）必须改掉才能配音；提示（!）逐条看，确属必要可以保留。"""
import sys, os, re, json
EP = os.path.abspath(sys.argv[1]); D = json.load(open(os.path.join(EP, "lines.json"), encoding="utf-8"))
HARD = [
 ("翻案腔（先立一个没人有的误解再推翻）", r"不是[^，。？！；]{1,18}[，,]\s*(而)?是|并非.{1,18}而是|不在于.{1,18}而在于|与其说.{1,18}不如说|看似.{1,12}实则|表面.{1,12}实际|你以为.{1,18}其实|说到底|答案恰恰相反|不重要[，,]\s*重要的是|不只是.{1,12}更是|不仅仅是.{1,12}更是|与其.{1,15}不如|[，,]\s*而(不是|非)[^，。]{1,15}"),
 ("格言公式 / 假装直指本质", r"的尽头是|的本质是|真正的问题|真正的高手|核心在于|问题的关键|归根结底|究其根本|从本质上讲|才是真正的"),
 ("宏大开场", r"随着.{1,15}(发展|到来|普及)|在这个.{1,10}时代|在当今|浪潮之下|新时代"),
 ("万能升华 / 收尾套话", r"综上所述|总而言之|展望未来|未来可期|拭目以待|相信在不久的将来|这既是挑战|也是机遇"),
 ("讲义腔路标词", r"首先|其次|值得注意的是|值得一提的是|需要指出的是|不难发现|众所周知|毋庸置疑|由此可见|不可否认"),
 ("商业 / 模型黑话", r"赋能|抓手|闭环|底层逻辑|打造|构建|聚焦|洞察|引领|重塑|生态|格局|助力|彰显|凸显|至关重要|举足轻重|不可或缺|全方位|多维度|一站式|全链路|降本增效|颗粒度|长期主义|认知升级|护城河|破局|赛道|硬核|天花板"),
 ("洞察路标 / 口头禅", r"说白了|说穿了|先说结论|更微妙的是|还有一层|只说对了一半|从某种意义上说|划重点|敲黑板|讲真"),
 ("假互动 / 引流", r"你觉得呢|欢迎(在)?评论区|点赞|收藏|转发|关注|你有没有类似的经历|评论区告诉我|评论区|留言"),
 ("破折号", r"——|—|–"),
]
WARN = [
 ("对仗金句（两句同构，像要被截图）", r"([^，。；？！]{1,6})(决定|才是|就是|是|看)([^，。；？！]{2,12})[，；]\s*([^，。；？！]{1,6})\2"),
 ("「第一 / 第二 / 第三」编号腔", r"第[一二三][，,、]"),
 ("第一人称经历（必须是老杨本人确认过的事实）", r"我(做了|见过|经手|当年|那年|遇到过|帮.{1,6}做过)"),
 ("定义式翻案（X 不等于 Y / 真正的 X / X 并非）", r"不等于|真正的|并非"),
 ("没有出处的权威", r"有专家|业内人士|研究表明|数据显示|有观点认为|书里说|据说"),
 ("「N 个里只有 M 个」经验数钩子（换成一个真实案例或官方统计）", r"(\d+|[一二三四五六七八九十百千]+)(家|个|人|次).{0,10}(只有|只会|只能|最后|才有).{0,8}(\d+|[一两二三四五六七八九十]+)(家|个|人|次)"),
]
texts = [(k, v["sub"]) for k, v in D["lines"].items()] + [(f"金句{i+1}", h[1].replace("|", "／")) for i, h in enumerate(D.get("heads", []))]
def card_txt(c):
    out = []
    if isinstance(c, list): return [x.replace("*", "") for x in c if isinstance(x, str) and "|" not in x]   # 逐词说明 [词, 锚点]
    for k, v in c.items():
        if k in ("t", "type", "icon", "src") or k == "at" or k.endswith("At"): continue
        if isinstance(v, str): out.append(v.replace("*", ""))
        elif isinstance(v, dict): out += card_txt(v)
        elif isinstance(v, list): out += [x.replace("*", "") if isinstance(x, str) else " ".join(card_txt(x)) for x in v]
    return out
texts += [(f"卡{i+1}", " / ".join(card_txt(c))) for i, c in enumerate(D.get("cards", []))]
hard = warn = 0
for k, t in texts:
    for name, rx in HARD:
        for m in re.finditer(rx, t): hard += 1; print(f"✗ {k:6} {name}：…{t[max(0,m.start()-8):m.end()+8]}…")
    for name, rx in WARN:
        for m in re.finditer(rx, t): warn += 1; print(f"! {k:6} {name}：…{t[max(0,m.start()-8):m.end()+8]}…")
# 结构：三句以上连排超短句（造势）、通篇没有一个具体数字 / 名字 / 时间
subs = [v["sub"] for v in D["lines"].values()]
short = [i for i in range(len(subs) - 2) if all(len(re.sub(r"[，。？！：；“”]", "", subs[j])) <= 9 for j in range(i, i + 3))]
if short: warn += 1; print(f"! 结构   连续三句超短句造势：v{short[0]+1:02d} 起")
if not any(re.search(r"\d|[一二三四五六七八九十百千万亿]+(家|个|年|天|元|亿|万|%)", s) for s in subs): warn += 1; print("! 结构   通篇没有一个具体数字，检查材料是否够实")
print(f"\n硬伤 {hard} 处，提示 {warn} 处" + ("  → 硬伤清零前不配音" if hard else ""))
sys.exit(1 if hard else 0)
