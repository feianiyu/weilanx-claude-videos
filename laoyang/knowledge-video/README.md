# 老杨魔方 · 知识分享版视频管线

有旁白的竖版知识卡片视频（1080×1920），定稿基准《规划院转型》V2.3。**当前 v2.2**（标准版 60–75 秒 / 深度版 3–5 分钟；默认老杨本人复刻音色 ×1.2）。

| 文件 | 内容 |
|---|---|
| [STANDARD.md](STANDARD.md) | 标准：版式、字号颜色、lines.json 字段、动画 / 文字出场规范、声音、流程、质检 |
| [EFFECTS.md](EFFECTS.md) | 效果登记表：每个效果的性格、换场景怎么演、状态 |
| [ITERATION.md](ITERATION.md) | 迭代制度：每期闭环、反馈沉淀、效果升降级、自动回归 |
| [CHANGELOG.md](CHANGELOG.md) / [BACKLOG.md](BACKLOG.md) | 版本记录 / 待办 |

**做新一期**：`cp -r starter episodes/<日期_主题>`，改 `lines.json`、`scenes.html`、`scenes.js`，按 STANDARD §7 跑命令。

**环境**：Python 3 + numpy + pillow + playwright（Chromium）+ ffmpeg + fonttools + edge-tts。

**不在仓库里的东西**：底图（Pexels）、BGM 和音效（Mixkit）的原始文件——许可允许用在成片里，不允许再分发。`python3 core/fetch_assets.py episodes/<期>` 下载；缺的时候 build 用占位色和静音，只能看画面。配音 mp3 同样不进仓库（仓库根 .gitignore 忽略 *.mp3），词级时间戳 `vo/*.words.json` 在仓库里，重新配音用 `core/gen_vo.py`。

**回归测试**：`python3 core/regress.py`。改了 core/ 必跑；PR 上自动跑（`.github/workflows/laoyang-knowledge-video.yml`）。
