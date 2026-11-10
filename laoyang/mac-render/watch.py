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


def local_inbox():
    """本地信箱 ~/laoyang-render/inbox/*.json：不经过 GitHub 的小任务（GitHub 连不上时也能跑）。
    {"kind": "voice-lab", "spec": {...}}  → 配音对比实验，结果放 ~/laoyang-render/lab/<文件名>/
    {"kind": "render-local", "episode": "<本机期目录>"} → 直接渲染本机已有的一期
    只认这两种，跑的都是 tools/ 里的脚本；做完移到 inbox/done/。"""
    inbox = os.path.join(CFG["WORK"], "inbox")
    if not os.path.isdir(inbox):
        return
    core = os.path.join(CFG["TOOLS"], "laoyang", "knowledge-video", "core")
    for fn in sorted(f for f in os.listdir(inbox) if f.endswith(".json")):
        src = os.path.join(inbox, fn); name = fn[:-5]
        try:
            job = json.load(open(src, encoding="utf-8"))
            os.makedirs(os.path.join(inbox, "done"), exist_ok=True)
            os.replace(src, os.path.join(inbox, "done", fn))   # 先挪走，出错也不会反复重跑、反复花钱
            log(f"本地任务 {name}（{job.get('kind')}）", WATCH_LOG)
            env = dict(os.environ, LY_TTS_ENV=CFG.get("TTS_ENV", ""))
            if job.get("kind") == "voice-lab":
                out = os.path.join(CFG["WORK"], "lab", name); os.makedirs(out, exist_ok=True)
                spec = os.path.join(out, "spec.json"); json.dump(job["spec"], open(spec, "w", encoding="utf-8"), ensure_ascii=False)
                p = subprocess.run([sys.executable, os.path.join(core, "voice_lab.py"), spec, out], env=env, capture_output=True, text=True, timeout=3000)
                open(os.path.join(out, "run.log"), "w", encoding="utf-8").write((p.stdout or "") + (p.stderr or ""))
            elif job.get("kind") == "render-local":
                p = subprocess.run([sys.executable, os.path.join(HERE, "render_job.py"), "--local", os.path.expanduser(job["episode"])], env=env)
            else:
                log(f"!! 不认识的本地任务类型：{job.get('kind')}", WATCH_LOG); continue
            log(f"{'完成' if p.returncode == 0 else '失败'} 本地任务 {name}", WATCH_LOG)
        except Exception as e:  # noqa: BLE001
            log(f"!! 本地任务 {name}：{str(e)[:200]}", WATCH_LOG)


def main():
    os.makedirs(os.path.dirname(WATCH_LOG), exist_ok=True)
    lockf = open(LOCK, "w")
    try:
        fcntl.flock(lockf, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return  # 上一轮还在出片，这一轮不打扰
    try:
        self_update()
    except Exception as e:  # noqa: BLE001  GitHub 连不上不影响本地任务
        log(f"!! 更新 tools 失败：{str(e)[:120]}", WATCH_LOG)
    local_inbox()
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
