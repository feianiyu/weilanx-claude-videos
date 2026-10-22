// AI 重构 · 03「组织」完整版（32 秒）：什么叫 AI 型组织。画面 = 时间 t 的纯函数。
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
const GLOW=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const r=g.createRadialGradient(64,64,0,64,64,64);
  r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.25,'rgba(200,250,255,0.75)');r.addColorStop(1,'rgba(120,200,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return c;})();
const R0=rng(13);
// ───────── 金字塔组织树：1 → 3 → 9 → 27 → 81 ─────────
const CNT=[1,3,9,27,81], OFF=[0,1,4,13,40], NT=121, NAI=48, NB=NT+NAI;
const LV=new Array(NT), KK=new Array(NT); for(let l=0;l<5;l++) for(let k=0;k<CNT[l];k++){LV[OFF[l]+k]=l;KK[OFF[l]+k]=k;}
const PARENT=i=>LV[i]===0?-1:OFF[LV[i]-1]+Math.floor(KK[i]/3);
const TY=[-330,-185,-40,110,285], TR=[0,95,190,300,415], TS=[30,25,21,18,15];
function treeWorld(i,t){ const l=LV[i], n=CNT[l], a=(KK[i]+0.5)/n*Math.PI*2+t*0.22+(l%2)*0.2;
  let p=[TR[l]*Math.cos(a),TY[l],TR[l]*Math.sin(a)]; return rotX(p,-0.22);}
const DL=Array.from({length:NB},()=>R0());
const FAR=Array.from({length:NB},()=>{const a=R0()*Math.PI*2;return [Math.cos(a)*(900+R0()*700),Math.sin(a)*(1200+R0()*700),(R0()-0.3)*1600];});
// ───────── AI 型组织：中心 + 6 个小队 + AI 卫星 ─────────
const isMid=i=>i<NT&&LV[i]>=1&&LV[i]<=3, isLeaf=i=>i<NT&&LV[i]===4, isAI=i=>i>=NT;
function netRot(t){ return (t-8)*0.12 + 1.6*eio(seg(t,28,29.4)); }
function podCenter(pod,t){ const a=pod/6*Math.PI*2+0.5236+netRot(t); return [390*Math.cos(a),300*Math.sin(a)-20,70*Math.sin(a*2+t*0.5)];}
function netWorld(i,t){ // [坐标, 半径]
  if(i===0) return [[0,0,0],36];
  if(isLeaf(i)){ const j=KK[i];
    if(j>=78){ const a=(j-78)/3*Math.PI*2+t*0.5; return [[95*Math.cos(a),95*Math.sin(a)*0.5,95*Math.sin(a)],15]; }
    const pod=Math.floor(j/13), q=j%13, c=podCenter(pod,t);
    if(q===0) return [c,24];
    let o=[78*Math.cos((q-1)/12*Math.PI*2+t*0.8),0,78*Math.sin((q-1)/12*Math.PI*2+t*0.8)]; o=rotX(o,0.9); o=rotZ(o,pod);
    return [[c[0]+o[0],c[1]+o[1],c[2]+o[2]],15]; }
  if(isAI(i)){ const m=i-NT, pod=Math.floor(m/8), c=podCenter(pod,t);
    let o=[128*Math.cos(m%8/8*Math.PI*2+t*1.6),0,128*Math.sin(m%8/8*Math.PI*2+t*1.6)]; o=rotX(o,1.25); o=rotZ(o,pod*1.1+0.4);
    return [[c[0]+o[0],c[1]+o[1],c[2]+o[2]],12]; }
  return [[0,0,0],1];}
const leaderOf=pod=>OFF[4]+pod*13;
// ───────── 数据段：5 座小金字塔（每座 = 20% 的组织）─────────
const PYR_X=[-108,-63,-21,21,63,108];
function pyrWorld(j,t){ const p=Math.floor(j/10), q=j%10, cx=(p-2)*170;
  let x,y; if(q===0){x=0;y=-150;} else if(q<=3){x=(q-2)*62;y=-40;} else {x=PYR_X[q-4];y=85;}
  let r=q===0?20:(q<=3?17:14);
  let p3=[cx+x*0.72,y*0.85+20,-260+30*Math.sin(p*1.3+t*1.1)];
  if(p===2&&(q===1||q===2)){ const k=ein(seg(t,15.5+(q-1)*0.15,16.3+(q-1)*0.15)); p3[1]+=620*k; p3[0]+=(q-1.5)*160*k; }
  return [p3,r];}
const fell=(j,t)=>Math.floor(j/10)===2&&(j%10===1||j%10===2)?seg(t,15.6,16.4):0;
const AI_SPOT=[0,195,-260];

function project(p){const z=Math.max(-1350,p[2]);const sc=D/(D+z);return {x:CX+p[0]*sc,y:CY+p[1]*sc,sc,z};}
function lerp3(a,b,k){return [lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)];}
const SQ=(p,k)=>[p[0]*k,p[1]*k,p[2]*k];
function treePhase(i,t){ let p=treeWorld(i,t);
  if(isMid(i)){ const k=ein(seg(t,7.45,7.9)); p=lerp3(p,[0,-40,0],0.88*k); } return p;}
