#!/usr/bin/env python3
"""Mac 出片机：渲染一个任务（一条 render/<名字> 分支）。只用标准库 + 知识分享版 core/ 的脚本，不调用任何 AI。

用法（一般由 watch.py 自动调用）：
  python3 render_job.py <分支名，如 render/2026-11-01_主题>     # 拉分支、按 render-queue/job.json 出片
  python3 render_job.py --local <期目录>                        # 不拉代码，直接渲染本机已有的一期（调试用）
  python3 render_job.py --selftest                              # 安装后自检：构建 + 渲染 3 帧，不配音、不下载

任务说明 render-queue/job.json（Claude 推分支时写）：
  {"pipeline": "knowledge-video",                       # 目前支持 knowledge-video；remotion 为测试版
   "episode": "laoyang/knowledge-video/episodes/<期>",
   "voice": "auto",                                     # auto=按 lines.json voice.engine；edge / volc / fake（静音占位）/ skip
   "publish_mb": 25,                                    # 发布版目标大小
   "note": "给老杨看的一句话"}

产出：OUTBOX/<期>/ 下的 成片、发布版、封面、联系表、报告.md；报告和真实配音时间戳推回 render-report/<名字> 分支。
"""
import datetime as dt
import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import CFG, log, run, sh_ok  # noqa: E402

REPO = CFG["WORK"] + "/repo"


class StepFail(Exception):
    pass


class Job:
    def __init__(self, branch=None, local_ep=None):
        self.branch = branch
        self.name = (branch or "local").split("/", 1)[-1]
        self.t0 = time.time()
        self.steps = []          # [(步骤, 状态, 秒, 备注)]
        self.warn = []
        self.facts = {}          # 报告里的数字
        self.frame_issues = []
        self.ep = os.path.abspath(local_ep) if local_ep else None
        self.job = {"pipeline": "knowledge-video", "voice": "auto", "publish_mb": 25}
        self.out = None
        self.logpath = os.path.join(CFG["WORK"], "logs", f"{time.strftime('%Y%m%d-%H%M%S')}_{safe(self.name)}.log")
        os.makedirs(os.path.dirname(self.logpath), exist_ok=True)

    # 每一步：计时、记日志，失败抛 StepFail
    def step(self, title, fn, *, fatal=True):
        log(f"== {title}", self.logpath)
        t = time.time()
        try:
            note = fn() or ""
            self.steps.append((title, "ok", time.time() - t, note))
            return True
        except Exception as e:  # noqa: BLE001
            msg = str(e).strip().splitlines()[-1][:300] if str(e).strip() else type(e).__name__
            self.steps.append((title, "失败" if fatal else "跳过", time.time() - t, msg))
            log(f"!! {title}：{msg}", self.logpath)
            if fatal:
                raise StepFail(f"{title}：{msg}")
            self.warn.append(f"{title}没做成：{msg}")
            return False

    def sh(self, cmd, cwd=None, env=None, timeout=None):
        return run(cmd, cwd=cwd or self.ep, env=env, logpath=self.logpath, timeout=timeout)


def safe(s):
    return re.sub(r"[^\w\-.]+", "_", s)


# ---------------- 取代码 ----------------

def checkout(job: Job):
    if not os.path.isdir(REPO + "/.git"):
        job.sh(["git", "clone", CFG["REPO_URL"], REPO], cwd=CFG["WORK"])
    job.sh(["git", "fetch", "--prune", "origin", f"+refs/heads/{job.branch}:refs/remotes/origin/{job.branch}"], cwd=REPO)
    # 只覆盖仓库里有的文件；被 .gitignore 忽略的配音 mp3、下载的素材留着，下次少花钱少花时间
    job.sh(["git", "checkout", "-f", "--detach", f"origin/{job.branch}"], cwd=REPO)
    sha = job.sh(["git", "rev-parse", "--short", "HEAD"], cwd=REPO).strip()
    jp = os.path.join(REPO, "render-queue", "job.json")
    if not os.path.exists(jp):
        raise StepFail("分支里没有 render-queue/job.json")
    job.job.update(json.load(open(jp, encoding="utf-8")))
    job.ep = os.path.join(REPO, job.job["episode"])
    if not os.path.isdir(job.ep):
        raise StepFail(f"找不到期目录 {job.job['episode']}")
    job.facts["提交"] = sha
    return f"{job.branch} @ {sha}"


# ---------------- 知识分享版 ----------------

