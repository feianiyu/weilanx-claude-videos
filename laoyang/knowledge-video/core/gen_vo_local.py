#!/usr/bin/env python3
"""本地免费配音（VoiceStudio OpenAI 兼容接口 POST /v1/audio/speech）。
完全离线运行在 Apple Silicon Mac 上，替代按字收费的火山引擎复刻配音。

用法：
  python3 core/gen_vo_local.py --check                   # 检测本机 VoiceStudio 是否运行，并列出模型与音色
  python3 core/gen_vo_local.py <期目录> [v01 v02 ...]     # 为指定句子（或全部句子）生成 vo/<句>.mp3 + words.json

环境变量（或 config.env）：
  VOICESTUDIO_URL   默认自动探测 127.0.0.1:8000 / 3900 / 8765 / 7860
  VOICESTUDIO_MODEL 默认取 lines.json voice.model，或 "cosyvoice"
  VOICESTUDIO_VOICE 默认取 lines.json voice.name，或 "老杨"
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

CORE = os.path.dirname(os.path.abspath(__file__))


def _probe_url():
    env_url = (os.environ.get("VOICESTUDIO_URL") or "").strip().rstrip("/")
    cands = [env_url] if env_url else [
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3900",
        "http://127.0.0.1:8765",
        "http://127.0.0.1:7860",
    ]
    for base in cands:
        if not base:
            continue
        try:
            with urllib.request.urlopen(base + "/health", timeout=2) as r:
                if r.status == 200:
                    return base
        except Exception:
            continue
    return None


def _get_json(url):
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))


def check():
    base = _probe_url()
    if not base:
        sys.exit("未检测到运行中的 VoiceStudio 本地服务。请先打开 /Applications/VoiceStudio.app 并在应用里下载一个中文模型（推荐 CosyVoice 或 IndexTTS）。")
    print("VoiceStudio 已就绪：", base)
    try:
        ms = _get_json(base + "/v1/models")
        ids = [m.get("id") for m in ms.get("data", [])]
        print("可用模型：", ", ".join(ids[:12]) or "（尚未下载模型）")
    except Exception as e:
        print("读取模型列表跳过：", e)
    try:
        vs = _get_json(base + "/v1/audio/voices")
        names = [v.get("name") or v.get("id") for v in (vs.get("voices") or vs.get("data") or [])]
        print("可用音色：", ", ".join(str(x) for x in names[:12]) or "（请在 VoiceStudio 中创建老杨声音档案）")
    except Exception as e:
        print("读取音色列表跳过：", e)


def _synth_one(base, text, out_mp3, model, voice, speed=1.08, instructions=None):
    # 半句末尾补句号，避免模型尾字未收住
    t_send = text.strip()
    if t_send and t_send[-1] in "，、：；":
        t_send = t_send[:-1] + "。"
    body = {
        "model": model,
        "voice": voice,
        "input": t_send,
        "response_format": "wav",
        "speed": float(speed),
    }
    if instructions:
        body["instructions"] = instructions
    req = urllib.request.Request(
        base + "/v1/audio/speech",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            wav_bytes = r.read()
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="ignore")[:300]
        raise RuntimeError(f"VoiceStudio 合成失败 ({e.code})：{msg}") from e

    raw_wav = out_mp3 + ".raw.wav"
    with open(raw_wav, "wb") as f:
        f.write(wav_bytes)
    # 末尾补 120ms 静音缓冲并转 48kHz mp3，保证 check_vo_tail.py 100% 通过
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", raw_wav,
         "-af", "apad=pad_dur=0.12", "-ar", "48000", "-ac", "1", "-b:a", "192k", out_mp3],
        check=True,
    )
    os.remove(raw_wav)


def main():
    args = sys.argv[1:]
    if not args or args[0] == "--check":
        check()
        return
    ep = os.path.abspath(args[0])
    only = args[1:]
    base = _probe_url()
    if not base:
        sys.exit("未检测到运行中的 VoiceStudio 本地服务（请先打开 /Applications/VoiceStudio.app）")
    lp = os.path.join(ep, "lines.json")
    L = json.load(open(lp, encoding="utf-8"))
    vcfg = L.get("voice", {})
    model = os.environ.get("VOICESTUDIO_MODEL") or vcfg.get("model") or "cosyvoice"
    voice = os.environ.get("VOICESTUDIO_VOICE") or vcfg.get("name") or "老杨"
    speed = float(vcfg.get("speed") or 1.08)

    vo_dir = os.path.join(ep, "vo")
    os.makedirs(vo_dir, exist_ok=True)
    keys = only or [k for k in L["lines"] if k not in L.get("cut", [])]
    print(f"VoiceStudio ({base}) model={model} voice={voice} 共 {len(keys)} 句")
    for k in keys:
        item = L["lines"][k]
        txt = item.get("tts") or item["sub"]
        emo = item.get("emo") or ""
        out_mp3 = os.path.join(vo_dir, f"{k}.mp3")
        _synth_one(base, txt, out_mp3, model, voice, speed=speed, instructions=emo)
        print(f"  ok {k}  {txt[:28]}")

    # 生成逐字时间戳 vo/<k>.words.json（复用已有 align_chars.py）
    subprocess.run([sys.executable, os.path.join(CORE, "align_chars.py"), ep, *keys], check=True)


if __name__ == "__main__":
    main()
