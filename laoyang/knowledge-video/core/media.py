#!/usr/bin/env python3
"""深度 v8 媒体层：build 时把 photo / clip 卡和 data.bleed 里的媒体整理好（STANDARD_DEEP_V8.md）。
  图片 → build/media/<id>.jpg（按需缩小）
  视频 → build/media/<id>/0001.jpg …（ffmpeg 按 30fps 抽帧，只抽这张卡在屏上那么长；网页按时间取帧，渲染是纯函数）
  缺文件 / 回归测试 → 占位（带「视频镜头占位：提示词」字样），排版照样能检查
媒体可以写在 data.media 里，也可以直接摊在 data 里（file / url / gen / credit / label / frame / kb / pan / in / rate / dim / look）。
"""
import os, json, glob, shutil, subprocess

MEDIA_KEYS = ("file", "url", "gen", "stock", "credit", "label", "frame", "kb", "pan", "in", "rate", "dim", "look", "kind")
VIDEO_EXT = (".mp4", ".mov", ".webm", ".m4v")


def _probe(f):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                        "-of", "json", f], capture_output=True, text=True).stdout
    j = json.loads(o or "{}"); s = (j.get("streams") or [{}])[0]
    return int(s.get("width", 0)), int(s.get("height", 0)), float((j.get("format") or {}).get("duration") or 0)


def _norm(raw, cid, default_kind):
    """把卡片里的媒体字段整理成一个 dict；返回 (m, 原始字段)"""
    m = dict(raw or {})
    gen = m.get("gen") or m.get("stock") or {}
    kind = m.get("kind") or (gen.get("kind") if gen else None)
    if not kind and m.get("file"): kind = "video" if m["file"].lower().endswith(VIDEO_EXT) else "img"
    if not kind and m.get("url"): kind = "video" if m["url"].split("?")[0].lower().endswith(VIDEO_EXT) else ("video" if default_kind == "video" and not gen else default_kind)
    kind = {"image": "img", "photo": "img", "img": "img", "video": "video", "clip": "video"}.get(kind or default_kind, default_kind)
    m["kind"] = kind
    m.setdefault("file", f"assets/media/{cid}." + ("mp4" if kind == "video" else "jpg"))
    return m


def prep(cdat, D, regress=False, dur=None):
    """就地改 cdat 里各卡的 data：加 media（前端用的字段）。返回 (有没有媒体, 提示列表, 缺的文件列表)"""
    os.makedirs("build/media", exist_ok=True)
    warn, missing, any_media = [], [], False
    clip_sec = 0.0
    for c in cdat:
        d = c["data"]; cid = c["id"]
        jobs = []
        if c["type"] in ("photo", "clip"):
            raw = d.get("media") or {k: d[k] for k in MEDIA_KEYS if k in d}
            d["media"] = _norm(raw, cid, "video" if c["type"] == "clip" else "img"); d["_id"] = cid
            jobs.append((d["media"], cid, "card"))
        if d.get("bleed"):
            d["bleed"] = _norm(d["bleed"], cid + "_bg", "video"); jobs.append((d["bleed"], cid + "_bg", "bleed"))
        if c["type"] == "play": any_media = True
        for m, mid, role in jobs:
            any_media = True
            sj = m["file"] + ".stock.json"   # stock_media.py 下载时记下的 Pexels 作者 → 自动进出处行
            if m.get("stock") and os.path.exists(sj) and not regress:
                sm = json.load(open(sj, encoding="utf-8")); m.setdefault("credit", f"{sm.get('site', 'Pexels')} · {sm.get('author', '')}".strip(" ·"))
            if m.get("stock") and not m.get("label"): m["label"] = "示意"
            if m.get("credit") and role == "card":   # 画面出处进出处行：卡片没写出处就用它；写了就接在后面
                if not d.get("src"): d["src"] = m["credit"]
                elif m["credit"] not in d["src"]: d["src"] = d["src"] + "；画面：" + m["credit"]
            fr = m.get("frame") or d.get("frame") or "full"
            m["fit"] = "contain" if fr == "doc" else "cover"
            span = c["t1"] - c["t0"] + 0.5
            if m["kind"] == "video": clip_sec += c["t1"] - c["t0"]
            f = m["file"]
            if regress or not os.path.exists(f):
                why = (m.get("gen") or {}).get("prompt") or (("素材库：" + m["stock"].get("q", "")) if m.get("stock") else "") or m.get("url") or f
                m["missing"] = why; m.pop("src", None)
                if not regress: missing.append(f); print(f"!! 缺媒体，用占位：{f}（{'AI 生成' if m.get('gen') else '素材库关键词' if m.get('stock') else '下载' if m.get('url') else '本地文件'}）")
                continue
            w, h, fdur = _probe(f)
            if not w: m["missing"] = f"打不开：{f}"; missing.append(f); print("!! 媒体打不开：", f); continue
            if m["kind"] == "img":
                k = min(1.0, (2400 if role == "bleed" else 1800) / max(w, h)); W, H = int(w * k) // 2 * 2, int(h * k) // 2 * 2
                dst = f"media/{mid}.jpg"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-vf", f"scale={W}:{H}", "-q:v", "2", "build/" + dst], check=True)
                m.update(src=dst, iw=W, ih=H)
                if role == "bleed" and min(W / 1080, H / 1920) < 0.9: warn.append(f"{cid} 的整屏底图只有 {w}×{h}，铺满竖屏会发糊")
            else:
                rate = float(m.get("rate", 1)); t_in = float(m.get("in", 0))
                k = min(1.0, max(1134 / w, 2016 / h) if role == "bleed" else 1000 / min(w, h))   # 只缩不放：铺满竖屏够用 / 卡片里短边 1000 够用
                W, H = int(w * k) // 2 * 2, int(h * k) // 2 * 2
                out = f"build/media/{mid}"; shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t_in:.3f}", "-i", f, "-t", f"{span:.3f}",
                                "-vf", f"setpts=PTS/{rate},fps=30,scale={W}:{H}", "-q:v", "3", f"{out}/%04d.jpg"], check=True)
                n = len(glob.glob(f"{out}/*.jpg"))
                m.update(dir=f"media/{mid}", n=n, iw=W, ih=H)
                if (fdur - t_in) / rate < span - 0.6: warn.append(f"{cid} 的视频只有 {(fdur - t_in) / rate:.1f}s，卡片在屏上 {span - 0.5:.1f}s：后面会停在最后一帧（慢推还在动）")
                print(f"视频镜头 {mid}：{w}×{h} → {W}×{H}，抽 {n} 帧")
    if dur and clip_sec > 0.3 * dur:
        warn.append(f"视频镜头合计 {clip_sec:.0f}s，超过全片的 30%：逻辑和数据仍要靠图讲，镜头只给开场、转场和讲故事的段落（V8 §1）")
    return any_media, warn, missing


