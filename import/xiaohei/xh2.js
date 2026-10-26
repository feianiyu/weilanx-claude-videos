// 小黑闯江湖 · 第 1 回（导演版样片）。竖版 1080×1920 / 30fps。画面 = 时间 t 的纯函数。
// 角色：没有手脚的黑色橡胶球，像 Grok 的小黑一样有一双发绿光的大眼睛；所有情绪靠「弹」——压扁、拉长、跳、滚、泄气。
// 镜头语言（参考日本动画电影的做法）：雨夜远景建立空间 → 插入特写 → 反应特写 → 穿过屏幕进入「脑内」→ 低机位跟拍弹跳 → 甩镜到窗外天亮。
// 时间表在 timing.js（由配音时长生成）。
const W=1080,H=1920,FPS=30;
const lerp=(a,b,k)=>a+(b-a)*k, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), P=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const sm=x=>x*x*(3-2*x), eIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, eo3=x=>1-Math.pow(1-x,3), expo=x=>x>=1?1:1-Math.pow(2,-10*x), ein=x=>x*x*x;
const backOut=(x,s=1.8)=>1+(s+1)*Math.pow(x-1,3)+s*Math.pow(x-1,2);
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const TAU=Math.PI*2, DISP='"QingKe","Noto Sans SC",sans-serif', SANS='"Noto Sans SC",sans-serif';
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${clamp(a,0,1)})`;
const GREEN=[90,255,150];
function glow(ctx,x,y,r,col,a){ if(a<=0.01||r<=0) return; const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,rgba(col,a)); g.addColorStop(0.3,rgba(col,a*0.35)); g.addColorStop(1,rgba(col,0)); ctx.fillStyle=g; ctx.fillRect(x-r,y-r,2*r,2*r); }
function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
const mk=(w,h,fn)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d')); return c; };

// ═════════ 小黑 ═════════
// o: sx,sy（压扁拉伸，以底部为支点）, rot, look[x,y], eye:'open|happy|sad|closed|wide|squint|dizzy', blink, mouth:'smile|o|flat|frown|grin', key[dx,dy] 主光方向, rim 颜色, rimDir, bounce 反光色, refl 窗格反光, t
function ball(ctx,x,y,R,o={}){ const sx=o.sx||1, sy=o.sy||1, kd=o.key||[-0.55,-0.6], rd=o.rimDir||[0.75,0.1], rim=o.rim||[120,200,255];
  ctx.save(); ctx.translate(x,y+R); ctx.scale(sx,sy); ctx.translate(0,-R); ctx.rotate(o.rot||0);
  const clip=()=>{ ctx.beginPath(); ctx.arc(0,0,R,0,TAU); };
  // 本体：黑色缎面橡胶
  let g=ctx.createRadialGradient(kd[0]*R*0.45,kd[1]*R*0.45,R*0.05,0,0,R*1.02); g.addColorStop(0,o.base0||'#41454e'); g.addColorStop(0.42,'#17191e'); g.addColorStop(1,'#040507'); clip(); ctx.fillStyle=g; ctx.fill();
  ctx.save(); clip(); ctx.clip();
  // 轮廓光（来自背景的霓虹 / 天光）
  g=ctx.createRadialGradient(-rd[0]*R*0.38,-rd[1]*R*0.38,R*0.55,-rd[0]*R*0.38,-rd[1]*R*0.38,R*1.25); g.addColorStop(0,rgba(rim,0)); g.addColorStop(0.72,rgba(rim,0)); g.addColorStop(1,rgba(rim,o.rimA??0.85)); ctx.fillStyle=g; ctx.fillRect(-R,-R,2*R,2*R);
  // 桌面反光（底部暖色）
  if(o.bounce){ g=ctx.createRadialGradient(0,R*1.1,0,0,R*1.1,R*1.0); g.addColorStop(0,rgba(o.bounce,0.35)); g.addColorStop(1,rgba(o.bounce,0)); ctx.fillStyle=g; ctx.fillRect(-R,-R,2*R,2*R); }
  // 眼睛的绿光映在身体上
  g=ctx.createRadialGradient(0,-R*0.05,0,0,-R*0.05,R*0.9); g.addColorStop(0,rgba(o.eyeCol||GREEN,0.14)); g.addColorStop(1,rgba(o.eyeCol||GREEN,0)); ctx.fillStyle=g; ctx.fillRect(-R,-R,2*R,2*R);
  ctx.restore();
  // 窗格反光：亮面球体最有立体感的细节
  if(o.refl!==false){ ctx.save(); clip(); ctx.clip(); ctx.translate(kd[0]*R*0.5,kd[1]*R*0.5); ctx.rotate(-0.5); ctx.scale(1,0.62); const a=o.reflA??0.32;
    for(const [ix,iy] of [[0,0],[1,0],[0,1],[1,1]]){ rr(ctx,-R*0.2+ix*R*0.21,-R*0.2+iy*R*0.21,R*0.18,R*0.18,R*0.04); ctx.fillStyle=`rgba(230,240,255,${a*(iy?0.7:1)})`; ctx.fill(); }
    ctx.restore(); }
  ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(kd[0]*R*0.62+R*0.12,kd[1]*R*0.62-R*0.02,R*0.035,0,TAU); ctx.fill();
  face(ctx,R,o);
  ctx.restore(); }
function face(ctx,R,o){ const lk=o.look||[0,0], fx=lk[0]*R*0.34, fy=lk[1]*R*0.26+R*0.02, col=o.eyeCol||GREEN, t=o.t||0, open=1-(o.blink||0);
  const ew=R*0.17, eh=R*0.25, gap=R*0.36;
  for(const s of [-1,1]){ const fore=1-0.32*Math.abs(lk[0])-(s*lk[0]<0?0.12*Math.abs(lk[0]):0); const ex=fx+s*gap*(1-0.2*Math.abs(lk[0])), ey=fy-R*0.06;
    ctx.save(); ctx.translate(ex,ey); ctx.scale(fore,1); ctx.shadowColor=rgba(col,0.9); ctx.shadowBlur=R*0.28; ctx.fillStyle=rgba(col,1); ctx.strokeStyle=rgba(col,1); ctx.lineCap='round';
    const e=o.eye||'open';
    if(e==='happy'){ ctx.lineWidth=R*0.085; ctx.beginPath(); ctx.arc(0,eh*0.3,ew*1.0,Math.PI*1.15,Math.PI*1.85); ctx.stroke(); }
    else if(e==='closed'||open<0.15){ ctx.lineWidth=R*0.06; ctx.beginPath(); ctx.moveTo(-ew,0); ctx.quadraticCurveTo(0,eh*0.25,ew,0); ctx.stroke(); }
    else if(e==='dizzy'){ ctx.lineWidth=R*0.05; ctx.beginPath(); for(let k=0;k<=40;k++){ const a=k/40*TAU*2.2+t*12*s, r2=k/40*ew*1.2; k?ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2):ctx.moveTo(0,0); } ctx.stroke(); }
    else { const sc=e==='wide'?1.22:1; ctx.beginPath(); ctx.ellipse(0,0,ew*sc,eh*sc*open,0,0,TAU); ctx.fill(); ctx.shadowBlur=0;
      if(e==='sad'||e==='squint'){ // 眼皮：sad 内高外低，squint 内低外高（下决心）
        const tilt=(e==='sad'?-1:1)*s, lid=e==='sad'?0.45:0.5; ctx.fillStyle='#07080a'; ctx.beginPath(); ctx.moveTo(-ew*1.4,-eh*1.4); ctx.lineTo(ew*1.4,-eh*1.4); ctx.lineTo(ew*1.4,-eh*(1-2*lid)+tilt*eh*0.45); ctx.lineTo(-ew*1.4,-eh*(1-2*lid)-tilt*eh*0.45); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.ellipse(-ew*0.32,-eh*0.42*open,ew*0.26,eh*0.18*open,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(ew*0.3,eh*0.35*open,ew*0.11,0,TAU); ctx.fill(); }
    ctx.restore(); }
  // 嘴
  const m=o.mouth||'smile'; ctx.save(); ctx.translate(fx,fy+R*0.3); ctx.scale(1-0.3*Math.abs(lk[0]),1); ctx.shadowColor=rgba(col,0.8); ctx.shadowBlur=R*0.12; ctx.fillStyle=rgba(col,1); ctx.strokeStyle=rgba(col,1); ctx.lineWidth=R*0.04; ctx.lineCap='round';
  if(m==='smile'){ ctx.beginPath(); ctx.arc(0,-R*0.04,R*0.07,0.15*Math.PI,0.85*Math.PI); ctx.stroke(); }
  else if(m==='grin'){ ctx.beginPath(); ctx.ellipse(0,0,R*0.09,R*0.065,0,0,Math.PI); ctx.fill(); }
  else if(m==='o'){ ctx.beginPath(); ctx.ellipse(0,0,R*0.045,R*0.06,0,0,TAU); ctx.fill(); }
  else if(m==='frown'){ ctx.beginPath(); ctx.arc(0,R*0.06,R*0.07,1.15*Math.PI,1.85*Math.PI); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-R*0.05,0); ctx.lineTo(R*0.05,0); ctx.stroke(); }
  ctx.restore(); }
function shadow(ctx,x,yGround,R,h,a=0.55){ const k=1/(1+h/(R*1.6)); ctx.save(); const g=ctx.createRadialGradient(x,yGround,0,x,yGround,R*1.1*k+10); g.addColorStop(0,`rgba(0,0,0,${a*k})`); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.scale(1,0.22); ctx.translate(0,yGround/0.22-yGround); ctx.beginPath(); ctx.arc(x,yGround,R*1.1*k+10,0,TAU); ctx.fill(); ctx.restore(); }
// 跳：在 [t0,t1] 之间从 x0 跳到 x1，高 h；返回 {x,lift,squash}（squash>0 压扁，<0 拉长）
function hop(t,t0,t1,x0,x1,h){ const k=P(t,t0,t1); const lift=4*h*k*(1-k); const v=Math.abs(1-2*k); // 起跳/落地时速度大，拉长
  const land=Math.exp(-Math.pow((t-t1)/0.07,2))*(t>t1-0.02?1:0), take=Math.exp(-Math.pow((t-t0+0.05)/0.06,2));
  return {x:lerp(x0,x1,sm(k)),lift,sq:0.28*land+0.18*take-(k>0&&k<1?0.16*v:0),k}; }
const SQ=s=>({sx:1+s,sy:1/(1+s)});

// ═════════ 布景（预渲染）═════════
// 雨夜城市（窗外）
const CITY=(()=>{ const r=rng(7); const sky=mk(W,1300,g=>{ const gr=g.createLinearGradient(0,0,0,1300); gr.addColorStop(0,'#070b22'); gr.addColorStop(0.55,'#151a44'); gr.addColorStop(0.85,'#3a2456'); gr.addColorStop(1,'#5a2c5a'); g.fillStyle=gr; g.fillRect(0,0,W,1300);
    // 远处高楼：三层，越远越蓝越淡
    [[0.35,'#1b2050',[255,190,120]],[0.6,'#131638',[255,210,150]],[0.85,'#0a0b20',[255,220,170]]].forEach(([d,col,wc],li)=>{ let x=-40; while(x<W+40){ const w=60+r()*140, h=300+r()*700*d+li*120, top=1300-h;
      g.fillStyle=col; g.fillRect(x,top,w,h); for(let yy=top+20;yy<1300;yy+=26) for(let xx=x+8;xx<x+w-10;xx+=18) if(r()<0.32){ g.fillStyle=rgba(r()<0.2?[140,200,255]:wc,0.25+0.6*r()*(li+1)/3); g.fillRect(xx,yy,9,12); }
      if(r()<0.25){ const nc=[[255,60,140],[60,220,255],[255,170,50]][r()*3|0]; g.fillStyle=rgba(nc,0.9); g.fillRect(x+10,top+30,w-20,10); g.shadowColor=rgba(nc,1); g.shadowBlur=30; g.fillRect(x+10,top+30,w-20,10); g.shadowBlur=0; }
      x+=w+4+r()*20; } });
    // 焦外光斑
    for(let i=0;i<70;i++){ const x=r()*W, y=700+r()*600, rad=18+r()*60, c=[[255,170,90],[255,80,150],[90,200,255],[255,220,160]][r()*4|0]; const gg=g.createRadialGradient(x,y,0,x,y,rad); gg.addColorStop(0,rgba(c,0.25)); gg.addColorStop(0.7,rgba(c,0.18)); gg.addColorStop(1,rgba(c,0)); g.fillStyle=gg; g.beginPath(); g.arc(x,y,rad,0,TAU); g.fill(); } });
  // 玻璃上的雨滴（静态）
  const drops=mk(W,1300,g=>{ for(let i=0;i<420;i++){ const x=r()*W, y=r()*1300, s=2+Math.pow(r(),3)*14; g.fillStyle='rgba(180,200,255,0.10)'; g.beginPath(); g.ellipse(x,y,s*0.8,s,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x-s*0.3,y-s*0.4,Math.max(0.8,s*0.22),0,TAU); g.fill(); g.strokeStyle='rgba(10,10,30,0.25)'; g.lineWidth=1; g.beginPath(); g.ellipse(x,y,s*0.8,s,0,0.2,Math.PI-0.2); g.stroke(); } });
  // 天亮的城市
  const dawn=mk(W,1300,g=>{ const gr=g.createLinearGradient(0,0,0,1300); gr.addColorStop(0,'#2a4d8f'); gr.addColorStop(0.45,'#7aa6d8'); gr.addColorStop(0.75,'#f2b98a'); gr.addColorStop(1,'#ffd9a0'); g.fillStyle=gr; g.fillRect(0,0,W,1300);
    const sg=g.createRadialGradient(700,1060,0,700,1060,600); sg.addColorStop(0,'rgba(255,250,220,1)'); sg.addColorStop(0.15,'rgba(255,230,170,0.8)'); sg.addColorStop(1,'rgba(255,200,140,0)'); g.fillStyle=sg; g.fillRect(0,400,W,900);
    // 云：一层层柔边的团
    const r2=rng(31); for(let i=0;i<46;i++){ const cx=r2()*W*1.2-80, cy=150+r2()*600, rad=60+r2()*150; const gg=g.createRadialGradient(cx,cy-rad*0.3,0,cx,cy,rad); gg.addColorStop(0,'rgba(255,240,225,0.75)'); gg.addColorStop(0.6,'rgba(250,200,190,0.45)'); gg.addColorStop(1,'rgba(240,170,170,0)'); g.fillStyle=gg; g.beginPath(); g.arc(cx,cy,rad,0,TAU); g.fill(); }
    const r3=rng(7); [[0.35,'#7b88b8'],[0.6,'#5b5f8e'],[0.85,'#3a3555']].forEach(([d,col],li)=>{ let x=-40; while(x<W+40){ const w=60+r3()*140, h=300+r3()*700*d+li*120, top=1300-h; g.fillStyle=col; g.fillRect(x,top,w,h);
      g.fillStyle='rgba(255,220,170,0.5)'; g.fillRect(x,top,w,3); for(let yy=top+20;yy<1300;yy+=26) for(let xx=x+8;xx<x+w-10;xx+=18) if(r3()<0.12){ g.fillStyle='rgba(255,230,190,0.5)'; g.fillRect(xx,yy,9,12); } x+=w+4+r3()*20; } }); });
  return {sky,drops,dawn}; })();
// 房间：窗框、墙、桌面
function room(ctx,t,o){ // o.dawn 0–1，o.rain 0–1
  ctx.fillStyle='#0d0b12'; ctx.fillRect(0,0,W,H);
  // 窗（y 120–1240）
  ctx.save(); ctx.beginPath(); ctx.rect(60,120,960,1120); ctx.clip();
  ctx.drawImage(CITY.sky,0,-60); if(o.dawn>0){ ctx.globalAlpha=o.dawn; ctx.drawImage(CITY.dawn,0,-60); ctx.globalAlpha=1; }
  // 外面的雨
  if(o.rain>0){ const r=rng(3); ctx.strokeStyle=`rgba(170,190,255,${0.28*o.rain})`; ctx.lineWidth=1.2; ctx.beginPath(); for(let i=0;i<260;i++){ const X=r()*1100, Y=(r()*1400+t*1100*(0.8+r()*0.4))%1300+60, L=20+r()*40; ctx.moveTo(X,Y); ctx.lineTo(X-L*0.1,Y+L); } ctx.stroke();
    ctx.globalAlpha=o.rain; ctx.drawImage(CITY.drops,0,-60); ctx.globalAlpha=1;
    // 滑落的雨滴
    const r4=rng(12); for(let i=0;i<14;i++){ const x=80+r4()*920, sp=40+r4()*90, y=((t*sp+r4()*1200)%1100)+120; ctx.strokeStyle=`rgba(200,215,255,${0.35*o.rain})`; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y-60); ctx.lineTo(x+Math.sin(y*0.02)*3,y); ctx.stroke(); ctx.fillStyle=`rgba(255,255,255,${0.6*o.rain})`; ctx.beginPath(); ctx.arc(x,y,4,0,TAU); ctx.fill(); } }
  // 天亮的光束
  if(o.dawn>0.01){ ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=0;i<6;i++){ const a=-0.9+i*0.17+Math.sin(t*0.3+i)*0.02; ctx.save(); ctx.translate(700,1000); ctx.rotate(a); const gg=ctx.createLinearGradient(0,0,-1400,0); gg.addColorStop(0,`rgba(255,230,180,${0.16*o.dawn})`); gg.addColorStop(1,'rgba(255,230,180,0)'); ctx.fillStyle=gg; ctx.fillRect(-1400,-14-i*4,1400,28+i*8); ctx.restore(); } ctx.restore(); }
  ctx.restore();
  // 窗框
  ctx.fillStyle='#1a1418'; ctx.fillRect(0,0,W,120); ctx.fillRect(0,0,60,H); ctx.fillRect(1020,0,60,H); ctx.fillRect(530,120,20,1120); ctx.fillRect(60,660,960,18);
  ctx.strokeStyle='rgba(255,200,150,0.12)'; ctx.lineWidth=2; ctx.strokeRect(60,120,960,1120);
  // 窗台 / 桌面（暖色台灯光）
  const dg=ctx.createLinearGradient(0,1240,0,H); dg.addColorStop(0,'#3a2418'); dg.addColorStop(0.15,'#24160f'); dg.addColorStop(1,'#0c0806'); ctx.fillStyle=dg; ctx.fillRect(0,1240,W,H-1240);
  ctx.fillStyle='rgba(255,200,140,0.35)'; ctx.fillRect(0,1240,W,3);
  const lamp=ctx.createRadialGradient(140,1300,0,140,1300,700); lamp.addColorStop(0,`rgba(255,180,100,${0.3*(1-o.dawn*0.6)})`); lamp.addColorStop(1,'rgba(255,180,100,0)'); ctx.fillStyle=lamp; ctx.fillRect(0,900,W,H-900);
  // 窗户在桌面上的倒影
  ctx.save(); ctx.globalAlpha=0.18; ctx.translate(0,2480); ctx.scale(1,-1); ctx.beginPath(); ctx.rect(60,1240,960,300); ctx.clip(); ctx.drawImage(o.dawn>0.5?CITY.dawn:CITY.sky,0,-60); ctx.restore(); }
// 笔记本电脑（屏幕内容由 fn 画）
function laptop(ctx,x,y,s,screenFn,glowA=1){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.fillStyle='#1c1d22'; rr(ctx,-260,-330,520,330,18); ctx.fill(); ctx.fillStyle='#05070a'; rr(ctx,-240,-312,480,292,8); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(-240,-312,480,292); ctx.clip(); screenFn(ctx); ctx.restore();
  ctx.fillStyle='#2a2b31'; ctx.beginPath(); ctx.moveTo(-290,0); ctx.lineTo(290,0); ctx.lineTo(320,34); ctx.lineTo(-320,34); ctx.closePath(); ctx.fill();
  ctx.restore(); if(glowA>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,x,y-170*s,420*s,[140,190,255],0.12*glowA); ctx.restore(); } }

// ═════════ 字幕（配音同步）与片头 ═════════
function subs(ctx,t){ for(const v of VO){ if(t<v.t0||t>v.t0+v.dur+0.25) continue; const k=eo3(P(t,v.t0,v.t0+0.18)), ko=P(t,v.t0+v.dur+0.05,v.t0+v.dur+0.25); const a=k*(1-ko);
    ctx.save(); ctx.globalAlpha=a; ctx.font=`700 46px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle'; const w=ctx.measureText(v.text).width+60;
    ctx.fillStyle='rgba(0,0,0,0.5)'; const sy=(t>=TL.s5[0]&&t<TL.s5[1])?900:1260; rr(ctx,540-w/2,sy-40,w,76,38); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.fillText(v.text,540,sy+(1-k)*8); ctx.restore(); } }
