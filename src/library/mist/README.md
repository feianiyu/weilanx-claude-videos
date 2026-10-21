# 彩雾粒子 `mist/`

上万颗彩色粒子聚成的一团烟雾：大块模糊色雾 + 细密粒子簇 + 被拉长的碎片 + 弧形卷须 + 若隐若现的白色光网。
它跟着配乐呼吸、流动、闪烁，也能被一张事件表驱动做出**瞬间爆炸**、**瞬间收缩**、**扭转拉伸**三种高张力动作。
任何一期都可以把它当背景、转场或高潮画面来用（竖屏横屏都行，透明底可叠在别的画面上）。

预览：Studio 里的 `library-color-mist`（暖灰彩雾）、`-jade`（老杨魔方深色）、`-ember`（深夜冷艳），24 秒演完全部玩法。

## 三步接进一期

```tsx
import {ColorMist} from '../../library/mist/ColorMist';
import {makeDrive, type Bands} from '../../library/mist/drive';
import bands from './bands.json'; // 第 1 步生成

// 第 2 步：写驱动 —— 配乐能量 + 动作事件表（帧号）
const drive = makeDrive({
  bands: bands as Bands,
  curve: [2.2, 1.4, 1.6], // 指数 > 1：只有强拍顶到 1，鼓点更分明
  burst: [{from: 360, attack: 3, hold: 6, release: 90}], // 第 360 帧炸开，3 秒慢慢聚回
  contract: [{from: 330, attack: 3, hold: 24, release: 3}], // 炸之前 1 秒吸成一个亮核
  twist: [{from: 480, attack: 120, release: 4, ease: 'in'}], // 越拧越紧
});

// 第 3 步：放进画面
<ColorMist f={frame} drive={drive} palette="jade" seed={7} y={880} />
```

1. 生成配乐能量：`node scripts/audio-bands.mjs public/audio/<期>/mix.wav src/episodes/<期>/bands.json`（任意 16-bit wav，逐帧低 / 中 / 高三段）
2. 动作事件：`attack` 2–4 帧就是「瞬间」，`release` 越长回来得越慢；多个事件取最大值
3. 不想跟音乐走，可以不传 `bands`，自己按帧写 `low / mid / high`

## 参数

| 参数 | 说明 |
|---|---|
| `drive(f)` | 每帧返回 `{low, mid, high, burst, contract, twist}`，都在 0–1；组件会多取 `f-1` 画拖尾 |
| `palette` | `ruby` 暖灰底 + 红品红钴蓝青绿金 / `jade` 近黑底 + 品牌绿金 / `ember` 深夜底 + 橙红玫红紫冰蓝；也可传自定义 `MistPalette` |
| `seed` | 换一团形态（团块位置、碎片方向、卷须弧度、光网都跟着变）；同一个 seed 永远一样 |
| `x` `y` `scale` | 团中心和大小（`scale` 1 ≈ 半径 400px） |
| `density` | 粒子数倍数（1 ≈ 1.3 万颗）；横屏或做背景时可降到 0.6 提速 |
| `background` | `false` 时透明，只画雾和粒子，可以叠在文字、照片上 |
| `fringe` | 色散强度（爆炸、扭转时自动加强） |

## 每种能量 / 动作的效果

| 输入 | 画面 |
|---|---|
| `low` | 整团呼吸胀缩、色雾变亮（接底鼓 / 贝斯） |
| `mid` | 粒子流动的幅度（接和弦 / 铺底） |
| `high` | 白色光网和星点闪烁（接踩镲 / 铃音） |
| `burst` | 粒子沿径向甩满全屏，拖尾 + 色散 + 核心闪光，光网先熄灭 |
| `contract` | 全部吸进一个亮核，核里轻微抖动，地面阴影缩小 |
| `twist` | 内圈快外圈慢地扭转，纵向拉长，卷须甩出弧线 |

## 注意

- 每帧要算一万多颗粒子（拖尾时算两遍），渲染比普通画面慢；Studio 预览卡顿时先把 `density` 调到 0.5。
- 爆炸峰值会让整屏变亮，导出前用 `signalstats` 查相邻帧亮度跳变（< 20）。
- 视觉语言参考了「数字雕塑」一类彩色粒子烟雾作品，粒子团完全由代码随机生成，不复刻任何具体作品。
