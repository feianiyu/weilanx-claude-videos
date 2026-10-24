// 《步天规》纯音乐 MV（无字幕、无品牌字）。画面 = 时间 t 的纯函数；所有随机用 rng(seed)。
// 段落卡在原曲实测的进入点上：
//  0  前奏   光斑→海面→星空→北斗→北极星→片名
//  1  21.86 星轨：天空绕北极星转（长曝光）
//  2  37.19 规：圆规画出内规、赤道、外规，二十八宿按真实距度分野
//  3  68.44 式盘：方的地盘、圆的天盘分层合上，天盘错拍转动
//  4  96.80 穿越：一声重拍，穿过星海
//  5  121.16 一年：北斗绕北极星转一整圈，斗柄指东南西北
//  6  150.57 汇聚：满天星尘飞回来，拼成一张圆星图
//  7  162.59 高潮：星图、浑仪环、万花筒、扫光、流星
//  8  208.34 碎裂：星图碎成星尘
//  9  216.73 归海：回到海面
//  10 227.60 尾声：低头看海，碎光重新变成光斑，片名
const W=1080,H=1920,FPS=30,DUR=238.7;
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const lerp=(a,b,k)=>a+(b-a)*k, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), P=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo3=x=>1-Math.pow(1-x,3), eIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, ein=x=>x*x*x, sm=x=>x*x*(3-2*x), eo5=x=>1-Math.pow(1-x,5);
const backIn=(x,s=1.2)=>x*x*((s+1)*x-s), backOut=(x,s=1.7)=>1+(s+1)*Math.pow(x-1,3)+s*Math.pow(x-1,2);
const gauss=r=>{let u=0;for(let i=0;i<4;i++)u+=r();return (u-2)/0.58;};
const win=(t,a,b,f=0.7)=>P(t,a,a+f)*(1-P(t,b-f,b));
const HZ=1240, TAU=Math.PI*2;
const DISPLAY='"QingKe","Noto Sans SC",sans-serif';
const GOLD=[255,214,150], WARM=[255,236,200], WHITE=[255,255,255], COOL=[230,240,255], TIP=[255,226,160];
const A={focus:[6.59,8.19],tilt:[8.4,11.3],light:13.24,draw:[14.22,15.77],ext:[16.1,17.65],circle:[17.7,18.3],title:18.6,
  s1:21.86,s2:37.19,eq:41.04,out:43.4,ecl:51.92,p1:56.69,p2:60.71,dip1:62.54,s3:68.44,s4:96.8,s5:121.16,dip2:147.74,s6:150.57,s7:162.59,s8:208.34,s9:216.73,s10:227.6};

