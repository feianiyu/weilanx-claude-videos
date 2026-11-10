#!/usr/bin/env python3
"""老杨本人声音配音（火山引擎声音复刻 2.0）。
用法：python3 core/gen_vo_volc.py <期目录> [v02 v05 ...]        # 配音
      python3 core/gen_vo_volc.py <期目录> --hashes             # 只打印每句的缓存指纹（出片机用）
凭证只从环境变量 / 本机 tts.env 读（VOLC_API_KEY、VOLC_SPEAKER_ID），不进仓库、不打印。

配音 v3（2026-11-10，lines.json → voice.v = 3，STANDARD_DEEP_V3 §3）——为「自然、有情绪、像当面聊天」重做：
  1. 表现力增强版模型（seed-tts-2.0-expressive）。默认的标准版不支持语音指令，旧流程写的语气提示其实没生效。
  2. 默认逐句合成（老杨 2026-11-10 试听后选定）。voice.group = "breath" 时按「气口组」合成：lines[k].g 相同的相邻 2–3 句一次配完。
  3. 每组一段语气提示 = 全片人设基调（voice.context）+ 每句的演法（lines[k].emo：预设名或一整句描述）。
  4. 同一期共用一个会话 ID（section_id），服务端带着上文合成，组与组之间也接得上。
  5. 语速在模型里调（voice.rate，默认 15 ≈ 1.15 倍；老杨 2026-11-10：在 1.21 倍上降 5%），不再后期 atempo 硬拉。
  6. 逐字时间戳用服务端返回的真实值（不再按字数估），组内句子之间保留真实停顿（写进 vo/<句>.meta.json 的 gap，build 照着排）。
  7. 抽卡择优：每组配 voice.takes 遍（默认 2，含 hook 的组 3 遍），先剔掉漏字、卡顿、语速离谱的，再挑起伏最自然的一遍。
  8. 每组响度对齐到同一水平，组与组不会忽大忽小。
旧期（voice.v < 3）走原来的逐句流程，行为不变。"""
import hashlib, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tts_volc as T

# ---------- 语气 ----------
BASE_CTX = ("你是老杨，做了二十年企业咨询的顾问，正在给熟悉的民营企业老板录一条短视频口播。像坐在茶桌对面当面聊天：语气松弛、笃定，"
            "带一点替对方着急的关切；有轻重缓急，重点词咬实，句尾自然落下；不要播音腔，不要朗读腔，不要每句一个调子。")
EMO = {
    "hook": "开场，突然问到对方的痛处，带点追问，像看着对方的眼睛说，不要铺垫腔",
    "ask": "真的在问对方，带好奇和一点追问，说完像在等回答",
    "num": "说到数字时放慢、咬实，带一点意外，数字说完停半拍",
    "turn": "转折：前半句平着带过，转折词之后压低声音、放慢，像揭一个不太好听的事实",
    "fact": "平实地摆事实，语速稍快，像随口告诉朋友一个来源",
    "story": "讲故事的口气，娓娓道来，带一点画面感",
    "aha": "恍然大悟的口气，像把窗户纸捅破，干脆",
    "heavy": "掏心窝子的大实话，一句一顿，越说越重",
    "list": "一条一条数给对方听，干脆利落，每条开头咬实",
    "warm": "亲切、放松，像对着熟人解释，带一点笑意",
    "close": "收尾，放慢，沉下来，真诚，带一点感慨，说完留白",
    "invite": "轻松真诚地发出邀请，带笑意，像聊完天顺口问一句",
}
PICK_BAND = (3.6, 9.0)   # 合理语速（字/秒，含停顿），超出视为这一遍坏了


