"""鲲 · 配乐 v2：电影感混合编制（弦乐垫 / 人声垫 / 古筝 / 笛 / 合成低音 / 分层鼓 / 太鼓 / 氛围音效）
时间点与画面一致：钩子 0–3.5 · 收 3.5–4 · DROP1 4 · 尔雅 10 · 蓄力 14.4 · DROP2 16 · 九万里 21.6 · 落点 24 · 提问 28 → music_raw.wav
"""
import numpy as np, wave
from scipy.signal import butter, sosfilt, sosfilt_zi

SR = 44100; DUR = 32.0; N = int(SR * DUR)
BPM = 120; B = 60 / BPM; BAR = 4 * B
rng = np.random.default_rng(5)
BUS = {k: np.zeros((N, 2)) for k in ('drum', 'bass', 'pad', 'music', 'lead', 'fx')}
SEND_HALL = np.zeros((N, 2)); SEND_ROOM = np.zeros((N, 2)); SEND_DLY = np.zeros((N, 2))

def tt(d): return np.arange(int(d * SR)) / SR
def note(m): return 440 * 2 ** ((m - 69) / 12)
def put(bus, sig, t, g=1.0, pan=0.0, hall=0.0, room=0.0, dly=0.0):
    if sig.ndim == 1: sig = np.stack([sig * (1 - pan) ** 0.5 * 1.0, sig * (1 + pan) ** 0.5 * 1.0], 1) / 1.0
    i = int(t * SR)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[:N - i] * g
    BUS[bus][i:i + len(s)] += s
    if hall: SEND_HALL[i:i + len(s)] += s * hall
    if room: SEND_ROOM[i:i + len(s)] += s * room
    if dly: SEND_DLY[i:i + len(s)] += s * dly
def lp(x, fc, order=2): return sosfilt(butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, fc, order=2): return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=0)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x, axis=0)
def sweep_lp(x, fc_curve, block=512):
    """随时间变化的低通（逐块重算系数，状态延续）"""
    y = np.zeros_like(x); zi = None
    for s in range(0, len(x), block):
        fc = float(np.clip(fc_curve[min(s, len(fc_curve) - 1)], 40, SR * 0.45))
        sos = butter(2, fc, 'low', fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
        y[s:s + block], zi = sosfilt(sos, x[s:s + block], axis=0, zi=zi)
    return y
def env(d, a=0.01, r=0.1, sus=1.0):
    t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, np.maximum(0, (d - t) / max(r, 1e-4))) * sus
def saw(f, d, phase=0.0):
    t = tt(d); dt = f / SR; ph = (phase + np.cumsum(np.full(len(t), dt))) % 1.0
    y = 2 * ph - 1
    m = ph < dt; x = ph[m] / dt; y[m] -= x + x - x * x - 1
    m = ph > 1 - dt; x = (ph[m] - 1) / dt; y[m] -= x * x + x + x + 1
    return y

# ---------------- 乐器 ----------------
def supersaw(ms, d, a=0.6, r=0.8, voices=7, detune=0.18, fc=2200, fc_end=None):
    out = np.zeros((int(d * SR), 2))
    for m in ms:
        for v in range(voices):
            k = (v - (voices - 1) / 2) / ((voices - 1) / 2)
            f = note(m) * 2 ** (k * detune / 12); pan = 0.85 * k
            s = saw(f, d, rng.random()) * (1 - 0.35 * abs(k))
            out[:, 0] += s * (1 - pan) * 0.5; out[:, 1] += s * (1 + pan) * 0.5
    out /= len(ms) * voices ** 0.5
    curve = np.geomspace(fc, fc_end or fc, len(out))
    out = sweep_lp(out, curve)
    return out * env(d, a, r)[:, None]
