"""幽灵堵车配乐 + 音效（numpy）→ music_raw.wav"""
import numpy as np, wave
SR = 44100; DUR = 38.0; N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)
BPM = 120; B = 60 / BPM

def put(sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[:N - i]
    L[i:i + len(s)] += s * g * (1 - pan); R[i:i + len(s)] += s * g * (1 + pan)
def note(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def kick(g=1):
    t = tt(0.42); f = 45 + 115 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * g
def snare():
    t = tt(0.22); return rng.standard_normal(len(t)) * np.exp(-t * 20) * 0.55 + np.sin(2 * np.pi * 200 * t) * np.exp(-t * 28) * 0.4
def hat(dec=45):
    x = np.diff(rng.standard_normal(int(0.07 * SR)), prepend=0); return x * np.exp(-np.arange(len(x)) / SR * dec) * 0.28
def pluck(m, d=0.32, br=1.0):
    t = tt(d); f = note(m)
    return sum((1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (7 + k * 3 / br)) for k in range(1, 7)) * np.minimum(1, t / 0.003)
def bass(m, d):
    t = tt(d); f = note(m)
    return np.tanh(2.0 * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t))) * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.03)
def pad(ms, d, g=1):
    t = tt(d); s = sum(np.sin(2 * np.pi * note(m) * t + 0.3 * np.sin(t * 0.8 + m)) for m in ms) / len(ms)
    return s * np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.6) * g
def piano(m, d=2.4):
    t = tt(d); f = note(m)
    return sum((0.6 ** k) * np.sin(2 * np.pi * f * (k + 1) * t) * np.exp(-t * (1.3 + 0.9 * k)) for k in range(6)) * np.minimum(1, t / 0.004)
def lp_noise(d, f0, f1, rise=True):
    n = int(d * SR); x = rng.standard_normal(n); fc = np.geomspace(f0, f1, n)
    a = 1 - np.exp(-2 * np.pi * fc / SR); out = np.zeros(n); y = 0.
    for i in range(n): y += a[i] * (x[i] - y); out[i] = y
    e = (np.arange(n) / n) ** 2 if rise else (1 - np.arange(n) / n) ** 2
    return out * e
def squeal(d=0.7, f=3200):
    t = tt(d); fm = f * (1 + 0.02 * np.sin(2 * np.pi * 37 * t)) * (1 - 0.12 * t / d)
    s = np.sin(2 * np.pi * np.cumsum(fm) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(fm * 1.5) / SR)
    s += rng.standard_normal(len(t)) * 0.15
    return s * np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.15) * 0.5
def horn(d=0.45):
    t = tt(d); s = 0
    for f in (415, 523):
        ph = 2 * np.pi * f * t + 0.4 * np.sin(2 * np.pi * 5 * t)
        s = s + np.sign(np.sin(ph)) * 0.5 + np.sin(ph) * 0.3
    # 简单低通
    out = np.zeros_like(s); y = 0.
    for i in range(len(s)): y += 0.18 * (s[i] - y); out[i] = y
    return out * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05) * 0.5
def boom(d=2.2):
    t = tt(d); return np.sin(2 * np.pi * np.cumsum(36 + 60 * np.exp(-t * 12)) / SR) * np.exp(-t * 1.8)

MIN = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]   # Am F C G
MAJ = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [57, 60, 64]), (41, [57, 60, 65])]   # C G Am F

def groove(t0, t1, prog, drums=True, bassline=True, arp=True, g=1.0, half=False, hat16=False):
    t = t0; bar = 0
    while t < t1 - 1e-6:
        root, ch = prog[bar % 4]
        seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[2]]
        for k in range(8):
            tb = t + k * B / 2
            if tb >= t1: break
            if arp: put(pluck(seq[k] + 12, 0.28), tb, 0.12 * g, pan=0.3 * np.sin(k * 1.3))
        for k in range(4):
            tb = t + k * B
            if tb >= t1: break
            if drums:
                if not half or k % 2 == 0: put(kick(), tb, 0.8 * g)
                if (k % 2 == 1 and not half) or (half and k == 2): put(snare(), tb, 0.42 * g)
                nh = 4 if hat16 else 2
                for h in range(nh): put(hat(), tb + h * B / nh, 0.17 * g, pan=0.4)
            if bassline:
                put(bass(root - 12, B * 0.85), tb, 0.22 * g); put(bass(root - 12, B * 0.4), tb + B / 2, 0.14 * g)
        t += 4 * B; bar += 1

