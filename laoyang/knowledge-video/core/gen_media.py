#!/usr/bin/env python3
"""深度 v8：在 Mac 出片机上生成 lines.json 里写了 gen 的媒体（AI 生成图 / AI 生成视频镜头），存到 file 指定的位置。
  python3 core/gen_media.py <期目录> [--dry]
用的是火山方舟（Ark）：图片 Seedream，视频 Seedance。密钥和模型名写在 Mac 的 tts.env（或 config.env 的 MEDIA_ENV 指向的文件）：
  ARK_API_KEY=...                       必填，没有就跳过（成片里是占位画面，报告会写）
  ARK_IMAGE_MODEL=doubao-seedream-4-0-250828      可选
  ARK_VIDEO_MODEL=doubao-seedance-1-0-pro-250528  可选（想要更好的画面换 2.0 的模型名）
  ARK_VIDEO_RES=1080p                    可选
缓存：按「提示词 + 模型 + 比例 + 时长」算哈希，存在 ~/laoyang-render/媒体缓存/。改一期重新出片不会重复花钱。
注意：这个脚本没在真机上跑过（2026-11-21 写），第一次用先 --dry 看一遍要生成什么，再单独跑一期。
"""
import os, sys, json, time, hashlib, shutil, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import media
EP = os.path.abspath(sys.argv[1]); DRY = "--dry" in sys.argv
D = json.load(open(os.path.join(EP, "lines.json"), encoding="utf-8"))
BASE = "https://ark.cn-beijing.volces.com/api/v3"
STYLE = "，电影感，自然光，低饱和暖色调，画面干净，主体明确，无文字，无水印，无真实人物面孔特写"

def env():
    e = {}
    for p in [os.environ.get("MEDIA_ENV"), os.path.expanduser("~/laoyang-render/config.env"),
              os.path.expanduser("~/weilanx-claude-videos/materials/老杨魔方知识分享版/tts.env")]:
        if p and os.path.exists(os.path.expanduser(p)):
            for ln in open(os.path.expanduser(p), encoding="utf-8"):
                if "=" in ln and not ln.lstrip().startswith("#"): k, v = ln.split("=", 1); e.setdefault(k.strip(), v.strip())
    e.update({k: v for k, v in os.environ.items() if k.startswith("ARK_")})
    return e

def call(path, body=None, key=""):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", "Authorization": "Bearer " + key}, method="POST" if body is not None else "GET")
    with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read())

def download(url, dst):
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=300) as r: open(dst, "wb").write(r.read())

E = env(); KEY = E.get("ARK_API_KEY", "")
CACHE = os.path.expanduser("~/laoyang-render/媒体缓存"); os.makedirs(CACHE, exist_ok=True)
todo = media.gens(D); done = fail = 0
for f, kind, g, frame in todo:
    dst = os.path.join(EP, f)
    ratio = g.get("ratio") or ("9:16" if frame in ("bleed", "tall") else "16:9" if frame == "wide" else "4:3" if frame == "full" else "3:4")
    model = E.get("ARK_VIDEO_MODEL" if kind == "video" else "ARK_IMAGE_MODEL") or ("doubao-seedance-1-0-pro-250528" if kind == "video" else "doubao-seedream-4-0-250828")
    prompt = g["prompt"] + ("" if g.get("raw") else STYLE)
    dur = int(g.get("dur", 5))
    h = hashlib.sha1(json.dumps([prompt, model, ratio, dur if kind == "video" else 0], ensure_ascii=False).encode()).hexdigest()[:14]
    cached = os.path.join(CACHE, h + (".mp4" if kind == "video" else ".jpg"))
    if os.path.exists(cached):
        os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(cached, dst); print("缓存", f); done += 1; continue
    if DRY: print(f"要生成 {kind} {ratio} {dur if kind == 'video' else ''}s → {f}\n   {prompt}"); continue
    if not KEY: print("跳过（没有 ARK_API_KEY）", f); fail += 1; continue
    try:
        if kind == "img":
            size = {"9:16": "1440x2560", "16:9": "2560x1440", "4:3": "2304x1728", "3:4": "1728x2304"}.get(ratio, "2048x2048")
            r = call("/images/generations", {"model": model, "prompt": prompt, "size": size, "response_format": "url", "watermark": False}, KEY)
            download(r["data"][0]["url"], cached)
        else:
            r = call("/contents/generations/tasks", {"model": model, "content": [{"type": "text", "text": prompt}], "ratio": ratio,
                                                     "duration": dur, "resolution": E.get("ARK_VIDEO_RES", "1080p"), "watermark": False}, KEY)
            tid = r["id"]; t0 = time.time()
            while True:
                time.sleep(8); st = call(f"/contents/generations/tasks/{tid}", None, KEY)
                if st.get("status") == "succeeded": download(st["content"]["video_url"], cached); break   # 链接 24 小时过期，马上下载
                if st.get("status") in ("failed", "expired", "cancelled"): raise RuntimeError(f"任务 {st.get('status')}：{st.get('error')}")
                if time.time() - t0 > 900: raise RuntimeError("超过 15 分钟没生成完")
        os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(cached, dst); print("ok  ", f); done += 1
    except Exception as e:
        print("失败", f, e); fail += 1
print(f"AI 生成媒体：{len(todo)} 个，成功 {done}，失败 / 跳过 {fail}")
