// 「枯寂 → 繁花」：一棵植物，从干枯的枝骨，到根在地下暗暗生长，到树液上行、新枝抽出、繁花炸开。
// 画面 = 时间 t 的纯函数（结构在加载时由固定种子生成）。40 秒，30fps，无旁白。
const W=1080,H=1920,FPS=30,DUR=40;
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const lerp=(a,b,k)=>a+(b-a)*k, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo3=x=>1-Math.pow(1-x,3), eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, sm=x=>x*x*(3-2*x);
const eob=x=>{const c1=1.4,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};
const gauss=r=>{let u=0;for(let i=0;i<4;i++)u+=r();return (u-2)/0.58;};
const SERIF='"Noto Serif SC","Noto Serif CJK SC",serif', SANS='"Noto Sans SC","Noto Sans CJK SC",sans-serif';
const T={dry:0,roots:[5.5,15],sap:14.5,shoots:18.0,bloom:24.0,flush:28.0,tint:[30,38],zoom:[22,40]};
const GROUND=1560, BASE=[540,GROUND];

// ── 结构 ──
function poly(x,y,ang,len,wob,bias,r,step=6){ const pts=[[x,y,0]]; let a=ang,L=0; const n=Math.max(2,Math.round(len/step));
  for(let i=0;i<n;i++){ a+=gauss(r)*wob+(bias!==null?((bias-a)*0.03):0); x+=Math.cos(a)*step; y+=Math.sin(a)*step; L+=step; pts.push([x,y,L]); } return pts; }
const R0=rng(2026);
// 枯枝：主干 + 两级侧枝，挺而硬
const DRY=[]; // {pts, w0, w1, d0}  d0 = 从根部算起的路程（树液到达时间用）
(function(){ const main=poly(BASE[0],BASE[1],-Math.PI/2-0.04,820,0.035,-Math.PI/2,R0,8); DRY.push({pts:main,w0:4.2,w1:1.6,d0:0,lvl:0});
  for(let i=0;i<10;i++){ const k=0.22+0.72*(i/9)+gauss(R0)*0.02, idx=Math.floor(k*(main.length-1)), p=main[idx], side=i%2?1:-1;
    const a=-Math.PI/2+side*(0.55+R0()*0.45), len=(1-k*0.55)*(240+R0()*160);
    const b=poly(p[0],p[1],a,len,0.05,-Math.PI/2+side*0.35,R0,7); DRY.push({pts:b,w0:2.2*(1-k*0.4),w1:0.8,d0:p[2],lvl:1});
    for(let j=0;j<2+Math.floor(R0()*2);j++){ const kk=0.35+R0()*0.6, ii=Math.floor(kk*(b.length-1)), q=b[ii], s2=R0()<0.5?1:-1;
      const c=poly(q[0],q[1],a+s2*(0.45+R0()*0.5),len*(0.3+R0()*0.3),0.06,-Math.PI/2,R0,6); DRY.push({pts:c,w0:1.1,w1:0.5,d0:p[2]+q[2],lvl:2}); } } })();
// 根：从根颈往下长，发微光
const ROOTS=[]; (function(){ const r=rng(77);
  function grow(x,y,a,len,w,lvl,t0){ const p=poly(x,y,a,len,0.12,Math.PI/2,r,6); const dur=len/70; ROOTS.push({pts:p,w,t0,dur});
    if(lvl<4) for(let k=0;k<2+Math.floor(r()*2);k++){ const kk=0.25+r()*0.6, i=Math.floor(kk*(p.length-1)); grow(p[i][0],p[i][1],a+(r()<0.5?-1:1)*(0.4+r()*0.7),len*(0.45+r()*0.3),w*0.65,lvl+1,t0+dur*kk); } }
  for(let k=0;k<4;k++) grow(BASE[0]+gauss(r)*4,BASE[1]+4,Math.PI/2+gauss(r)*0.5,260+r()*120,1.6,0,T.roots[0]+r()*0.8); })();
