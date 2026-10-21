#!/usr/bin/env python3
"""Edge TTS 配音 + 词级时间戳：python3 core/gen_vo.py <期> [v02 v05 ...]（不给句号 = 全部重配）
声音 lines.json→voice（定稿：zh-CN-YunyangNeural，rate +25%）。读 tts 字段（数字写读法、多音字写同音字），没有就读 sub。
网络走代理时 Edge TTS 可能连不上：env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY python3 core/gen_vo.py ..."""
import json, asyncio, subprocess, sys, os
import edge_tts
EP = os.path.abspath(sys.argv[1]); os.chdir(EP); os.makedirs("vo", exist_ok=True)
L = json.load(open("lines.json")); V = L["voice"]; K = sys.argv[2:] or list(L["lines"])
async def one(k, t):
    c = edge_tts.Communicate(t, V["name"], rate=V["rate"], pitch=V.get("pitch", "+0Hz"), boundary="WordBoundary"); words = []
    with open(f"vo/{k}.mp3", "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] in ("WordBoundary", "SentenceBoundary"): words.append({"w": ch["text"], "s": ch["offset"] / 1e7, "e": (ch["offset"] + ch["duration"]) / 1e7})
    json.dump(words, open(f"vo/{k}.words.json", "w"), ensure_ascii=False)
async def main(): await asyncio.gather(*[one(k, L["lines"][k].get("tts", L["lines"][k]["sub"])) for k in K])
asyncio.run(main()); tot = 0
for k in L["lines"]:
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"vo/{k}.mp3"], capture_output=True, text=True).stdout)
    L["lines"][k]["dur"] = round(d, 2); tot += d
json.dump(L, open("lines.json", "w"), ensure_ascii=False, indent=1)
print("重配：", K, " 人声合计", round(tot, 1), "s")
