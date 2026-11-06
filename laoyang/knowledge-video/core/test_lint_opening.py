#!/usr/bin/env python3
"""lint_opening 的自测：python3 core/test_lint_opening.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lint_opening import lint
def run(first, second="接着看一笔账。", decision="x", cards=({"type": "check"},)):
    L = {"v01": {"sub": first}, "v02": {"sub": second}}
    return lint(L, ["v01", "v02"], {"decision": decision, "cards": list(cards)})
BAD = ["今天我们这期深度分析高盛的研究报告，", "本期我们来聊聊增值税法。", "大家好，欢迎来到老杨魔方。", "接下来我们一起看看这份文件。", "这份报告指出，高科技撑不起就业。"]
GOOD = ["你花两个亿买下一家公司，最值钱的东西却没跟过来。", "同样一百万，地产能养4.6个人，高科技只能养3个。", "甲供工程，你还在按3%开票吗？"]
fail = 0
for t in BAD:
    e, _ = run(t)
    if not e: print("应报错却通过：", t); fail += 1
for t in GOOD:
    e, _ = run(t)
    if e: print("不应报错：", t, e); fail += 1
e, _ = run(GOOD[0], decision="")
if not any("decision" in x for x in e): print("缺 decision 应报错"); fail += 1
e, _ = run("这是一句很长很长很长很长很长很长很长很长很长很长很长很长的开场白它已经超过了三十个字了")
if not any("太长" in x for x in e): print("超长首句应报错"); fail += 1
print("通过" if not fail else f"失败 {fail} 项"); sys.exit(1 if fail else 0)
