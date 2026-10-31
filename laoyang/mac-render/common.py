"""出片机公用：读配置、跑命令、写日志。只用标准库。"""
import os
import subprocess
import time

HOME = os.path.expanduser("~")
DEFAULTS = {
    "WORK": f"{HOME}/laoyang-render",                     # 出片机的家：代码、日志、缓存都在这里
    "REPO_URL": "https://github.com/feianiyu/weilanx-claude-videos.git",
    "OUTBOX": "",                                          # 空 = <WORK>/待审；成片放这里，你审过再拖进发布台
    "JOBS": "6",                                           # 并行渲染进程数（M1 Max 用 6）
    "PUSH_REPORTS": "1",                                   # 报告推回 GitHub，Claude 直接读
    "TTS_ENV": f"{HOME}/weilanx-claude-videos/materials/老杨魔方知识分享版/tts.env",  # 本人声音凭证
    "WHISPER_PY": f"{HOME}/mlx-whisper-env/bin/python",   # 本机 mlx-whisper，用来抽查多音字
    "WHISPER_MODEL": "mlx-community/whisper-small-mlx",
    "WHISPER_MIN_RATIO": "0.85",
    "LLM_URL": "http://127.0.0.1:18081/v1/chat/completions",  # 本地模型（mlx_lm.server）
    "LLM_MODEL": "",                                       # 空 = 用服务器当前加载的模型
    "BARK_KEY": "",                                        # iPhone 推送（Bark App 里的 key），可空
    "NTFY_TOPIC": "",                                      # 或 ntfy 主题，可空
    "POLL_BRANCH_PREFIX": "render/",
}


def load_cfg():
    cfg = dict(DEFAULTS)
    path = os.environ.get("LY_RENDER_CONFIG", f"{cfg['WORK']}/config.env")
    if os.path.exists(path):
        for ln in open(path, encoding="utf-8"):
            ln = ln.strip()
            if ln and not ln.startswith("#") and "=" in ln:
                k, v = ln.split("=", 1)
                cfg[k.strip()] = os.path.expanduser(v.strip().strip('"'))
    cfg["WORK"] = os.path.expanduser(cfg["WORK"])
    cfg["TOOLS"] = cfg["WORK"] + "/tools"
    cfg["OUTBOX"] = os.path.expanduser(cfg["OUTBOX"] or cfg["WORK"] + "/待审")
    cfg["JOBS"] = int(cfg["JOBS"])
    cfg["PUSH_REPORTS"] = cfg["PUSH_REPORTS"] not in ("0", "", "no", "false")
    cfg["WHISPER_MIN_RATIO"] = float(cfg["WHISPER_MIN_RATIO"])
    return cfg


CFG = load_cfg()

# launchd 启动时 PATH 很短，补上 Homebrew 和常用位置
os.environ["PATH"] = ":".join([f"{HOME}/.homebrew/bin", "/opt/homebrew/bin", "/usr/local/bin", f"{HOME}/bin",
                                os.environ.get("PATH", ""), "/usr/bin", "/bin", "/usr/sbin", "/sbin"])
os.environ.setdefault("PYTHONUNBUFFERED", "1")


def log(msg, path=None):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(line + "\n")


def run(cmd, cwd=None, env=None, logpath=None, timeout=None):
    """跑一条命令，输出写进日志并返回；失败时把最后几行报错带进异常。"""
    log("$ " + " ".join(str(c) for c in cmd), logpath)
    p = subprocess.run([str(c) for c in cmd], cwd=cwd, env=env, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=timeout)
    out = (p.stdout or "") + (p.stderr or "")
    if logpath:
        with open(logpath, "a", encoding="utf-8") as f:
            f.write(out)
    if p.returncode != 0:
        tail = "\n".join(out.strip().splitlines()[-6:])
        raise RuntimeError(f"命令失败（{p.returncode}）：{os.path.basename(str(cmd[0]))} …\n{tail}")
    return out


def sh_ok(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, timeout=30).returncode == 0
    except Exception:  # noqa: BLE001
        return False
