"""python 版 scripts/audio-bands.mjs：逐帧 low/mid/high 能量 → bands.json"""
import wave, json, numpy as np, sys
w = wave.open(sys.argv[1]); sr = w.getframerate(); ch = w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
x = x.reshape(-1, ch).mean(1)
def onepole(sig, cut):
    a = 1 - np.exp(-2 * np.pi * cut / sr)
    from scipy.signal import lfilter
    return lfilter([a], [1, -(1 - a)], sig)
lo = onepole(onepole(x, 150), 150); mid = onepole(x, 2000) - onepole(x, 200); hi = x - onepole(x, 5000)
fps = 30; hop = sr / fps; n = int(np.ceil(len(x) / hop)); idx = (np.arange(len(x)) // hop).astype(int)
out = []
for s in (lo, mid, hi):
    acc = np.bincount(idx, s * s, n); cnt = np.bincount(idx, None, n)
    rms = np.sqrt(acc / np.maximum(1, cnt)); ref = np.sort(rms)[int(n * 0.98)] or 1
    env = 0; e = []
    for v in rms:
        q = min(1, v / ref) ** 0.7
        env = q if q > env else env * 0.78 + q * 0.22
        e.append(round(float(env), 3))
    out.append(e)
json.dump({'fps': fps, 'frames': [[out[0][k], out[1][k], out[2][k]] for k in range(n)]}, open(sys.argv[2], 'w'))
print('frames', n)
