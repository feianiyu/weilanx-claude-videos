// AI 重构 · 01「重构」完整版（32 秒）。画面 = 时间 t 的纯函数。
const W=1080, H=1920, FPS=30, DUR=32;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo3=x=>1-Math.pow(1-x,3);
const ein=x=>x*x*x;
const eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const lerp=(a,b,k)=>a+(b-a)*k;
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const SANS='"Noto Sans SC","Noto Sans CJK SC",sans-serif';
const MONO='"DejaVu Sans Mono","Noto Sans SC",monospace';
const HITS={kick:4.0,twists:[4.0,5.0,6.0,7.0],gap:7.5,drop:8.0,brk:12.0,gap2:19.5,drop2:20.0,layers:[22.0,24.0,26.0],outro:28.0};

// ───────── 光球精灵 ─────────
function sprite(stops,rim){
  const S=256,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  const gr=g.createRadialGradient(S*0.4,S*0.38,0,S*0.47,S*0.46,S*0.5);
  stops.forEach(([o,col])=>gr.addColorStop(o,col));
  g.fillStyle=gr;g.beginPath();g.arc(S/2,S/2,S/2-3,0,Math.PI*2);g.fill();
  g.lineWidth=5;g.strokeStyle=rim;g.stroke();return c;}
const SP_COL=sprite([[0,'#f2ffff'],[0.1,'#8ff6ff'],[0.26,'#d9ff6e'],[0.42,'#ffb12e'],[0.6,'#ff4f7b'],[0.78,'#9b3dff'],[0.93,'#3b1d93'],[1,'#160c3d']],'rgba(12,6,34,0.85)');
const SP_HUE=[-60,-30,0,30,55].map((deg,k)=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.filter=`hue-rotate(${deg}deg)`;g.drawImage(SP_COL,0,0);return c;});
const SP_GRAY=sprite([[0,'#ffffff'],[0.14,'#e3e6ec'],[0.4,'#a3a8b4'],[0.7,'#5a5f6b'],[0.9,'#2a2d35'],[1,'#121318']],'rgba(8,8,12,0.85)');

// ───────── 背景 ─────────
const BG=(()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle='#05060C';g.fillRect(0,0,W,H);
  g.fillStyle='rgba(180,190,220,0.07)';for(let y=20;y<H;y+=40)for(let x=20;x<W;x+=40)g.fillRect(x-1,y-1,2,2);
  const v=g.createRadialGradient(W/2,H/2,300,W/2,H/2,1250);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,0.75)');g.fillStyle=v;g.fillRect(0,0,W,H);return c;})();

// ───────── 3D ─────────
const D=1600, CX=540, CY=960;
function rotY(p,a){const c=Math.cos(a),s=Math.sin(a);return [p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];}
function rotX(p,a){const c=Math.cos(a),s=Math.sin(a);return [p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];}
function rotZ(p,a){const c=Math.cos(a),s=Math.sin(a);return [p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]];}
const ROT=[rotX,rotY,rotZ];

// 魔方：6×6×6 光球，间距 50
const N=6, SPC=50;
const CUBE=[];for(let i=0;i<N;i++)for(let j=0;j<N;j++)for(let k=0;k<N;k++)CUBE.push([(i-2.5)*SPC,(j-2.5)*SPC,(k-2.5)*SPC]);
const NB=CUBE.length; // 216
// 四次层转：[轴, 层(0..2，每层两排), 方向]
const TW=[[1,0,1],[0,2,-1],[1,2,1],[2,0,-1]];
function cubeLocal(i,t){
  let p=CUBE[i];
  for(let k=0;k<TW.length;k++){const t0=HITS.twists[k]; if(t<t0) break;
    const [ax,ly,dir]=TW[k]; const a=dir*Math.PI/2*eio(seg(t,t0,t0+0.38));
    const layer=Math.floor((p[ax]/SPC+2.5+0.01)/2); if(layer!==ly) continue;
    p=ROT[ax](p,a); if(seg(t,t0,t0+0.38)>=1) p=p.map(v=>Math.round(v/ (SPC/2))*(SPC/2));}
  return p;}
function cubeYaw(t){ // 慢 → 快
  return Math.PI/4 + t*0.12 + 0.55*ein(seg(t,4,7.5))*3.5*seg(t,4,7.5) + 1.4*ein(seg(t,7.5,8));}
const ISO=0.6155;
function cubeWorld(i,t){
  let p=cubeLocal(i,t);
  const sq=1-0.82*ein(seg(t,7.45,7.9)); // 抽空：吸成一团
  p=[p[0]*sq,p[1]*sq,p[2]*sq];
  p=rotY(p,cubeYaw(t)); p=rotX(p,-ISO); return p;}