// ───────── 发光贴图（代替逐个径向渐变，快很多）─────────
const SPR={};
function sprite(col){ const k=col.join(','); if(SPR[k]) return SPR[k]; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,`rgba(${k},1)`); gr.addColorStop(0.25,`rgba(${k},0.35)`); gr.addColorStop(1,`rgba(${k},0)`); g.fillStyle=gr; g.fillRect(0,0,64,64); return SPR[k]=c; }
function glow(ctx,x,y,r,col,a){ if(a<=0.004||r<=0.3) return; ctx.globalAlpha=Math.min(1,a); ctx.drawImage(sprite(col),x-r,y-r,2*r,2*r); ctx.globalAlpha=1; }
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${clamp(a,0,1)})`;

// ───────── 天空：所有星以北极星为原点保存，便于整体旋转 ─────────
const POL0=[420,400];
const STARS=(()=>{const r=rng(11),s=[];
  for(let i=0;i<2600;i++){ let x,y; if(r()<0.55){ const k=r(); x=lerp(-100,1180,k)+gauss(r)*110; y=lerp(150,1050,k)+gauss(r)*140; } else { x=r()*W; y=r()*(HZ-30); }
    if(y>HZ-6||y<0) continue; const m=Math.pow(r(),5); s.push({dx:x-POL0[0],dy:y-POL0[1],b:0.15+m*0.85,rad:0.5+m*2.2,ph:r()*6.28,f:0.5+r()*2.5,col:r()<0.15?[255,220,190]:(r()<0.3?[190,210,255]:[235,240,255])}); }
  // 旋转后会露出原画框外的天空：再补一圈稀疏的星
  for(let i=0;i<2200;i++){ const a=r()*TAU, d=Math.sqrt(r())*1900; const dx=Math.cos(a)*d, dy=Math.sin(a)*d; const x=dx+POL0[0], y=dy+POL0[1]; if(x>-10&&x<W+10&&y>-10&&y<HZ) continue;
    const m=Math.pow(r(),5); s.push({dx,dy,b:0.15+m*0.85,rad:0.5+m*2.2,ph:r()*6.28,f:0.5+r()*2.5,col:r()<0.15?[255,220,190]:(r()<0.3?[190,210,255]:[235,240,255])}); }
  return s;})();
// 银河：半分辨率预渲染，以北极星为中心，可旋转
const MW=(()=>{const c=document.createElement('canvas');c.width=c.height=1800;const g=c.getContext('2d'),r=rng(3);
  for(let i=0;i<1700;i++){ const k=lerp(-0.7,1.7,r()), x=lerp(-100,1180,k)+gauss(r)*90, y=lerp(150,1050,k)+gauss(r)*120; const rad=20+r()*70;
    const cx=(x-POL0[0])/2+900, cy=(y-POL0[1])/2+900, rr=rad/2; const gg=g.createRadialGradient(cx,cy,0,cx,cy,rr);
    gg.addColorStop(0,`rgba(${150+r()*60|0},${160+r()*50|0},${200+r()*40|0},${0.012+r()*0.02})`); gg.addColorStop(1,'rgba(120,140,190,0)'); g.fillStyle=gg; g.fillRect(cx-rr,cy-rr,rr*2,rr*2); }
  return c;})();
// 北斗七星（真实赤经赤纬投影）：天枢、天璇、天玑、天权、玉衡、开阳、摇光
const BD=[[11.062,61.75],[11.031,56.38],[11.897,53.69],[12.257,57.03],[12.900,55.96],[13.399,54.93],[13.792,49.31]];
const DREL=(()=>{ const cd=Math.cos(55*Math.PI/180), s=17; const raw=BD.map(([ra,dec])=>[-(ra*15)*cd*s,-dec*s]);
  const v=[raw[0][0]-raw[1][0],raw[0][1]-raw[1][1]], want=-115*Math.PI/180, rot=want-Math.atan2(v[1],v[0]);
  const R=p=>[p[0]*Math.cos(rot)-p[1]*Math.sin(rot),p[0]*Math.sin(rot)+p[1]*Math.cos(rot)];
  const pts=raw.map(R), d=R(v), pol=[pts[0][0]+d[0]*5,pts[0][1]+d[1]*5];
  return pts.map(p=>[p[0]-pol[0],p[1]-pol[1]]); })();
const ORDER=[6,5,4,3,2,1,0,3];

// ───────── 天球转动：角速度分段积分（逆时针 = 北天真实方向）─────────
function omega(t){ if(t<A.s1) return 0; if(t<A.s2) return 0.06*sm(P(t,A.s1,23.5)); if(t<A.s9) return lerp(0.06,0.012,sm(P(t,A.s2,40))); return 0.006; }
const ROTC=(()=>{const n=Math.ceil((DUR+1)*120), a=new Float64Array(n+1); for(let i=1;i<=n;i++) a[i]=a[i-1]+omega((i-0.5)/120)/120; return a;})();
const cum=t=>{ const x=clamp(t,0,DUR+1)*120, i=Math.floor(x); return ROTC[i]+(ROTC[Math.min(i+1,ROTC.length-1)]-ROTC[i])*(x-i); };
// 第 5 段要让斗柄在 122 秒正好指向右（东）。这次跳转藏在穿越段（天空不可见）里。
const YEAR=[122.0,146.8];
const JUMP=(()=>{ const a0=Math.atan2(DREL[6][1]-DREL[3][1],DREL[6][0]-DREL[3][0]); return -a0+cum(YEAR[0]); })();
function rotAt(t){ return -cum(t)+(t>=108?JUMP:0)-TAU*eIO(P(t,YEAR[0],YEAR[1])); }

// ───────── 机位：北极星在屏幕上的位置 px,py 与缩放 s；海平线 hz = py + 840·s ─────────
const KEYS=[[21.86,420,400,1],[25.6,540,760,1],[66.9,540,760,1],[68.44,540,960,1],[97.4,540,960,1.18],[97.9,540,820,0.68],[147.74,540,820,0.68],[154.5,540,960,1],[162.59,540,960,1],[208.34,540,960,1.28],[211.5,540,960,1.28],[218.5,540,560,1],[228.4,540,560,1],[233.6,540,-1300,1],[DUR+1,540,-1300,1]];
function camY0(t){ return 1700*(1-eIO(P(t,A.tilt[0],A.tilt[1]))); }
function cam(t){ let px,py,s;
  if(t<KEYS[0][0]){ px=420; py=400-camY0(t); s=1; }
  else { let i=0; while(i<KEYS.length-2&&t>=KEYS[i+1][0]) i++; const a=KEYS[i],b=KEYS[i+1], k=eIO(P(t,a[0],b[0])); px=lerp(a[1],b[1],k); py=lerp(a[2],b[2],k); s=lerp(a[3],b[3],k); }
  s*=1+0.05*Math.exp(-Math.pow((t-192.95)/0.5,2)); // #028 高潮的一下推近
  return {px,py,s,rot:rotAt(t),hz:py+840*s}; }
const sky=(c,dx,dy)=>{ const co=Math.cos(c.rot), si=Math.sin(c.rot); return [c.px+c.s*(dx*co-dy*si), c.py+c.s*(dx*si+dy*co)]; };

// 星空的整体亮度
function skyA(t){ let a=1; a*=1-0.55*sm(P(t,A.dip1,64.5))*(1-sm(P(t,A.s3,70))); a*=t>=A.s3?0.55:1;
  if(t>=A.s4-0.6&&t<121.3) a*=1-P(t,96.2,96.8)*(1-sm(P(t,118.8,121.2)));
  if(t>=121.3) a=1; if(t>=A.dip2) a*=1-0.4*sm(P(t,A.dip2,149.5))*(1-sm(P(t,A.s6,152.5)));
  if(t>=A.s7) a*=0.8; if(t>=A.s8) a*=(1-0.6*sm(P(t,209,212.5)))+0.6*sm(P(t,213.5,218.2))+0.25*sm(P(t,216,219));
  if(t>=233) a*=1-sm(P(t,233,236.5));
  return a; }

function drawSky(ctx,t,c,a,trail){ const hz=c.hz; if(hz<-20) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,Math.min(H,hz)); ctx.clip();
  const g=ctx.createLinearGradient(0,hz-HZ,0,hz); g.addColorStop(0,'#03050b'); g.addColorStop(0.6,'#071022'); g.addColorStop(1,'#0e1c33'); ctx.fillStyle=g; ctx.fillRect(0,0,W,hz);
  if(a>0.01){ ctx.globalAlpha=a; ctx.translate(c.px,c.py); ctx.rotate(c.rot); ctx.scale(c.s*2,c.s*2); ctx.drawImage(MW,-900,-900); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1;
    ctx.globalCompositeOperation='lighter'; const co=Math.cos(c.rot), si=Math.sin(c.rot);
    if(trail>0.002){ ctx.lineCap='round';
      for(const s of STARS){ if(s.b<0.22) continue; const r=Math.hypot(s.dx,s.dy)*c.s, ang=Math.atan2(s.dy,s.dx)+c.rot; const x=c.px+r*Math.cos(ang), y=c.py+r*Math.sin(ang);
        if(r<2||y-r>hz||x+r<-50&&false) continue; if(Math.abs(x-540)>r+600&&Math.abs(y-960)>r+1100) continue;
        ctx.strokeStyle=rgba(s.col,a*s.b*0.55); ctx.lineWidth=Math.max(0.7,s.rad*0.8); ctx.beginPath(); ctx.arc(c.px,c.py,r,ang,ang+trail,false); ctx.stroke(); } }
    for(const s of STARS){ const x=c.px+c.s*(s.dx*co-s.dy*si), y=c.py+c.s*(s.dx*si+s.dy*co); if(x<-10||x>W+10||y<-10||y>hz) continue;
      const tw=0.75+0.25*Math.sin(t*s.f+s.ph), aa=s.b*tw*a;
      if(s.rad>1.4) glow(ctx,x,y,s.rad*4*Math.sqrt(c.s),s.col,aa); else { ctx.fillStyle=rgba(s.col,aa); ctx.fillRect(x-s.rad/2,y-s.rad/2,s.rad,s.rad); } }
    ctx.globalCompositeOperation='source-over'; }
  ctx.restore(); }

// ───────── 海 ─────────
const GLINT=(()=>{const r=rng(17);return Array.from({length:1900},()=>{const d=Math.pow(r(),0.45);return {u:r(),d,size:0.35+d*1.1+r()*0.3,ph:r()*6.28,f:1+r()*3,warm:r()<0.6,drift:8+r()*20};});})();
const seaY=d=>HZ+8+Math.pow(d,1.7)*2400;
function focusE(t){ return t<120? 1-eIO(P(t,A.focus[0],A.focus[1])) : eIO(P(t,230.0,231.9)); } // 1 = 失焦光斑, 0 = 碎光
const WAVES=(()=>{const r=rng(41);return Array.from({length:420},()=>({d:Math.pow(r(),1.2),l:r(),u:r(),sg:r()<0.5?1:-1,br:r(),}));})();
function drawSea(ctx,t,c,dipA){ const hz=c.hz; if(hz>H+30) return; const oy=HZ-hz;
  const sea=ctx.createLinearGradient(0,hz,0,hz+H); sea.addColorStop(0,'#0b1626'); sea.addColorStop(0.35,'#050a14'); sea.addColorStop(1,'#020306'); ctx.fillStyle=sea; ctx.fillRect(0,Math.max(0,hz),W,H);
  // 波纹
  ctx.save(); ctx.translate(0,-oy);
  WAVES.forEach((w,i)=>{ const d=w.d, y=seaY(d); if(y-oy<-20||y-oy>H+20) return; const len=(30+w.l*160)*(0.3+d*1.6), x0=((w.u*1.4-0.2)*W+t*(8+d*20)*w.sg+W*2)%(W*1.4)-W*0.2;
    const br=0.06+0.2*w.br*(0.4+0.6*d), wob=Math.sin(t*1.1+i)*2*(0.3+d);
    ctx.strokeStyle=`rgba(170,195,230,${br*(0.6+0.4*Math.sin(t*0.9+i*1.7))})`; ctx.lineWidth=0.6+d*2.2; ctx.beginPath(); ctx.moveTo(x0,y+wob); ctx.quadraticCurveTo(x0+len/2,y+wob-1.5-d*5,x0+len,y+wob); ctx.stroke(); });
  ctx.restore();
  // 倒影：北斗与亮星
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const items=[]; for(let i=0;i<STARS.length;i+=7){ const s=STARS[i]; if(s.b>0.6){ const [x,y]=sky(c,s.dx,s.dy); if(y<hz&&x>0&&x<W) items.push([x,y,s.b*0.25*skyA(t),s.col]); } }
  DREL.forEach(p=>{ const [x,y]=sky(c,p[0],p[1]); if(y<hz) items.push([x,y,dipA,[255,232,190]]); });
  for(const [x,y,b,col] of items){ if(b<=0.01) continue; const ry=hz+(hz-y)*0.18+20;
    for(let k=0;k<10;k++){ const yy=ry+k*14+Math.sin(t*2+k+x)*2, w=6+k*3, xx=x+Math.sin(t*1.7+k*1.3+x*0.01)*(3+k);
      ctx.fillStyle=rgba(col,b*0.25*(1-k/10)); ctx.fillRect(xx-w/2,yy,w,1.4); } }
  // 碎光（#105 光斑 ↔ #033 移焦）
  const e=focusE(t);
  for(const g of GLINT){ const y=seaY(g.d)-oy; if(y<hz-10||y>H+60) continue;
    const x=((g.u*W*1.3+t*g.drift*(0.4+g.d)+W*2)%(W*1.3))-W*0.15, tw=0.55+0.45*Math.sin(t*g.f+g.ph);
    const rad=(2.4+15*e*1.8)*g.size, a=lerp(1,0.55,e)*tw*(0.25+0.75*g.d)*(t>236?1-P(t,236,238.6):1);
    const col=g.warm?[lerp(160,255,e),lerp(195,199,e),lerp(235,90,e)]:[lerp(190,255,e),lerp(210,227,e),lerp(240,163,e)];
    if(e>0.05){ ctx.fillStyle=rgba(col,a*0.32); ctx.beginPath(); ctx.arc(x,y,rad,0,6.29); ctx.fill(); ctx.strokeStyle=`rgba(255,199,90,${a*0.35*e})`; ctx.lineWidth=1.2; ctx.stroke(); }
    else { const L=rad*(2.2+1.5*g.d); ctx.fillStyle=rgba(col,Math.min(1,a*1.4)); ctx.fillRect(x-L,y-0.8,L*2,1.6); if(tw>0.9) glow(ctx,x,y,rad*3,g.warm?[200,220,240]:[220,230,245],a*0.6); } }
  ctx.restore();
  const hl=ctx.createLinearGradient(0,0,W,0); hl.addColorStop(0,'rgba(150,180,220,0)'); hl.addColorStop(0.5,'rgba(170,195,230,0.25)'); hl.addColorStop(1,'rgba(150,180,220,0)'); ctx.strokeStyle=hl; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,hz); ctx.lineTo(W,hz); ctx.stroke(); }

// ───────── 通用：按长度裁切的折线（#004 描线），返回笔尖 ─────────
function strokeTrim(ctx,pts,k,col,w,dash,k0=0){ if(k<=k0) return null; const L=[0]; for(let i=1;i<pts.length;i++) L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  const T=L[L.length-1], a=T*k0, b=T*k; ctx.save(); ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineCap='round'; ctx.lineJoin='round'; if(dash) ctx.setLineDash(dash); ctx.beginPath(); let started=false, tip=null;
  const at=(i,f)=>[lerp(pts[i-1][0],pts[i][0],f),lerp(pts[i-1][1],pts[i][1],f)];
  for(let i=1;i<pts.length;i++){ const s0=L[i-1], s1=L[i]; if(s1<a||s0>b) continue; const p0=s0<a?at(i,(a-s0)/(s1-s0)):pts[i-1], p1=s1>b?at(i,(b-s0)/(s1-s0)):pts[i];
    if(!started){ ctx.moveTo(p0[0],p0[1]); started=true; } ctx.lineTo(p1[0],p1[1]); tip=p1; }
  ctx.stroke(); ctx.restore(); return tip; }
function tipGlow(ctx,tip,a=0.9,r=14){ if(!tip) return; ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,tip[0],tip[1],r,TIP,a); ctx.restore(); }
function dipperPts(c){ return DREL.map(p=>sky(c,p[0],p[1])); }
function drawDipperStars(ctx,c,a,boost=0){ if(a<=0.01) return; ctx.save(); ctx.globalCompositeOperation='lighter';
  dipperPts(c).forEach(p=>{ if(p[1]>c.hz) return; glow(ctx,p[0],p[1],(16+boost)*Math.sqrt(c.s),WARM,a); glow(ctx,p[0],p[1],2.5,WHITE,a); }); ctx.restore(); }

// ───────── 0 前奏 ─────────
function intro(ctx,t,c){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  dipperPts(c).forEach((p,i)=>{ const on=P(t,A.light+i*0.11,A.light+i*0.11+0.3), a=(0.55+0.45*on), pulse=1+0.6*Math.exp(-Math.pow((t-A.light-i*0.11-0.15)/0.18,2));
    glow(ctx,p[0],p[1],(9+on*7)*pulse,WARM,a); glow(ctx,p[0],p[1],2.5,WHITE,a); });
  const pol=P(t,A.ext[1]-0.2,A.ext[1]+0.3); glow(ctx,c.px,c.py,8+10*pol,COOL,0.5+0.5*pol); glow(ctx,c.px,c.py,2.4,WHITE,0.7+0.3*pol);
  ctx.restore();
  const fade=1-P(t,22.0,23.4); if(fade<=0) return;
  const D=dipperPts(c), k1=eIO(P(t,A.draw[0],A.draw[1]));
  const tip=strokeTrim(ctx,ORDER.map(i=>D[i]),k1,`rgba(255,222,172,${0.8*fade})`,1.7); if(k1<1) tipGlow(ctx,tip);
  const k2=eIO(P(t,A.ext[0],A.ext[1])), tip2=strokeTrim(ctx,[D[1],[c.px,c.py]],k2,`rgba(255,214,150,${0.7*fade})`,1.4,[6,9]); if(k2<1) tipGlow(ctx,tip2);
  const kc=eIO(P(t,A.circle[0],A.circle[1])); if(kc>0){ ctx.save(); ctx.strokeStyle=`rgba(230,236,255,${0.7*fade})`; ctx.lineWidth=1.3; ctx.beginPath(); ctx.arc(c.px,c.py,30,-Math.PI/2,-Math.PI/2+TAU*kc); ctx.stroke(); ctx.restore(); } }
// Motion Prompt #005 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#005  遮罩显字 Mask reveal：分隔线从中间长出 0.4 s；大字从线下升起 0.65 s（五次缓出）；退场 backIn 上移
function title(ctx,t,T0,cy){ if(t<T0||t>T0+3.3) return; const k=2.2;
  const lg=eIO(P(t,T0+0.1,T0+0.5))*(1-eIO(P(t,T0+2.95,T0+3.2))), up=eo5(P(t,T0+0.35,T0+1.0)), ex1=backIn(P(t,T0+2.6,T0+2.95));
  ctx.save(); ctx.strokeStyle='rgba(255,214,150,0.9)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(540-418*lg,cy); ctx.lineTo(540+418*lg,cy); ctx.stroke();
  ctx.beginPath(); ctx.rect(0,cy-250,W,245); ctx.clip(); ctx.fillStyle='#f4ead8'; ctx.font=`400 ${98*k}px ${DISPLAY}`; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.shadowColor='rgba(255,200,120,0.35)'; ctx.shadowBlur=30; ctx.fillText('步天规',540,cy-24+(1-up)*120*k-ex1*150*k); ctx.restore(); }

// ───────── 2 规：星图几何（极坐标，单位：度 → 像素 300/90）─────────
// 二十八宿距度（《汉书·律历志》古度，合计 365¼）：角亢氐房心尾箕 斗牛女虚危室壁 奎娄胃昴毕觜参 井鬼柳星张翼轸
const DU=[12,9,15,5,5,18,11,26.25,8,12,10,17,16,9,16,12,14,11,16,2,9,33,4,15,7,18,18,17];
const MANS=(()=>{ let acc=0; return DU.map(d=>{ const a=acc; acc+=d; return a/365.25*TAU; }); })();
const KPX=300/90, R_IN=120, R_EQ=300, R_OUT=470, BASE=-Math.PI/2;
const ECL=(()=>{ const e=23.44*Math.PI/180, out=[]; for(let i=0;i<=180;i++){ const l=i/180*TAU, dec=Math.asin(Math.sin(e)*Math.sin(l)), ra=Math.atan2(Math.cos(e)*Math.sin(l),Math.cos(l));
  out.push([(90-dec*180/Math.PI)*KPX, -ra]); } return out; })(); // [半径, 角度]；角宿一赤经 ≈201°
const JIAO=201.3*Math.PI/180;
const chartXY=(c,r,ang,s=c.s)=>[c.px+s*r*Math.cos(ang+c.rot+BASE), c.py+s*r*Math.sin(ang+c.rot+BASE)];
const mansAng=j=>-(JIAO+MANS[j]);
const MSTAR=(()=>{const r=rng(91); return MANS.map(()=>({dr:gauss(r)*28,da:(r()-0.5)*0.05,b:0.6+r()*0.4}));})();
function arcDraw(ctx,c,R,k,col,w){ if(k<=0) return null; ctx.strokeStyle=col; ctx.lineWidth=w; ctx.beginPath(); const a0=-Math.PI/2; ctx.arc(c.px,c.py,R*c.s,a0,a0+TAU*k); ctx.stroke(); return [c.px+R*c.s*Math.cos(a0+TAU*k),c.py+R*c.s*Math.sin(a0+TAU*k)]; }
// 规（圆规）画圆：一条细臂从圆心连到笔尖
function compass(ctx,c,tip,a){ if(!tip||a<=0) return; ctx.save(); ctx.strokeStyle=`rgba(255,214,150,${0.35*a})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(c.px,c.py); ctx.lineTo(tip[0],tip[1]); ctx.stroke(); ctx.restore(); tipGlow(ctx,tip,0.95*a,18); }
// Motion Prompt #002 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#002  错峰入场 Stagger：二十八条分野线依次长出，间隔 0.22 s，每条 0.5 s 三次缓出
// Motion Prompt #125 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#125  脉冲 Pulse：从北极星向外扩一圈波纹
function chartStrokes(ctx,t,c,p,a,beam){ // p: 各部分进度 {in,eq,out,rad(j),ecl,star(j)}
  if(a<=0.01) return; ctx.save(); ctx.lineCap='round';
  const gold=x=>`rgba(255,214,150,${clamp(x*a,0,1)})`;
  const tI=arcDraw(ctx,c,R_IN,p.in,gold(0.7),1.4), tE=arcDraw(ctx,c,R_EQ,p.eq,gold(0.85),1.8), tO=arcDraw(ctx,c,R_OUT,p.out,gold(0.75),1.5);
  if(p.out>0&&p.out<1) arcDraw(ctx,c,R_OUT+10,p.out,gold(0.25),0.8);
  for(let j=0;j<28;j++){ const k=p.rad(j); if(k<=0) continue; const ang=mansAng(j); const bb=beam?beam(ang):0;
    const p0=chartXY(c,R_IN,ang), p1=chartXY(c,lerp(R_IN,R_OUT,eo3(k)),ang);
    ctx.strokeStyle=gold(0.38+0.6*bb); ctx.lineWidth=1+bb*1.4; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); ctx.stroke();
    // 外规上的刻度
    if(k>=1){ const q0=chartXY(c,R_OUT,ang), q1=chartXY(c,R_OUT+18,ang); ctx.beginPath(); ctx.moveTo(q0[0],q0[1]); ctx.lineTo(q1[0],q1[1]); ctx.stroke(); } }
  if(p.ecl>0){ const pts=ECL.map(([r,an])=>chartXY(c,r,an)); const tp=strokeTrim(ctx,pts,p.ecl,gold(0.55),1.3,[2,7]); if(p.ecl<1) tipGlow(ctx,tp,a); }
  ctx.globalCompositeOperation='lighter';
  for(let j=0;j<28;j++){ const k=p.star(j); if(k<=0) continue; const m=MSTAR[j], ang=mansAng(j)-0.5*DU[j]/365.25*TAU+m.da, [x,y]=chartXY(c,R_EQ+m.dr,ang);
    const pop=k<1?backOut(k):1, bb=beam?beam(ang):0; glow(ctx,x,y,(10+6*bb)*pop*c.s,WARM,(0.7+0.3*bb)*a*m.b); glow(ctx,x,y,2.2,WHITE,a); }
  ctx.restore(); return {tI,tE,tO}; }
