#!/usr/bin/env python3
"""下载不随仓库分发的素材到 <期>/：底图（Pexels）、BGM 和音效（Mixkit）。python3 core/fetch_assets.py <期>
原因：Pexels / Mixkit 许可允许在成片里用，但不允许把原始文件再分发，所以公开仓库只存下载地址。"""
import json, os, sys, urllib.request
EP = os.path.abspath(sys.argv[1]); os.chdir(EP); D = json.load(open("lines.json"))
items = []
if D.get("bgUrl"): items.append((D.get("bg", "assets/bg.jpg"), D["bgUrl"]))
items += [(b["file"], b["url"]) for b in D.get("bgs", []) if b.get("url")]   # 深度版：多张高清底图（下原图，不要带 ?w= 缩略参数）
if isinstance(D.get("bgm"), dict) and D["bgm"].get("url"): items.append((D["bgm"]["file"], D["bgm"]["url"]))
items += [(c["file"], c["url"]) for c in D.get("sfxlib", {}).values() if c.get("url")]
for f, u in items:
    sidecar = f + ".src"   # 记下载来源：同名文件但来源地址变了（换了底图）必须重新下载，否则会静默沿用上一期的旧图
    if os.path.exists(f) and (not os.path.exists(sidecar) or open(sidecar, encoding="utf-8").read().strip() == u):
        if not os.path.exists(sidecar): open(sidecar, "w", encoding="utf-8").write(u)
        print("已有", f); continue
    if os.path.exists(f): print("来源已变，重新下载", f)
    os.makedirs(os.path.dirname(f) or ".", exist_ok=True)
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        open(f, "wb").write(urllib.request.urlopen(req, timeout=60).read()); open(sidecar, "w", encoding="utf-8").write(u); print("ok  ", f)
    except Exception as e: print("失败", f, e, "\n     → 手动下载", u, "放到", f)
if D.get("bgNote"): print("底图说明：", D["bgNote"])
