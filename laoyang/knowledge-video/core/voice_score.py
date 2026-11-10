#!/usr/bin/env python3
"""配音的「听感」量化：音高起伏、力度起伏、停顿、语速。只用 numpy + ffmpeg。
用途：① 配音实验对比；② 表现力增强版「抽卡」——同一句配几遍，自动挑起伏最自然的一遍（gen_vo_volc v3）；
      ③ 出片报告里的「配音平不平」体检（全片音高起伏低于门槛就提醒）。
python3 core/voice_score.py a.mp3 [b.mp3 …]   → 每个文件一行 JSON
指标（都按「有声帧」算）：
  f0_med  音高中位数 Hz          f0_range_st  音高活动范围（5%–95% 分位，半音）← 平调 3–5，自然口播 7–11，夸张 >13
  f0_sd_st 音高标准差（半音）      en_range_db  力度范围（10%–90% 分位，dB）
  pause_n / pause_sec 句内停顿（≥0.18s 的静音）个数和总长；voiced_ratio 有声占比；dur 总长
  end_st  句尾走向：最后 0.35s 有声段的音高均值 − 全句中位数（半音；问句应为正，收束句为负）"""
import json, subprocess, sys
import numpy as np

SR = 16000


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def f0_track(x, fmin=65.0, fmax=380.0, frame=0.040, hop=0.010, thr=0.18):
    """YIN（累积均值归一化差函数）。返回 (f0 数组，无声为 0；每帧 RMS dB)。"""
    N, H = int(frame * SR), int(hop * SR)
    if len(x) < N + H:
        return np.zeros(0), np.zeros(0)
    n = 1 + (len(x) - N) // H
    idx = np.arange(N)[None, :] + H * np.arange(n)[:, None]
    fr = x[idx]
    rms = np.sqrt((fr ** 2).mean(1) + 1e-12); db = 20 * np.log10(rms + 1e-9)
    tmin, tmax = int(SR / fmax), min(int(SR / fmin), N // 2)
    W = N - tmax
    a = fr[:, :W]
    # d(tau) = sum (a_j - b_{j+tau})^2 = E0 + E(tau) - 2*corr(tau)
    nfft = 1 << int(np.ceil(np.log2(N + W)))
    A = np.fft.rfft(a, nfft, axis=1); B = np.fft.rfft(fr, nfft, axis=1)
    corr = np.fft.irfft(np.conj(A) * B, nfft, axis=1)[:, :tmax + 1]
    cs = np.concatenate([np.zeros((n, 1)), np.cumsum(fr ** 2, axis=1)], axis=1)
    taus = np.arange(tmax + 1)
    E = cs[:, taus + W] - cs[:, taus]
    d = E[:, :1] + E - 2 * corr
    d[:, 0] = 0
    cm = np.cumsum(d[:, 1:], axis=1) / np.arange(1, tmax + 1)[None, :]
    cmnd = np.concatenate([np.ones((n, 1)), d[:, 1:] / (cm + 1e-12)], axis=1)
    f0 = np.zeros(n)
    gate = db > (np.percentile(db, 95) - 35)
    for i in np.nonzero(gate)[0]:
        c = cmnd[i]; t = tmin
        while t < tmax and not (c[t] < thr and c[t] <= c[t + 1 if t + 1 <= tmax else t]):
            t += 1
        if t >= tmax:
            continue
        while t + 1 <= tmax and c[t + 1] < c[t]:
            t += 1
        if 0 < t < tmax:  # 抛物线插值
            y0, y1, y2 = c[t - 1], c[t], c[t + 1]; den = y0 - 2 * y1 + y2
            t = t + (0.5 * (y0 - y2) / den if abs(den) > 1e-12 else 0)
        f0[i] = SR / t
    # 去跳八度的野点：与邻域中位数差 > 7 半音的丢掉
    v = np.nonzero(f0 > 0)[0]
    if len(v) > 5:
        st = 12 * np.log2(f0[v])
        med = np.array([np.median(st[max(0, j - 4): j + 5]) for j in range(len(v))])
        f0[v[np.abs(st - med) > 7]] = 0
    return f0, db


def score(path):
    x = load(path)
    if len(x) < SR * 0.3:
        return {"file": path, "dur": round(len(x) / SR, 2), "err": "太短"}
    f0, db = f0_track(x)
    hop = 0.010; v = f0 > 0
    if v.sum() < 10:
        return {"file": path, "dur": round(len(x) / SR, 2), "err": "没有有声帧"}
    st = 12 * np.log2(f0[v] / 100.0)
    loud = db > (np.percentile(db, 95) - 30)
    # 停顿：首尾之外，连续静音 ≥ 0.18s
    on = np.nonzero(loud)[0]; a, b = on[0], on[-1]; pauses = []; run = 0
    for i in range(a, b + 1):
        if not loud[i]:
            run += 1
        else:
            if run * hop >= 0.18: pauses.append(run * hop)
            run = 0
    tail = np.nonzero(v)[0]; tail = tail[tail >= b - int(0.35 / hop)]
    end_st = float(np.mean(12 * np.log2(f0[tail] / 100.0)) - np.median(st)) if len(tail) >= 3 else 0.0
    return {"file": path, "dur": round(len(x) / SR, 2), "speech_sec": round((b - a + 1) * hop, 2),
            "f0_med": round(float(100 * 2 ** (np.median(st) / 12)), 1),
            "f0_range_st": round(float(np.percentile(st, 95) - np.percentile(st, 5)), 2),
            "f0_sd_st": round(float(np.std(st)), 2),
            "en_range_db": round(float(np.percentile(db[loud], 90) - np.percentile(db[loud], 10)), 2),
            "pause_n": len(pauses), "pause_sec": round(float(sum(pauses)), 2),
            "voiced_ratio": round(float(v.sum() / max(1, b - a + 1)), 2), "end_st": round(end_st, 2)}


if __name__ == "__main__":
    for p in sys.argv[1:]:
        print(json.dumps(score(p), ensure_ascii=False))