const MOTES=(()=>{const r=rng(91);return Array.from({length:150},()=>{const rt=ROOTS[Math.floor(r()*ROOTS.length)], i=Math.floor(r()*(rt.pts.length-1)), p=rt.pts[i];
  const a=r()*6.28,d=60+r()*180; return {x0:p[0]+Math.cos(a)*d,y0:p[1]+Math.abs(Math.sin(a))*d*0.6,tx:p[0],ty:p[1],t0:rt.t0+rt.dur*(i/rt.pts.length)+r()*2,dur:2+r()*2.5};});})();
// 新枝：从枯枝的梢和节上抽出，弯而软；三级分枝；梢头是一簇小花
const SHOOTS=[], UMB=[];
(function(){ const r=rng(303);
  const origins=[]; for(const b of DRY){ if(b.lvl===0) continue; const tip=b.pts[b.pts.length-1]; origins.push([tip[0],tip[1],b.d0+tip[2]]);
    if(r()<0.7){ const i=Math.floor((0.4+r()*0.5)*(b.pts.length-1)); origins.push([b.pts[i][0],b.pts[i][1],b.d0+b.pts[i][2]]); } }
  const top=DRY[0].pts[DRY[0].pts.length-1]; origins.push([top[0],top[1],top[2]]); origins.push([top[0],top[1],top[2]]);
  function grow(x,y,a,len,w,lvl,t0,d0){ const p=poly(x,y,a,len,0.11,-Math.PI/2-0.1*(x<540?1:-1),r,5); const dur=0.9+len/150; SHOOTS.push({pts:p,w,t0,dur,lvl});
    const tip=p[p.length-1];
    if(lvl<3){ const nk=2+Math.floor(r()*2); for(let k=0;k<nk;k++){ const kk=0.55+r()*0.45, i=Math.floor(kk*(p.length-1)); grow(p[i][0],p[i][1],a+(r()<0.5?-1:1)*(0.35+r()*0.55),len*(0.55+r()*0.25),w*0.7,lvl+1,t0+dur*kk*0.8,d0+p[i][2]); } }
    if(lvl>=2||r()<0.3) UMB.push({x:tip[0],y:tip[1],t:t0+dur,R:14+r()*20+(3-lvl)*4,n:Math.floor(18+r()*34),seed:Math.floor(r()*1e9)}); }
  origins.forEach(([x,y,d],k)=>{ const a=-Math.PI/2+gauss(r)*0.7; grow(x,y,a,90+r()*90,1.3,0,T.shoots+d/900+r()*0.8,d); }); })();
// 小花：每簇按高斯散开；开花时间 = 从花冠中心向外的波 + 随机
const CROWN=(()=>{let sx=0,sy=0;for(const u of UMB){sx+=u.x;sy+=u.y;} return [sx/UMB.length,sy/UMB.length];})();
const FLORETS=(()=>{const out=[]; for(const u of UMB){ const r=rng(u.seed); const n=u.n;
  for(let j=0;j<n;j++){ const x=u.x+gauss(r)*u.R*0.42, y=u.y+gauss(r)*u.R*0.34-u.R*0.12; const d=Math.hypot(x-CROWN[0],(y-CROWN[1])*1.1);
    const open=Math.max(u.t+0.3,T.bloom+d/260+r()*0.5+(r()<0.15?(T.flush-T.bloom)+r()*2:0));
    out.push({x,y,ux:u.x,uy:u.y,s:1.3+Math.pow(r(),1.8)*3.0,open,q:r(),ph:r()*6.28,d}); } } return out;})();
