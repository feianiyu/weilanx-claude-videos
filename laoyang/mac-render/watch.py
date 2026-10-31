#!/usr/bin/env python3
"""出片机的「信箱」：launchd 每 5 分钟叫醒一次。

1. 更新自己（tools/ 跟着 main 走，Claude 改了出片脚本，你不用重装）
2. 看 GitHub 上有没有新的 render/<名字> 分支、或者老分支有了新提交
3. 有就按顺序一个个出片（render_job.py），做完的记进 state.json，不会重复出片
没有新任务时几秒就结束，几乎不占电脑。手动跑一次：python3 watch.py
"""
import fcntl
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import CFG, log  # noqa: E402

STATE = os.path.join(CFG["WORK"], "state.json")
LOCK = os.path.join(CFG["WORK"], ".watch.lock")
WATCH_LOG = os.path.join(CFG["WORK"], "logs", "watch.log")


def git(*args, cwd=None):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, timeout=300)


def remote_jobs():
    r = git("ls-remote", CFG["REPO_URL"], f"refs/heads/{CFG['POLL_BRANCH_PREFIX']}*")
    if r.returncode != 0:
        raise RuntimeError("连不上 GitHub：" + r.stderr.strip()[-200:])
    jobs = {}
    for ln in r.stdout.splitlines():
        sha, ref = ln.split("\t")
        jobs[ref.replace("refs/heads/", "", 1)] = sha
    return jobs


def self_update():
    tools = CFG["TOOLS"]
    if not os.path.isdir(tools + "/.git"):
        return
    git("fetch", "-q", "origin", "main", cwd=tools)
    git("reset", "-q", "--hard", "origin/main", cwd=tools)


def main():
    os.makedirs(os.path.dirname(WATCH_LOG), exist_ok=True)
    lockf = open(LOCK, "w")
    try:
        fcntl.flock(lockf, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return  # 上一轮还在出片，这一轮不打扰
    self_update()
    try:
        jobs = remote_jobs()
    except Exception as e:  # noqa: BLE001
        log(f"!! {e}", WATCH_LOG)
        return
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    todo = [(b, s) for b, s in sorted(jobs.items()) if state.get(b, {}).get("sha") != s]
    if not todo:
        return
    for branch, sha in todo:
        log(f"新任务 {branch} @ {sha[:7]}", WATCH_LOG)
        # 出片脚本始终用 main 上最新的 tools/ 版本
        p = subprocess.run([sys.executable, os.path.join(CFG["TOOLS"], "laoyang", "mac-render", "render_job.py"), branch])
        state[branch] = {"sha": sha, "ok": p.returncode == 0}
        json.dump(state, open(STATE, "w"), ensure_ascii=False, indent=1)
        log(f"{'完成' if p.returncode == 0 else '失败'} {branch}", WATCH_LOG)


if __name__ == "__main__":
    main()
