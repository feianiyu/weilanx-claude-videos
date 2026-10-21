#!/usr/bin/env python3
"""老杨魔方 · 知识分享版（有旁白）构建：时间轴、词级锚点、字幕、混音 → <期>/build/index.html + preview.html
定稿基准：《规划院转型》V2.3（2026-10-21）
Usage: python3 core/build.py episodes/<期目录>"""
import json, re, subprocess, base64, os, wave, shutil, sys
import numpy as np

CORE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else sys.exit("usage: build.py episodes/<期目录>")
os.chdir(EP)
MISSING = []
REGRESS = os.environ.get("LY_REGRESS") == "1"   # 回归测试：占位底图 + 全部静音，保证任何机器上画面一致
SR = 48000
LEAD, TAIL = 0.4, 2.6          # v2.2：结尾停 2.6s（logo 描线收尾）
D = json.load(open("lines.json"))
L = D["lines"]; CUT = set(D.get("cut", []))
GAP = D.get("gapSec", 0.3); SECGAP = D.get("secGap", 0.6)
keys = [k for k in L if k not in CUT]
BGM = D["bgm"]["file"] if isinstance(D.get("bgm"), dict) else D.get("bgm")

# ---------- timeline（v2.1：章节首句起点吸附到 BGM 拍点；restBefore 句前多留一拍静止） ----------
BEAT = D.get("beat"); REST = D.get("restBefore")
def snap(t, lo):
    if not BEAT: return t
    p, b0 = BEAT["period"], BEAT["t0"]
    n = round((t - b0) / p); c = b0 + n * p
    while c < lo: c += p
    return c
t = LEAD; tl = {}; prev = None
for k in keys:
    if prev:
        if L[prev]["sec"] != L[k]["sec"]:
            lo = t + 0.12; t = snap(t + SECGAP, lo)
            if k == REST: t = snap(t + BEAT["period"], t + BEAT["period"] - 0.01)
        else: t += GAP
    elif BEAT: t = snap(t, t)
    tl[k] = (round(t, 3), round(t + L[k]["dur"], 3)); t += L[k]["dur"]; prev = k
DUR = round(t + TAIL, 3)
# v2.2：BGM 从曲中某处起播，使 restBefore 句起点正好落在曲子的乐句线（高潮段）上
BGM_OFF = 0.0
if BEAT and D.get("bgmSection") is not None and REST:
    BGM_OFF = round(D["bgmSection"] - tl[REST][0], 4)
    BEAT = dict(BEAT, t0=round(tl[REST][0] % BEAT["period"], 4), bgmOffset=BGM_OFF)

words = {k: json.load(open(f"vo/{k}.words.json")) for k in keys}
PUNCT = re.compile(r"[，。、？！：；“”‘’（）·,.?!:;\"'\s]")

def anchor(spec):
    parts = spec.split("|"); k, w = parts[0], PUNCT.sub("", parts[1])
    edge, off = "s", 0.0
    for x in parts[2:]:
        if x[:1] in "+-": off = float(x)
        else: edge = x
    ws = words[k]; cat = ""; spans = []
    for i, x in enumerate(ws):
        if x["w"] and PUNCT.sub("", x["w"]) == "" : continue
        txt = PUNCT.sub("", x["w"]); spans.append((len(cat), len(cat) + len(txt), i)); cat += txt
    idx = cat.find(w)
    if idx < 0:
        raise SystemExit(f"anchor not found: {spec} in '{cat}'")
    ci = idx if edge == "s" else idx + len(w) - 1
    for a, b, i in spans:
        if a <= ci < b:
            return round(tl[k][0] + (ws[i]["s"] if edge == "s" else ws[i]["e"]) + off, 3)
    raise SystemExit("span " + spec)

CUBE = ('<g fill="none" stroke="#3EF09A" stroke-width="11.5"><polyline points="-29,-33 0,-50 29,-33"/><polyline points="-45,-24 0,2 45,-24"/>'
        '<polyline points="-41,-8 -41,24 -12,41"/><polyline points="41,-8 41,24 12,41"/></g><polygon points="-5.75,2 5.75,2 5.75,46.7 0,50 -5.75,46.7" fill="#3EF09A"/>')