function posAt(i,t){ // [坐标, 半径, 透明度]
  const dl=DL[i];
  if(t<HITS.drop){ if(isAI(i)) return [FAR[i],12,0]; return [treePhase(i,t),TS[LV[i]],1]; }
  if(t<12.0){
    if(isMid(i)){ const e=eo3(seg(t,8.0,9.0)); return [lerp3(treePhase(i,8),FAR[i],e),TS[LV[i]],1-seg(t,8.3,9.2)]; }
    if(isAI(i)){ const r=eio(seg(t,8.3+dl*0.5,9.3+dl*0.5)); const [np,nr]=netWorld(i,t); return [lerp3(FAR[i],np,r),nr,seg(t,8.3,8.5)]; }
    const r=eio(seg(t,8.0+dl*0.6,8.9+dl*0.6)); const [np,nr]=netWorld(i,t); return [lerp3(treePhase(i,8),np,r),lerp(TS[LV[i]],nr,r),1]; }
  const j=isLeaf(i)?KK[i]:-1, inPyr=j>=0&&j<50;
  if(t<HITS.gap2){
    if(inPyr){ const u=j/50, r=eio(seg(t,12.0+u*0.5,12.9+u*0.5)); const [n12]=netWorld(i,12), [pp,pr]=pyrWorld(j,t);
      return [lerp3(n12,pp,r),pr,(1-fell(j,t))*(Math.floor(j/10)===2?1:1-0.55*seg(t,14.0,14.4))]; }
    if(i===NT){ if(t<17.5){ const k=eio(seg(t,12,13)); return [lerp3(netWorld(i,12)[0],FAR[i],k),12,1-seg(t,12.3,13)]; }
      const r=eio(seg(t,17.5,18.2)); return [lerp3([-700,-900,-200],[AI_SPOT[0],AI_SPOT[1]+8*Math.sin(t*2),0],r),lerp(30,15,r),seg(t,17.5,17.6)]; }
    const k=eio(seg(t,12,13)); const [n12,nr]=netWorld(i,12); return [lerp3(n12,FAR[i],k),nr,isMid(i)?0:1-seg(t,12.3,13)]; }
  // 19.5 抽空 → 20 drop：新组织
  let c0=[0,0,0], a0=0;
  if(inPyr&&!fell(j,HITS.gap2)){ c0=SQ(pyrWorld(j,HITS.gap2)[0],1-0.85*ein(seg(t,19.5,19.9))); a0=1; }
  if(i===NT){ c0=SQ(AI_SPOT,1-0.85*ein(seg(t,19.5,19.9))); a0=1; }
  if(isMid(i)) return [c0,1,0];
  if(t<HITS.drop2) return [c0,15,a0];
  const [np,nr]=netWorld(i,t), e=eo3(seg(t,20.0,20.8+dl*0.6));
  let rad=nr;
  if(isAI(i)) rad*=1+0.5*Math.exp(-Math.pow((t-24.25)/0.3,2));
  if(isLeaf(i)&&KK[i]<78&&KK[i]%13===0) rad*=1+0.45*Math.exp(-Math.pow((t-26.25)/0.3,2));
  return [lerp3(c0,np,e),lerp(15,rad,e),Math.max(a0,seg(t,20.0,20.15))];}