def kv_core():
    return os.path.join(REPO if os.path.isdir(REPO) else CFG["TOOLS"], "laoyang", "knowledge-video", "core")


def py():
    return sys.executable


def voice_hash(L, k):
    v = L.get("voice", {})
    t = L["lines"][k].get("tts", L["lines"][k]["sub"])
    return hashlib.sha1(json.dumps([t, v.get("name"), v.get("rate"), v.get("engine"), v.get("tempo")], ensure_ascii=False).encode()).hexdigest()[:12]


def kv_voice(job: Job):
    L = json.load(open(os.path.join(job.ep, "lines.json"), encoding="utf-8"))
    mode = job.job.get("voice", "auto")
    if mode == "skip":
        return "按任务要求不配音（用仓库里已有的音频）"
    if mode == "fake":
        job.sh([py(), os.path.join(kv_core(), "fake_vo.py"), job.ep])
        job.warn.append("用的是静音占位配音（voice=fake），只能看画面")
        return "静音占位配音"
    engine = L.get("voice", {}).get("engine", "edge-tts") if mode == "auto" else mode
    # 配音缓存：按「读法 + 声音参数」算指纹存在仓库外面。台词没改的句子直接拿缓存（本人声音按字收费，能省就省），
    # mp3、逐字时间戳、时长三样一起恢复——仓库里的时间戳可能是 Claude 的占位版，不能和真配音混用。
    cache = os.path.join(CFG["WORK"], "cache", "voice")
    os.makedirs(cache, exist_ok=True)
    vo = os.path.join(job.ep, "vo")
    os.makedirs(vo, exist_ok=True)
    keys = [k for k in L["lines"] if k not in L.get("cut", [])]
    todo = []
    for k in keys:
        h = voice_hash(L, k)
        if os.path.exists(os.path.join(cache, f"{h}.mp3")) and os.path.exists(os.path.join(cache, f"{h}.words.json")):
            shutil.copyfile(os.path.join(cache, f"{h}.mp3"), os.path.join(vo, f"{k}.mp3"))
            shutil.copyfile(os.path.join(cache, f"{h}.words.json"), os.path.join(vo, f"{k}.words.json"))
        else:
            todo.append(k)
    job.facts["配音"] = f"{engine}，新配 {len(todo)} 句，沿用缓存 {len(keys) - len(todo)} 句"
    if todo:
        if engine in ("volc", "volcano", "本人"):
            env = dict(os.environ)
            env.update(read_env(CFG["TTS_ENV"]))
            if not env.get("VOLC_API_KEY"):
                raise StepFail(f"本人声音缺凭证：{CFG['TTS_ENV']} 里没有 VOLC_API_KEY")
            job.sh([py(), os.path.join(kv_core(), "gen_vo_volc.py"), job.ep, *todo], env=env, timeout=1800)
        else:
            job.sh([py(), os.path.join(kv_core(), "gen_vo.py"), job.ep, *todo], timeout=900)
    # 所有句子的时长按真实 mp3 重写进 lines.json（build 按它排时间轴）
    lp = os.path.join(job.ep, "lines.json")
    L = json.load(open(lp, encoding="utf-8"))
    for k in keys:
        mp3 = os.path.join(vo, f"{k}.mp3")
        if not os.path.exists(mp3):
            raise StepFail(f"{k} 没有配音文件")
        d = float(job.sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).strip())
        L["lines"][k]["dur"] = round(d, 2)
        if k in todo:
            h = voice_hash(L, k)
            shutil.copyfile(mp3, os.path.join(cache, f"{h}.mp3"))
            shutil.copyfile(os.path.join(vo, f"{k}.words.json"), os.path.join(cache, f"{h}.words.json"))
    json.dump(L, open(lp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return f"新配 {', '.join(todo) or '无'}"


def read_env(path):
    out = {}
    path = os.path.expanduser(path)
    if os.path.exists(path):
        for ln in open(path, encoding="utf-8"):
            if "=" in ln and not ln.lstrip().startswith("#"):
                k, v = ln.split("=", 1)
                out[k.strip()] = v.strip()
    return out


def kv_whisper(job: Job):
    """多音字抽查：本机 mlx-whisper 把每句配音转回文字，和台词比对，差得多的列进报告。不影响出片。"""
    wpy = os.path.expanduser(CFG["WHISPER_PY"])
    if not os.path.exists(wpy):
        raise RuntimeError(f"没找到本机 whisper（{CFG['WHISPER_PY']}），跳过")
    L = json.load(open(os.path.join(job.ep, "lines.json"), encoding="utf-8"))
    files = [(k, os.path.join(job.ep, "vo", f"{k}.mp3")) for k in L["lines"] if k not in L.get("cut", [])]
    files = [(k, f) for k, f in files if os.path.exists(f)]
    code = (
        "import json,sys,mlx_whisper\n"
        "out={}\n"
        "for k,f in json.load(open(sys.argv[1])):\n"
        "    out[k]=mlx_whisper.transcribe(f,path_or_hf_repo=sys.argv[2],language='zh',initial_prompt='以下是普通话。')['text']\n"
        "json.dump(out,open(sys.argv[3],'w'),ensure_ascii=False)\n"
    )
    tmp = os.path.join(job.ep, "build", "whisper_in.json")
    res = os.path.join(job.ep, "build", "whisper_out.json")
    os.makedirs(os.path.dirname(tmp), exist_ok=True)
    json.dump(files, open(tmp, "w"))
    job.sh([wpy, "-c", code, tmp, CFG["WHISPER_MODEL"], res], timeout=900)
    heard = json.load(open(res, encoding="utf-8"))
    norm = lambda s: re.sub(r"[^一-鿿0-9a-zA-Z]", "", s)
    bad = []
    for k, _ in files:
        want = norm(L["lines"][k].get("tts", L["lines"][k]["sub"]))
        got = norm(heard.get(k, ""))
        r = difflib.SequenceMatcher(None, want, got).ratio()
        if r < CFG["WHISPER_MIN_RATIO"]:
            bad.append(f"{k}（相似度 {r:.2f}）听到：{heard.get(k, '').strip()[:40]}")
    job.facts["多音字抽查"] = "全部对得上" if not bad else f"{len(bad)} 句要听一下"
    job.whisper_bad = bad
    return f"{len(files)} 句，可疑 {len(bad)} 句"


def kv_assets(job: Job):
    """下载素材，再逐个确认是能打开的音频 / 图片；下坏的（网页报错页、半截文件）删掉，构建会当静音或占位处理并写进报告。"""
    out = job.sh([py(), os.path.join(kv_core(), "fetch_assets.py"), job.ep], timeout=900)
    D = json.load(open(os.path.join(job.ep, "lines.json"), encoding="utf-8"))
    files = [D.get("bg", "assets/bg.jpg")] + ([D["bgm"]["file"]] if isinstance(D.get("bgm"), dict) else []) + [c["file"] for c in D.get("sfxlib", {}).values()]
    broken = []
    for f in files:
        p = os.path.join(job.ep, f)
        if not os.path.exists(p):
            continue
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True)
        if r.returncode != 0 or os.path.getsize(p) < 1000:
            os.remove(p)
            broken.append(f)
    fails = [ln for ln in out.splitlines() if ln.startswith("失败")]
    if broken or fails:
        job.warn.append(f"素材没下全：{len(fails)} 个下载失败，{len(broken)} 个文件损坏已删（{', '.join(broken)[:120]}）——成片里对应的声音会是静音")
    return f"失败 {len(fails)}，损坏 {len(broken)}"


def kv_beat(job: Job):
    lp = os.path.join(job.ep, "lines.json")
    L = json.load(open(lp, encoding="utf-8"))
    bgm = L["bgm"]["file"] if isinstance(L.get("bgm"), dict) else L.get("bgm")
    if L.get("beat"):
        return "lines.json 已有拍子"
    if not bgm or not os.path.exists(os.path.join(job.ep, bgm)):
        return "没有配乐文件，跳过测拍"
    rough = os.path.join(job.ep, "build", "beats_rough.json")
    os.makedirs(os.path.dirname(rough), exist_ok=True)
    job.sh([py(), os.path.join(kv_core(), "beats.py"), bgm, rough])
    tempo = json.load(open(rough))["tempo"]
    out = job.sh([py(), os.path.join(kv_core(), "beatfit.py"), bgm, "90", f"{tempo:.1f}"], timeout=1200)
    b = json.loads(out.strip().splitlines()[-1])
    L["beat"] = {"bpm": b["bpm"], "period": b["period"], "t0": b["t0"], "src": f"Mac 出片机自动测拍（粗测 {tempo:.1f}）"}
    json.dump(L, open(lp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    job.warn.append(f"lines.json 原来没有拍子，已自动测出 {b['bpm']} BPM；乐句线 bgmSection 需要 Claude 再定")
    return f"{b['bpm']} BPM"


def kv_qc_frames(job: Job):
    out = job.sh([py(), os.path.join(kv_core(), "qc.py"), job.ep], timeout=1800)
    m = re.search(r"帧问题：\s*(\d+)", out)
    job.facts["越界 / 字幕问题帧"] = int(m.group(1)) if m else "未知"
    job.frame_issues = [ln.strip() for ln in out.splitlines() if re.match(r"\s*\d+\.\d+s\s*\[", ln)][:20]
    miss = re.search(r"缺音频（静音占位）：\s*(.+)", out)
    if miss:
        job.facts["缺音频"] = miss.group(1)[:200]
    con = re.search(r"控制台：\s*(.+)", out)
    if con and con.group(1).strip() != "无":
        job.warn.append("页面控制台有报错：" + con.group(1)[:200])
    return f"问题帧 {job.facts['越界 / 字幕问题帧']}"


def kv_qc_video(job: Job):
    out = job.sh([py(), os.path.join(kv_core(), "qc.py"), job.ep, "--video"], timeout=1200)
    lu = re.search(r"响度 I =\s*(-?[\d.]+)", out)
    pk = re.search(r"真峰值\s*(-?[\d.]+)", out)
    fl = re.search(r"亮度跳变 最大\s*([\d.]+)", out)
    if lu:
        job.facts["响度"] = f"{lu.group(1)} LUFS（目标 −14±0.5）"
        if abs(float(lu.group(1)) + 14) > 0.5:
            job.warn.append(f"响度 {lu.group(1)} LUFS 不在 −14±0.5")
    if pk:
        job.facts["真峰值"] = f"{pk.group(1)} dBFS"
    if fl:
        job.facts["亮度跳变最大"] = f"{fl.group(1)}（应 < 20）"
        if float(fl.group(1)) >= 20:
            job.warn.append(f"亮度跳变 {fl.group(1)}，会闪眼")
    return out.strip().replace("\n", "；")[:200]


def find_video(job: Job):
    vids = sorted((os.path.join(job.ep, "out", f) for f in os.listdir(os.path.join(job.ep, "out")) if f.endswith(".mp4") and "发布版" not in f), key=os.path.getmtime)
    if not vids:
        raise StepFail("out/ 里没有成片")
    return vids[-1]


def publish_version(job: Job):
    src = find_video(job)
    mb = float(job.job.get("publish_mb", 25))
    size = os.path.getsize(src) / 1e6
    dst = src[:-4] + "_发布版.mp4"
    if size <= mb:
        shutil.copyfile(src, dst)
        return f"成片 {size:.1f}MB，本身就够小"
    dur = float(job.sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).strip())
    vk = max(800, int(mb * 8000 * 0.94 / dur) - 160)
    base = os.path.join(job.ep, "build", "x264pass")
    common = ["-c:v", "libx264", "-preset", "slow", "-b:v", f"{vk}k", "-pix_fmt", "yuv420p"]
    job.sh(["ffmpeg", "-y", "-v", "error", "-i", src, *common, "-pass", "1", "-passlogfile", base, "-an", "-f", "mp4", os.devnull], timeout=1800)
    job.sh(["ffmpeg", "-y", "-v", "error", "-i", src, *common, "-pass", "2", "-passlogfile", base, "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", dst], timeout=1800)
    return f"{size:.1f}MB → {os.path.getsize(dst) / 1e6:.1f}MB"


def run_knowledge_video(job: Job, selftest=False):
    core = kv_core()
    if selftest:
        job.step("占位配音", lambda: job.sh([py(), os.path.join(core, "fake_vo.py"), job.ep]) and "")
        job.step("构建", lambda: job.sh([py(), os.path.join(core, "build.py"), job.ep]) and "")
        job.step("渲染 3 帧", lambda: job.sh([py(), os.path.join(core, "render.py"), job.ep, "snap", "1.0", "5.0", "10.0"]) and "")
        return
    job.step("配音", lambda: kv_voice(job))
    job.step("多音字抽查（本机 whisper）", lambda: kv_whisper(job), fatal=False)
    job.step("下载底图、配乐、音效", lambda: kv_assets(job))
    job.step("测拍", lambda: kv_beat(job), fatal=False)
    job.step("构建", lambda: job.sh([py(), os.path.join(core, "build.py"), job.ep], timeout=900) and "")
    job.step("逐秒质检", lambda: kv_qc_frames(job))
    job.step("渲染成片", lambda: job.sh([py(), os.path.join(core, "render.py"), job.ep, "final", "--jobs", str(CFG["JOBS"])], timeout=7200) and "")
    job.step("响度与闪烁检查", lambda: kv_qc_video(job), fatal=False)
    job.step("封面", lambda: job.sh([py(), os.path.join(core, "cover.py"), job.ep]) and "", fatal=False)
    job.step("压发布版", lambda: publish_version(job), fatal=False)


# ---------------- Remotion（测试版） ----------------

def run_remotion(job: Job):
    root = REPO
    comp = job.job["composition"]
    if not sh_ok(["npm", "--version"]):
        raise StepFail("这台 Mac 没装 Node.js / npm")
    if not os.path.isdir(os.path.join(root, "node_modules")):
        job.step("安装依赖（只第一次）", lambda: job.sh(["npm", "ci", "--no-audit", "--no-fund"], cwd=root, timeout=1800) and "")
    if job.job.get("audio"):
        job.step("合成配乐", lambda: job.sh(job.job["audio"].split(), cwd=root, timeout=900) and "")
    os.makedirs(os.path.join(job.ep, "out"), exist_ok=True)
    dst = os.path.join(job.ep, "out", f"{comp}.mp4")
    job.step("渲染成片", lambda: job.sh(["npx", "remotion", "render", "src/index.ts", comp, dst, f"--concurrency={CFG['JOBS']}"], cwd=root, timeout=7200) and "")
    if job.job.get("cover"):
        job.step("封面", lambda: job.sh(["npx", "remotion", "still", "src/index.ts", job.job["cover"], os.path.join(job.ep, "out", "封面.png")], cwd=root) and "", fatal=False)
    job.step("压发布版", lambda: publish_version(job), fatal=False)


# ---------------- 交付与报告 ----------------

def deliver(job: Job):
    title = os.path.basename(job.ep.rstrip("/"))
    job.out = os.path.join(os.path.expanduser(CFG["OUTBOX"]), title)
    os.makedirs(job.out, exist_ok=True)
    got = []
    out_dir = os.path.join(job.ep, "out")
    for f in sorted(os.listdir(out_dir)) if os.path.isdir(out_dir) else []:
        if f.endswith((".mp4", ".png")):
            shutil.copy2(os.path.join(out_dir, f), os.path.join(job.out, f))
            got.append(f)
    for f in ("发布文案.md", "FACTS.md", "CREDITS.md"):
        p = os.path.join(job.ep, f)
        if os.path.exists(p):
            shutil.copy2(p, os.path.join(job.out, f))
            got.append(f)
    sheet = os.path.join(job.ep, "build", "qc_sheet.png")
    if os.path.exists(sheet):
        # 缩小的联系表：Claude 只看这一张，省 token
        job.sh(["ffmpeg", "-y", "-v", "error", "-i", sheet, "-vf", "scale=1280:-2", "-q:v", "5", os.path.join(job.out, "联系表.jpg")])
        got.append("联系表.jpg")
    return "、".join(got)


def verdict(job: Job, failed):
    if failed:
        return "失败"
    bad = any(isinstance(v, int) and v > 0 for k, v in job.facts.items() if "问题帧" in k)
    return "要看一下" if (job.warn or bad or getattr(job, "whisper_bad", [])) else "通过"


def write_report(job: Job, failed=None):
    v = verdict(job, failed)
    lines = [f"# 出片报告：{job.name}", "",
             f"- 结论：**{v}**" + (f"（{failed}）" if failed else ""),
             f"- 时间：{dt.datetime.now():%Y-%m-%d %H:%M}，用时 {(time.time() - job.t0) / 60:.1f} 分钟",
             f"- 成片位置：{job.out or '（未生成）'}"]
    if job.job.get("note"):
        lines.append(f"- Claude 的备注：{job.job['note']}")
    lines += ["", "## 数字", ""] + [f"- {k}：{val}" for k, val in job.facts.items()]
    if job.warn:
        lines += ["", "## 需要注意", ""] + [f"- {w}" for w in job.warn]
    if job.frame_issues:
        lines += ["", "## 问题帧（前 20 条）", ""] + [f"- `{x}`" for x in job.frame_issues]
    if getattr(job, "whisper_bad", None):
        lines += ["", "## 可能读错的句子（请戴耳机听）", ""] + [f"- {x}" for x in job.whisper_bad]
    lines += ["", "## 步骤", "", "| 步骤 | 结果 | 秒 | 备注 |", "| --- | --- | --- | --- |"]
    lines += [f"| {a} | {b} | {c:.0f} | {d} |" for a, b, c, d in job.steps]
    if failed:
        tail = open(job.logpath, encoding="utf-8", errors="ignore").read().splitlines()[-40:]
        lines += ["", "## 日志最后 40 行", "", "```", *tail, "```"]
    text = "\n".join(lines) + "\n"
    for d in filter(None, [job.ep and os.path.join(job.ep, "build"), job.out]):
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "出片报告.md"), "w", encoding="utf-8").write(text)
    return v, text