function pulseRing(ctx,c,t,t0,a=1,col=GOLD){ const k=P(t,t0,t0+1.6); if(k<=0||k>=1) return; ctx.save(); ctx.strokeStyle=rgba(col,(1-k)*0.6*a); ctx.lineWidth=2+6*(1-k); ctx.beginPath(); ctx.arc(c.px,c.py,(60+560*eo3(k))*c.s,0,TAU); ctx.stroke(); ctx.restore(); }
function sceneRule(ctx,t,c){ let a=1-0.75*sm(P(t,A.dip1,64.5)); a*=1-sm(P(t,A.s3,70.2)); if(a<=0.01) return;
  const p={in:eIO(P(t,A.s2,38.8)),eq:eIO(P(t,A.eq,42.6)),out:eIO(P(t,A.out,45.2)),rad:j=>P(t,45.4+j*0.22,45.9+j*0.22),ecl:eIO(P(t,A.ecl,54.0)),star:j=>P(t,45.75+j*0.22,46.2+j*0.22)};
  const tips=chartStrokes(ctx,t,c,p,a);
  if(p.in<1) compass(ctx,c,tips.tI,a); if(p.eq>0&&p.eq<1) compass(ctx,c,tips.tE,a); if(p.out>0&&p.out<1) compass(ctx,c,tips.tO,a);
  pulseRing(ctx,c,t,A.p1,a); pulseRing(ctx,c,t,A.p2,a);
  ctx.save(); ctx.globalCompositeOperation='lighter'; const br=1+0.4*Math.sin(t*2.2); glow(ctx,c.px,c.py,14*br,COOL,0.9); glow(ctx,c.px,c.py,2.6,WHITE,1); ctx.restore(); }