def groups_of(L, keys):
    """气口组：显式 g 相同的相邻句一组；没写 g 的按「同一章节、最多 3 句 / 85 字」自动并。"""
    if L.get("voice", {}).get("group", "line") == "line":   # 默认逐句配（老杨 2026-11-10 试听三种配法后选的）；写 "group": "breath" 才按气口组
        return [[k] for k in keys]
    out = []
    for k in keys:
        ln = L["lines"][k]; g = ln.get("g"); txt = ln.get("tts", ln["sub"])
        if out:
            pk = out[-1][-1]; pl = L["lines"][pk]
            same = (g is not None and g == pl.get("g")) or (
                g is None and pl.get("g") is None and pl.get("sec") == ln.get("sec") and len(out[-1]) < 3
                and sum(len(L["lines"][x].get("tts", L["lines"][x]["sub"])) for x in out[-1]) + len(txt) <= 85
                and not ln.get("solo") and not pl.get("solo"))
            if same: out[-1].append(k); continue
        out.append([k])
    return out


def ctx_of(L, grp):
    v = L.get("voice", {}); base = v.get("context", BASE_CTX)
    if base == "": return None
    hints = []
    for i, k in enumerate(grp):
        e = L["lines"][k].get("emo", "")
        if e: hints.append((f"第{i + 1}句，" if len(grp) > 1 else "这一句，") + EMO.get(e, e))
    return (base + (" " + "；".join(hints) + "。" if hints else "")).strip()


def text_of(L, k):
    return L["lines"][k].get("tts", L["lines"][k]["sub"])


def params(L):
    v = L.get("voice", {})
    return {"model": {"expressive": T.EXPRESSIVE, "standard": T.STANDARD}.get(v.get("model", "expressive"), v.get("model")),
            "rate": int(v.get("rate", 15)), "takes": int(v.get("takes", 2))}


def hashes(L, keys):
    """一句的指纹 = 它所在气口组的全部文字 + 语气 + 参数（组里任何一句改了，整组重配，才能保持连贯）。"""
    P = params(L); out = {}
    for grp in groups_of(L, keys):
        h = hashlib.sha1(json.dumps(["v3", [text_of(L, k) for k in grp], ctx_of(L, grp), P["model"], P["rate"], P["takes"],
                                     L.get("voice", {}).get("pick")], ensure_ascii=False).encode()).hexdigest()[:10]
        for i, k in enumerate(grp): out[k] = f"{h}_{i}"
    return out


# ---------- 音频 ----------
SR = 24000


def decode(b):
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "-", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], input=b, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def encode(x, path):
    import numpy as np
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "160k", path],
                   input=np.clip(x, -1, 1).astype(np.float32).tobytes(), check=True)


def level(x, target_db=-21.0):
    """把一组的「说话时」响度对齐到 target（100ms 窗、只算有声窗）。"""
    import numpy as np
    w = int(0.1 * SR); n = len(x) // w
    if n < 3: return x
    r = np.sqrt((x[:n * w].reshape(n, w) ** 2).mean(1) + 1e-12); act = r > r.max() * 0.12
    cur = 20 * np.log10(np.sqrt((r[act] ** 2).mean()) + 1e-9)
    g = 10 ** ((target_db - cur) / 20)
    return x * min(g, 0.97 / (np.abs(x).max() + 1e-9))


PUNCT = re.compile(r"[，。、？！：；“”‘’（）·,.?!:;\"'\s—…-]")


def assign(words, texts):
    """把服务端的词（按顺序）分给各句：在拼起来的全文里顺序查找每个词的位置。返回每句的词表。"""
    full = "".join(texts); bounds = []; p = 0
    for t in texts: bounds.append((p, p + len(t))); p += len(t)
    pos = 0; per = [[] for _ in texts]
    for w in words:
        tok = w["word"]; core = PUNCT.sub("", tok)
        i = full.find(tok, pos)
        if i < 0 and core: i = full.find(core, pos)
        if i < 0: i = pos
        li = next((j for j, (a, b) in enumerate(bounds) if a <= i < b), len(texts) - 1)
        per[li].append(w); pos = max(pos, i + max(1, len(tok)))
    return per


