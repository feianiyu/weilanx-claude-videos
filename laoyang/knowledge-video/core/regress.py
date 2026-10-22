#!/usr/bin/env python3
"""回归测试（改 core/ 之后必跑；GitHub 上每个 PR 自动跑）
  python3 core/regress.py            对比基准图，任何一帧超差 / 越界 / 控制台报错 → 失败
  python3 core/regress.py --update   有意改了画面：重生成基准图（必须在 CHANGELOG 里写明为什么）
做法：LY_REGRESS=1 构建（占位底图 + 全静音 → 任何机器结果一致）→ 抽关键帧 → 缩到 180×320 → 与 regress/golden/ 比较。
"""
import os, sys, json, subprocess, asyncio
import numpy as np
from PIL import Image
CORE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(CORE)
sys.path.insert(0, CORE)
from _browser import launch_args
from _checks import CHECK
from playwright.async_api import async_playwright

# 回归用例：每个范例期 + 关键时间点（覆盖每个章节、每种文字效果的入/停/出）
CASES = {
 "2026-10-21_规划院转型": [3.5, 9, 14, 19.5, 25.5, 30, 36, 41, 47, 53, 58, 63.5, 69],
 "_demo_c2_粒子世界":     [21.6, 24.6, 25.6, 27.4, 28.6, 30.0, 32.8],
 "_demo_text_文字出场":   [1.0, 3.0, 5.3, 7.2, 11.0, 13.6, 17.4, 19.5, 24.4, 25.4, 29.9, 31.6, 35.0, 37.0],
 "starter":              [1.5, 7.0, 15.5],
 "2026-10-21_科研去哪里":   [1.0, 5.5, 17.0, 23.5, 30.0, 40.0, 47.5, 55.0, 61.0],   # v2 头条版式基准
}
TOL_MEAN, TOL_PX = 0.8, 25          # 同一台机器上结果逐像素一致（差为 0）；跨机器只容许极少量抗锯齿差异
# 判定：缩图后「变化 >40 的像素」超过 TOL_PX 个，或平均差 > TOL_MEAN → 画面变了
UPDATE = "--update" in sys.argv
GOLD = os.path.join(ROOT, "regress", "golden")

def ep_path(name): return os.path.join(ROOT, name if name == "starter" else os.path.join("episodes", name))

async def shoot(name, times):
    ep = ep_path(name); res = []
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(viewport={"width": 1080, "height": 1920}); errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None); pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file://" + os.path.join(ep, "build/index.html") + "?capture=1"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
        for t in times:
            await pg.evaluate(f"render({t})"); iss = [x for x in await pg.evaluate(CHECK) if "提示" not in x]
            png = os.path.join(ep, "build", f"rg_{t:06.2f}.png"); await pg.screenshot(path=png); res.append((t, png, iss))
        await br.close()
    return res, errs

fail = 0; report = []
GHA = os.environ.get("GITHUB_ACTIONS") == "true"
def gh_note(level, msg):   # 在 GitHub 上显示为检查注释（PR 的 Checks 页能直接看到）
    if GHA: print(f"::{level} title=知识分享版回归::{msg}", flush=True)
for name, times in CASES.items():
    ep = ep_path(name)
    r = subprocess.run([sys.executable, os.path.join(CORE, "build.py"), ep], env=dict(os.environ, LY_REGRESS="1"), capture_output=True, text=True)
    if r.returncode: gh_note("error", f"{name} 构建失败 {(r.stderr or r.stdout)[-300:]}")
    if r.returncode: print(f"✗ {name} 构建失败\n{r.stdout[-800:]}{r.stderr[-1500:]}"); fail += 1; continue
    shots, errs = asyncio.run(shoot(name, times))
    if errs: print(f"✗ {name} 控制台报错：{errs[:5]}"); gh_note("error", f"{name} 控制台报错 {errs[:3]}"); fail += 1
    os.makedirs(os.path.join(GOLD, name), exist_ok=True)
    for t, png, iss in shots:
        im = Image.open(png).convert("RGB").resize((180, 320), Image.LANCZOS); g = os.path.join(GOLD, name, f"{t:06.2f}.png")
        if iss: print(f"✗ {name} {t}s 越界：{iss[:3]}"); gh_note("error", f"{name} {t}s 越界 {iss[:2]}"); fail += 1
        if UPDATE: im.save(g, optimize=True); continue
        if not os.path.exists(g): print(f"✗ {name} {t}s 没有基准图（先 --update）"); fail += 1; continue
        d = np.abs(np.asarray(im, np.int16) - np.asarray(Image.open(g).convert("RGB"), np.int16)).max(2)
        m, p99 = float(d.mean()), int((d > 40).sum()); ok = m <= TOL_MEAN and p99 <= TOL_PX
        report.append((name, t, m, p99, ok)); print(f"  {name[:8]} {t:6.2f} mean {m:.3f} changed>40 {p99} max {float(d.max()):.0f} px>30 {int((d>30).sum())}") if os.environ.get("RG_V") else None
        if not ok:
            fail += 1; Image.fromarray(np.concatenate([np.asarray(Image.open(g).convert("RGB")), np.asarray(im)], 1)).save(os.path.join(ep, "build", f"diff_{t:06.2f}.png"))
            gh_note("error", f"{name} {t}s 画面变了：平均差 {m:.2f}，明显变化像素 {p99} 个")
            print(f"✗ {name} {t}s 画面变了：平均差 {m:.2f}，明显变化像素 {p99} 个（左基准 右现在：{ep}/build/diff_{t:06.2f}.png）")
if UPDATE: print("基准图已更新 →", GOLD, "（记得在 CHANGELOG 写明有意改了什么画面）"); sys.exit(0)
if GHA:
    worst = sorted(report, key=lambda x: -x[3])[:8]
    gh_note("notice", "最大差异帧：" + "；".join(f"{n[:6]} {t}s 均差{m:.2f} 变化{p}" for n, t, m, p, _ in worst))
    with open(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull), "a") as fh:
        fh.write("| 期 | 秒 | 平均差 | 明显变化像素 | 结果 |\n|---|---|---|---|---|\n" + "".join(f"| {n} | {t} | {m:.2f} | {p} | {'✓' if ok else '✗'} |\n" for n, t, m, p, ok in report))
print(f"\n{len(report)} 帧对比，{sum(1 for x in report if x[4])} 帧通过；失败 {fail} 项")
sys.exit(1 if fail else 0)