// ───────── 3 式盘：方的地盘 + 圆的天盘 ─────────
// Motion Prompt #143 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#143  分解图 Exploded view：各层沿法线分开，再依次合上，落定带过冲
// Motion Prompt #134 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#134  阵列复制 Repeater：十二格刻度绕圆复制，每格比前一格晚 0.025 s 转动（错拍）
// Motion Prompt #022 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#022  扫光 Light sweep：一道斜光带 0.8 s 扫过盘面
const STEPS=[83.59,86.4,91.13,93.0,94.4,95.4,96.05];
function plateAngle(t){ let a=0; for(const s of STEPS) a+=Math.PI/6*backOut(P(t,s,s+0.45),1.4); return a; }
const DIPN=(()=>{ const cx=DREL.reduce((s,p)=>s+p[0],0)/7, cy=DREL.reduce((s,p)=>s+p[1],0)/7; const m=Math.max(...DREL.map(p=>Math.hypot(p[0]-cx,p[1]-cy))); return DREL.map(p=>[(p[0]-cx)/m,(p[1]-cy)/m]); })();
function scenePlate(ctx,t0,c){ const t=Math.min(t0,A.s4-0.1); if(t0<66.9||t0>=A.s4) return;
  const a=sm(P(t,66.9,68.0))*(1-0.7*P(t,96.1,96.8));
  const cosP=lerp(1,0.56,eIO(P(t,69.2,75.5))), sinP=Math.sqrt(1-cosP*cosP), yaw=0.05*(t-A.s3)+0.25*eIO(P(t,92,96.8));
  const cx=540, cy=1010, S=1;
  const zG=-900*(1-backOut(P(t,67.44,A.s3),1.3)), zT=26+700*(1-backOut(P(t,75.03,76.03),1.5));
  const tA=plateAngle(t);
  ctx.save(); ctx.globalAlpha=a;
  // 地盘（方）：先画侧面厚度，再画顶面
  const plane=(z,fn)=>{ ctx.save(); ctx.translate(cx,cy-z*sinP); ctx.scale(S,S*cosP); ctx.rotate(yaw); fn(); ctx.restore(); };
  const sq=h=>{ ctx.beginPath(); ctx.rect(-h,-h,2*h,2*h); };
  for(let k=10;k>=0;k-=2) plane(zG-k*2.2,()=>{ sq(380); ctx.fillStyle=k?'rgba(40,30,18,0.9)':'#0b1220'; ctx.fill(); });
  plane(zG,()=>{ const g=ctx.createLinearGradient(-380,-380,380,380); g.addColorStop(0,'#141d30'); g.addColorStop(1,'#080d18'); sq(380); ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle='rgba(255,214,150,0.85)'; ctx.lineWidth=2.2; sq(380); ctx.stroke(); ctx.lineWidth=1.2;
    [330,280,232].forEach((h,i)=>{ const k=eo3(P(t,72.24+i*0.35,72.9+i*0.35)); if(k<=0) return; ctx.strokeStyle=`rgba(255,214,150,${0.6*k})`; ctx.save(); ctx.scale(lerp(1.08,1,k),lerp(1.08,1,k)); sq(h); ctx.stroke(); ctx.restore(); });
    // 三圈刻度：外圈二十八宿（按距度落在方框上）、中圈十二辰、内圈十干
    const band=(h0,h1,n,angs,t0)=>{ for(let i=0;i<n;i++){ const k=P(t,t0+i*0.03,t0+i*0.03+0.3); if(k<=0) continue; const an=angs?angs[i]:i/n*TAU;
      const ux=Math.cos(an), uy=Math.sin(an), m=Math.max(Math.abs(ux),Math.abs(uy)); const r0=h0/m, r1=lerp(h0,h1,k)/m;
      ctx.strokeStyle=`rgba(255,214,150,${0.75*k})`; ctx.beginPath(); ctx.moveTo(ux*r0,uy*r0); ctx.lineTo(ux*r1,uy*r1); ctx.stroke();
      if(k>=1){ ctx.fillStyle='rgba(255,226,180,0.8)'; ctx.beginPath(); ctx.arc(ux*(h0+h1)/2/m*1,uy*(h0+h1)/2/m,2.2,0,TAU); ctx.fill(); } } };
    band(330,380,28,MANS.map(x=>-x),72.4); band(280,330,12,null,73.3); band(232,280,10,null,73.9); });
  // 天盘（圆）：带厚度；错拍转动
  for(let k=8;k>=2;k-=2) plane(zT-k*2.2,()=>{ ctx.beginPath(); ctx.arc(0,0,222,0,TAU); ctx.fillStyle='rgba(50,36,20,0.95)'; ctx.fill(); });
  plane(zT,()=>{ ctx.beginPath(); ctx.arc(0,0,222,0,TAU); const g=ctx.createRadialGradient(0,0,0,0,0,222); g.addColorStop(0,'#18223a'); g.addColorStop(1,'#0a1020'); ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle='rgba(255,214,150,0.9)'; ctx.lineWidth=2.2; ctx.stroke(); ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(0,0,168,0,TAU); ctx.strokeStyle='rgba(255,214,150,0.6)'; ctx.stroke();
    for(let i=0;i<12;i++){ const an=i/12*TAU+plateAngle(t-i*0.025); const k=P(t,78.0+i*0.04,78.3+i*0.04); if(k<=0) continue;
      ctx.strokeStyle=`rgba(255,214,150,${0.8*k})`; ctx.beginPath(); ctx.moveTo(Math.cos(an)*168,Math.sin(an)*168); ctx.lineTo(Math.cos(an)*lerp(168,222,k),Math.sin(an)*lerp(168,222,k)); ctx.stroke();
      ctx.fillStyle=`rgba(255,226,180,${0.85*k})`; ctx.beginPath(); ctx.arc(Math.cos(an+TAU/24)*195,Math.sin(an+TAU/24)*195,2.6,0,TAU); ctx.fill(); }
    // 盘心刻北斗
    ctx.rotate(tA); const pts=DIPN.map(p=>[p[0]*120,p[1]*120]); const kd=eIO(P(t,78.86,80.4)); strokeTrim(ctx,ORDER.map(i=>pts[i]),kd,'rgba(255,222,172,0.95)',2.4);
    if(kd>0){ ctx.globalCompositeOperation='lighter'; pts.forEach((p,i)=>{ const k=P(t,78.86+i*0.2,79.1+i*0.2); glow(ctx,p[0],p[1],12*k,WARM,0.9*k); }); }
    ctx.globalCompositeOperation='source-over'; ctx.fillStyle='rgba(255,226,180,0.9)'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); });
  // #022 扫光：沿盘面斜扫（只在两块盘面上可见）
  for(const ts of [86.4,91.13,95.4]){ const k=P(t,ts,ts+0.8); if(k<=0||k>=1) continue;
    plane(zG,()=>{ ctx.save(); sq(380); ctx.clip(); ctx.rotate(-yaw); const x=lerp(-700,700,eIO(k)); const g=ctx.createLinearGradient(x-110,0,x+110,0); g.addColorStop(0,'rgba(255,230,190,0)'); g.addColorStop(0.5,'rgba(255,230,190,0.28)'); g.addColorStop(1,'rgba(255,230,190,0)');
      ctx.globalCompositeOperation='lighter'; ctx.transform(1,0,-0.5,1,0,0); ctx.fillStyle=g; ctx.fillRect(-1200,-800,2400,1600); ctx.restore(); }); }
  ctx.restore(); }

