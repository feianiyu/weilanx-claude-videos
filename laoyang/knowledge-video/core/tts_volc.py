#!/usr/bin/env python3
"""火山引擎 · 豆包语音合成 V3（声音复刻 2.0）调用层。只用标准库。gen_vo_volc.py 和 voice_lab.py 都走这里。

2026-11-10 查官方文档（docs.volcengine.com/docs/6561/1598757）后确认的几件事，都是「自然、有情绪」的关键：
  · req_params.model：复刻 2.0 默认是 seed-tts-2.0-standard，**不支持语音指令**——之前写的 context_texts 等于没生效。
    要情绪必须 model="seed-tts-2.0-expressive"（表现力增强版，官方说明「可能需要抽卡」→ 所以上层做多次取样择优）。
  · additions.context_texts：语音指令，只有列表第一个值生效，不计费。写「场景 + 画面 + 语气细节」，短关键词基本没用。
  · additions.section_id：多轮会话 ID，同一段话的句子共用一个，服务端带着上文合成，句与句的语气能接上。
  · audio_params.speech_rate：模型内语速（-50..100，100=2 倍速）。代替后期 atempo 硬提速，音高和咬字不被拉扯。
  · audio_params.enable_subtitle：返回逐字时间戳（TTSSubtitle），字幕和画面锚点用真实时间，不用按字数估。
  · additions 必须是 JSON 字符串；传对象不报错但会被静默忽略。
凭证只从环境变量 / 本机 tts.env 读，不进仓库、不打印。"""
import base64, json, os, sys, uuid, urllib.request, urllib.error

URL = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"
EXPRESSIVE, STANDARD = "seed-tts-2.0-expressive", "seed-tts-2.0-standard"


def creds():
    env = dict(os.environ)
    for p in [os.environ.get("LY_TTS_ENV", ""), os.path.expanduser("~/weilanx-claude-videos/materials/老杨魔方知识分享版/tts.env")]:
        if p and os.path.exists(p):
            for ln in open(p, encoding="utf-8"):
                if "=" in ln and not ln.lstrip().startswith("#"):
                    k, v = ln.split("=", 1); env.setdefault(k.strip(), v.strip())
    key, spk = env.get("VOLC_API_KEY"), env.get("VOLC_SPEAKER_ID")
    if not key or not spk:
        sys.exit("缺 VOLC_API_KEY / VOLC_SPEAKER_ID（云环境变量或本机 tts.env 里设置）")
    return key, spk, env.get("VOLC_RESOURCE_ID", "seed-icl-2.0")


class TTSError(RuntimeError):
    pass


def synth(text, key, spk, res, *, ctx=None, model=None, rate=0, loud=0, section=None, subtitle=True, cot=False,
          fmt="mp3", sample_rate=24000, timeout=120):
    """合成一段。返回 (音频 bytes, words, meta)。
    words = [{"word","startTime","endTime"}…]（服务端字幕；没返回就是 []）；meta = {"events": 非音频事件精简列表, "usage": …}"""
    ap = {"format": fmt, "sample_rate": sample_rate}
    if fmt == "mp3": ap["bit_rate"] = 160000
    if rate: ap["speech_rate"] = int(rate)
    if loud: ap["loudness_rate"] = int(loud)
    if subtitle: ap["enable_subtitle"] = True
    add = {"explicit_language": "zh-cn", "disable_markdown_filter": False}
    if ctx: add["context_texts"] = [ctx]
    if section: add["section_id"] = section
    if cot: add["use_tag_parser"] = True
    req = {"text": text, "speaker": spk, "audio_params": ap, "additions": json.dumps(add, ensure_ascii=False)}
    if model: req["model"] = model
    body = {"user": {"uid": "laoyang"}, "req_params": req}
    rq = urllib.request.Request(URL, data=json.dumps(body, ensure_ascii=False).encode(), headers={
        "Content-Type": "application/json", "X-Api-Key": key, "X-Api-Resource-Id": res,
        "X-Api-Request-Id": str(uuid.uuid4()), "X-Control-Require-Usage-Tokens-Return": "*"})
    audio, err, words, events, usage = b"", "", [], [], None
    try:
        with urllib.request.urlopen(rq, timeout=timeout) as r:
            for raw in r:
                s = raw.decode("utf-8", "ignore").strip()
                if s.startswith("data:"): s = s[5:].strip()
                if not s.startswith("{"): continue
                try: o = json.loads(s)
                except Exception: continue
                if o.get("data"): audio += base64.b64decode(o["data"])
                if o.get("code", 0) not in (0, 20000000): err = f"code={o.get('code')} {o.get('message', '')}"
                if o.get("usage"): usage = o["usage"]
                sen = o.get("sentence")
                if sen:
                    for w in sen.get("words") or []:
                        if w.get("word") is not None and w.get("startTime") is not None:
                            words.append({"word": w["word"], "startTime": float(w["startTime"]), "endTime": float(w.get("endTime", w["startTime"]))})
                if not o.get("data"):
                    events.append({k: (v if k != "sentence" else {"text": (v or {}).get("text"), "n_words": len((v or {}).get("words") or [])})
                                   for k, v in o.items() if k != "data"})
    except urllib.error.HTTPError as e:
        err = f"HTTP {e.code} {e.read().decode('utf-8', 'ignore')[:300]}"
    except Exception as e:  # noqa: BLE001  网络抖动等
        err = f"{type(e).__name__}: {e}"
    if not audio:
        raise TTSError(f"合成失败：{err.replace(key, '***')}")
    # 字幕事件可能分多次返回、互相重叠：按开始时间去重排序
    seen, uniq = set(), []
    for w in sorted(words, key=lambda w: (w["startTime"], w["endTime"])):
        k = (w["word"], round(w["startTime"], 3))
        if k not in seen: seen.add(k); uniq.append(w)
    return audio, uniq, {"events": events[:12], "usage": usage, "warn": err.replace(key, "***") if err else ""}


def new_section():
    return str(uuid.uuid4())
