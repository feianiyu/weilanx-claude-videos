#!/usr/bin/env python3
"""本地免费配音（默认 G 版：Apple Silicon MPS 直连 IndexTTS 2.5 整段语义 + 贴近火山重读参数）。
也兼容 VoiceStudio HTTP 接口（POST /v1/audio/speech）作为回退引擎。

用法：
  python3 core/gen_vo_local.py --check                   # 检测本机 IndexTTS 2.5 (MPS) 与 VoiceStudio 就绪状态
  python3 core/gen_vo_local.py <期目录> [v01 v02 ...]     # 为指定句子（或全部句子）生成 vo/<句>.mp3 + words.json

环境变量（或 config.env）：
  VOICESTUDIO_MODEL     默认 "indextts2"（MPS 直连 G 版）；填 "omnivoice" 等则走 VoiceStudio HTTP
  VOICESTUDIO_VOICE     默认 "老杨_自然版"
  VOICESTUDIO_REF_AUDIO 默认 ~/laoyang-render/lab/laoyang_ref_v2.wav
  VOICESTUDIO_URL       HTTP 回退模式地址，默认自动探测 127.0.0.1:3900
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

CORE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.expanduser("~")
INDEXTTS_DIR = os.environ.get(
    "INDEXTTS_DIR",
    os.path.join(HOME, "Library", "Application Support", "OmniVoice", "engines", "indextts2", "index-tts-2.5"),
)
INDEXTTS_PY = os.path.join(INDEXTTS_DIR, ".venv", "bin", "python")
DEFAULT_REF_AUDIO = os.path.join(HOME, "laoyang-render", "lab", "laoyang_ref_v2.wav")

# G 版核定参数（贴近火山原版：整段语义连贯 + 降速 5% + 关键词自然重读，零 atempo 失真）
G_DURATION_FACTOR = 0.93
G_INTERVAL_SILENCE = 190
# 8 维情绪向量 [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
G_EMO_VECTOR = [0.0, 0.0, 0.0, 0.04, 0.0, 0.0, 0.10, 0.12]
G_MASTER_AF = "highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9"


def _indextts_ready():
    return (
        os.path.isfile(INDEXTTS_PY)
        and os.path.isfile(os.path.join(INDEXTTS_DIR, "configs", "config_v2_5.yaml"))
        and os.path.isfile(os.path.join(INDEXTTS_DIR, "checkpoints", "gpt.pth"))
    )


def _probe_url():
    env_url = (os.environ.get("VOICESTUDIO_URL") or "").strip().rstrip("/")
    cands = [env_url] if env_url else [
        "http://127.0.0.1:3900",
        "http://127.0.0.1:8000",
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
    ref = os.path.expanduser(os.environ.get("VOICESTUDIO_REF_AUDIO") or DEFAULT_REF_AUDIO)
    if _indextts_ready():
        print("IndexTTS 2.5 (MPS 直连 G 版) 已就绪：", INDEXTTS_DIR)
        print("参考音频：", ref, "✅" if os.path.isfile(ref) else "❌ 不存在")
    else:
        print("IndexTTS 2.5 (MPS 直连) 未安装：", INDEXTTS_DIR)
    base = _probe_url()
    if base:
        print("VoiceStudio HTTP 备用服务已就绪：", base)
        try:
            ms = _get_json(base + "/v1/models")
            ids = [m.get("id") for m in ms.get("data", [])]
            print("HTTP 可用模型：", ", ".join(ids[:12]) or "（无）")
        except Exception:
            pass
    elif not _indextts_ready():
        sys.exit("未检测到可用的本地配音引擎（IndexTTS 2.5 未就绪且 VoiceStudio 未启动）。")


# ------------------------------------------------------------------ 整段分句与静音谷切分

def _norm_sentence(text):
    t = (text or "").strip()
    if t and t[-1] in "，、：；":
        t = t[:-1] + "。"
    elif t and t[-1] not in "。！？.!?":
        t = t + "。"
    return t


def _group_paragraphs(keys, lines_dict, max_chars=125, max_lines=4):
    """按相邻章节 sec 将连续句子聚合成自然语义段落，供整段一次合成。"""
    groups = []
    cur = []
    cur_sec = None
    cur_chars = 0
    for k in keys:
        item = lines_dict[k]
        sec = item.get("sec")
        txt = _norm_sentence(item.get("tts") or item["sub"])
        if cur and (sec != cur_sec or len(cur) >= max_lines or cur_chars + len(txt) > max_chars):
            groups.append(cur)
            cur = []
            cur_chars = 0
        cur.append((k, txt))
        cur_sec = sec
        cur_chars += len(txt)
    if cur:
        groups.append(cur)
    return groups


def _ffprobe_dur(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        text=True,
    ).strip()
    return float(out)


def _detect_silences(wav_path, noise_db=-34, min_dur=0.07):
    """用 ffmpeg silencedetect 找自然句间静音谷 [(mid, start, end, dur), ...]。"""
    p = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", wav_path,
         "-af", f"silencedetect=noise={noise_db}dB:d={min_dur}",
         "-f", "null", "-"],
        capture_output=True, text=True,
    )
    stderr = p.stderr or ""
    starts = [float(m) for m in re.findall(r"silence_start:\s*([0-9.]+)", stderr)]
    ends = [(float(m[0]), float(m[1])) for m in re.findall(r"silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)", stderr)]
    valleys = []
    for i, (e, d) in enumerate(ends):
        s = starts[i] if i < len(starts) else max(0.0, e - d)
        valleys.append(((s + e) / 2.0, s, e, d))
    return valleys


def _find_split_points(wav_path, texts):
    """根据每句字数占比匹配最接近的自然静音谷，返回 N-1 个安全切分点；若任一边界不明确则返回 None。"""
    n = len(texts)
    if n <= 1:
        return []
    total_dur = _ffprobe_dur(wav_path)
    if total_dur <= 0.5:
        return None
    valleys = _detect_silences(wav_path, noise_db=-34, min_dur=0.07)
    if len(valleys) < n - 1:
        valleys = _detect_silences(wav_path, noise_db=-30, min_dur=0.05)
    # 过滤掉首尾 0.35s 内的静音
    valleys = [v for v in valleys if 0.35 < v[0] < total_dur - 0.35]
    if len(valleys) < n - 1:
        return None

    lens = [max(2, len(re.sub(r"\s+", "", t))) for t in texts]
    tot_len = sum(lens)
    targets = []
    acc = 0
    for ln in lens[:-1]:
        acc += ln
        targets.append(total_dur * acc / tot_len)

    # 动态匹配：每个 target 选最近的未使用静音谷，且严格递增、误差不超过 ±22% 总时长
    chosen = []
    prev_t = 0.25
    tol = max(1.3, total_dur * 0.22)
    for idx, tgt in enumerate(targets):
        rem = len(targets) - idx - 1
        cands = [v for v in valleys if v[0] > prev_t + 0.35 and v[0] < total_dur - 0.35 * (rem + 1)]
        if not cands:
            return None
        best = min(cands, key=lambda v: abs(v[0] - tgt) - min(v[3], 0.25) * 0.4)
        if abs(best[0] - tgt) > tol:
            return None
        chosen.append(best[0])
        prev_t = best[0]
    return chosen


def _master_slice(in_wav, out_mp3, start=None, end=None):
    cmd = ["ffmpeg", "-y", "-v", "error"]
    if start is not None:
        cmd += ["-ss", f"{start:.3f}"]
    if end is not None:
        cmd += ["-to", f"{end:.3f}"]
    cmd += [
        "-i", in_wav,
        "-af", G_MASTER_AF,
        "-ar", "48000", "-ac", "1", "-b:a", "192k", out_mp3,
    ]
    subprocess.run(cmd, check=True)


# ------------------------------------------------------------------ IndexTTS 2.5 MPS 直连批量合成

_WORKER_CODE = r'''
import json, os, sys, time
from indextts.infer_v2_5 import IndexTTS2

cfg_in = json.loads(sys.argv[1])
t0 = time.time()
tts = IndexTTS2(
    cfg_path="configs/config_v2_5.yaml",
    model_dir="checkpoints",
    device="mps",
    use_bf16=False,
    use_qwen_emo=False,
)
print(f"[IndexTTS 2.5 MPS] 模型加载完成 ({time.time()-t0:.1f}s)", flush=True)

for item in cfg_in["tasks"]:
    t1 = time.time()
    tts.infer(
        spk_audio_prompt=cfg_in["ref_audio"],
        text=item["text"],
        output_path=item["out_wav"],
        lang="zh",
        use_emo_text=False,
        emo_vector=cfg_in["emo_vector"],
        interval_silence=cfg_in["interval_silence"],
        duration_factor=cfg_in["duration_factor"],
        max_text_tokens_per_segment=180,
        verbose=False,
    )
    print(f"  [MPS] {item['label']} ({time.time()-t1:.1f}s)", flush=True)
'''


def _run_indextts_worker(tasks, ref_audio, duration_factor=G_DURATION_FACTOR):
    payload = {
        "ref_audio": ref_audio,
        "emo_vector": G_EMO_VECTOR,
        "interval_silence": G_INTERVAL_SILENCE,
        "duration_factor": float(duration_factor),
        "tasks": tasks,
    }
    env = dict(os.environ, TOKENIZERS_PARALLELISM="false")
    subprocess.run(
        [INDEXTTS_PY, "-u", "-c", _WORKER_CODE, json.dumps(payload, ensure_ascii=False)],
        cwd=INDEXTTS_DIR,
        env=env,
        check=True,
    )


def _synth_episode_indextts(keys, lines_dict, vo_dir, ref_audio, duration_factor=G_DURATION_FACTOR):
    if not os.path.isfile(ref_audio):
        raise FileNotFoundError(f"找不到参考音频：{ref_audio}")
    groups = _group_paragraphs(keys, lines_dict)
    print(f"IndexTTS 2.5 (MPS G 版) ref={os.path.basename(ref_audio)} 共 {len(keys)} 句 → {len(groups)} 个语义段落", flush=True)

    with tempfile.TemporaryDirectory(prefix="indextts_g_") as tmp:
        # 第 1 轮：整段一次加载模型并合成所有段落
        para_tasks = []
        for gi, grp in enumerate(groups):
            out_wav = os.path.join(tmp, f"para_{gi:03d}.wav")
            para_tasks.append({
                "label": f"段{gi+1}/{len(groups)} ({grp[0][0]}..{grp[-1][0]})",
                "text": "".join(t for _, t in grp),
                "out_wav": out_wav,
            })
        _run_indextts_worker(para_tasks, ref_audio, duration_factor=duration_factor)

        # 第 2 轮：按自然静音谷无损切回单句 mp3；若某段无法安全切分，回退单句补合成
        fallback_tasks = []
        for gi, grp in enumerate(groups):
            wav_p = para_tasks[gi]["out_wav"]
            if len(grp) == 1:
                k, txt = grp[0]
                _master_slice(wav_p, os.path.join(vo_dir, f"{k}.mp3"))
                print(f"  ok {k}  {txt[:28]}", flush=True)
                continue
            pts = _find_split_points(wav_p, [t for _, t in grp])
            if pts is None:
                print(f"  [fallback] 段 {gi+1} ({grp[0][0]}..{grp[-1][0]}) 句间连读过紧，改用单句精准补合成", flush=True)
                for k, txt in grp:
                    fallback_tasks.append({
                        "label": k,
                        "text": txt,
                        "out_wav": os.path.join(tmp, f"fb_{k}.wav"),
                        "key": k,
                    })
                continue
            bounds = [0.0, *pts, None]
            for idx, (k, txt) in enumerate(grp):
                _master_slice(wav_p, os.path.join(vo_dir, f"{k}.mp3"), start=bounds[idx], end=bounds[idx + 1])
                print(f"  ok {k}  {txt[:28]}", flush=True)

        if fallback_tasks:
            _run_indextts_worker(fallback_tasks, ref_audio, duration_factor=duration_factor)
            for t in fallback_tasks:
                _master_slice(t["out_wav"], os.path.join(vo_dir, f"{t['key']}.mp3"))
                print(f"  ok {t['key']} (补合成)  {t['text'][:24]}", flush=True)


# ------------------------------------------------------------------ VoiceStudio HTTP 回退

def _synth_one_http(base, text, out_mp3, model, voice, speed=1.02, instructions=None):
    t_send = _norm_sentence(text)
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
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", raw_wav,
         "-af", "highpass=f=75,acompressor=threshold=-20dB:ratio=2:attack=8:release=120,apad=pad_dur=0.12",
         "-ar", "48000", "-ac", "1", "-b:a", "192k", out_mp3],
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
    lp = os.path.join(ep, "lines.json")
    L = json.load(open(lp, encoding="utf-8"))
    vcfg = L.get("voice", {})
    model = (os.environ.get("VOICESTUDIO_MODEL") or vcfg.get("model") or "indextts2").strip()
    voice = (os.environ.get("VOICESTUDIO_VOICE") or vcfg.get("name") or "老杨_自然版").strip()
    ref_audio = os.path.expanduser(os.environ.get("VOICESTUDIO_REF_AUDIO") or vcfg.get("ref_audio") or DEFAULT_REF_AUDIO)

    vo_dir = os.path.join(ep, "vo")
    os.makedirs(vo_dir, exist_ok=True)
    keys = only or [k for k in L["lines"] if k not in L.get("cut", [])]

    if model in ("indextts2", "indextts", "indextts25") and _indextts_ready():
        dur_factor = float(vcfg.get("duration_factor") or G_DURATION_FACTOR)
        _synth_episode_indextts(keys, L["lines"], vo_dir, ref_audio, duration_factor=dur_factor)
    else:
        base = _probe_url()
        if not base:
            sys.exit("未检测到运行中的 VoiceStudio 本地服务（请先打开 /Applications/VoiceStudio.app）")
        speed = float(vcfg.get("speed") or 1.02)
        print(f"VoiceStudio HTTP ({base}) model={model} voice={voice} 共 {len(keys)} 句", flush=True)
        for k in keys:
            item = L["lines"][k]
            txt = item.get("tts") or item["sub"]
            emo = item.get("emo") or ""
            _synth_one_http(base, txt, os.path.join(vo_dir, f"{k}.mp3"), model, voice, speed=speed, instructions=emo)
            print(f"  ok {k}  {txt[:28]}", flush=True)

    # 生成逐字时间戳 vo/<k>.words.json（复用已有 align_chars.py）
    subprocess.run([sys.executable, os.path.join(CORE, "align_chars.py"), ep, *keys], check=True)


if __name__ == "__main__":
    main()