def urls(D):
    """fetch_assets 用：所有要下载的媒体 [(file, url)]"""
    out = []
    for c in D.get("cards", []):
        d = c.get("data", {}); cid = c.get("id")
        if c.get("type") in ("photo", "clip"):
            m = _norm(d.get("media") or {k: d[k] for k in MEDIA_KEYS if k in d}, cid, "video" if c["type"] == "clip" else "img")
            if m.get("url") and not m.get("gen"): out.append((m["file"], m["url"]))
        if d.get("bleed"):
            m = _norm(d["bleed"], cid + "_bg", "video")
            if m.get("url") and not m.get("gen"): out.append((m["file"], m["url"]))
    return out


def gens(D):
    """gen_media 用：所有要 AI 生成的媒体 [(file, kind, gen)]"""
    out = []
    for c in D.get("cards", []):
        d = c.get("data", {}); cid = c.get("id")
        cand = []
        if c.get("type") in ("photo", "clip"): cand.append((d.get("media") or {k: d[k] for k in MEDIA_KEYS if k in d}, cid, "video" if c["type"] == "clip" else "img"))
        if d.get("bleed"): cand.append((d["bleed"], cid + "_bg", "video"))
        for raw, mid, dk in cand:
            m = _norm(raw, mid, dk)
            if m.get("gen"): out.append((m["file"], m["kind"], m["gen"], "bleed" if mid.endswith("_bg") else (m.get("frame") or d.get("frame") or "full")))
    return out


def stocks(D):
    """stock_media 用：所有写了素材库关键词的媒体 [(file, kind, stock, frame)]"""
    out = []
    for c in D.get("cards", []):
        d = c.get("data", {}); cid = c.get("id")
        cand = []
        if c.get("type") in ("photo", "clip"): cand.append((d.get("media") or {k: d[k] for k in MEDIA_KEYS if k in d}, cid, "video" if c["type"] == "clip" else "img"))
        if d.get("bleed"): cand.append((d["bleed"], cid + "_bg", "video"))
        for raw, mid, dk in cand:
            m = _norm(raw, mid, dk)
            if m.get("stock") and not m.get("gen"): out.append((m["file"], m["kind"], m["stock"], "bleed" if mid.endswith("_bg") else (m.get("frame") or d.get("frame") or "full")))
    return out