shell = open(f"{CORE}/shell.html", encoding="utf-8").read()
# 片尾预告（可选，系列片用）：lines.json "endNext": "下期讲：怎么去" → 冒号前灰、冒号后橙
_en = D.get("endNext", "")
ENDNEXT_HTML = (_en.split("：", 1)[0] + "：<span style=\"color:var(--o)\">" + _en.split("：", 1)[1] + "</span>") if "：" in _en else _en
fx = open(f"{CORE}/fx.js", encoding="utf-8").read()
fxp = open(f"{CORE}/fx_particles.js", encoding="utf-8").read()
fxt = open(f"{CORE}/fx_text.js", encoding="utf-8").read()
ep_html = open("scenes.html", encoding="utf-8").read(); ep_js = open("scenes.js", encoding="utf-8").read()
ep_css = open("scenes.css", encoding="utf-8").read() if os.path.exists("scenes.css") else ""
last_sec = L[keys[-1]]["sec"]
tpl = (shell.replace("<!--@SCENES_HTML-->", ep_html).replace("//@PARTICLES", fxp).replace("//@TEXTFX", fxt).replace("//@FX", fx).replace("//@SCENES_JS", ep_js).replace("/*@EP_CSS*/", ep_css)
       .replace("__CUBE56__", f'<svg width="56" height="56" viewBox="-56 -56 112 112">{CUBE}</svg>').replace("__CUBEPATH__", CUBE)
       .replace("__ENDSEC__", last_sec).replace("__ENDNEXT__", ENDNEXT_HTML).replace("__T1__", D["series"]["title"]).replace("__T2__", D["series"]["sub"]))
SFXLIST = D.get("sfx", [])
# 锚点：scenes.js 里任何写成 'v07|词|s' 的字符串都算（包括写在数组里的），加上 scenes.html 的 data-at 和音效表
specs = set(re.findall(r"""['"](v\d{2,3}\|[^'"|]+\|[se](?:\|[+-][\d.]+)?)['"]""", ep_js)) | set(re.findall(r'data-(?:at|kf)="(v[^"]+)"', ep_html)) | {x[0] for x in SFXLIST} | {h[0] for h in D.get("heads", []) if h[0].startswith("v")}
A = {s: anchor(s) for s in sorted(specs)}

# sections (cards)
secs = []; order = []
for k in keys:
    if L[k]["sec"] not in order: order.append(L[k]["sec"])
for i, s in enumerate(order):
    first = next(k for k in keys if L[k]["sec"] == s)
    secs.append({"id": s, "start": 0.0 if i == 0 else tl[first][0]})
for i, s in enumerate(secs):
    s["end"] = secs[i + 1]["start"] if i + 1 < len(secs) else DUR
    s["last"] = i + 1 == len(secs)

def cw(x): return sum(0.55 if c.isascii() else 1 for c in x)
PU = "，、：；？！。"
def wbounds(k, txt):
    """词边界（在 txt 中的字符下标）+ 每个边界对应的词起始时间（相对句首）"""
    out = {}; pos = 0
    for x in words[k]:
        w = PUNCT.sub("", x["w"])
        if not w: continue
        while pos < len(txt) and PUNCT.match(txt[pos]): pos += 1
        if txt[pos:pos + len(w)] != w: break
        out[pos] = x["s"]; pos += len(w)
    return out
def split2(txt, wb):
    if cw(txt) <= 16: return [txt]
    best = None
    for i in range(1, len(txt)):
        a, b2 = txt[:i], txt[i:]
        if b2[0] in PU: continue
        if txt[i - 1] in PU: cost = 0
        elif i in wb and txt[i - 1] not in PU: cost = 6
        else: continue
        m = max(cw(a), cw(b2)); c = m + cost
        if best is None or c < best[0]: best = (c, i)
    if best is None:
        h = (len(txt) + 1) // 2; return [txt[:h], txt[h:]]
    return [txt[:best[1]], txt[best[1]:]]
