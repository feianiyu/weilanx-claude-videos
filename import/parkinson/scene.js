/* ep54 帕金森定律 · 16 秒开头样片：彩雾（仓库 src/library/mist 原样移植）+ 方框 + 字 */
const W=1080, H=1920, FPS=30;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const eo3=x=>1-Math.pow(1-x,3);
const ein=x=>x*x*x;
const lerp=(a,b,k)=>a+(b-a)*k;
const HITS={kick:4.0,squeeze:8.0,gap:9.5,drop:10.0};
const F=t=>Math.round(t*FPS);

// 配色：ruby 的五彩粒子 + 近黑紫底，颜色对比拉满
const NEON={...MIST_PALETTES.ruby, bg:['#030208','#07050f','#0d0818'], shadow:'rgba(0,0,0,0.85)',
  body:[[24,30,70],[60,20,70],[16,60,64]]};
const drive=makeDrive({bands:window.BANDS, curve:[2.2,1.4,1.6], gain:[1.1,1,1.2],
  burst:[{from:F(HITS.kick),attack:3,hold:0,release:20,peak:0.3},{from:F(HITS.drop),attack:3,hold:6,release:80},
    ...[[16,0.2],[18,0.4],[20,0.45]].map(([s,p])=>({from:F(s),attack:4,hold:0,release:24,peak:p})),{from:F(32),attack:3,hold:4,release:45}],
  contract:[{from:F(HITS.gap),attack:3,hold:10,release:3},{from:F(31.5),attack:3,hold:10,release:3}],
  twist:[{from:F(HITS.squeeze),attack:45,release:4,ease:'in'},{from:F(30),attack:45,release:4,ease:'in'}]});
const MCV=document.createElement('canvas'); MCV.width=W; MCV.height=H;
const LAYERS=(()=>{const fog=document.createElement('canvas');fog.width=W/2;fog.height=H/2;const dots=document.createElement('canvas');dots.width=W;dots.height=H;return {fog,dots};})();

function mistScale(t){
  if(t<3) return 0.3;
  if(t<HITS.squeeze) return lerp(0.3,1.25,eio(seg(t,3,7.6)));
  if(t<HITS.gap) return lerp(1.25,0.32,ein(seg(t,HITS.squeeze,HITS.gap)));
  if(t<HITS.drop) return 0.32;
  return 1.0;
}
function boxSize(t){
  const W0=880,H0=1060,S=230;
  if(t<HITS.squeeze) return [W0,H0];
  const k=ein(seg(t,HITS.squeeze,HITS.gap)); return [lerp(W0,S,k),lerp(H0,S,k)];
}
/* ---------- 品牌立方体（与 src/library/laoyang/brand.tsx 的 CUBE_PATHS 同一画法）---------- */
const CUBE=(()=>{const R=50,RC=R*0.8660254,V={T:[60,10],UR:[60+RC,35],LR:[60+RC,85],B:[60,110],LL:[60-RC,85],UL:[60-RC,35],C:[60,60]};
  const tw=(a,b,d)=>{const dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy);return [a[0]+dx/n*d,a[1]+dy/n*d];};const G=10;
  return [[tw(V.UL,V.T,G),V.T,tw(V.UR,V.T,G)],[tw(V.UR,V.LR,G),tw(V.LR,V.UR,G)],[tw(V.LR,V.B,G),V.B,tw(V.LL,V.B,G)],[tw(V.LL,V.UL,G),tw(V.UL,V.LL,G)],[tw(V.UL,V.C,G),V.C,tw(V.UR,V.C,G)],[V.C,tw(V.B,V.C,G)]];})();
function cube(ctx,x,y,size,col,a){ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.scale(size/120,size/120);ctx.strokeStyle=col;ctx.lineWidth=12;ctx.lineCap='butt';ctx.lineJoin='miter';
  for(const p of CUBE){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}ctx.restore();}
