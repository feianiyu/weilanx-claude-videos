#!/bin/bash
# 停掉 Mac 出片机的自动运行。成片、配置、代码都留着（在 ~/laoyang-render，不想要可以手动删）。
LABEL="com.laoyang.render-watcher"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
rm -f "$HOME/Library/LaunchAgents/$LABEL.plist"
echo "出片机已停用 ✅（~/laoyang-render 里的东西没动）"
read -r -p "按回车关闭…" _