// ───────── 4 穿越 ─────────
// Motion Prompt #003 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#003  迸发 Burst：中心点亮的同时，一圈环与射线向外炸开
// Motion Prompt #024 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#024  冲击震屏 Impact shake：重拍时整幅画面衰减震动 0.4 s
// Motion Prompt #027 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#027  推轨 Dolly in：近处星星变大掠过，远处几乎不动
// Motion Prompt #038 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#038  变速 Speed ramp：穿越在段尾由快平滑变慢，落回静止的星空
const FLY=[103.0,105.6,109.09,111.92,116.63];
function warpV(t){ if(t<A.s4) return 0; let v=1.7*Math.exp(-(t-A.s4)/0.9)+0.6*sm(P(t,A.s4,97.6)); for(const o of FLY) if(t>o-0.2) v+=0.45*Math.exp(-(t-o)/0.7)*P(t,o-0.2,o);
  return v*(1-sm(P(t,117.6,120.8))); }
const WD=(()=>{const n=Math.ceil(26*120), a=new Float64Array(n+1); for(let i=1;i<=n;i++) a[i]=a[i-1]+warpV(A.s4+(i-0.5)/120)/120; return a;})();
const warpD=t=>{ const x=clamp(t-A.s4,0,25.9)*120, i=Math.floor(x); return WD[i]+(WD[i+1]-WD[i])*(x-i); };
const WST=(()=>{const r=rng(55),s=[]; while(s.length<3000){ const x=(r()*2-1)*1.3, y=(r()*2-1)*1.6; if(Math.abs(x)<0.04&&Math.abs(y)<0.04) continue; s.push({x,y,z0:r(),cool:r()<0.15,b:0.5+r()*0.5}); } return s;})();
const NEB=(()=>{const r=rng(66),C=[[90,110,220],[150,100,210],[255,190,120],[80,160,200]];return Array.from({length:46},()=>({x:(r()*2-1)*0.9,y:(r()*2-1)*1.2,z0:r(),r:160+r()*260,a:0.05+r()*0.08,col:C[(r()*4)|0]}));})();
function sceneWarp(ctx,t){ if(t<A.s4||t>121.3) return; const a=1-sm(P(t,118.8,121.2));
  const bg=ctx.createRadialGradient(540,960,0,540,960,1300); bg.addColorStop(0,'#101b33'); bg.addColorStop(0.5,'#050a16'); bg.addColorStop(1,'#020408');
  ctx.save(); ctx.globalAlpha=a*sm(P(t,A.s4,97.1)); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1;
  const D=warpD(t), v=warpV(t), F=520; ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  glow(ctx,540,960,420+120*v,[255,200,140],0.22*a); glow(ctx,540,960,90,WARM,0.35*a);
  for(const s of WST){ const z=((s.z0-D*0.32)%1+1)%1*0.98+0.02, zp=Math.min(1,z+Math.max(0.006,v*0.085)); if(zp<z) continue;
    const x1=540+s.x/z*F, y1=960+s.y/z*F, x0=540+s.x/zp*F, y0=960+s.y/zp*F; if((x1<-50||x1>W+50||y1<-50||y1>H+50)&&(x0<-50||x0>W+50||y0<-50||y0>H+50)) continue;
    const near=Math.pow(1-z,1.3), al=Math.min(1,a*s.b*near*1.35*clamp(z*12,0,1)); const col=s.cool?[170,200,255]:[255,232,200];
    ctx.strokeStyle=rgba(col,al); ctx.lineWidth=0.6+near*3.2; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); }
  // 星云：大片淡色云团迎面流过
  for(const n of NEB){ const z=((n.z0-D*0.11)%1+1)%1*0.95+0.05; const x=540+n.x/z*F, y=960+n.y/z*F, al=a*n.a*Math.sin(Math.PI*(1-z))*sm(P(t,A.s4,98));
    if(al>0.003) glow(ctx,x,y,n.r/z,n.col,al); }
  // 穿过几个星座：北斗形状从远处迎面掠过
  FLY.slice(2).forEach((o,n)=>{ const k=P(t,o-1.0,o+0.8); if(k<=0||k>=1) return; const z=lerp(1.0,0.08,ein(k)), side=n%2?1:-1;
    const pts=DIPN.map(p=>[540+(p[0]*0.55+side*0.35)/z*F*0.6, 960+(p[1]*0.55-0.15)/z*F*0.6]); const al=a*sm(P(k,0,0.3))*(1-P(k,0.85,1));
    strokeTrim(ctx,ORDER.map(i=>pts[i]),1,`rgba(255,222,172,${0.6*al})`,1+2/z*0.2); pts.forEach(p=>glow(ctx,p[0],p[1],(6+5/z),WARM,al)); });
  // 迸发
  const kb=P(t,A.s4,A.s4+0.7); if(kb<1){ const e=eo3(kb); ctx.strokeStyle=rgba(WARM,(1-kb)*0.8); ctx.lineWidth=3*(1-kb)+1; ctx.beginPath(); ctx.arc(540,960,40+620*e,0,TAU); ctx.stroke();
    for(let i=0;i<24;i++){ const an=i/24*TAU+0.1, r0=60+300*e, r1=90+760*e; ctx.strokeStyle=rgba(GOLD,(1-kb)*0.7); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(540+Math.cos(an)*r0,960+Math.sin(an)*r0); ctx.lineTo(540+Math.cos(an)*r1,960+Math.sin(an)*r1); ctx.stroke(); }
    glow(ctx,540,960,260*(1-kb)+40,WHITE,(1-kb)*0.8); }
  ctx.restore(); }

