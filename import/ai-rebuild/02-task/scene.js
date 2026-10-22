// AI 重构 · 02「任务」完整版（32 秒）。画面 = 时间 t 的纯函数。
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

const SP_GOLD=sprite([[0,'#fffdf0'],[0.12,'#fff1b8'],[0.3,'#ffd86b'],[0.5,'#f5a623'],[0.72,'#b8641a'],[0.9,'#5a2a0a'],[1,'#2a1204']],'rgba(30,12,2,0.85)');
const R0=rng(11);
// 灰色光球组成的大球（岗位）：斐波那契球面
const NB=260, BR=215;
const BODY=Array.from({length:NB},(_,i)=>{const y=1-2*(i+0.5)/NB, r=Math.sqrt(1-y*y), a=i*2.399963;return [Math.cos(a)*r*BR,y*BR,Math.sin(a)*r*BR];});
const YR=new Array(NB); BODY.map((p,i)=>[p[1],i]).sort((a,b)=>a[0]-b[0]).forEach(([,i],r)=>YR[i]=r/NB);
const NC=30, CL=new Array(NB);
BODY.map((p,i)=>[Math.floor(YR[i]*8)*10000+Math.atan2(p[2],p[0]),i]).sort((a,b)=>a[0]-b[0]).forEach(([,i],r)=>CL[i]=Math.floor(r/NB*NC));
const LOCAL=BODY.map(()=>{const u=R0()*2-1,a=R0()*Math.PI*2,s=Math.sqrt(1-u*u),r=Math.cbrt(R0())*38;return [Math.cos(a)*s*r,u*r,Math.sin(a)*s*r];});
const GRID=Array.from({length:NC},(_,c)=>[((c%6)-2.5)*150,(Math.floor(c/6)-2)*150-20,(R0()-0.5)*160]);
// 分拣：14 / 10 / 6（示意）
const BIN=(()=>{const ids=Array.from({length:NC},(_,c)=>c), r=rng(5); for(let i=NC-1;i>0;i--){const j=Math.floor(r()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  const b=new Array(NC), slot=new Array(NC); ids.forEach((c,k)=>{const bi=k<14?0:(k<24?1:2); b[c]=bi; slot[c]=bi===0?k:(bi===1?k-14:k-24);}); return {b,slot};})();
const BIN_X=[-270,0,270], BIN_Z=[40,0,-110];
function binPos(c,t){ const bi=BIN.b[c], s=BIN.slot[c], col=s%2, row=Math.floor(s/2);
  const bob=Math.sin(t*1.6+c)*5;
  return [BIN_X[bi]+(col-0.5)*80, 250-row*80+bob, BIN_Z[bi]+(col-0.5)*30];}
const CLSC=Array.from({length:NC},()=>{const u=R0()*2-1,a=R0()*Math.PI*2,s=Math.sqrt(1-u*u),r=380+R0()*700;return {s:[Math.cos(a)*s*r*1.2,u*r*1.6,Math.sin(a)*s*r-200],dl:R0()};});
const DUST=Array.from({length:520},()=>{const u=R0()*2-1,a=R0()*Math.PI*2,s=Math.sqrt(1-u*u),r=900+R0()*2200;
  return {d:[Math.cos(a)*s*r*0.9,u*r*1.4,Math.sin(a)*s*r-300],sp:0.9+R0()*1.6,rad:8+R0()*18,dl:R0()*0.25,h:Math.floor(R0()*5),g:R0()<0.3};});
// 数据方阵：100 颗 = 100% 的美国劳动者；80 颗受影响（≥10% 任务），其中 19 颗高度受影响（≥50% 任务）
const PERM=(()=>{const a=Array.from({length:NB},(_,i)=>i), r=rng(23); for(let i=NB-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];} const cell=new Array(NB).fill(-1); a.slice(0,100).forEach((i,k)=>cell[i]=k); return cell;})();
const CELL_RANK=(()=>{const a=Array.from({length:100},(_,k)=>k), r=rng(31); for(let i=99;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];} const rk=new Array(100); a.forEach((c,k)=>rk[c]=k); return rk;})(); // <80 受影响，<19 高度受影响
const FAR=BODY.map(()=>[(R0()-0.5)*1600,(R0()-0.5)*2400,1800+R0()*1200]);
// 结尾：金色核心 + AI 卫星
const GOLD=BODY.map((_,i)=>BIN.b[CL[i]]===2);
const GOLD_IDX=(()=>{const m=new Array(NB).fill(-1); let k=0; for(let i=0;i<NB;i++) if(GOLD[i]) m[i]=k++; return {m,n:k};})();
const ORB=(()=>{const m=new Array(NB).fill(-1); let k=0; for(let i=0;i<NB;i++) if(!GOLD[i]) m[i]=k++; return {m,n:k};})();
const RING_R=[255,345,440], RING_TILT=[[0.45,0.2],[-0.35,-0.5],[0.15,0.75]], RING_SP=[0.8,-0.55,0.38];

