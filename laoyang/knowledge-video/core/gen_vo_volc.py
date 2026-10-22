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

def synth(text, key, spk, res):
    body = {"user": {"uid": "laoyang"}, "req_params": {"text": text, "speaker": spk,
            "audio_params": {"format": "mp3", "sample_rate": 24000}}}
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
    keys = sys.argv[2:] or list(L["lines"]); os.makedirs(os.path.join(EP, "vo_raw"), exist_ok=True); os.makedirs(os.path.join(EP, "vo"), exist_ok=True)
    for k in keys:
        t = L["lines"][k].get("tts", L["lines"][k]["sub"])
        open(os.path.join(EP, "vo_raw", f"{k}.mp3"), "wb").write(synth(t, key, spk, res)); print(k, t)
    # 提速和对齐交给 align_chars（它从 vo_raw/ 读、写 vo/）
    if float(L.get("voice", {}).get("tempo", 1.0)) == 1.0:
        for k in keys: os.replace(os.path.join(EP, "vo_raw", f"{k}.mp3"), os.path.join(EP, "vo", f"{k}.mp3"))
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "align_chars.py"), EP, *keys], check=True)