// ───────── 5 一年：北斗绕北极星一整圈，斗柄指东、南、西、北 ─────────
// Motion Prompt #039 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#039  延时 Time-lapse：一年压缩成 25 秒
// Motion Prompt #014 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#014  运动拖影 Motion trail：身后留下渐淡的残影
const SEASON=[[120,200,185],[255,170,90],[205,210,225],[90,120,230]];
function seasonCol(q){ const x=((q%1)+1)%1*4, i=Math.floor(x), f=sm(x-i); const a=SEASON[i%4], b=SEASON[(i+1)%4]; return [lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f)]; }
function sceneYear(ctx,t,c){ if(t<119||t>152) return; const a=sm(P(t,120.4,122))*(1-sm(P(t,A.dip2,150.4)));
  const q=eIO(P(t,YEAR[0],YEAR[1])), col=seasonCol(q);
  // 季节色只在天边一层淡淡的光
  const g=ctx.createLinearGradient(0,c.hz-620,0,c.hz); g.addColorStop(0,rgba(col,0)); g.addColorStop(1,rgba(col,0.13*a)); ctx.fillStyle=g; ctx.fillRect(0,c.hz-620,W,620);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let k=8;k>=1;k--){ const tk=t-k*0.11, ck=cam(tk); const D=dipperPts(ck); const al=a*0.32*(1-k/9)*clamp(Math.abs(rotAt(t)-rotAt(t-0.3))*6,0,1);
    ctx.strokeStyle=rgba(GOLD,al*0.6); ctx.lineWidth=1.2; ctx.beginPath(); ORDER.forEach((i,n)=>n?ctx.lineTo(D[i][0],D[i][1]):ctx.moveTo(D[i][0],D[i][1])); ctx.stroke(); D.forEach(p=>glow(ctx,p[0],p[1],8,WARM,al)); }
  const D=dipperPts(c); ctx.strokeStyle=rgba(GOLD,0.6*a); ctx.lineWidth=1.6; ctx.beginPath(); ORDER.forEach((i,n)=>n?ctx.lineTo(D[i][0],D[i][1]):ctx.moveTo(D[i][0],D[i][1])); ctx.stroke();
  D.forEach(p=>{ glow(ctx,p[0],p[1],18,WARM,a); glow(ctx,p[0],p[1],2.6,WHITE,a); });
  glow(ctx,D[6][0],D[6][1],46,col.map(v=>v|0),0.55*a); // 斗柄尖带一点季节色
  glow(ctx,c.px,c.py,16,COOL,a); glow(ctx,c.px,c.py,2.6,WHITE,a);
  ctx.restore(); }

// ───────── 6 汇聚 / 7 高潮 / 8 碎裂：星图粒子 ─────────
// Motion Prompt #015 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#015  粒子 Particles：反过来用——星尘从四面八方飞回，落成星图
const CH=(()=>{ const r=rng(77), L=[]; const add=(rr,an,t0,t1)=>L.push({r:rr,an,ta:lerp(t0,t1,r()),sr:700+r()*900,sa:r()*TAU,tw:r()*6.28,v:120+r()*520,vj:gauss(r)*0.5,fade:212.5+r()*4.0,b:0.4+r()*0.6});
  for(let i=0;i<260;i++) add(R_IN,i/260*TAU,151.4,153.4);
  for(let i=0;i<520;i++) add(R_EQ,i/520*TAU,153.0,155.8);
  for(let i=0;i<760;i++) add(R_OUT,i/760*TAU,155.3,158.2);
  for(let j=0;j<28;j++) for(let i=0;i<22;i++) add(lerp(R_IN,R_OUT,i/21),mansAng(j),157.4+j*0.1,158.6+j*0.1);
  ECL.forEach(([rr,an],i)=>{ if(i%1===0){ add(rr,an,159.4,161.4); add(rr,an+0.004,159.4,161.4);} });
  return L; })();
