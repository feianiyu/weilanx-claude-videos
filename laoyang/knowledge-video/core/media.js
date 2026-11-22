// =====================================================================
// 老杨魔方 · 深度 v8「媒体层」（STANDARD_DEEP_V8.md，2026-11-21）
// v7 解决了「同一张图怎么摆」；v8 往片子里放三样代码画不出来的东西：
//   photo  实景 / 原件图卡：照片、报告原页截图、AI 生成图。慢推、镜头推到某处、钉注（pins）
//   clip   视频镜头卡：素材库视频或 AI 生成的 3–6 秒镜头。build 时用 ffmpeg 抽成逐帧 jpg，按时间取帧（纯函数）
//   play   试玩卡：一个能拖的小模型（滑杆 → 结果），片里由「手」拖给观众看；同一份数据 build 时导出成能玩的 H5 小游戏
//   bleed  任何卡都能写 data.bleed = {媒体}：这张卡在屏上时，媒体铺满整屏当「动态底图」（钩子卡最常用）
// 媒体字段（photo / clip 的 data 里，或 data.bleed 里）：
//   file 本地文件（默认 assets/media/<卡id>.jpg|mp4）  url 素材库原链接（Mac 下载）  gen {prompt, kind:"img|video", dur, ratio} AI 生成（Mac 生成）
//   credit 出处（自动进出处行）  label 角标（AI 生成的自动标「AI 生成」；素材不是事件本身时写「示意」）
//   frame full | wide | tall | doc（原件：纸面、完整显示）  h 盒子高度  kb [起, 止] 慢推倍数  pan [x0,y0,x1,y1] 焦点（0–1）
//   zoom {x, y, z, s, back} 第 s 个 step 镜头推到 (x,y)  pins [{x, y, t, s}] 钉注（跟着画面走）  in 视频从第几秒开始  rate 播放速度
// 纯函数：画面只由 t 决定。图片 / 帧没解码完时 render(t) 返回 Promise，截图前等它（Playwright 的 evaluate 会自动等）。
// =====================================================================
(function(){const st=document.createElement('style');st.textContent=`
.md-w{position:relative;margin-top:22px}
.md-box{position:relative;margin:0 auto;border-radius:18px;overflow:hidden;background:#15130f;box-shadow:0 18px 60px rgba(0,0,0,.55)}
.md-box canvas{position:absolute;left:0;top:0}
.md-box.md-doc{background:#EDE8DE;border-radius:6px;box-shadow:0 24px 70px rgba(0,0,0,.7)}
.md-lab{position:absolute;left:16px;top:16px;font-size:24px;font-weight:900;color:#111;background:rgba(244,241,234,.92);padding:4px 14px;border-radius:999px;letter-spacing:1px;z-index:3}
.md-lab.ai{background:var(--o)}
.md-ph{position:absolute;left:40px;right:40px;top:50%;transform:translateY(-50%);text-align:center;color:#8E8A82;font-size:28px;line-height:1.5;z-index:2}
.md-ph b{display:block;color:#F4F1EA;font-size:34px;margin-bottom:10px}
.md-pin{position:absolute;left:0;top:0;z-index:4;white-space:nowrap}
.md-pin i{position:absolute;left:-15px;top:-15px;width:30px;height:30px;border-radius:50%;border:5px solid var(--o);box-shadow:0 0 0 6px rgba(245,166,35,.25),0 0 22px rgba(245,166,35,.6)}
.md-pin span{position:absolute;left:28px;top:-26px;font-size:32px;font-weight:900;color:#F4F1EA;background:rgba(10,10,10,.86);border-left:6px solid var(--o);padding:6px 16px;border-radius:6px;line-height:1.3}
.md-pin.l span{left:auto;right:28px;border-left:0;border-right:6px solid var(--o)}
.md-cap{font-size:40px;font-weight:900;line-height:1.4;margin-top:26px;text-align:center}
#mdbg{position:absolute;left:0;top:0;width:1080px;height:1920px;pointer-events:none}
.pl-box{position:relative;margin-top:26px;padding:34px 40px 30px;border:2px solid #3E3B36;border-radius:22px;background:rgba(12,11,9,.82)}
.pl-in{position:relative;margin-bottom:34px}
.pl-l{display:flex;justify-content:space-between;align-items:baseline;font-size:36px;font-weight:900}
.pl-l b{color:var(--o);font-size:46px;font-variant-numeric:tabular-nums}
.pl-tr{position:relative;height:14px;border-radius:7px;background:#3E3B36;margin-top:22px}
.pl-fill{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:var(--o)}
.pl-knob{position:absolute;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:#F4F1EA;border:7px solid var(--o);box-shadow:0 4px 18px rgba(0,0,0,.6)}
.pl-mm{display:flex;justify-content:space-between;font-size:24px;color:#8E8A82;margin-top:16px}
.pl-mm i{font-style:normal}
.pl-outs{display:flex;gap:22px;margin-top:6px}
.pl-out{flex:1;border-top:4px solid #3E3B36;padding-top:16px}
.pl-out.hot{border-top-color:var(--o)}
.pl-ol{font-size:28px;color:#8E8A82;font-weight:700}
.pl-ov{font-size:76px;font-weight:900;line-height:1.15;font-variant-numeric:tabular-nums}
.pl-out.hot .pl-ov{color:var(--o)}
.pl-ov .unit{font-size:36px;margin-left:6px}
.pl-ob{height:12px;background:#2A2723;border-radius:6px;margin-top:10px;overflow:hidden}
.pl-obf{height:100%;background:#8E8A82;border-radius:6px}.pl-out.hot .pl-obf{background:var(--o)}
.pl-caps{position:relative;height:104px;margin-top:22px}
.pl-cap{position:absolute;left:0;right:0;top:0;font-size:36px;font-weight:900;line-height:1.4;opacity:0}
.pl-hand{position:absolute;left:0;top:0;width:64px;height:76px;z-index:5;opacity:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.7))}
.pl-cta{margin-top:24px;font-size:34px;font-weight:900;color:#111;background:var(--o);border-radius:999px;padding:12px 30px;display:inline-block}
.pl-cta-i{margin-right:12px}
`;document.head.appendChild(st);})();
const MD_FR={full:[920,700],wide:[920,518],tall:[600,800],doc:[760,860]};
const _mdLab=m=>m.label||(m.gen?'AI 生成':'');
function _mdBox(d,m,id){const fr=MD_FR[m.frame||d.frame||'full']?(m.frame||d.frame||'full'):'full',W=MD_FR[fr][0],H=d.h||MD_FR[fr][1],lab=_mdLab(m);
 return `<div class="md-box md-${fr}" data-mdid="${esc(id)}" style="width:${W}px;height:${H}px"><canvas width="${W}" height="${H}" style="width:${W}px;height:${H}px"></canvas>`+
  (lab?`<span class="md-lab${m.gen&&!m.label?' ai':''}">${esc(lab)}</span>`:'')+
  (m.missing?`<div class="md-ph"><b>${m.kind==='video'?'视频镜头占位':'图片占位'}</b>${esc(m.missing).slice(0,60)}</div>`:'')+
  (d.pins||[]).map(p=>`<div class="md-pin${p.side==='l'?' l':''}"><div class="u" data-s="${p.s==null?0:p.s}"><i></i>${p.t?`<span>${hi(p.t)}</span>`:''}</div></div>`).join('')+`</div>`;}