// 环结（三叶结 2,3）
const KS=112;
function knotWorld(i,t){
  const th=i/NB*Math.PI*2 + t*0.09;
  let p=[(2+Math.cos(3*th))*Math.cos(2*th)*KS,(2+Math.cos(3*th))*Math.sin(2*th)*KS,Math.sin(3*th)*KS*1.7];
  p=rotX(p,0.55+0.12*Math.sin(t*0.4)); p=rotY(p,(t-8)*0.32); p=rotZ(p,0.25); return p;}

const R0=rng(7);
const SCAT=CUBE.map(()=>{const u=R0()*2-1,a=R0()*Math.PI*2,r=420+R0()*900,s=Math.sqrt(1-u*u);
  return {s:[Math.cos(a)*s*r*1.1,u*r*1.5,Math.sin(a)*s*r*1.2-150],dl:R0()};});
const DUST=Array.from({length:560},()=>{const u=R0()*2-1,a=R0()*Math.PI*2,s=Math.sqrt(1-u*u),r=900+R0()*2200;
  return {d:[Math.cos(a)*s*r*0.9,u*r*1.4,Math.sin(a)*s*r-300],sp:0.9+R0()*1.6,rad:9+R0()*20,dl:R0()*0.25,h:Math.floor(R0()*5)};});

function project(p){const z=Math.max(-1350,p[2]);const sc=D/(D+z);return {x:CX+p[0]*sc,y:CY+p[1]*sc,sc,z};}

// 时间轴：沿 x 轴的螺旋（1881 → 1920s）
function helixWorld(i,t){ const u=i/(NB-1), ph=u*Math.PI*2*2.2 - (t-12)*0.9;
  return [lerp(-470,470,u), 230*Math.sin(ph), 230*Math.cos(ph)];}
// 三层环：效率层 / 流程层 / 模式层
const RING_Y=[-350,0,255], RING_R=[300,400,320], RING_SP=[0.9,0.55,0.32];
function ringWorld(i,t){ const k=Math.floor(i/72), j=i%72;
  const boost=1+2.2*eio(seg(t,28,28.8))*(1-seg(t,29.2,30.4));
  const a=j/72*Math.PI*2 + (t-20)*RING_SP[k]*boost*(k===1?-1:1);
  let p=[RING_R[k]*Math.cos(a), 0, RING_R[k]*Math.sin(a)]; p=rotX(p,-0.32); p[1]+=RING_Y[k]; return p;}
function lerp3(a,b,k){return [lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)];}
function posAt(i,t){ // 世界坐标 + 半径
  const dl=SCAT[i].dl;
  if(t<HITS.drop) return [cubeWorld(i,t),31];
  if(t<HITS.gap2){
    const c0=cubeWorld(i,HITS.drop), e=eo3(seg(t,8.0,8.75));
    const sc=lerp3(c0,SCAT[i].s,e);
    const st=8.6+dl*0.9, r=eio(seg(t,st,st+1.4));
    let p=lerp3(sc,knotWorld(i,t),r), rad=lerp(31,46,r);
    const st2=12.0+(i/NB)*0.9, r2=eio(seg(t,st2,st2+1.3));
    if(r2>0){ p=lerp3(p,helixWorld(i,t),r2); rad=lerp(rad,30,r2); }
    return [p,rad];}
  const h=helixWorld(i,HITS.gap2), sq=1-0.85*ein(seg(t,19.5,19.9));
  const c0=[h[0]*sq,h[1]*sq,h[2]*sq];
  if(t<HITS.drop2) return [c0,30];
  const e=eo3(seg(t,20.0,20.9+dl*0.5));
  return [lerp3(c0,ringWorld(i,t),e),lerp(30,34,e)];}
function colorAt(i,t){ const dl=SCAT[i].dl;
  if(t<HITS.drop) return 0;
  if(t<HITS.brk) return seg(t,8.0+dl*0.25,8.25+dl*0.25);
  if(t<HITS.drop2){ const u=i/NB; // 回到灰色的旧时代，1920s 那一端最后亮起
    return Math.max(1-seg(t,12.0+u*0.9,12.6+u*0.9), seg(t,17.6+(1-u)*0.9,17.9+(1-u)*0.9)); }
  const k=Math.floor(i/72), on=HITS.layers[k];
  return Math.max(0.12*(1-seg(t,20,20.6))+0.0, seg(t,on+(i%72)/72*0.35,on+0.2+(i%72)/72*0.35));}
