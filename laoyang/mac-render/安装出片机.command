#!/bin/bash
# 老杨魔方 · Mac 出片机 —— 一键安装（在 Finder 里双击运行，只需要一次）
# 装好以后：Claude 把一期推到 GitHub 的 render/<名字> 分支，这台 Mac 每 5 分钟看一次，
# 看到就自己配音、渲染、质检、出封面，成片放进 ~/laoyang-render/待审，再给你发通知。全程不调用任何 AI。
# 重装 / 升级：再双击一次即可（不会删你的配置和成片）。卸载：双击同目录的「卸载出片机.command」。
set -u
W="$HOME/laoyang-render"
REPO_URL="https://github.com/feianiyu/weilanx-claude-videos.git"
LABEL="com.laoyang.render-watcher"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
export PATH="$HOME/.homebrew/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
export GIT_TERMINAL_PROMPT=0
ok()   { echo "  ✅ $*"; }
bad()  { echo; echo "  ❌ $*"; echo; echo "把这个窗口的内容截图发给 Claude 就行。"; read -r -p "按回车关闭…" _; exit 1; }
step() { echo; echo "== $*"; }

echo "老杨魔方 · Mac 出片机 安装"
mkdir -p "$W/logs" "$W/待审"

step "1/7 检查基础工具"
command -v git >/dev/null || bad "没有 git：先在终端运行 xcode-select --install"
ok "git"
if ! command -v ffmpeg >/dev/null; then
  if command -v brew >/dev/null; then echo "  正在用 Homebrew 安装 ffmpeg（几分钟）…"; brew install ffmpeg >/dev/null || bad "ffmpeg 安装失败"
  else bad "没有 ffmpeg，也没有 Homebrew。请先装 Homebrew（brew.sh），再双击本文件"; fi
fi
ok "ffmpeg $(ffmpeg -version | head -1 | awk '{print $3}')"
PY=""
for c in python3.13 python3.12 python3.11 python3; do command -v $c >/dev/null && { PY=$(command -v $c); break; }; done
[ -n "$PY" ] || bad "没有 Python 3"
ok "Python $($PY -V 2>&1 | awk '{print $2}')"

step "2/7 下载出片脚本（tools）和任务工作区（repo）"
for d in tools repo; do
  if [ -d "$W/$d/.git" ]; then git -C "$W/$d" fetch -q origin main && { [ $d = tools ] && git -C "$W/$d" reset -q --hard origin/main || true; }
  else git clone -q "$REPO_URL" "$W/$d" || bad "从 GitHub 下载失败（网络？）"; fi
done
ok "$W/tools、$W/repo"

step "3/7 准备 Python 环境（第一次约 3 分钟）"
[ -x "$W/.venv/bin/python" ] || "$PY" -m venv "$W/.venv" || bad "建 Python 环境失败"
VPY="$W/.venv/bin/python"
okpip=0
for IDX in https://pypi.org/simple https://pypi.tuna.tsinghua.edu.cn/simple https://mirrors.aliyun.com/pypi/simple; do
  echo "  软件源：$IDX"
  if "$VPY" -m pip install -q --upgrade -i "$IDX" pip numpy pillow playwright fonttools edge-tts; then okpip=1; break; fi
done
[ $okpip = 1 ] || bad "Python 依赖装不上（三个软件源都失败）"
ok "numpy、pillow、playwright、fonttools、edge-tts"

step "4/7 安装渲染用的 Chromium（第一次约 150MB）"
"$VPY" -m playwright install chromium >/dev/null 2>&1 \
  || PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright "$VPY" -m playwright install chromium >/dev/null 2>&1 \
  || bad "Chromium 下载失败"
ok "Chromium"

step "5/7 配置"
if [ ! -f "$W/config.env" ]; then cp "$W/tools/laoyang/mac-render/config.example.env" "$W/config.env"; ok "已生成 $W/config.env（默认值就能用）"
else ok "沿用已有的 $W/config.env"; fi
if git -C "$W/repo" push --dry-run -q origin "HEAD:refs/heads/render-report/_probe" >/dev/null 2>&1; then
  ok "能把报告推回 GitHub（Claude 可以直接读报告）"
else
  sed -i '' 's/^PUSH_REPORTS=.*/PUSH_REPORTS=0/' "$W/config.env"
  echo "  ⚠️  这台 Mac 的 git 没有 GitHub 推送权限：报告只留在本机。"
  echo "     想让 Claude 自动读报告：在终端运行 gh auth login（或装 GitHub Desktop 登录一次），再双击本文件。"
fi
[ -f "$HOME/weilanx-claude-videos/materials/老杨魔方知识分享版/tts.env" ] && ok "找到本人声音凭证 tts.env" || echo "  ⚠️  没找到本人声音凭证 tts.env，配音会用云扬（免费）"
[ -x "$HOME/mlx-whisper-env/bin/python" ] && ok "找到本机 mlx-whisper（用来抽查多音字）" || echo "  ⚠️  没找到 ~/mlx-whisper-env，多音字抽查会跳过"

step "6/7 自检：用模板渲染 3 帧"
"$VPY" "$W/tools/laoyang/mac-render/render_job.py" --selftest || bad "自检没通过"

step "7/7 设置开机自动运行（每 5 分钟看一次 GitHub）"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>$VPY</string><string>$W/tools/laoyang/mac-render/watch.py</string></array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
  <key>LowPriorityIO</key><true/>
  <key>Nice</key><integer>5</integer>
  <key>EnvironmentVariables</key><dict><key>LANG</key><string>zh_CN.UTF-8</string></dict>
  <key>StandardOutPath</key><string>$W/logs/launchd.log</string>
  <key>StandardErrorPath</key><string>$W/logs/launchd.log</string>
</dict></plist>
EOF
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
launchctl bootstrap "gui/$(id -u)" "$PLIST" || bad "开机自启设置失败"
ok "已开启（任务名 $LABEL）"
"$VPY" "$W/tools/laoyang/mac-render/notify.py" >/dev/null 2>&1

echo
echo "全部完成 ✅"
echo "  · 成片会出现在：$W/待审"
echo "  · 想在 iPhone 上收通知：装 Bark App，把它给的 key 填进 $W/config.env 的 BARK_KEY="
echo "  · Mac 睡眠时不会出片：系统设置 → 能量 → 打开「显示器关闭时防止自动进入睡眠」"
echo "  · 回到 Claude 说一声「出片机装好了」"
open "$W"
read -r -p "按回车关闭…" _
