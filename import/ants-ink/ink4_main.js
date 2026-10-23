// ── 真实模拟的四窝蚂蚁 ──
const T={take:10.0,refill:[11.0,14.6],clear:18.0,split:23.0,tire:[24.6,28.6],back:30.0,seal:31.0,ask:36.0};
const P_MAIN=[[860,500],[620,520],[960,1080],[310,1390]];
const P_LEFT=[[300,700],[180,860],[400,1200],[260,1460]], P_RIGHT=[[800,700],[680,860],[900,1200],[760,1460]];
const MAIN=simulate({seed:31,P:P_MAIN,scale:1,nFor:360,nIdle:240,idleSX:62,idleSY:42,t0:-16,rec0:-1.5,t1:23.6,events:{}});
const WASH_MAIN=nestWash(P_MAIN[3][0],P_MAIN[3][1],1,32);

// 一只真实步态的蚂蚁：三足交替（左前、右中、左后一组），触角左右探
function antReal(ctx,x,y,ang,s,col,alpha,leg,antp){ if(alpha<=0.005) return;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(s,s); ctx.globalAlpha=alpha; ctx.fillStyle=col; ctx.strokeStyle=col;
  ctx.beginPath(); ctx.ellipse(6.3,0,2.4,2.1,0,0,6.29); ctx.fill(); ctx.beginPath(); ctx.ellipse(1.6,0,3.0,1.45,0,0,6.29); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-1.7,0,0.9,0.85,0,0,6.29); ctx.fill(); ctx.beginPath(); ctx.ellipse(-6.0,0,4.5,3.2,0,0,6.29); ctx.fill();
  ctx.globalAlpha=alpha*0.85; ctx.lineWidth=0.6; ctx.lineCap='round'; ctx.beginPath();
  const base=[[2.8,1.0],[1.6,1.1],[0.4,1.0]], knee=[[5.6,4.4],[1.4,4.8],[-2.6,4.4]], foot=[[8.6,7.6],[0.8,8.4],[-6.4,7.4]];
  for(let i=0;i<3;i++) for(const sd of [-1,1]){ const grp=((i%2===0)===(sd<0))?0:Math.PI, sw=Math.sin(leg+grp), lift=Math.max(0,Math.cos(leg+grp));
    const fx=foot[i][0]+sw*2.2, fy=sd*(foot[i][1]-lift*0.8), kx=knee[i][0]+sw*1.0, ky=sd*(knee[i][1]+lift*0.3);
    ctx.moveTo(base[i][0],sd*base[i][1]); ctx.lineTo(kx,ky); ctx.lineTo(fx,fy); }
  for(const sd of [-1,1]){ const sw=Math.sin(antp*(sd>0?1:1.13)+(sd>0?0:1.7))*0.35; const ex=10.4,ey=sd*2.4;
    ctx.moveTo(8.0,sd*0.9); ctx.lineTo(ex,ey); ctx.lineTo(ex+3.6*Math.cos(sd*0.15+sw),ey+3.6*Math.sin(sd*0.15+sw)); }
  ctx.stroke(); ctx.restore();}
function drawSim(ctx,sim,t,opt={}){ const o0=simFrame(sim,t), D=sim.out, S=sim.scale, alpha=opt.alpha??1, idleBase=opt.idleInk??0.24;
  for(let i=0;i<sim.N;i++){ if(opt.skip&&opt.skip.has(i)) continue; const o=o0+i*sim.STR, x=D[o],y=D[o+1],ang=D[o+2],leg=D[o+3],kind=D[o+4],rem=D[o+5],carry=D[o+6],u=D[o+7],antp=D[o+8];
    if(rem>=1) continue;
    const active=u>=0, act=0.16+0.8*Math.pow(clamp(active?u:1,0,1),1.5), idle=idleBase+((i*37)%11)/11*0.12;
    let ink=kind<0?act*(0.12+0.88*(-kind)):(active?lerp(idle,act,clamp(kind,0,1)):idle);
    if(rem>=0){ const rr=(6+rem*34)*S, a=ink*(1-rem)*0.5*alpha, yy=y-rem*130*S; const g=ctx.createRadialGradient(x,yy,0,x,yy,rr); g.addColorStop(0,`rgba(21,17,13,${a})`); g.addColorStop(1,'rgba(21,17,13,0)'); ctx.fillStyle=g; ctx.fillRect(x-rr,yy-rr,rr*2,rr*2); continue; }
    const sc=1.75*S*(0.94+((i*53)%13)/13*0.12);
    antReal(ctx,x,y,ang,sc,INK,ink*alpha,leg,antp);
    if(carry>0.5){ ctx.save(); ctx.globalAlpha=alpha*0.45*ink; ctx.fillStyle='#9a3a2c'; ctx.beginPath(); ctx.arc(x+Math.cos(ang)*11.5*sc,y+Math.sin(ang)*11.5*sc,1.0*sc,0,6.29); ctx.fill(); ctx.restore(); } } }