def liveliness(x, words):
    """起伏分：音高标准差（半音）+ 字长变化。数越大越不平。"""
    import numpy as np, voice_score as VS
    f0, _ = VS.f0_track(np.interp(np.arange(0, len(x), SR / VS.SR), np.arange(len(x)), x)) if SR != VS.SR else VS.f0_track(x)
    v = f0[f0 > 0]
    sd = float(np.std(12 * np.log2(v / 100.0))) if len(v) > 10 else 0.0
    d = np.array([w["endTime"] - w["startTime"] for w in words if PUNCT.sub("", w["word"]) and not w["word"].isascii()])
    cv = float(d.std() / d.mean()) if len(d) > 4 else 0.0
    return sd + 6 * cv, sd, cv


def judge(x, words, text):
    """这一遍能不能用。返回 (ok, 原因)。"""
    n_txt = len(PUNCT.sub("", text)); n_w = sum(len(PUNCT.sub("", w["word"])) for w in words)
    if not words or n_w < 0.85 * n_txt: return False, f"漏字（{n_w}/{n_txt}）"
    span = words[-1]["endTime"] - words[0]["startTime"]; cps = n_txt / max(0.1, span)
    if not (PICK_BAND[0] <= cps <= PICK_BAND[1]): return False, f"语速离谱（{cps:.1f} 字/秒）"
    gaps = [b["startTime"] - a["endTime"] for a, b in zip(words, words[1:])]
    if gaps and max(gaps) > 1.6: return False, f"中途卡顿 {max(gaps):.1f}s"
    return True, ""


