#!/usr/bin/env python3
"""离线占位配音（只用于排版预览）：按 4.6 字/秒生成静音 mp3 + 逐字时间戳。python3 core/fake_vo.py <期>
拿到真配音后用 gen_vo.py 覆盖。"""
import json, os, sys, subprocess, re
EP = os.path.abspath(sys.argv[1]); os.chdir(EP); os.makedirs("vo", exist_ok=True)
L = json.load(open("lines.json")); CPS = 4.6
for k, v in L["lines"].items():
    txt = v.get("tts", v["sub"]); t = 0.05; ws = []
    for ch in txt:
        if re.match(r"[，。、？！：；,.?!:; ]", ch): t += 0.18; continue
        ws.append({"w": ch, "s": round(t, 3), "e": round(t + 1 / CPS, 3)}); t += 1 / CPS
    d = round(t + 0.1, 2)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(d), f"vo/{k}.mp3"], check=True)
    json.dump(ws, open(f"vo/{k}.words.json", "w"), ensure_ascii=False); v["dur"] = d
json.dump(L, open("lines.json", "w"), ensure_ascii=False, indent=1); print("占位配音完成（静音）：", list(L["lines"]))
