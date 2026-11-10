#!/usr/bin/env python3
"""EP.14《纯管理岗，正在消失》· 深度 v4 逻辑结构版样片。文案 2026-11-11 老杨确认，逐字冻结；改画面只改本文件的卡片部分。"""
import json
S = [
 ("c0","你公司里最先被AI替掉的，可能不是一线员工，是中间那层管理。","hook"),
 ("c0","这话不是我说的。OpenAI网站上，十月底发了一篇文章，两位作者写的，他们特意说明，是个人观点。","带点卖关子：先撇清“不是我说的”，再交代出处，语速稍快"),
 ("c0","他们的推测是：管理的活儿，大多在电脑上、在脑子里；一线的活儿，很多要碰真东西。","笃定地解释理由，两半句对照着说，前半句轻、后半句重"),
 ("c0","当然，他们也承认，AI到底会不会管人，现在还说不准。","坦诚地补一句，略放慢，带一点保留"),
 ("c1","但已经有公司先动手了。","话锋一转，干脆，带点紧迫感"),
 ("c1","Block今年二月，裁了差不多四成的人。Dorsey说，公司快还是慢，看信息怎么流。","num"),
 ("c1","Coinbase五月裁了百分之十四，CEO底下最多五层，纯管理的岗位不要了，带队的人，自己也得干活。","list"),
 ("c1","Xbox七月的内部信更直接：有的部门，一件事要过十四层管理。以后最多五层，能三层就三层。","说到“十四层”带点不可思议，后半句干脆利落"),
 ("c2","那AI进了公司，到底站在哪儿？文章推演了三个位置。","ask"),
 ("c2","第一种，在员工下面。每个人手底下，多一组AI帮着干活。组织图不用动，这最容易，现在就在发生。","story"),
 ("c2","第二种，在员工旁边。AI自己就是一个同事，甚至一整个团队，比如一个AI营销部。岗位要重新划。","story"),
 ("c2","第三种，最值得老板想一想：AI插在你和员工中间。","heavy"),
 ("c3","文章举了个例子。AI看了公司日常的沟通，发现销售已经答应了客户一个功能，可工程那边根本没在做。","讲故事的口气，说到“根本没在做”时带点替老板着急"),
 ("c3","它建议推迟上线，调几个工程师过去。","fact"),
 ("c3","它还发现，有个工程师悄悄搭好了一套关键工具，没人知道，建议老板认可他。","有点惊喜，像发现了一个宝，语气变暖"),
 ("c3","你想想，这些事，以前是谁在干？是中层。发现断点，协调资源，把下面的真实情况报上来。","aha"),
 ("c3","所以会出现两件相反的事：中间那层变薄了，老板反而看得更清楚，手里的权力也更集中了。","turn"),
 ("c4","哈佛商业评论九月有篇研究，看了沃尔玛、亚马逊这些公司。","fact"),
 ("c4","光让每个部门各自用AI还不够，难的是部门之间的取舍。","turn"),
 ("c4","他们管这叫AI编排：AI在部门之间传信息、算取舍，最后拍板的，还是人。","aha"),
 ("c5","管理学里早就说过，层级，本来就是为了处理信息才长出来的。","像讲一个老道理，娓娓道来"),
 ("c5","信息这件事AI能干了，层级就会变薄。","heavy"),
 ("c5","但也别急着砍人。Meta五月裁员，砍了不少经理，九月又在问一部分人，愿不愿意回去带团队。","turn"),
 ("c5","所以真正该问的，不是要不要中层，是每个管理岗位，到底在干什么。","把问题摆正，放慢，加重“到底在干什么”"),
 ("c5","如果主要是传话、催进度、汇总报表，这部分，AI会越做越好。","list"),
 ("c5","如果是解决没人能解的难题，对经营结果负责，这才是替不掉的。","heavy"),
 ("c5","以后的管理者，要么自己能打，要么能扛结果。只会传话的那一层，会最先变薄。","金句：一句一顿，越说越笃定，最后一句压低放慢"),
 ("c5","评论区说说，你们公司现在有几层？你觉得，哪一层最先变？","invite"),
]
lines = {f"v{i+1:02d}": {"sec": sec, "sub": sub, "emo": emo} for i, (sec, sub, emo) in enumerate(S)}