subs = []
for k in keys:
    full = L[k]["sub"].rstrip("。"); wb = wbounds(k, full)
    import difflib
    tts_full = L[k].get("tts", full); ws_k = words[k]
    def stime(i):   # 字幕下标 → tts 字 → 词级时间（difflib 对齐，数字读法也能对上）
        a_ = PUNCT.sub("", full[:i]); A_ = PUNCT.sub("", full); B_ = "".join(PUNCT.sub("", x["w"]) for x in ws_k)
        sm = difflib.SequenceMatcher(None, A_, B_, autojunk=False); j = None
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if i1 <= len(a_) < i2 or (i1 == i2 == len(a_)):
                j = j1 + (len(a_) - i1 if tag == "equal" else 0); break
        if j is None: j = len(B_)
        # v2.2：edge-tts 的词是多字的，按字展开（字在词内按时长均分）
        ct = []
        for x in ws_k:
            w_ = PUNCT.sub("", x["w"])
            for m_ in range(len(w_)): ct.append(x["s"] + (x["e"] - x["s"]) * m_ / max(1, len(w_)))
        j = min(j, len(ct) - 1); return round(tl[k][0] + ct[j], 3)
    scr = L[k].get("screens")
    if scr:   # 手动分屏：["行1|行2", ...]，拼起来必须等于字幕原文（去掉句末句号）
        assert "".join(x.replace("|", "") for x in scr).rstrip("。") == full, (k, scr)
        cuts = []; pos = 0
        for x in scr[:-1]: pos += len(x.replace("|", "")); cuts.append(pos)
    else:
        cuts = []
        def rec(a, b):
            seg = full[a:b]
            if cw(seg) <= 30 and not (L[k].get("split2") and a == 0 and b == len(full)): return
            cand = [a + j + 1 for j, ch in enumerate(seg[:-1]) if ch in PU]
            if not cand: return
            mid = a + len(seg) / 2; i = min(cand, key=lambda j: abs(j - mid)); cuts.append(i); rec(a, i); rec(i, b)
        rec(0, len(full)); cuts.sort()
    bnd = [0] + cuts + [len(full)]; ts = [tl[k][0]] + [stime(i) for i in cuts] + [tl[k][1]]
    chunks = [(full[bnd[j]:bnd[j+1]], bnd[j], ts[j], (ts[j+1] - 0.1) if j + 1 < len(bnd) - 1 else ts[j+1]) for j in range(len(bnd) - 1)]
    manual = [x.rstrip("。") for x in scr] if scr else None
    for txt, off, s, e in chunks:
        wb2 = {p - off: v for p, v in wb.items() if p - off > 0}
        br = L[k].get("br")   # 可选：手动指定字幕换行处（只影响显示，不改文字）
        if manual: ln = [x for x in manual[[c[1] for c in chunks].index(off)].split("|") if x]
        else: ln = [txt[:txt.index(br) + len(br)], txt[txt.index(br) + len(br):]] if br and br in txt else split2(txt, wb2)
        w = max(cw(x) for x in ln)
        subs.append({"s": s, "e": e, "lines": ln, "fs": min(52, int(840 / w))})
for s in subs: print("SUB", s["fs"], " / ".join(s["lines"]))

# ---------- sfx（v2.2：采样音效库 + 自合成；data-sfx="kind" data-sfxoff=秒；音效的「冲击点」对齐到锚点） ----------
SFXLIB = D.get("sfxlib", {})
sfx = [{"t": round(A[at] + float(off), 3), "kind": kind} for at, kind, off in SFXLIST]
sfx.sort(key=lambda x: x["t"])
assert len(sfx) <= 20, (len(sfx), sfx)
# ---------- audio ----------
os.makedirs("build", exist_ok=True)
def load(path, sec=4.0):
    if REGRESS:
        return np.zeros(int(sec * SR), np.float32)
    if not os.path.exists(path):
        MISSING.append(path); print("!! 缺音频，用静音占位：", path); return np.zeros(int(sec * SR), np.float32)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