function foodAt(ctx,P,s,a){ if(a<=0) return; const r=rng(9),[fx,fy]=P[0]; for(let i=0;i<10;i++){ const ang=r()*6.28,d=r()*18*s; ctx.fillStyle=`rgba(196,32,38,${(0.55+r()*0.4)*a})`; ctx.beginPath(); ctx.arc(fx+Math.cos(ang)*d,fy+Math.sin(ang)*d,(2+r()*3.5)*s,0,6.29); ctx.fill(); } }
const ZM=9.5; function zoomAt(t){ return 1+(ZM-1)*(1-eio(seg(t,1.4,4.4)))-0.3*seg(t,0,1.4); }

// ── 方阵（无限画布）：蚂蚁从自然队伍里走出来，在左侧留白排成 13×20 的大方阵；镜头推进，方阵铺满整屏 ──
// 前 12 排浓墨（干活的，六成），后 8 排淡墨（闲着的，四成）。动作都按「走过去」计算；列队行进时全体同步踏步（每秒 4 步，对齐鼓点）。
const FM={cx:275,cy:700,cols:13,rows:20,sx:36,sy:46,s:1.75,assemble:[5.8,9.4],take:10.0,close:[11.0,12.6],act:[11.6,13.2],clear:18.0,
  zin:[7.2,9.7],zout:[19.9,22.0],Z:2.38};
const STEP_HZ=2;
const smooth=x=>x*x*(3-2*x);
function slotXY(r,c){ return [FM.cx+(c-(FM.cols-1)/2)*FM.sx, FM.cy+(r-(FM.rows-1)/2)*FM.sy]; }
function angLerp(a,b,k){ let d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI; return a+d*k; }
function walkPath(p0,p1,c,k){ const q=(1-k)*(1-k),w=2*k*(1-k),e=k*k;
  const x=q*p0[0]+w*c[0]+e*p1[0], y=q*p0[1]+w*c[1]+e*p1[1];
  const dx=2*(1-k)*(c[0]-p0[0])+2*k*(p1[0]-c[0]), dy=2*(1-k)*(c[1]-p0[1])+2*k*(p1[1]-c[1]);
  const L=Math.hypot(c[0]-p0[0],c[1]-p0[1])+Math.hypot(p1[0]-c[0],p1[1]-c[1]);
  return [x,y,Math.atan2(dy,dx),L*k];}
