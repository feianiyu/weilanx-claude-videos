#!/usr/bin/env python3
"""老杨魔方 · 电影感品牌片头（4.0 秒，竖屏 1080x1920，30fps）
AI 镜头（Flowith 可灵：光粒汇聚 → 中心闪光）+ 代码精确定版 logo + 按节拍设计的音效。
用法：python3 compose.py <AI 镜头.mp4> <AI 镜头里闪光那一刻的秒数> <输出.mp4>
"""
import sys, os, subprocess, numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

SRC, FLASH_SRC, OUT = sys.argv[1], float(sys.argv[2]), sys.argv[3]
W, H, FPS, T, HIT = 1080, 1920, 30, 4.0, 2.4      # HIT = 片头里闪光 / logo 落定的时刻
N = int(T * FPS); D = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(D, "_frames"); os.makedirs(TMP, exist_ok=True)

# ---------- 取 AI 镜头帧：闪光对齐到 HIT ----------
off = FLASH_SRC - HIT                       # 片头 t 对应镜头 t+off
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(max(0, off)), "-i", SRC, "-t", str(T + 0.2),
                "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}", f"{TMP}/s_%04d.png"], check=True)
srcs = sorted(f for f in os.listdir(TMP) if f.startswith("s_"))
lead = int(round(max(0, -off) * FPS))      # 镜头比片头短时，开头补黑

def src_frame(i):
    j = i - lead
    if j < 0: return Image.new("RGB", (W, H), (0, 0, 0))
    return Image.open(f"{TMP}/{srcs[min(j, len(srcs) - 1)]}").convert("RGB")

L = {k: Image.open(f"{D}/L_{k}.png").convert("RGBA") for k in "ctsl"}
# 底：深色 + 绿色径向光（和定版帧一致）
yy, xx = np.mgrid[0:H, 0:W]; r = np.sqrt(((xx - W / 2) / (W * .6)) ** 2 + ((yy - H * .44) / (H * .38)) ** 2)
glow = np.clip(1 - r, 0, 1) ** 1.6
BASE = np.stack([4 + 18 * glow, 6 + 52 * glow, 5 + 30 * glow], -1).astype(np.float32)
VIG = np.clip(1.25 - 0.55 * np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2), 0.35, 1)[..., None].astype(np.float32)
rng = np.random.default_rng(7)
ease = lambda u: 1 - (1 - min(max(u, 0), 1)) ** 3
back = lambda u: (lambda x: 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2)(min(max(u, 0), 1))   # 带回弹

def grade(im, t):
    a = np.asarray(im).astype(np.float32)
    lum = a.mean(-1, keepdims=True)
    a = lum + (a - lum) * 0.8                                    # 轻降饱和
    a[..., 1] *= 1.06; a[..., 2] *= 0.95                         # 偏绿
    a = np.clip((a - 10) * 1.12, 0, 255)                         # 压黑、提反差
    return a