const MAXD=Math.max(...FLORETS.map(f=>f.d));
// 预渲染：16 种颜色的五瓣小花
const PAL=[[255,240,222],[252,214,222],[236,186,226],[200,168,240],[150,142,236],[104,116,226]];
function palAt(k){ k=clamp(k,0,0.999)*(PAL.length-1); const i=Math.floor(k),f=k-i,a=PAL[i],b=PAL[i+1]; return [lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f)]; }
const NS=16, SPR=Array.from({length:NS},(_,k)=>{ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'), col=palAt(k/(NS-1));
  g.translate(32,32); for(let p=0;p<5;p++){ const a=p/5*6.28-1.57; const gr=g.createRadialGradient(Math.cos(a)*12,Math.sin(a)*12,0,Math.cos(a)*12,Math.sin(a)*12,13);
    gr.addColorStop(0,`rgba(${col[0]|0},${col[1]|0},${col[2]|0},0.95)`); gr.addColorStop(1,`rgba(${col[0]|0},${col[1]|0},${col[2]|0},0.0)`); g.fillStyle=gr; g.beginPath(); g.ellipse(Math.cos(a)*11,Math.sin(a)*11,12,9.5,a,0,6.29); g.fill(); }
  const cg=g.createRadialGradient(0,0,0,0,0,7); cg.addColorStop(0,'rgba(255,236,190,1)'); cg.addColorStop(1,'rgba(220,180,120,0.2)'); g.fillStyle=cg; g.beginPath(); g.arc(0,0,6,0,6.29); g.fill(); return c; });
const BUD=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');const gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(250,236,226,0.95)');gr.addColorStop(0.5,'rgba(230,200,200,0.5)');gr.addColorStop(1,'rgba(200,170,170,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);return c;})();
const GLOW=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,225,170,1)');gr.addColorStop(0.3,'rgba(255,200,130,0.45)');gr.addColorStop(1,'rgba(255,170,90,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return c;})();
// 背景：极暗，带一点颗粒
const BG=(()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),r=rng(5);
  const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#060608');gr.addColorStop(0.75,'#09080a');gr.addColorStop(0.82,'#0b0907');gr.addColorStop(1,'#050403');g.fillStyle=gr;g.fillRect(0,0,W,H);
  for(let i=0;i<5000;i++){g.fillStyle=`rgba(200,190,180,${0.015+r()*0.03})`;g.fillRect(r()*W,r()*H,1,1);} return c;})();

// ── 画 ──
function drawPoly(ctx,pts,upto,w0,w1,colAt){ // 按长度画一段折线，线宽从 w0 渐细到 w1
  const L=pts[pts.length-1][2]; if(upto<=0) return; ctx.lineCap='round';
  for(let i=0;i<pts.length-1;i++){ const a=pts[i],b=pts[i+1]; if(a[2]>=upto) break; const k=a[2]/L; let bx=b[0],by=b[1];
    if(b[2]>upto){ const f=(upto-a[2])/(b[2]-a[2]); bx=lerp(a[0],b[0],f); by=lerp(a[1],b[1],f); }
    ctx.strokeStyle=colAt(a,k); ctx.lineWidth=lerp(w0,w1,k); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(bx,by); ctx.stroke(); } }
