#!/bin/bash
# 老杨魔方 · 知识分享版：在你的 Mac 上生成云扬配音（Edge TTS）并下载配乐、音效、底图
# 用法：双击本文件，或在终端运行  bash 本文件路径
# 适用：云端会话的网络放行不了 Edge TTS / Mixkit 时，把 lines.json、gen_vo.py、fetch_assets.py 和本文件
#       放进用户 Mac 上的 materials/<风格>/<期>/，用户在自己的终端跑一次；结束时打包成小块（vo.tgz、sfx.tgz、bgm.part.*），
#       方便经远程设备通道分小块回传（大文件整传会超时）
set -e
cd "$(dirname "$0")"
echo "== 1/3 准备 Python 环境（只第一次需要，约 1 分钟）"
[ -d .venv ] || python3 -m venv .venv
ok=0
for IDX in https://pypi.org/simple https://pypi.tuna.tsinghua.edu.cn/simple https://mirrors.aliyun.com/pypi/simple; do
  echo "   尝试软件源：$IDX"
  if .venv/bin/pip install -q -i "$IDX" edge-tts; then ok=1; break; fi
done
[ $ok = 1 ] || { echo "❌ 三个软件源都装不上 edge-tts：请检查网络 / 代理，或把这段报错发给 Claude"; exit 1; }
echo "== 2/3 生成配音（云扬 +25%）"
.venv/bin/python gen_vo.py .
echo "== 3/3 下载配乐、音效、底图"
.venv/bin/python fetch_assets.py .
echo
echo "完成 ✅  回到 Claude 说一声「配音好了」即可。"
tar czf vo.tgz lines.json vo && tar czf sfx.tgz audio/sfx 2>/dev/null; split -b 900k audio/*.mp3 bgm.part. 2>/dev/null || true
ls vo | wc -l