const DARK_ROWS=12;
const FORM=(()=>{ const t0=FM.assemble[0], o0=simFrame(MAIN,t0), D=MAIN.out, used=new Set(), list=[], r=rng(61);
  const pos=i=>[D[o0+i*MAIN.STR],D[o0+i*MAIN.STR+1],D[o0+i*MAIN.STR+2],D[o0+i*MAIN.STR+3]];
  const isF=i=>D[o0+i*MAIN.STR+7]>=0;
  const slots=[]; for(let rr=0;rr<FM.rows;rr++) for(let c=0;c<FM.cols;c++) slots.push([rr,c]);
  slots.sort((a,b)=>{ const pa=slotXY(...a), pb=slotXY(...b); return (pa[0]-pa[1]*0.3)-(pb[0]-pb[1]*0.3); }).reverse();
  for(const [rr,c] of slots){ const want=rr<DARK_ROWS, [sx,sy]=slotXY(rr,c); let best=-1,bd=1e18;
    for(let i=0;i<MAIN.N;i++){ if(used.has(i)||isF(i)!==want) continue; const p=pos(i); const d=(p[0]-sx)**2+(p[1]-sy)**2; if(d<bd){bd=d;best=i;} }
    used.add(best); const p=pos(best), dist=Math.sqrt(bd), speed=300+r()*70, st=t0+r()*0.5, dur=Math.max(0.7,dist/speed);
    const mx=(p[0]+sx)/2, my=(p[1]+sy)/2, nx=-(sy-p[1])/(dist||1), ny=(sx-p[0])/(dist||1), bend=gauss(r)*0.15*dist;
    list.push({i:best,r:rr,c,p0:p,ctrl:[mx+nx*bend,my+ny*bend],st,dur,dark:want,ph:r()*6.28,s:FM.s*(0.96+r()*0.08)}); }
  return {list,used}; })();
function formAnt(a,t){
  const [sx,sy]=slotXY(a.r,a.c), up=-Math.PI/2, sync=t*2*Math.PI*STEP_HZ;
  const inkDark=0.9, inkPale=0.26; let ink=a.dark?inkDark:inkPale;
  if(!a.dark&&a.r<16) ink=lerp(inkPale,inkDark,smooth(seg(t,FM.act[0]+(a.c%13)*0.03,FM.act[1])));
  const ka=seg(t,a.st,a.st+a.dur);
  if(ka<1){ const kk=smooth(ka); const [x,y,ang,dist]=walkPath(a.p0,[sx,sy],a.ctrl,kk);
    return [x,y,ka<=0?a.p0[2]:ang,a.p0[3]+dist/(7*a.s)*Math.PI,a.dark?lerp(0.6,inkDark,kk):inkPale]; }
  let x=sx,y=sy,ang=angLerp(walkPath(a.p0,[sx,sy],a.ctrl,0.999)[2],up,smooth(seg(t,a.st+a.dur,a.st+a.dur+0.35))), leg=a.ph;
  if(t>=a.st+a.dur+0.35&&t<FM.take) leg=sync; // 原地踏步
  if(a.r<4&&t>=FM.take){ const tt=t-FM.take-a.r*0.1; if(tt>0){ const v=170, d=v*Math.max(0,tt-0.15)+v*0.075*Math.min(1,tt/0.15); y=sy-d; leg=sync; ang=up; if(y<-400) return null; } }
  if(a.r>=4){ const k=smooth(seg(t,FM.close[0],FM.close[1])); y=sy-4*FM.sy*k; if(k>0&&k<1) leg=sync; }
  if(a.r>=16&&t>=FM.clear){ const k=smooth(seg(t,FM.clear,FM.clear+0.45)); ang=angLerp(up,Math.PI/2,k); leg=sync;
    if(t>FM.clear+0.45){ const d=170*(t-FM.clear-0.45); y+=d; if(y>2300) return null; } }
  if(leg===a.ph) ang+=Math.sin(t*1.3+a.ph)*0.04;
  return [x,y,ang,leg,ink];}
function drawForm(ctx,t,alpha){ for(const a of FORM.list){ const f=formAnt(a,t); if(!f) continue;
  antReal(ctx,f[0],f[1],f[2],a.s,INK,f[4]*alpha,f[3],t*5+a.ph); } }
// 镜头（无限画布）：返回 [Z, 世界焦点 x, y]
function camera(t){ const F=[FM.cx,FM.cy], C=[540,960];
  const kin=smooth(seg(t,FM.zin[0],FM.zin[1])), kout=smooth(seg(t,FM.zout[0],FM.zout[1]));
  const k=kin*(1-kout), Z=lerp(1,FM.Z,k)+0.12*k*seg(t,FM.zin[1],FM.zout[0]);
  return [Z,lerp(C[0],F[0],k),lerp(C[1],F[1],k)]; }