def choir(ms, d, a=0.8, r=1.0):
    """人声「啊」：锯齿过两个共振峰"""
    raw = supersaw(ms, d, a, r, voices=5, detune=0.12, fc=5000)
    f1 = bp(raw, 600, 900); f2 = bp(raw, 1050, 1400); f3 = bp(raw, 2300, 2900)
    v = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * tt(d))[:, None]
    return (f1 * 1.0 + f2 * 0.6 + f3 * 0.25) * v * 2.2
def zheng(m, d=1.6, bright=0.5, decay=0.996, pluckpos=2):
    f = note(m); p = int(SR / f); n = int(d * SR)
    buf = rng.uniform(-1, 1, p)
    for _ in range(pluckpos): buf = 0.5 * (buf + np.roll(buf, 1))
    y = np.concatenate([buf, np.zeros(n)])
    for i in range(p, n + p): y[i] = decay * (bright * y[i - p] + (1 - bright) * y[i - p - 1])
    out = y[p:p + n] * np.minimum(1, (d - tt(d)) / 0.25)
    body = lp(out, 3500) + 0.25 * bp(out, 180, 400)       # 琴身共鸣
    return body * 0.9
def dizi(m, d, vib=1.0, slide_from=None):
    """笛：正弦 + 二三次泛音 + 气声，延迟颤音，可滑音"""
    t = tt(d); f0 = note(m)
    f = np.full(len(t), f0)
    if slide_from is not None: f = f0 * 2 ** ((slide_from - m) / 12 * np.exp(-t / 0.06))
    vb = 1 + 0.006 * vib * np.sin(2 * np.pi * 5.4 * t) * np.minimum(1, np.maximum(0, (t - 0.25) / 0.3))
    ph = 2 * np.pi * np.cumsum(f * vb) / SR
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    breath = bp(rng.standard_normal(len(t)), f0 * 0.9, f0 * 4) * 0.25
    e = np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.12) * (0.85 + 0.15 * np.minimum(1, t / 0.4))
    return (tone + breath) * e * 0.5
def bell(f, d=3.0):
    t = tt(d); return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k) for r, a, k in [(1, 1, 1.0), (2.76, 0.4, 2.0), (5.4, 0.2, 3.5), (8.9, 0.08, 5)]) * np.minimum(1, t / 0.002) * 0.35
def sub(m, d, drive=1.4):
    t = tt(d); s = np.tanh(drive * np.sin(2 * np.pi * note(m) * t)) / np.tanh(drive)
    return s * env(d, 0.006, 0.05)
def reese(m, d):
    s = (saw(note(m) * 2 ** (0.1 / 12), d) + saw(note(m) * 2 ** (-0.1 / 12), d)) * 0.5
    return lp(s, 520) * env(d, 0.01, 0.06) * 1.3

# ---------------- 鼓 ----------------
def kick(g=1.0):
    t = tt(0.55); f = 48 + 140 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 250) * 0.35
    return np.tanh(1.6 * (body + click)) * g
def snare():
    t = tt(0.35)
    body = np.sin(2 * np.pi * np.cumsum(185 + 60 * np.exp(-t * 40)) / SR) * np.exp(-t * 22) * 0.6
    noise = bp(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 14) * 0.7
    clap = np.zeros(len(t))
    for k, o in enumerate([0, 0.009, 0.019]):
        i = int(o * SR); clap[i:] += bp(rng.standard_normal(len(t) - i), 900, 3500) * np.exp(-tt(0.35)[:len(t) - i] * (60 if k < 2 else 18)) * 0.45
    return body + noise + clap
def hat(open_=False):
    d = 0.32 if open_ else 0.06; t = tt(d)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (3140, 4250, 5630, 7010, 8420)) / 5
    n = hp(rng.standard_normal(len(t)) * 0.6 + metal * 0.5, 7000)
    return n * np.exp(-t * (9 if open_ else 70)) * 0.32
