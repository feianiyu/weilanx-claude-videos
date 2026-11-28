#!/usr/bin/env python3
"""统一钛金魔方图库（core/assets/cube_lib/）的共用确定性挑图模块。

被 core/cover.py、core/build.py 和 console/produce.py 共同调用：
- 同一套 14 张 1152×2048 黑曜石×拉丝钛银×香槟金魔方图，同时服务封面底图和视频正片底图。
- 确定性：按期目录名哈希排序，同一期重出封面或重渲染视频，挑图结果完全一致。
- 跨期避重：扫描同级目录中排在当前期之前的期目录，避开前 n_avoid 期（默认 3 期）用过的主图，
  保证相邻几期绝不重复。
"""
import hashlib
import json
import os

CORE = os.path.dirname(os.path.abspath(__file__))
LIB_DIR = os.path.join(CORE, "assets", "cube_lib")
MANIFEST = os.path.join(LIB_DIR, "manifest.json")


def load_items():
    return json.load(open(MANIFEST, encoding="utf-8"))["items"]


def item_path(item):
    return os.path.join(LIB_DIR, item.get("file") or (item["id"] + ".jpg"))


def _rank(items, ep_name):
    return sorted(
        items,
        key=lambda it: hashlib.sha1(f"{ep_name}:{it['id']}".encode("utf-8")).hexdigest(),
    )


def _resolve_primary_history(items, ep_dir, n_avoid=3):
    """按同级目录名顺序依次推演各期主图，确保任意相邻 (n_avoid + 1) 期不撞图。"""
    ep_dir = os.path.abspath(ep_dir).rstrip(os.sep)
    name = os.path.basename(ep_dir)
    parent = os.path.dirname(ep_dir)
    siblings = []
    if parent and os.path.isdir(parent):
        siblings = sorted(
            x
            for x in os.listdir(parent)
            if x < name
            and not x.startswith(("_", "."))
            and os.path.isdir(os.path.join(parent, x))
        )
    recent_ids = []
    for sib in siblings:
        ranked = _rank(items, sib)
        avoid = set(recent_ids[-n_avoid:]) if n_avoid > 0 else set()
        chosen = next((it for it in ranked if it["id"] not in avoid), ranked[0])
        recent_ids.append(chosen["id"])
    return name, recent_ids[-n_avoid:] if n_avoid > 0 else []


def pick_cover(ep_dir, n_avoid=3, override_id=None):
    """为当前期挑选封面底图（支持 cover.bg 指定 id，如 'A'..'N'）。"""
    items = load_items()
    by_id = {it["id"]: it for it in items}
    if override_id and override_id in by_id:
        return by_id[override_id]
    name, avoid_list = _resolve_primary_history(items, ep_dir, n_avoid=n_avoid)
    avoid = set(avoid_list)
    ranked = _rank(items, name)
    return next((it for it in ranked if it["id"] not in avoid), ranked[0])


def pick_bgs(ep_dir, count=2, n_avoid=3):
    """为当前期挑选 count 张不同的视频正片底图（第 1 张与本期封面同源，第 2 张作中段叠化）。"""
    items = load_items()
    name, avoid_list = _resolve_primary_history(items, ep_dir, n_avoid=n_avoid)
    avoid = set(avoid_list)
    ranked = _rank(items, name)
    picked = []
    for it in ranked:
        if it["id"] not in avoid and it["id"] not in {x["id"] for x in picked}:
            picked.append(it)
            if len(picked) >= count:
                break
    for it in ranked:
        if len(picked) >= count:
            break
        if it["id"] not in {x["id"] for x in picked}:
            picked.append(it)
    return picked[:count]