function partXY(p,t,c){ const [tx,ty]=chartXY(c,p.r,p.an); const k=P(t,p.ta-1.5,p.ta); if(k>=1) return [tx,ty,1];
  const e=eo3(k), sw=(1-e)*1.5, sx=c.px+Math.cos(p.sa)*p.sr, sy=c.py+Math.sin(p.sa)*p.sr; let x=lerp(sx,tx,e)-c.px, y=lerp(sy,ty,e)-c.py; const co=Math.cos(sw), si=Math.sin(sw);
  return [c.px+x*co-y*si, c.py+x*si+y*co, k]; }
// Motion Prompt #135 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#135  万花筒 Kaleidoscope：八向对称的北斗图案在内规里旋转铺开
// Motion Prompt #030 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#030  环绕 Orbit：机位绕浑仪转，环的前后层次随之变化
// Motion Prompt #107 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#107  长曝光 Long exposure：流星只留下光轨
// Motion Prompt #028 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#028  变焦推 Zoom in：高潮段画面等比慢慢放大，重拍处再推一下
// Motion Prompt #142 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#142  碎裂 Shatter：星图像玻璃一样裂开飞散，碎片化成星尘
const RINGS=[{t:174.06,n:[0,0,1]},{t:175.37,n:[0,Math.sin(23.44*Math.PI/180),Math.cos(23.44*Math.PI/180)],ecl:1},{t:177.82,n:[1,0,0]},{t:180.64,n:[0,1,0]},{t:185.33,n:[Math.sin(55*Math.PI/180)*0,Math.sin(35*Math.PI/180),Math.cos(35*Math.PI/180)]}];
function ringBasis(n){ const a=Math.abs(n[0])<0.9?[1,0,0]:[0,1,0]; let u=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]]; const lu=Math.hypot(...u); u=u.map(x=>x/lu);
  const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]]; return [u,v]; }
function armillary(ctx,t,c,a){ if(a<=0.01) return; const R=490*c.s, yaw=0.16*(t-174.06)+0.3*eIO(P(t,192.85,197)), pitch=lerp(0.2,1.0,eIO(P(t,174,182)));
  const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
  const proj=p=>{ const x=p[0]*cy-p[1]*sy, y=p[0]*sy+p[1]*cy, z=p[2]; const y2=y*cp-z*sp, z2=y*sp+z*cp; return [c.px+x*R, c.py+y2*R, z2]; };
  ctx.save(); ctx.lineCap='round';
  for(const ring of RINGS){ const k=eIO(P(t,ring.t,ring.t+1.4)); if(k<=0) continue; const [u,v]=ringBasis(ring.n); const N=160, n=Math.max(2,Math.round(N*k));
    let prev=null; for(let i=0;i<=n;i++){ const th=i/N*TAU; const p=[u[0]*Math.cos(th)+v[0]*Math.sin(th),u[1]*Math.cos(th)+v[1]*Math.sin(th),u[2]*Math.cos(th)+v[2]*Math.sin(th)]; const q=proj(p);
      if(prev){ const front=(q[2]+prev[2])/2; ctx.strokeStyle=`rgba(255,214,150,${a*(front<0?0.85:0.25)})`; ctx.lineWidth=front<0?2:1.1; ctx.beginPath(); ctx.moveTo(prev[0],prev[1]); ctx.lineTo(q[0],q[1]); ctx.stroke();
        if(ring.ecl===undefined&&i%5===0&&k>=1){ const q2=proj(p.map(x=>x*1.035)); ctx.beginPath(); ctx.moveTo(q[0],q[1]); ctx.lineTo(q2[0],q2[1]); ctx.stroke(); } }
      prev=q; }
    if(k<1&&prev) tipGlow(ctx,prev,a); }
  ctx.restore(); }
function kaleido(ctx,t,c,a){ if(a<=0.01) return; const g=eo3(P(t,177.82,179.6)); if(g<=0) return; const sp=-0.3*(t-177.82), pul=1+0.12*[185.33,190.02,192.85].reduce((s,o)=>s+Math.exp(-Math.pow((t-o)/0.25,2)),0);
  ctx.save(); ctx.translate(c.px,c.py); ctx.scale(c.s*g*pul,c.s*g*pul); ctx.rotate(sp); ctx.globalCompositeOperation='lighter'; ctx.lineWidth=1.2; ctx.lineJoin='round';
  for(let i=0;i<8;i++){ ctx.save(); ctx.rotate(i/8*TAU); if(i%2) ctx.scale(1,-1); const pts=DIPN.map(p=>[62+p[0]*44,p[1]*44*0.8]);
    ctx.strokeStyle=rgba(GOLD,0.55*a); ctx.beginPath(); ORDER.forEach((j,n)=>n?ctx.lineTo(pts[j][0],pts[j][1]):ctx.moveTo(pts[j][0],pts[j][1])); ctx.stroke(); pts.forEach(p=>glow(ctx,p[0],p[1],5,WARM,0.8*a)); ctx.restore(); }
  ctx.restore(); }
const METEORS=(()=>{const r=rng(31),m=[]; for(let i=0;i<16;i++) m.push({t:180+r()*26,x:r()*W,y:r()*700,a:0.45+r()*0.5,L:260+r()*320}); for(let i=0;i<10;i++) m.push({t:192.85+r()*4,x:r()*W,y:r()*900,a:0.5+r()*0.6,L:300+r()*360}); return m;})();
function meteors(ctx,t){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  for(const m of METEORS){ const k=P(t,m.t,m.t+0.7); if(k<=0||k>=1) continue; const dx=Math.cos(m.a+0.6), dy=Math.sin(m.a+0.6), hx=m.x+dx*m.L*eo3(k), hy=m.y+dy*m.L*eo3(k), tl=m.L*0.55*(1-k*0.6);
    const g=ctx.createLinearGradient(hx-dx*tl,hy-dy*tl,hx,hy); g.addColorStop(0,'rgba(255,240,220,0)'); g.addColorStop(1,`rgba(255,240,220,${0.85*(1-k)})`); ctx.strokeStyle=g; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(hx-dx*tl,hy-dy*tl); ctx.lineTo(hx,hy); ctx.stroke(); glow(ctx,hx,hy,10,WARM,1-k); }
  ctx.restore(); }