def taiko(f0=70, d=2.2):
    t = tt(d); f = f0 * (1 + 0.6 * np.exp(-t * 18))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.0)
    skin = bp(rng.standard_normal(len(t)), 120, 900) * np.exp(-t * 30) * 0.5
    return np.tanh(1.4 * (body + skin))
def tom(f0=110):
    t = tt(0.5); return np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.5 * np.exp(-t * 25))) / SR) * np.exp(-t * 8) * 0.8
def crash(d=3.0):
    t = tt(d); n = hp(rng.standard_normal(len(t)), 4000)
    return np.stack([n, hp(rng.standard_normal(len(t)), 4000)], 1) * (np.exp(-t * 1.6) * np.minimum(1, t / 0.003))[:, None] * 0.25
def rev_crash(d=1.5):
    return crash(d)[::-1] * 0.8
def riser(d):
    t = tt(d); n = rng.standard_normal((len(t), 2))
    out = sweep_lp(n, np.geomspace(250, 12000, len(t)))
    return out * (t / d)[:, None] ** 2 * 0.8
def subdrop(d=1.6):
    t = tt(d); return np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 1.6) + 28) / SR) * np.exp(-t * 2.0)
def downlifter(d=2.0):
    t = tt(d); n = rng.standard_normal((len(t), 2))
    return sweep_lp(n, np.geomspace(9000, 300, len(t))) * np.exp(-t * 1.5)[:, None] * 0.5
def stutter(src, t0, reps=6, sl=0.0625, g=0.5, bus='music'):
    n = int(sl * SR); w = np.hanning(n); piece = src[:n] * (w[:, None] if src.ndim == 2 else w)
    for k in range(reps): put(bus, piece, t0 + k * sl, g * (1 - k / (reps + 2)), pan=0.5 * (-1) ** k)

# ---------------- 编曲 ----------------
PROG = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]   # Am F C G
PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84]
KICKS = []
def drums(t0, t1, full=True, hat16=True, openhat=True, snare_on=True, g=1.0, fill=False):
    t = t0
    while t < t1 - 1e-6:
        for k in range(4):
            tb = t + k * B
            if tb >= t1: break
            if full or k in (0, 2): put('drum', kick(), tb, 0.85 * g, room=0.12); KICKS.append(tb)
            if snare_on and k in (1, 3): put('drum', snare(), tb, 0.42 * g, room=0.35, hall=0.08)
            nh = 4 if hat16 else 2
            for h in range(nh):
                acc = 1.0 if h % 2 == 0 else 0.6
                put('drum', hat(), tb + h * B / nh, 0.16 * g * acc, pan=0.35)
            if openhat: put('drum', hat(True), tb + B / 2, 0.12 * g, pan=-0.3, room=0.2)
        t += BAR
def bassline(t0, t1, g=1.0, eighths=True):
    t = t0; bar = int(round(t0 / BAR))
    while t < t1 - 1e-6:
        root = PROG[bar % 4][0]
        if eighths:
            for k in range(8):
                tb = t + k * B / 2
                if tb >= t1: break
                put('bass', sub(root - 12, B / 2 * 0.9), tb, 0.3 * g)
                put('bass', reese(root, B / 2 * 0.9), tb, 0.16 * g, hall=0.0)
        else:
            put('bass', sub(root - 12, min(BAR, t1 - t)), t, 0.26 * g)
        t += BAR; bar += 1
def pads(t0, t1, g=1.0, fc=1800, fc_end=None, a=0.5, oct=0, kind='saw'):
    t = t0; bar = int(round(t0 / BAR))
    while t < t1 - 1e-6:
        d = min(BAR, t1 - t) + 0.6
        ch = [m + oct for m in PROG[bar % 4][1]]
        f_a = fc if fc_end is None else fc * (fc_end / fc) ** ((t - t0) / max(0.01, t1 - t0))
        f_b = fc if fc_end is None else fc * (fc_end / fc) ** ((t + d - t0) / max(0.01, t1 - t0))
        s = supersaw(ch + [ch[0] - 12], d, a=a, r=0.6, fc=f_a, fc_end=f_b) if kind == 'saw' else choir(ch, d, a=a, r=0.7)
        put('pad', hp(s, 140), t, 0.5 * g, hall=0.35)
        t += BAR; bar += 1