function colorAt(i,t){ // [彩, 金]
  if(t<HITS.drop) return [0,0];
  if(t<12.0) return isAI(i)?[1,0]:[0,0];
  if(t<HITS.drop2){ if(i===NT) return [1,0]; const j=isLeaf(i)?KK[i]:-1;
    if(j>=0&&j<50&&Math.floor(j/10)===2) return [0.45*seg(t,14.0,14.4),0]; return [0,0]; }
  const k=seg(t,20.2,20.8);
  if(i===0) return [0,k];
  if(isAI(i)) return [k,0];
  if(isLeaf(i)&&KK[i]<78&&KK[i]%13===0) return [0,k];
  return [(KK[i]%2)?0.5*k:0,0];}
function hueOf(i){ return isAI(i)?Math.floor((i-NT)/8)%5:2; }
let EDGES=[], SIGS=[];
function spheres(t){
  const out=[], P=new Array(NB), A=new Array(NB);
  for(let i=0;i<NB;i++){ const [p,rad,a]=posAt(i,t); const q=project(p); P[i]=q; A[i]=a; if(a<=0.01) continue; const [c,g]=colorAt(i,t);
    out.push({x:q.x,y:q.y,r:rad*q.sc,z:q.z,c,g,a,h:hueOf(i)});}
  EDGES=[]; SIGS=[];
  const E=(i,j,al,w,col)=>{ if(al<=0.01||A[i]<=0.01||A[j]<=0.01) return; EDGES.push([P[i],P[j],al*Math.min(A[i],A[j]),w,col,(P[i].z+P[j].z)/2]); };
  // 金字塔连线 + 信号
  const ta=1-seg(t,8.0,8.3);
  if(ta>0) for(let i=1;i<NT;i++) E(i,PARENT(i),0.42*ta,2,'200,205,220');
  if(t>=4.0&&t<8.0) for(let l=1;l<5;l++){ const t0=3+l, u=seg(t,t0,t0+0.5); if(t<t0) continue; const fade=1-seg(t,t0+0.5,t0+0.9); if(fade<=0) continue;
    const br=[1,0.72,0.48,0.3][l-1];
    for(let k=0;k<CNT[l];k++){ const i=OFF[l]+k, pa=P[PARENT(i)], ch=P[i], e=eio(u);
      SIGS.push([lerp(pa.x,ch.x,e),lerp(pa.y,ch.y,e),(26-l*3)*br+6,br*fade]); }}
  // 网络连线
  const na=seg(t,9.0,9.6)*(1-seg(t,12.0,12.4))+seg(t,20.6,21.2);
  if(na>0){ for(let pod=0;pod<6;pod++){ const L=leaderOf(pod);
      E(0,L,0.5*na,3,'255,214,140'); E(L,leaderOf((pod+1)%6),0.16*na,2,'190,230,255');
      for(let q=1;q<13;q++) E(L,L+q,0.16*na,1.5,'220,225,235'); }
    if(t>=21.8&&t<23.0) for(let pod=0;pod<6;pod++){ const L=leaderOf(pod), u=seg(t,22.0,22.45), f=1-seg(t,22.45,22.9); if(u<=0||f<=0) continue;
      const e=eio(u); SIGS.push([lerp(P[0].x,P[L].x,e),lerp(P[0].y,P[L].y,e),24,f]); }
    if(t>=9.0&&t<10.2) for(let pod=0;pod<6;pod++){ const L=leaderOf(pod), u=seg(t,9.2,9.6), f=1-seg(t,9.6,10.0); if(u<=0||f<=0) continue;
      const e=eio(u); SIGS.push([lerp(P[0].x,P[L].x,e),lerp(P[0].y,P[L].y,e),22,f*0.8]); } }
  // 数据段：小金字塔连线
  const pa=seg(t,12.8,13.2)*(1-seg(t,19.5,19.8));
  if(pa>0) for(let p=0;p<5;p++){ const base=OFF[4]+p*10, hl=p===2?1:0.7;
    for(let m=1;m<=3;m++){ E(base,base+m,0.32*pa*hl,2,'200,205,220');
      for(const b of [2*(m-1)+4,2*(m-1)+5]){ if(b>9) continue; const fall=p===2&&(m===1||m===2);
        E(base+m,base+b,0.32*pa*hl*(fall?1-seg(t,15.5,15.8):1),2,'200,205,220');
        if(fall) E(base,base+b,0.55*pa*seg(t,15.9,16.4),2.5,'127,243,255'); } } }
  if(t>=17.9) E(OFF[4]+20,NT,0.6*seg(t,18.0,18.4)*(1-seg(t,19.5,19.8)),2.5,'127,243,255');
  return out;}
