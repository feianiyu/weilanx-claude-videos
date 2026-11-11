#!/usr/bin/env python3
"""配音句尾体检：切好的每句 vo/vXX.mp3，最后 50ms 必须是静音。
还有声音 = 句尾的字被切掉了（服务端字结束时间偏早 → 按它切就吃字）。
用法：python3 core/check_vo_tail.py episodes/<期>   （有问题退出码 1；build.py 也会调它）"""
import glob, json, os, subprocess, sys
import numpy as np
SR = 24000


def dec(f):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout, dtype=np.float32)


def check(EP, quiet=False):
    bad = []
    for f in sorted(glob.glob(os.path.join(EP, "vo", "v*.mp3"))):
        k = os.path.basename(f)[:-4]; x = dec(f)
        if len(x) < SR // 2: continue
        h = int(0.01 * SR); n = len(x) // h; r = np.sqrt((x[:n * h].reshape(n, h) ** 2).mean(1) + 1e-12)
        speech = float(np.percentile(r, 90))
        if speech < 1e-3: continue   # 占位静音
        tail = float(r[-5:].max())
        if tail > 0.06 * speech: bad.append((k, round(tail / speech, 2)))
    if not quiet:
        print("配音句尾体检：", "全部干净" if not bad else "这些句子句尾还有声音（尾字可能被切）：" + "，".join(f"{k}（{v}）" for k, v in bad))
    return bad


if __name__ == "__main__":
    sys.exit(1 if check(os.path.abspath(sys.argv[1])) else 0)
