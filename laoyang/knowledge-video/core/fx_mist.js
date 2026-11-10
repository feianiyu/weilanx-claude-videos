// =====================================================================
// 老杨魔方 · 深度版融合层 fx_mist.js（深度 v2.3，lines.json 写 "fx" 才启用；STANDARD_DEEP_V2 §2.8）
// 把「霓虹彩雾版」的彩雾粒子 + 知识分享版的文字出场，垫在深度版的卡片后面 / 前面：
//   · 彩雾：#mist 画布（540×960，放大到 1080×1920），软光斑 + 微尘，位置是时间的解析函数（不逐帧模拟）
//   · 事件：每张卡开始一次「脉冲」；hook / punch / bignum / myth 卡开始一次「炸开」，炸开前 0.6s「收拢」蓄力；
//           lines.json → fx.hits 里的锚点也是炸开点（结论、数字落下的那一刻）
//   · 强度：数据卡（柱图 / 折线 / 瀑布 / 四象限）里雾退到 0.3，让图说话；问题卡 / 金句卡拉满
//   · fxtext 卡：整张卡就是一句核心观点，用 fx_text.js 的粒子 / 雾化 / 水流 / 光扫 / 碎裂 / 逐字出场
// 全部是时间的纯函数。与 fx.js / fx_particles.js / fx_text.js 在同一闭包里（需要 X=#fxo 的 2D 上下文）。
// =====================================================================
const MIST_LEVEL={hook:1,punch:1,question:0.95,bignum:0.8,myth:0.8,fxtext:1,quote:0.7,focus:0.6,duo:0.55,text:0.7,check:0.6,index:0.5,
 bars:0.3,chart:0.3,waterfall:0.3,line:0.3,matrix:0.3,balance:0.4,split:0.35,flow:0.4,shift:0.5,chain:0.5};
const MIST_BURST=new Set(['hook','punch','bignum','myth','fxtext']);
const MIST_COLS=[[245,166,35],[255,122,60],[255,206,120],[63,208,201],[120,150,255]];   // 橙 · 赤橙 · 金 · 青 · 靛（橙为主，青靛点缀）
const MIST_N=34, DUST_N=260;
function _mistSeedBlob(i){const r=k=>rnd(i*9.17+k*3.31+0.5);const ci=r(1)<0.62?(r(2)<0.5?0:(r(3)<0.5?1:2)):(r(4)<0.55?3:4);
 return {bx:r(5)*540,by:r(6)*960,R:70+r(7)*120,a:0.05+r(8)*0.07,col:MIST_COLS[ci],f:0.05+r(9)*0.09,ph:r(10)*6.283};}
const _MB=[...Array(MIST_N)].map((_,i)=>_mistSeedBlob(i));
const _MD=[...Array(DUST_N)].map((_,i)=>{const r=k=>rnd(i*5.71+k*2.13+9.1);return {bx:r(1)*540,by:r(2)*960,s:0.6+r(3)*1.6,z:0.3+r(4)*0.7,a:0.25+r(5)*0.5,col:MIST_COLS[r(6)<0.7?2:(r(7)<0.5?0:3)],ph:r(8)*6.283};});
let _FXEV=null;
function fxEvents(){ // 由卡片和 fx.hits 生成事件表 [{t,k:'pulse'|'burst',w}]
 if(_FXEV)return _FXEV;const ev=[];
 CARDS.forEach(k=>{const c=k.c;ev.push({t:c.t0,k:MIST_BURST.has(c.type)?'burst':'pulse',w:MIST_BURST.has(c.type)?1:0.45});});
 ((window.DATA.fx||{}).hits||[]).forEach(t=>ev.push({t,k:'burst',w:0.9}));
 ev.sort((a,b)=>a.t-b.t);return _FXEV=ev;}
function mistLevel(t){ // 当前卡的雾强度，卡与卡之间 0.5s 平滑
 let cur=null,prev=null;CARDS.forEach(k=>{const c=k.c;if(t>=c.t0-0.01&&t<=c.t1+0.01){if(!cur||c.t0>=cur.t0)cur=c;}else if(t>c.t1&&(!prev||c.t1>prev.t1))prev=c;});
 if(!cur)return 0.5;const L=c=>MIST_LEVEL[c.type]!=null?MIST_LEVEL[c.type]:0.6,u=eo(cl((t-cur.t0)/0.5));
 return prev&&cur.t0-prev.t1<0.8?lerp(L(prev),L(cur),u):L(cur);}
