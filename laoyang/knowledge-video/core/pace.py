#!/usr/bin/env python3
"""语速统一（深度长视频 v1，2026-11-20，老杨看 EP.29：开场比后面慢）。

配音按气口组合成，每组的语气提示不一样（hook / heavy 这类「一句一顿」的演法会明显放慢），
同一期里就会出现前慢后快。本脚本在配音之后、构建之前跑：

1. 每句算「字 / 秒」：字数（汉字、字母、数字）÷ 真正出声的时长（逐字时间戳首字开始到末字结束）。
2. 全片中位数 M。比 lo × M 慢的句子，用 ffmpeg atempo（不变调）提到 target × M，单句最多提 max 倍（开场 open_max 倍）。
   开场（前 open_sec 秒）门槛更严：不能比中位数慢（open_lo），开场拖沓最伤留存。
3. 不动的句子：本质句（lines.json 的 essence 所在句）、emo 里写了「放慢 / 一字一顿 / 留白」的句子、
   单句写了 "pace": false 的句子。
4. 只改 vo/<句>.mp3、vo/<句>.words.json（时间戳按倍数缩）和 lines.json 的 dur；原始文件存在 vo/_orig/，
   每次都从原始文件算，跑几遍结果都一样。出片机每次出片前会从配音缓存恢复原始配音，所以不会越调越快。

配置（lines.json，可不写）："pace": {"on": true, "lo": 0.9, "target": 0.97, "open_sec": 20, "open_lo": 1.0, "max": 1.15, "open_max": 1.25}
用法：python3 core/pace.py episodes/<期>          （--dry 只报告不改；--fresh 当前 vo/ 就是原始配音，出片机用）
"""
import json
import os
import re
import shutil
import statistics
import subprocess
import sys

EP = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else sys.exit("usage: pace.py episodes/<期> [--dry]")
DRY = "--dry" in sys.argv
LP = os.path.join(EP, "lines.json")
D = json.load(open(LP, encoding="utf-8"))
L = D["lines"]
P = {"on": True, "lo": 0.9, "target": 0.97, "open_sec": 20.0, "open_lo": 1.0, "max": 1.15, "open_max": 1.25, **(D.get("pace") or {})}
if not P["on"]:
    print("语速统一：本期关闭（pace.on=false）"); sys.exit(0)
VO = os.path.join(EP, "vo"); ORIG = os.path.join(VO, "_orig")
if "--fresh" in sys.argv and os.path.isdir(ORIG):   # 出片机：vo/ 里刚从缓存恢复的就是原始配音，旧的 _orig 作废
    shutil.rmtree(ORIG)
keys = [k for k in L if k not in D.get("cut", [])]
CH = re.compile(r"[一-鿿A-Za-z0-9]")


def nchar(s):
    s = re.sub(r"\d+(\.\d+)?", lambda m: "数" * max(2, len(m.group(0))), s)   # 数字按念出来的长度粗算（17.2 ≈ 4 个音节）
    return len(CH.findall(s))


def probe(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True).stdout.strip() or 0)


ess = (D.get("essence") or "").replace("，", "").replace("。", "")
rows, t = [], 0.0
for k in keys:
    mp3, wj = os.path.join(VO, f"{k}.mp3"), os.path.join(VO, f"{k}.words.json")
    if not os.path.exists(mp3) or not os.path.exists(wj):
        print(f"语速统一：{k} 没有配音或时间戳，跳过整期"); sys.exit(0)
    om, ow = os.path.join(ORIG, f"{k}.mp3"), os.path.join(ORIG, f"{k}.words.json")
    src_m = om if os.path.exists(om) else mp3
    src_w = ow if os.path.exists(ow) else wj
    W = json.load(open(src_w, encoding="utf-8"))
    dur = probe(src_m)
    span = (W[-1]["e"] - W[0]["s"]) if W else dur
    sub = L[k].get("tts", L[k]["sub"])
    cps = nchar(sub) / max(span, 0.3)
    emo = str(L[k].get("emo", ""))
    keep = bool(L[k].get("pace") is False or re.search(r"(?<!不)放慢|一字一顿|留白", emo)
            or (ess and ess[:10] in sub.replace("，", "").replace("。", "")))
    rows.append({"k": k, "cps": cps, "t0": t, "keep": keep, "src_m": src_m, "src_w": src_w, "W": W, "n": nchar(sub)})
    t += dur

M = statistics.median(r["cps"] for r in rows if r["n"] >= 6)
done, log = [], []
for r in rows:
    lo = P["open_lo"] if r["t0"] < P["open_sec"] else P["lo"]
    k = 1.0
    if not r["keep"] and r["n"] >= 4 and r["cps"] < lo * M:
        k = min(P["max"], P["target"] * M / r["cps"]) if r["t0"] >= P["open_sec"] else min(P["open_max"], M / r["cps"])
        k = max(1.0, round(k, 3))
    r["after"] = r["cps"] * k
    log.append({"k": r["k"], "cps": round(r["cps"], 2), "k_tempo": k, "keep": r["keep"]})
    if k > 1.0: done.append(f"{r['k']}×{k:.2f}")
    if DRY: continue
    mp3, wj = os.path.join(VO, f"{r['k']}.mp3"), os.path.join(VO, f"{r['k']}.words.json")
    if k > 1.0:
        os.makedirs(ORIG, exist_ok=True)
        for a, b in ((mp3, os.path.join(ORIG, f"{r['k']}.mp3")), (wj, os.path.join(ORIG, f"{r['k']}.words.json"))):
            if not os.path.exists(b): shutil.copyfile(a, b)
        tmp = mp3 + ".tmp.mp3"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", r["src_m"], "-filter:a", f"atempo={k:.3f}", "-ar", "24000", "-ac", "1", "-b:a", "128k", tmp], check=True)
        os.replace(tmp, mp3)
        json.dump([{**w, "s": round(w["s"] / k, 3), "e": round(w["e"] / k, 3)} for w in r["W"]], open(wj, "w"), ensure_ascii=False)
    elif r["src_m"] != mp3:   # 以前调过、这次不用调：恢复原始
        shutil.copyfile(r["src_m"], mp3); shutil.copyfile(r["src_w"], wj)
    L[r["k"]]["dur"] = round(probe(mp3), 2)

if not DRY:
    json.dump(D, open(LP, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({"median_cps": round(M, 2), "conf": P, "lines": log}, open(os.path.join(VO, "_pace.json"), "w"), ensure_ascii=False, indent=1)
open_c = [r for r in rows if r["t0"] < P["open_sec"] and r["n"] >= 6]
msg = (f"中位 {M:.2f} 字/秒；开场 {statistics.mean(r['cps'] for r in open_c):.2f} → {statistics.mean(r['after'] for r in open_c):.2f} 字/秒；" if open_c else f"中位 {M:.2f} 字/秒；") + \
      (f"提速 {len(done)} 句（{'、'.join(done[:12])}{'…' if len(done) > 12 else ''}）" if done else "不用调")
print("语速统一：" + msg)