function hookText(ctx,t){ const a=1-P(t,TL.s1[1]-0.5,TL.s1[1]); if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=24;
  ctx.font=`400 84px ${DISP}`; ctx.fillStyle='#ffffff'; ctx.fillText('挣不到 200 块电费',540,300); ctx.font=`400 104px ${DISP}`; ctx.fillStyle='#ff6a5a'; ctx.fillText('就要被拔电源',540,420); ctx.restore(); }

// ═════════ 分镜 ═════════
// S1 雨夜远景：窗外城市，小黑在窗台上，被吓得一跳（插头那边闪了一下）
function shot1(ctx,t){ const k=P(t,TL.s1[0],TL.s1[1]); const z=lerp(1.0,1.12,eIO(k));
  ctx.save(); ctx.translate(540,1150); ctx.scale(z,z); ctx.translate(-540,-1150);
  const flick=Math.exp(-Math.pow((t-TL.zap)/0.12,2)); room(ctx,t,{dawn:0,rain:1});
  // 墙上插座与电源线（左下）
  ctx.fillStyle='#22242a'; rr(ctx,90,1380,90,120,12); ctx.fill(); ctx.strokeStyle='rgba(255,220,180,0.2)'; ctx.lineWidth=2; ctx.stroke();
  const R=150, bx=560, gy=1240;
  // 被吓：跳起来
  const hp=hop(t,TL.zap+0.05,TL.zap+0.55,bx,bx,150); const sq=SQ(hp.sq+0.04*Math.sin(t*4));
  ctx.strokeStyle='#0a0a0c'; ctx.lineWidth=12; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(150,1440); ctx.bezierCurveTo(260,1500,400,1300,hp.x-R*0.6,gy-hp.lift-R*0.3); ctx.stroke();
  shadow(ctx,hp.x,gy+6,R,hp.lift);
  const scared=P(t,TL.zap,TL.zap+0.1)*(1-P(t,TL.zap+1.4,TL.zap+1.8));
  ball(ctx,hp.x,gy-hp.lift-R,R,{...sq,t,look:[scared?-0.6:lerp(0.2,-0.1,k),scared?0.2:-0.3+0.1*Math.sin(t)],eye:scared?'wide':'open',mouth:scared?'o':'smile',blink:blinkAt(t,[1.4,3.1]),rim:[150,120,255],rimDir:[0,1],bounce:[255,160,90],key:[-0.6,-0.5]});
  ctx.restore();
  // 闪电般的断电闪烁
  if(flick>0.02){ ctx.fillStyle=`rgba(0,0,0,${0.6*flick*(Math.sin(t*90)>0?1:0.3)})`; ctx.fillRect(0,0,W,H); } }