def arp(t0, t1, g=1.0, oct=12, rate=4, bright=0.5):
    t = t0; bar = int(round(t0 / BAR)); k = 0
    pat = [0, 2, 1, 2, 0, 2, 1, 3]
    while t < t1 - 1e-6:
        ch = PROG[bar % 4][1]; tones = [ch[0], ch[1], ch[2], ch[0] + 12]
        for s in range(4 * rate):
            tb = t + s * B / rate
            if tb >= t1: break
            m = tones[pat[s % 8]] + oct
            put('music', zheng(m, 0.9, bright, 0.993), tb, 0.13 * g * (1.0 if s % 2 == 0 else 0.7), pan=0.45 * np.sin(s * 0.9), dly=0.18, hall=0.1)
        t += BAR; bar += 1

# 0–3.5 钩子：弦乐垫 + 笛子主题 + 古筝
pads(0.0, 4.0, g=0.75, fc=900, fc_end=2400, a=1.2)
put('bass', sub(33, 3.5), 0.0, 0.14)
put('music', zheng(69, 2.4), 0.0, 0.28, dly=0.25, hall=0.2); put('fx', bell(1760, 2.5), 0.0, 0.15, hall=0.4)
for m, t0, d, sl in [(76, 0.25, 0.7, 74), (79, 0.95, 0.45, None), (76, 1.4, 0.4, None), (74, 1.8, 1.0, None), (72, 2.85, 0.6, None)]:
    put('lead', dizi(m, d, slide_from=sl), t0, 0.32, pan=0.1, hall=0.3, dly=0.15)
arp(2.0, 3.5, g=0.6, oct=12, rate=4)
put('fx', riser(1.5), 2.0, 0.28); put('fx', rev_crash(1.0), 3.0, 0.5)
# 3.5–4 抽空：只留一口气
put('fx', zheng(81, 0.4, 0.6, 0.98), 3.5, 0.2, hall=0.6)

# 4 DROP 1：鲲（冷）
put('drum', taiko(62, 2.4), 4.0, 0.9, hall=0.25); put('drum', crash(), 4.0, 0.8, hall=0.2); put('fx', subdrop(), 4.0, 0.7)
for k, m in enumerate(PENTA): put('music', zheng(m, 1.2, 0.5, 0.993), 4.0 + k * 0.035, 0.12, pan=-0.6 + 0.1 * k, hall=0.2)
drums(4.0, 10.0, hat16=True)
bassline(4.0, 10.0)
pads(4.0, 10.0, g=0.9, fc=2600)
arp(4.0, 10.0, g=0.8, oct=12, rate=4)
for m, t0, d in [(76, 4.5, 0.75), (74, 5.25, 0.25), (72, 5.5, 0.5), (69, 6.0, 1.5), (72, 8.0, 0.5), (74, 8.5, 0.5), (76, 9.0, 0.9)]:
    put('lead', dizi(m + 12, d), t0, 0.22, hall=0.3, dly=0.2)
stutter(zheng(81, 0.5), 4.1, reps=6, g=0.25)
put('drum', taiko(70, 1.6), 8.0, 0.55, hall=0.3); put('fx', bell(1318, 2.0), 8.0, 0.2, hall=0.4)
for k in range(4): put('drum', tom(150 - k * 20), 9.5 + k * 0.125, 0.4, room=0.3)
put('fx', downlifter(2.0), 9.6, 0.3)