def push_report(job: Job):
    """把报告、缩小的联系表、真实配音的时间戳推到 render-report/<名字>，Claude 用 git 就能读到，不用你转述。"""
    if not CFG["PUSH_REPORTS"] or not job.branch:
        return "按配置不推送"
    rel = os.path.relpath(job.ep, REPO)
    rep_dir = os.path.join(job.ep, "render-report")
    os.makedirs(rep_dir, exist_ok=True)
    shutil.copy2(os.path.join(job.ep, "build", "出片报告.md"), rep_dir)
    if job.out and os.path.exists(os.path.join(job.out, "联系表.jpg")):
        shutil.copy2(os.path.join(job.out, "联系表.jpg"), rep_dir)
    meta = os.path.join(job.ep, "build", "meta.json")
    if os.path.exists(meta):
        shutil.copy2(meta, rep_dir)
    job.sh(["git", "add", "-f", os.path.join(rel, "render-report"), os.path.join(rel, "lines.json")] +
           ([os.path.join(rel, "vo")] if os.path.isdir(os.path.join(job.ep, "vo")) else []), cwd=REPO)
    # 只提交 json 时间戳，不提交 mp3
    job.sh(["git", "reset", "-q", "--", *[os.path.relpath(p, REPO) for p in _mp3s(job.ep)]], cwd=REPO) if _mp3s(job.ep) else None
    env = dict(os.environ, GIT_AUTHOR_NAME="Mac 出片机", GIT_AUTHOR_EMAIL="render@laoyang.local",
               GIT_COMMITTER_NAME="Mac 出片机", GIT_COMMITTER_EMAIL="render@laoyang.local")
    job.sh(["git", "commit", "-q", "-m", f"出片报告：{job.name}"], cwd=REPO, env=env)
    job.sh(["git", "push", "-q", "-f", "origin", f"HEAD:refs/heads/render-report/{job.name}"], cwd=REPO, timeout=300)
    return f"render-report/{job.name}"


