#!/usr/bin/env python3
"""没有词级时间戳的配音（火山引擎复刻音色、CosyVoice 等）→ 按字估时间，生成 vo/<句>.words.json。
用法：python3 core/align_chars.py <期目录> [v02 v05 ...]
做法：静音检测找停顿 → 按标点把句子切成短语，最长的 N-1 个停顿当短语边界 → 短语内按字数均分。
误差一般在 0.1–0.2 秒，足够画面锚点和字幕切屏用；需要更准时用 whisper 词级对齐替换。"""
import json, os, re, subprocess, sys
import numpy as np

EP = os.path.abspath(sys.argv[1]); os.chdir(EP)
L = json.load(open("lines.json", encoding="utf-8")); keys = sys.argv[2:] or list(L["lines"])
PU = "，。、？！：；,.?!:;"
HOP = 0.01

def pcm(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768

def voiced(x):
    n = int(16000 * HOP); fr = x[: len(x) // n * n].reshape(-1, n)
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
    thr = max(db.max() - 38, np.percentile(db, 20) + 6)
    v = db > thr
    # 填掉 <60ms 的小缝，去掉 <40ms 的毛刺
    def runs(b):
        out = []; i = 0
        while i < len(b):
            j = i
            while j < len(b) and b[j] == b[i]: j += 1
            out.append((b[i], i, j)); i = j
        return out
    for val, i, j in runs(v):
        if not val and (j - i) < 6 and i > 0 and j < len(v): v[i:j] = True
    for val, i, j in runs(v):
        if val and (j - i) < 4: v[i:j] = False
    segs = [(i * HOP, j * HOP) for val, i, j in runs(v) if val]
    return segs

def weight(c): return 0.5 if c.isascii() else 1.0

TEMPO = float(L.get("voice", {}).get("tempo", 1.0))   # 整体提速（音调不变）：原始配音放 vo_raw/，提速后写 vo/
if TEMPO != 1.0:
    os.makedirs("vo_raw", exist_ok=True)
    for k in keys:
        if not os.path.exists(f"vo_raw/{k}.mp3"): os.replace(f"vo/{k}.mp3", f"vo_raw/{k}.mp3")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"vo_raw/{k}.mp3", "-filter:a", f"atempo={TEMPO}", "-ar", "24000", "-b:a", "128k", f"vo/{k}.mp3"], check=True)
    print(f"提速 ×{TEMPO}")

for k in keys:
    txt =L["lines"][k].get("tts", L["lines"][k]["sub"]).replace("关注老杨魔方，", "").replace("关注老杨魔方", "")
    segs = voiced(pcm(f"vo/{k}.mp3"))
    if not segs: raise SystemExit(f"{k}: 没检测到人声")
    # 短语（标点分隔，丢掉空的）
    phrases = [p for p in re.split(f"[{re.escape(PU)}]", txt) if p.strip()]
    gaps = [(segs[i + 1][0] - segs[i][1], segs[i][1], segs[i + 1][0]) for i in range(len(segs) - 1)]
    need = len(phrases) - 1
    cut = sorted(sorted(gaps, reverse=True)[:need], key=lambda g: g[1])
    # 停顿不够：把短语按字数合并成可用段数
    if len(cut) < need:
        P = len(cut) + 1; tot = sum(len(p) for p in phrases); merged = [""] * P; acc = 0
        for p in phrases:
            idx = min(P - 1, int(acc / tot * P)); merged[idx] += p; acc += len(p)
        phrases = [p for p in merged if p] or ["".join(phrases)]
        cut = cut[: len(phrases) - 1]
    bounds = [segs[0][0]] + [x for g in cut for x in (g[1], g[2])] + [segs[-1][1]]
    words = []
    for pi, p in enumerate(phrases):
        a, b = bounds[2 * pi], bounds[2 * pi + 1]
        # 只在这个区间里的发声段上分配（跳过短语内部的小停顿）
        inner = [(max(a, s), min(b, e)) for s, e in segs if e > a and s < b]
        vt = sum(e - s for s, e in inner) or (b - a); inner = inner or [(a, b)]
        W = sum(weight(c) for c in p if not c.isspace()); acc = 0.0
        def at(frac):   # 发声时间的比例 → 实际时间
            t = frac * vt
            for s, e in inner:
                if t <= e - s: return s + t
                t -= e - s
            return inner[-1][1]
        for c in p:
            if c.isspace(): continue
            s = at(acc / W); acc += weight(c); e = at(acc / W)
            words.append({"w": c, "s": round(s, 3), "e": round(e, 3)})
    json.dump(words, open(f"vo/{k}.words.json", "w"), ensure_ascii=False)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"vo/{k}.mp3"], capture_output=True, text=True).stdout)
    L["lines"][k]["dur"] = round(d, 2)
    print(f"{k} {d:5.2f}s 短语{len(phrases)} 停顿{len(gaps)} 人声 {segs[0][0]:.2f}–{segs[-1][1]:.2f}")
json.dump(L, open("lines.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