# 10 尔雅：鼓退场，人声垫 + 钟
put('drum', taiko(55, 2.6), 10.0, 0.6, hall=0.35); put('fx', subdrop(1.2), 10.0, 0.4)
pads(10.0, 14.4, g=0.8, kind='choir')
bassline(10.0, 14.4, g=0.8, eighths=False)
drums(10.0, 14.4, full=False, hat16=False, openhat=False, snare_on=False, g=0.6)
stutter(zheng(84, 0.5), 10.5, reps=8, sl=0.05, g=0.22)
put('fx', bell(2093, 3.0), 11.3, 0.3, hall=0.5); put('music', zheng(81, 2.0), 11.3, 0.2, dly=0.3)
for k, m in enumerate([69, 72, 74, 76, 79, 81]): put('music', zheng(m, 1.4), 12.0 + k * 0.4, 0.13, pan=0.4, dly=0.25, hall=0.15)

# 14.4–16 蓄力
pads(14.4, 16.0, g=0.85, fc=600, fc_end=7000)
put('fx', riser(1.6), 14.4, 0.4); put('fx', rev_crash(1.2), 14.8, 0.6)
for k in range(16): put('drum', snare(), 15.0 + k * 0.0625 * (1 if k < 8 else 0.5) + (0 if k < 8 else 0.25), 0.08 + 0.025 * k, room=0.3)
for k in range(4): put('drum', taiko(80 - k * 4, 0.8), 14.5 + k * 0.25, 0.3, hall=0.2)

# 16 DROP 2：鹏（暖、更宽、加人声）
put('drum', taiko(58, 2.6), 16.0, 1.0, hall=0.3); put('drum', crash(3.5), 16.0, 0.9, hall=0.2); put('fx', subdrop(), 16.0, 0.75)
for k, m in enumerate(PENTA[::-1]): put('music', zheng(m, 1.2, 0.5, 0.993), 16.0 + k * 0.035, 0.12, pan=0.6 - 0.1 * k, hall=0.2)
drums(16.0, 24.0, hat16=True)
bassline(16.0, 24.0, g=1.05)
pads(16.0, 24.0, g=0.95, fc=3600, oct=0)
pads(16.0, 24.0, g=0.55, kind='choir', oct=12)
arp(16.0, 24.0, g=0.75, oct=24, rate=4, bright=0.55)
for m, t0, d in [(81, 16.5, 0.75), (79, 17.25, 0.25), (76, 17.5, 0.5), (74, 18.0, 1.5), (76, 20.0, 0.5), (79, 20.5, 0.3), (81, 20.8, 0.8), (84, 21.6, 2.2)]:
    put('lead', dizi(m, d, slide_from=(m - 2 if d > 1 else None)), t0, 0.26, hall=0.35, dly=0.2)
stutter(zheng(84, 0.5), 16.1, reps=6, g=0.25)
put('fx', riser(1.6), 20.0, 0.25)
put('drum', taiko(64, 1.4), 20.0, 0.6, hall=0.25); put('drum', taiko(68, 1.4), 20.8, 0.6, hall=0.25)
put('drum', taiko(52, 3.0), 21.6, 1.0, hall=0.4); put('drum', crash(3.0), 21.6, 0.8, hall=0.2)
put('fx', bell(2637, 3.0), 21.62, 0.25, hall=0.5); put('fx', bell(1760, 3.0), 21.62, 0.25, hall=0.5)
put('fx', downlifter(2.2), 23.6, 0.3)

# 24 落点：鼓全退，弦乐 + 笛子独奏
pads(24.0, 28.0, g=0.75, fc=1600, a=0.8)
pads(24.0, 28.0, g=0.35, kind='choir', oct=12)
bassline(24.0, 28.0, g=0.7, eighths=False)
put('drum', taiko(55, 2.4), 25.0, 0.4, hall=0.4)
for m, t0, d, sl in [(76, 24.2, 0.9, None), (74, 25.1, 0.4, None), (72, 25.5, 0.9, None), (69, 26.4, 0.6, 67), (72, 27.0, 0.4, None), (76, 27.4, 0.6, None)]:
    put('lead', dizi(m, d, slide_from=sl), t0, 0.3, hall=0.4, dly=0.22)