N = int(DUR * SR)
vo = np.zeros(N, np.float32)
for k in keys:
    a = load(f"vo/{k}.mp3", L[k]["dur"]); i = int(tl[k][0] * SR); vo[i:i + len(a)] += a[:N - i]

b = load(BGM, DUR + BGM_OFF + 5)[int(BGM_OFF * SR):]
xf = int(3 * SR)
while len(b) < N:
    ramp = np.linspace(0, 1, xf, dtype=np.float32)
    b = np.concatenate([b[:-xf], b[-xf:] * (1 - ramp) + b[:xf] * ramp, b[xf:]])
b = b[:N].copy()
fi, fo = int(1.5 * SR), int(2.5 * SR)
b[:fi] *= np.linspace(0, 1, fi); b[-fo:] *= np.linspace(1, 0, fo)
voiced = np.abs(vo) > 1e-4
speech = np.convolve(voiced.astype(np.float32), np.ones(int(.2 * SR)) / (.2 * SR), "same") > .05
def wrms(x, mask):
    w = int(.1 * SR); n = len(x) // w
    xs = x[:n * w].reshape(n, w); ms = mask[:n * w].reshape(n, w).mean(1) > .5
    return 20 * np.log10(np.sqrt((xs[ms] ** 2).mean()) + 1e-9)
target = wrms(vo, speech) - float(D.get('bgmUnder', 7.0))
g = float(np.clip(10 ** ((target - wrms(b, speech)) / 20), 0.03, 0.8)) if np.abs(b).max() > 0 else 0.0
bg = b * g
if REST and BEAT:   # 段落前收一拍：BGM 在 v09 前一拍淡到 0，v09 起点回来
    r1 = tl[REST][0]; r0 = r1 - BEAT["period"]; i0, i1 = int(r0 * SR), int(r1 * SR); fz = int(.06 * SR)
    env = np.ones(N, np.float32); env[i0:i1] = 0.0
    env[i0 - fz:i0] = np.linspace(1, 0, fz); env[i1:i1 + fz] = np.linspace(0, 1, fz); bg = bg * env

def tick():
    n = int(.03 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 220)).astype(np.float32) * 10 ** (-20 / 20)
def softpop():
    n = int(.12 * SR); tt = np.arange(n) / SR
    f = 520 * np.exp(-tt * 9); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-tt * 30) * (1 - np.exp(-tt * 900))).astype(np.float32) * 10 ** (-16 / 20)
def whoosh():   # 滤波噪声扫频 0.55s，-22dB
    n = int(.55 * SR); tt = np.arange(n) / SR; rng = np.random.default_rng(7)
    x = rng.standard_normal(n).astype(np.float32); env = np.sin(np.pi * np.clip(tt / .55, 0, 1)) ** 2
    fc = 300 + 3500 * (tt / .55) ** 1.5; y = np.zeros(n, np.float32); a = 0.0
    for i in range(n):
        k2 = 2 * np.pi * fc[i] / SR; a += k2 / (1 + k2) * (x[i] - a); y[i] = a
    y = y - np.convolve(y, np.ones(24) / 24, "same")
    return (y / (np.abs(y).max() + 1e-9) * env).astype(np.float32) * 10 ** (-22 / 20)