const _mdCard=d=>head(d)+U(0,_mdBox(d,d.media||{},d._id||''),'md-w')+(d.cap?U(sOf(d.cap,0),hi(d.cap.t||d.cap),'md-cap'):'');
Object.assign(CARD_EXT,{photo:_mdCard,clip:_mdCard,
 // 试玩卡 {eyebrow,title,inputs:[{k,label,min,max,step,unit,v,keys:[{v,s,t}]}],consts:{},outputs:[{label,f,unit,dec,max,hot,bar}],cta:{t,s}}
 play:d=>{const ins=d.inputs||[],outs=d.outputs||[];
  return head(d)+`<div class="pl-box">`+ins.map((x,i)=>`<div class="pl-in" data-i="${i}"><div class="pl-l"><span>${hi(x.label)}</span><b class="pl-val"></b></div>`+
   `<div class="pl-tr"><div class="pl-fill"></div><div class="pl-knob"></div></div><div class="pl-mm"><i>${esc(x.min)}${esc(x.unit||'')}</i><i>${esc(x.max)}${esc(x.unit||'')}</i></div></div>`).join('')+
   `<div class="pl-outs">`+outs.map((o,i)=>`<div class="pl-out${o.hot?' hot':''}" data-o="${i}"><div class="pl-ol">${hi(o.label)}</div><div class="pl-ov"><b></b>${o.unit?`<span class="unit">${esc(o.unit)}</span>`:''}</div>`+
    (o.bar===false?'':`<div class="pl-ob"><div class="pl-obf"></div></div>`)+`</div>`).join('')+`</div>`+
   `<div class="pl-caps">`+ins.flatMap(x=>x.keys||[]).filter(k=>k.t).map(k=>`<div class="pl-cap" data-ks="${k.s}">${hi(k.t)}</div>`).join('')+`</div>`+
   `<svg class="pl-hand" viewBox="0 0 64 76"><path d="M22 4c4 0 7 3 7 7v22l3-1c3-1 6 1 7 3l1 2 3-1c3-1 6 1 7 4l1 2 2-1c3 0 6 2 6 6v12c0 9-7 16-16 16H31c-5 0-9-2-12-6L5 46c-2-3-1-6 2-8 3-2 6-1 8 1l0 0V11c0-4 3-7 7-7z" fill="#F4F1EA" stroke="#111" stroke-width="3" stroke-linejoin="round"/></svg>`+
   `</div>`+(d.cta?U(sOf(d.cta,0),`<span class="pl-cta-i">▶</span>${hi(d.cta.t||d.cta)}`,'pl-cta'):'');}});

