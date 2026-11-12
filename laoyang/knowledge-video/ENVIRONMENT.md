# 环境、密钥与机器清单

> 配合 `PLAYBOOK.md`。这里只写“要什么、从哪来、缺了会怎样”，**不写任何密钥的值**。

## 三个地方

| 地方 | 做什么 | 要有什么 |
|---|---|---|
| 云端（AI 的工作容器） | 写文案、做卡片、本地构建检查、推分支 | Python 3 + numpy + pillow + playwright（Chromium）+ ffmpeg + fonttools；能推 GitHub。**下载不了 Pexels，没有配音凭证** |
| 老杨的 Mac（出片机） | 配音、下载素材、渲染、质检、封面 | 见 `../mac-render/README.md`：双击 `安装出片机.command` 安装；每 5 分钟看一次有没有新的 `render/*` 提交 |
| 项目文档（claude.ai 的“视频工厂”） | 文案、标准、复盘 | 读写项目文档的权限；仓库里的 `STANDARD_*.md` 是标准的代码侧版本 |

## 不在仓库里的东西

| 东西 | 谁提供 | 缺了会怎样 |
|---|---|---|
| 配音凭证：`VOLC_API_KEY`、`VOLC_SPEAKER_ID`（火山引擎声音复刻，老杨本人声音） | 老杨，存在 Mac 的 `tts.env`，路径由 `config.env` 的 `TTS_ENV` 指定 | Mac 退回到云扬配音，声音不是老杨本人，**不能当成片用** |
| 底图 | 每期在 `lines.json` 的 `bgs[].url` 写 Pexels 原图链接，Mac 用 `core/fetch_assets.py` 下载 | 云端构建用占位色（只能看排版）；Mac 下载失败会在日志里提示 |
| BGM / 音效 | 深度版用程序合成的和声垫底（`bgm.synth: pad`），无需下载 | — |
| 本机 whisper（`WHISPER_PY`、`WHISPER_MODEL`） | Mac 安装时配置 | 没有就跳过“多音字抽查”，初筛里没有可疑句 |
| 本地模型（`LLM_URL`，mlx_lm.server） | 老杨 Mac 上运行 | 没开就用规则兜底，初筛仍会生成（判断来源写“规则兜底”） |
| 通知（`BARK_KEY` 或 `NTFY_TOPIC`） | 老杨 | 只在 Mac 上弹通知 |
| GitHub 推送权限 | 老杨 | 推不上去就没有出片；报告推回（`PUSH_REPORTS=1`）需要同一权限 |

## Mac 的 `config.env` 项（只列名字）

`REPO_URL`、`OUTBOX`、`JOBS`、`PUSH_REPORTS`、`TTS_ENV`、`WHISPER_PY`、`WHISPER_MODEL`、`LLM_URL`、`LLM_MODEL`、`BARK_KEY`、`NTFY_TOPIC`。示例文件：`../mac-render/config.example.env`。

## 接手一台新机器的最小步骤

1. 克隆仓库，`pip` 装第一行列出的 Python 依赖，装 ffmpeg 和 Chromium。
2. 跑 `python3 core/regress.py`，应当全部通过（改 `core/` 后必须再跑）。
3. 按 `PLAYBOOK.md` 第 2 节，在一个已有的期（如 `episodes/2026-11-12_双十一消费趋势_v4`）上本地构建一遍，确认能走到“帧问题： 0”。
4. 要新开 Mac 出片机：按 `../mac-render/README.md`；老杨提供 `tts.env`。