// ── 分屏：两支军队铺满整屏，中间留一道窄缝放题字 ──
const SPF={cols:5,rows:18,sx:92,sy:104,s:3.0,enter:[22.8,24.4],tire:[24.8,28.6]};
function makeSplit(cx,cy,hasIdle,seed){ const r=rng(seed), L=[];
  for(let rr=0;rr<SPF.rows;rr++) for(let c=0;c<SPF.cols;c++){ const dark=!hasIdle||rr<11;
    L.push({r:rr,c,x:cx+(c-(SPF.cols-1)/2)*SPF.sx,y:cy+(rr-(SPF.rows-1)/2)*SPF.sy,dark,tire:1e9,swap:null,ph:r()*6.28,s:SPF.s*(0.96+r()*0.08),jit:[gauss(r),gauss(r),gauss(r)]}); }
  const darks=L.filter(a=>a.dark); darks.forEach(a=>{a.tire=SPF.tire[0]+r()*(SPF.tire[1]-SPF.tire[0]);});
  if(hasIdle){ const pales=L.filter(a=>!a.dark), order=darks.slice().sort((p,q)=>p.tire-q.tire);
    order.forEach((d,k)=>{ if(k<pales.length){ d.swap=pales[pales.length-1-((k*7)%pales.length)]; } else d.tire=1e9; });
    const seen=new Set(); order.forEach(d=>{ if(d.swap){ if(seen.has(d.swap)){ d.swap=null; d.tire=1e9; } else { seen.add(d.swap); d.swap.swapWith=d; d.swap.goT=d.tire+0.25; } } }); }
  return {L}; }
const SPL=makeSplit(255,980,false,71), SPR=makeSplit(825,980,true,73);
function splitAnt(S,a,t){ const up=-Math.PI/2, sync=t*2*Math.PI*STEP_HZ;
  const enterD=(1-smooth(seg(t,SPF.enter[0]+a.r*0.03,SPF.enter[1])))*2000;
  let x=a.x,y=a.y+enterD,ang=up,leg=sync,ink=a.dark?0.9:0.26;
  if(a.dark&&t>=a.tire){ const k=smooth(seg(t,a.tire,a.tire+0.9));
    if(a.swap){ const k2=smooth(seg(t,a.tire+0.25,a.tire+1.5)); const [x2,y2,ang2,dd]=walkPath([a.x,a.y],[a.swap.x,a.swap.y],[a.x+60,(a.y+a.swap.y)/2],k2);
      x=x2; y=y2; ang=k2>0&&k2<1?ang2:up; leg=k2>0&&k2<1?a.ph+dd/(7*a.s)*Math.PI:a.ph; ink=lerp(0.9,0.3,k); }
    else { x+=a.jit[0]*26*k; y+=a.jit[1]*20*k; ang=up+a.jit[2]*0.9*k; leg=a.ph; ink=lerp(0.9,0.18,k); } }
  if(!a.dark&&a.swapWith&&t>=a.goT){ const d=a.swapWith, k2=smooth(seg(t,a.goT,a.goT+1.25)); const [x2,y2,ang2,dd]=walkPath([a.x,a.y],[d.x,d.y],[a.x-60,(a.y+d.y)/2],k2);
    x=x2; y=y2; ang=k2<1?ang2:up; leg=k2<1?a.ph+dd/(7*a.s)*Math.PI:sync; ink=lerp(0.26,0.9,k2); }
  return [x,y,ang,leg,ink];}
function drawSplit(ctx,t,alpha){ for(const S of [SPL,SPR]) for(const a of S.L){ const f=splitAnt(S,a,t); if(f[1]>H+80) continue; antReal(ctx,f[0],f[1],f[2],a.s,INK,f[4]*alpha,f[3],t*5+a.ph); } }
// 题签：纸色衬底，让字压在密集的蚁阵上也看得清
function strip(ctx,x,y,w,h,a){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a*0.92; ctx.shadowColor='rgba(60,45,30,0.25)'; ctx.shadowBlur=18; ctx.fillStyle='#f3efe6'; ctx.fillRect(x,y,w,h); ctx.restore(); }

