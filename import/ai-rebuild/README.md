# AI 重构系列（老杨魔方，无旁白卡点动画）

15 期，每期一个两字关键词。要素固定，动画形式每期不同：

- 近黑底
- 四角取景框和时间码
- 白色粗黑体大字
- 彩虹光球：光球在大字前后穿插（先画字后面的球，再画字，最后画字前面的球）
- 标签行和「问题」栏
- 120 BPM 电子乐
- 标准粒子署名

| 期 | 目录 | 大字 | 动画形式 |
|---|---|---|---|
| 01 | `01-rebuild/` | 重构 | 魔方层转 → 炸散 → 三叶结 → 时间轴螺旋 → 三层光环 |

## 01「重构」（32 秒）

- **画面**：`scene.js`，`render(ctx, t)` 是时间 t 的纯函数，随机数用 `rng(seed)`
- **配乐**：`audio.py`，用 numpy 和 scipy 合成，响度两遍归一到 −14 LUFS
- **拍点**：
  - 4 秒鼓进
  - 4、5、6、7 秒魔方各拧一层
  - 7.5 秒抽空，8 秒 drop
  - 12 秒进入历史段
  - 19.5 秒抽空，20 秒 drop
  - 22、24、26 秒三层依次点亮
  - 28 秒尾声
- **事实**：Paul A. David, "The Dynamo and the Computer", AER P&P, 1990
  - 第一座中心发电站：1881 年
  - 四十年后，美国工厂机械动力里才有一半多改用电力
  - 1919–1929 年，美国制造业全要素生产率增速比前十年快了约 5 个百分点

```bash
cd import/ai-rebuild/01-rebuild
python3 audio.py                                   # → mix.wav
for i in 0 1 2 3; do python3 render.py frames $i 4 & done; wait   # → frames/
ffmpeg -framerate 30 -i frames/f%05d.jpg -i mix.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest out.mp4
python3 render.py test 8.2,20.4,27   # 单帧检查
```

字体：Noto Sans CJK SC（Regular / Bold / Black），DejaVu Sans Mono。
