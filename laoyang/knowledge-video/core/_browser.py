"""找 Chromium：优先 /opt/pw-browsers/chromium，其次 /usr/bin/chromium，都没有就用 Playwright 自带。"""
import os
def chromium_path():
    for p in ("/opt/pw-browsers/chromium", "/usr/bin/chromium", "/usr/bin/chromium-browser"):
        if os.path.exists(p): return p
    return None
def launch_args():
    p = chromium_path(); a = {"args": ["--no-sandbox", "--disable-gpu"]}
    if p: a["executable_path"] = p
    return a