function dust(out,t,t0,every,life){
  if(t<t0||t>t0+life+1.5) return;
  for(let n=0;n<DUST.length;n+=every){ const d=DUST[n]; const k=eo3(seg(t,t0+d.dl*0.1,t0+d.dl*0.1+1.0*d.sp));
    if(k<=0) continue; const p=[d.d[0]*k,d.d[1]*k,d.d[2]*k];
    const q=project(p); const a=Math.min(1,k*5)*(1-seg(t,t0+life*0.6+d.dl*2,t0+life+d.dl*3));
    if(a<=0) continue; out.push({x:q.x,y:q.y,r:d.rad*q.sc,z:q.z,c:1,a,h:d.h});}}
function spheres(t){
  const out=[];
  for(let i=0;i<NB;i++){ const [p,rad]=posAt(i,t), c=colorAt(i,t);
    const q=project(p); out.push({x:q.x,y:q.y,r:rad*q.sc,z:q.z,c,a:1,h:Math.round(2+2*Math.sin(i/NB*Math.PI*4))});}
  dust(out,t,HITS.drop,1,2.6); dust(out,t,HITS.drop2,2,2.2);
  return out;}

function drawSpheres(ctx,list){
  for(const s of list){ if(s.r<1||s.x<-s.r||s.x>W+s.r||s.y<-s.r||s.y>H+s.r) continue;
    ctx.globalAlpha=s.a;
    if(s.c<1) ctx.drawImage(SP_GRAY,s.x-s.r,s.y-s.r,s.r*2,s.r*2);
    if(s.c>0){ ctx.globalAlpha=s.a*s.c; ctx.drawImage(SP_HUE[s.h],s.x-s.r,s.y-s.r,s.r*2,s.r*2);} }
  ctx.globalAlpha=1;}

// ───────── 品牌 / HUD / 文字 ─────────
const CUBEP=(()=>{const R=50,RC=R*0.8660254,V={T:[60,10],UR:[60+RC,35],LR:[60+RC,85],B:[60,110],LL:[60-RC,85],UL:[60-RC,35],C:[60,60]};
  const tw=(a,b,d)=>{const dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy);return [a[0]+dx/n*d,a[1]+dy/n*d];};const G=10;
  return [[tw(V.UL,V.T,G),V.T,tw(V.UR,V.T,G)],[tw(V.UR,V.LR,G),tw(V.LR,V.UR,G)],[tw(V.LR,V.B,G),V.B,tw(V.LL,V.B,G)],[tw(V.LL,V.UL,G),tw(V.UL,V.LL,G)],[tw(V.UL,V.C,G),V.C,tw(V.UR,V.C,G)],[V.C,tw(V.B,V.C,G)]];})();
function cube(ctx,x,y,size,col,a){ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.scale(size/120,size/120);ctx.strokeStyle=col;ctx.lineWidth=12;ctx.lineCap='butt';ctx.lineJoin='miter';
  for(const p of CUBEP){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}ctx.restore();}
function topIP(ctx){const y=196;cube(ctx,540-82,y-20,40,'#2BE08A',0.85);
  ctx.save();ctx.globalAlpha=0.85;ctx.fillStyle='#2BE08A';ctx.font=`900 30px ${SANS}`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('老杨魔方',540-30,y+1);ctx.restore();}

function hud(ctx,t){
  const m=54,L=38; ctx.save(); ctx.strokeStyle='rgba(237,234,226,0.42)'; ctx.lineWidth=2;
  for(const [x,y,sx,sy] of [[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]]){ctx.beginPath();ctx.moveTo(x+sx*L,y);ctx.lineTo(x,y);ctx.lineTo(x,y+sy*L);ctx.stroke();}
  ctx.fillStyle='rgba(237,234,226,0.55)'; ctx.font=`500 21px ${MONO}`; ctx.textBaseline='middle';
  const f=Math.floor(t*FPS), ss=Math.floor(f/FPS), ff=f%FPS, pad=n=>String(n).padStart(2,'0');
  ctx.textAlign='left'; ctx.fillText('AI 重构 / 15 问',m+14,m+30);
  ctx.textAlign='right'; ctx.fillText(`TC 00:00:${pad(ss)}:${pad(ff)}`,W-m-14,m+30);
  // 进度线
  const py=H-118; ctx.strokeStyle='rgba(237,234,226,0.2)'; ctx.beginPath(); ctx.moveTo(m+14,py); ctx.lineTo(W-m-14,py); ctx.stroke();
  for(let s=0;s<=DUR;s++){const x=lerp(m+14,W-m-14,s/DUR); ctx.beginPath(); ctx.moveTo(x,py-(s%5?5:10)); ctx.lineTo(x,py); ctx.stroke();}
  ctx.strokeStyle='rgba(237,234,226,0.75)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(m+14,py); ctx.lineTo(lerp(m+14,W-m-14,t/DUR),py); ctx.stroke();
  ctx.textAlign='left'; ctx.fillText('01 / 重构',m+14,H-m-30);
  ctx.textAlign='right'; ctx.fillText('1080 × 1920 / 30 FPS',W-m-14,H-m-30);
  ctx.restore();}

