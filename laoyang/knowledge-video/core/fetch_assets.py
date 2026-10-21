#!/usr/bin/env python3
"""下载不随仓库分发的素材到 <期>/：底图（Pexels）、BGM 和音效（Mixkit）。python3 core/fetch_assets.py <期>
原因：Pexels / Mixkit 许可允许在成片里用，但不允许把原始文件再分发，所以公开仓库只存下载地址。"""
import json, os, sys, urllib.request
EP = os.path.abspath(sys.argv[1]); os.chdir(EP); D = json.load(open("lines.json"))
items = []
if D.get("bgUrl"): items.append((D.get("bg", "assets/bg.jpg"), D["bgUrl"]))
if isinstance(D.get("bgm"), dict) and D["bgm"].get("url"): items.append((D["bgm"]["file"], D["bgm"]["url"]))
items += [(c["file"], c["url"]) for c in D.get("sfxlib", {}).values() if c.get("url")]
for f, u in items:
    if os.path.exists(f): print("已有", f); continue
    os.makedirs(os.path.dirname(f) or ".", exist_ok=True)
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        open(f, "wb").write(urllib.request.urlopen(req, timeout=60).read()); print("ok  ", f)
    except Exception as e: print("失败", f, e, "\n     → 手动下载", u, "放到", f)
if D.get("bgNote"): print("底图说明：", D["bgNote"])