def _mp3s(ep):
    out = []
    for root, _, files in os.walk(os.path.join(ep, "vo")):
        out += [os.path.join(root, f) for f in files if f.endswith(".mp3")]
    return out


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    if args[0] == "--selftest":
        ep = os.path.join(CFG["WORK"], "selftest")
        shutil.rmtree(ep, ignore_errors=True)
        shutil.copytree(os.path.join(CFG["TOOLS"], "laoyang", "knowledge-video", "starter"), ep)
        job = Job(local_ep=ep)
        try:
            run_knowledge_video(job, selftest=True)
            snaps = [f for f in os.listdir(os.path.join(ep, "build")) if f.startswith("snap_")]
            print(f"自检通过 ✅  渲染出 {len(snaps)} 帧：{os.path.join(ep, 'build')}")
        except StepFail as e:
            sys.exit(f"自检失败 ❌ {e}\n日志：{job.logpath}")
        return
    job = Job(local_ep=args[1]) if args[0] == "--local" else Job(branch=args[0])
    failed = None
    try:
        if job.branch:
            job.step("拉取代码", lambda: checkout(job))
        if job.job.get("pipeline", "knowledge-video") == "knowledge-video":
            run_knowledge_video(job)
        elif job.job["pipeline"] == "remotion":
            run_remotion(job)
        else:
            raise StepFail(f"暂不支持的管线：{job.job['pipeline']}")
        job.step("放进待审文件夹", lambda: deliver(job))
    except StepFail as e:
        failed = str(e)
        try:
            deliver(job)
        except Exception:  # noqa: BLE001
            pass
    v, text = write_report(job, failed)
    if job.branch:
        job.step("报告推回 GitHub", lambda: push_report(job), fatal=False)
        v, text = write_report(job, failed)
    from notify import notify
    notify(job.name, v, text, job.out)
    print(text)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