// 片尾署名：墨点聚成 logo 再散开
let END=null;
function buildEnd(){ const c=document.createElement('canvas'); c.width=W; c.height=120; const g=c.getContext('2d');
  g.translate(0,-1730); g.save(); g.translate(540-128,1790-22); g.scale(44/120,44/120); g.strokeStyle='#000'; g.lineWidth=12; for(const p of CUBEP){g.beginPath();p.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.stroke();} g.restore(); g.setTransform(1,0,0,1,0,0);
  g.fillStyle='#000'; g.font=`900 36px ${SANS}`; g.textAlign='left'; g.textBaseline='middle'; g.fillText('老杨魔方',540-70,61);
  const d=g.getImageData(0,0,W,120).data, pts=[]; for(let y=0;y<120;y+=3)for(let x=0;x<W;x+=3) if(d[(y*W+x)*4+3]>140) pts.push([x,1730+y]);
  const r=rng(99); END=pts.map(p=>{const a=r()*6.28; return {tx:p[0],ty:p[1],sx:540+Math.cos(a)*900,sy:1200+Math.sin(a)*1300,dl:r(),red:r()<0.08,od:Math.atan2(p[1]-1790,p[0]-540)+(r()-0.5)*1.2};});}
function endLogo(ctx,t){ const in0=37.6, form=38.5, out0=39.1; if(t<in0) return; if(!END) buildEnd();
  const hold=seg(t,form-0.1,form+0.25)*(1-seg(t,out0,out0+0.2));
  if(hold>0.02){ ctx.save(); ctx.globalAlpha=0.85*hold; ctx.translate(540-128,1790-22); ctx.scale(44/120,44/120); ctx.strokeStyle='#0B5A2E'; ctx.lineWidth=12; for(const p of CUBEP){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();} ctx.restore();
    ctx.save(); ctx.globalAlpha=0.85*hold; ctx.fillStyle='#0B5A2E'; ctx.font=`900 36px ${SANS}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('老杨魔方',540-70,1791); ctx.restore(); }
  for(const p of END){ let x,y,a;
    if(t<out0){ const k=eo3(seg(t,in0+p.dl*0.4,in0+p.dl*0.4+0.7)); if(k<=0) continue; x=lerp(p.sx,p.tx,k); y=lerp(p.sy,p.ty,k); a=(1-hold)*Math.min(1,k*2); }
    else { const q=eo3(seg(t,out0+p.dl*0.2,out0+p.dl*0.2+0.6)); if(q>=1) continue; x=p.tx+Math.cos(p.od)*q*380; y=p.ty+Math.sin(p.od)*q*380; a=1-q; }
    ctx.fillStyle=p.red?`rgba(184,38,43,${a*0.9})`:`rgba(30,25,20,${a*0.7})`; ctx.fillRect(x-1.5,y-1.5,3,3); } }

function render(ctx,t){
  ctx.drawImage(PAPER,0,0);
  const mainA=1-seg(t,T.split-0.6,T.split+0.4)+seg(t,T.back-0.6,T.back+0.4);
  const formOn=t>=FM.assemble[0]&&t<T.back-0.6;
  if(mainA>0.01){ const tm=t<T.back-0.6?t:Math.max(-1.5,t-31.5); const idleInk=lerp(0.88,0.24,seg(t,2.6,6.0));
    ctx.save();
    if(t<4.5){ const Z=zoomAt(t), F=[P_MAIN[3][0],P_MAIN[3][1]-30], kz=(ZM-0.3-Z)/(ZM-1.3); if(Z>1.0001) ctx.setTransform(Z,0,0,Z,lerp(540,F[0],kz)-F[0]*Z,lerp(960,F[1],kz)-F[1]*Z); }
    else if(formOn){ const [Z,fx,fy]=camera(t); ctx.setTransform(Z,0,0,Z,540-fx*Z,960-fy*Z); }
    ctx.globalAlpha=Math.min(1,mainA)*seg(t,2.0,4.4); ctx.drawImage(WASH_MAIN,0,0); ctx.globalAlpha=1;
    drawSim(ctx,MAIN,tm,{alpha:Math.min(1,mainA),idleInk:t<T.back-0.6?idleInk:0.24,skip:formOn?FORM.used:null}); foodAt(ctx,P_MAIN,1,Math.min(1,mainA));
    if(formOn) drawForm(ctx,t,Math.min(1,mainA));
    ctx.restore(); }
  const splitA=seg(t,T.split-0.2,T.split+0.8)*(1-seg(t,T.back-0.8,T.back+0.2));
  if(splitA>0.01) drawSplit(ctx,t,splitA);
  // 镜头推近方阵 / 分屏时，文字下垫题签
  const zk=formOn?smooth(seg(t,FM.zin[0]+0.8,FM.zin[1]))*(1-smooth(seg(t,FM.zout[0],FM.zout[0]+0.8))):0, sk2=Math.max(zk,splitA);
  strip(ctx,450,150,180,90,sk2); // logo
  const dk=1-seg(t,1.7,2.6); topIP(ctx,dk);
  const hc=Math.round(lerp(30,243,dk)), hcol=`rgb(${hc},${Math.round(lerp(26,239,dk))},${Math.round(lerp(21,230,dk))})`;
  ctx.save(); if(dk>0.3){ctx.shadowColor=`rgba(0,0,0,${0.8*dk})`;ctx.shadowBlur=14;} vtext(ctx,'为什么不开除它们？',960,420,56,hcol,win(t,-1,7.5)); ctx.restore();
  note(ctx,['蚁窝里，','四成工蚁几乎一直闲着。'],600,1560,'#5d564c',win(t,4.6,8.4));
  strip(ctx,920,360,80,470,zk*win(t,8.0,10.8)); vtext(ctx,'拿走最勤快的两成',960,420,52,'#1e1a15',win(t,8.0,10.8));
  strip(ctx,520,1500,480,150,zk*win(t,11.4,16.6)); note(ctx,['一周之内，空位被补上。','补上的，多是原来闲着的。'],560,1560,'#5d564c',win(t,11.4,16.6));
  strip(ctx,920,360,80,340,zk*win(t,16.6,18.6)); vtext(ctx,'再拿走闲着的',960,420,52,'#1e1a15',win(t,16.6,18.6));
  strip(ctx,520,1500,480,150,zk*win(t,18.8,22.6)); note(ctx,['没有谁去补。','空着，就一直空着。'],560,1560,'#5d564c',win(t,18.8,22.6));
  vtext(ctx,'可要是都累了呢？',540,380,48,'#1e1a15',win(t,23.6,29.6));
  strip(ctx,70,1835,370,50,splitA); strip(ctx,640,1835,370,50,splitA);
  note(ctx,['全员在岗'],195,1860,'#3d362e',splitA,28); note(ctx,['留着闲的'],765,1860,'#3d362e',splitA,28);
  vtext(ctx,'有闲着的，才接得上。',540,1060,40,'#3d362e',win(t,26.6,29.6));
  note(ctx,['平时闲着，','出事顶上。'],600,1560,'#5d564c',win(t,32.0,35.8));
  vtext(ctx,'你的公司，留后备了吗？',960,380,52,'#1e1a15',win(t,36.0,40.5));
  const sk=1+0.35*(1-eo3(seg(t,T.seal,T.seal+0.35))); seal(ctx,600,1690,64,'后备',seg(t,T.seal,T.seal+0.12)*(1-seg(t,37.3,37.6)),sk);
  if(t<T.split-0.6){ strip(ctx,540,1812,520,36,zk*win(t,10.4,22.6)); note(ctx,['Charbonneau, Sasaki & Dornhaus · PLOS ONE 2017'],560,1830,'#8a8276',win(t,10.4,22.6),17); }
  strip(ctx,410,1770,260,30,splitA*win(t,25,29.6)); note(ctx,['Hasegawa et al. · Sci Rep 2016'],420,1785,'#8a8276',win(t,25,29.6),16);
  endLogo(ctx,t);
}
window.__ep={render,DUR};