const SAP_V=520; // 树液上行速度 px/s
function render(ctx,t){
  ctx.drawImage(BG,0,0);
  // 镜头：开花后极慢地推近花冠（无限画布的呼吸感）
  const zk=sm(seg(t,T.zoom[0],33)), zf=eio(seg(t,33.2,40)), Z=1+0.06*zk+1.5*zf, F=[lerp(540,CROWN[0],Math.max(zk,zf)),lerp(1000,CROWN[1]+(1-zf)*180,Math.max(zk,zf))];
  const sway=0.012*Math.sin(t*0.45)*seg(t,T.shoots,T.bloom);
  ctx.save(); ctx.translate(540,1000); ctx.scale(Z,Z); ctx.translate(-F[0],-F[1]);
  ctx.translate(BASE[0],BASE[1]); ctx.rotate(sway); ctx.translate(-BASE[0],-BASE[1]);
  // 地面：一道极淡的线
  ctx.save(); const gl=ctx.createLinearGradient(0,0,W,0); gl.addColorStop(0,'rgba(120,105,90,0)'); gl.addColorStop(0.5,'rgba(150,130,110,0.35)'); gl.addColorStop(1,'rgba(120,105,90,0)'); ctx.strokeStyle=gl; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(60,GROUND); ctx.lineTo(1020,GROUND); ctx.stroke(); ctx.restore();
  // 根
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const rt of ROOTS){ const k=seg(t,rt.t0,rt.t0+rt.dur); if(k<=0) continue; const L=rt.pts[rt.pts.length-1][2], warm=seg(t,T.sap-1,T.sap+1);
    drawPoly(ctx,rt.pts,k*L,rt.w,rt.w*0.4,(a,kk)=>`rgba(${Math.round(lerp(190,255,warm))},${Math.round(lerp(200,205,warm))},${Math.round(lerp(220,150,warm))},${0.18+0.25*(1-kk)})`);
    if(k<1){ const i=Math.min(rt.pts.length-1,Math.floor(k*(rt.pts.length-1))), p=rt.pts[i]; ctx.globalAlpha=0.6; ctx.drawImage(GLOW,p[0]-9,p[1]-9,18,18); ctx.globalAlpha=1; } }
  for(const m of MOTES){ const k=seg(t,m.t0,m.t0+m.dur); if(k<=0||k>=1) continue; const e=eio(k), x=lerp(m.x0,m.tx,e), y=lerp(m.y0,m.ty,e); ctx.globalAlpha=0.7*Math.sin(k*Math.PI); ctx.drawImage(GLOW,x-6,y-6,12,12); }
  ctx.globalAlpha=1; ctx.restore();
  // 枯枝 → 树液经过后转绿
  for(const b of DRY){ const L=b.pts[b.pts.length-1][2];
    drawPoly(ctx,b.pts,L,b.w0,b.w1,(a)=>{ const tp=T.sap+(b.d0+a[2])/SAP_V, g=sm(seg(t,tp,tp+0.8)); const c0=[150,138,124], c1=[96,150,88];
      return `rgba(${Math.round(lerp(c0[0],c1[0],g))},${Math.round(lerp(c0[1],c1[1],g))},${Math.round(lerp(c0[2],c1[2],g))},${0.95})`; }); }
  // 树液的光：沿每条枝往上走
  if(t>T.sap-0.2&&t<T.sap+4){ ctx.save(); ctx.globalCompositeOperation='lighter';
    for(const b of DRY){ const L=b.pts[b.pts.length-1][2], d=(t-T.sap)*SAP_V-b.d0; if(d<0||d>L+40) continue; const i=Math.min(b.pts.length-1,Math.floor(d/L*(b.pts.length-1))), p=b.pts[i], a=Math.min(1,(L+40-d)/40);
      ctx.globalAlpha=a; ctx.drawImage(GLOW,p[0]-16,p[1]-16,32,32); } ctx.restore(); }
  // 新枝
  for(const s of SHOOTS){ const k=eo3(seg(t,s.t0,s.t0+s.dur)); if(k<=0) continue; const L=s.pts[s.pts.length-1][2];
    drawPoly(ctx,s.pts,k*L,s.w,s.w*0.45,(a,kk)=>`rgba(${Math.round(lerp(110,170,kk))},${Math.round(lerp(165,210,kk))},${Math.round(lerp(100,140,kk))},${0.55-0.2*kk})`); }
  // 花：先是花苞，再开
  const tint=sm(seg(t,T.tint[0],T.tint[1]));
  ctx.save();
  for(const f of FLORETS){ if(t<f.open-1.2) continue;
    const bud=seg(t,f.open-1.2,f.open-0.2), op=seg(t,f.open,f.open+0.7);
    const sx=f.x+Math.sin(t*0.9+f.ph)*1.6*op, sy=f.y+Math.cos(t*0.7+f.ph)*1.2*op;
    if(op<=0){ ctx.globalAlpha=0.8*bud; const bs=2+f.s*0.4; ctx.drawImage(BUD,sx-bs,sy-bs,bs*2,bs*2); continue; }
    // 花梗
    if(f.q<0.3){ ctx.strokeStyle=`rgba(170,195,150,${0.16*op})`; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(f.ux,f.uy+6); ctx.lineTo(sx,sy); ctx.stroke(); }
    const base=f.d/MAXD*0.55+f.q*0.18, shift=tint*clamp(0.25+(f.x-CROWN[0])/700+(f.y-CROWN[1])/900,0,0.6);
    const ci=Math.round(clamp(base+shift,0,1)*(NS-1)), sz=f.s*eob(op)*1.35;
    ctx.globalAlpha=0.38+0.5*f.q; ctx.drawImage(SPR[ci],sx-sz,sy-sz,sz*2,sz*2); }
  ctx.globalAlpha=1; ctx.restore();
  // 飘出来的细丝与花粉
  if(t>T.bloom){ const r=rng(55); ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let i=0;i<160;i++){ const t0=T.bloom+r()*14, life=4+r()*5, k=(t-t0)/life; const x0=CROWN[0]+gauss(r)*160, y0=CROWN[1]+gauss(r)*160, vx=gauss(r)*30, vy=-15-r()*25; if(k<0||k>1) continue;
      const x=x0+vx*(t-t0)+Math.sin(t+i)*6, y=y0+vy*(t-t0); ctx.globalAlpha=0.5*Math.sin(k*Math.PI); ctx.drawImage(GLOW,x-3,y-3,6,6); }
    ctx.restore(); }
  ctx.restore();
  overlay(ctx,t);
}
// ── 文字与品牌 ──
const CUBEP=(()=>{const R=50,RC=R*0.8660254,V={T:[60,10],UR:[60+RC,35],LR:[60+RC,85],B:[60,110],LL:[60-RC,85],UL:[60-RC,35],C:[60,60]};
  const tw=(a,b,d)=>{const dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy);return [a[0]+dx/n*d,a[1]+dy/n*d];};const G=10;
  return [[tw(V.UL,V.T,G),V.T,tw(V.UR,V.T,G)],[tw(V.UR,V.LR,G),tw(V.LR,V.UR,G)],[tw(V.LR,V.B,G),V.B,tw(V.LL,V.B,G)],[tw(V.LL,V.UL,G),tw(V.UL,V.LL,G)],[tw(V.UL,V.C,G),V.C,tw(V.UR,V.C,G)],[V.C,tw(V.B,V.C,G)]];})();
