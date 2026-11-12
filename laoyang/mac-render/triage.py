"""出片后初筛：把出片报告压成一页「初筛.md」，Claude 先读它，不再读整份报告。

分工（本地模型只做低风险的判断，数字一律用规则从报告里取，不让模型转述）：
  规则：结论、提交、响度、真峰值、问题帧、多音字数量、背景图尺寸警告、可疑句清单。
  本地模型（mlx_lm.server）：只判断每个「可疑句」更像「转写误差」（同音字、英文名、数字读法）还是「真读错」，
    并各给一句理由。输出必须是 JSON，格式不对、超时、没开服务，一律改用规则兜底（相似度 ≥0.8 记为多半是转写误差）。
初筛.md 只是参考：可疑句最终要老杨戴耳机听；事实核对、判断留给 Claude 和老杨。
"""
import json
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import CFG  # noqa: E402

PROMPT = (
    "下面是一段视频的台词原文，和语音识别听回来的文字。语音识别本身会把同音字、英文人名、数字读法听错，"
    "所以两者不一致不一定是配音读错。请判断：这句配音更可能是「转写误差」还是「真读错」，并用不超过 20 个汉字说明理由。\n"
    "只输出一行 JSON，不要别的文字：{\"判断\": \"转写误差\" 或 \"真读错\" 或 \"不确定\", \"理由\": \"……\"}\n\n"
)
SUSPECT = re.compile(r"^- (v\d+)（相似度 ([\d.]+)）听到：(.*)$")


def parse(text):
    """从报告里取数（全用规则）。"""
    g = lambda pat, d="": (re.search(pat, text) or [None, d])[1]
    facts = {
        "结论": g(r"结论：\*\*(.+?)\*\*"),
        "失败原因": g(r"结论：\*\*[^*]+\*\*（(.+?)）\n"),
        "提交": g(r"提交：(\S+)"),
        "响度": g(r"响度：(.+)"),
        "真峰值": g(r"真峰值：(.+)"),
        "问题帧": g(r"越界 / 字幕问题帧：(\d+)"),
        "配音": g(r"配音：(.+)"),
    }
    suspects = [(m[1], float(m[2]), m[3]) for m in map(SUSPECT.match, text.splitlines()) if m]
    warns = []
    if "## 需要注意" in text:
        seg = text.split("## 需要注意", 1)[1].split("\n## ", 1)[0]
        warns = [x[2:].strip() for x in seg.splitlines() if x.startswith("- ")]
    return facts, suspects, warns


def ask_local(orig, heard):
    body = {"messages": [{"role": "user", "content": PROMPT + f"台词原文：{orig}\n识别结果：{heard}"}],
            "max_tokens": 200, "temperature": 0.1, "chat_template_kwargs": {"enable_thinking": False}}
    if CFG["LLM_MODEL"]:
        body["model"] = CFG["LLM_MODEL"]
    req = urllib.request.Request(CFG["LLM_URL"], data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        out = json.load(r)["choices"][0]["message"]["content"]
    out = re.sub(r"<think>.*?</think>", "", out, flags=re.S).strip()
    m = re.search(r"\{.*\}", out, flags=re.S)
    j = json.loads(m.group(0))
    if j.get("判断") not in ("转写误差", "真读错", "不确定") or not str(j.get("理由", "")).strip():
        raise ValueError("格式不对")
    return j["判断"], str(j["理由"]).strip()[:40]


def rule_judge(sim):
    return ("转写误差", "相似度高，多半是识别误差") if sim >= 0.8 else ("不确定", "相似度偏低，请听")


def triage(report_text, lines_path=None):
    facts, suspects, warns = parse(report_text)
    subs = {}
    if lines_path and os.path.exists(lines_path):
        subs = {k: v.get("tts", v.get("sub", "")) for k, v in json.load(open(lines_path, encoding="utf-8")).get("lines", {}).items()}
    llm_ok, rows = True, []
    for k, sim, heard in suspects:
        try:
            if not llm_ok:
                raise RuntimeError("本地模型不可用")
            j, why = ask_local(subs.get(k, ""), heard)
            src = "本地模型"
        except Exception:  # noqa: BLE001
            llm_ok = False   # 一次失败就不再重试，免得拖慢出片
            j, why = rule_judge(sim)
            src = "规则"
        rows.append((k, sim, subs.get(k, ""), heard, j, why, src))
    out = ["# 初筛（自动生成，仅供参考）", ""]
    out.append(f"- 结论：**{facts['结论']}**" + (f"（{facts['失败原因']}）" if facts["失败原因"] else ""))
    out += [f"- 提交：{facts['提交']}", f"- 响度：{facts['响度'] or '—'}　真峰值：{facts['真峰值'] or '—'}",
            f"- 问题帧：{facts['问题帧'] or '—'}　{facts['配音']}"]
    if warns:
        out += ["", "## 报告里的提醒"] + [f"- {w}" for w in warns]
    real = [r for r in rows if r[4] == "真读错"]
    out += ["", f"## 可疑句 {len(rows)} 句（初筛判断真读错 {len(real)} 句；最终以耳朵为准）", ""]
    out.append(f"判断来源：{'本地模型' if rows and llm_ok else '规则兜底（本地模型没开或出错）'}")
    out.append("")
    for k, sim, orig, heard, j, why, src in rows:
        out.append(f"- {k}　**{j}**（{src}）：{why}　｜原文：{orig}　｜听到：{heard}")
    return "\n".join(out) + "\n"


def write(job, report_text):
    """render_job 里调用：写到成片目录和该期 build 目录。永远不抛异常、不影响出片。"""
    try:
        txt = triage(report_text, os.path.join(job.ep, "lines.json") if job.ep else None)
        for d in filter(None, [job.ep and os.path.join(job.ep, "build"), job.out]):
            if os.path.isdir(d):
                open(os.path.join(d, "初筛.md"), "w", encoding="utf-8").write(txt)
        return txt
    except Exception as e:  # noqa: BLE001
        print("初筛没做成（不影响出片）：", e)
        return ""


if __name__ == "__main__":   # 手动：python3 triage.py 出片报告.md [lines.json]
    print(triage(open(sys.argv[1], encoding="utf-8").read(), sys.argv[2] if len(sys.argv) > 2 else None))