function drawEdges(ctx,front){
  ctx.save(); ctx.lineCap='round';
  for(const [a,b,al,w,col,z] of EDGES){ if((z<0)!==front) continue; ctx.strokeStyle=`rgba(${col},${al})`; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  ctx.restore();}
function drawSigs(ctx){ ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const [x,y,r,a] of SIGS){ ctx.globalAlpha=a; ctx.drawImage(GLOW,x-r*2,y-r*2,r*4,r*4); } ctx.restore();}

// ───────── 彩色粒子烟雾（来自帕金森那期的 ColorMist）─────────
const F=t=>Math.round(t*FPS);
const NEON={...MIST_PALETTES.ruby, bg:['#030208','#07050f','#0d0818'], shadow:'rgba(0,0,0,0.85)', body:[[24,30,70],[60,20,70],[16,60,64]]};
const drive=makeDrive({bands:window.BANDS, curve:[2.2,1.4,1.6], gain:[1.1,1,1.2],
  burst:[{from:F(HITS.drop),attack:3,hold:6,release:80},{from:F(14),attack:4,hold:0,release:30,peak:0.25},{from:F(15.5),attack:4,hold:0,release:30,peak:0.3},{from:F(17.5),attack:4,hold:0,release:30,peak:0.3},
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
  ctx.textAlign='left'; ctx.fillText('03 / 组织',m+14,H-m-30);
  ctx.textAlign='right'; ctx.fillText('1080 × 1920 / 30 FPS',W-m-14,H-m-30);
  ctx.restore();}

function word(ctx,t){
  ctx.save(); ctx.font=`900 300px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const dim=1-0.35*seg(t,7.5,7.9)+0.35*seg(t,8.0,8.4)-0.35*seg(t,19.5,19.9)+0.35*seg(t,20.0,20.4);
  ctx.globalAlpha=dim; ctx.fillStyle='#EDEAE2';
  [['重',-1,-1],['构',1,-1],['组',-1,1],['织',1,1]].forEach(([c,sx,sy])=>ctx.fillText(c,CX+sx*158,CY+sy*160+8)); ctx.restore();}

function line(ctx,s,y,size,col,a,w=900){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.font=`${w} ${size}px ${SANS}`;
  const mw=ctx.measureText(s).width; if(mw>940){ size=Math.floor(size*940/mw); ctx.font=`${w} ${size}px ${SANS}`; } ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=20; ctx.fillStyle=col; ctx.fillText(s,W/2,y); ctx.restore(); }

function hook(ctx,t){ const a=1-seg(t,7.25,7.5);
  line(ctx,'AI 型组织，和传统组织差在哪？',372,72,'#EDEAE2',a);}

function tags(ctx,t){
  const items=['信息','扩张','中层'], xs=[CX-270,CX,CX+270], y=1338;
  const on=i=>t<20?0:seg(t,HITS.layers[i],HITS.layers[i]+0.3);
  ctx.save(); ctx.font=`500 30px ${MONO}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(237,234,226,0.3)'; ctx.fillText('/',CX-135,y); ctx.fillText('/',CX+135,y);
  items.forEach((s,i)=>{ const o=on(i); const rgb=i===2?'255,200,90':'127,243,255'; ctx.fillStyle=`rgba(${o>0?rgb:'237,234,226'},${0.35+0.65*o})`; ctx.fillText(s,xs[i],y);});
  const sa=t>9.0&&t<12.2?seg(t,9.0,9.4)*(1-seg(t,11.9,12.2)):0; if(sa>0){ ctx.globalAlpha=0.45*sa; ctx.font=`400 20px ${MONO}`; ctx.fillStyle='#EDEAE2'; ctx.textAlign='right'; ctx.fillText('示意',W-80,1300);}
  ctx.restore();}

const LINES=[[0,3.85,'传统组织','一座金字塔，一层管一层'],[4.0,7.35,'传统组织','一句话传到一线，要过四道手'],[9.4,11.8,'AI 型组织','一张「小队 + AI」的网'],
  [12.6,14.95,'预测','Gartner：到 2026 年，20% 的组织会用 AI 压平架构'],[15.05,17.45,'预测','砍掉现有一半以上的中层岗位'],[17.55,19.4,'内部信','Shopify：想加人，先证明 AI 做不了'],
  [22.0,23.9,'区别一','信息：层层转 → 直达一线'],[24.0,25.9,'区别二','扩张：先加人 → 先加 AI'],[26.0,27.9,'区别三','中层：传话的 → 带人拍板的'],
  [28.1,99,'问题','你的公司，是金字塔还是网？']];
function dataLabels(ctx,t){ const a=seg(t,12.8,13.2)*(1-seg(t,19.2,19.5)); if(a<=0) return;
  ctx.save(); ctx.globalAlpha=a*0.6; ctx.fillStyle='#EDEAE2'; ctx.font=`500 24px ${MONO}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('1 座 = 20% 的组织（预测）',W/2,560);
  for(const [t0,t1,x,big,small,col] of [[14.0,99,290,'20%','的组织压平架构','#d7b8ff'],[15.5,99,790,'> 50%','中层岗位被砍','#7ff3ff']]){
    const k=seg(t,t0,t0+0.3); if(k<=0) continue; const pop=1+0.25*(1-eo3(seg(t,t0,t0+0.4)));
    ctx.globalAlpha=a*k; ctx.fillStyle=col; ctx.font=`700 ${Math.round(84*pop)}px ${MONO}`; ctx.fillText(big,x,430);
    ctx.globalAlpha=a*k*0.75; ctx.fillStyle='#EDEAE2'; ctx.font=`500 24px ${SANS}`; ctx.fillText(small,x,495);}
  ctx.globalAlpha=a*0.5; ctx.font=`400 20px ${MONO}`;
  ctx.fillText(t<17.5?'来源：Gartner 新闻稿，2024-10-22，"Top Predictions for 2025 and Beyond"':'来源：Shopify CEO Tobi Lütke 内部信，2025 年 4 月（本人在 X 公开）',W/2,1690);
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
  drawEdges(ctx,false); drawSpheres(ctx,back); word(ctx,t); drawEdges(ctx,true); drawSpheres(ctx,front); drawSigs(ctx);
 hud(ctx,t); topIP(ctx); hook(ctx,t); dataLabels(ctx,t); tags(ctx,t); prompt(ctx,t); endLogo(ctx,t);}
window.__ep={render,DUR};