def run_v3(EP, L, keys_req):
    import numpy as np
    key, spk, res = T.creds(); P = params(L); v = L.get("voice", {})
    allkeys = [k for k in L["lines"] if k not in L.get("cut", [])]
    grps = groups_of(L, allkeys)
    if keys_req: grps = [g for g in grps if any(k in keys_req for k in g)]   # 组里有一句要重配，整组重配
    os.makedirs(os.path.join(EP, "vo"), exist_ok=True); os.makedirs(os.path.join(EP, "vo_raw"), exist_ok=True)
    section = T.new_section(); log = []
    for grp in grps:
        texts = [text_of(L, k) for k in grp]; text = "".join(texts); ctx = ctx_of(L, grp)
        n_takes = P["takes"] + (1 if any(L["lines"][k].get("emo") == "hook" for k in grp) and P["takes"] > 1 else 0)
        cands = []
        for n in range(max(1, n_takes)):
            try:
                a, words, meta = T.synth(text, key, spk, res, ctx=ctx, model=P["model"], rate=P["rate"], section=section)
            except T.TTSError as e:
                cands.append({"n": n, "ok": False, "why": str(e)[:120]}); continue
            x = decode(a); ok, why = judge(x, words, text)
            sc = liveliness(x, words) if ok else (0, 0, 0)
            cands.append({"n": n, "ok": ok, "why": why, "score": round(sc[0], 2), "f0_sd": round(sc[1], 2), "dur_cv": round(sc[2], 3), "x": x, "words": words})
        good = [c for c in cands if c["ok"]]
        if not good:
            usable = [c for c in cands if "x" in c]
            if not usable: raise SystemExit(f"{grp[0]} 这一组合成失败：{cands[-1]['why']}")
            good = usable[:1]; print(f"!! {grp} 没有一遍通过体检（{[c['why'] for c in cands]}），先用第一遍，请听一下")
        best = good[0] if v.get("pick") == "first" else max(good, key=lambda c: c["score"])
        log.append({"group": grp, "picked": best["n"], "takes": [{k: c[k] for k in ("n", "ok", "why", "score", "f0_sd", "dur_cv") if k in c} for c in cands]})
        x, words = level(best["x"]), best["words"]
        encode(x, os.path.join(EP, "vo_raw", f"{grp[0]}_group.mp3"))
        per = assign(words, texts); dur = len(x) / SR
        # 切点：组首 = 第一个字前 0.10s；句间 = 两句之间停顿的正中；组尾 = 最后一个字后 0.20s
        starts = [w[0]["startTime"] if w else None for w in per]; ends = [w[-1]["endTime"] if w else None for w in per]
        cuts = [max(0.0, (starts[0] or 0) - 0.10)]
        for i in range(1, len(grp)):
            a_, b_ = ends[i - 1], starts[i]
            cuts.append((a_ + b_) / 2 if a_ is not None and b_ is not None else cuts[-1])
        cuts.append(min(dur, (ends[-1] or dur) + 0.20))
        for i, k in enumerate(grp):
            c0, c1 = cuts[i], cuts[i + 1]; seg = x[int(c0 * SR):int(c1 * SR)].copy()
            fz = min(len(seg) // 4, int(0.012 * SR))
            if fz > 0: seg[:fz] *= np.linspace(0, 1, fz); seg[-fz:] *= np.linspace(1, 0, fz)
            encode(seg, os.path.join(EP, "vo", f"{k}.mp3"))
            ws = [{"w": w["word"], "s": round(max(0.0, w["startTime"] - c0), 3), "e": round(max(0.0, w["endTime"] - c0), 3)} for w in per[i]]
            json.dump(ws, open(os.path.join(EP, "vo", f"{k}.words.json"), "w"), ensure_ascii=False)
            # gap：这一句前面在时间轴上留多少空。组内的句子紧接上一句（停顿已经在音频里）
            json.dump({"gap": 0.0 if i > 0 else None, "group": grp[0], "take": best["n"], "score": best.get("score")},
                      open(os.path.join(EP, "vo", f"{k}.meta.json"), "w"), ensure_ascii=False)
            L["lines"][k]["dur"] = round(len(seg) / SR, 2)
        print(" ".join(grp), f"{dur:.1f}s 取第 {best['n'] + 1}/{len(cands)} 遍 起伏 {best.get('score')}", flush=True)
    json.dump(L, open(os.path.join(EP, "lines.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    old = []
    lp = os.path.join(EP, "vo", "_takes.json")
    if os.path.exists(lp) and keys_req:
        done = {k for g in log for k in g["group"]}
        old = [g for g in json.load(open(lp, encoding="utf-8")) if not (set(g["group"]) & done)]
    json.dump(old + log, open(lp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


# ---------- 旧流程（voice.v < 3）：逐句、标准模型、后期提速，保持原样 ----------
def run_legacy(EP, L, keys):
    key, spk, res = T.creds()
    def ctx_for(k):
        e = L["lines"][k].get("emo", ""); base = L.get("voice", {}).get("context", BASE_CTX)
        return (base + " 这一句：" + EMO.get(e, e)) if e else base
    keys = keys or list(L["lines"]); os.makedirs(os.path.join(EP, "vo_raw"), exist_ok=True); os.makedirs(os.path.join(EP, "vo"), exist_ok=True)
    for k in keys:
        t = text_of(L, k)
        a, _, _ = T.synth(t, key, spk, res, ctx=None if L.get("voice", {}).get("context") == "" else ctx_for(k),
                          rate=L.get("voice", {}).get("rate") or 0, subtitle=False)
        open(os.path.join(EP, "vo_raw", f"{k}.mp3"), "wb").write(a); print(k, t)
    if float(L.get("voice", {}).get("tempo", 1.21 if int(L.get("v", 1)) >= 2 else 1.0)) == 1.0:
        for k in keys: os.replace(os.path.join(EP, "vo_raw", f"{k}.mp3"), os.path.join(EP, "vo", f"{k}.mp3"))
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "align_chars.py"), EP, *keys], check=True)


def is_v3(L):
    return int(L.get("voice", {}).get("v", 0)) >= 3


if __name__ == "__main__":
    EP = os.path.abspath(sys.argv[1]); args = sys.argv[2:]
    L = json.load(open(os.path.join(EP, "lines.json"), encoding="utf-8"))
    if args[:1] == ["--hashes"]:
        ks = [k for k in L["lines"] if k not in L.get("cut", [])]
        print(json.dumps(hashes(L, ks) if is_v3(L) else {}, ensure_ascii=False)); sys.exit(0)
    (run_v3 if is_v3(L) else run_legacy)(EP, L, args)
