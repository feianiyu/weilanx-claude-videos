# Mac 出片机

让老杨的 Mac 自己出片：Claude 负责创作（选题、脚本、画面代码、静帧把关），Mac 负责体力活（配音、下载素材、渲染、质检、封面、压发布版）。出片这一步**不调用任何 AI**，本地模型只用来把报告压成一句话发通知。

```
Claude（云端）                         GitHub                         老杨的 Mac（每 5 分钟看一次）
写好一期 → 推 render/<期> 分支  ──▶  render/<期>  ──▶  配音 → 素材 → 测拍 → 构建 → 逐秒质检 → 渲染
                                                          → 响度/闪烁 → 封面 → 发布版 → ~/laoyang-render/待审/<期>/
读报告、改代码、再推            ◀──  render-report/<期>  ◀──  出片报告.md + 联系表.jpg + 真实配音时间戳
                                                          → 通知：Mac 右上角 + iPhone（Bark / ntfy，可选）
```

## 安装（一次）

1. 在 Finder 里打开 `~/weilanx-claude-videos/laoyang/mac-render/`（或 Claude 放到你电脑上的那份），双击 **安装出片机.command**。
2. 等它跑完七步（第一次约 5–10 分钟），最后会打开 `~/laoyang-render` 文件夹。
3. 想在 iPhone 上收通知：App Store 装 Bark，把 key 填进 `~/laoyang-render/config.env` 的 `BARK_KEY=`。
4. 系统设置 → 能量：打开「显示器关闭时防止自动进入睡眠」，否则睡眠时不出片。

重装 / 升级再双击一次即可；停用双击 **卸载出片机.command**。出片脚本本身每轮自动跟随 main 更新，不用重装。

## 你每天要做的

只看 `~/laoyang-render/待审/<期>/`：`出片报告.md` 写着结论（通过 / 要看一下 / 失败）。成片看过、戴耳机听过，就把 `_发布版.mp4` 放进发布台队列。

## Claude 怎么交任务

在一期做完、静帧确认后，推一个 `render/<期目录名>` 分支，根目录放 `render-queue/job.json`：

```json
{"pipeline": "knowledge-video",
 "episode": "laoyang/knowledge-video/episodes/2026-11-01_主题",
 "voice": "auto",
 "publish_mb": 25,
 "note": "这期的头条第 3 条改短了，重点看 0:35 的碎裂"}
```

- `voice`：`auto` 按 lines.json 的 `voice.engine`（`volc` = 老杨本人声音，其他 = 云扬）；`fake` = 静音占位只看画面；`skip` = 不动配音。
- 同一个分支再推一个新提交 = 重新出片。台词没改的句子直接用缓存的配音（本人声音按字收费，不重复花钱）。
- 读结果：`git fetch origin render-report/<期>`，看 `<期>/render-report/出片报告.md` 和 `联系表.jpg`（1280 宽，一张就够）。不要为了检查去要全尺寸帧。
- `pipeline: "remotion"`（测试版）：`{"composition": "ep52-laoyang-template", "audio": "node audio/episodes/ep52-laoyang-template.mjs", "cover": "ep52-laoyang-template-cover", "episode": "src/episodes/ep52-laoyang-template"}`，需要 Mac 上有 Node.js。

## 文件

| 文件 | 作用 |
|---|---|
| `安装出片机.command` / `卸载出片机.command` | 双击安装 / 停用 |
| `watch.py` | 信箱：launchd 每 5 分钟运行，发现新的 render/* 提交就出片，没任务几十毫秒就结束 |
| `render_job.py` | 出一期：拉代码 → 配音（带缓存）→ 多音字抽查 → 素材 → 测拍 → 构建 → 质检 → 渲染 → 封面 → 发布版 → 报告；`--selftest` 自检 |
| `notify.py` | 本地模型写一句话通知；模型没开就用模板 |
| `common.py` | 配置（`~/laoyang-render/config.env`）、命令执行、日志 |
| `config.example.env` | 配置说明 |

## 目录（Mac 上）

```
~/laoyang-render/
  config.env       配置（不进仓库，可以放密钥）
  tools/           出片脚本（跟随 main 自动更新）
  repo/            任务工作区（每个任务 checkout 到这里；下载的素材和配音留着复用）
  cache/voice/     配音缓存（按读法 + 声音参数的指纹）
  待审/<期>/        成片、发布版、封面、联系表、出片报告
  logs/            每个任务一份日志；watch.log；launchd.log
  state.json       哪些任务出过了
```

## 出问题时

- 报告写「失败」：报告末尾有日志最后 40 行；整份日志在 `~/laoyang-render/logs/`。把报告转给 Claude，或什么都不做——报告已经推回 GitHub，Claude 自己会读。
- 一直没出片：看 `~/laoyang-render/logs/watch.log` 最后几行；`launchctl list | grep laoyang` 看任务在不在。
- 质量和云端一致：同一份代码、同一套随仓库带的字体、同样的 Chromium 参数和 ffmpeg 设置。回归测试的基准图按「同一台机器逐像素」比较，不要在 Mac 上跑 regress.py。
