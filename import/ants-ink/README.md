# 墨蚁 · 为什么不开除它们？（老杨魔方 · 管理定律，40 秒，无旁白）

宣纸水墨风。蚁群是一笔书法：窝那头浓墨，笔锋化开成一只只蚂蚁；闲着的四成是淡墨。中段蚂蚁走出来排成铺满整屏的方阵（无限画布推拉镜头），用列队动作演示两个实验，再分屏对比「全员在岗」和「留着闲的」。

- 审美标准见项目文档《管线/艺术表现审美标准》（第 12 条：开场先密到极致；第 13 条：生物动作必须真实模拟）。
- `sim.js`：确定性的群体行为模拟（走走停停、相关随机游走、沿信息素路径往返、相遇碰触角、避让、三足步态按路程推进），页面加载时预算每一帧，render 只查表。
- 文件按顺序拼成一个脚本：`cat ink_head.js sim.js ink_text.js ink4_main.js > ink2.js`
- `audio_ink.py`：古筝式拨弦（加法合成）+ 水滴 + 爬行沙沙声 + 踏步鼓点 + 低鼓，D 宫五声，−14 LUFS → `mix_ink.wav`
- 渲染：`for i in 0 1 2 3; do python3 ink2_render.py frames $i 4 & done; wait`，再用 ffmpeg 合成。

事实：Charbonneau, Sasaki & Dornhaus, PLOS ONE 2017；Hasegawa et al., Scientific Reports 2016。