def glitch():  # 方波碎片 + 比特噪声 0.22s，-24dB
    n = int(.22 * SR); tt = np.arange(n) / SR; rng = np.random.default_rng(3)
    seg = (tt * 40).astype(int); f = np.array([180, 900, 420, 1600, 260, 1200, 600, 2000, 340])[seg % 9]
    sq = np.sign(np.sin(2 * np.pi * f * tt)) * (rng.random(n) > 0.15)
    nz = np.repeat(rng.standard_normal(n // 64 + 1), 64)[:n] * 0.6
    env = np.exp(-tt * 9) * (1 - np.exp(-tt * 800))
    return ((0.6 * sq + nz) * env).astype(np.float32) * 10 ** (-24 / 20)
SYN = {"tick": tick(), "softpop": softpop(), "whoosh": whoosh(), "glitch": glitch()}
vo_ref = wrms(vo, speech)
def peakwin(x):   # 50ms 窗最大 RMS（dB）
    w = int(.05 * SR); n = max(1, len(x) // w); xs = x[:n * w].reshape(n, w)
    return 20 * np.log10(np.sqrt((xs ** 2).mean(1)).max() + 1e-9)
SAMP = {}
for kind, cfg in SFXLIB.items():
    a = load(cfg["file"]); a0 = int(cfg.get("from", 0) * SR); a1 = int(cfg.get("to", len(a) / SR) * SR)
    a = a[a0:a1].copy(); fz = min(len(a) // 3, int(.12 * SR)); a[-fz:] *= np.linspace(1, 0, fz) ** 2
    if cfg.get("hp"):   # 一阶高通，去掉过多低频以免糊住人声
        k = np.exp(-2 * np.pi * cfg["hp"] / SR); y = np.zeros_like(a); prev = 0.0; px = 0.0
        for i in range(len(a)): prev = k * (prev + a[i] - px); px = a[i]; y[i] = prev
        a = y
    a = a * 10 ** ((vo_ref + cfg["lvl"] - peakwin(a)) / 20)    # 峰值窗 = 人声 RMS + lvl dB
    SAMP[kind] = (a.astype(np.float32), cfg.get("hit", 0.0) - cfg.get("from", 0))
fx = np.zeros(N, np.float32)
for e in sfx:
    if e["kind"] in SAMP: s_, hit = SAMP[e["kind"]]
    else: s_, hit = SYN[e["kind"]], 0.0
    i = int((e["t"] - hit) * SR); j0 = max(0, -i); i = max(0, i)
    seg = s_[j0:j0 + N - i]; fx[i:i + len(seg)] += seg
mix = vo + bg + fx
def write(path, x):
    x = np.clip(x, -1, 1); pcm = (x * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
write("build/mix_raw.wav", mix)
def lufs(path):
    out = subprocess.run(["ffmpeg", "-i", path, "-af", "ebur128=framelog=quiet:peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
gain_db = -14.0 - lufs("build/mix_raw.wav")
for _ in range(6):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "build/mix_raw.wav", "-af",
                    f"acompressor=threshold=-22dB:ratio=2.5:attack=5:release=120,volume={gain_db:.2f}dB,alimiter=limit=0.89:level=false",
                    "-ar", "48000", "-ac", "2", "build/mix.wav"], check=True)
    err = -14 - lufs("build/mix.wav")
    if abs(err) < 0.2: break
    gain_db += err * 1.1
LU = lufs("build/mix.wav")
print("LUFS", LU)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "build/mix.wav", "-b:a", "160k", "build/mix.m4a"], check=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "build/mix.wav", "-b:a", "128k", "build/mix.mp3"], check=True)

# ---------- 声波：按人声逐帧 RMS（30fps） ----------
FPS = 30; hop = SR // FPS; nf = int(DUR * FPS)
lv = []; cur = 0.0
for f in range(nf):
    seg = vo[f * hop:(f + 1) * hop]
    db = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9) if len(seg) else -90
    x = float(np.clip((db + 50) / 38, 0, 1))
    cur = cur + (x - cur) * (0.6 if x > cur else 0.25)
    lv.append(cur)
ALPH = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
wave_s = "".join(ALPH[int(round(v * 35))] for v in lv)

REST_D = {"sec": L[REST]["sec"], "t": tl[REST][0]} if REST else None
# v2 头条：[[章节id 或 锚点, "文字"]]，"|" 手动换行，*词* 白色强调；字号按最长一行自适应（≤92px，宽 ≤900px，最多 2 行）
def head_html(txt):
    lines_ = txt.split("|") if "|" in txt else [txt]
    if len(lines_) == 1 and cw(txt.replace("*", "")) > 9:
        cut = [i + 1 for i, ch in enumerate(txt[:-1]) if ch in "，、：；？！"]
        if cut:
            m = min(cut, key=lambda i: abs(cw(txt[:i].replace("*", "")) - cw(txt[i:].replace("*", ""))))
            lines_ = [txt[:m], txt[m:]]
    assert len(lines_) <= 2, ("头条最多两行", txt)
    fs = int(min(92, 900 / max(cw(x.replace("*", "")) for x in lines_)))
    esc = lambda x: re.sub(r"\*([^*]+)\*", r"<em>\1</em>", x.replace("&", "&amp;").replace("<", "&lt;"))
    return "<br>".join(esc(x) for x in lines_), fs
HEADS = []
for key, txt in D.get("heads", []):
    t_ = 0.0 if key == secs[0]["id"] else (next(s["start"] for s in secs if s["id"] == key) if not key.startswith("v") else A[key] - 0.15)
    h_, fs_ = head_html(txt); HEADS.append({"t": round(t_, 3), "html": h_, "fs": fs_, "src": txt})
HEADS.sort(key=lambda x: x["t"])
for h in HEADS: print("HEAD", h["t"], h["fs"], h["src"])
data = {"anchors": A, "secs": secs, "subs": subs, "dur": DUR, "wave": wave_s, "tl": tl, "beat": BEAT, "series": D["series"], "sfx": sfx,
        "progress": D["progress"], "transitions": D.get("transitions", {}), "rest": REST_D, "lastLine": keys[-1], "endNext": D.get("endNext", ""), "heads": HEADS}
meta = {"audio_missing": MISSING, "bgm_offset": BGM_OFF, "dur": DUR, "timeline": tl, "secs": secs, "sfx": sfx, "bgm_gain": g, "lufs": LU,
        "bgm_vs_vo_db": float(round(wrms(bg, speech) - wrms(vo, speech), 2)) if g else None}
json.dump(meta, open("build/meta.json", "w"), ensure_ascii=False, indent=1)

chars = "".join(sorted(set(re.sub(r"<[^>]+>", "", tpl) + ep_js + "".join(L[k]["sub"] for k in keys) + "0123456789.%：（）·＋…≠“”《》→—✕▶❚播放暂停" + D["series"]["title"] + D["series"]["sub"])))
open("build/chars.txt", "w").write(chars)
subprocess.run(["pyftsubset", f"{CORE}/assets/NotoSansSC.ttf", "--text-file=build/chars.txt",
                "--output-file=build/font.ttf", "--layout-features=*"], check=True)

dj = json.dumps(data, ensure_ascii=False)
for m in set(re.findall(r"__IMG:([\w.]+)__", tpl)):
    tpl = tpl.replace(f"__IMG:{m}__", "data:image/jpeg;base64," + base64.b64encode(open("assets/" + m, "rb").read()).decode())
BGP = D.get("bg", "assets/bg.jpg")
if REGRESS or not os.path.exists(BGP):
    if not REGRESS: MISSING.append(BGP); print("!! 缺底图，用占位色：", BGP)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x3a342b:s=1080x1920", "-frames:v", "1", "build/bg.jpg"], check=True)
else:
    shutil.copy(BGP, "build/bg.jpg")
cap = tpl.replace("__BG__", "bg.jpg").replace("__FONT__", "font.ttf").replace("__AUDIO__", "mix.m4a").replace("__DATA__", dj)
open("build/index.html", "w", encoding="utf-8").write(cap)
b64 = lambda p: base64.b64encode(open(p, "rb").read()).decode()
pre = tpl.replace("__BG__", "data:image/jpeg;base64," + b64("build/bg.jpg")).replace("__FONT__", "data:font/ttf;base64," + b64("build/font.ttf")) \
         .replace("__AUDIO__", "data:audio/mpeg;base64," + b64("build/mix.mp3")).replace("__DATA__", dj)
open("build/preview.html", "w", encoding="utf-8").write(pre)
print(json.dumps({k: meta[k] for k in ("dur", "bgm_gain", "bgm_vs_vo_db")}), "sfx", [(e["t"], e["kind"]) for e in sfx])
if MISSING: print(f"!! 有 {len(MISSING)} 个音频缺失（静音占位）——只能看画面，不能出成片。先运行 python3 core/fetch_assets.py {sys.argv[1]}")