// ---------- 取图 / 取帧：没解码完就挂起，render(t) 返回 Promise ----------
const _MDI=new Map();let _MDP=[];
function _mdImg(url){let e=_MDI.get(url);if(!e){const img=new Image();e={img,ok:false};e.p=new Promise(r=>{img.onload=()=>{e.ok=true;r();};img.onerror=()=>{console.error('媒体加载失败：'+url);r();};});img.src=url;_MDI.set(url,e);
  if(_MDI.size>90){for(const [u,x] of _MDI){if(x.ok&&u!==url){_MDI.delete(u);if(_MDI.size<=60)break;}}}}
 return e;}
function _mdSrcAt(m,lt){if(m.kind==='video'&&m.n){const f=Math.max(0,Math.min(m.n-1,Math.floor(lt*30+1e-6)));return m.dir+'/'+String(f+1).padStart(4,'0')+'.jpg';}return m.src;}
// 画一帧：view = {s:缩放, cx, cy}；图像点 (cx,cy) 尽量放到盒子中心，cover 时不露边
function _mdDraw(cv,m,lt,tAbs,view,pins){const X=cv.getContext('2d'),W=cv.width,H=cv.height;
 if(m.missing||!m.src&&!m.n){const g=X.createLinearGradient(0,0,W,H);g.addColorStop(0,'#211d17');g.addColorStop(1,'#0f0e0c');X.fillStyle=g;X.fillRect(0,0,W,H);
  const p=((tAbs*0.35)%1.6)-0.3,bx=p*(W+H);X.save();X.globalAlpha=0.10;X.fillStyle='#F5A623';X.beginPath();X.moveTo(bx,0);X.lineTo(bx+140,0);X.lineTo(bx+140-H,H);X.lineTo(bx-H,H);X.fill();X.restore();
  X.strokeStyle='rgba(245,166,35,.45)';X.setLineDash([16,12]);X.lineWidth=4;X.strokeRect(2,2,W-4,H-4);X.setLineDash([]);
  (pins||[]).forEach(p=>{p.el.style.transform=`translate(${(p.x*W).toFixed(1)}px,${(p.y*H).toFixed(1)}px)`;});return null;}
 const url=_mdSrcAt(m,lt),e=_mdImg(url);
 const paint=()=>{const iw=m.iw||e.img.naturalWidth,ih=m.ih||e.img.naturalHeight;if(!iw||!ih)return;
  const base=m.fit==='contain'?Math.min(W/iw,H/ih):Math.max(W/iw,H/ih),s=base*view.s,dw=iw*s,dh=ih*s;
  const ox=dw<=W?(W-dw)/2:Math.min(0,Math.max(W-dw,W/2-view.cx*dw)),oy=dh<=H?(H-dh)/2:Math.min(0,Math.max(H-dh,H/2-view.cy*dh));
  if(m.fit==='contain'){X.fillStyle='#EDE8DE';X.fillRect(0,0,W,H);}
  X.save();if(m.look!=='raw')X.filter=m.fit==='contain'?'none':'saturate(.82) contrast(1.04)';X.drawImage(e.img,ox,oy,dw,dh);X.restore();
  if(m.fit!=='contain'){const v=X.createLinearGradient(0,H*0.62,0,H);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');X.fillStyle=v;X.fillRect(0,0,W,H);}
  (pins||[]).forEach(p=>{p.el.style.transform=`translate(${(ox+p.x*dw).toFixed(1)}px,${(oy+p.y*dh).toFixed(1)}px)`;});};
 if(e.ok)paint();else _MDP.push(e.p.then(paint));
 return e;}
function _mdView(c,m,d,t){const T=c.t1-c.t0,u=cl((t-c.t0)/Math.max(0.5,T)),kb=m.kb||d.kb||(m.kind==='video'?[1.0,1.03]:[1.0,1.07]),pan=m.pan||d.pan||[0.5,0.5,0.5,0.5];
 let s=kb[0]+(kb[1]-kb[0])*u,cx=pan[0]+(pan[2]-pan[0])*u,cy=pan[1]+(pan[3]-pan[1])*u;const z=d.zoom;
 if(z){const q=io(cl((t-tau(c,z.s==null?1:z.s))/1.0))*(z.back!=null?1-io(cl((t-tau(c,z.back))/0.8)):1);s*=1+((z.z||1.8)-1)*q;cx+=(z.x-cx)*q;cy+=(z.y-cy)*q;}
 return {s,cx,cy};}
// 整屏动态底图层（data.bleed）
let _MDBG=null;
function _mdBg(){if(!_MDBG){_MDBG=document.createElement('canvas');_MDBG.id='mdbg';_MDBG.width=1080;_MDBG.height=1920;document.getElementById('bgs').after(_MDBG);}return _MDBG;}
// ---------- 试玩卡：按时间算滑杆的值、手的位置 ----------
function _plInit(k){const d=k.c.data||{},el=k.el,box=el.querySelector('.pl-box');if(!box)return null;
 const rel=(e)=>{let x=0,y=0;while(e&&e!==box){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent;}return [x,y];};
 const names=[...(d.inputs||[]).map(x=>x.k),...Object.keys(d.consts||{})],cv=Object.values(d.consts||{});
 const P={box,hand:box.querySelector('.pl-hand'),ins:(d.inputs||[]).map((x,i)=>{const row=box.querySelector(`.pl-in[data-i="${i}"]`),tr=row.querySelector('.pl-tr'),[tx,ty]=rel(tr);
   return {x,row,val:row.querySelector('.pl-val'),fill:row.querySelector('.pl-fill'),knob:row.querySelector('.pl-knob'),tx,ty:ty+7,tw:tr.offsetWidth,dec:(String(x.step||1).split('.')[1]||'').length};}),
  outs:(d.outputs||[]).map((o,i)=>{const e=box.querySelector(`.pl-out[data-o="${i}"]`);let fn;try{fn=new Function(...names,'return ('+o.f+');');}catch(err){console.error('试玩卡公式写错：'+o.f);fn=()=>0;}
   return {o,b:e.querySelector('.pl-ov b'),bar:e.querySelector('.pl-obf'),fn};}),
  caps:[...box.querySelectorAll('.pl-cap')].map(e=>({e,s:+e.dataset.ks})),cv};
 const keys=[];P.ins.forEach((p,i)=>(p.x.keys||[]).forEach(kk=>keys.push({i,v:kk.v,s:kk.s})));P.keys=keys.sort((a,b)=>tau(k.c,a.s)-tau(k.c,b.s));return P;}
function _plFrame(k,t){const P=k._pl||(k._pl=_plInit(k));if(!P)return;const c=k.c,MV=0.35,DR=0.9;
 const vals=P.ins.map(p=>{let v=p.x.v;(p.x.keys||[]).forEach(kk=>{const T=tau(c,kk.s)+MV;v=v+(kk.v-v)*io(cl((t-T)/DR));});return v;});
 const kx=(i,v)=>{const p=P.ins[i];return [p.tx+p.tw*cl((v-p.x.min)/(p.x.max-p.x.min)),p.ty];};
 P.ins.forEach((p,i)=>{const f=cl((vals[i]-p.x.min)/(p.x.max-p.x.min));p.fill.style.width=(f*100).toFixed(2)+'%';p.knob.style.left=(f*100).toFixed(2)+'%';
  p.val.textContent=vals[i].toFixed(p.dec)+(p.x.unit||'');});
 P.outs.forEach(o=>{let v=0;try{v=+o.fn(...vals,...P.cv);}catch(e){}const dec=o.o.dec==null?1:o.o.dec;o.b.textContent=isFinite(v)?v.toFixed(dec):'—';
  if(o.bar)o.bar.style.width=(100*cl(v/(o.o.max||1))).toFixed(2)+'%';});
 // 手：第一个 key 前不出现；每个 key 先花 0.35s 移到滑块，再跟着滑块拖 0.9s
 let a=-1;P.keys.forEach((kk,j)=>{if(t>=tau(c,kk.s))a=j;});
 if(a<0){P.hand.style.opacity=0;}else{const K=P.keys[a],T=tau(c,K.s),i=K.i;
  const startV=P.keys.slice(0,a).filter(x=>x.i===i).reduce((v,x)=>x.v,P.ins[i].x.v);
  const to=kx(i,t<T+MV?startV:vals[i]);let from=a?kx(P.keys[a-1].i,P.keys[a-1].v):[to[0]+120,to[1]+170];
  const q=eo(cl((t-T)/MV)),x=from[0]+(to[0]-from[0])*q,y=from[1]+(to[1]-from[1])*q,press=t>=T+MV&&t<T+MV+DR?0.9:1;
  P.hand.style.opacity=(a?1:eo(cl((t-T)/0.3))).toFixed(3);P.hand.style.transform=`translate(${(x-22).toFixed(1)}px,${(y-4).toFixed(1)}px) scale(${press})`;}
 let cur=null;P.caps.forEach(cp=>{if(t>=tau(c,cp.s)+MV+DR*0.6)cur=cp;});
 P.caps.forEach(cp=>{cp.e.style.opacity=cp===cur?eo(cl((t-tau(c,cp.s)-MV-DR*0.6)/0.4)).toFixed(3):0;});}
// ---------- 每帧（renderCards 末尾调用）----------
function MEDIA_ALL(t,K){let bg=null;if(_MDBG)_MDBG.getContext('2d').clearRect(0,0,1080,1920);
 K.forEach(k=>{const c=k.c,d=c.data||{};const on=t>=c.t0-0.01&&t<=c.t1+0.01;
  if(c.type==='play'&&on)_plFrame(k,t);
  if(d.media&&on){if(!k._md)k._md={cv:k.el.querySelector('.md-box canvas'),pins:[...k.el.querySelectorAll('.md-pin')].map((el,i)=>({el,x:d.pins[i].x,y:d.pins[i].y}))};
   if(k._md.cv)_mdDraw(k._md.cv,d.media,Math.max(0,t-c.t0),t,_mdView(c,d.media,d,t),k._md.pins);}
  // 整屏底图比卡片多留一会儿（默认 0.9s，bleed.hold 可调）再 0.5s 淡出：下一张卡长出来时底下还有画面，不露静态底图（11-22 样片反馈）
  const hold=d.bleed?(d.bleed.hold==null?0.9:d.bleed.hold):0,onB=d.bleed&&t>=c.t0-0.01&&(c.last||t<=c.t1+hold+0.5);
  if(onB){const a=(c.first?1:eo(cl((t-c.t0)/0.4)))*(c.last?1:1-cl((t-(c.t1+hold))/0.5));if(a>0){bg=bg||_mdBg();const X=bg.getContext('2d');
   const off=document.createElement('canvas');off.width=1080;off.height=1920;   // 先画到离屏，再按卡片透明度叠上去（两张 bleed 交叉淡化时不打架）
   const m=d.bleed;
   const blit=()=>{X.save();X.globalAlpha=a*(m.dim==null?0.8:m.dim);X.filter=m.look==='raw'?'none':'saturate(.7) brightness(.62)';X.drawImage(off,0,0);X.restore();};   // 整屏底图压暗、降饱和，和 v3 底图观感一致，字压得住
   const n0=_MDP.length,e=_mdDraw(off,m,Math.max(0,t-c.t0),t,_mdView(c,m,{},t),null);
   if(e&&!e.ok&&_MDP.length>n0)_MDP[_MDP.length-1]=_MDP[_MDP.length-1].then(blit);else blit();}}});}
function MEDIA_WAIT(){if(!_MDP.length)return undefined;const p=Promise.all(_MDP);_MDP=[];return p;}
