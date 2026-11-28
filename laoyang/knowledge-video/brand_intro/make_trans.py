#!/usr/bin/env python3
"""章节转场素材：把 Flowith 生成的转场镜头（竖屏、带原声）切成出片流程用的 1.4 秒素材。
  python3 make_trans.py 原片.mp4 <id> [中心秒]   → core/assets/trans/<id>.mp4，并登记进 manifest.json
中心秒不写时自动找画面最满（平均亮度最高）的那一刻；素材长 LEN 秒，最满的一刻放在 PEAK 秒（render 把它对准章节交界）。
调色和片头一致（降饱和、偏暖琥珀、暗角），颗粒在接片时加；声音拉到 −16 LUFS，build 再按人声定电平。"""
import sys, os, json, subprocess, re
SRC, ID = sys.argv[1], sys.argv[2]
LEN, PEAK = 1.4, 0.7
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.join(HERE, "..", "core", "assets", "trans")
GRADE = ("eq=saturation=0.86:contrast=1.08:brightness=-0.02,"
         "colorbalance=rs=0.04:gs=0.01:bs=-0.05:rm=0.03:bm=-0.04:rh=0.03:bh=-0.05,vignette=PI/5")
if len(sys.argv) > 3: c = float(sys.argv[3])
else:
    o = subprocess.run(["ffmpeg", "-i", SRC, "-vf", "fps=30,scale=108:192,signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"], capture_output=True, text=True).stderr
    y = [float(v) for v in re.findall(r"YAVG=([\d.]+)", o)]
    lo, hi = int(PEAK * 30), len(y) - int((LEN - PEAK) * 30)
    c = max(range(lo, max(lo + 1, hi)), key=lambda i: y[i]) / 30
a = max(0.0, c - PEAK)
os.makedirs(LIB, exist_ok=True); out = os.path.join(LIB, ID + ".mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", str(LEN), "-i", SRC,
                "-vf", f"fps=30,scale=1080:1920,{GRADE},format=yuv420p", "-af", "loudnorm=I=-16:TP=-1.5,aresample=48000",
                "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
mf = os.path.join(LIB, "manifest.json")
M = json.load(open(mf, encoding="utf-8")) if os.path.exists(mf) else {"说明": "章节转场镜头库（Flowith 生成，make_trans.py 切）：peak = 画面最满的时刻（对准章节交界），len = 素材长，lvl = 声音峰值窗相对人声 RMS 的 dB。", "items": []}
M["items"] = [it for it in M["items"] if it["id"] != ID] + [{"id": ID, "src": os.path.basename(SRC), "from": round(a, 3), "peak": PEAK, "len": LEN, "lvl": 0}]
json.dump(M, open(mf, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", out, "取自", round(a, 2), "–", round(a + LEN, 2), "s")