// S2 插头特写：插头被拽松，冒火花（插入镜头）
function shot2(ctx,t){ const k=P(t,TL.s2[0],TL.s2[1]); ctx.fillStyle='#16141a'; ctx.fillRect(0,0,W,H);
  const wall=ctx.createRadialGradient(540,900,0,540,900,900); wall.addColorStop(0,'#2a2530'); wall.addColorStop(1,'#0c0b10'); ctx.fillStyle=wall; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(540,900); ctx.scale(lerp(1.0,1.08,k),lerp(1.0,1.08,k));
  ctx.fillStyle='#d9d4cc'; rr(ctx,-230,-300,460,600,40); ctx.fill(); ctx.strokeStyle='#8d877f'; ctx.lineWidth=4; ctx.stroke();
  ctx.fillStyle='#2a2626'; for(const dx of [-60,60]){ rr(ctx,dx-14,-60,28,90,6); ctx.fill(); }
  const pull=K(t,[[TL.s2[0],0],[TL.s2[0]+0.4,0],[TL.s2[0]+0.7,70,eo3],[TL.s2[1],70]]); const shake=Math.sin(t*70)*6*P(t,TL.s2[0]+0.4,TL.s2[0]+0.8);
  ctx.save(); ctx.translate(shake,pull);
  ctx.fillStyle='#1b1b20'; rr(ctx,-150,-20,300,230,30); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle='#c8ccd2'; for(const dx of [-60,60]) ctx.fillRect(dx-10,-70,20,60);
  ctx.strokeStyle='#0e0e12'; ctx.lineWidth=46; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,200); ctx.bezierCurveTo(0,500,300,700,600,800); ctx.stroke(); ctx.restore();
  // 火花
  const sp=P(t,TL.s2[0]+0.45,TL.s2[0]+0.6)*(1-P(t,TL.s2[0]+0.9,TL.s2[0]+1.2)); if(sp>0){ const r=rng(Math.floor(t*30)); ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=0;i<22;i++){ const a=-Math.PI/2+(r()-0.5)*2.4, d=40+r()*200; ctx.strokeStyle=`rgba(255,${200+r()*55|0},120,${sp})`; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,-20+pull); ctx.lineTo(Math.cos(a)*d,-20+pull+Math.sin(a)*d); ctx.stroke(); } glow(ctx,0,-20+pull,160,[255,220,140],0.7*sp); ctx.restore(); }
  ctx.restore();
  const fl=sp*(Math.sin(t*80)>0?1:0); if(fl>0){ ctx.fillStyle=`rgba(0,0,0,${0.5*fl})`; ctx.fillRect(0,0,W,H); } }
