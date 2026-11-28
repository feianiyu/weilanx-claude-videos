#!/usr/bin/env python3
"""老杨魔方 · 电影片头 v2：碎片四面飞来 → 拼成金属魔方世界 → 镜头冲进发光缝隙 → 金色雾里溶进正片钩子卡。
节奏：80 BPM（一拍 0.75s）。剪点 0.75 / 2.25；3.30 冲入；3.60 起 0.5s 溶进正片（正片 t=0 从 3.60 开始）。
声音：镜头自带的同步音效（碎片呼啸、金属咬合、穿越风声）为主，叠：反向吸气 → 低频重击 → 混响尾，全部无旋律、无电子叮当。
用法：python3 edit_v2.py A.mp4 B.mp4 [正片开头.mp4 正片开头音频.wav] out.mp4
"""
import sys, os, subprocess, wave, numpy as np
A, B = sys.argv[1], sys.argv[2]
EPV = sys.argv[3] if len(sys.argv) > 5 else None; EPA = sys.argv[4] if len(sys.argv) > 5 else None
OUT = sys.argv[-1]; D = os.path.dirname(os.path.abspath(OUT)) or "."
FPS, SR = 30, 48000
# (源, 起, 止, 速度) → 片头时间轴
SEG = [(A, 0.10, 1.30, 1.60),    # 0.00–0.75  碎片高速掠过（加速）
       (A, 1.45, 3.35, 1.27),    # 0.75–2.25  拼合、咬合、亮起
       (B, 2.20, 4.40, 1.333)]   # 2.25–3.90  魔方逼近 → 冲进缝隙 → 金色雾
XF_AT, XF = 3.60, 0.50           # 溶进正片
GRADE = ("eq=saturation=0.86:contrast=1.08:brightness=-0.02,"
         "colorbalance=rs=0.04:gs=0.01:bs=-0.05:rm=0.03:bm=-0.04:rh=0.03:bh=-0.05,"
         "vignette=PI/5,noise=alls=7:allf=t")

def run(*a): subprocess.run(list(a), check=True)
parts_v, parts_a = [], []
for i, (src, a, b, sp) in enumerate(SEG):
    v = f"{D}/_s{i}.mp4"
    run("ffmpeg", "-v", "error", "-y", "-ss", str(a), "-to", str(b), "-i", src,
        "-vf", f"setpts=PTS/{sp},fps={FPS},scale=1080:1920,{GRADE}", "-af", f"atempo={sp},aresample={SR}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-c:a", "pcm_s16le", v.replace(".mp4", ".mov"))
    parts_v.append(v.replace(".mp4", ".mov"))
# 硬切拼接（剪点即节拍）
lst = f"{D}/_list.txt"; open(lst, "w").write("".join(f"file '{p}'\n" for p in parts_v))
intro_raw = f"{D}/_intro_raw.mov"
run("ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", intro_raw)
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", intro_raw], capture_output=True, text=True).stdout)

# ---------- 声音 ----------
def load(f, ch=2):
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
    return x.reshape(-1, ch).copy()
nat = load(intro_raw)                                   # 镜头自带同步音效
T = (XF_AT + 7.0) if EPV else dur
N = int(T * SR); mix = np.zeros((N, 2), np.float32)
n0 = min(len(nat), N); g = np.ones(n0, np.float32); g[: int(0.75 * SR)] = 3.2; mix[:n0] += nat[:n0] * 1.6 * g[:, None]
R0 = np.random.default_rng(5)
R = np.random.default_rng(11)
def lp(x, fc):   # 一阶低通（足够做重击和混响的音色）
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s = a * s + (1 - a) * v; y[i] = s
    return y
def put(sig, at, g=1.0, pan=0.0):
    s = int(at * SR); e = min(N, s + len(sig))
    if e <= s: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[s:e, 0] += sig[:e - s] * g * l * 1.414; mix[s:e, 1] += sig[:e - s] * g * r * 1.414