function word(ctx,t){
  ctx.save(); ctx.font=`900 400px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const dim=1-0.35*seg(t,7.5,7.9)+0.35*seg(t,8.0,8.4)-0.35*seg(t,19.5,19.9)+0.35*seg(t,20.0,20.4);
  ctx.globalAlpha=dim; ctx.fillStyle='#EDEAE2';
  ctx.fillText('重',CX-245,CY+12); ctx.fillText('构',CX+245,CY+12); ctx.restore();}

function line(ctx,s,y,size,col,a,w=900){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.font=`${w} ${size}px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=20; ctx.fillStyle=col; ctx.fillText(s,W/2,y); ctx.restore(); }

function hook(ctx,t){ const a=1-seg(t,7.25,7.5);
  line(ctx,'你给每个员工都开了 AI，',398,64,'#EDEAE2',a);
  line(ctx,'公司为什么还是老样子？',484,64,'#EDEAE2',a);}

function tags(ctx,t){
  const items=['效率层','流程层','模式层'], xs=[CX-250,CX,CX+250], y=1338;
  const on=i=>{ if(t<8) return i===0?1:0; if(t<12) return i===0?1-0.7*seg(t,8.1,8.5):seg(t,8.1,8.5);
    if(t<22) return Math.max(0,(i===0?0.3:1)*(1-seg(t,12,12.4)));
    if(t<28) return seg(t,HITS.layers[i],HITS.layers[i]+0.3);
    return 1;};
  ctx.save(); ctx.font=`500 30px ${MONO}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(237,234,226,0.3)'; ctx.fillText('/',CX-125,y); ctx.fillText('/',CX+125,y);
  items.forEach((s,i)=>{ const o=on(i); ctx.fillStyle=i===0?`rgba(237,234,226,${0.3+0.7*o})`:`rgba(127,243,255,${0.3+0.7*o})`; ctx.fillText(s,xs[i],y);});
  ctx.restore();}

// 时间轴标注（12–19.5 秒）
function timeline(ctx,t){ const a=seg(t,12.6,13.0)*(1-seg(t,19.2,19.5)); if(a<=0) return;
  const y=640, x0=150, x1=930, u=eio(seg(t,12.8,17.5));
  ctx.save(); ctx.globalAlpha=a;
  ctx.strokeStyle='rgba(237,234,226,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke();
  ctx.strokeStyle='rgba(237,234,226,0.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(lerp(x0,x1,u),y); ctx.stroke();
  ctx.fillStyle='#EDEAE2'; ctx.beginPath(); ctx.arc(lerp(x0,x1,u),y,7,0,Math.PI*2); ctx.fill();
  ctx.font=`500 40px ${MONO}`; ctx.textBaseline='bottom';
  ctx.textAlign='left'; ctx.fillText('1881',x0,y-18);
  const r=seg(t,17.4,17.8); ctx.globalAlpha=a*(0.35+0.65*r); ctx.fillStyle=r>0.5?'#ffb12e':'#EDEAE2';
  ctx.textAlign='right'; ctx.fillText('1920s',x1,y-18);
  ctx.globalAlpha=a*seg(t,15.0,15.4); ctx.fillStyle='rgba(237,234,226,0.6)'; ctx.font=`500 28px ${MONO}`; ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.fillText('4 0  年',(x0+x1)/2,y+16);
  ctx.globalAlpha=a*0.5; ctx.font=`400 20px ${MONO}`; ctx.textBaseline='middle';
  ctx.fillText('来源：Paul A. David, "The Dynamo and the Computer", AER, 1990',W/2,1690);
  ctx.restore();}

const LINES=[[0,3.85,'判断','效率层：同样的活，做得更快'],[4.0,7.35,'判断','拧得再快，还是那个魔方'],[9.8,11.8,'判断','同一批球，换一种排法'],
  [12.4,14.95,'历史','1881 年，第一座中心发电站开张'],[15.05,17.45,'历史','四十年后，美国工厂才一半用上电动机'],[17.55,19.4,'历史','生产率起跳，要等厂房重新排一遍'],
  [22.0,23.9,'第一层','效率层：同样的活，做得更快'],[24.0,25.9,'第二层','流程层：这件事，还要这样做吗？'],[26.0,27.9,'第三层','模式层：客户到底为什么付钱？'],
  [28.1,99,'问题','从零开一家公司，你还会这样排吗？']];
function prompt(ctx,t){
  for(const [a,b,lab,s] of LINES){ const al=seg(t,a,a+0.25)*(1-seg(t,b-0.2,b)); if(al<=0) continue;
    ctx.save(); ctx.globalAlpha=al; ctx.font=`500 22px ${MONO}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(237,234,226,0.5)'; ctx.fillText(`—  ${lab}  —`,W/2,1406); ctx.restore();
    line(ctx,s,1462,46,'#EDEAE2',al,700);}}