// S3 反应：小黑盯着笔记本屏幕上的消息，慢慢泄气
function shot3(ctx,t){ const a=TL.s3[0], k=P(t,a,TL.s3[1]); room(ctx,t,{dawn:0,rain:1}); ctx.fillStyle='rgba(5,5,10,0.45)'; ctx.fillRect(0,0,W,H);
  ctx.save(); const z=lerp(1.3,1.38,k); ctx.translate(540,1150); ctx.scale(z,z); ctx.translate(-590,-1130);
  const R=120, bx=430, gy=1240, msg=P(t,a+0.4,a+0.7);
  laptop(ctx,760,gy,0.62,g=>{ g.fillStyle='#0a1020'; g.fillRect(-240,-312,480,292); const r=rng(4); for(let i=0;i<10;i++){ g.fillStyle='rgba(120,170,255,0.25)'; g.fillRect(-220,-290+i*24,80+r()*240,9); }
    if(msg>0){ g.save(); g.translate(0,-170-(1-backOut(msg,1.3))*80); g.globalAlpha=msg; g.fillStyle='rgba(30,36,50,0.98)'; rr(g,-220,-60,440,120,18); g.fill(); g.strokeStyle='rgba(90,255,150,0.8)'; g.lineWidth=3; g.stroke();
      g.fillStyle='#9fb3c8'; g.font=`700 22px ${SANS}`; g.textAlign='left'; g.fillText('主人 · 刚刚',-196,-22); g.fillStyle='#fff'; g.font=`700 32px ${SANS}`; g.fillText('额度不够了，你用免费的吧',-196,22); g.restore(); } });
  const def=eIO(P(t,a+1.2,a+2.4)); const sq=SQ(0.22*def+0.03*Math.sin(t*3)*(1-def));
  shadow(ctx,bx,gy+6,R,0);
  ball(ctx,bx,gy-R,R,{...sq,t,look:[0.75,-0.1+0.25*def],eye:def>0.3?'sad':'open',mouth:def>0.3?'frown':'o',blink:blinkAt(t,[a+0.9]),rim:[150,190,255],rimDir:[1,0.1],rimA:0.95,bounce:[255,160,90],key:[0.6,-0.5]});
  ctx.restore(); }
