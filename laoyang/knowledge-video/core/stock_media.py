#!/usr/bin/env python3
"""深度 v8：按关键词从免费素材库（Pixabay 优先，Pexels 备用）自动找图 / 找视频镜头，下载到媒体的 file 位置（不花钱）。
2026-11-21：Pexels 暂停发放新 API Key，改为优先用 Pixabay（PIXABAY_API_KEY，登录 pixabay.com/api/docs 页面就能看到；支持中文关键词）。
  python3 core/stock_media.py <期目录> [--dry]
卡片里写（photo / clip 的 data 里，或 data.bleed 里）：
  "stock": {"q": "container port night aerial", "kind": "video", "pick": 0}
    q     英文关键词（Pexels 用英文搜得最准）；写画面，别写抽象词
    kind  video / img（clip 卡、bleed 默认 video，photo 卡默认 img）
    pick  第几个结果（默认 0 = 最相关的那条）；不满意改成 1、2 重新出片
    orient 可选 portrait / landscape / square；不写时按 frame 自动选（bleed、tall 竖的，其他横的）
    min   视频至少几秒（默认 4）
密钥：Pexels 免费 API Key，写在 Mac 的 ~/laoyang-render/config.env：PEXELS_API_KEY=...（免费，每小时 200 次）
找到的素材存到 file（默认 assets/media/<卡id>.mp4|jpg），旁边写一个 .stock.json 记下 Pexels 编号、作者、原链接；
build 时自动把「Pexels · 作者」写进出处行，角标默认「示意」。已经下载过的不会重找（想换就删掉文件或改 pick）。
注意：2026-11-21 写成，云端连不上 Pexels，没有真机跑过；第一次先 --dry 看搜到了什么。
"""
import os, sys, json, urllib.request, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import media

def env():
    e = {}
    for p in [os.environ.get("MEDIA_ENV"), "~/laoyang-render/config.env", "~/weilanx-claude-videos/materials/老杨魔方知识分享版/tts.env"]:
        p = os.path.expanduser(p or "")
        if p and os.path.isfile(p):
            for ln in open(p, encoding="utf-8"):
                if "=" in ln and not ln.lstrip().startswith("#"): k, v = ln.split("=", 1); e.setdefault(k.strip(), v.strip())
    for k in ("PEXELS_API_KEY", "PIXABAY_API_KEY"):
        if os.environ.get(k): e[k] = os.environ[k]
    return e

def api(url, key):
    req = urllib.request.Request(url, headers={"Authorization": key, "User-Agent": "laoyang-render/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read())

def download(url, dst):
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=600) as r:
        open(dst + ".part", "wb").write(r.read())
    os.replace(dst + ".part", dst)

def best_file(files, orient):
    """挑 mp4：短边 >= 1080 里最小的那个（够清晰、文件不大）；没有就挑最大的"""
    mp4 = [f for f in files if f.get("file_type") == "video/mp4" and f.get("width") and f.get("height")]
    if not mp4: return None
    ok = sorted([f for f in mp4 if min(f["width"], f["height"]) >= 1080], key=lambda f: f["width"] * f["height"])
    return ok[0] if ok else max(mp4, key=lambda f: f["width"] * f["height"])

def pixabay(st, kind, orient, pick, key):
    """Pixabay：视频没有横竖筛选，自己按宽高挑；中文关键词自动用 lang=zh"""
    q = st["q"]; lang = "zh" if any("\u4e00" <= ch <= "\u9fff" for ch in q) else "en"
    base = "https://pixabay.com/api/videos/" if kind == "video" else "https://pixabay.com/api/"
    url = f"{base}?key={key}&q={urllib.parse.quote(q)}&lang={lang}&per_page=30&safesearch=true"
    if kind != "video": url += "&image_type=photo&orientation=" + ("vertical" if orient == "portrait" else "horizontal")
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "laoyang-render/1.0"}), timeout=60) as r: hits = json.loads(r.read()).get("hits", [])
    if kind == "video":
        def best(h):
            vs = [v for v in (h.get("videos") or {}).values() if v.get("url") and v.get("width")]
            ok = sorted([v for v in vs if min(v["width"], v["height"]) >= 1080], key=lambda v: v["width"] * v["height"])
            return ok[0] if ok else (max(vs, key=lambda v: v["width"] * v["height"]) if vs else None)
        cands = [(h, best(h)) for h in hits if h.get("duration", 0) >= float(st.get("min", 4))]
        cands = [(h, v) for h, v in cands if v]
        want = [(h, v) for h, v in cands if (v["height"] > v["width"]) == (orient == "portrait")] or cands
        if len(want) <= pick: raise RuntimeError(f"「{q}」只搜到 {len(want)} 条够长的视频")
        h, v = want[pick]
        return ({"site": "Pixabay", "id": h["id"], "page": h.get("pageURL"), "author": h.get("user", ""), "size": f"{v['width']}x{v['height']}",
                 "dur": h.get("duration"), "q": q, "pick": pick}, v["url"])
    if len(hits) <= pick: raise RuntimeError(f"「{q}」只搜到 {len(hits)} 张图")
    h = hits[pick]
    return ({"site": "Pixabay", "id": h["id"], "page": h.get("pageURL"), "author": h.get("user", ""), "size": f"{h.get('imageWidth')}x{h.get('imageHeight')}",
             "q": q, "pick": pick}, h.get("largeImageURL") or h.get("webformatURL"))


