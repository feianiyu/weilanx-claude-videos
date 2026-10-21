# 水墨系列 · 小鱼动画（导入）

「老杨魔方 · 水墨系列」的三条竖屏短片源码。这里是原样导入的独立 HTML Canvas + Python 管线，还没有改写成本工程的 Remotion 结构。

| 片段 | CLIP | 时长 | 内容 |
|---|---|---|---|
| 放大镜与鱼群 | `A` | 14 秒 | 竖排小字 → 放大镜扫过 → 鱼群炸开、悬停、游散 → 一条绿鱼逆游 |
| 被扯开的格子 | `B` | 17.5 秒 | 一张 KPI 表，格线连同格子里的数字被慢慢扯散，镜头缓推 |
| 两鱼成缘 | `C` | 20.5 秒 | 满屏鱼群 → 混乱 → 散尽留白 → 两条鱼追尾荡开涟漪 → 诗句 |

三条共用：米白纸纹 + 一圈圈淡绿光晕的背景、顶部常驻小标识 `topIP()`、片尾鱼形笔画聚成小署名再散开的 `logoFX(ctx, t, {in0, form, out0})`。配乐是浏览器里用 Web Audio 现场合成的五声音阶拨弦 + 水滴（`SCORE`）。

## 文件

- `preview.html`：浏览器直接打开，点「播放」看动画、听配乐。画布 540×960。
- `render.html`：成片渲染页，内容同 `preview.html`，另外暴露 `window.__sihua`（`renderA/B/C`、`SCORE`、`offline()` 离线导出配乐），字体改用本机 Noto CJK。
- `render.py`：Playwright 驱动 `render.html` 出成片素材，1080×1920 / 30fps。

## 用法

```bash
# 静帧检查
CLIP=C python3 render.py test 1.0,10.5,17.5
# 逐帧渲染（开 3 个进程，分别传 0 / 1 / 2）
CLIP=C python3 render.py frames 0 3
# 离线导出配乐 → bgm_raw_C.pcm（44.1kHz s16le 立体声）
CLIP=C python3 render.py audio

ffmpeg -f s16le -ar 44100 -ac 2 -i bgm_raw_C.pcm bgm_raw_C.wav
ffmpeg -i bgm_raw_C.wav -af "volume=10dB,alimiter=limit=0.68:level=false,afade=t=out:st=19.5:d=1" bgm_norm_C.wav
ffmpeg -framerate 30 -i frames_C/f%05d.jpg -i bgm_norm_C.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest out.mp4
```

依赖：Python 3 + `playwright`（用本机 Chromium）、ffmpeg、系统里装有 Noto Serif / Sans CJK SC。渲染产生的 `frames_*`、`*.pcm`、`*.wav`、`*.mp4` 不要提交。

## 说明

- 动画是时间 `t` 的纯函数，随机数用 `rng(seed)`，同一时刻渲染结果固定。
- 「示意文字」模式只是占位，正式片段用的是「老杨文案」模式（`mode = 1`）。
- 片尾 logo 是「老杨魔方」标准版浅底深绿图形，以 base64 内嵌在 HTML 里。
- 诗句「众里寻他千百度，蓦然回首，那人却在，灯火阑珊处」出自辛弃疾《青玉案·元夕》（公有领域）。