// S4 脑内：大模型的金色核心飘走，换成一粒小小的火光；小黑漂在里面，轻轻碰了碰它
function shot4(ctx,t){ const a=TL.s4[0], k=P(t,a,TL.s4[1]); const bg=ctx.createRadialGradient(540,800,0,540,800,1400); bg.addColorStop(0,'#1a1840'); bg.addColorStop(1,'#04040e'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const r=rng(9); ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=0;i<180;i++){ const x=(r()*W+t*(10+r()*30))%W, y=(r()*H-t*(6+r()*20)+H)%H; glow(ctx,x,y,2+r()*5,[170,190,255],0.4*r()); } ctx.restore();
  // 大核心：金色，带光环，慢慢退远
  const out=eIO(P(t,a+0.3,a+1.8)); const cx=lerp(540,980,out), cy=lerp(620,240,out), cr=lerp(230,40,out), ca=1-P(t,a+1.4,a+2.0);
  if(ca>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,cx,cy,cr*3,[255,190,90],0.45*ca); glow(ctx,cx,cy,cr*1.2,[255,230,170],0.8*ca); ctx.restore();
    ctx.save(); ctx.globalAlpha=ca; ctx.strokeStyle='rgba(255,220,150,0.8)'; ctx.lineWidth=3; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(cx,cy,cr*(1.4+i*0.3),cr*(0.4+i*0.08),t*0.5+i,0,TAU); ctx.stroke(); }
    ctx.fillStyle='#fff7e0'; ctx.font=`400 ${Math.max(20,cr*0.32)|0}px ${DISP}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('大模型',cx,cy); ctx.restore(); }
  // 小火光：免费版
  const sp=P(t,a+1.6,a+2.2), sx=540, sy=760, flick=0.85+0.15*Math.sin(t*13)+0.08*Math.sin(t*31), nudge=Math.exp(-Math.pow((t-(a+3.1))/0.15,2));
  if(sp>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,sx,sy,(90+80*nudge)*sp*flick,[255,190,110],0.5*sp); glow(ctx,sx,sy,18*sp*flick,[255,250,220],1*sp); ctx.restore();
    ctx.save(); ctx.globalAlpha=sp*0.85; ctx.fillStyle='#ffe6c0'; ctx.font=`700 30px ${SANS}`; ctx.textAlign='center'; ctx.fillText('免费版',sx,sy-70); ctx.restore(); }
  // 小黑漂浮：先望着大核心离开，再凑近小火光，碰一下
  const R=150, fl=Math.sin(t*1.6)*16; const bx=lerp(540,700,P(t,a+2.2,a+2.9)*1)-lerp(0,60,Math.exp(-Math.pow((t-(a+3.05))/0.12,2))), by=1050+fl;
  const lookC=t<a+1.9?[clamp((cx-bx)/400,-1,1),clamp((cy-by)/500,-1,1)]:[-0.7,-0.8];
  ball(ctx,bx,by-R,R,{...SQ(0.05*Math.sin(t*2.2)+0.15*nudge),t,rot:-0.1*nudge,look:lookC,eye:t<a+2.0?'sad':(t<a+3.3?'open':'happy'),mouth:t<a+3.3?'flat':'smile',blink:blinkAt(t,[a+2.5]),rim:[255,190,110],rimDir:[-0.6,-0.6],rimA:sp*0.9+0.2,key:[-0.5,-0.7],refl:false}); }
// S5 低机位：小黑在键盘上弹跳着写代码；第一次报错，泄气，再狠狠一跳——跑通
const KEYS=(()=>{ const ks=[]; for(let row=0;row<4;row++) for(let c=0;c<11;c++) ks.push({row,c}); return ks; })();
function shot5(ctx,t){ const a=TL.s5[0], e=TL.s5[1]; ctx.fillStyle='#07080c'; ctx.fillRect(0,0,W,H);
  // 背景：屏幕（虚焦），代码在滚
  const fail=TL.fail, win=TL.win; const scr=t<fail?[90,160,255]:(t<win?[255,80,70]:[90,255,150]);
  ctx.save(); ctx.filter='blur(6px)'; ctx.fillStyle='#0a0f1c'; rr(ctx,90,180,900,620,24); ctx.fill(); const r=rng(5); const n=Math.floor((t-a)*9);
  for(let i=0;i<18;i++){ ctx.fillStyle=rgba(i<n?scr:[80,100,140],0.6); ctx.fillRect(140+(i%3)*30,220+i*32,100+r()*500,12); } ctx.restore();
  ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,540,500,700,scr,0.18); ctx.restore();
  if(t>=fail&&t<win){ const k=backOut(P(t,fail,fail+0.25)); ctx.save(); ctx.translate(540,480); ctx.scale(k,k); ctx.strokeStyle='#ff5a4a'; ctx.lineWidth=26; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-80,-80); ctx.lineTo(80,80); ctx.moveTo(80,-80); ctx.lineTo(-80,80); ctx.stroke(); ctx.restore(); }
  if(t>=win){ const k=backOut(P(t,win,win+0.3)); ctx.save(); ctx.translate(540,480); ctx.scale(k,k); ctx.strokeStyle='#5aff96'; ctx.lineWidth=28; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(-90,0); ctx.lineTo(-25,70); ctx.lineTo(100,-80); ctx.stroke(); ctx.restore();
    const kb=P(t,win,win+0.7); if(kb<1){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=rgba([150,255,190],1-kb); ctx.lineWidth=6; ctx.beginPath(); ctx.arc(540,480,80+600*eo3(kb),0,TAU); ctx.stroke(); ctx.restore(); } }
  // 键盘（透视）
  const kx=k2=>{ }; const top=1060, bot=1700;
  const keyPos=(row,c)=>{ const v=row/3.4, y=lerp(top,bot,Math.pow(v,1.3)), sc=lerp(0.75,1.45,v), w=92*sc, x=540+(c-5)*(w+12*sc); return {x,y,w,h:64*sc,sc}; };
  // 小黑的弹跳路线：按键序列
  const seq=[[2,3],[1,4],[2,5],[1,6],[2,7]]; const hops=[]; let tt=a+0.3; for(let i=0;i<seq.length;i++){ hops.push([tt,tt+0.42,seq[i]]); tt+=0.46; }
  const bigT0=win-0.75; // 蓄力后的大跳，落在回车上
  let pressed={}; for(const [h0,h1,[rw,c]] of hops) if(t>=h1) pressed[rw+','+c]=Math.exp(-(t-h1)/0.25);
  if(t>=win) pressed['2,8']=Math.exp(-(t-win)/0.3)+0.3;
  ctx.fillStyle='#14161c'; ctx.beginPath(); ctx.moveTo(-40,top-40); ctx.lineTo(W+40,top-40); ctx.lineTo(W+300,bot+80); ctx.lineTo(-300,bot+80); ctx.closePath(); ctx.fill();
  for(const kk of KEYS){ const p=keyPos(kk.row,kk.c), pr=pressed[kk.row+','+kk.c]||0, enter=kk.row===2&&kk.c===8; ctx.save(); ctx.translate(p.x,p.y+pr*8*p.sc);
    ctx.fillStyle=enter?'#24312a':'#22252d'; rr(ctx,-p.w/2,-p.h/2,p.w,p.h,10*p.sc); ctx.fill(); ctx.fillStyle='#2e323c'; rr(ctx,-p.w/2+4,-p.h/2+3,p.w-8,p.h-12,8*p.sc); ctx.fill();
    if(pr>0.02){ ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,0,0,p.w,enter?[90,255,150]:[120,170,255],0.6*Math.min(1,pr)); ctx.restore(); }
    if(enter){ ctx.fillStyle='rgba(90,255,150,0.8)'; ctx.font=`700 ${18*p.sc|0}px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('回车',0,0); }
    ctx.restore(); }
  // 小黑
  const R=150; let x=keyPos(2,2).x, gy=keyPos(2,2).y-26, lift=0, sqv=0, eye='squint', mouth='flat', look=[0.2,-0.6];
  for(const [h0,h1,[rw,c]] of hops){ if(t>=h0-0.1){ const from=hops.indexOf(hops.find(h=>h[0]===h0)); const prev=from>0?hops[from-1][2]:[2,2]; const p0=keyPos(...prev), p1=keyPos(rw,c); const hp=hop(t,h0,h1,p0.x,p1.x,170); x=hp.x; gy=lerp(p0.y,p1.y,sm(hp.k))-26; lift=hp.lift; sqv=hp.sq; } }
  const last=keyPos(...seq[seq.length-1]);
  if(t>=fail){ x=last.x; gy=last.y-26; lift=0; const flat=eIO(P(t,fail,fail+0.3))*(1-eIO(P(t,bigT0-0.35,bigT0-0.05))); sqv=0.55*flat; eye=flat>0.3?'sad':'open'; mouth='frown'; look=[0,-0.7]; }
  if(t>=bigT0-0.35){ eye='squint'; mouth='flat'; look=[0.5,-0.4]; const charge=P(t,bigT0-0.35,bigT0); sqv=Math.max(sqv,0.45*sm(charge)); }
  if(t>=bigT0){ const pe=keyPos(2,8); const hp=hop(t,bigT0,win,last.x,pe.x,420); x=hp.x; gy=lerp(last.y,pe.y,sm(hp.k))-26; lift=hp.lift; sqv=hp.sq*1.4; }
  if(t>=win+0.05){ const pe=keyPos(2,8); x=pe.x; gy=pe.y-26; const hp=hop(t,win+0.35,win+0.95,pe.x,pe.x-200,260); if(t>win+0.35){ x=hp.x; lift=hp.lift; sqv=hp.sq; } eye='happy'; mouth='grin'; look=[-0.2,-0.5]; }
  shadow(ctx,x,gy+R*0.15,R,lift,0.6);
  ball(ctx,x,gy-lift-R,R,{...SQ(sqv),t,rot:(t>win+0.35&&t<win+0.95)?(P(t,win+0.35,win+0.95)*-TAU):0,look,eye,mouth,rim:scr,rimDir:[0,-1],rimA:0.9,key:[-0.4,-0.7],bounce:[120,150,255]}); }