def paste(canvas, layer, alpha, scale=1.0, dy=0.0, sx=1.0):
    if alpha <= 0.002: return
    layer = layer.copy(); lw, lh = layer.size
    if scale != 1.0 or sx != 1.0:
        layer = layer.resize((max(1, int(lw * scale * sx)), max(1, int(lh * scale))), Image.LANCZOS)
    a = layer.split()[3].point(lambda v: int(v * alpha)); layer.putalpha(a)
    canvas.alpha_composite(layer, ((W - layer.size[0]) // 2, int((H - layer.size[1]) // 2 + dy)))

for i in range(N):
    t = i / FPS
    push = 1.0 + 0.06 * (t / T)                                   # 全程缓推
    bg = grade(src_frame(i), t)
    post = min(max((t - HIT) / 0.5, 0), 1)                        # 闪光后 AI 镜头压暗，让位给 logo
    bg = bg * (1 - 0.9 * post) + BASE * post
    # 闪光：HIT 前 0.1s 升，后 0.45s 落
    fl = np.exp(-((t - HIT) / 0.05) ** 2) if t < HIT else np.exp(-(t - HIT) / 0.11)
    bg = bg * (1 - 0.35 * fl) + fl * np.array([150, 255, 200], np.float32) * 0.55
    # 横向变形镜头光条
    if abs(t - HIT) < 0.6:
        s = np.exp(-abs(t - HIT) / 0.18)
        band = np.exp(-((yy - H * .44) / 7.0) ** 2) * np.exp(-((xx - W / 2) / (W * .55)) ** 2)
        bg = bg + (s * band)[..., None] * np.array([120, 255, 190], np.float32)
    bg = np.clip(bg * VIG, 0, 255)
    img = Image.fromarray(bg.astype(np.uint8)).convert("RGBA")
    # logo：HIT 落定（放大回弹 + 辉光），之后字标、副标、金线依次进
    if t >= HIT - 0.02:
        u = (t - HIT) / 0.38
        sc = 1.28 - 0.28 * back(u)
        gl = 1 + 1.6 * np.exp(-(t - HIT) / 0.25)
        glow_l = L["c"].filter(ImageFilter.GaussianBlur(26))
        paste(img, glow_l, min(1, ease(u * 2)) * min(1, 0.55 * gl), sc * 1.02)
        paste(img, L["c"], min(1, ease(u * 2.5)), sc)
    if t >= HIT + 0.35:
        u = (t - HIT - 0.35) / 0.35; paste(img, L["t"], ease(u), 1.0, 26 * (1 - ease(u)))
    if t >= HIT + 0.6:
        u = (t - HIT - 0.6) / 0.3; paste(img, L["s"], ease(u), 1.0, 14 * (1 - ease(u)))
    if t >= HIT + 0.75:
        u = (t - HIT - 0.75) / 0.28; paste(img, L["l"], ease(u), 1.0, 0, max(0.02, ease(u)))
    # 光扫：金属质感的一道斜光掠过 logo
    if HIT + 0.9 < t < HIT + 1.4:
        u = (t - HIT - 0.9) / 0.5; cx = -300 + 1700 * u
        m = np.exp(-(((xx - cx) + (yy - H * .44) * 0.5) / 40.0) ** 2) * (np.abs(yy - H * .44) < 260) * (np.abs(xx - W / 2) < 260)
        a = np.asarray(img).astype(np.float32); a[..., :3] = np.clip(a[..., :3] + m[..., None] * 110 * (a[..., 1:2] > 120), 0, 255)
        img = Image.fromarray(a.astype(np.uint8))
    img = img.convert("RGB")
    # 缓推 + 闪光时轻震
    shake = 9 * np.exp(-(t - HIT) / 0.12) if t >= HIT else 0
    dx, dy = (shake * np.sin(t * 91), shake * np.cos(t * 77)) if shake > .3 else (0, 0)
    zw, zh = int(W / push), int(H / push)
    x0, y0 = int((W - zw) / 2 + dx), int((H - zh) / 2 + dy)
    img = img.crop((x0, y0, x0 + zw, y0 + zh)).resize((W, H), Image.LANCZOS)
    # 胶片颗粒
    a = np.asarray(img).astype(np.float32) + rng.normal(0, 5.5, (H, W, 1)).astype(np.float32)
    # 最后 0.12s 轻收
    a *= 1 - 0.25 * max(0, (t - (T - 0.12)) / 0.12)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(f"{TMP}/o_{i:04d}.png")

# ---------- 音效：按节拍设计（100 BPM，三拍机械拧动 → 加速 → 重击定版）----------
SR = 48000; n = int(T * SR); tt = np.arange(n) / SR; out = np.zeros(n, np.float32); R = np.random.default_rng(3)
def put(x, at, g=1.0):
    s = int(at * SR); e = min(n, s + len(x)); out[s:e] += x[:e - s] * g
def env(d, a=.003, k=12): u = np.arange(int(d * SR)) / SR; return (1 - np.exp(-u / a)) * np.exp(-u * k)
def click(p=1.0):
    u = np.arange(int(.16 * SR)) / SR
    return ((np.sin(2 * np.pi * 920 * p * u) + .55 * np.sin(2 * np.pi * 1480 * p * u)) * np.exp(-u * 48) + R.standard_normal(len(u)) * np.exp(-u * 90) * .35) * (1 - np.exp(-u * 1100))
# 底层：低频涌动 + 带通噪声上扬（0 → HIT）
u = tt / HIT; pre = tt < HIT
drone = np.sin(2 * np.pi * np.cumsum(38 + 14 * np.clip(u, 0, 1)) / SR) * np.clip(u, 0, 1) ** 1.5 * .5
noise = R.standard_normal(n).astype(np.float32)
from numpy.fft import rfft, irfft
def bandsweep(x, f0, f1):   # 简易：分段带通扫频
    y = np.zeros_like(x); seg = int(.05 * SR)
    for s in range(0, len(x), seg):
        f = f0 + (f1 - f0) * (s / len(x)); X = rfft(x[s:s + seg]); fr = np.fft.rfftfreq(len(x[s:s + seg]), 1 / SR)
        X *= np.exp(-((fr - f) / (f * .35)) ** 2); y[s:s + seg] = irfft(X, len(x[s:s + seg]))
    return y
riser = bandsweep(noise[:int(HIT * SR)], 300, 5200) * np.linspace(0, 1, int(HIT * SR)) ** 2.2 * 3.2
out[:len(riser)] += riser.astype(np.float32)
out += (drone * pre).astype(np.float32)
# 节拍：0.6 / 1.2 / 1.8（三拍拧动），2.05 / 2.22（加速），HIT 前 40ms 抽空
for at, p in [(.6, .9), (1.2, 1.0), (1.8, 1.12), (2.05, 1.22), (2.22, 1.34)]: put(click(p), at, .5)
cut = slice(int((HIT - .04) * SR), int(HIT * SR)); out[cut] *= 0.05
# 重击：Sub 下潜 + 金属锁扣 + 噪声冲击 + 混响尾
d = 1.6; u = np.arange(int(d * SR)) / SR
sub = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-u * 3) + 34) / SR) * np.exp(-u * 2.4)
metal = (np.sin(2 * np.pi * 1680 * u) * .45 + np.sin(2 * np.pi * 2520 * u) * .3 + np.sin(2 * np.pi * 3790 * u) * .15) * np.exp(-u * 9)
snap = R.standard_normal(len(u)) * np.exp(-u * 60) * .7
hit = (sub * 1.1 + metal * .55 + snap) * (1 - np.exp(-u * 900))
ir = R.standard_normal(int(1.2 * SR)) * np.exp(-np.arange(int(1.2 * SR)) / SR * 4.5) * .025
tail = np.convolve(metal * .5 + snap * .3, ir)[:len(u)]
put((hit + tail).astype(np.float32), HIT, 1.0)
# 字标落：低沉一记 + 短扫风；副标：轻；金线：清亮闪音
w = R.standard_normal(int(.35 * SR)); w = bandsweep(w, 1800, 600) * env(.35, .04, 7) * 2
put(w.astype(np.float32), HIT + .3, .5)
u = np.arange(int(.25 * SR)) / SR; put((np.sin(2 * np.pi * 90 * u) * np.exp(-u * 14)).astype(np.float32), HIT + .35, .6)
u = np.arange(int(1.0 * SR)) / SR
chime = (np.sin(2 * np.pi * 2637 * u) + .6 * np.sin(2 * np.pi * 3951 * u) + .3 * np.sin(2 * np.pi * 5274 * u)) * np.exp(-u * 4) * (1 - np.exp(-u * 300))
put(chime.astype(np.float32), HIT + .75, .22)
out = out / (np.abs(out).max() + 1e-9) * .89
out *= np.clip((T - tt) / .1, 0, 1)                                    # 尾 0.1s 收
st = np.stack([out, np.roll(out, 24) * .97], -1)                       # 轻微立体
wav = os.path.join(D, "_sfx.wav")
import wave
with wave.open(wav, "wb") as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", f"{TMP}/o_%04d.png", "-i", wav,
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=7", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", OUT], check=True)
print("ok", OUT)