const BEAM_T=A.s7;
function beamAng(t){ return 0.84*(t-BEAM_T)+0.84*Math.max(0,t-185.33)+1.2*Math.max(0,t-192.85)*(1-P(t,197,203)); }
const SHARDS=(()=>{const r=rng(13),s=[]; for(let i=0;i<46;i++){ const an=r()*TAU, rr=Math.sqrt(r())*R_OUT, sz=40+r()*90; const pts=[0,1,2].map(k=>[Math.cos(an+k*2.1+r())*sz,Math.sin(an+k*2.1+r())*sz]); s.push({an,rr,pts,v:200+r()*500,w:(r()-0.5)*4});} return s;})();
function sceneChart(ctx,t,c){ if(t<A.s6||t>216) return;
  const live=t<A.s8, aLines=sm(P(t,A.s7-0.25,A.s7+0.2))*(live?1:0)*(1-0.6*P(t,207.64,208.34));
  const beamA=t>=A.s7?1:0, ba=c.rot+BASE+beamAng(t);
  const beam=an=>{ if(!beamA) return 0; let d=((ba-(an+c.rot+BASE))%TAU+TAU)%TAU; return Math.exp(-d/0.35)*(0.6+0.4*P(t,185.33,186)); };
  // #022 扫光（雷达式）：楔形光带扫过整张星图
  if(beamA&&live){ ctx.save(); ctx.beginPath(); ctx.arc(c.px,c.py,R_OUT*c.s,0,TAU); ctx.clip(); const g=ctx.createConicGradient(ba,c.px,c.py);
    g.addColorStop(0,'rgba(255,214,150,0.16)'); g.addColorStop(0.07,'rgba(255,214,150,0.03)'); g.addColorStop(0.2,'rgba(255,214,150,0)'); g.addColorStop(1,'rgba(255,214,150,0)');
    ctx.save(); ctx.translate(c.px,c.py); ctx.scale(-1,1); ctx.translate(-c.px,-c.py); ctx.restore(); ctx.fillStyle=g; ctx.globalCompositeOperation='lighter'; ctx.fillRect(0,0,W,H); ctx.restore(); }
  if(aLines>0.01) chartStrokes(ctx,t,c,{in:1,eq:1,out:1,rad:()=>1,ecl:1,star:()=>1},aLines,beam);
  // 粒子
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const flash=t>=A.s7&&live?0.35:1;
  for(const p of CH){ let x,y,al;
    if(live){ const q=partXY(p,t,c); x=q[0]; y=q[1]; al=(q[2]<1?sm(P(q[2],0,0.12))*0.95:0.9*flash)*p.b*(1-0.6*P(t,207.64,208.34)); if(q[2]>=1&&t<A.s7){ al*=0.6+0.4*Math.exp(-(t-p.ta)/0.4); } }
    else { const tt=t-A.s8, [x0,y0]=chartXY(cam(A.s8),p.r,p.an); const dx=x0-c.px, dy=y0-c.py, d=Math.hypot(dx,dy)||1, ang=Math.atan2(dy,dx)+p.vj; const dist=p.v*0.9*(1-Math.exp(-tt/0.9));
      x=x0+Math.cos(ang)*dist; y=y0+Math.sin(ang)*dist; al=p.b*(1-sm(P(t,p.fade-1.5,p.fade)))*(0.6+0.4*Math.sin(t*5+p.tw)); }
    if(live&&t<p.ta&&t>p.ta-1.5){ const q0=partXY(p,t-0.06,c), q=partXY(p,t,c); const aa=al*1.2; ctx.strokeStyle=rgba(WARM,aa*0.7); ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(q0[0],q0[1]); ctx.lineTo(q[0],q[1]); ctx.stroke(); glow(ctx,x,y,5,WARM,aa); continue; }
    if(al<=0.01) continue; if(p.ta%1<0.12) glow(ctx,x,y,6,WARM,al); else { ctx.fillStyle=rgba(WARM,al); ctx.fillRect(x-1.2,y-1.2,2.4,2.4); } }
  ctx.restore();
  // 碎片
  if(!live){ const tt=t-A.s8, c0=cam(A.s8); ctx.save(); for(const s of SHARDS){ const al=1-P(tt,0.2,3.0); if(al<=0) continue; const d=s.v*(1-Math.exp(-tt/0.8)), [x0,y0]=chartXY(c0,s.rr,s.an);
      const dx=x0-c.px, dy=y0-c.py, n=Math.hypot(dx,dy)||1; ctx.save(); ctx.translate(x0+dx/n*d,y0+dy/n*d); ctx.rotate(s.w*tt); ctx.beginPath(); s.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
      ctx.fillStyle=`rgba(255,214,150,${0.06*al})`; ctx.fill(); ctx.strokeStyle=`rgba(255,214,150,${0.7*al})`; ctx.lineWidth=1.2; ctx.stroke(); ctx.restore(); }
    glow(ctx,c.px,c.py,300*(1-P(tt,0,0.6))+10,WARM,0.6*(1-P(tt,0,0.6))); ctx.restore(); }
  if(t>=A.s7&&live){ const aa=(1-sm(P(t,203.39,207.6)));
    armillary(ctx,t,c,aa); kaleido(ctx,t,c,aa); meteors(ctx,t);
    for(const o of [A.s7,174.06,192.85]) pulseRing(ctx,c,t,o,1,WARM);
    ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,c.px,c.py,18,COOL,1); glow(ctx,c.px,c.py,3,WHITE,1); ctx.restore(); } }

// ───────── 9 归海：北斗再描一笔，再从起点擦掉（#004 的完整动作）─────────
function sceneReturn(ctx,t,c){ if(t<214.5) return; const a=sm(P(t,216,219))*(1-sm(P(t,229,232)));
  drawDipperStars(ctx,c,a*0.85);
  const D=dipperPts(c), k=eIO(P(t,221.6,223.4)), k0=eIO(P(t,223.6,225.4)); if(k>0&&k0<1){ const tip=strokeTrim(ctx,ORDER.map(i=>D[i]),k,`rgba(255,222,172,${0.75*a})`,1.6,null,k0); if(k<1) tipGlow(ctx,tip,a); }
  ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,c.px,c.py,14,COOL,a); glow(ctx,c.px,c.py,2.4,WHITE,a); ctx.restore(); }

// ───────── 合成 ─────────
function shake(t){ let a=0; for(const [o,m] of [[A.s4,16],[A.s7,8],[192.85,6]]) if(t>=o) a+=m*Math.exp(-(t-o)/0.13)*P(t,o,o+0.4)*0+m*Math.max(0,1-(t-o)/0.4); return [Math.sin(t*93)*a,Math.cos(t*71)*a]; }
function render(ctx,t){
  const c=cam(t); const [sx,sy]=shake(t);
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#02040a'; ctx.fillRect(0,0,W,H); ctx.setTransform(1,0,0,1,sx,sy);
  // 星轨长度：第 1 段累积，第 2 段开头缩回成点；一年段用短拖影
  let trail=0; if(t>=22.6&&t<40){ const tA=t<A.s2?22.6:lerp(22.6,t,eIO(P(t,A.s2,39.4))); trail=Math.max(0,cum(t)-cum(tA)); }
  if(t>=122&&t<148) trail=Math.abs(rotAt(t)-rotAt(t-0.4));
  const sa=skyA(t);
  drawSky(ctx,t,c,sa,trail*sa);
  drawSea(ctx,t,c,(t<A.s1?0.4+0.6*P(t,A.light,A.draw[1]):0.7)*sa);
  if(t<24) intro(ctx,t,c);
  if(t>=A.s1&&t<A.s2+2){ drawDipperStars(ctx,c,(1-P(t,A.s2,A.s2+1.5))*sa*0.8); ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,c.px,c.py,14,COOL,1); glow(ctx,c.px,c.py,2.4,WHITE,1); ctx.restore(); }
  if(t>=A.s2-0.2&&t<71) sceneRule(ctx,t,c);
  scenePlate(ctx,t,c);
  sceneWarp(ctx,t);
  sceneYear(ctx,t,c);
  sceneChart(ctx,t,c);
  sceneReturn(ctx,t,c);
  ctx.setTransform(1,0,0,1,0,0);
  title(ctx,t,A.title,1520); title(ctx,t,233.0,980);
  // 暗角（#112）与片尾黑场
  const v=ctx.createRadialGradient(540,960,500,540,960,1250); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.45)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  const fo=P(t,236.6,238.6)+ (1-P(t,0,0.6)); if(fo>0){ ctx.fillStyle=`rgba(0,0,0,${clamp(fo,0,1)})`; ctx.fillRect(0,0,W,H); }
}
window.__ep={render,DUR};
