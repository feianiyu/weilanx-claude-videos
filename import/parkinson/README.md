# 帕金森定律 · 彩雾 + 电子乐（40 秒竖屏，无旁白）

《给你一周做的事，为什么总拖到最后一天？》。画面主角是素材库的彩雾 `src/library/mist`，配乐是同期合成的 120 BPM 电子曲，彩雾按配乐逐帧的低 / 中 / 高能量呼吸，两次 drop 炸开。

这一期没走 Remotion（制作时 npm 源连不上），而是把 `ColorMist.tsx` / `drive.ts` 去掉类型、原样移植到独立 canvas 管线（和 `import/fish/` 同一套 Playwright 逐帧渲染）。以后能装依赖时，可以照 `timeline.ts` 改写成正式的 `src/episodes/ep54-parkinson/`。

| 时间 | 段落 |
|---|---|
| 0–3 | 钩子：空方框 + 一小团彩雾 +「给你一周做的事 / 为什么总拖到最后一天？」 |
| 3–8 | 周一到周日逐天推进，彩雾越胀越淡、塞满方框 |
| 8–10 | 截止日：金色方框收紧，彩雾被挤压、吸成亮核；10 秒 drop 炸开 |
| 10–16 | 「真正干活 / 只要这一点时间」→「帕金森定律 · 1955」 |
| 16–24 | 一团分成 2、4、8 团：「人手 ×8 / 产出 ×1」，核越来越暗 |
| 24–30 | 英国海军 1914→1928：军舰少了约 2/3，海军部官员 2000→3569（+78%） |
| 30–32 | 再被框住、吸成核；32 秒 drop 2，在边界里炸亮 |
| 32–40 |「管理者真正要给的 / 不是时间，是边界」→「你最近拖得最久的一件事 / 是什么？」→ 彩色粒子聚成底部小署名再散开 |

## 文件

- `audio.py`：配乐（numpy / scipy 合成，两遍 loudnorm 到约 −14.7 LUFS、真峰值 ≤ −3 dBFS）→ `public/audio/ep54-parkinson/mix.wav`
- `bands.json`：`node scripts/audio-bands.mjs public/audio/ep54-parkinson/mix.wav import/parkinson/bands.json`
- `drive.js` / `ColorMist.js`：素材库彩雾去类型后的移植（Node 22 `module.stripTypeScriptTypes`），画法未改
- `scene.js`：画面（方框、日历条、军舰与官员点阵、文字、片尾署名）；`timeline.ts`：时间表与一手事实
- `build.py` → `ep54.html`；`render.py`：`python3 render.py test 10,32`、`python3 render.py frames k 4`、`python3 render.py range a b`

亮度：drop 帧按 signalstats 实测逐帧限亮（`DIM` / `DIM2` 表），相邻帧 YAVG 跳变 < 18。

事实来源：C. N. Parkinson, "Parkinson's Law", *The Economist*, 1955-11-19（开篇句；1914→1928 海军部官员 2000→3569，+78.45%；军舰少了三分之二）。