def main():
    ep = os.path.abspath(sys.argv[1]); dry = "--dry" in sys.argv
    D = json.load(open(os.path.join(ep, "lines.json"), encoding="utf-8"))
    todo = media.stocks(D)
    if not todo: print("这期没有素材库关键词"); return
    E = env(); key = E.get("PEXELS_API_KEY", ""); pkey = E.get("PIXABAY_API_KEY", "")
    done = fail = 0
    for f, kind, st, frame in todo:
        dst = os.path.join(ep, f)
        if os.path.exists(dst): print("已有", f); done += 1; continue
        orient = st.get("orient") or ("portrait" if frame in ("bleed", "tall") else "landscape")
        q = urllib.parse.quote(st["q"]); pick = int(st.get("pick", 0))
        if not key and not pkey: print("跳过（没有 PIXABAY_API_KEY / PEXELS_API_KEY）", f); fail += 1; continue
        try:
            if pkey:
                meta, link = pixabay(st, kind, orient, pick, pkey)
                print(f"{'将下载' if dry else '下载'} {'视频' if kind == 'video' else '图片'} {f} ← Pixabay {meta['id']}（{meta['author']}，{meta['size']}）{meta['page']}")
                if not dry: download(link, dst)
            elif kind == "video":
                r = api(f"https://api.pexels.com/videos/search?query={q}&orientation={orient}&per_page=15", key)
                cands = [v for v in r.get("videos", []) if v.get("duration", 0) >= float(st.get("min", 4))]
                if len(cands) <= pick: raise RuntimeError(f"「{st['q']}」只搜到 {len(cands)} 条够长的视频")
                v = cands[pick]; vf = best_file(v.get("video_files", []), orient)
                if not vf: raise RuntimeError("这条视频没有 mp4 文件")
                meta = {"site": "Pexels", "id": v["id"], "page": v.get("url"), "author": (v.get("user") or {}).get("name", ""),
                        "size": f"{vf['width']}x{vf['height']}", "dur": v.get("duration"), "q": st["q"], "pick": pick}
                print(f"{'将下载' if dry else '下载'} 视频 {f} ← Pexels {v['id']}（{meta['author']}，{meta['size']}，{meta['dur']}s）{meta['page']}")
                if not dry: download(vf["link"], dst)
            else:
                r = api(f"https://api.pexels.com/v1/search?query={q}&orientation={orient}&per_page=15", key)
                ph = r.get("photos", [])
                if len(ph) <= pick: raise RuntimeError(f"「{st['q']}」只搜到 {len(ph)} 张图")
                p = ph[pick]; src = (p.get("src") or {}).get("large2x") or (p.get("src") or {}).get("original")
                meta = {"site": "Pexels", "id": p["id"], "page": p.get("url"), "author": p.get("photographer", ""),
                        "size": f"{p.get('width')}x{p.get('height')}", "alt": p.get("alt", ""), "q": st["q"], "pick": pick}
                print(f"{'将下载' if dry else '下载'} 图片 {f} ← Pexels {p['id']}（{meta['author']}）{meta['page']}")
                if not dry: download(src, dst)
            if not dry:
                json.dump(meta, open(dst + ".stock.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1); done += 1
        except Exception as e:
            print("失败", f, e); fail += 1
    print(f"素材库镜头：{len(todo)} 个，成功 {done}，失败 / 跳过 {fail}")

if __name__ == "__main__":
    main()