// 事件造成的「冲量」：炸开 = 向外推 + 变亮，指数衰减；收拢 = 炸开前 0.6s 向内缩
function mistImpulse(t){let push=0,glow=0;const ev=fxEvents();
 for(const e of ev){const dt=t-e.t;
  if(e.k==='burst'){if(dt>=-0.6&&dt<0){push-=0.35*e.w*SM((dt+0.6)/0.6);glow+=0.25*e.w*SM((dt+0.6)/0.6);}
   else if(dt>=0&&dt<2.4){const k=Math.exp(-dt/0.55);push+=e.w*k;glow+=0.9*e.w*k;}}
  else if(dt>=0&&dt<1.4){const k=Math.exp(-dt/0.35);push+=0.3*e.w*k;glow+=0.5*e.w*k;}}
 return {push,glow};}
function mistFrame(t){
 const cv=$('mist'),g=cv.getContext('2d'),cfg=window.DATA.fx||{},amt=(cfg.mist==null?0.8:cfg.mist),lv=mistLevel(t),{push,glow}=mistImpulse(t);
 g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,540,960);g.globalCompositeOperation='lighter';
 const cx=270,cy=500;
 for(const b of _MB){
  let x=b.bx+46*Math.sin(t*b.f*6.283+b.ph)+24*Math.sin(t*b.f*2.9+b.ph*1.7),y=b.by+60*Math.cos(t*b.f*5.1+b.ph*1.3);
  const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)+1,p=push*(150+d*0.35);x+=dx/d*p;y+=dy/d*p;
  const R=b.R*(1+0.35*Math.max(0,push)-0.2*Math.max(0,-push)),al=Math.min(0.7,b.a*(1+glow*1.8)*amt*lv*2.1);
  if(al<=0.004)continue;const gr=g.createRadialGradient(x,y,0,x,y,R),[r,gg,bb]=b.col;
  gr.addColorStop(0,`rgba(${r},${gg},${bb},${al.toFixed(3)})`);gr.addColorStop(0.5,`rgba(${r},${gg},${bb},${(al*0.38).toFixed(3)})`);gr.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
  g.fillStyle=gr;g.beginPath();g.arc(x,y,R,0,6.283);g.fill();}
 for(const m of _MD){ // 微尘：近的快远的慢，炸开时向外抛
  let x=m.bx+30*m.z*Math.sin(t*0.21*m.z+m.ph),y=((m.by-t*9*m.z)%960+960)%960;
  const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)+1,p=push*(60+d*0.9)*m.z;x+=dx/d*p;y+=dy/d*p;
  const tw=0.65+0.35*Math.sin(t*(1.2+m.z)+m.ph*3),al=Math.min(1,m.a*tw*(0.55+0.7*glow)*amt*(0.35+0.65*lv)),[r,gg,bb]=m.col;
  if(al<=0.01)continue;g.fillStyle=`rgba(${r},${gg},${bb},${al.toFixed(3)})`;const s=m.s*(1+0.8*Math.max(0,push));g.fillRect(x-s/2,y-s/2,s,s);}
 cv.style.opacity=1;}
// fxtext 卡：整句核心观点，卡的 t0 入场、t1 前退场；data={lines:[[["字","#F5A623"],…]],size,cy,in,out}
function fxTextFrame(t){const o=$('fxo'),g=o.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,1080,1920);
 CARDS.forEach(k=>{const c=k.c;if(c.type!=='fxtext')return;const d=c.data,outFx=d.out||'雾散',dO=TXDUR.out[outFx];
  if(t<c.t0||t>c.t1+0.02)return;showText(c.id,{lines:d.lines,size:d.size||78,cy:d.cy||900,lh:d.lh},t,c.t0,Math.max(c.t0+TXDUR.in[d.in||'雾化'],c.t1-dO),d.in||'雾化',outFx,1,d.bloom);});}
function fxFrame(t){mistFrame(t);fxTextFrame(t);}