function cubeAt(ctx,x,y,size,col,a){ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.scale(size/120,size/120);ctx.strokeStyle=col;ctx.lineWidth=12;for(const p of CUBEP){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}ctx.restore();}
function topIP(ctx){const y=196;cubeAt(ctx,540-82,y-20,40,'#2BE08A',0.7);ctx.save();ctx.globalAlpha=0.7;ctx.fillStyle='#2BE08A';ctx.font=`900 30px ${SANS}`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('老杨魔方',540-30,y+1);ctx.restore();}
const win=(t,a,b,f=0.8)=>seg(t,a,a+f)*(1-seg(t,b-f,b));
function words(ctx,s,y,a,size=34,col='225,214,204'){ if(a<=0) return; ctx.save(); ctx.font=`400 ${size}px ${SERIF}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  // 字一个个浮现
  const chars=[...s], w=ctx.measureText(s).width; let x=540-w/2;
  chars.forEach((ch,i)=>{ const cw=ctx.measureText(ch).width, k=clamp(a*chars.length*1.2-i*0.9,0,1); ctx.fillStyle=`rgba(${col},${0.9*k})`; ctx.fillText(ch,x+cw/2,y+(1-k)*6); x+=cw; }); ctx.restore(); }
const LINES=[[1.0,6.0,'最安静的季节，看起来最像枯萎。',360],[7.0,13.5,'根在地下，一寸一寸往深处去。',360],[15.0,19.5,'不着急开花。',360],[20.5,24.5,'营养还不够，温度还没到。',360],
  [29.0,34.4,'在没人看见的季节里，',330],[29.8,34.4,'它一刻也没有停止生长。',390]];
let END=null;
function buildEnd(){ const c=document.createElement('canvas'); c.width=W; c.height=120; const g=c.getContext('2d');
  g.translate(0,-1730); cubeAt(g,540-128,1790-22,44,'#000',1); g.setTransform(1,0,0,1,0,0); g.fillStyle='#000'; g.font=`900 36px ${SANS}`; g.textAlign='left'; g.textBaseline='middle'; g.fillText('老杨魔方',540-70,61);
  const d=g.getImageData(0,0,W,120).data, pts=[]; for(let y=0;y<120;y+=3)for(let x=0;x<W;x+=3) if(d[(y*W+x)*4+3]>140) pts.push([x,1730+y]);
  const r=rng(99); END=pts.map(p=>{const a=r()*6.28; return {tx:p[0],ty:p[1],sx:CROWN[0]+gauss(r)*200,sy:CROWN[1]+gauss(r)*220,dl:r(),c:palAt(r()*0.8),od:Math.atan2(p[1]-1790,p[0]-540)+(r()-0.5)*1.2};});}
function endLogo(ctx,t){ const in0=37.4, form=38.4, out0=39.1; if(t<in0) return; if(!END) buildEnd();
  const hold=seg(t,form-0.1,form+0.25)*(1-seg(t,out0,out0+0.2));
  if(hold>0.02){ cubeAt(ctx,540-128,1790-22,44,'#2BE08A',0.85*hold); ctx.save(); ctx.globalAlpha=0.85*hold; ctx.fillStyle='#2BE08A'; ctx.font=`900 36px ${SANS}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('老杨魔方',540-70,1791); ctx.restore(); }
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const p of END){ let x,y,a; if(t<out0){ const k=eo3(seg(t,in0+p.dl*0.4,in0+p.dl*0.4+0.8)); if(k<=0) continue; x=lerp(p.sx,p.tx,k); y=lerp(p.sy,p.ty,k); a=(1-hold)*Math.min(1,k*2); }
    else { const q=eo3(seg(t,out0+p.dl*0.2,out0+p.dl*0.2+0.6)); if(q>=1) continue; x=p.tx+Math.cos(p.od)*q*380; y=p.ty+Math.sin(p.od)*q*380; a=1-q; }
    ctx.fillStyle=`rgba(${p.c[0]|0},${p.c[1]|0},${p.c[2]|0},${a})`; ctx.fillRect(x-1.5,y-1.5,3,3); } ctx.restore(); }
function overlay(ctx,t){ const vb=seg(t,35.5,37.2); if(vb>0){ const g=ctx.createLinearGradient(0,1560,0,H); g.addColorStop(0,'rgba(5,4,6,0)'); g.addColorStop(0.5,`rgba(5,4,6,${0.75*vb})`); g.addColorStop(1,`rgba(5,4,6,${0.9*vb})`); ctx.fillStyle=g; ctx.fillRect(0,1560,W,H-1560); }
  const vt=seg(t,33.5,35.5); if(vt>0){ const g=ctx.createLinearGradient(0,0,0,440); g.addColorStop(0,`rgba(5,4,6,${0.96*vt})`); g.addColorStop(0.6,`rgba(5,4,6,${0.85*vt})`); g.addColorStop(1,'rgba(5,4,6,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,440); }
  topIP(ctx); for(const [a,b,s,y] of LINES) words(ctx,s,y,win(t,a,b)); endLogo(ctx,t); }
window.__ep={render,DUR};