def boom(d=2.4, f0=62, f1=31, k=1.6):          # 低频重击：下潜正弦 + 低通噪声冲击 + 饱和
    t = np.arange(int(d * SR)) / SR
    sub = np.sin(2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 6)) / SR) * np.exp(-t * k)
    thump = lp(R.standard_normal(len(t)).astype(np.float32), 180) * np.exp(-t * 14) * 6
    return np.tanh((sub + thump) * 1.6).astype(np.float32) * (1 - np.exp(-t * 600))
def tail(src, d=2.2):                           # 用镜头自身声音做混响尾（不引入新音色）
    ir = (R.standard_normal(int(d * SR)) * np.exp(-np.arange(int(d * SR)) / SR * 3.2)).astype(np.float32)
    ir = lp(ir, 2500) * 0.02
    return np.convolve(src, ir)[: len(src) + len(ir) // 2].astype(np.float32)
def suck(at_end, d=0.6):                        # 反向吸气：把镜头声音那一段反过来 + 混响，推向下一个重击
    s = max(0, int((at_end - d) * SR)); seg = nat[s:s + int(d * SR), 0].copy()
    if len(seg) < 100: return
    rev = tail(seg, 1.0)[::-1][-int(d * SR):] * np.linspace(0, 1, int(d * SR)) ** 2
    put(rev.astype(np.float32), at_end - d, 1.2)
BEAT1, BEAT2, DIVE = 0.75, 2.25, 3.30
# 开场即有声：低频隆隆声从第 0 帧涌起（低通噪声，无音高）
_t = np.arange(int(0.8 * SR)) / SR
_rum = lp(R0.standard_normal(len(_t)).astype(np.float32), 120) * 9 * np.clip(_t / 0.06, 0, 1) * (0.55 + 0.45 * _t / 0.8)
put(np.tanh(_rum).astype(np.float32), 0.0, 0.5)
suck(BEAT1, 0.45); put(boom(1.6, 70, 38, 2.4), BEAT1, 0.55)
suck(BEAT2, 0.7);  put(boom(2.6, 64, 30, 1.4), BEAT2, 0.95)
put(tail(nat[int(BEAT2 * SR): int((BEAT2 + .4) * SR), 0].copy(), 2.4), BEAT2, 1.0, -0.2)
put(boom(1.8, 55, 28, 1.8), DIVE, 0.6)
# 正片接入：交叉淡化
if EPA:
    ep = load(EPA); s = int(XF_AT * SR); e = min(N, s + len(ep))
    ramp = np.clip((np.arange(e - s) / SR) / XF, 0, 1)[:, None]
    mix[s:e] += ep[: e - s] * ramp
    k0, k1 = int(XF_AT * SR), int((XF_AT + XF + 0.6) * SR)
    fade = np.ones(N, np.float32); fade[k0:k1] = np.linspace(1, 0.0, k1 - k0); fade[k1:] = 0
    # 片头自带部分在溶入后退场（正片音频不受影响）
    intro_only = mix.copy(); intro_only[s:e] -= ep[: e - s] * ramp
    mix = intro_only * fade[:, None] + (mix - intro_only)
# 轻微立体加宽（Haas）+ 限幅
mix[:, 1] = np.concatenate([np.zeros(18, np.float32), mix[:-18, 1]]) * 0.6 + mix[:, 1] * 0.4
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.25) * 0.93
wav = f"{D}/_mix.wav"
with wave.open(wav, "wb") as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32767).astype(np.int16).tobytes())

# ---------- 画面：溶进正片 ----------
if EPV:
    vf = (f"[0:v]fps={FPS},format=yuv420p,setpts=PTS-STARTPTS[a];[1:v]fps={FPS},scale=1080:1920,format=yuv420p,setpts=PTS-STARTPTS[b];"
          f"[a]trim=0:{XF_AT + XF},setpts=PTS-STARTPTS[a2];[a2][b]xfade=transition=fade:duration={XF}:offset={XF_AT}[v]")
    run("ffmpeg", "-v", "error", "-y", "-i", intro_raw, "-i", EPV, "-i", wav, "-filter_complex", vf, "-map", "[v]", "-map", "2:a",
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-shortest", OUT)
else:
    run("ffmpeg", "-v", "error", "-y", "-i", intro_raw, "-i", wav, "-map", "0:v", "-map", "1:a",
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-shortest", OUT)
print("ok", OUT, "片头", round(dur, 2), "s")