function project(p){const z=Math.max(-1350,p[2]);const sc=D/(D+z);return {x:CX+p[0]*sc,y:CY+p[1]*sc,sc,z};}
function lerp3(a,b,k){return [lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)];}
const CUTS=[4.0,5.0,6.0];
function slabOffset(i,t){ let dy=0, dx=0;
  CUTS.forEach((t0,k)=>{ const n=2**(k+1), s=Math.floor(YR[i]*n), e=eio(seg(t,t0,t0+0.3));
    dy+=(s-(n-1)/2)*26*e; dx+=((s%2)?1:-1)*16*e*(k===2?1:0.6);});
  return [dx,dy];}
function figureWorld(i,t){
  const br=1+0.02*Math.sin(t*2.2);
  let p=rotY(BODY[i],t*0.35); p=rotX(p,0.3); p=[p[0]*br,p[1]*br,p[2]*br];
  const [dx,dy]=slabOffset(i,t); return [p[0]+dx,p[1]+dy,p[2]];}
function gridWorld(i,t){ const c=CL[i], g=GRID[c]; const s=rotY(LOCAL[i],t*1.5+c); return [g[0]+s[0],g[1]+s[1],g[2]+s[2]];}
function sortPos(i,t){ // 8–12 秒：炸开 → 分拣入筐
  const c=CL[i]; const q=gridWorld(i,8.0); const p0=[q[0]*0.15,q[1]*0.15,q[2]*0.15];
  const cs=CLSC[c], e=eo3(seg(t,8.0,8.6));
  const sc=lerp3(p0,[cs.s[0]+LOCAL[i][0]*2,cs.s[1]+LOCAL[i][1]*2,cs.s[2]+LOCAL[i][2]*2],e);
  const st=8.55+BIN.b[c]*0.4+cs.dl*0.25, r=eio(seg(t,st,st+0.75));
  const bp=binPos(c,t), lp=rotY(LOCAL[i],t*1.2+c);
  return [lerp3(sc,[bp[0]+lp[0]*0.85,bp[1]+lp[1]*0.85,bp[2]+lp[2]*0.85],r),lerp(18,20,r)];}
function cellWorld(k,t){ const col=k%10,row=Math.floor(k/10);
  return [(col-4.5)*62,(row-4.5)*62,70*Math.sin(col*0.7+row*0.5+t*1.3)];}
function finalWorld(i,t){
  if(GOLD[i]){ const n=GOLD_IDX.n, k=GOLD_IDX.m[i], y=1-2*(k+0.5)/n, r=Math.sqrt(1-y*y), a=k*2.399963, R=108;
    let p=[Math.cos(a)*r*R,y*R,Math.sin(a)*r*R]; p=rotY(p,t*0.6); p=rotX(p,0.3); return [p,24];}
  const k=ORB.m[i], ring=k%3, j=Math.floor(k/3), per=Math.ceil(ORB.n/3);
  const boost=1+2.2*eio(seg(t,28,28.8))*(1-seg(t,29.2,30.4));
  const a=j/per*Math.PI*2+(t-20)*RING_SP[ring]*boost;
  let p=[RING_R[ring]*Math.cos(a),0,RING_R[ring]*Math.sin(a)]; p=rotX(p,RING_TILT[ring][0]); p=rotZ(p,RING_TILT[ring][1]);
  const pulse=1+0.45*Math.exp(-Math.pow((t-(22+2*ring)-0.25)/0.3,2));
  return [p,16*pulse];}
