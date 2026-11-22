# 给 Claude：底图新增一档调色 look（老杨 2026-11-22 16:54 同意转交）

## 起因
老杨看了抖音「宏观棱镜」的画面：图片色调统一、对比度不高，整片很和谐。希望老杨魔方的底图也这样处理。现有 `look: "muted"`（saturate .4 / contrast 1.06 / brightness .95）方向对，但少了统一的冷灰色调，而且对比反而略加了。

## 需求（Hark 不改 core，请 Claude 在 core 加）
在 `core/shell_deep.html` 加一档 `look: "cool"`（名字可定），lines.json 写 `"look": "cool"` 时生效：
1. 底图滤镜：`saturate(.38) contrast(.9) brightness(.95)`——降饱和、**降**对比；
2. 抬黑压白：暗部不死黑、亮部不过曝（相当于 levels 输出 8%–88%）；
3. 统一冷灰色调：在底图上叠一层 `#1b2a36`，`mix-blend-mode: soft-light`（不同照片据此变成同一色系）；
4. 压暗渐变沿用 muted 的 `#shade`；不加颗粒；
5. 橙色 #F5A623、浅绿 #7FDDA4 等图形与文字不受滤镜影响（滤镜只作用在 .bgl 上）。

沙箱预览样（ImageMagick 近似）：`-modulate 92,38,100 +level 8%,88%`，再 soft-light 叠 `#1b2a36`，再压暗 0.55–0.70。老杨看过的预览即这一套。

## 本期
EP.34 当前仍用默认 muted；core 加好后，本期 lines.json 加 `"look": "cool"` 重渲即可（底图 Pexels 29566897 整排新车，dim 0.8）。之后各期默认用这一档，老杨同意的话写进 STANDARD。