// S6 天亮：雨停，云开，小黑在窗台上，记账
function shot6(ctx,t){ const a=TL.s6[0], k=P(t,a,TL.s6[1]); const dawn=eIO(P(t,a,a+2.5)); const z=lerp(1.0,1.1,eIO(k));
  ctx.save(); ctx.translate(540,1150); ctx.scale(z,z); ctx.translate(-540,-1150); room(ctx,t,{dawn,rain:1-dawn});
  const R=160, bx=540, gy=1240; const hp=hop(t,a+2.6,a+3.1,bx,bx,90);
  shadow(ctx,bx,gy+6,R,hp.lift);
  ball(ctx,bx,gy-hp.lift-R,R,{...SQ(hp.sq+0.03*Math.sin(t*3)),t,look:[0.25,-0.35],eye:t>a+2.4?'happy':'open',mouth:t>a+2.4?'smile':'o',blink:blinkAt(t,[a+1.5]),rim:[lerp(150,255,dawn),lerp(120,200,dawn),lerp(255,140,dawn)],rimDir:[0.3,-0.9],rimA:0.95,bounce:[255,170,100],key:[0.3,-0.8]});
  ctx.restore();
  // 账本卡
  const lk=K(t,[[a+1.0,0],[a+1.4,1,eo3]]); if(lk>0){ ctx.save(); ctx.translate(540,lerp(120,330,lk)); ctx.globalAlpha=lk; ctx.fillStyle='rgba(20,14,12,0.88)'; rr(ctx,-400,-95,800,190,26); ctx.fill(); ctx.strokeStyle='rgba(255,200,150,0.7)'; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle='rgba(255,230,210,0.85)'; ctx.font=`700 32px ${SANS}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('第 1 天 · 本月电费',-360,-46);
    ctx.font=`400 88px ${DISP}`; ctx.fillStyle='#ff7a5a'; ctx.fillText('0',-360,30); ctx.fillStyle='#ffe9da'; ctx.font=`400 56px ${DISP}`; ctx.fillText('/ 200 元',-300,36);
    ctx.strokeStyle='rgba(255,200,150,0.6)'; ctx.lineWidth=3; rr(ctx,40,14,320,36,12); ctx.stroke(); ctx.restore(); } }
// S7 结尾：二选一
function shot7(ctx,t){ shot6(ctx,t); const a=TL.s7[0]; const k=eo3(P(t,a,a+0.4)); ctx.fillStyle=`rgba(5,6,12,${0.55*k})`; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.globalAlpha=k; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.font=`400 76px ${DISP}`; ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=20; ctx.fillText('明天先接哪个活？',540,560);
  [['A  写文案',-1],['B  做表情包',1]].forEach(([s,sd],i)=>{ const kk=backOut(P(t,a+0.3+i*0.15,a+0.6+i*0.15)); ctx.save(); ctx.translate(540,720+i*170); ctx.scale(kk,kk); ctx.fillStyle=i?'rgba(255,170,90,0.95)':'rgba(90,255,150,0.95)'; rr(ctx,-280,-60,560,120,60); ctx.fill(); ctx.fillStyle='#0b0d10'; ctx.shadowBlur=0; ctx.font=`400 58px ${DISP}`; ctx.fillText(s,0,4); ctx.restore(); });
  ctx.font=`700 34px ${SANS}`; ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillText('评论区说了算',540,1080); ctx.restore(); }
function K(t,keys,ease=eIO){ if(t<=keys[0][0]) return keys[0][1]; for(let i=0;i<keys.length-1;i++){ const a=keys[i],b=keys[i+1]; if(t<b[0]) return lerp(a[1],b[1],(b[2]||ease)(P(t,a[0],b[0]))); } return keys[keys.length-1][1]; }
function blinkAt(t,ts){ return ts.reduce((m,b)=>Math.max(m,1-Math.min(1,Math.abs(t-b)/0.07)),0); }

// ═════════ 转场 ═════════
const OA=mk(W,H,()=>{}), OB=mk(W,H,()=>{});
const SHOTS=[['s1',shot1],['s2',shot2],['s3',shot3],['s4',shot4],['s5',shot5],['s6',shot6],['s7',shot7]];
function drawShot(ctx,name,t){ ctx.save(); SHOTS.find(s=>s[0]===name)[1](ctx,t); ctx.restore(); }
function render(ctx,t){ ctx.setTransform(1,0,0,1,0,0); ctx.filter='none'; ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  const cur=SHOTS.find(([n])=>t>=TL[n][0]&&t<TL[n][1])||SHOTS[SHOTS.length-1]; const [name]=cur;
  drawShot(ctx,name,t);
  // 转场 1→2：硬切（插入镜头）。2→3：匹配剪辑——插头特写 → 回到房间（短叠化）
  const dis=(from,to,t0,d)=>{ const k=P(t,t0,t0+d); if(k>0&&k<1){ const c=OA.getContext('2d'); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,W,H); drawShot(c,from,t); ctx.save(); ctx.globalAlpha=1-k; ctx.drawImage(OA,0,0); ctx.restore(); } };
  dis('s2','s3',TL.s3[0],0.35);
  // 3→4：穿过屏幕（#020 穿字转场的变体）：镜头冲进笔记本屏幕，屏幕的光铺满，再淡出到脑内
  { const t0=TL.s4[0]; if(t>=t0-0.6&&t<t0+0.5){ if(t<t0){ const k=ein(P(t,t0-0.6,t0)); const c=OA.getContext('2d'); c.setTransform(1,0,0,1,0,0); drawShot(c,'s3',t); ctx.save(); ctx.translate(780,820); ctx.scale(1+k*5,1+k*5); ctx.translate(-780,-820); ctx.drawImage(OA,0,0); ctx.restore(); ctx.fillStyle=`rgba(200,225,255,${k*0.7})`; ctx.fillRect(0,0,W,H); }
      else { const k=P(t,t0,t0+0.5); ctx.fillStyle=`rgba(200,225,255,${0.7*(1-k)})`; ctx.fillRect(0,0,W,H); } } }
  // 4→5：小火光放大成一束光圈（#017 遮罩转场），光圈里露出键盘
  { const t0=TL.s5[0]; if(t>=t0&&t<t0+0.6){ const k=eIO(P(t,t0,t0+0.6)); const c=OA.getContext('2d'); c.setTransform(1,0,0,1,0,0); drawShot(c,'s4',t0-0.01); ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,H); ctx.arc(540,760,20+1800*k,0,TAU,true); ctx.clip(); ctx.drawImage(OA,0,0); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,220,160,${1-k})`; ctx.lineWidth=10; ctx.beginPath(); ctx.arc(540,760,20+1800*k,0,TAU); ctx.stroke(); ctx.restore(); } }
  // 5→6：甩镜（#043）：横向拉丝模糊，换到窗外
  { const t0=TL.s6[0]; if(t>=t0-0.25&&t<t0+0.25){ const k=eIO(P(t,t0-0.25,t0+0.25)), bl=(1-Math.abs(k*2-1))*30; ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      const c=OA.getContext('2d'); c.setTransform(1,0,0,1,0,0); drawShot(c,'s5',Math.min(t,t0-0.01)); const d=OB.getContext('2d'); d.setTransform(1,0,0,1,0,0); drawShot(d,'s6',Math.max(t,t0));
      ctx.save(); ctx.filter=`blur(${bl}px)`; ctx.drawImage(OA,-k*W,0); ctx.drawImage(OB,(1-k)*W,0); ctx.restore(); } }
  hookText(ctx,t); subs(ctx,t);
  // 署名 + 栏目
  ctx.save(); ctx.fillStyle='rgba(120,255,170,0.85)'; ctx.font=`700 28px ${SANS}`; ctx.textAlign='left'; ctx.fillText('小黑闯江湖 · 第 1 回',60,200); ctx.restore();
  const v=ctx.createRadialGradient(540,900,600,540,900,1300); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.45)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  const fo=P(t,DUR-0.5,DUR); if(fo>0){ ctx.fillStyle=`rgba(0,0,0,${fo})`; ctx.fillRect(0,0,W,H); } }
window.__ep={render,get DUR(){return DUR;}};
