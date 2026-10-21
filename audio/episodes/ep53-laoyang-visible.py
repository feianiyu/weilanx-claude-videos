"""ep53 老杨魔方 ·「让知识可见，让思想有形」配乐 + 音效，全部纯代码合成（无旁白，配乐就是主音轨）。

结构：氛围铺底（和弦前暗后亮）+ 低频重击 + 呼啸 + 叮声，全部卡在 src/episodes/ep53-laoyang-visible/timeline.ts 的时间点上。
  0–1.67   光点升起：低沉 Dm9 铺底、上升噪声       1.667  重击 1（满屏青光）
  5.0      星芒成形：长鸣 + 一串高音铃              7.36   卡片撑开：短促闷击
  9.8–10.6 弹跳：5 声上行拨弦                       10.8–12.6 点阵起伏：弱律动（≈93 BPM）
  12.9–14.47 上升音                                 14.47  重击 2（白闪），和声转明亮 Cmaj9
  16.8 / 18.45 / 20.6 绳线碰胶囊：逐级升高的铃     22.367 重击 3（硬切黑底）
  25.6–27.0 每出现一个词一声铃                       29.6   logo：长铃和弦 + 低频轻涌，结尾 1.2 秒淡出
响度：两遍 loudnorm 到约 −15.5 LUFS、峰值 ≤ −3 dBFS。依赖 numpy、scipy、ffmpeg。
运行：python3 audio/episodes/ep53-laoyang-visible.py → public/audio/ep53-laoyang-visible/mix.wav
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from scipy import signal

# 与 timeline.ts 的 HITS 一致（tests/episodes/ep53-laoyang-visible.test.ts 会比对）
HITS = {"wash": 1.667, "star": 5.0, "card": 7.36, "flash": 14.47, "ding1": 16.8, "ding2": 18.45, "ding3": 20.6, "cut": 22.367, "logo": 29.6}

SR = 44100
DUR = 32.9
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    x = x[: N - i]
    gl = gain * np.cos((pan + 1) * np.pi / 4)
    gr = gain * np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * gl
    R[i:i + len(x)] += x * gr


def env_adsr(n, a, d, s, r, sus_len):
    A = int(a * SR); D = int(d * SR); S = int(sus_len * SR); Rr = int(r * SR)
    e = np.concatenate([np.linspace(0, 1, A, endpoint=False), np.linspace(1, s, D, endpoint=False),
                        np.full(S, s), np.linspace(s, 0, Rr)])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


# ───────── 1. 铺底和声 ─────────
CHORDS = [  # (开始, 结束, 低音, [和弦音])
    (0.0, 5.0, 38, [62, 65, 69, 72, 76]),        # Dm9
    (5.0, 9.8, 34, [62, 65, 69, 76]),            # B♭maj7(#11)
    (9.8, 12.8, 43, [58, 62, 65, 69]),           # Gm9
    (12.8, 14.5, 45, [62, 64, 67, 71]),          # A7sus4（张力，迎白闪）
    (14.5, 18.45, 48, [64, 67, 71, 74]),         # Cmaj9 —— 白底段转明亮
    (18.45, 22.37, 43, [59, 62, 64, 69]),        # G6/9
    (22.37, 25.4, 45, [60, 64, 67, 71]),         # Am9
    (25.4, 29.5, 41, [69, 72, 76, 79, 83]),      # Fmaj9(#11)
    (29.5, 32.9, 48, [67, 71, 74, 76, 79]),      # Cmaj9 落版
]


def saw_voice(f, n, detune_c=0.0, harm=14, phase=0.0):
    t = np.arange(n) / SR
    ff = f * 2 ** (detune_c / 1200)
    y = np.zeros(n)
    for k in range(1, harm + 1):
        if ff * k > 9000:
            break
        y += np.sin(2 * np.pi * ff * k * t + phase * k) / k
    return y


def pad_layer():
    for i, (a, b, bass, notes) in enumerate(CHORDS):
        x0 = max(0, a - 0.35); x1 = min(DUR, b + 0.45)
        n = int((x1 - x0) * SR)
        fade_in = 0.6 if i else 1.2
        e = env_adsr(n, fade_in, 0.3, 0.85, 0.8, max(0, (x1 - x0) - fade_in - 1.1))
        for side, pan in ((0, -0.55), (1, 0.55)):
            y = np.zeros(n)
            for m in notes:
                y += saw_voice(midi(m), n, detune_c=(-7 if side == 0 else 7), harm=10, phase=rng.random() * 6)
            y += 0.5 * saw_voice(midi(bass + 12), n, detune_c=(-4 if side == 0 else 4), harm=5)
            sos = signal.butter(2, 1150 if 14.5 <= a < 22.4 or a >= 29.5 else 820, 'low', fs=SR, output='sos')
            y = signal.sosfilt(sos, y)
            y = signal.sosfilt(signal.butter(2, 140, 'high', fs=SR, output='sos'), y)
            # 慢速呼吸的振幅（像原曲铺底里的弱律动，≈93 BPM 的二分音符）
            t = np.arange(n) / SR + x0
            breathe = 0.82 + 0.18 * np.sin(2 * np.pi * t * (93 / 60) / 2)
            add(y * e * breathe, x0, 0.045, pan)
    # 亚低频持续音，增加厚度
    for a, b, bass, _ in CHORDS:
        x0 = max(0, a - 0.2); n = int((min(DUR, b + 0.3) - x0) * SR)
        t = np.arange(n) / SR
        y = np.sin(2 * np.pi * midi(bass - 12) * t) * env_adsr(n, 0.4, 0.2, 0.9, 0.4, (n / SR) - 1.0)
        add(y, x0, 0.012, 0)


# ───────── 2. 低频重击 ─────────
def boom(t0, length=1.0, f0=72, f1=36, gain=0.9, click=0.0):
    n = int(length * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * (3.2 / length))
    y *= np.minimum(1, t / 0.004)
    if click:
        c = rng.standard_normal(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / SR * 140)
        c = signal.sosfilt(signal.butter(2, [800, 5000], 'band', fs=SR, output='sos'), c)
        y[:len(c)] += c * click
    add(y, t0, gain, 0)


# ───────── 3. 噪声类：呼啸 / 上升音 / 故障声 ─────────
def swept_noise(n, fc_of_u, bw=0.8):
    """时变带通噪声：STFT 频域掩膜，避免分块滤波的爆音"""
    x = rng.standard_normal(n + 2048)
    f, tt, Z = signal.stft(x, SR, nperseg=1024, noverlap=768)
    u = np.clip(tt / (n / SR), 0, 1)
    fc = np.array([fc_of_u(v) for v in u])
    lf = np.log(np.maximum(f, 20))[:, None]
    M = np.exp(-((lf - np.log(fc)[None, :]) ** 2) / (2 * (bw / 2) ** 2))
    _, y = signal.istft(Z * M, SR, nperseg=1024, noverlap=768)
    y = y[:n]
    return y / (np.std(y) + 1e-9) * 0.3


def whoosh(t0, dur, f_from=400, f_to=4000, gain=0.25, pan_from=-0.6, pan_to=0.6):
    n = int(dur * SR)
    out = swept_noise(n, lambda u: f_from * (f_to / f_from) ** u)
    u = np.linspace(0, 1, n)
    e = np.sin(np.pi * u) ** 1.6
    for k, pn in enumerate(np.linspace(pan_from, pan_to, 8)):
        a, b = k * n // 8, (k + 1) * n // 8
        seg = out[a:b] * e[a:b]
        w = np.ones(len(seg)); r = min(256, len(seg) // 2)
        w[:r] = np.linspace(0, 1, r); w[-r:] = np.linspace(1, 0, r)
        add(seg * w, t0 + a / SR, gain, pn)
        if k < 7:
            add(out[b:b + r] * e[b:b + r] * np.linspace(1, 0, len(out[b:b + r])), t0 + b / SR, gain, pn)


def riser(t0, dur, gain=0.22, f_from=300, f_to=7000):
    n = int(dur * SR)
    out = swept_noise(n, lambda u: f_from * (f_to / f_from) ** (u ** 1.5), bw=0.6)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * t / dur)) / SR) * 0.25
    e = (t / dur) ** 2
    add((out + tone) * e, t0, gain, 0)

def glitch(t0, dur, gain=0.12, density=55):
    n = int(dur * SR)
    y = np.zeros(n)
    for _ in range(int(density * dur)):
        p = rng.integers(0, max(1, n - 2000))
        ln = rng.integers(200, 1600)
        burst = rng.standard_normal(ln) * np.hanning(ln)
        if rng.random() < 0.5:
            burst = np.sign(burst) * 0.6
        y[p:p + ln] += burst * rng.uniform(0.2, 1)
    y = signal.sosfilt(signal.butter(2, 2500, 'high', fs=SR, output='sos'), y)
    add(y, t0, gain, rng.uniform(-0.5, 0.5))


# ───────── 4. 音调类：叮 / 拨弦 / 铃 ─────────
def bell(t0, f, dur=1.6, gain=0.12, pan=0.0, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t * 3.0)
         + 0.45 * bright * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
         + 0.25 * bright * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 11))
    y *= np.minimum(1, t / 0.002)
    add(y, t0, gain, pan)


def blip(t0, f, dur=0.12, gain=0.08, pan=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t + 2 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 40)) * np.exp(-t * 32)
    add(y * np.minimum(1, t / 0.001), t0, gain, pan)


def pluck(t0, f, gain=0.1, pan=0.0, dur=0.6):
    n = int(dur * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 18)) * np.exp(-t * 7)
    add(y * np.minimum(1, t / 0.0015), t0, gain, pan)


def tick(t0, gain=0.05, pan=0.0, hp=5000):
    n = int(0.03 * SR)
    y = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 220)
    y = signal.sosfilt(signal.butter(2, hp, 'high', fs=SR, output='sos'), y)
    add(y, t0, gain, pan)


def glide(t0, dur, f0, f1, gain=0.05, pan=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) ** 2
    add(y, t0, gain, pan)


def sparkle_cluster(t0, base=2093, gain=0.05):
    for k, m in enumerate([0, 4, 7, 11, 14]):
        bell(t0 + k * 0.035, base * 2 ** (m / 12), dur=0.9, gain=gain, pan=-0.6 + 0.3 * k, bright=0.6)


def build():
    pad_layer()
    # 段落 1：光点升起
    blip(0.02, 1480, gain=0.06); blip(0.16, 1760, gain=0.04, pan=0.4)
    glide(0.0, 0.62, 300, 900, gain=0.03)
    bell(0.55, 1568, dur=1.2, gain=0.045, pan=-0.2, bright=0.5)
    for k, b in enumerate([0.45, 0.9, 1.12, 1.3]):
        whoosh(b, 0.35, 300, 1500, gain=0.06, pan_from=0, pan_to=0)
    riser(0.85, 0.82, gain=0.12)
    boom(HITS['wash'], 1.3, 80, 34, 1.0, click=0.25)
    whoosh(1.63, 0.4, 3000, 400, gain=0.22)
    # 段落 2：分裂、玻璃透镜、旋转变星
    for k in range(4):
        blip(2.37 + k * 0.025, 1800 + 300 * k, gain=0.05, pan=[-0.7, 0.7, -0.3, 0.3][k])
    glitch(2.42, 0.48, gain=0.1)
    glide(2.4, 0.7, 500, 260, gain=0.04)
    bell(3.2, 1175, dur=1.4, gain=0.03, pan=0.3, bright=0.4)
    whoosh(4.4, 0.6, 500, 5000, gain=0.17)
    glitch(4.6, 0.32, gain=0.06)
    boom(HITS['star'], 1.6, 64, 30, 0.85)
    sparkle_cluster(5.04, 2093, 0.035)
    # 段落 3：寻找结构 → 胶囊 → 卡片
    bell(5.45, 1319, dur=0.8, gain=0.035, pan=-0.3); bell(5.65, 1760, dur=0.8, gain=0.035, pan=0.3)
    whoosh(6.4, 0.3, 4000, 900, gain=0.1)
    blip(6.55, 2200, gain=0.06)
    glide(6.6, 0.75, 700, 1400, gain=0.03)
    boom(HITS['card'], 0.6, 110, 55, 0.4, click=0.3)
    whoosh(7.28, 0.32, 900, 6000, gain=0.14)
    bell(7.55, 1047, dur=1.2, gain=0.04); bell(7.62, 1568, dur=1.0, gain=0.03, pan=0.3)
    whoosh(8.6, 0.6, 600, 3500, gain=0.18, pan_from=-0.3, pan_to=0.9)
    # 段落 4：弹跳 → 起伏 → 柱线 → 白闪
    blip(9.05, 2600, gain=0.04)
    for k, tt in enumerate([9.8, 10.0, 10.2, 10.4, 10.6]):
        pluck(tt, midi([81, 84, 86, 88, 91][k]), gain=0.09, pan=0.7 - 0.35 * k)
    tick(9.78, 0.06)
    for k in range(10):  # 点阵起伏：弱律动
        tt = 10.8 + k * 0.325
        if tt > 12.6:
            break
        tick(tt, 0.035 if k % 2 else 0.05, pan=(-0.4 if k % 2 else 0.4), hp=6500)
        if k % 2 == 0:
            pluck(tt, midi([69, 72, 74, 76, 79][(k // 2) % 5]), gain=0.03, pan=0.0, dur=0.4)
    for k in range(5):
        pluck(13.0 + k * 0.07, midi(69 + [0, 3, 5, 7, 10][k] + 12), gain=0.05, pan=-0.6 + 0.3 * k, dur=0.35)
    riser(12.9, 1.58, gain=0.2)
    whoosh(13.3, 0.45, 400, 4000, gain=0.14, pan_from=0, pan_to=0)
    boom(HITS['flash'], 1.0, 95, 40, 1.0, click=0.5)
    whoosh(14.42, 0.35, 6000, 800, gain=0.2)
    # 段落 6：白底绳线
    glide(14.8, 0.3, 900, 1500, gain=0.03)
    for tt in np.arange(15.0, 22.3, 0.645):  # 白底段轻律动（≈93 BPM）
        tick(tt, 0.03, pan=0.3, hp=7000); tick(tt + 0.3225, 0.018, pan=-0.3, hp=7000)
    glide(15.45, 1.35, 300, 620, gain=0.02, pan=0.4)
    bell(HITS['ding1'], 1047, dur=1.8, gain=0.1, pan=-0.2)
    boom(HITS['ding1'], 0.35, 120, 70, 0.18)
    whoosh(17.2, 0.7, 300, 2500, gain=0.12, pan_from=-0.5, pan_to=0.6)
    bell(HITS['ding2'], 1319, dur=1.8, gain=0.1, pan=0.2)
    boom(HITS['ding2'], 0.35, 120, 70, 0.18)
    whoosh(19.4, 0.7, 300, 2500, gain=0.12, pan_from=-0.5, pan_to=0.6)
    bell(HITS['ding3'], 1568, dur=1.8, gain=0.1, pan=0.1)
    boom(HITS['ding3'], 0.35, 120, 70, 0.18)
    for k in range(7):
        blip(21.32 + k * 0.1, 900 + (k % 2) * 300, dur=0.08, gain=0.025, pan=0.2 + 0.08 * k)
    riser(21.5, 0.87, gain=0.16)
    whoosh(21.8, 0.5, 500, 6000, gain=0.14)
    boom(HITS['cut'], 1.1, 85, 36, 0.95, click=0.35)
    # 段落 7：描边框「融会贯通」
    glide(22.4, 1.25, 760, 1520, gain=0.035, pan=-0.2)
    for k in range(4):
        tick(23.45 + k * 0.11, 0.06, pan=-0.3 + 0.2 * k, hp=3500)
        blip(23.45 + k * 0.11, 2400, dur=0.05, gain=0.02)
    bell(23.9, 1175, dur=1.4, gain=0.04, bright=0.5)
    whoosh(24.8, 0.55, 800, 5000, gain=0.18, pan_from=0.2, pan_to=-0.9)
    glitch(24.95, 0.35, gain=0.07)
    # 段落 8：雾团「让知识可见 / 让思想有形」
    for tt, m in [(25.58, 76), (25.98, 79), (26.52, 81), (27.02, 84)]:
        bell(tt, midi(m), dur=1.6, gain=0.045, pan=rng.uniform(-0.4, 0.4), bright=0.5)
    glide(28.0, 0.6, 1300, 700, gain=0.025)
    riser(28.9, 0.65, gain=0.12, f_from=500, f_to=5000)
    whoosh(29.35, 0.55, 3000, 400, gain=0.15)
    # 段落 9：立方体 logo
    boom(HITS['logo'], 2.2, 70, 32, 0.8)
    for k, m in enumerate([84, 88, 91, 95]):
        bell(29.6 + k * 0.02, midi(m), dur=3.0, gain=0.05, pan=-0.45 + 0.3 * k, bright=0.7)


def reverb(x, secs=2.3, wet=0.24):
    n = int(secs * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 3.2)
    ir = signal.sosfilt(signal.butter(1, 5000, 'low', fs=SR, output='sos'), ir)
    ir /= np.sqrt(np.sum(ir ** 2))
    y = signal.fftconvolve(x, ir)[:len(x)]
    return x * (1 - wet) + y * wet


def loudnorm(src, dst, gain_db=-0.7):
    """两遍 loudnorm（linear）→ −15 LUFS 目标，再整体压 0.7 dB 保证峰值 ≤ −3 dBFS"""
    af = 'loudnorm=I=-15:TP=-3:LRA=11:print_format=json'
    err = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-i', src, '-af', af, '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(err[err.rindex('{'):err.rindex('}') + 1])
    af2 = (f"loudnorm=I=-15:TP=-3:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
           f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,volume={gain_db}dB")
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', src, '-af', af2, '-ar', str(SR), dst], check=True)


if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'public/audio/ep53-laoyang-visible/mix.wav')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    build()
    out = np.stack([reverb(L), reverb(R)], 1)
    fo = int(1.2 * SR)  # 结尾 1.2 秒淡出
    out[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    out /= np.max(np.abs(out)) + 1e-9
    out *= 0.7
    import scipy.io.wavfile as wf
    with tempfile.TemporaryDirectory() as td:
        raw = os.path.join(td, 'raw.wav')
        wf.write(raw, SR, (out * 32767).astype(np.int16))
        loudnorm(raw, out_path)
    print('ok', out_path)
