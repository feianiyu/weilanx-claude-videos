# 霓虹彩雾版（shaderfx）

「思想可见」的固定管线之一。画面分三层：彩雾粒子负责冲击，Paper Shaders 着色器背景负责空间，TextFX 字卡负责节奏。
标准样片：《反者道之动》新版 15 秒（`examples/fan-zhe-dao-zhi-dong/`）。

## 目录
| 文件 | 作用 |
|---|---|
| `shaderbg.js` | 自写 WebGL2 运行器。`new ShaderBG(frag, w, h)`，然后 `.set(params)` / `.render(t)`。render(t) 是时间的纯函数，可以逐帧精确出图 |
| `lib/` | paper-design/shaders 源码（Apache-2.0，TS 去类型），协议见 `LICENSE-paper-shaders` |
| `textfx.js` | 6 种字卡：splitPop 逐字弹入 / decrypt 乱码解码 / shiny 流光扫过 / blurIn 模糊聚焦 / echo 重影回声 / trueFocus 焦点切换。效果种类参考 React Bits，代码自写 |
| `examples/fan-zhe-dao-zhi-dong/` | 样片全套：sample.js 画面 / sample.html（内联彩雾 drive + ColorMist + 配乐能量）/ music.py / bands.py / render_s.py |

彩雾组件本体在 `src/library/mist/`。

## 渲染
1. 在仓库根目录起服务：`python3 -m http.server 8766`。ES 模块必须走 http。
2. Chromium 启动参数：`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`。
3. `python3 render_s.py test 1.0,4.2`：出单帧检查。
4. `python3 render_s.py <shard> <总数>`：分片出全片。`list <文件>`：只补渲缺的帧。
5. 用 ffmpeg 合成画面，再用 master.sh 混音到 −14 LUFS。

## 规则
- 着色器在 540×960 渲染后放大。透明度 ≤ 0.01 的层不渲染，否则软件 WebGL 会很慢。
- 闪光、drop 的起亮至少拉长到 5–9 帧。相邻帧平均亮度跳变不超过 20，彩雾用逐帧 DIM 表压暗。
- 文字只放在 168–1330px 的安全带内，署名在 y≈212，右侧互动栏区域不放字。
- 一个镜头只用一种主背景。背景的选择见下表。

| 背景 | 用在 |
|---|---|
| smoke-ring 烟环 | 开场、「道」「无」「起点」 |
| god-rays 神光 | drop、揭示原文、反转 |
| neuro-noise 神经网 | 风、能量、思想流动 |
| mesh-gradient 柔和渐变 | 安静段、结尾 |
| swirl 旋涡 | 只用于旋转、漩涡类题材 |

| 字卡 | 用在 |
|---|---|
| decrypt 乱码解码 | 揭秘、原文登场 |
| shiny 流光扫过 | 解码后定格、确认 |
| splitPop 逐字弹入 | 卡点快切 |
| blurIn 模糊聚焦 | 解释句、白话翻译 |
| echo 重影回声 | 余韵、对句 |
| trueFocus 焦点切换 | 二选一、对比 |
