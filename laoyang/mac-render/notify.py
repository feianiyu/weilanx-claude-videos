"""出片结束后通知你。

先让本地模型（mlx_lm.server）把报告压成一句人话；本地模型没开、超时或说错格式，就用固定模板，通知照发。
发到：Mac 右上角通知（总是）+ iPhone（配置了 Bark key 或 ntfy 主题时）。
"""
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import CFG  # noqa: E402

PROMPT = (
    "你是视频出片助手。下面是一份出片报告。用一句不超过 40 个汉字的中文告诉老板结果："
    "先说结论（通过 / 要看一下 / 失败），再说最要紧的一件事。只输出这一句话，不要解释。\n\n"
)


def summarize_local(text):
    body = {"messages": [{"role": "user", "content": PROMPT + text[:4000]}], "max_tokens": 300, "temperature": 0.2,
            "chat_template_kwargs": {"enable_thinking": False}}
    if CFG["LLM_MODEL"]:
        body["model"] = CFG["LLM_MODEL"]
    req = urllib.request.Request(CFG["LLM_URL"], data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        out = json.load(r)["choices"][0]["message"]["content"]
    out = re.sub(r"<think>.*?</think>", "", out, flags=re.S).strip().splitlines()
    out = out[0].strip() if out else ""
    if not out or len(out) > 80:
        raise ValueError("本地模型输出不合格")
    return out


def fallback(verdict, text):
    first = ""
    for key in ("## 需要注意", "## 可能读错的句子", "## 问题帧"):
        if key in text:
            seg = text.split(key, 1)[1].strip().splitlines()
            first = seg[0].lstrip("- `").rstrip("`")[:40] if seg else ""
            break
    if verdict == "失败":
        m = re.search(r"结论：\*\*失败\*\*（(.+?)）", text)
        first = (m.group(1) if m else first)[:50]
    return f"{verdict}" + (f"：{first}" if first else "")


def notify(name, verdict, text, outdir=None):
    try:
        line = summarize_local(text)
        src = "本地模型"
    except Exception:  # noqa: BLE001
        line = fallback(verdict, text)
        src = "模板"
    title = f"出片{verdict}｜{name}"
    print(f"通知（{src}）：{title} — {line}")
    esc = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')
    try:
        subprocess.run(["osascript", "-e", f'display notification "{esc(line)}" with title "{esc(title)}" sound name "Glass"'], capture_output=True)
    except FileNotFoundError:
        pass  # 不在 Mac 上（测试环境）
    if CFG["BARK_KEY"]:
        try:
            url = f"https://api.day.app/{CFG['BARK_KEY']}/{urllib.parse.quote(title)}/{urllib.parse.quote(line)}?group=%E5%87%BA%E7%89%87%E6%9C%BA"
            urllib.request.urlopen(url, timeout=15).read()
        except Exception:  # noqa: BLE001
            pass
    if CFG["NTFY_TOPIC"]:
        try:
            req = urllib.request.Request(f"https://ntfy.sh/{CFG['NTFY_TOPIC']}", data=f"{title}\n{line}".encode("utf-8"))
            urllib.request.urlopen(req, timeout=15).read()
        except Exception:  # noqa: BLE001
            pass
    if outdir and verdict != "失败":
        subprocess.run(["open", outdir], capture_output=True) if os.environ.get("LY_OPEN_OUTBOX") == "1" else None


if __name__ == "__main__":
    # 测试通知：python3 notify.py
    notify("测试", "通过", "# 出片报告：测试\n- 结论：**通过**\n")