function glow(ctx,t){ const a=0.5*seg(t,8.0,9.2)*(1-0.8*seg(t,12,13))+0.4*seg(t,17.6,18.6)*(1-seg(t,19.5,19.9))+0.4*seg(t,20,21); if(a<=0) return;
  const g=ctx.createRadialGradient(CX,CY,0,CX,CY,760); g.addColorStop(0,`rgba(120,60,255,${0.32*a})`); g.addColorStop(0.5,`rgba(40,160,220,${0.12*a})`); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);}

// 片尾标准署名：粒子聚成 logo 后散开
let END=null; const COLS=[[143,246,255],[217,255,110],[255,177,46],[255,79,123],[155,61,255]];
function buildEnd(){
  const c=document.createElement('canvas'); c.width=W; c.height=120; const g=c.getContext('2d');
  g.translate(0,-1500); cube(g,540-128,1560-22,44,'#000',1); g.setTransform(1,0,0,1,0,0);
  g.fillStyle='#000'; g.font=`900 36px ${SANS}`; g.textAlign='left'; g.textBaseline='middle'; g.fillText('老杨魔方',540-70,61);
  const d=g.getImageData(0,0,W,120).data, pts=[];
  for(let y=0;y<120;y+=3)for(let x=0;x<W;x+=3) if(d[(y*W+x)*4+3]>140) pts.push([x,1500+y]);
  const r=rng(99);
  END=pts.map(p=>{const a=r()*Math.PI*2; return {tx:p[0],ty:p[1],sx:540+Math.cos(a)*900,sy:1000+Math.sin(a)*1300,dl:r(),c:COLS[Math.floor(r()*COLS.length)],od:Math.atan2(p[1]-1560,p[0]-540)+(r()-0.5)*1.2};});}
function endLogo(ctx,t){
  const in0=29.9, form=30.8, out0=31.35; if(t<in0) return; if(!END) buildEnd();
  const hold=seg(t,form-0.1,form+0.25)*(1-seg(t,out0,out0+0.2));
  if(hold>0.02){ ctx.save(); cube(ctx,540-128,1560-22,44,'#2BE08A',0.9*hold); ctx.globalAlpha=0.9*hold; ctx.fillStyle='#2BE08A'; ctx.font=`900 36px ${SANS}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('老杨魔方',540-70,1561); ctx.restore(); }
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const p of END){ let x,y,a;
    if(t<out0){ const k=eo3(seg(t,in0+p.dl*0.4,in0+p.dl*0.4+0.7)); if(k<=0) continue; x=lerp(p.sx,p.tx,k); y=lerp(p.sy,p.ty,k); a=(1-hold)*Math.min(1,k*2); }
    else { const q=eo3(seg(t,out0+p.dl*0.2,out0+p.dl*0.2+0.6)); if(q>=1) continue; x=p.tx+Math.cos(p.od)*q*420; y=p.ty+Math.sin(p.od)*q*420; a=1-q; }
    ctx.fillStyle=`rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a})`; ctx.fillRect(x-1.5,y-1.5,3,3); }
  ctx.restore();}

function render(ctx,t){
  ctx.drawImage(BG,0,0); glow(ctx,t);
  const list=spheres(t).sort((a,b)=>b.z-a.z);
  const back=list.filter(s=>s.z>=0), front=list.filter(s=>s.z<0);
  drawSpheres(ctx,back); word(ctx,t); drawSpheres(ctx,front);
  hud(ctx,t); topIP(ctx); hook(ctx,t); timeline(ctx,t); tags(ctx,t); prompt(ctx,t); endLogo(ctx,t);}
window.__ep={render,DUR};
