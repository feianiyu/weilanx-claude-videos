#!/usr/bin/env python3
"""深度 v8：把 play（试玩卡）导出成一个能在手机上玩的 H5 小游戏（单个 html 文件，不联网、不依赖任何库）。
片里那张卡是「手」替观众拖；这里是观众自己拖。同一份数据，数字一定对得上。
  python3 core/game.py <期目录>        → <期>/build/小游戏_<卡id>.html（build.py 遇到 play 卡会自动调用）
lines.json 可选 "game": {"intro": "玩之前的一句话", "foot": "页脚，默认：完整解读看 抖音 / 视频号「老杨魔方」"}
"""
import os, sys, json, html

TPL = r"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>__TITLE__ · 老杨魔方</title>
<style>
:root{--o:#F5A623;--w:#F4F1EA;--g:#8E8A82;--g2:#3E3B36}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0b0a08;color:var(--w);font-family:"PingFang SC","HarmonyOS Sans SC","Microsoft YaHei","Noto Sans SC",sans-serif;font-weight:500;-webkit-font-smoothing:antialiased}
.wrap{max-width:560px;margin:0 auto;padding:22px 18px 40px}
.brand{display:flex;align-items:center;gap:10px;font-weight:900;font-size:17px}
.brand i{display:inline-block;width:22px;height:22px;border:3px solid var(--o);border-radius:5px;transform:rotate(45deg) scale(.8)}
.brand span{color:var(--g);font-weight:600;font-size:13px;margin-left:4px}
.ey{color:var(--o);font-size:13px;letter-spacing:2px;font-weight:900;margin-top:22px}
h1{font-size:26px;line-height:1.35;font-weight:900;margin-top:8px}
h1 em,.cap em{font-style:normal;color:var(--o)}
.intro{color:var(--g);font-size:15px;line-height:1.6;margin-top:10px}
.box{margin-top:20px;padding:20px 18px;border:1px solid var(--g2);border-radius:16px;background:#14120f}
.in{margin-bottom:26px}
.l{display:flex;justify-content:space-between;align-items:baseline;font-size:17px;font-weight:900}
.l b{color:var(--o);font-size:24px;font-variant-numeric:tabular-nums}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:4px;background:linear-gradient(to right,var(--o) var(--p,50%),var(--g2) var(--p,50%));margin-top:16px;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;border-radius:50%;background:var(--w);border:5px solid var(--o);box-shadow:0 2px 8px rgba(0,0,0,.6)}
input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:var(--w);border:5px solid var(--o)}
.mm{display:flex;justify-content:space-between;color:var(--g);font-size:12px;margin-top:8px}
.outs{display:flex;gap:12px;flex-wrap:wrap}
.out{flex:1;min-width:140px;border-top:3px solid var(--g2);padding-top:10px}
.out.hot{border-top-color:var(--o)}
.ol{color:var(--g);font-size:13px;font-weight:700}
.ov{font-size:34px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.2}
.out.hot .ov{color:var(--o)}
.ov small{font-size:16px;margin-left:4px}
.ob{height:6px;background:#2A2723;border-radius:3px;margin-top:6px;overflow:hidden}.ob div{height:100%;background:var(--g);border-radius:3px;transition:width .15s}.out.hot .ob div{background:var(--o)}
.keys{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.keys button{border:1px solid var(--o);color:var(--o);background:transparent;border-radius:999px;padding:7px 14px;font-size:14px;font-weight:700}
.keys button:active{background:var(--o);color:#111}
.cap{margin-top:14px;font-size:16px;line-height:1.6;min-height:26px;font-weight:700}
.note{color:var(--g);font-size:12px;line-height:1.6;margin-top:18px}
.foot{margin-top:26px;text-align:center;color:var(--g);font-size:13px;line-height:1.7}
.foot b{color:var(--o)}
</style></head><body><div class="wrap">
<div class="brand"><i></i>老杨魔方<span>企业经营观察</span></div>
<div class="ey">__EY__</div><h1>__H1__</h1>__INTRO__
<div class="box" id="box"></div>
<div class="keys" id="keys"></div><div class="cap" id="cap"></div>
__NOTE__
<div class="foot">__FOOT__</div>
</div>
<script>
const G=__DATA__;
const hi=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\|/g,'<br>');
const names=[...G.inputs.map(x=>x.k),...Object.keys(G.consts||{})],cv=Object.values(G.consts||{});
const fns=G.outputs.map(o=>{try{return new Function(...names,'return ('+o.f+');');}catch(e){return()=>NaN;}});
const box=document.getElementById('box');
box.innerHTML=G.inputs.map((x,i)=>`<div class="in"><div class="l"><span>${hi(x.label)}</span><b id="v${i}"></b></div><input type="range" id="r${i}" min="${x.min}" max="${x.max}" step="${x.step||1}" value="${x.v}"><div class="mm"><span>${x.min}${x.unit||''}</span><span>${x.max}${x.unit||''}</span></div></div>`).join('')+
 `<div class="outs">`+G.outputs.map((o,i)=>`<div class="out${o.hot?' hot':''}"><div class="ol">${hi(o.label)}</div><div class="ov"><span id="o${i}"></span><small>${o.unit||''}</small></div>${o.bar===false?'':`<div class="ob"><div id="b${i}"></div></div>`}</div>`).join('')+`</div>`;
const dec=x=>(String(x.step||1).split('.')[1]||'').length;
function upd(){const vals=G.inputs.map((x,i)=>{const r=document.getElementById('r'+i),v=+r.value;r.style.setProperty('--p',(100*(v-x.min)/(x.max-x.min))+'%');document.getElementById('v'+i).textContent=v.toFixed(dec(x))+(x.unit||'');return v;});
 G.outputs.forEach((o,i)=>{let v=NaN;try{v=+fns[i](...vals,...cv);}catch(e){}document.getElementById('o'+i).textContent=isFinite(v)?v.toFixed(o.dec==null?1:o.dec):'—';
  const b=document.getElementById('b'+i);if(b)b.style.width=Math.max(0,Math.min(100,100*v/(o.max||1)))+'%';});}
G.inputs.forEach((x,i)=>document.getElementById('r'+i).addEventListener('input',()=>{document.getElementById('cap').innerHTML='';upd();}));
const ks=document.getElementById('keys');
G.inputs.forEach((x,i)=>(x.keys||[]).forEach(k=>{const b=document.createElement('button');b.textContent=`${x.label.replace(/\*/g,'')} ${k.v}${x.unit||''}`;
 b.onclick=()=>{document.getElementById('r'+i).value=k.v;upd();document.getElementById('cap').innerHTML=hi(k.t||'');};ks.appendChild(b);}));
upd();
</script></body></html>"""


def export(D, ep_dir="."):
    out = []
    G = D.get("game") or {}
    for c in D.get("cards", []):
        if c.get("type") != "play": continue
        d = c.get("data", {})
        data = {k: d.get(k) for k in ("inputs", "outputs", "consts")}
        e = lambda s: html.escape(str(s or ""))
        hi = lambda s: e(s).replace("|", "<br>").replace("*", "")
        page = (TPL.replace("__TITLE__", e(str(d.get("title", "算一算")).replace("*", "").replace("|", "")))
                .replace("__EY__", e(d.get("eyebrow", "自己拖一拖")))
                .replace("__H1__", hi(d.get("title", "")))
                .replace("__INTRO__", f'<div class="intro">{e(G.get("intro"))}</div>' if G.get("intro") else "")
                .replace("__NOTE__", f'<div class="note">{e(d.get("note") or d.get("src") or "")}</div>' if (d.get("note") or d.get("src")) else "")
                .replace("__FOOT__", G.get("foot") or "完整解读：抖音 / 视频号搜 <b>老杨魔方</b>")
                .replace("__DATA__", json.dumps(data, ensure_ascii=False)))
        os.makedirs(os.path.join(ep_dir, "build"), exist_ok=True)
        p = os.path.join(ep_dir, "build", f"小游戏_{c['id']}.html")
        open(p, "w", encoding="utf-8").write(page); out.append(p)
    return out


if __name__ == "__main__":
    ep = sys.argv[1]
    for p in export(json.load(open(os.path.join(ep, "lines.json"), encoding="utf-8")), ep): print("小游戏：", p)