function posAt(i,t){ // [世界坐标, 半径, 透明度]
  if(t<7.0) return [figureWorld(i,t),18,1];
  if(t<HITS.drop){ const k4=eio(seg(t,7.0+YR[i]*0.25,7.35+YR[i]*0.25));
    let p=lerp3(figureWorld(i,7.0),gridWorld(i,t),k4); const sq=1-0.85*ein(seg(t,7.45,7.9)); return [[p[0]*sq,p[1]*sq,p[2]*sq],18,1];}
  if(t<12.0){ const [p,r]=sortPos(i,t); return [p,r,1]; }
  const cell=PERM[i];
  if(t<HITS.gap2){ const [p12]=sortPos(i,12.0), u=(cell<0?0:cell/100);
    if(cell<0){ const k=eio(seg(t,12.0,13.2)); return [lerp3(p12,FAR[i],k),20,1-seg(t,12.4,13.2)]; }
    const k=eio(seg(t,12.0+u*0.7,12.9+u*0.7)); return [lerp3(p12,cellWorld(cell,t),k),lerp(20,21,k),1]; }
  let c0=[0,0,0];
  if(cell>=0){ const q=cellWorld(cell,HITS.gap2), sq=1-0.85*ein(seg(t,19.5,19.9)); c0=[q[0]*sq,q[1]*sq,q[2]*sq]; }
  if(t<HITS.drop2) return [c0,21,cell>=0?1:0];
  const [fp,fr]=finalWorld(i,t), e=eo3(seg(t,20.0,20.8+SCAT_DL[i]*0.6));
  return [lerp3(c0,fp,e),lerp(21,fr,e),cell>=0?1:Math.min(1,seg(t,20.0,20.15))];}
const SCAT_DL=BODY.map(()=>R0());
function sortColor(i,t){ const c=CL[i], bi=BIN.b[c], st=8.55+bi*0.4+CLSC[c].dl*0.25, k=seg(t,st+0.35,st+0.75);
  if(bi===0) return [k,0]; if(bi===1) return [(i%2)?k:0,0]; return [0,k];}
function colorAt(i,t){
  if(t<8.0) return [0,0];
  if(t<12.0) return sortColor(i,t);
  if(t<HITS.drop2){ const [c,g]=sortColor(i,12), f=1-seg(t,12.0,12.8), cell=PERM[i];
    let dc=0; if(cell>=0){ const rk=CELL_RANK[cell];
      if(rk<80) dc=0.42*seg(t,14.0+rk/80*0.9,14.25+rk/80*0.9);
      if(rk<19) dc=Math.max(dc,seg(t,16.0+rk/19*0.6,16.25+rk/19*0.6)); }
    return [Math.max(c*f,dc),g*f]; }
  const k=seg(t,20.0,20.6);
  if(GOLD[i]) return [0,k];
  return [BIN.b[CL[i]]===0||(i%2)?k:0.25*k,0];}
