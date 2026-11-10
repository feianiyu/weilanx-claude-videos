#!/usr/bin/env python3
"""老杨本人声音配音（火山引擎声音复刻 2.0），云端会话直接跑，不需要用户的电脑。
用法：python3 core/gen_vo_volc.py <期目录> [v02 v05 ...]
凭证（只从环境变量读，不进仓库、不打印）：VOLC_API_KEY、VOLC_SPEAKER_ID
  → 放在 claude.ai/code 个人云环境的「环境变量」里；或本机 materials/老杨魔方知识分享版/tts.env
需要云环境网络放行 openspeech.bytedance.com。
合成后自动跑 align_chars.py（按 lines.json voice.tempo 提速、按字估时间）。"""
import base64, json, os, subprocess, sys, uuid, urllib.request, urllib.error

def creds():
    env = dict(os.environ)
    for p in [os.path.expanduser("~/weilanx-claude-videos/materials/老杨魔方知识分享版/tts.env")]:
        if os.path.exists(p):
            for ln in open(p, encoding="utf-8"):
                if "=" in ln and not ln.lstrip().startswith("#"):
                    k, v = ln.split("=", 1); env.setdefault(k.strip(), v.strip())
    key, spk = env.get("VOLC_API_KEY"), env.get("VOLC_SPEAKER_ID")
    if not key or not spk: sys.exit("缺 VOLC_API_KEY / VOLC_SPEAKER_ID（云环境变量里设置）")
    return key, spk, env.get("VOLC_RESOURCE_ID", "seed-icl-2.0")

# 情绪：复刻 2.0 支持 context_texts（一段语气提示，告诉模型用什么情绪和节奏念），不改字、不改音色。
# voice.context 写全片基调；某一句想要特别的语气，在那句写 "emo"（预设名或一整句提示）。
BASE_CTX = ("你是一位熟悉企业经营的行业观察者，正在录一条短视频口播，对象是中小企业老板。用自然、松弛、像和朋友当面聊天的语气讲，"
            "不要播音腔，不要一字一顿，不要每句都一个调子；句子之间有轻重缓急：说到关键数字时稍微加重、放慢半拍；"
            "提问时带一点好奇和追问；转折处语气往下压一点，像在说一个不太好听但必须说的事；结尾沉下来，真诚，留一点余味。")
EMO = {"hook": "开场第一句，要抓人：带一点追问和不确定的语气，像突然问到对方痛处，语速自然，不要铺垫腔。",
       "num": "这句里有关键数字，说到数字时放慢、加重，语气里带一点意外，数字说完停半拍。",
       "turn": "转折句：前半句平，后半句压低声音、放慢，像在揭一个不太愿意被提起的事实。",
       "ask": "提问句：带真的好奇和一点追问，句尾上扬，不要陈述腔。",
       "close": "收尾：放慢，沉下来，语气诚恳，带一点感慨，说完留白。",
       "warm": "亲切、放松，像对着熟人解释，语气里带一点笑意。"}
def ctx_for(L, k):
    ln = L["lines"][k]; e = ln.get("emo", "")
    base = L.get("voice", {}).get("context", BASE_CTX)
    return (base + " 这一句：" + EMO.get(e, e)) if e else base

def synth(text, key, spk, res, ctx=None, rate=None):
    ap = {"format": "mp3", "sample_rate": 24000}
    if rate: ap["speech_rate"] = int(rate)
    req = {"text": text, "speaker": spk, "audio_params": ap}
    if ctx: req["additions"] = json.dumps({"explicit_language": "zh-cn", "context_texts": [ctx]}, ensure_ascii=False)
    body = {"user": {"uid": "laoyang"}, "req_params": req}
    rq = urllib.request.Request("https://openspeech.bytedance.com/api/v3/tts/unidirectional", data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "X-Api-Key": key, "X-Api-Resource-Id": res, "X-Api-Request-Id": str(uuid.uuid4())})
    audio, err = b"", ""
    try:
        with urllib.request.urlopen(rq, timeout=90) as r:
            for raw in r:
                s = raw.decode("utf-8", "ignore").strip()
                if s.startswith("data:"): s = s[5:].strip()
                if not s.startswith("{"): continue
                try: o = json.loads(s)
                except Exception: continue
                if o.get("data"): audio += base64.b64decode(o["data"])
                if o.get("code", 0) not in (0, 20000000): err = f"code={o.get('code')} {o.get('message','')}"
    except urllib.error.HTTPError as e:
        err = f"HTTP {e.code} {e.read().decode('utf-8','ignore')[:200]}"
    if not audio: raise SystemExit(f"合成失败：{err.replace(key, '***')}")
    return audio

if __name__ == "__main__":
    EP = os.path.abspath(sys.argv[1]); key, spk, res = creds()
    L = json.load(open(os.path.join(EP, "lines.json"), encoding="utf-8"))
    if L.get("voice", {}).get("speaker"):   # 客户片：用官方预置音色（不是老杨本人复刻），如 zh_male_ruyayichen_uranus_bigtts + seed-tts-2.0
        spk, res = L["voice"]["speaker"], L["voice"].get("resource", "seed-tts-2.0")
    keys = sys.argv[2:] or list(L["lines"]); os.makedirs(os.path.join(EP, "vo_raw"), exist_ok=True); os.makedirs(os.path.join(EP, "vo"), exist_ok=True)
    for k in keys:
        t = L["lines"][k].get("tts", L["lines"][k]["sub"])
        open(os.path.join(EP, "vo_raw", f"{k}.mp3"), "wb").write(synth(t, key, spk, res, None if L.get('voice', {}).get('context') == '' else ctx_for(L, k), L['lines'][k].get('speech_rate', L.get('voice', {}).get('rate')))); print(k, t)
    # 提速和对齐交给 align_chars（它从 vo_raw/ 读、写 vo/）
    if float(L.get("voice", {}).get("tempo", 1.21 if int(L.get("v", 1)) >= 2 else 1.0)) == 1.0:
        for k in keys: os.replace(os.path.join(EP, "vo_raw", f"{k}.mp3"), os.path.join(EP, "vo", f"{k}.mp3"))
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "align_chars.py"), EP, *keys], check=True)
