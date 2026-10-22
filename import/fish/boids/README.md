# 鱼群三规则（Boids）· 深海版

《几千条鱼没有领导，为什么从不撞车？》40 秒竖屏成片的源码。

- `boids.html`：渲染页（`helpers.js` + `main3.js` 拼成，字体用本机 Noto CJK）。浏览器打开后调用 `window.__boids.render(ctx, t)` 画任意时刻。
- `main3.js`：
  - 真实 Boids 模拟：约 1500 条鱼，分离 / 对齐 / 聚合三条规则，空间网格加速，确定性随机数；页面加载时一次算完所有帧。
  - 时间变速 `WARP`：画面时间 → 模拟时间，做出鲨鱼段的"慢-快-慢"。
  - 同一批个体换演员：鱼 → 光点 → 鸟群 → 蝙蝠群 → 鱼环（`flockPos` + `bird` / `bat` / `silverFish`）。
  - 画面：深海渐变 + 金色光柱 + 悬浮颗粒；鱼鳞随朝向反光；满屏鱼墙用相机推近实现。
  - 配乐 `offlineAudio`：Web Audio 离线合成（琶音、低频轰鸣、重击、风声、代码提示音）。
- `render.py`：`python3 render.py test 0,13.4`（静帧）、`python3 render.py frames k 4`（4 进程逐帧）、`python3 render.py audio`、`python3 render.py range a b`（只重渲某段帧）。

合成：`ffmpeg -framerate 30 -i frames/f%05d.jpg -i bgm_norm.wav -c:v libx264 -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest out.mp4`（配乐先 `volume≈5.5dB, alimiter=limit=0.68`，约 -20 LUFS / -3.2 dBFS）。

史实：Craig Reynolds，SIGGRAPH 1987，《Flocks, Herds, and Schools: A Distributed Behavioral Model》；《蝙蝠侠归来》（1992）的蝙蝠群由 VIFX 用基于 Boids 的软件制作。画面只画蝙蝠剪影，不出现任何电影形象或标志。