const SANS='"Noto Sans SC","Noto Sans CJK SC","PingFang SC",sans-serif';
function txt(ctx,s,x,y,size,col,a,w=900,glowCol=null){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.font=`${w} ${size}px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=28; ctx.fillStyle=col; ctx.fillText(s,x,y);
  if(glowCol){ctx.shadowColor=glowCol; ctx.shadowBlur=26; ctx.fillText(s,x,y);} ctx.shadowBlur=0; ctx.fillText(s,x,y); ctx.restore(); }
function band(ctx,cy,h,a){ if(a<=0) return; const g=ctx.createLinearGradient(0,cy-h,0,cy+h); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.5,`rgba(0,0,0,${0.6*a})`); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,cy-h,W,h*2); }

function drawBox(ctx,t){
  const CX=540, CY=980; const [bw,bh]=boxSize(t);
  const a=1;
  const gold=seg(t,HITS.squeeze,HITS.gap);
  const col=`rgb(${Math.round(lerp(240,245,gold))},${Math.round(lerp(244,166,gold))},${Math.round(lerp(240,35,gold))})`;
  if(t<HITS.drop){
    ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=col; ctx.shadowColor=col; ctx.shadowBlur=18+30*gold;
    ctx.lineWidth=2.5; ctx.strokeRect(CX-bw/2,CY-bh/2,bw,bh);
    const c=Math.min(70,bw*0.18); ctx.lineWidth=8;
    for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const x=CX+sx*bw/2, y=CY+sy*bh/2; ctx.beginPath(); ctx.moveTo(x,y-sy*c); ctx.lineTo(x,y); ctx.lineTo(x-sx*c,y); ctx.stroke(); }
    ctx.restore();
  } else { // 方框被炸碎：四条边向外飞散
    const k=eo3(seg(t,HITS.drop,HITS.drop+0.7)), al=1-seg(t,HITS.drop,HITS.drop+0.7); if(al<=0) return;
    const s=115; ctx.save(); ctx.globalAlpha=al; ctx.strokeStyle='#F5A623'; ctx.shadowColor='#F5A623'; ctx.shadowBlur=30; ctx.lineWidth=6;
    const D=k*700, rot=k*1.2;
    [[0,-1],[1,0],[0,1],[-1,0]].forEach(([dx,dy],i)=>{ ctx.save(); ctx.translate(CX+dx*(s+D),CY+dy*(s+D)); ctx.rotate(rot*(i%2?1:-1)); ctx.beginPath(); if(dx===0){ctx.moveTo(-s,0);ctx.lineTo(s,0);}else{ctx.moveTo(0,-s);ctx.lineTo(0,s);} ctx.stroke(); ctx.restore(); });
    ctx.restore();
  }
}
const DAYS=['周一','周二','周三','周四','周五','周六','周日'];
function drawDays(ctx,t){
  const a=seg(t,3.0,3.5)*(1-seg(t,8.1,8.6)); if(a<=0) return;
  const p=seg(t,1.0,7.6), cur=Math.min(6,Math.floor(p*7)), y=395, x0=170, x1=910;
  ctx.save(); ctx.globalAlpha=a;
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x0,y+34); ctx.lineTo(x1,y+34); ctx.stroke();
  ctx.strokeStyle='#2BE08A'; ctx.shadowColor='#2BE08A'; ctx.shadowBlur=14; ctx.beginPath(); ctx.moveTo(x0,y+34); ctx.lineTo(lerp(x0,x1,p),y+34); ctx.stroke(); ctx.shadowBlur=0;
  DAYS.forEach((d,i)=>{ const x=lerp(x0,x1,i/6); const on=i===cur, past=i<cur, last=i===6&&cur===6;
    ctx.font=`900 ${on?34:28}px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=last?'#F5A623':on?'#FFFFFF':past?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.25)'; ctx.fillText(d,x,y); });
  if(cur===6){ const pa=0.6+0.4*Math.sin(t*14); ctx.globalAlpha=a*pa; ctx.font=`900 26px ${SANS}`; ctx.fillStyle='#F5A623'; ctx.textAlign='center'; ctx.fillText('截止日',x1,y-44); }
  ctx.restore();
}
function topIP(ctx){
  const y=232; ctx.save(); cube(ctx,540-82,y-20,40,'#2BE08A',0.8);
  ctx.globalAlpha=0.8; ctx.fillStyle='#2BE08A'; ctx.font=`900 30px ${SANS}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('老杨魔方',540-30,y+1); ctx.restore();
}
function renderA(ctx,t){
  const f=Math.round(t*FPS);
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  drawMist(MCV,LAYERS,{f,drive,palette:NEON,seed:7,x:540,y:960,scale:mistScale(t),density:1});
  const dil=t<HITS.squeeze?1-0.3*eio(seg(t,4.5,7.8)):1;   // 越胀越淡
  // drop 那几帧限亮：相邻帧亮度跳变控制在 20 以内（signalstats 实测后标定）
  const DIM={300:0.72,301:0.6,302:0.66,303:0.74,304:0.94};
  ctx.save(); ctx.globalAlpha=dil*(DIM[f]??1); ctx.drawImage(MCV,0,0); ctx.restore();
  drawBox(ctx,t);
  drawDays(ctx,t);
  // 抽空：画面收暗
  const gap=seg(t,HITS.gap-0.15,HITS.gap+0.1)*(1-seg(t,HITS.drop-0.02,HITS.drop));
  if(gap>0){ ctx.fillStyle=`rgba(0,0,0,${0.35*gap})`; ctx.fillRect(0,0,W,H); }
  // 钩子
  const ha=1-seg(t,2.8,3.2);
  if(ha>0){ band(ctx,356,140,ha); txt(ctx,'给你一周做的事',540,318,62,'#F4F6F2',ha); txt(ctx,'为什么总拖到最后一天？',540,404,74,'#2BE08A',ha,900,'rgba(43,224,138,0.6)'); }
  const caps=[[3.2,7.9,'工作会自动膨胀','直到填满你给它的所有时间'],[8.1,9.45,'截止日一到','它被压回原形'],[12.8,16.1,'帕金森定律','C. N. Parkinson ·《经济学人》1955']];
  for(const [a,b,h,s] of caps){ const al=seg(t,a,a+0.25)*(1-seg(t,b-0.25,b)); if(al<=0) continue; const pop=1-eo3(seg(t,a,a+0.35));
    band(ctx,1600,110,al); txt(ctx,h,540,1572+pop*14,62,h==='帕金森定律'?'#F5A623':'#2BE08A',al); txt(ctx,s,540,1638+pop*14,38,'#F4F6F2',al,700); }
  const da=seg(t,10.2,10.45)*(1-seg(t,12.4,12.7));
  if(da>0){ const sc=1+0.25*(1-eo3(seg(t,10.2,10.6))); ctx.save(); ctx.translate(540,960); ctx.scale(sc,sc); ctx.translate(-540,-960);
    txt(ctx,'真正干活',540,900,96,'#FFFFFF',da,900,'rgba(255,255,255,0.5)'); txt(ctx,'只要这一点时间',540,1020,68,'#2BE08A',da,900,'rgba(43,224,138,0.7)'); ctx.restore(); }
  topIP(ctx);
}


/* ================= 16–40 秒 ================= */
const LAY={1:[[540,960]],2:[[540,760],[540,1200]],4:[[330,760],[750,760],[330,1200],[750,1200]],
  8:[[330,640],[750,640],[330,880],[750,880],[330,1120],[750,1120],[330,1360],[750,1360]]};
const PARENT={2:i=>0,4:i=>Math.floor(i/2),8:i=>(i%2)+(i>=4?2:0)};
const SC={1:1.0,2:0.55,4:0.42,8:0.3}, DEN={1:1,2:0.5,4:0.3,8:0.18}, DIMN={1:1,2:0.95,4:0.8,8:0.62};
const STAGES=[[16,2,1],[18,4,2],[20,8,4]];
function bgFill(ctx){ const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,NEON.bg[0]); g.addColorStop(0.5,NEON.bg[1]); g.addColorStop(1,NEON.bg[2]); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
function mistAt(ctx,f,seed,x,y,scale,density,alpha){
  if(alpha<=0.01) return;
  drawMist(MCV,LAYERS,{f,drive,palette:NEON,seed,x,y,scale,density,background:false});
  ctx.save(); ctx.globalAlpha=alpha; ctx.drawImage(MCV,0,0); ctx.restore();
}
function clusters(ctx,t,f,fade){
  let st=STAGES[0]; for(const s of STAGES) if(t>=s[0]) st=s;
  const [T0,n,pn]=st, k=eo3(seg(t,T0,T0+0.9));
  const dim=lerp(DIMN[pn],DIMN[n],k)*(t>=22?lerp(1,0.8,seg(t,22,23)):1)*fade;
  for(let i=0;i<n;i++){
    const par=LAY[pn][PARENT[n](i)], to=LAY[n][i];
    mistAt(ctx,f,7+i,lerp(par[0],to[0],k),lerp(par[1],to[1],k),lerp(SC[pn],SC[n],k),DEN[n],dim);
  }
  return n;
}
function ship(ctx,x,y,s,col,a){
  if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(-40,0); ctx.lineTo(40,0); ctx.lineTo(30,14); ctx.lineTo(-34,14); ctx.closePath(); ctx.fill();
  ctx.fillRect(-16,-12,26,12); ctx.fillRect(-4,-24,8,12); ctx.beginPath(); ctx.moveTo(-30,-2); ctx.lineTo(-30,-18); ctx.moveTo(22,-2); ctx.lineTo(22,-16); ctx.stroke(); ctx.restore();
}
const SINK=[1,2,3,5,6,8];
function dataPanel(ctx,t){
  const a=seg(t,24.2,24.7)*(1-seg(t,29.8,30.3)); if(a<=0) return;
  txt(ctx,'英国海军 · 1914 → 1928',540,470,46,'#F4F6F2',a);
  // 左：军舰 9 艘，沉下去 6 艘
  txt(ctx,'军舰',300,610,40,'#F5A623',a);
  for(let i=0;i<9;i++){ const gx=i%3, gy=Math.floor(i/3), x=300+(gx-1)*110, y=760+gy*100;
    const sk=SINK.includes(i)?eo3(seg(t,25.0+SINK.indexOf(i)*0.08,25.7+SINK.indexOf(i)*0.08)):0;
    ship(ctx,x,y+sk*40,0.95,sk>0?'#8C938E':'#F5A623',a*(1-sk*0.85)); }
  const la=a*seg(t,25.3,25.7); txt(ctx,'少了 2/3',300,1150,62,'#F5A623',la,900,'rgba(245,166,35,0.5)');
  // 右：海军部官员，一点 = 20 人，100 点 → 178 点
  txt(ctx,'海军部官员',780,610,40,'#2BE08A',a);
  const k=eo3(seg(t,26.5,28.0)), nd=Math.round(lerp(100,178,k));
  ctx.save(); ctx.globalAlpha=a; for(let i=0;i<nd;i++){ const gx=i%10, gy=Math.floor(i/10); const fresh=i>=100;
    ctx.fillStyle=fresh?'#2BE08A':'rgba(244,246,242,0.75)'; ctx.beginPath(); ctx.arc(663+gx*26,690+gy*24,7.5,0,Math.PI*2); ctx.fill(); } ctx.restore();
  const ra=a*seg(t,26.4,26.8), num=Math.round(lerp(2000,3569,k));
  txt(ctx,`2000 → ${num}`,780,1150,46,'#F4F6F2',ra); txt(ctx,'+78%',780,1232,72,'#2BE08A',a*seg(t,27.9,28.2),900,'rgba(43,224,138,0.6)');
  txt(ctx,'数据：C. N. Parkinson，《经济学人》1955',540,1340,26,'rgba(244,246,242,0.55)',a*seg(t,25.0,25.5),500);
}
function boxB(ctx,t){
  const CX=540, CY=1000;
  if(t<30||t>=40) return;
  let w,h,col,glw;
  if(t<32){ const k=ein(seg(t,30.2,31.5)); w=lerp(880,230,k); h=lerp(1060,230,k); col='#F5A623'; glw=18+30*k; }
  else { const k=eo3(seg(t,32,32.8)); w=lerp(230,620,k); h=w; col=`rgb(${Math.round(lerp(245,43,k))},${Math.round(lerp(166,224,k))},${Math.round(lerp(35,138,k))})`; glw=30; }
  const a=seg(t,30.0,30.4)*(1-seg(t,39.2,39.9));
  ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=col; ctx.shadowColor=col; ctx.shadowBlur=glw; ctx.lineWidth=2.5; ctx.strokeRect(CX-w/2,CY-h/2,w,h);
  const c=Math.min(70,w*0.18); ctx.lineWidth=8;
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const x=CX+sx*w/2, y=CY+sy*h/2; ctx.beginPath(); ctx.moveTo(x,y-sy*c); ctx.lineTo(x,y); ctx.lineTo(x-sx*c,y); ctx.stroke(); }
  ctx.restore();
}
/* 片尾：彩色粒子聚成底部小署名，停一下再散开 */
let END=null;
function buildEnd(){
  const c=document.createElement('canvas'); c.width=W; c.height=120; const g=c.getContext('2d');
  g.translate(0,-1500); cube(g,540-128,1560-22,44,'#000',1); g.setTransform(1,0,0,1,0,0);
  g.fillStyle='#000'; g.font=`900 36px ${SANS}`; g.textAlign='left'; g.textBaseline='middle'; g.fillText('老杨魔方',540-70,61);
  const d=g.getImageData(0,0,W,120).data, pts=[];
  for(let y=0;y<120;y+=3)for(let x=0;x<W;x+=3) if(d[(y*W+x)*4+3]>140) pts.push([x,1500+y]);
  let s=99; const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  const cols=NEON.colors;
  END=pts.map(p=>{const a=r()*Math.PI*2; return {tx:p[0],ty:p[1],sx:540+Math.cos(a)*900,sy:1000+Math.sin(a)*1300,dl:r(),c:cols[Math.floor(r()*cols.length)],od:Math.atan2(p[1]-1560,p[0]-540)+(r()-0.5)*1.2};});
}
function endLogo(ctx,t){
  const in0=37.6, form=38.6, out0=39.2; if(t<in0) return; if(!END) buildEnd();
  const hold=seg(t,form-0.1,form+0.25)*(1-seg(t,out0,out0+0.2));
  if(hold>0.02){ ctx.save(); cube(ctx,540-128,1560-22,44,'#2BE08A',0.9*hold); ctx.globalAlpha=0.9*hold; ctx.fillStyle='#2BE08A'; ctx.font=`900 36px ${SANS}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('老杨魔方',540-70,1561); ctx.restore(); }
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const p of END){ let x,y,a;
    if(t<out0){ const k=eo3(seg(t,in0+p.dl*0.4,in0+p.dl*0.4+0.7)); if(k<=0) continue; x=lerp(p.sx,p.tx,k); y=lerp(p.sy,p.ty,k); a=(1-hold)*Math.min(1,k*2); }
    else { const q=eo3(seg(t,out0+p.dl*0.2,out0+p.dl*0.2+0.7)); if(q>=1) continue; x=p.tx+Math.cos(p.od)*q*420; y=p.ty+Math.sin(p.od)*q*420; a=1-q; }
    ctx.fillStyle=`rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a})`; ctx.fillRect(x-1.5,y-1.5,3,3); }
  ctx.restore();
}
function renderB(ctx,t){
  const f=Math.round(t*FPS);
  bgFill(ctx);
  // 16–24：一团分成多团，人越加越多、核越来越暗
  if(t<24.3){ const n=clusters(ctx,t,f,1-seg(t,23.6,24.3));
    const ca=seg(t,16.2,16.6)*(1-seg(t,23.5,23.9));
    if(ca>0){ band(ctx,500,120,ca); txt(ctx,`人手 ×${n}`,540,470,64,'#2BE08A',ca,900,'rgba(43,224,138,0.5)'); txt(ctx,'产出 ×1',540,548,40,'rgba(244,246,242,0.6)',ca,700); }
    const cp=seg(t,16.4,16.7)*(1-seg(t,23.5,23.9)); if(cp>0){ const pop=1-eo3(seg(t,16.4,16.75)); band(ctx,1600,110,cp); txt(ctx,'人越加越多',540,1572+pop*14,62,'#2BE08A',cp); txt(ctx,'要做的事，一点没多',540,1638+pop*14,38,'#F4F6F2',cp,700); }
  }
  // 24–30：数据段，背后一团淡雾
  if(t>=23.8&&t<30.4){ mistAt(ctx,f,7,540,960,1.3,0.6,0.3*seg(t,23.8,24.6)*(t<30?1:1-seg(t,30,30.4))); dataPanel(ctx,t);
    const cp=seg(t,28.3,28.6)*(1-seg(t,29.6,29.9)); if(cp>0){ band(ctx,1600,110,cp); txt(ctx,'事少了',540,1572,62,'#F5A623',cp); txt(ctx,'管事的人，反而多了',540,1638,38,'#F4F6F2',cp,700); } }
  // 30–40：被框住、吸成核、在边界里炸亮
  if(t>=30){
    let sc, al;
    if(t<31.5){ sc=lerp(1.3,0.32,ein(seg(t,30,31.5))); al=lerp(0.3,1,seg(t,30,30.8)); }
    else if(t<32){ sc=0.32; al=1; } else { sc=lerp(0.32,0.62,eo3(seg(t,32,32.8))); al=1-0.4*seg(t,39.2,40); }
    const DIM2={960:0.72,961:0.6,962:0.66,963:0.74,964:0.94};
    mistAt(ctx,f,7,540,1000,sc,1,al*(DIM2[f]??1));
    boxB(ctx,t);
    const gap=seg(t,31.35,31.6)*(1-seg(t,31.98,32)); if(gap>0){ ctx.fillStyle=`rgba(0,0,0,${0.35*gap})`; ctx.fillRect(0,0,W,H); }
    const qa=seg(t,32.3,32.6)*(1-seg(t,35.7,36.0));
    if(qa>0){ const sc2=1+0.2*(1-eo3(seg(t,32.3,32.7))); ctx.save(); ctx.translate(540,520); ctx.scale(sc2,sc2); ctx.translate(-540,-520);
      txt(ctx,'管理者真正要给的',540,470,56,'#F4F6F2',qa); txt(ctx,'不是时间，是边界',540,572,82,'#2BE08A',qa,900,'rgba(43,224,138,0.7)'); ctx.restore(); }
    const qb=seg(t,36.0,36.4);
    if(qb>0){ txt(ctx,'你最近拖得最久的一件事',540,470,54,'#F4F6F2',qb); txt(ctx,'是什么？',540,572,82,'#F5A623',qb,900,'rgba(245,166,35,0.6)'); }
    endLogo(ctx,t);
  }
  topIP(ctx);
}
const XC=document.createElement('canvas'); XC.width=W; XC.height=H;
function render(ctx,t){
  if(t<16) return renderA(ctx,t);
  renderB(ctx,t);
  const k=1-seg(t,16,16.35); // 分裂开头和上一段交叉淡化，避免硬切跳亮
  if(k>0){ renderA(XC.getContext('2d'),t); ctx.save(); ctx.globalAlpha=k; ctx.drawImage(XC,0,0); ctx.restore(); }
}
window.__ep={render,DUR:40};
