#!/usr/bin/env python3
"""配音实验台：同一段文案，用不同合成方式各配一遍，方便对比（听 + 量化）。只用标准库 + ffmpeg。
用法：python3 core/voice_lab.py <spec.json> <输出目录>
spec = {"lines": [{"k":"v01","text":"…","ctx":"这一句的语气提示（可选）"}…],
        "base_ctx": "全片基调（可选）",
        "variants": [{"id":"B","model":"expressive|standard|''","rate":0,"ctx":true,"section":false,
                      "mode":"line|para","cot":false,"takes":1,"tempo":1.0}…]}
mode=para：整段一次合成（句子用空格连起来），靠服务端字幕时间戳看每句落点；mode=line：逐句合成后拼接。
每个变体产出 <id>.mp3（整段）+ <id>/<k>_t<n>.mp3 + report.json（时长、字数/秒、字幕事件样本）。"""
import json, os, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tts_volc as T


def dur(p):
    try:
        return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                    capture_output=True, text=True).stdout.strip())
    except Exception:  # noqa: BLE001
        return 0.0


def concat(files, out, tempo=1.0, gap=0.0):
    lst = out + ".txt"
    open(lst, "w").write("".join(f"file '{os.path.abspath(f)}'\n" for f in files))
    af = (f"atempo={tempo}," if abs(tempo - 1) > 1e-3 else "") + "aresample=44100"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-af", af, "-b:a", "160k", out], check=True)
    os.remove(lst)


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8")); OUT = os.path.abspath(sys.argv[2]); os.makedirs(OUT, exist_ok=True)
    key, spk, res = T.creds(); lines = spec["lines"]; base = spec.get("base_ctx", "")
    report = {"speaker": spk[:4] + "…", "resource": res, "variants": {}}
    for v in spec["variants"]:
        vid = v["id"]; d = os.path.join(OUT, vid); os.makedirs(d, exist_ok=True)
        model = {"expressive": T.EXPRESSIVE, "standard": T.STANDARD}.get(v.get("model", ""), v.get("model") or None)
        sec = T.new_section() if v.get("section") else None
        rv = {"params": v, "lines": [], "errors": []}; picked = []
        t0 = time.time()
        try:
            if v.get("mode") == "para":
                if v.get("cot"):
                    text = "".join(f"<cot text={ln['cot']}>{ln['text']}</cot>" if ln.get("cot") else ln["text"] for ln in lines)
                else:
                    text = "".join(ln["text"] for ln in lines)
                ctx = (base if v.get("ctx") else None)
                for n in range(int(v.get("takes", 1))):
                    a, words, meta = T.synth(text, key, spk, res, ctx=ctx, model=model, rate=v.get("rate", 0), section=sec, cot=bool(v.get("cot")))
                    p = os.path.join(d, f"para_t{n}.mp3"); open(p, "wb").write(a)
                    rv["lines"].append({"k": "para", "take": n, "sec": round(dur(p), 3), "chars": len(text), "words": words, "meta": meta})
                    if n == 0: picked.append(p)
            elif v.get("mode") == "chunk":   # 按「气口组」合成：同一组（lines[].g 相同）的句子一次合成，组内语气连贯，每组有自己的语气提示
                groups = []
                for ln in lines:
                    if groups and groups[-1][0] == ln.get("g"): groups[-1][1].append(ln)
                    else: groups.append([ln.get("g"), [ln]])
                for g, lns in groups:
                    text = "".join(ln["text"] for ln in lns)
                    hints = "；".join(f"第{i + 1}句，{ln['ctx']}" for i, ln in enumerate(lns) if ln.get("ctx")) if len(lns) > 1 else (lns[0].get("ctx") or "")
                    ctx = ((base + " " + hints).strip() or None) if v.get("ctx") else None
                    for n in range(int(v.get("takes", 1))):
                        a, words, meta = T.synth(text, key, spk, res, ctx=ctx, model=model, rate=v.get("rate", 0), section=sec)
                        p = os.path.join(d, f"{lns[0]['k']}_t{n}.mp3"); open(p, "wb").write(a)
                        rv["lines"].append({"k": lns[0]["k"], "take": n, "sec": round(dur(p), 3), "chars": len(text), "words": words, "meta": meta})
                        if n == 0: picked.append(p)
            else:
                for ln in lines:
                    ctx = None
                    if v.get("ctx"):
                        ctx = (base + (" 这一句：" + ln["ctx"] if ln.get("ctx") else "")).strip() or None
                    text = f"<cot text={ln['cot']}>{ln['text']}</cot>" if (v.get("cot") and ln.get("cot")) else ln["text"]
                    for n in range(int(v.get("takes", 1))):
                        a, words, meta = T.synth(text, key, spk, res, ctx=ctx, model=model, rate=v.get("rate", 0), section=sec, cot=bool(v.get("cot")))
                        p = os.path.join(d, f"{ln['k']}_t{n}.mp3"); open(p, "wb").write(a)
                        rv["lines"].append({"k": ln["k"], "take": n, "sec": round(dur(p), 3), "chars": len(ln["text"]), "words": words, "meta": meta})
                        if n == 0: picked.append(p)
            concat(picked, os.path.join(OUT, f"{vid}.mp3"), float(v.get("tempo", 1.0)))
            rv["total_sec"] = round(dur(os.path.join(OUT, f"{vid}.mp3")), 3)
        except Exception as e:  # noqa: BLE001
            rv["errors"].append(str(e)[:400])
        rv["wall_sec"] = round(time.time() - t0, 1)
        report["variants"][vid] = rv
        json.dump(report, open(os.path.join(OUT, "report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(vid, "ok" if not rv["errors"] else rv["errors"], rv.get("total_sec"), flush=True)


if __name__ == "__main__":
    main()