function spheres(t){
  const out=[];
  for(let i=0;i<NB;i++){ const [p,rad,a]=posAt(i,t); if(a<=0) continue; const [c,g]=colorAt(i,t);
    const q=project(p); out.push({x:q.x,y:q.y,r:rad*q.sc,z:q.z,c,g,a,h:Math.round(2+2*Math.sin(CL[i]/NC*Math.PI*4))});}
  for(const [t0,every,life] of [[HITS.drop,1,2.6],[HITS.drop2,2,2.2]]){ if(t<t0||t>t0+life+1.5) continue;
    for(let n=0;n<DUST.length;n+=every){ const d=DUST[n]; const k=eo3(seg(t,t0+d.dl*0.1,t0+d.dl*0.1+1.0*d.sp));
      if(k<=0) continue; const p=[d.d[0]*k,d.d[1]*k,d.d[2]*k];
      const q=project(p); const a=Math.min(1,k*5)*(1-seg(t,t0+life*0.55+d.dl*2,t0+life+d.dl*3));
      if(a<=0) continue; out.push({x:q.x,y:q.y,r:d.rad*q.sc,z:q.z,c:d.g?0:1,g:d.g?1:0,a,h:d.h});}}
  return out;}
// 切片刀光
function cutLines(ctx,t){
  CUTS.forEach((t0,k)=>{ const a=1-seg(t,t0+0.05,t0+0.4); if(t<t0||a<=0) return; const n=2**(k+1);
    for(let s=1;s<n;s+=2){ let best=0; for(let i=0;i<NB;i++){ if(Math.abs(YR[i]-s/n)<0.006){ best=i; break; } }
      const q=project(figureWorld(best,t0)); const sweep=eo3(seg(t,t0,t0+0.14));
      ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle='#ffffff'; ctx.lineWidth=3; ctx.shadowColor='#bff6ff'; ctx.shadowBlur=18;
      ctx.beginPath(); ctx.moveTo(60,q.y); ctx.lineTo(lerp(60,W-60,sweep),q.y); ctx.stroke(); ctx.restore(); }});
  const a=1-seg(t,7.05,7.4); if(t>=7.0&&a>0){ ctx.save(); ctx.globalAlpha=a*0.8; ctx.strokeStyle='#ffffff'; ctx.lineWidth=2; ctx.shadowColor='#bff6ff'; ctx.shadowBlur=14;
    for(let c=1;c<6;c++){const x=CX+(c-3)*150; ctx.beginPath(); ctx.moveTo(x,600); ctx.lineTo(x,lerp(600,1300,eo3(seg(t,7.0,7.15)))); ctx.stroke();} ctx.restore(); }}

// ───────── 彩色粒子烟雾（来自帕金森那期的 ColorMist）─────────
const F=t=>Math.round(t*FPS);
const NEON={...MIST_PALETTES.ruby, bg:['#030208','#07050f','#0d0818'], shadow:'rgba(0,0,0,0.85)', body:[[24,30,70],[60,20,70],[16,60,64]]};
const drive=makeDrive({bands:window.BANDS, curve:[2.2,1.4,1.6], gain:[1.1,1,1.2],
  burst:[{from:F(HITS.drop),attack:3,hold:6,release:80},{from:F(14),attack:4,hold:0,release:30,peak:0.25},{from:F(16),attack:4,hold:0,release:30,peak:0.35},
    {from:F(HITS.drop2),attack:3,hold:6,release:80},...HITS.layers.map(s=>({from:F(s),attack:3,hold:0,release:24,peak:0.35}))],
  contract:[{from:F(HITS.gap),attack:3,hold:10,release:3},{from:F(HITS.gap2),attack:3,hold:10,release:3}],
  twist:[{from:F(6.0),attack:45,release:4,ease:'in'},{from:F(18.0),attack:45,release:4,ease:'in'}]});
const MCV=document.createElement('canvas'); MCV.width=W; MCV.height=H;
const LAYERS=(()=>{const fog=document.createElement('canvas');fog.width=W/2;fog.height=H/2;const dots=document.createElement('canvas');dots.width=W;dots.height=H;return {fog,dots};})();
function mistState(t){ // [scale, alpha]
  if(t<7.4) return [0.25,0];
  if(t<HITS.drop) return [0.26,0.85*seg(t,7.4,7.9)];
  if(t<12.0) return [lerp(0.26,1.15,eo3(seg(t,8.0,9.0))),0.85];
  if(t<HITS.gap2) return [lerp(1.15,0.55,eio(seg(t,12,13))),lerp(0.85,0.22,seg(t,12,13))+0.25*seg(t,17.6,18.6)];
  if(t<HITS.drop2) return [lerp(0.55,0.28,ein(seg(t,19.5,19.9))),lerp(0.47,0.9,seg(t,19.5,19.9))];
  return [lerp(0.28,1.25,eo3(seg(t,20.0,21.0))),0.9-0.15*seg(t,28,29)];}