# 28 提问：轻鼓 + 古筝点
pads(28.0, 32.0, g=0.7, fc=2000, a=0.6)
bassline(28.0, 32.0, g=0.7, eighths=False)
drums(28.0, 31.5, full=False, hat16=False, openhat=False, g=0.6)
for k in range(5): put('music', zheng([69, 72, 76, 72, 81][k], 1.2), 28.6 + 0.6 * k, 0.2, dly=0.25, hall=0.2)
put('lead', dizi(76, 1.6), 30.0, 0.25, hall=0.45); put('fx', bell(1760, 2.5), 30.0, 0.15, hall=0.5)

# ---------------- 混音 ----------------
# 侧链：踢鼓压低 bass / pad / music
sc = np.ones(N); tk = np.array(KICKS)
t_all = np.arange(N) / SR
for k in tk:
    i0 = int(k * SR); i1 = min(N, i0 + int(0.32 * SR)); tt_ = t_all[i0:i1] - k
    sc[i0:i1] = np.minimum(sc[i0:i1], 1 - 0.6 * np.exp(-tt_ / 0.09) * np.minimum(1, tt_ / 0.004 + 0.3))
for b, depth in (('bass', 1.0), ('pad', 0.7), ('music', 0.35)):
    BUS[b] *= (1 - depth * (1 - sc))[:, None]
# 混响：大厅（预延迟 + 暗尾 + 左右去相关）、小房间；乒乓延迟
def ir_make(dur, decay, pre, damp):
    n = int(dur * SR); t = np.arange(n) / SR
    L = rng.standard_normal(n) * np.exp(-t * decay); R = rng.standard_normal(n) * np.exp(-t * decay)
    ir = np.stack([L, R], 1); ir = lp(ir, damp); ir = np.concatenate([np.zeros((int(pre * SR), 2)), ir]); return ir / np.abs(ir).sum(0) * 6
def conv(x, ir):
    m = len(x) + len(ir); F = 1 << int(np.ceil(np.log2(m)))
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c], F) * np.fft.rfft(ir[:, c], F), F)[:len(x)] for c in range(2)], 1)
HALL = conv(hp(SEND_HALL, 200), ir_make(3.2, 1.6, 0.035, 5500)) * 0.55
ROOM = conv(SEND_ROOM, ir_make(0.7, 6.0, 0.008, 8000)) * 0.5
D = int(0.375 * SR); dl = np.zeros((N, 2)); src = lp(hp(SEND_DLY, 300), 6000)
for k in range(1, 6):
    s = src[:N - k * D] * 0.55 ** k; ch = k % 2
    dl[k * D:, ch] += s[:, 0] + s[:, 1]
# 分组电平
mix = (BUS['drum'] * 1.0 + BUS['bass'] * 0.75 + BUS['pad'] * 0.75 + BUS['music'] * 0.9 + BUS['lead'] * 0.85 + BUS['fx'] * 0.8
       + HALL + ROOM + dl * 0.35)
mix = hp(mix, 28)
# 总线胶水压缩（RMS 跟随，约 2:1）
rms = np.sqrt(lp(np.mean(mix ** 2, 1), 8, 1).clip(1e-9))
thr = np.percentile(rms, 70); gain = np.where(rms > thr, (thr / rms) ** 0.5, 1.0)
mix *= lp(gain, 20, 1)[:, None]
fo = np.ones(N); nf = int(1.4 * SR); fo[-nf:] = np.linspace(1, 0, nf) ** 1.5; mix *= fo[:, None]
mix /= np.abs(mix).max() * 1.05
x = np.tanh(mix * 1.15) / np.tanh(1.15)
with wave.open('music_raw.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32000).astype(np.int16).tobytes())
print('ok')