def stab(ch, g=1.0):
    return sum(pluck(m + 12, 0.35, 1.4) for m in ch) / len(ch) * g
def riser(d):
    return lp_noise(d, 300, 9000)

# 0–3.5 钩子：琶音 + 轻鼓
groove(0.0, 3.5, MIN, bassline=False, g=0.8)
put(pad([45, 52, 57], 3.6, 1), 0.0, 0.1)
put(riser(1.4), 2.1, 0.3)
# 3.5–4 抽空（吸成核）
put(tick := (np.sin(2 * np.pi * 2000 * tt(0.06)) * np.exp(-tt(0.06) * 60)), 3.5, 0.2)
# 4 DROP 1
put(boom(1.8), 4.0, 0.9); put(snare(), 4.0, 0.5); put(squeal(0.4, 2400), 4.0, 0.05)
groove(4.0, 7.0, MIN, g=1.0, hat16=True)
# 7–13 快切：每秒一个 stab
groove(7.0, 13.0, MIN, g=0.9)
for k in range(6):
    ch = MIN[k % 4][1]
    put(stab(ch, 0.9), 7.0 + k, 0.35); put(kick(1.1), 7.0 + k, 0.4)
# 13–16 风雨：扭转，嘈杂后平静
groove(13.0, 16.0, MIN, arp=False, half=True, g=0.85)
put(lp_noise(2.4, 3000, 400, rise=False), 13.0, 0.25)
# 16–19.5 膨胀：上扬
groove(16.0, 19.5, MIN, bassline=True, g=0.85, hat16=True)
put(riser(3.4), 16.1, 0.35)
put(pad([45, 52, 57, 64], 3.5, 1), 16.0, 0.12)
# 19.5–20 收缩 / 静
# 20 DROP 2
put(boom(2.0), 20.0, 0.95); put(snare(), 20.0, 0.5)
groove(20.0, 27.0, MAJ, g=1.0, hat16=True)
for k in range(14): put(pluck(76 + (k % 5) * 2, 0.22, 1.3), 20.1 + k * 0.25, 0.1, pan=-0.6 + 0.09 * k)
# 27–31 冯友兰：抽走鼓
groove(27.0, 31.0, MAJ, drums=False, g=0.8)
put(pad([48, 55, 60, 64], 4.2, 1), 27.0, 0.12)
# 31–38 落点 + 问题
groove(31.0, 35.0, MAJ, g=0.85)
put(boom(1.6), 35.0, 0.5)
groove(35.0, 38.0, MAJ, drums=False, g=0.7)
put(pad([48, 55, 60, 67], 3.0, 1), 35.0, 0.12)

# 混响 + 总线
irn = int(1.4 * SR); ir = rng.standard_normal(irn) * np.exp(-np.arange(irn) / SR * 3.5); ir /= np.abs(ir).sum() / 6
def conv(x):
    m = len(x) + irn; F = 1 << int(np.ceil(np.log2(m)))
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(ir, F), F)[:len(x)]
L = L + 0.22 * conv(L); R = R + 0.22 * conv(R)
fo = np.ones(N); nf = int(1.3 * SR); fo[-nf:] = np.linspace(1, 0, nf) ** 1.5
L *= fo; R *= fo
pk = max(np.abs(L).max(), np.abs(R).max()); L /= pk * 1.1; R /= pk * 1.1
x = np.tanh(np.stack([L, R], 1) * 1.3) / np.tanh(1.3)
with wave.open('music_raw.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32000).astype(np.int16).tobytes())
print('ok')