function mist(ctx,t){ const [sc,al]=mistState(t); if(al<=0.01) return;
  drawMist(MCV,LAYERS,{f:F(t),drive,palette:NEON,seed:9,x:CX,y:CY,scale:sc,density:1,background:false});
  ctx.save(); ctx.globalAlpha=al; ctx.drawImage(MCV,0,0); ctx.restore();}

function drawSpheres(ctx,list){
  for(const s of list){ if(s.r<1||s.x<-s.r||s.x>W+s.r||s.y<-s.r||s.y>H+s.r) continue;
    ctx.globalAlpha=s.a;
    if(s.c+s.g<1) ctx.drawImage(SP_GRAY,s.x-s.r,s.y-s.r,s.r*2,s.r*2);
    if(s.c>0){ ctx.globalAlpha=s.a*s.c; ctx.drawImage(SP_HUE[s.h],s.x-s.r,s.y-s.r,s.r*2,s.r*2);}
    if(s.g>0){ ctx.globalAlpha=s.a*s.g; ctx.drawImage(SP_GOLD,s.x-s.r,s.y-s.r,s.r*2,s.r*2);} }
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
  ctx.textAlign='left'; ctx.fillText('02 / 任务',m+14,H-m-30);
  ctx.textAlign='right'; ctx.fillText('1080 × 1920 / 30 FPS',W-m-14,H-m-30);
  ctx.restore();}

function word(ctx,t){
  ctx.save(); ctx.font=`900 300px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const dim=1-0.35*seg(t,7.5,7.9)+0.35*seg(t,8.0,8.4)-0.35*seg(t,19.5,19.9)+0.35*seg(t,20.0,20.4);
  ctx.globalAlpha=dim; ctx.fillStyle='#EDEAE2';
  [['重',-1,-1],['构',1,-1],['任',-1,1],['务',1,1]].forEach(([c,sx,sy])=>ctx.fillText(c,CX+sx*158,CY+sy*160+8)); ctx.restore();}

function line(ctx,s,y,size,col,a,w=900){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.font=`${w} ${size}px ${SANS}`;
  const mw=ctx.measureText(s).width; if(mw>940){ size=Math.floor(size*940/mw); ctx.font=`${w} ${size}px ${SANS}`; } ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=20; ctx.fillStyle=col; ctx.fillText(s,W/2,y); ctx.restore(); }

function hook(ctx,t){ const a=1-seg(t,7.25,7.5);
  line(ctx,'AI 会抢走你的岗位吗？',372,76,'#EDEAE2',a);}

function tags(ctx,t){
  const items=['交给 AI','AI 做人审','只能人做'], xs=[CX-270,CX,CX+270], y=1338;
  const on=i=>t<12?seg(t,9.0+i*0.4,9.3+i*0.4):(t<20?1-seg(t,12,12.5):seg(t,20.2+i*0.2,20.5+i*0.2));
  ctx.save(); ctx.font=`500 30px ${MONO}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(237,234,226,0.3)'; ctx.fillText('/',CX-135,y); ctx.fillText('/',CX+135,y);
  items.forEach((s,i)=>{ const o=on(i); const rgb=i===2?'255,200,90':'127,243,255'; ctx.fillStyle=`rgba(${o>0?rgb:'237,234,226'},${0.35+0.65*o})`; ctx.fillText(s,xs[i],y);});
  if(t>9.0&&(t<12.2||t>20.2)){ ctx.globalAlpha=0.45*(t<12.2?seg(t,9.0,9.4)*(1-seg(t,11.9,12.2)):seg(t,20.2,20.6)); ctx.font=`400 20px ${MONO}`; ctx.fillStyle='#EDEAE2'; ctx.textAlign='right'; ctx.fillText('示意',W-80,1300);}
  ctx.restore();}

