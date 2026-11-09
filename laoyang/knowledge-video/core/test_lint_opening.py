#!/usr/bin/env python3
"""lint_opening 的自测：python3 core/test_lint_opening.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lint_opening import lint
PUB = {"title": "这份合同 多交的税是你签的", "desc": "x", "tags": ["#民营企业", "#老板思维", "#税务合规"]}
def run(first, second="接着看一笔账。", decision="x", cards=({"type": "check"},), publish=PUB):
    L = {"v01": {"sub": first}, "v02": {"sub": second}}
    return lint(L, ["v01", "v02"], {"decision": decision, "cards": list(cards), "publish": publish})
BAD = ["增值税法新规解读：工程企业老板必看。", "一般公共预算收入从哪里来？", "检验检测：长坡厚雪的赛道。", "今天我们这期深度分析高盛的研究报告，", "本期我们来聊聊增值税法。", "大家好，欢迎来到老杨魔方。", "接下来我们一起看看这份文件。", "这份报告指出，高科技撑不起就业。"]
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
e, _ = run(GOOD[0], publish={"title": "增值税法新规解读", "desc": "x", "tags": ["#民营企业", "#老板思维", "#税务"]})
if not any("publish.title" in x for x in e): print("知识框架标题应报错"); fail += 1
e, _ = run(GOOD[0], publish={"title": "很多老板不是被查出来的", "desc": "x", "tags": ["#老板思维", "#朱婷", "#税务"]})
if not any("主标签" in x for x in e) or not any("跑题" in x for x in e): print("缺主标签/跑题标签应报错"); fail += 1
e, _ = run(GOOD[0], publish={"title": "审批快了，生意为什么更难做", "desc": "x", "tags": ["#民营企业", "#老板思维", "#税务"]})
if not any("不允许的符号" in x for x in e): print("标题带逗号应报错"); fail += 1
_, w = run(GOOD[0], publish=None)
if not any("publish" in x for x in w): print("缺 publish 应提示"); fail += 1
_, w = run("麦肯锡今年8月发布了一项全球调查。", "调查覆盖97个国家。")
if not any("感觉词" in x for x in w): print("无感觉词应提示"); fail += 1
print("通过" if not fail else f"失败 {fail} 项"); sys.exit(1 if fail else 0)
