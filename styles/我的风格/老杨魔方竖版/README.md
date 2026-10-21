# 老杨魔方竖版（黑金光影风改造）

「老杨魔方 · 企业经营观察」的竖版知识解析动画：无旁白，靠大字、动画和音乐卡点讲清一个经营观点。由黑金光影风改造而来——保留它的「暗底 + 发光 + 粒子聚标题 + 重拍砸字」，把暖金烟雾换成品牌绿光，把横屏 16:9 改成竖屏 9:16，字体换成粗黑体 + 绿色宋体强调。

- 代码：`src/library/laoyang/`（`theme.ts` 色板字体与弹出动画、`brand.tsx` 品牌件、`stage.tsx` 舞台层、`charts.tsx` 图表）
- 样片 / 模板：`ep52-laoyang-template`（30 秒，古德哈特定律示例）；封面 `ep52-laoyang-template-cover`（9:16）、`-cover-34`（3:4）
- 配乐：`node audio/episodes/ep52-laoyang-template.mjs`，纯代码合成，不依赖授权曲目

## 视觉配方

| 项 | 规范 |
|---|---|
| 画幅 | 1080×1920，30 fps；主要内容放在 x 100–960、y 250–1560（抖音底部标题、右侧点赞栏） |
| 底 | #070908 近黑 + 2–3 团缓慢呼吸的绿光（`GlowBg`），金句段加一团金光；极淡的绿色网格 + 颗粒 |
| 主色 | 亮绿 #2BE08A（深底 logo、强调词、光）；金 #F5A623（副标、短横线、数字、圈注）；红 #FF6B5A 只给「被玩坏 / 划掉」 |
| 字体 | 正文粗黑体（Noto Sans CJK SC / 思源黑体，900）；强调词绿色宋体 700（`【】`）；副标宋体 500 灰 |
| 品牌 | 左上角常驻「立方体 + 老杨魔方 + 竖线 + 企业经营观察」；底部居中立方体（y≈1655，高 100，随底鼓脉动）；片尾署名组合（立方体 \| 老杨魔方 \| 企业经营观察 + 绿短线 + 灰细线，宽 840，低调、短停留） |
| 节奏 | BPM 120，一拍 15 帧；每拍或每两拍出一个新元素；底鼓驱动镜头微推和 logo 脉动 |
| 重拍 | 重拍前 0.7 秒画面收暗到 70%、最后 3 帧静止，重拍那一帧亮回 + 冲击波环 + 推镜；上一段的内容必须在收暗时淡完 |

## 一期的骨架（可替换）

钩子三句（0–4 秒）→ 重拍 1 粒子标题（4 秒）→ 01 现象：药丸标签依次弹出再被划掉 → 02 机制：一张图 → 重拍 2 金句 + 圈注 + 出处（20 秒）→ 片尾署名（26–30 秒）。
每期换一种「展示方式」（分屏切换 / 一镜到底 / 无限缩放），骨架和品牌件不动。

## 换题步骤

1. 复制 `src/episodes/ep52-laoyang-template/` 和 `audio/episodes/ep52-laoyang-template.mjs`，改成新期号
2. 改 `timeline.ts`：文案（`HOOK` / `GAMED` / `QUOTE`…）、拍号、`SHOTS`、`KICK_BEATS`；音频脚本里的 `BARS`、`KICK`、`SFX` 跟着改成同样的拍号
3. 改画面组件里各段用到的组件；自创框架、举例画面挂 `Illustrative`（「示意」）
4. `node audio/episodes/<期>.mjs` 生成 mix.wav，Studio 里预览，`npx remotion still` 抽帧检查重拍前后
5. 在 `src/Root.tsx` 的「10-老杨魔方竖版」里注册

## 组件速查

| 组件 | 用途 |
|---|---|
| `CubeLogo` | 立方体 logo，`draw` 0–1 可做笔画画出；深底亮绿、浅底传 `L.greenDeep` |
| `CornerMark` / `BottomCube` / `SignOff` | 左上角标 / 底部脉动 logo / 片尾署名组合 |
| `GlowBg` `GridLines` `Grain` `Camera` | 底、网格、颗粒、底鼓推镜 |
| `RichLine` | 一行大字，`【绿宋】〔金〕〖红〗` 标记，带回弹弹出 |
| `SparkTitle` | 绿金粒子聚成的标题 + 英文 + 金色副标 + 短横线 |
| `Pill` | 药丸标签，`state` 'strike' 划掉 / 'check' 打勾 |
| `Scribble` | 手绘金色圈注 |
| `ShockRing` | 重拍冲击波环 |
| `SectionTag` `NoteLine` `Illustrative` | 段落小标、出处小字、「示意」角标 |
| `DivergeChart` | 两条线分叉（数字在涨、效果在跌） |