const LINES=[[0,3.85,'判断','你的岗位，是一整块吗？'],[4.0,7.35,'判断','拆开看，是三十件事'],[9.6,11.8,'判断','有的交出去，有的要审，有的只能你来'],
  [12.6,15.4,'数据','约 80% 的美国劳动者，至少一成任务会被影响'],[15.5,17.55,'数据','约 19% 的人，一半以上任务会被影响'],[17.65,19.4,'判断','拿走的是任务，不是整个人'],
  [22.0,23.9,'第一步','把岗位写成 30 件事'],[24.0,25.9,'第二步','每件事问：有标准吗？错了代价大吗？'],[26.0,27.9,'第三步','能交的交，该审的审'],
  [28.1,99,'问题','你每天 30 件事里，有几件非你不可？']];
// 数据段标注
function dataLabels(ctx,t){ const a=seg(t,12.8,13.2)*(1-seg(t,19.2,19.5)); if(a<=0) return;
  ctx.save(); ctx.globalAlpha=a*0.6; ctx.fillStyle='#EDEAE2'; ctx.font=`500 24px ${MONO}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('1 颗 = 1% 的美国劳动者',W/2,560);
  for(const [t0,x,big,small,col] of [[14.0,290,'80%','≥ 10% 任务受影响','#d7b8ff'],[16.0,790,'19%','≥ 50% 任务受影响','#7ff3ff']]){
    const k=seg(t,t0,t0+0.3); if(k<=0) continue; const pop=1+0.25*(1-eo3(seg(t,t0,t0+0.4)));
    ctx.globalAlpha=a*k; ctx.fillStyle=col; ctx.font=`700 ${Math.round(84*pop)}px ${MONO}`; ctx.fillText(big,x,430);
    ctx.globalAlpha=a*k*0.75; ctx.fillStyle='#EDEAE2'; ctx.font=`500 24px ${MONO}`; ctx.fillText(small,x,495);}
  ctx.globalAlpha=a*0.5; ctx.font=`400 20px ${MONO}`;
  ctx.fillText('来源：Eloundou, Manning, Mishkin, Rock, "GPTs are GPTs", arXiv:2303.10130, 2023',W/2,1690);
  ctx.restore();}
function prompt(ctx,t){
  for(const [a,b,lab,s] of LINES){ const al=seg(t,a,a+0.25)*(1-seg(t,b-0.2,b)); if(al<=0) continue;
    ctx.save(); ctx.globalAlpha=al; ctx.font=`500 22px ${MONO}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(237,234,226,0.5)'; ctx.fillText(`—  ${lab}  —`,W/2,1406); ctx.restore();
    line(ctx,s,1462,46,'#EDEAE2',al,700);}}

function glow(ctx,t){ const a=0.5*seg(t,8.0,9.2); if(a<=0) return;
  const g=ctx.createRadialGradient(CX,CY,0,CX,CY,760); g.addColorStop(0,`rgba(120,60,255,${0.26*a})`); g.addColorStop(0.5,`rgba(220,140,40,${0.1*a})`); g.addColorStop(1,'rgba(0,0,0,0)');
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
  ctx.drawImage(BG,0,0); mist(ctx,t);
  const list=spheres(t).sort((a,b)=>b.z-a.z);
  const back=list.filter(s=>s.z>=0), front=list.filter(s=>s.z<0);
  drawSpheres(ctx,back); word(ctx,t); drawSpheres(ctx,front);
  cutLines(ctx,t); hud(ctx,t); topIP(ctx); hook(ctx,t); dataLabels(ctx,t); tags(ctx,t); prompt(ctx,t); endLogo(ctx,t);}
window.__ep={render,DUR};
