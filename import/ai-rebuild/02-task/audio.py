"""AI 重构 02「任务」完整版配乐（32 秒）：120 BPM，D 小调。4 秒鼓进、4/5/6/7 秒每拍一刀、7.5 抽空、8 秒 drop、12–19.5 数据段（14、16 两声重音）、19.5 抽空、20 秒 drop、22/24/26 三步、28 尾声。"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from scipy import signal
from scipy.io import wavfile

# 与 timeline.ts 的 HITS 一致（scene.js 的 HITS 必须相同）
HITS0 = {"kick": 4.0, "squeeze": 8.0, "gap": 9.5, "drop": 10.0, "split": 16.0, "brk": 24.0,
        "ships": 25.0, "officials": 26.5, "build": 30.0, "gap2": 31.5, "drop2": 32.0, "outro": 38.0}

SR = 44100
DUR = 32.0
BEAT = 0.5
N = int(SR * DUR)
rng = np.random.default_rng(202)
L = np.zeros(N); R = np.zeros(N)
SC = np.ones(N)  # 侧链增益（底鼓处下压）


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(x, t0, gain=1.0, pan=0.0, side=False):
    i = int(round(t0 * SR))
    if i >= N or i < 0:
        return
    x = x[: N - i]
    if side:
        x = x * SC[i:i + len(x)]
    gl = gain * np.cos((pan + 1) * np.pi / 4)
    gr = gain * np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * gl
    R[i:i + len(x)] += x * gr


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=2):
    b, a = signal.butter(order, min(0.99, f / (SR / 2)), "low")
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, min(0.99, f / (SR / 2)), "high")
    return signal.lfilter(b, a, x)


def bp(x, f0, f1, order=2):
    b, a = signal.butter(order, [f0 / (SR / 2), min(0.99, f1 / (SR / 2))], "band")
    return signal.lfilter(b, a, x)


def saw(f, d, phase=0.0):
    return 2 * ((f * tt(d) + phase) % 1) - 1


def supersaw(f, d, voices=7, det=0.012):
    out = np.zeros(int(d * SR))
    for k in range(voices):
        dd = (k - (voices - 1) / 2) / ((voices - 1) / 2) * det
        out += saw(f * (1 + dd), d, rng.random())
    return out / voices


def within(t, *wins):
    return any(a <= t < b for a, b in wins)


# ───────── 鼓与音效元件 ─────────
def kick(v=1.0):
    t = tt(0.42)
    ph = 2 * np.pi * np.cumsum(46 + 120 * np.exp(-t * 28)) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) * 0.35
    return np.tanh((body + click) * 1.6) * v


def hat(d=0.04, v=0.25, open_=False):
    t = tt(0.22 if open_ else d)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (14 if open_ else 90)) * v


def clap(v=0.5):
    t = tt(0.3)
    n = bp(rng.standard_normal(len(t)), 900, 3500)
    env = np.zeros(len(t))
    for k, o in enumerate([0, 0.011, 0.022]):
        i = int(o * SR)
        env[i:] += np.exp(-np.arange(len(t) - i) / SR * (60 if k < 2 else 18))
    return (n * env + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.3) * v


def tick(v=0.18):
    t = tt(0.05)
    return np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 160) * v


def boom(d=2.2, v=1.0):
    t = tt(d)
    b = np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.2)
    crash = hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 2.5) * 0.4
    return (np.tanh(b * 1.4) + crash) * v


def pop(f):
    """分裂音效：一口短促的噪声 + 一声上滑拨弦"""
    t = tt(0.35)
    n = bp(rng.standard_normal(len(t)), 1200, 7000) * np.exp(-t * 18) * 0.5
    ff = f * 2 ** (np.minimum(t, 0.08) / 0.08 * 7 / 12)
    s = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 9) * 0.6
    return n + s


def sidechain(t0, depth=0.75, rel=0.22):
    i = int(t0 * SR); n = int(rel * SR)
    if i >= N:
        return
    curve = 1 - depth * np.exp(-np.arange(n) / SR * (5 / rel))
    m = min(n, N - i)
    SC[i:i + m] = np.minimum(SC[i:i + m], curve[:m])




HITS = {"kick": 4.0, "squeeze": 6.0, "gap": 7.5, "drop": 8.0, "brk": 12.0, "build": 18.0, "gap2": 19.5, "drop2": 20.0, "outro": 28.0}
CH = [[50, 57, 62, 65], [46, 53, 58, 62], [53, 57, 60, 65], [48, 55, 60, 64]]  # Dm Bb F C
BASS = [38, 46, 41, 48]
H = HITS
GROOVE = [(H["drop"], H["brk"]), (H["drop2"], H["outro"])]

def clack(v=0.6):
    """切片：高频刷过的刀声 + 一声金属轻响"""
    t = tt(0.25)
    n = hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 26) * np.minimum(1, t / 0.01)
    ping = (np.sin(2 * np.pi * 2350 * t) + 0.5 * np.sin(2 * np.pi * 3720 * t)) * np.exp(-t * 18) * 0.35
    return (n * 0.8 + ping) * v

kicks = [b * BEAT for b in range(int(DUR / BEAT)) if within(b * BEAT, (H["kick"], H["gap"]), *GROOVE)]
for t in kicks:
    sidechain(t)

def pad_cut(t0):
    if t0 < H["drop"]:
        return 450 + 1800 * min(1, t0 / 7.5)
    if t0 < H["brk"]:
        return 6000
    if t0 < H["drop2"]:
        return 900 + 2600 * max(0, (t0 - 16) / 4)
    if t0 < H["outro"]:
        return 7000
    return 3200

for bar in range(int(np.ceil(DUR / 2))):
    t0 = bar * 2.0
    ch = CH[bar % 4]
    d = min(2.0, DUR - t0)
    if t0 in (6.0, 18.0):
        d = 1.5
    if t0 == H["outro"]:
        continue
    x = sum(supersaw(midi(m), d) for m in ch) / len(ch)
    x = lp(x, pad_cut(t0), 2)
    env = np.minimum(1, np.arange(len(x)) / (0.02 * SR)) * np.minimum(1, (len(x) - np.arange(len(x))) / (0.02 * SR))
    gain = 0.22 if (t0 < H["kick"] or within(t0, (H["brk"], H["drop2"]))) else 0.18
    add(x * env, t0, gain, -0.25, side=True)
    add(x * env, t0 + 0.012, gain, 0.25, side=True)

for b in range(int(DUR / BEAT)):
    t = b * BEAT
    if within(t, (0, H["kick"]), (H["brk"], H["build"])):
        add(tick(0.2 if b % 2 == 0 else 0.13), t, 1.0, 0.3)
for k in range(int(DUR / (BEAT / 4))):
    t = k * BEAT / 4
    if within(t, (2.0, H["gap"]), *GROOVE, (16.0, H["gap2"])):
        add(hat(v=0.16 if k % 2 else 0.24), t, 1.0, -0.2 + 0.4 * (k % 2))
    if within(t, *GROOVE) and k % 4 == 2:
        add(hat(open_=True, v=0.2), t, 1.0, 0.15)
for t in kicks:
    add(kick(1.0 if t >= H["drop"] else 0.85), t, 0.9)
for k in range(int(DUR / (BEAT / 2))):
    t = k * BEAT / 2
    if not within(t, (H["kick"], H["gap"]), *GROOVE, (16.0, H["gap2"])):
        continue
    bar = int(t // 2.0); f = midi(BASS[bar % 4] - 12); d = 0.22
    x = saw(f, d) * 0.6 + np.sin(2 * np.pi * f * tt(d)) * 0.8
    x = lp(x, 650) * np.exp(-tt(d) * 6)
    add(x, t, 0.5 if within(t, *GROOVE) else 0.36, 0, side=True)
ARP = [0, 2, 3, 1, 2, 3, 0, 3]
for k in range(int(DUR / (BEAT / 4))):
    t = k * BEAT / 4
    sparse = within(t, (H["brk"], H["build"]), (H["outro"], 30.2))
    if not (within(t, (H["kick"], H["squeeze"]), *GROOVE) or (sparse and k % 2 == 0)):
        continue
    bar = int(t // 2.0); m = CH[bar % 4][ARP[k % 8]] + 12
    x = lp(saw(midi(m), 0.16) + saw(midi(m) * 1.005, 0.16), 2600 if not sparse else 1600) * np.exp(-tt(0.16) * 22)
    add(x, t, 0.07 if sparse else 0.09, -0.4 if k % 2 else 0.4)
for i, t in enumerate([4.0, 5.0, 6.0, 7.0]):  # 每拍一刀
    add(clack(0.5 + 0.1 * i), t, 0.8, -0.4 + 0.27 * i)

def squeeze(a, b):
    t = a
    while t < b - 0.02:
        p = (t - a) / (b - a)
        add(clap(0.2 + 0.3 * p), t, 1.0)
        t += BEAT / 2 if p < 0.34 else (BEAT / 4 if p < 0.67 else BEAT / 8)
    nz = hp(rng.standard_normal(int((b - a) * SR)), 400)
    sweep = np.linspace(0, 1, len(nz)) ** 2
    filt = np.zeros(len(nz))
    for i0 in range(0, len(nz), 2205):
        s = nz[i0:i0 + 2205]; fc = 600 + 9000 * sweep[i0]
        filt[i0:i0 + len(s)] = bp(s, fc * 0.7, min(fc * 1.4, 20000))
    add(filt * sweep * 0.5, a)
    up_t = tt(b - a); up_f = midi(57) * 2 ** (np.linspace(0, 12, len(up_t)) / 12)
    add(np.sin(2 * np.pi * np.cumsum(up_f) / SR) * np.linspace(0.05, 0.25, len(up_t)), a, 0.5)

def inhale(a, b):
    n = int((b - a) * SR)
    add(hp(rng.standard_normal(n), 1500) * np.linspace(0, 1, n) ** 3, a, 0.35)
    add(np.sin(2 * np.pi * 40 * tt(b - a)) * np.linspace(0, 1, n) ** 2, a, 0.25)

def drop(a, b, bright=1.0):
    add(boom(), a, 0.9)
    for k in range(int((b - a) / BEAT)):
        t = a + k * BEAT; bar = int(t // 2.0)
        if k % 2 == 1:
            add(clap(0.42), t, 1.0)
        x = sum(supersaw(midi(m + 12), 0.18) for m in CH[bar % 4]) / 4
        x = lp(x, 4800 * bright) * np.exp(-tt(0.18) * 10)
        add(x, t + BEAT / 2, 0.16, -0.3); add(x, t + BEAT / 2 + 0.01, 0.16, 0.3)

squeeze(H["squeeze"], H["gap"]); inhale(H["gap"], H["drop"]); drop(H["drop"], H["brk"])
for i, t in enumerate([9.0, 9.4, 9.8]):  # 三个筐依次落定
    add(pop(midi(74 + 3 * i)), t, 0.35, -0.4 + 0.4 * i)
add(boom(1.6, 0.6), H["brk"], 0.55)          # 进入历史段
add(boom(1.2, 0.5), 14.0, 0.5)               # 80%
add(boom(1.2, 0.55), 16.0, 0.55)             # 19%
add(pop(midi(74)), 17.7, 0.4)                # 拿走的是任务
squeeze(H["build"], H["gap2"]); inhale(H["gap2"], H["drop2"]); drop(H["drop2"], H["outro"], bright=1.25)
for i, t in enumerate([22.0, 24.0, 26.0]):   # 三层依次点亮
    add(pop(midi(65 + 4 * i)), t, 0.45, -0.3 + 0.3 * i)
x = sum(supersaw(midi(m), 4.0) for m in [50, 57, 62, 65]) / 4
add(lp(x, 2400) * np.linspace(1, 0, len(x)) ** 1.5, H["outro"], 0.22)
for i, m in enumerate([62, 65, 69, 74]):
    add(lp(saw(midi(m), 0.4), 3000) * np.exp(-tt(0.4) * 8), 29.9 + i * 0.22, 0.12)

fade = int(1.0 * SR)
for ch in (L, R):
    ch[-fade:] *= np.linspace(1, 0, fade)
mix = np.stack([L, R], axis=1)
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
out = "mix.wav"
tmp = tempfile.mktemp(suffix=".wav")
wavfile.write(tmp, SR, (mix * 32767).astype(np.int16))
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
      f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,alimiter=limit=0.84:level=false")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-af", af, "-ar", "44100", "-c:a", "pcm_s16le", out], check=True)
os.remove(tmp)
