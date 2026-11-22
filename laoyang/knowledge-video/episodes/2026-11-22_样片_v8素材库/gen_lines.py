"""深度 v8 · 10 秒样片「素材库镜头」（2026-11-22，老杨要求看效果，不发布）。
验证整条链：stock 关键词 → Mac 出片机用 Pixabay 免费 API 找镜头、下载 → 抽帧 → 渲染。
  k01 钩子卡 + bleed：港口夜景航拍铺满整屏（动态底图）
  k02 clip 视频镜头卡：集装箱吊装，16:9 镜头 + 一句字幕
数字出处：海关总署 11-10（前 10 个月出口 25.99 万亿元，同比 +17.6%），同 EP.31。
"""
import json

HG = "海关总署 11-10"
S = [
 ("c1", "前10个月，中国出口25.99万亿，增长17.6%。", "num"),
 ("c1", "港口一片火热，可很多工厂的利润，却越来越薄。", "turn"),
]
lines = {f"v{i+1:02d}": {"sec": sec, "sub": sub, "emo": emo} for i, (sec, sub, emo) in enumerate(S)}

cards = [
 {"id": "k01", "type": "hook", "at": "v01", "steps": ["v01|25.99万亿|s"],
  "data": {"kicker": "海关数据 · 前 10 个月", "lines": ["中国出口", {"t": "*25.99 万亿*", "s": 1}],
           "bleed": {"stock": {"q": "container port night aerial", "kind": "video"}, "dim": 0.8}}},
 {"id": "k02", "type": "clip", "rel": "场景", "at": "v02", "steps": ["v02|利润|s"],
  "data": {"eyebrow": "火的一边", "title": "港口*一片火热*", "frame": "wide",
           "stock": {"q": "container ship loading crane", "kind": "video"},
           "cap": {"t": "可工厂利润 *越来越薄*", "s": 1}, "src": HG}},
]

D = {
 "_说明": "深度 v8 · 10 秒样片：素材库镜头（Pixabay 关键词自动找）。不发布。",
 "v": 3, "style": "deep", "layout": "v8", "morph": True,
 "situation": "做国内生意的中下游老板", "tension": "出口火热，自己利润变薄",
 "essence": "样片", "decision": "样片", "payoff": "v02",
 "source": {"who": "海关总署", "org": ""},
 "series": {"title": "样片：素材库镜头", "sub": "v8 媒体层"},
 "frame": {"seriesLine": "样片：素材库镜头", "column": "LAOYANG CUBE / 企业经营观察", "ep": "SAMPLE v8"},
 "bgs": [{"file": "assets/bg_37404257.jpg", "url": "https://images.pexels.com/photos/37404257/pexels-photo-37404257.jpeg", "note": "Pexels #37404257（Pexels License，免费商用），同 EP.31", "dim": 1, "pos": "50% 50%"}],
 "voice": {"engine": "volc", "v": 3, "model": "expressive", "rate": 15, "takes": 2, "group": "line", "name": "老杨本人（火山引擎声音复刻 2.0 · 表现力增强版）"},
 "gapSec": 0.28, "secGap": 0.55,
 "bgm": {"synth": "pad", "src": "程序合成和声垫底（无版权）"}, "bgmUnder": 19,
 "fx": {"hits": [], "mist": 0.5}, "retain": {"maxGap": 7},
 "cover": {"topic": "样片", "title": "素材库<br>镜头样片", "en": "Stock footage sample", "sub": "v8 媒体层", "tag": "SAMPLE", "tag2": "样片"},
 "publish": {"title": "样片 不发布", "dy_title": "样片 不发布", "desc": "前10个月，中国出口25.99万亿，增长17.6%。\\n样片，不发布。", "tags": ["#民营企业", "#宏观经济", "#出口"]},
 "lines": lines, "cards": cards,
}
json.dump(D, open("lines.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(lines), "句", sum(len(v["sub"]) for v in lines.values()), "字", len(cards), "张卡")