# ---------- 结构图：主图「组织图」 ----------
BOSS = {"id": "boss", "x": 460, "y": 60, "w": 240, "h": 84, "t": "老板"}
MGR = [{"id": f"m{i}", "x": x, "y": 270, "w": 200, "h": 80, "t": "中层"} for i, x in enumerate((160, 400, 640))]
FL = [{"id": f"f{i}", "x": x, "y": 480, "w": 108, "h": 80, "t": "一线"} for i, x in enumerate((100, 220, 340, 460, 580, 700))]
def org(s_mgr_dim=None, beneath=None, beside=None, between=None, all_on=False):
    nodes = [dict(BOSS, s=0)] + [dict(m, s=0, **({"dim": s_mgr_dim} if s_mgr_dim is not None else {})) for m in MGR] + [dict(f, s=0) for f in FL]
    edges = [{"a": "boss", "b": m["id"], "s": 0} for m in MGR] + [{"a": MGR[i // 2]["id"], "b": f["id"], "s": 0} for i, f in enumerate(FL)]
    tags, bands = [], []
    if beneath is not None:
        nodes += [{"id": f"ai{i}", "x": f["x"], "y": 600, "w": 100, "h": 52, "t": "", "kind": "ai", "s": beneath} for i, f in enumerate(FL)]
        tags.append({"x": 400, "y": 690, "t": "① 在下面：每人多一组 AI", "s": beneath})
    if beside is not None:
        nodes.append({"id": "mkt", "x": 838, "y": 480, "w": 150, "h": 110, "t": "AI", "n": "营销部", "kind": "ai", "s": beside})
        tags.append({"x": 838, "y": 390, "t": "② 在旁边", "s": beside})
    if between is not None:
        bands.append({"x": 46, "y": 228, "w": 828, "h": 84, "t": "AI：发现断点 · 协调 · 往上报", "s": between})
        tags.append({"x": 800, "y": 170, "t": "③ 在中间", "s": between})
    return nodes, edges, tags, bands

n6, e6, t6, b6 = org(s_mgr_dim=4, beneath=2, beside=3, between=4)
n10, e10, t10, b10 = org(s_mgr_dim=1, beneath=0, beside=0, between=1)
t10 = [x for x in t10 if "③" in x["t"]] + [{"x": 460, "y": 380, "t": "Meta：5 月减经理，9 月请回一部分", "s": 2, "kind": "sticker", "rot": -3}]
n13, e13, t13, b13 = org(s_mgr_dim=0, beneath=0, beside=0, between=0)

SRC_OAI = "OpenAI《The future of the firm》2026-10-28，Asirvatham & Mokski（作者声明：个人观点，不代表 OpenAI）"
cards = [
 {"id": "k01", "type": "hook", "at": "v01", "steps": ["v01|可能不是|s", "v01|中间|s"],
  "data": {"kicker": "先说结论", "lines": ["最先被AI替掉的", {"t": "可能不是一线", "s": 1}, {"t": "是*中间那层管理*", "s": 2}]}},
 {"id": "k02", "type": "text", "at": "v02", "steps": ["v02|十月底|s", "v02|个人观点|s"],
  "data": {"eyebrow": "OPENAI · THE FUTURE OF THE FIRM", "title": "OpenAI 网站上的一篇文章|作者特意说明：*个人观点*", "body": ["作者：Hemanth Asirvatham、Elliott Mokski", "发布：2026 年 10 月 28 日"], "src": SRC_OAI}},
 {"id": "k03", "type": "map", "at": "v03", "steps": ["v03|一线|s", "v04|承认|s"],
  "data": {"eyebrow": "他们的推测", "title": "为什么先轮到*管理*？", "W": 920, "H": 470,
   "nodes": [{"id": "a", "x": 230, "y": 150, "w": 400, "h": 130, "t": "管理的活儿", "n": "在电脑上、在脑子里", "kind": "hot", "s": 0},
             {"id": "b", "x": 690, "y": 150, "w": 400, "h": 130, "t": "一线的活儿", "n": "很多要碰真东西", "s": 1}],
   "tags": [{"x": 460, "y": 360, "t": "AI 会不会管人？作者也说：还说不准", "s": 2, "kind": "sticker", "rot": -2}], "src": SRC_OAI}},
 {"id": "k04", "type": "duo", "at": "v05", "steps": ["v06|二月|s", "v07|五月|s"],
  "data": {"eyebrow": "已经动手的公司", "title": "裁员，也在*拆层级*",
   "items": [{"label": "Block · 2026 年 2 月 · 裁员", "num": 40, "pct": "% 左右 · 约 4000 人", "s": 1},
             {"label": "Coinbase · 2026 年 5 月 · 裁员", "num": 14, "pct": "% · CEO 底下最多 5 层", "s": 2}],
   "src": "Block：CNN 2026-02-26；Coinbase：CEO Brian Armstrong 全员信，2026-05"}},
 {"id": "k05", "type": "stack", "at": "v08", "steps": ["v08|十四层|s", "v08|最多五层|s", "v08|能三层|s"],
  "data": {"eyebrow": "XBOX · CEO 内部信 · 2026-07-06", "title": "一件事要过几层管理？", "max": 14,
   "levels": [{"n": 14, "label": "有的部门：14 层", "s": 1}, {"n": 5, "label": "以后：最多 5 层", "s": 2}, {"n": 3, "label": "能 3 层就 3 层", "s": 3}],
   "src": "Xbox CEO Asha Sharma 内部信，2026-07-06"}},
 {"id": "k06", "type": "map", "at": "v09", "steps": ["v09|三个位置|s", "v10|下面|s", "v11|旁边|s", "v12|中间|s"],
  "data": {"eyebrow": "OPENAI 的推演", "title": "AI 进了公司，*站在哪儿*？", "W": 920, "H": 720,
   "nodes": n6, "edges": e6, "tags": t6, "bands": b6, "cams": [{"s": 4, "x": 460, "y": 300, "z": 1.1}], "src": SRC_OAI}},
 {"id": "k07", "type": "map", "at": "v13", "steps": ["v13|工程|s", "v14|推迟|s", "v15|悄悄|s", "v16|是中层|s"],
  "data": {"eyebrow": "文章里的例子", "title": "AI 插在中间，*它干了什么*", "W": 920, "H": 760,
   "nodes": [{"id": "boss", "x": 460, "y": 70, "w": 200, "t": "老板", "s": 2},
             {"id": "sale", "x": 200, "y": 250, "w": 200, "t": "销售", "s": 0},
             {"id": "cust", "x": 780, "y": 250, "w": 180, "t": "客户", "s": 0},
             {"id": "eng", "x": 200, "y": 480, "w": 200, "t": "工程", "s": 1},
             {"id": "ai", "x": 690, "y": 480, "w": 280, "h": 100, "t": "AI", "n": "看了日常沟通", "kind": "ai", "s": 2},
             {"id": "hero", "x": 500, "y": 680, "w": 360, "h": 100, "t": "一位工程师", "n": "悄悄搭好了关键工具", "s": 3, "hot": 3}],
   "edges": [{"a": "sale", "b": "cust", "s": 0, "label": "答应了一个功能", "lx": -100, "ly": -20},
             {"a": "sale", "b": "eng", "s": 1, "kind": "break", "label": "根本没在做", "lx": 26, "ly": 8},
             {"a": "eng", "b": "ai", "s": 2, "kind": "dash"},
             {"a": "ai", "b": "boss", "s": 2, "kind": "up", "via": "d", "label": "推迟上线 · 调人过去", "lx": 22, "ly": 62},
             {"a": "hero", "b": "ai", "s": 3, "kind": "flow", "via": "d", "label": "让老板看见", "lx": -170, "ly": 6}],
   "tags": [{"x": 150, "y": 610, "t": "发现断点", "s": 4, "kind": "sticker", "rot": -3},
            {"x": 820, "y": 600, "t": "协调资源", "s": 4, "kind": "sticker", "rot": 2},
            {"x": 760, "y": 120, "t": "往上报", "s": 4, "kind": "sticker", "rot": -2}],
   "src": SRC_OAI + "；例子为文中的情景推演"}},
 {"id": "k08", "type": "map", "at": "v17", "steps": ["v17|变薄|s", "v17|反而|s", "v17|集中|s"],
  "data": {"eyebrow": "两件相反的事", "title": "中间变薄，*上面变重*", "W": 920, "H": 560,
   "nodes": [{"id": "top", "x": 460, "y": 70, "w": 300, "h": 90, "t": "老板", "s": 0, "hot": 2},
             {"id": "mid", "x": 460, "y": 270, "w": 620, "h": 90, "t": "中间那层", "s": 0, "dim": 1},
             {"id": "low", "x": 460, "y": 470, "w": 760, "h": 80, "t": "一线", "s": 0}],
   "edges": [{"a": "low", "b": "top", "s": 2, "kind": "up", "via": "d", "noArrow": False, "label": "看得清、管得多", "lx": 24, "ly": -60}],
   "tags": [{"x": 760, "y": 205, "t": "变薄", "s": 1, "kind": "note"},
            {"x": 460, "y": 400, "t": "权力可能更集中", "s": 3, "kind": "sticker", "rot": -2}],
   "src": SRC_OAI}},
 {"id": "k09", "type": "map", "at": "v18", "steps": ["v19|取舍|s", "v20|编排|s", "v20|拍板|s"],
  "data": {"eyebrow": "HBR 2026-09 · 示意", "title": "难的是*部门之间*", "W": 920, "H": 740,
   "nodes": [{"id": "d1", "x": 160, "y": 560, "w": 210, "t": "供应链", "s": 0}, {"id": "d2", "x": 460, "y": 560, "w": 210, "t": "财务", "s": 0},
             {"id": "d3", "x": 760, "y": 560, "w": 210, "t": "采购", "s": 0},
             {"id": "a1", "x": 160, "y": 680, "w": 120, "h": 52, "t": "", "kind": "ai", "s": 0}, {"id": "a2", "x": 460, "y": 680, "w": 120, "h": 52, "t": "", "kind": "ai", "s": 0},
             {"id": "a3", "x": 760, "y": 680, "w": 120, "h": 52, "t": "", "kind": "ai", "s": 0},
             {"id": "orc", "x": 460, "y": 330, "w": 320, "h": 100, "t": "AI 编排", "n": "传信息 · 算取舍", "kind": "ai", "s": 2},
             {"id": "man", "x": 460, "y": 90, "w": 260, "t": "人：拍板", "kind": "hot", "s": 3}],
   "edges": [{"a": "d1", "b": "d2", "s": 1, "kind": "break", "label": "各算各的", "lx": -60, "ly": -22, "out": 2, "via": "h"},
             {"a": "d2", "b": "d3", "s": 1, "kind": "break", "out": 2, "via": "h"},
             {"a": "d1", "b": "orc", "s": 2, "kind": "flow", "via": "v"}, {"a": "d2", "b": "orc", "s": 2, "kind": "flow", "via": "v"},
             {"a": "d3", "b": "orc", "s": 2, "kind": "flow", "via": "v"}, {"a": "orc", "b": "man", "s": 3, "kind": "up", "via": "v"}],
   "tags": [{"x": 820, "y": 40, "t": "示意图", "s": 0, "kind": "note"}],
   "src": "Ferreira & Tong, How AI Agents Orchestrate Work Across Silos, HBR 2026-09（调研沃尔玛、亚马逊、爱立信、Ramp、美敦力）；图为示意"}},
 {"id": "k10", "type": "map", "at": "v21", "steps": ["v22|变薄|s", "v23|九月|s"],
  "data": {"eyebrow": "加尔布雷斯 · 1974", "title": "层级，是为*处理信息*长出来的", "W": 920, "H": 720,
   "nodes": n10, "edges": e10, "tags": t10, "bands": b10, "src": "Galbraith, Organization Design: An Information Processing View, 1974；Meta：Fortune 2026-09-12"}},
 {"id": "k11", "type": "map", "at": "v24", "steps": ["v25|传话|s", "v26|难题|s"],
  "data": {"eyebrow": "真正该问的", "title": "这个管理岗，*到底在干什么*", "W": 920, "H": 600,
   "nodes": [{"id": "r", "x": 460, "y": 70, "w": 240, "t": "管理岗", "s": 0},
             {"id": "L", "x": 230, "y": 300, "w": 380, "h": 130, "t": "传话 · 催进度", "n": "汇总报表", "s": 1, "dim": 2},
             {"id": "La", "x": 230, "y": 470, "w": 300, "h": 64, "t": "AI 越做越好", "kind": "ai", "s": 1},
             {"id": "R", "x": 690, "y": 300, "w": 380, "h": 130, "t": "解难题 · 扛结果", "n": "对经营结果负责", "s": 2, "hot": 2}],
   "edges": [{"a": "r", "b": "L", "s": 1}, {"a": "L", "b": "La", "s": 1, "kind": "dash"}, {"a": "r", "b": "R", "s": 2}],
   "tags": [{"x": 690, "y": 480, "t": "替不掉", "s": 2, "kind": "sticker", "rot": -3}]}},
 {"id": "k12", "type": "punch", "at": "v27", "steps": ["v27|只会传话|s"],
  "data": {"text": "以后的管理者|要么*自己能打*，要么*能扛结果*", "line": {"s": 1}}},
 {"id": "k13", "type": "map", "at": "v28", "steps": [],
  "data": {"eyebrow": "评论区", "title": "你们公司现在*有几层*？|哪一层*最先变*？", "W": 920, "H": 720,
   "nodes": n13, "edges": e13, "tags": t13, "bands": b13}},
]

D = {
 "_说明": "深度 v4 逻辑结构版样片（STANDARD_DEEP_V4.md）。文案 2026-11-11 老杨确认，逐字冻结；事实出处见 FACTS.md。",
 "v": 3, "style": "deep", "layout": "v4",
 "decision": "公司里每个管理岗位，主要是在传话协调，还是在解难题、对经营结果负责",
 "series": {"title": "纯管理岗，正在消失", "sub": "AI 进组织的三个位置"},
 "frame": {"seriesLine": "纯管理岗，正在消失", "column": "LAOYANG CUBE / 组织管理账", "ep": "EP.14"},
 "bgs": [{"file": "assets/bg.jpg", "url": "https://images.pexels.com/photos/34222005/pexels-photo-34222005.jpeg",
          "note": "Pexels #34222005《Automated Factory Conveyor System in Operation》Freek Wolsink（Pexels License，免费商用）原图 6000×4000，下原图不缩放", "dim": 1, "pos": "50% 50%"}],
 "voice": {"engine": "volc", "v": 3, "model": "expressive", "rate": 15, "takes": 2, "group": "line", "name": "老杨本人（火山引擎声音复刻 2.0 · 表现力增强版）"},
 "gapSec": 0.28, "secGap": 0.55,
 "bgm": {"synth": "pad", "src": "程序合成和声垫底（无版权）"}, "bgmUnder": 19,
 "fx": {"hits": []},
 "retain": {"maxGap": 7},
 "cover": {"topic": "管理岗", "title": "纯管理岗<br>正在消失", "en": "The End of Pure Management",
           "sub": "OpenAI 推演 AI 进组织的三个位置<br>Coinbase、Xbox 已把层级压到 5 层", "tag": "EP.14"},
 "publish": {"title": "纯管理岗 正在消失",
             "desc": "你公司里最先被AI替掉的，可能不是一线员工，是中间那层管理。OpenAI 网站上两位作者推演了 AI 进组织的三个位置；Block、Coinbase、Xbox 已经在拆层级。真正该问的是：每个管理岗位到底在干什么。 #民营企业 #企业管理 #人工智能 #组织管理",
             "tags": ["#民营企业", "#企业管理", "#人工智能", "#组织管理"]},
 "lines": lines, "cards": cards,
}
json.dump(D, open("lines.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(lines), "句", sum(len(v["sub"]) for v in lines.values()), "字", len(cards), "张卡")
