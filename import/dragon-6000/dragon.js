// 思想可见 ·《画了 6000 年的龙，为什么没人见过？》竖版 1080×1920 / 30fps / 无旁白。画面 = 时间 t 的纯函数。
// 性格：庄重型（入场 12–20 帧，缓动 (0.4,0,0.2,1)，不过冲）；27 秒一次 drop（九似拼龙）用冲击型。
const W=1080,H=1920,FPS=30,DUR=58.5;
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const lerp=(a,b,k)=>a+(b-a)*k, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), P=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo3=x=>1-Math.pow(1-x,3), eIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, sm=x=>x*x*(3-2*x), ein=x=>x*x*x, expo=x=>x>=1?1:1-Math.pow(2,-10*x);
const ease=x=>{ // cubic-bezier(0.4,0,0.2,1)：庄重型主缓动
  if(x<=0) return 0; if(x>=1) return 1; let lo=0,hi=1,u=x; for(let i=0;i<22;i++){ u=(lo+hi)/2; const bx=3*(1-u)*(1-u)*u*0.4+3*(1-u)*u*u*0.2+u*u*u; if(bx<x) lo=u; else hi=u; }
  return 3*(1-u)*u*u*1+u*u*u; };
const gauss=r=>{let u=0;for(let i=0;i<4;i++)u+=r();return (u-2)/0.58;};
const TAU=Math.PI*2;
const GOLD=[255,212,140], WARM=[255,234,196], WHITE=[255,255,255], JADE=[130,214,170], TURQ=[70,205,200], SHELL=[236,230,216];
const SANS='"Noto Sans SC",sans-serif', DISP='"QingKe","Noto Sans SC",sans-serif';
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${clamp(a,0,1)})`;
const SPR={}; function sprite(col){ const k=col.map(v=>v|0).join(','); if(SPR[k]) return SPR[k]; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,`rgba(${k},1)`); gr.addColorStop(0.25,`rgba(${k},0.35)`); gr.addColorStop(1,`rgba(${k},0)`); g.fillStyle=gr; g.fillRect(0,0,64,64); return SPR[k]=c; }
function glow(ctx,x,y,r,col,a){ if(a<=0.004||r<=0.3) return; const ga=ctx.globalAlpha; ctx.globalAlpha=Math.min(1,a*ga); ctx.drawImage(sprite(col),x-r,y-r,2*r,2*r); ctx.globalAlpha=ga; }
// 节拍：80 BPM，每拍 0.75 s，每小节 3 s；drop 在第 9 小节（27.0 s）
const T={hook:0,shell:6,jade:12,turq:18,ask:24,dark:26.3,drop:27,nine:[27.6,0.6],fly:33,size:36,qian:42,end:48,q:54};

// ───────── 龙的脊线与身体 ─────────
const NS=150; // 脊线采样点数
function widthAt(u){ const body=0.78+0.32*Math.sin(Math.PI*Math.min(1,u*1.5)); const tail=u<0.7?1:Math.pow(Math.max(0,1-(u-0.7)/0.3),0.85); return body*tail; }
function frame(pts){ // 切线、法线
  return pts.map((p,i)=>{ const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)]; let tx=b[0]-a[0], ty=b[1]-a[1]; const l=Math.hypot(tx,ty)||1; tx/=l; ty/=l; return {x:p[0],y:p[1],tx,ty,nx:-ty,ny:tx}; }); }
const at=(F,u,v,w0)=>{ const f=F[Math.round(clamp(u,0,1)*(F.length-1))]; const w=w0*widthAt(u)*v; return [f.x+f.nx*w,f.y+f.ny*w]; };

// 各段的脊线（返回 NS 个点）
function spineShell(t){ return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1); return [190+u*720, 800+Math.sin(u*TAU*1.2+0.6)*26*(0.4+u)-Math.max(0,0.12-u)*260]; }); }
function spineC(t){ const r=232; return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1), th=(-62-u*236)*Math.PI/180; return [560+Math.cos(th)*r, 800+Math.sin(th)*r]; }); }
function spineTurq(t){ return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1); return [540+Math.sin(u*TAU*1.25+0.3)*120*(0.5+0.5*u)+Math.sin(t*1.2+u*6)*6, 420+u*860]; }); }
// 跟随运动：龙头沿轨迹走，身体每一节都走龙头走过的路（真实的蛇形运动）
function catmull(K,τ){ let i=0; while(i<K.length-2&&τ>=K[i+1][0]) i++; const p0=K[Math.max(0,i-1)],p1=K[i],p2=K[i+1],p3=K[Math.min(K.length-1,i+2)]; const s=clamp((τ-p1[0])/(p2[0]-p1[0]),0,1);
  const f=(a,b,c,d)=>0.5*((2*b)+(-a+c)*s+(2*a-5*b+4*c-d)*s*s+(-a+3*b-3*c+d)*s*s*s); return [f(p0[1],p1[1],p2[1],p3[1]),f(p0[2],p1[2],p2[2],p3[2])]; }
const PATH=[ // [时间, x, y]
  [24,540,1500],[25,300,1200],[26,700,900],[27,540,560],[28,300,520],[29,250,800],[30,600,1000],[31,850,760],[32,700,480],[33,420,420],[34,180,700],[35,420,1020],[36,820,950],[37,940,640],[38,700,420],[39,380,500],[40,250,820],[41,500,1050],[42,1180,1180],
  [43,800,1240],[44.1,330,1200],[44.8,200,1090],[45.3,400,800],[45.8,700,520],[46.4,820,400],[47.0,640,240],[47.6,540,40],[48.2,520,-260],[49,520,-500]];
const LAG=2.1;
function spineFollow(t,lag=LAG,K=PATH){ return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1); return catmull(K,t-u*lag); }); }
const HOOK=[[-5,1050,700],[-3,900,800],[0,700,900],[2,450,980],[4,250,1050],[6,60,1100],[8,-200,1150]];
// 英雄姿态：升龙。头在左上、朝右上方的火珠昂首张口，身体向下盘一个大 S，尾巴甩回左下（三停：首至膊、膊至腰、腰至尾）
const POSE_K=[[0,480,610],[1,340,690],[2,330,840],[3,500,910],[4,740,840],[5,850,950],[6,800,1110],[7,620,1180],[8,430,1120],[9,300,1210],[10,250,1360],[11,330,1470]];
function spinePose(t){ const br=Math.sin(t*1.6)*6; const K=POSE_K.map(([k,x,y],i)=>[k,x+Math.sin(t*1.1+i*0.7)*5*(i/11),y+br*(1-i/11)]); return Array.from({length:NS},(_,i)=>catmull(K,i/(NS-1)*11)); }
const mixS=(A,B,k)=>A.map((p,i)=>[lerp(p[0],B[i][0],k),lerp(p[1],B[i][1],k)]);
// 团龙：身体盘成一圈，头在圈顶向里昂起，对着圈心的火珠（呼应红山 C 形玉龙）
function spineEnd(t){ const r=290; return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1), th=(-118+u*318)*Math.PI/180+Math.sin(t*0.9+u*6)*0.012, rr=r*(1-0.16*u); return [550+Math.cos(th)*rr, 830+Math.sin(th)*rr]; }); }

// ───────── 画龙：明清成熟龙形 ─────────
// 头大（约身宽的 2.5 倍），张口、獠牙、卷舌；如意形鼻、粗眉压眼；鹿角向后扫；鬃毛如火向后飘；长须；
// 身体由尾到头逐节画（近头的身段压住远处的身段，盘绕才有前后）；背上一路火焰形背鳍；腹面一条腹甲带；满身鱼鳞；
// 四腿粗壮，肘后有火焰毛，五爪张开；尾端火焰尾鳍。
const NONE={dx:0,dy:0,a:1};
const PROF=[[0,0.62],[0.05,0.78],[0.14,1.0],[0.3,1.0],[0.55,0.88],[0.8,0.55],[0.93,0.32],[1,0.14]];
function prof(u){ let i=0; while(i<PROF.length-2&&u>PROF[i+1][0]) i++; const a=PROF[i],b=PROF[i+1]; return lerp(a[1],b[1],sm(clamp((u-a[0])/(b[0]-a[0]),0,1))); }
const BODY='rgba(9,12,22,1)';
function drawDragon(ctx,t,S,opt){ const F=frame(S), w0=opt.w||46, A=opt.a??1, part=opt.part||(()=>NONE), lit=opt.lit??2, col=opt.col||GOLD;
  if(A<=0.01) return; const n=NS; const Wd=i=>w0*prof(i/(n-1));
  const pt=(i,v)=>{ const f=F[i], w=Wd(i)*v; return [f.x+f.nx*w,f.y+f.ny*w]; }; // v=+1 背，v=-1 腹
  const deferred=[]; const el=(name,fn)=>{ const p=part(name); if(p.a<=0.01) return; if(p.dx===0&&p.dy===0&&p.a>=1) fn(); else deferred.push([p,fn]); };
  const drawK=opt.draw??1, iEnd=Math.max(2,Math.round((n-1)*drawK));
  ctx.save(); ctx.globalAlpha=A; ctx.lineCap='round'; ctx.lineJoin='round';
  const g=c=>rgba(col,c), gw=c=>rgba(WARM,c);
  // 腿：挂在身段上；u、前后（front=朝头）、远近（far 先画、更暗）
  const LEGS=[[0.21,1,1],[0.25,1,0],[0.58,0,1],[0.62,0,0]];
  const legAt={}; LEGS.forEach(L=>{ legAt[Math.round(L[0]*(n-1))]=L; });
  const drawLeg=(L)=>{ const [u,front,far]=L, i=Math.round(u*(n-1)), f=F[i], w=Wd(i)*1.4, b=pt(i,-0.55);
    const out=[-f.nx,-f.ny], fw=[-f.tx,-f.ty], bk=[f.tx,f.ty], ph=t*2.0+i*0.3, grip=0.5+0.5*Math.sin(ph);
    const dirA=front?[out[0]*0.75+fw[0]*0.7,out[1]*0.75+fw[1]*0.7]:[out[0]*0.7+bk[0]*0.75,out[1]*0.7+bk[1]*0.75];
    const elbow=[b[0]+dirA[0]*w*1.65,b[1]+dirA[1]*w*1.65];
    const dirB=front?[fw[0]*0.9+out[0]*0.45,fw[1]*0.9+out[1]*0.45]:[out[0]*0.95-bk[0]*0.25,out[1]*0.95-bk[1]*0.25];
    const wr=[elbow[0]+dirB[0]*w*1.35+Math.sin(ph)*w*0.06,elbow[1]+dirB[1]*w*1.35];
    const fade=far?0.55:1;
    // 粗壮的腿：两段锥形
    const limb=(p0,p1,r0,r1)=>{ const dx=p1[0]-p0[0], dy=p1[1]-p0[1], l=Math.hypot(dx,dy)||1, nx=-dy/l, ny=dx/l; ctx.beginPath(); ctx.moveTo(p0[0]+nx*r0,p0[1]+ny*r0);
      ctx.quadraticCurveTo((p0[0]+p1[0])/2+nx*(r0+r1)*0.62,(p0[1]+p1[1])/2+ny*(r0+r1)*0.62,p1[0]+nx*r1,p1[1]+ny*r1); ctx.lineTo(p1[0]-nx*r1,p1[1]-ny*r1);
      ctx.quadraticCurveTo((p0[0]+p1[0])/2-nx*(r0+r1)*0.55,(p0[1]+p1[1])/2-ny*(r0+r1)*0.55,p0[0]-nx*r0,p0[1]-ny*r0); ctx.closePath(); ctx.fillStyle=BODY; ctx.fill(); ctx.strokeStyle=g(0.9*fade); ctx.lineWidth=2.2; ctx.stroke();
      for(let k=1;k<4;k++){ const q=[lerp(p0[0],p1[0],k/4),lerp(p0[1],p1[1],k/4)], r=lerp(r0,r1,k/4)*0.7; ctx.beginPath(); ctx.arc(q[0],q[1],r,Math.atan2(dy,dx)-1.2,Math.atan2(dy,dx)+1.2); ctx.strokeStyle=g(0.35*fade); ctx.lineWidth=1.1; ctx.stroke(); } };
    el('palm',()=>{ limb(b,elbow,w*0.5,w*0.36); limb(elbow,wr,w*0.34,w*0.24);
      // 肘后火焰毛
      for(let k=0;k<4;k++){ const L2=w*(0.9+0.25*k), sw=Math.sin(t*2.6+k+i)*0.25, d=[bk[0]*0.8+out[0]*(0.2-k*0.18),bk[1]*0.8+out[1]*(0.2-k*0.18)];
        ctx.beginPath(); ctx.moveTo(elbow[0],elbow[1]); ctx.quadraticCurveTo(elbow[0]+d[0]*L2*0.5-out[1]*sw*w,elbow[1]+d[1]*L2*0.5+out[0]*sw*w,elbow[0]+d[0]*L2+out[0]*sw*w*0.6,elbow[1]+d[1]*L2+out[1]*sw*w*0.6); ctx.strokeStyle=g(0.7*fade); ctx.lineWidth=1.6; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(wr[0],wr[1],w*0.24,0,TAU); ctx.fillStyle=BODY; ctx.fill(); ctx.strokeStyle=g(0.9*fade); ctx.lineWidth=2; ctx.stroke(); });
    // 五爪：张开如扇，每趾两节，末端弯钩
    el('claw',()=>{ const base=Math.atan2(dirB[1],dirB[0]); for(let k=-2;k<=2;k++){ const an=base+k*(0.42+0.12*grip)*(k===-2?1.3:1), L1=w*0.42, L2=w*0.36;
        const p1=[wr[0]+Math.cos(an)*L1,wr[1]+Math.sin(an)*L1], an2=an+(front?0.5:-0.5)*grip*0.6, p2=[p1[0]+Math.cos(an2)*L2,p1[1]+Math.sin(an2)*L2];
        ctx.strokeStyle=g(0.95*fade); ctx.lineWidth=w*0.12; ctx.beginPath(); ctx.moveTo(wr[0],wr[1]); ctx.lineTo(p1[0],p1[1]); ctx.lineTo(p2[0],p2[1]); ctx.stroke();
        const an3=an2+(front?1.3:-1.3), tip=[p2[0]+Math.cos(an2)*w*0.22+Math.cos(an3)*w*0.18,p2[1]+Math.sin(an2)*w*0.22+Math.sin(an3)*w*0.18];
        ctx.strokeStyle=gw(fade); ctx.lineWidth=w*0.07; ctx.beginPath(); ctx.moveTo(p2[0],p2[1]); ctx.quadraticCurveTo(p2[0]+Math.cos(an2)*w*0.3,p2[1]+Math.sin(an2)*w*0.3,tip[0],tip[1]); ctx.stroke(); } }); };
  // 远侧的腿先画
  LEGS.filter(L=>L[2]).forEach(L=>{ if(Math.round(L[0]*(n-1))<=iEnd) drawLeg(L); });
  // 尾鳍
  if(drawK>=1) el('body',()=>{ const f=F[n-1], w=w0*0.95; for(let j=-2;j<=2;j++){ const L=w*(2.3-Math.abs(j)*0.35), sw=Math.sin(t*2.5+j*0.8)*0.3, sp=j*0.42+sw*0.4;
      const e=[f.x+f.tx*L+f.nx*sp*w,f.y+f.ty*L+f.ny*sp*w], m1=[f.x+f.tx*L*0.45+f.nx*(sp*0.5+0.28)*w,f.y+f.ty*L*0.45+f.ny*(sp*0.5+0.28)*w], m2=[f.x+f.tx*L*0.45+f.nx*(sp*0.5-0.28)*w,f.y+f.ty*L*0.45+f.ny*(sp*0.5-0.28)*w];
      ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.quadraticCurveTo(m1[0],m1[1],e[0],e[1]); ctx.quadraticCurveTo(m2[0],m2[1],f.x,f.y); ctx.fillStyle=g(0.16); ctx.fill(); ctx.strokeStyle=g(0.85); ctx.lineWidth=1.8; ctx.stroke(); } });
  // 身体：由尾到头逐节
  for(let i=Math.min(iEnd,n-2);i>=0;i--){ const u=i/(n-1), neck=u<0.13, pname=neck?'neck':'body';
    const a0=pt(i,1),a1=pt(i+1,1),b0=pt(i,-1),b1=pt(i+1,-1);
    el(pname,()=>{ ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...a1); ctx.lineTo(...b1); ctx.lineTo(...b0); ctx.closePath(); ctx.fillStyle=BODY; ctx.fill(); ctx.strokeStyle=BODY; ctx.lineWidth=1.5; ctx.stroke();
      ctx.strokeStyle=g(0.95); ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...a1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(...b0); ctx.lineTo(...b1); ctx.stroke();
      // 背鳍：火焰形，向尾部扫
      if(i%3===0&&u<0.93){ const f=F[i], w=Wd(i), h=w*(0.62+0.18*Math.sin(i*1.3)), sw=Math.sin(t*2+i*0.4)*0.12, c=pt(Math.min(n-1,i+2),1);
        const tip=[a0[0]+f.nx*h+f.tx*w*(0.55+sw),a0[1]+f.ny*h+f.ty*w*(0.55+sw)];
        ctx.beginPath(); ctx.moveTo(...a0); ctx.quadraticCurveTo(a0[0]+f.nx*h*0.8-f.tx*w*0.05,a0[1]+f.ny*h*0.8-f.ty*w*0.05,tip[0],tip[1]); ctx.quadraticCurveTo(c[0]+f.nx*h*0.25,c[1]+f.ny*h*0.25,c[0],c[1]);
        ctx.fillStyle=g(0.18); ctx.fill(); ctx.strokeStyle=g(0.85); ctx.lineWidth=1.6; ctx.stroke(); }
      // 背脊高光
      const m0=pt(i,0.62), m1=pt(i+1,0.62); ctx.strokeStyle=g(0.22); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(...m0); ctx.lineTo(...m1); ctx.stroke(); });
    // 腹甲带：腹面一条浅金色带，一节一节的横甲
    el(neck?'neck':'belly',()=>{ const c0=pt(i,-0.42), c1=pt(i+1,-0.42); ctx.beginPath(); ctx.moveTo(...b0); ctx.lineTo(...b1); ctx.lineTo(...c1); ctx.lineTo(...c0); ctx.closePath(); ctx.fillStyle=g(0.13); ctx.fill();
      ctx.strokeStyle=g(0.5); ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(...c0); ctx.lineTo(...c1); ctx.stroke();
      if(i%2===0){ const f=F[i], w=Wd(i); ctx.beginPath(); ctx.moveTo(...b0); ctx.quadraticCurveTo(b0[0]+f.nx*w*0.3+f.tx*w*0.12,b0[1]+f.ny*w*0.3+f.ty*w*0.12,c0[0],c0[1]); ctx.strokeStyle=g(0.55); ctx.lineWidth=1.2; ctx.stroke(); } });
    // 鳞：一排排鱼鳞，凸面朝尾，错位排列
    if(!neck&&i%2===0&&u<0.95) el('scales',()=>{ const f=F[i], w=Wd(i), ang=Math.atan2(f.ty,f.tx), row=(i/2)%2, r=w*0.2;
      for(let v=-0.25+row*0.18;v<0.92;v+=0.36){ const c=pt(i,v), on=u<lit?1:0, fl=Math.exp(-Math.pow((lit-u)*16,2));
        ctx.beginPath(); ctx.arc(c[0],c[1],r,ang-Math.PI/2,ang+Math.PI/2); ctx.strokeStyle=on?gw(0.7+0.3*fl):g(0.5+0.5*fl); ctx.lineWidth=1.5+fl; ctx.stroke(); if(fl>0.35) glow(ctx,c[0],c[1],r*2.4,WARM,0.45*fl); } });
    if(legAt[i]&&!legAt[i][2]) drawLeg(legAt[i]); }
  // ───── 头（局部坐标：x 朝前，-y 朝上；单位约 1 px × hs）─────
  const f0=F[0]; let hx=-f0.tx, hy=-f0.ty; const tilt=opt.tilt??-0.32; { const c=Math.cos(tilt*(hx<0?-1:1)), s=Math.sin(tilt*(hx<0?-1:1)); const x=hx*c-hy*s, y=hx*s+hy*c; hx=x; hy=y; }
  const hs=w0/34, flip=hx<0?-1:1, jaw=0.32+0.08*Math.sin(t*1.7);
  const head=(name,fn)=>el(name,()=>{ ctx.save(); ctx.translate(f0.x-hx*w0*0.15,f0.y-hy*w0*0.15); ctx.transform(hx*hs,hy*hs,-hy*hs*flip,hx*hs*flip,0,0); ctx.lineWidth=2.2/hs; fn(); ctx.restore(); });
  const sk=(a)=>{ ctx.strokeStyle=g(a); }, LW=v=>{ ctx.lineWidth=v/hs; };
  head('head',()=>{ // 鬃毛：先画几条填充的火焰舌，再画一束束细毛
    for(let k=0;k<7;k++){ const s0=k/6, x0=lerp(40,-4,s0), y0=lerp(-56,26,s0), L=170+50*Math.sin(k*2.3), ph=t*2.2+k*0.9, dy=(s0-0.4)*120, w2=16+8*Math.sin(k);
      const e=[x0-L,y0+dy+Math.sin(ph+2)*22]; ctx.beginPath(); ctx.moveTo(x0,y0-w2); ctx.bezierCurveTo(x0-L*0.4,y0-w2+dy*0.3+Math.sin(ph)*16,x0-L*0.75,y0+dy*0.8-Math.sin(ph+1)*20-w2*0.4,e[0],e[1]);
      ctx.bezierCurveTo(x0-L*0.7,y0+dy*0.75-Math.sin(ph+1)*20+w2*0.5,x0-L*0.35,y0+w2+dy*0.3+Math.sin(ph)*16,x0,y0+w2); ctx.closePath(); ctx.fillStyle=g(0.12); ctx.fill(); sk(0.8); LW(1.8); ctx.stroke(); }
    for(let k=0;k<13;k++){ const s0=k/12, x0=lerp(34,-6,s0), y0=lerp(-52,30,s0), L=150+60*Math.sin(k*1.9)+40*(1-Math.abs(s0-0.4)), ph=t*2.4+k*0.8, dy=(s0-0.45)*90;
      ctx.beginPath(); ctx.moveTo(x0,y0); ctx.bezierCurveTo(x0-L*0.35,y0+dy*0.3+Math.sin(ph)*14,x0-L*0.7,y0+dy*0.8-Math.sin(ph+1)*18,x0-L,y0+dy+Math.sin(ph+2)*20);
      sk(0.75); LW(k%3===0?2.6:1.6); ctx.stroke(); }
    // 下颌（张开）
    ctx.save(); ctx.translate(66,-2); ctx.rotate(jaw); ctx.translate(-66,2);
    ctx.beginPath(); ctx.moveTo(66,-2); ctx.lineTo(150,10); ctx.bezierCurveTo(170,12,184,22,182,34); ctx.bezierCurveTo(178,46,160,50,140,48); ctx.bezierCurveTo(110,46,70,38,40,30); ctx.lineTo(14,22); ctx.closePath();
    ctx.fillStyle=BODY; ctx.fill(); sk(0.95); LW(2.4); ctx.stroke();
    for(let k=0;k<6;k++){ const x=80+k*12, y=lerp(0,9,(x-66)/84); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+4,y-8); ctx.lineTo(x+8,y+1); ctx.strokeStyle=gw(0.9); LW(1.5); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(142,10); ctx.quadraticCurveTo(150,-6,152,-22); ctx.quadraticCurveTo(156,-4,152,12); ctx.fillStyle=gw(0.95); ctx.fill(); // 下獠牙
    // 须髯
    for(let k=0;k<5;k++){ ctx.beginPath(); const x0=120+k*12, y0=46; ctx.moveTo(x0,y0); ctx.bezierCurveTo(x0-10,y0+30,x0-40+Math.sin(t*2+k)*8,y0+60,x0-70-k*6,y0+90+Math.sin(t*2.2+k)*10); sk(0.6); LW(1.4); ctx.stroke(); }
    ctx.restore();
    // 口腔与卷舌
    ctx.beginPath(); ctx.moveTo(66,-2); ctx.lineTo(196,-18); ctx.lineTo(150+30*Math.sin(jaw),10+70*Math.sin(jaw)); ctx.closePath(); ctx.fillStyle='rgba(70,14,10,0.9)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(90,10); ctx.bezierCurveTo(140,22,190,14,220,-4); ctx.bezierCurveTo(232,-12,228,-26,216,-24); ctx.bezierCurveTo(208,-22,208,-12,216,-10); ctx.strokeStyle=rgba([230,120,90],0.9); LW(3.2); ctx.stroke();
    // 上颌与头骨
    ctx.beginPath(); ctx.moveTo(0,-38); ctx.bezierCurveTo(20,-60,52,-72,84,-74); ctx.bezierCurveTo(102,-76,114,-66,124,-58); ctx.bezierCurveTo(142,-52,158,-56,170,-64);
    ctx.bezierCurveTo(190,-76,214,-64,212,-44); ctx.bezierCurveTo(211,-32,202,-24,196,-18); ctx.lineTo(120,-10); ctx.lineTo(66,-2); ctx.bezierCurveTo(42,4,18,12,0,16); ctx.closePath();
    ctx.fillStyle=BODY; ctx.fill(); sk(0.98); LW(2.6); ctx.stroke();
    for(let k=0;k<7;k++){ const x=126+k*10, y=lerp(-10,-17,(x-120)/76); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+4,y+8); ctx.lineTo(x+8,y); ctx.strokeStyle=gw(0.9); LW(1.5); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(182,-17); ctx.quadraticCurveTo(186,0,180,14); ctx.quadraticCurveTo(178,0,174,-16); ctx.fillStyle=gw(0.95); ctx.fill(); // 上獠牙
    // 如意鼻：鼻头一个回卷
    ctx.beginPath(); ctx.arc(192,-50,9,Math.PI*0.2,Math.PI*1.8); ctx.moveTo(176,-66); ctx.quadraticCurveTo(170,-48,184,-40); sk(0.85); LW(1.8); ctx.stroke();
    // 腮边火焰
    for(let k=0;k<4;k++){ const y0=4+k*8, sw=Math.sin(t*2.8+k)*6; ctx.beginPath(); ctx.moveTo(50,y0); ctx.quadraticCurveTo(20,y0+10+k*6,-26-k*8,y0+20+k*10+sw); sk(0.7); LW(1.6); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(40,-20); ctx.bezierCurveTo(70,-34,100,-30,128,-30); sk(0.55); LW(1.4); ctx.stroke(); // 颧骨
    ctx.beginPath(); ctx.moveTo(126,-56); ctx.bezierCurveTo(146,-50,160,-46,176,-48); sk(0.5); LW(1.2); ctx.stroke(); // 鼻梁
    for(let k=0;k<5;k++){ ctx.beginPath(); ctx.arc(14+k*13,-30+k*1,7,-Math.PI*0.9,-Math.PI*0.1); sk(0.4); LW(1.1); ctx.stroke(); } // 头后小鳞
    // 头顶纹
    ctx.beginPath(); ctx.moveTo(30,-50); ctx.quadraticCurveTo(70,-60,110,-56); sk(0.4); LW(1.2); ctx.stroke();
    // 须：两根长须，一根向上后扫，一根向下后飘
    for(const [x0,y0,dir] of [[196,-36,-1],[188,-26,1]]){ LW(2.6); ctx.beginPath(); ctx.moveTo(x0,y0); for(let k=1;k<=34;k++){ const s=k/34, x=x0+70*Math.sin(s*Math.PI*0.9)-s*330, y=y0+dir*(s*120)+Math.sin(t*2.4+k*0.32)*22*s; ctx.lineTo(x,y); } sk(0.9); ctx.stroke(); } });
  head('ear',()=>{ ctx.beginPath(); ctx.moveTo(30,-46); ctx.quadraticCurveTo(-2,-92,-40,-88); ctx.quadraticCurveTo(-8,-66,24,-36); ctx.fillStyle=BODY; ctx.fill(); sk(0.9); LW(2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22,-48); ctx.quadraticCurveTo(0,-74,-24,-80); sk(0.45); LW(1.2); ctx.stroke(); });
  head('horn',()=>{ const sw=Math.sin(t*1.3)*3;
    for(const [ox,oy,al] of [[16,6,0.45],[0,0,1]]){ ctx.save(); ctx.translate(ox,oy); sk(0.95*al); ctx.lineCap='round';
      LW(5); ctx.beginPath(); ctx.moveTo(66,-70); ctx.bezierCurveTo(40,-128,-20,-150,-110+sw,-196); ctx.stroke();
      LW(3.2); for(const [x0,y0,x1,y1] of [[28,-122,40,-178],[-24,-150,-14,-212],[-70,-172,-86,-226]]){ ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo((x0+x1)/2+10,(y0+y1)/2,x1+sw,y1); ctx.stroke(); }
      ctx.restore(); } });
  head('eye',()=>{ // 粗眉压眼，眉毛如火向后
    for(let k=0;k<4;k++){ ctx.beginPath(); ctx.moveTo(122-k*6,-62-k*2); ctx.bezierCurveTo(100-k*8,-86-k*6,60-k*10,-96-k*8,24-k*12,-100-k*6+Math.sin(t*2+k)*6); sk(0.85); LW(k?1.6:2.6); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(106,-48,15,10,-0.28,0,TAU); ctx.fillStyle=gw(0.92); ctx.fill(); sk(1); LW(2); ctx.stroke();
    ctx.beginPath(); ctx.arc(110,-48,5.5,0,TAU); ctx.fillStyle='#0a0a0a'; ctx.fill(); ctx.globalCompositeOperation='lighter'; glow(ctx,106,-48,30,WARM,0.8); glow(ctx,104,-51,3,WHITE,1); });
  // 拼装中尚未到位的部件：带位移画在最上面
  for(const [p,fn] of deferred){ ctx.save(); ctx.translate(p.dx,p.dy); ctx.globalAlpha=A*p.a; fn(); ctx.restore(); }
  ctx.restore();
  return {head:[f0.x,f0.y],dir:[hx,hy],hs}; }
// 火珠：龙戏珠
function pearl(ctx,t,x,y,r,a){ if(a<=0.01) return; ctx.save(); ctx.globalAlpha=a; ctx.globalCompositeOperation='lighter'; glow(ctx,x,y,r*4,[255,170,90],0.55); glow(ctx,x,y,r*1.6,WARM,0.9);
  ctx.globalCompositeOperation='source-over'; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,0,x,y,r); g.addColorStop(0,'rgba(255,250,230,0.95)'); g.addColorStop(1,'rgba(255,190,110,0.6)'); ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(255,212,140,0.9)'; ctx.lineWidth=1.6; ctx.beginPath(); for(let k=0;k<=60;k++){ const a2=k/60*TAU*1.5+t*1.5, rr=r*(0.15+0.75*k/60); k?ctx.lineTo(x+Math.cos(a2)*rr,y+Math.sin(a2)*rr):ctx.moveTo(x,y); } ctx.stroke();
  for(let k=0;k<9;k++){ const an=k/9*TAU+t*0.8, L=r*(1.7+0.5*Math.sin(t*3+k)), sw=Math.sin(t*2.5+k)*0.4; ctx.beginPath(); ctx.moveTo(x+Math.cos(an)*r,y+Math.sin(an)*r);
    ctx.quadraticCurveTo(x+Math.cos(an+0.3)*L*0.8,y+Math.sin(an+0.3)*L*0.8,x+Math.cos(an+0.5+sw)*L,y+Math.sin(an+0.5+sw)*L); ctx.strokeStyle='rgba(255,180,100,0.75)'; ctx.lineWidth=2; ctx.stroke(); }
  ctx.restore(); }
// 祥云：卷云纹（一个主卷 + 两个小卷 + 云尾）
function cloudScroll(ctx,x,y,s,a,t,mir=1){ if(a<=0.01) return; ctx.save(); ctx.translate(x,y); ctx.scale(s*mir,s); ctx.globalAlpha=a;
  const spiral=(cx,cy,r,turn)=>{ ctx.beginPath(); for(let k=0;k<=48;k++){ const q=k/48, an=-Math.PI/2+q*TAU*turn, rr=r*(1-q*0.8); k?ctx.lineTo(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr):ctx.moveTo(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr); } ctx.stroke(); };
  ctx.beginPath(); ctx.moveTo(-110,30); ctx.bezierCurveTo(-120,-20,-60,-46,-20,-30); ctx.bezierCurveTo(0,-70,70,-70,80,-20); ctx.bezierCurveTo(120,-20,130,30,100,30); ctx.closePath(); ctx.fillStyle='rgba(9,12,22,0.92)'; ctx.fill();
  ctx.strokeStyle='rgba(255,212,140,0.8)'; ctx.lineWidth=2/s; ctx.stroke(); ctx.lineWidth=1.6/s; spiral(28,-22,30,1.4); spiral(-56,-10,22,1.2); spiral(96,6,14,1.1);
  ctx.beginPath(); ctx.moveTo(100,30); ctx.bezierCurveTo(160,36,200,10,250+Math.sin(t)*10,26); ctx.stroke(); ctx.restore(); }

// ───────── 环境：金尘、云 ─────────
const DUST=(()=>{const r=rng(5);return Array.from({length:420},()=>({x:r()*W,y:r()*H,z:0.2+r()*0.8,ph:r()*6.28,f:0.4+r()*1.2,b:r()}));})();
function dust(ctx,t,a){ ctx.save(); ctx.globalCompositeOperation='lighter'; for(const d of DUST){ const x=(d.x+t*8*d.z+Math.sin(t*0.3+d.ph)*20+W)%W, y=(d.y-t*14*d.z+H*10)%H, tw=0.5+0.5*Math.sin(t*d.f+d.ph);
  const al=a*(0.12+0.4*d.b)*tw*d.z; if(d.b>0.85) glow(ctx,x,y,6*d.z,GOLD,al); else { ctx.fillStyle=rgba(GOLD,al); ctx.fillRect(x,y,1.6*d.z,1.6*d.z); } } ctx.restore(); }
const CLOUD=(()=>{const r=rng(9);return Array.from({length:26},()=>({x:r()*W,y:r()*H,r:220+r()*360,v:6+r()*14,ph:r()*6.28}));})();
function clouds(ctx,t,a,col=[40,52,86]){ if(a<=0.01) return; for(const c of CLOUD){ const x=(c.x+t*c.v+W*2)%(W+800)-400, y=c.y+Math.sin(t*0.2+c.ph)*30; const g=ctx.createRadialGradient(x,y,0,x,y,c.r); g.addColorStop(0,rgba(col,0.22*a)); g.addColorStop(1,rgba(col,0)); ctx.fillStyle=g; ctx.fillRect(x-c.r,y-c.r,c.r*2,c.r*2); } }

// ───────── 字 ─────────
// 模糊聚焦入场（庄重型 15 帧）；退场 9 帧上提淡出；落地后静止
function say(ctx,t,txt,x,y,size,a0,a1,o={}){ const tin=o.tin??0.5, tout=o.tout??0.3; if(t<a0||t>a1) return; const ki=ease(P(t,a0,a0+tin)), ko=P(t,a1-tout,a1);
  const a=ki*(1-ko); if(a<=0.01) return; ctx.save(); ctx.font=`${o.w||400} ${size}px ${o.font||DISP}`; ctx.textAlign=o.align||'center'; ctx.textBaseline='middle';
  const blur=(1-ki)*10; if(blur>0.3) ctx.filter=`blur(${blur.toFixed(1)}px)`; ctx.globalAlpha=a; ctx.fillStyle=o.col||'#f4ead8';
  ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=18; ctx.fillText(txt,x,y-ko*18+(1-ki)*6); ctx.restore(); }
// 逐字弹入（冲击型：每字 2 帧错开，8 帧落地，带一点过冲）
function pop(ctx,t,txt,x,y,size,a0,a1,o={}){ if(t<a0||t>a1) return; const ch=[...txt]; ctx.save(); ctx.font=`400 ${size}px ${o.font||DISP}`; ctx.textBaseline='middle';
  const wid=ch.map(c=>ctx.measureText(c).width), tot=wid.reduce((s,v)=>s+v,0); let cx=x-tot/2; const ko=P(t,a1-0.25,a1);
  ch.forEach((c,i)=>{ const k=P(t,a0+i*0.066,a0+i*0.066+0.27); if(k>0){ const s=k<1?1+0.18*Math.sin(Math.PI*k)*(1-k)+ (1-expo(k))*-0.4:1; ctx.save(); ctx.translate(cx+wid[i]/2,y); ctx.scale(s,s);
    ctx.globalAlpha=clamp(k*3,0,1)*(1-ko); ctx.fillStyle=o.col||'#f4ead8'; ctx.shadowColor=o.glow||'rgba(255,190,110,0.55)'; ctx.shadowBlur=26; ctx.textAlign='center'; ctx.fillText(c,0,0); ctx.restore(); } cx+=wid[i]; });
  ctx.restore(); }
const src=(ctx,t,txt,y,a0,a1)=>say(ctx,t,txt,540,y,30,a0,a1,{font:SANS,w:700,col:'rgba(255,214,150,0.8)',tin:0.45});

// ───────── 0 开场 / 1 蚌壳 / 2 玉 C / 3 绿松石 ─────────
const SH=(()=>{const r=rng(21),s=[]; for(let i=0;i<760;i++){ const u=Math.pow(r(),0.9), v=(r()*2-1); s.push({u,v,sx:r()*W,sy:r()*H*0.4-300,rot:r()*TAU,len:5+r()*5,ph:r()});}
  // 头（抬起）与四条短腿：用额外的偏移点
  for(let i=0;i<120;i++){ const a=r()*TAU, rr=Math.sqrt(r()); s.push({u:0,v:0,ox:-30+Math.cos(a)*rr*46,oy:-60+Math.sin(a)*rr*34,sx:r()*W,sy:r()*H*0.4-300,rot:r()*TAU,len:5+r()*5,ph:r()}); }
  for(const [u,sd] of [[0.2,1],[0.27,1],[0.62,1],[0.7,1]]) for(let i=0;i<22;i++){ const k=i/21; s.push({u,v:0,ox:-k*26,oy:34+k*58,sx:r()*W,sy:r()*H*0.4-300,rot:r()*TAU,len:5+r()*4,ph:r()}); }
  return s;})();
const TILES=(()=>{const r=rng(23),s=[]; for(let i=0;i<80;i++) for(let j=0;j<25;j++) s.push({u:i/79,v:(j+0.5)/25*2-1,jit:r(),sw:r()*TAU,rad:200+r()*500}); return s;})();
function scenePre(ctx,t){
  // 蚌壳：从上方落下，按龙身从头到尾摆好
  const S1=spineShell(t), F1=frame(S1), SC=spineC(t), FC=frame(SC), ST=spineTurq(t), FT=frame(ST);
  if(t>=T.shell-0.5&&t<T.jade+2.2){ const morph=eIO(P(t,T.jade,T.jade+1.6)), fade=1-P(t,T.jade+1.1,T.jade+2.0);
    ctx.save(); for(const s of SH){ const ta=T.shell+0.3+s.u*2.4+s.ph*0.35, k=ease(P(t,ta-1.0,ta)); if(k<=0) continue;
      const p1=at(F1,s.u,s.v*0.92,34).map((v,j)=>v+(j?s.oy||0:s.ox||0)), pc=at(FC,s.u,s.v*0.92,46), tx=lerp(p1[0],pc[0],morph), ty=lerp(p1[1],pc[1],morph);
      const x=lerp(s.sx,tx,k), y=lerp(s.sy,ty,k), col=[lerp(SHELL[0],JADE[0],morph),lerp(SHELL[1],JADE[1],morph),lerp(SHELL[2],JADE[2],morph)];
      ctx.save(); ctx.translate(x,y); ctx.rotate(s.rot+(1-k)*3); ctx.fillStyle=rgba(col,0.85*fade*Math.min(1,k*2)); ctx.beginPath(); ctx.ellipse(0,0,s.len,s.len*0.62,0,0,TAU); ctx.fill(); ctx.restore(); }
    ctx.restore(); }
  // 玉龙：贝壳化成一整块玉
  const jA=sm(P(t,T.jade+0.9,T.jade+1.9))*(1-P(t,T.turq,T.turq+0.25));
  if(jA>0.01){ ctx.save(); ctx.globalAlpha=jA; const L=[],R=[]; for(let i=0;i<NS;i++){ const u=i/(NS-1), tp=u<0.72?1:Math.pow(1-(u-0.72)/0.28,0.7)+0.04; L.push(at(FC,u,tp,46)); R.push(at(FC,u,-tp,46)); }
    ctx.beginPath(); L.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p)); for(let i=NS-1;i>=0;i--) ctx.lineTo(...R[i]); ctx.closePath();
    const g=ctx.createLinearGradient(300,560,820,1040); g.addColorStop(0,'rgba(60,110,90,0.9)'); g.addColorStop(0.5,'rgba(110,170,135,0.85)'); g.addColorStop(1,'rgba(40,80,70,0.9)'); ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle=rgba(GOLD,0.9); ctx.lineWidth=2.4; ctx.stroke();
    // 红山玉龙的长鬣：从头顶向后飘
    const f=FC[0]; ctx.strokeStyle=rgba(GOLD,0.85); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(f.x+f.nx*30,f.y+f.ny*30); ctx.quadraticCurveTo(f.x+f.nx*120+f.tx*60,f.y+f.ny*120+f.ty*60,f.x+f.nx*90+f.tx*190,f.y+f.ny*90+f.ty*190); ctx.stroke();
    ctx.globalCompositeOperation='lighter'; glow(ctx,f.x+f.tx*-6+f.nx*-8,f.y+f.ty*-6+f.ny*-8,14,WARM,0.9);
    // 玉的光泽：一道扫光沿身体走一遍（#022）
    const ks=P(t,T.jade+2.2,T.jade+3.6); if(ks>0&&ks<1){ const p=FC[Math.round(ks*(NS-1))]; glow(ctx,p.x,p.y,120,[200,255,220],0.35*Math.sin(Math.PI*ks)); }
    ctx.restore(); }
  // 绿松石：2000 片，从玉龙身上剥落，一片片贴成一条长龙；24 秒后被卷成漩涡吸进中心
  if(t>=T.turq-0.1&&t<T.dark+0.5){ ctx.save(); const sw=eIO(P(t,T.ask,T.dark)); ctx.globalCompositeOperation='lighter';
    for(const s of TILES){ const ta=T.turq+0.6+s.u*2.2+s.jit*0.4, k=ease(P(t,ta-1.2,ta)); const pc=at(FC,s.u,s.v*0.95,46), pt=at(FT,s.u,s.v*0.95,40);
      let x=lerp(pc[0],pt[0],k)+Math.sin(Math.PI*k)*Math.cos(s.sw)*70, y=lerp(pc[1],pt[1],k)+Math.sin(Math.PI*k)*Math.sin(s.sw)*70;
      if(sw>0){ const dx=x-540, dy=y-900, r=Math.hypot(dx,dy)*(1-sw)+sw*8, an=Math.atan2(dy,dx)+sw*(4+s.jit*3); x=540+Math.cos(an)*r; y=900+Math.sin(an)*r; }
      const a=(t<T.turq+0.25?P(t,T.turq,T.turq+0.25):1)*(0.55+0.45*Math.sin(t*3+s.sw))*(1-P(t,T.dark,T.dark+0.4));
      ctx.fillStyle=rgba(k>=1&&s.jit<0.2?[150,240,230]:TURQ,a*0.85); const z=4.2*(1-sw*0.6); ctx.save(); ctx.translate(x,y); ctx.rotate(s.sw*0.3+(1-k)*2); ctx.fillRect(-z/2,-z/2,z,z*1.3); ctx.restore(); }
    // 二里头绿松石龙的方头
    const kh=P(t,T.turq+0.6,T.turq+1.2)*(1-sw); if(kh>0){ const f=FT[0]; ctx.strokeStyle=rgba(GOLD,0.85*kh); ctx.lineWidth=2.4; ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(Math.atan2(f.ty,f.tx)+Math.PI); ctx.strokeRect(-6,-46,70,92);
      glow(ctx,30,-20,12,WARM,kh); glow(ctx,30,20,12,WARM,kh); ctx.restore(); }
    // 中心的亮核
    if(sw>0){ glow(ctx,540,900,40+160*sw,WARM,0.8*sw*(1-P(t,T.dark,T.drop))); }
    ctx.restore(); } }

// ───────── 4 九似 ─────────
// Motion Prompt #143 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#143  分解图 Exploded view：九个部件从四周飞回，按顺序装上
// Motion Prompt #003 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#003  迸发 Burst：drop 那一帧，中心亮核炸开一圈环和射线
// Motion Prompt #004 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#004  描线 Line draw：龙身先描出一条线
const NINE=[['horn','角','鹿'],['head','头','驼'],['eye','眼','鬼'],['neck','项','蛇'],['belly','腹','蜃'],['scales','鳞','鱼'],['claw','爪','鹰'],['palm','掌','虎'],['ear','耳','牛']];
const nineT=i=>T.nine[0]+i*T.nine[1];
function ninePart(t){ return name=>{ if(name==='body') return NONE; const i=NINE.findIndex(n=>n[0]===name); const t0=nineT(i), k=expo(P(t,t0-0.45,t0)); const an=i*0.7+0.4, d=1100*(1-k);
  return {dx:Math.cos(an)*d,dy:Math.sin(an)*d,a:P(t,t0-0.45,t0-0.25)}; }; }
function burst(ctx,t,t0,x,y,s=1){ const kb=P(t,t0,t0+0.6); if(kb<=0||kb>=1) return; const e=expo(kb); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=rgba(WARM,(1-kb)*0.85); ctx.lineWidth=3*(1-kb)+1;
  ctx.beginPath(); ctx.arc(x,y,(30+560*e)*s,0,TAU); ctx.stroke(); for(let i=0;i<20;i++){ const an=i/20*TAU+0.15, r0=(50+260*e)*s, r1=(80+640*e)*s; ctx.strokeStyle=rgba(GOLD,(1-kb)*0.7); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+Math.cos(an)*r0,y+Math.sin(an)*r0); ctx.lineTo(x+Math.cos(an)*r1,y+Math.sin(an)*r1); ctx.stroke(); }
  glow(ctx,x,y,(220*(1-kb)+30)*s,WHITE,(1-kb)*0.7); ctx.restore(); }

// ───────── 合成 ─────────
// ── 三维段落：脊线与相机 ──
const WATER_Y=1170, CY=960;
const PATH3=(()=>{ const K=[]; for(let tt=28;tt<=42.6;tt+=0.2){ const a=1.35*(tt-28); K.push([tt,470*Math.sin(a),-60+520*Math.sin(a*0.62+1),380*Math.cos(a)]); }
  K.push([43.4,520,520,0],[44.3,-150,500,-60],[45.0,-560,300,0],[45.6,-420,60,40],[46.3,0,-300,0],[47.0,260,-700,-40],[47.7,200,-1150,0],[48.4,120,-1700,0],[49.5,60,-2600,0]); return K; })();
function spine3At(t){ if(t<T.fly) return poseHero(t);
  if(t<T.end){ const f=poseFollow(t,PATH3,3.1); const k=eIO(P(t,T.fly,T.fly+1.0)); return k<1?mix3(poseHero(t),f,k):f; }
  return mix3(poseFollow(Math.min(t,48.2),PATH3,3.1),poseRing(t),eIO(P(t,T.end,T.end+2.4))); }
function cam3At(t,S){ let o={yaw:0,pitch:0.06,D:1800,f:1500,cx:540,cy:CY,tgt:[0,0,0]};
  if(t<T.fly) o.yaw=lerp(-0.45,0.35,eIO(P(t,T.drop,T.fly)));
  else if(t<T.end){ o.yaw=lerp(0.35,0,eIO(P(t,T.fly,T.fly+1.5)));
    if(t>=36.2&&t<40.6){ const k1=eIO(P(t,36.2,37.4)), k2=eIO(P(t,38.0,39.0)); o.D=lerp(1800,9000,k1); if(t>=38.0){ const mid=S[Math.round(S.length*0.4)]; o.D=lerp(9000,560,k2); o.tgt=mid.map(v=>v*k2); } } }
  else { o.pitch=lerp(0.06,0.32,eIO(P(t,T.end,T.end+2))); o.yaw=lerp(0,0.4,eIO(P(t,T.end,DUR))); }
  return makeCam(o); }
function spineAt(t){ // 27 秒之后龙的脊线
  if(t<T.fly) return spinePose(t);
  if(t<T.end){ const k=eIO(P(t,T.fly,T.fly+0.9)); const f=spineFollow(t); return k<1?mixS(spinePose(t),f,k):f; }
  return mixS(spineFollow(Math.min(t,48.0)),spineEnd(t),eIO(P(t,T.end,T.end+2.2))); }
const OFF=document.createElement('canvas'); OFF.width=W; OFF.height=H;
function render(ctx,t){
  ctx.setTransform(1,0,0,1,0,0); const bg=ctx.createRadialGradient(540,860,0,540,860,1300); bg.addColorStop(0,'#141a2c'); bg.addColorStop(0.55,'#070a14'); bg.addColorStop(1,'#020308'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  // 冲击震屏（#024）
  const sk=Math.max(0,1-(t-T.drop)/0.35)*(t>=T.drop?14:0); ctx.setTransform(1,0,0,1,Math.sin(t*97)*sk,Math.cos(t*83)*sk);
  clouds(ctx,t,t<T.drop?0.6:1);
  const dim=1-0.75*P(t,T.dark,T.drop-0.1)*(t<T.drop?1:0);
  dust(ctx,t,(0.7+0.5*P(t,T.drop,T.drop+0.4))*dim);
  // 开场：一颗巨大的龙头从暗处探出（三维近景）
  if(t<6.4){ const oc=OFF.getContext('2d'); oc.setTransform(1,0,0,1,0,0); oc.clearRect(0,0,W,H); const S=poseHero(t+20), hp=S[0];
    drawDragon3D(oc,t,S,makeCam({yaw:0.75-t*0.05,pitch:0.1,D:900,f:1500,cx:560,cy:1120,tgt:[hp[0]+120,hp[1]+40,hp[2]]}),{R:72,tilt:0.05});
    ctx.save(); ctx.globalAlpha=0.62*(1-P(t,5.0,6.3)); ctx.drawImage(OFF,0,0); ctx.restore(); clouds(ctx,t+40,1.3,[30,40,70]); }
  ctx.globalAlpha=dim; scenePre(ctx,t); ctx.globalAlpha=1;
  if(t>=T.drop){ const S=spine3At(t), cam=cam3At(t, S); let A=1;
    if(t>=39.6&&t<41.2) A=t<40.6?1-eIO(P(t,39.6,40.4)):ease(P(t,40.6,41.2));
    const R=t<T.fly?72:(t<T.end?lerp(72,62,eIO(P(t,T.fly,T.fly+1))):lerp(62,58,eIO(P(t,T.end,T.end+2))));
    const cl=t<T.qian||t>=T.end; if(cl){ cloudScroll(ctx,170+Math.sin(t*0.3)*20,1300,0.9,0.85,t); cloudScroll(ctx,930,640+Math.sin(t*0.25)*14,0.6,0.7,t,-1); }
    const hd=drawDragon3D(ctx,t,S,cam,{R,a:A,part:ninePart(t),draw:eIO(P(t,T.drop,T.drop+0.7)),lit:lerp(-0.1,1.1,P(t,nineT(5),nineT(5)+1.4)),tilt:t>=T.end?0.3:0.05});
    if(hd){ const ke=eIO(P(t,T.end,T.end+2.2)), c0=proj(cam,[0,0,0]); const px=lerp(hd.pearl[0],c0[0],ke), py=lerp(hd.pearl[1],c0[1],ke); pearl(ctx,t,px,py,Math.min(40,24*hd.pearl[3]*1.1),A*P(t,T.drop+0.3,T.drop+1.0)); }
    if(cl) cloudScroll(ctx,880+Math.sin(t*0.2)*16,1380,1.1,0.9,t,-1);
    if(t>=40.6&&t<41.4) burst(ctx,t,40.6,540,860,0.6);
    // 乾卦：水面线
    const wA=win(t,T.qian,48.3,0.5); if(wA>0){ ctx.save(); ctx.strokeStyle=`rgba(170,195,230,${0.45*wA})`; ctx.lineWidth=1.4; for(let k=0;k<5;k++){ const y=WATER_Y+k*16; ctx.beginPath(); for(let x=0;x<=W;x+=20) x?ctx.lineTo(x,y+Math.sin(x*0.02+t*2+k)*3):ctx.moveTo(x,y); ctx.globalAlpha=1-k*0.18; ctx.stroke(); }
      // 潜龙在水下：水面以下再压一层暗色
      ctx.globalAlpha=1; const g=ctx.createLinearGradient(0,WATER_Y,0,WATER_Y+300); g.addColorStop(0,`rgba(5,10,22,${0.55*wA})`); g.addColorStop(1,`rgba(5,10,22,${0.8*wA})`); ctx.fillStyle=g; ctx.fillRect(0,WATER_Y,W,H); ctx.restore(); }
    burst(ctx,t,T.drop,540,CY); }
  ctx.setTransform(1,0,0,1,0,0);
  texts(ctx,t);
  brand(ctx,t);
  const v=ctx.createRadialGradient(540,900,520,540,900,1250); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.5)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  const fo=P(t,DUR-0.6,DUR); if(fo>0){ ctx.fillStyle=`rgba(0,0,0,${fo})`; ctx.fillRect(0,0,W,H); }
}
const win=(t,a,b,f=0.6)=>P(t,a,a+f)*(1-P(t,b-f,b));
function texts(ctx,t){
  // 首帧即钩子
  if(t<3.0){ ctx.save(); ctx.font=`400 150px ${DISP}`; ctx.textAlign='center'; ctx.textBaseline='middle'; const a=1-P(t,2.7,3.0); ctx.globalAlpha=a; ctx.fillStyle='#f4ead8'; ctx.shadowColor='rgba(255,190,110,0.5)'; ctx.shadowBlur=30; ctx.fillText('6000 年',540,520); ctx.restore();
    say(ctx,t,'没有一个人见过龙',540,690,76,-1,3.0,{tin:0.01}); }
  say(ctx,t,'可它，一次也没缺席',540,600,70,3.1,5.8);
  say(ctx,t,'6400 年前',540,330,110,6.0,11.8); say(ctx,t,'有人用蚌壳，摆了一条龙',540,470,60,6.6,11.8); src(ctx,t,'河南濮阳西水坡 · 长 1.78 米',1150,7.2,11.8);
  say(ctx,t,'5000 多年前',540,330,110,12.0,17.8); say(ctx,t,'玉龙，弯成一个 C',540,470,60,12.6,17.8); src(ctx,t,'红山文化 · 中国国家博物馆藏',1150,13.2,17.8);
  say(ctx,t,'3600 多年前',540,250,104,18.0,23.8); say(ctx,t,'2000 多片绿松石，拼一条龙',540,360,56,18.6,23.8); src(ctx,t,'河南偃师 · 二里头遗址',1310,19.2,23.8);
  say(ctx,t,'龙，到底长什么样？',540,560,74,24.1,26.4,{tout:0.25});
  // drop：九似
  pop(ctx,t,'龙是拼出来的',540,300,104,T.drop+0.05,33.0);
  NINE.forEach(([n,a,b],i)=>{ const t0=nineT(i); if(t<t0||t>t0+0.62) return; ctx.save(); const k=expo(P(t,t0,t0+0.2)), ko=P(t,t0+0.5,t0+0.62);
    ctx.globalAlpha=k*(1-ko); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=`400 92px ${DISP}`; ctx.fillStyle='#f4ead8'; ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=16;
    ctx.fillText(`${a} 似 ${b}`,540,1205-(1-k)*20); ctx.restore(); });
  src(ctx,t,'宋 · 郭若虚《图画见闻志》：画龙「分成九似」',1315,T.drop+0.6,33.0);
  say(ctx,t,'九种动物，一条龙',540,300,84,33.2,35.9);
  say(ctx,t,'能细能巨',540,300,96,36.1,38.9); say(ctx,t,'能幽能明',540,300,96,39.1,41.8); src(ctx,t,'东汉 · 许慎《说文解字》',420,36.6,41.8);
  [['潜龙勿用',42.1],['见龙在田',43.6],['飞龙在天',45.1],['亢龙有悔',46.6]].forEach(([s,a])=>say(ctx,t,s,540,290,96,a,a+1.45,{tin:0.35,tout:0.2}));
  src(ctx,t,'《周易 · 乾》',400,42.4,48.0);
  say(ctx,t,'6000 年，样子改了无数次',540,1250,64,48.4,51.2); say(ctx,t,'能屈能伸，一直没改',540,1250,72,51.4,54.0);
  say(ctx,t,'你觉得龙——',540,1180,64,54.2,DUR); say(ctx,t,'是古人见过的，还是想出来的？',540,1275,52,54.9,DUR); }
function brand(ctx,t){ ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,86,210,16,GOLD,0.9); glow(ctx,86,210,3,WHITE,1); ctx.restore();
  ctx.save(); ctx.font=`700 30px ${SANS}`; ctx.textBaseline='middle'; ctx.fillStyle='rgba(255,214,150,0.85)'; ctx.fillText('思想可见',110,211); ctx.restore(); }
window.__ep={render,DUR};
