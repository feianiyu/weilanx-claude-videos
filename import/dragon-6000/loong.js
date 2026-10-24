// 思想可见 ·《西方人屠龙，中国人为什么拜龙？》竖版 1080×1920 / 30fps / 60 秒 / 无旁白。画面 = 时间 t 的纯函数。
// 复用 dragon.js（工具、字卡、祥云、火珠）、dragon3d.js（三维身体）、head2d.js（细线龙头）。
// 三幕三种主色：西方 = 火红；中国求雨 = 雨的蓝银 + 金；皇权 = 明黄。80 BPM，每小节 3 秒，drop 在 27.0 秒。
const LDUR=60.0;
const backOut=(x,s=1.7)=>1+(s+1)*Math.pow(x-1,3)+s*Math.pow(x-1,2);
const LT={west:4,turn:12,dry:14.5,clay:18,bone:22.5,dark:26.3,drop:27,storm:30,seal:36,law:38.6,five:41,cut:43.6,dance:46,end:54};
const FIRE=[255,120,60], FIRE2=[255,200,90], RAIN=[175,205,245], IMP=[255,204,70];
const CYL=960;

// ───────── 西方龙（线描，侧面朝左，喷火）─────────
function drawWest(ctx,t,x,y,s,o={}){ const a=o.a??1; if(a<=0.01) return; const C=o.col||FIRE, L=al=>rgba(C,al), D='rgb(16,6,6)', flap=Math.sin(t*3.2)*0.22;
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.globalAlpha*=a; ctx.lineCap='round'; ctx.lineJoin='round';
  const lw=v=>{ ctx.lineWidth=v/s; };
  // 金币堆
  if(o.gold){ const r=rng(8); for(let i=0;i<70;i++){ const cx=(r()-0.5)*620, cy=230+Math.pow(r(),0.7)*70-Math.cos(cx/330)*40; ctx.beginPath(); ctx.ellipse(cx,cy,16,6,0,0,TAU); ctx.fillStyle='rgb(40,26,8)'; ctx.fill(); ctx.strokeStyle=rgba(FIRE2,0.8); lw(1.4); ctx.stroke(); } }
  // 远侧翅膀
  const wing=(ox,oy,al,ph)=>{ ctx.save(); ctx.translate(ox,oy); ctx.rotate(ph); const W2=[[0,0],[70,-210],[30,-330]], tips=[[-170,-470],[20,-560],[210,-500],[320,-340],[330,-180]];
    const wr=W2[2]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(...W2[1]); ctx.lineTo(...wr); ctx.lineTo(...tips[0]); for(let k=1;k<tips.length;k++){ const a1=tips[k-1], b1=tips[k]; ctx.quadraticCurveTo(lerp((a1[0]+b1[0])/2,wr[0],0.3),lerp((a1[1]+b1[1])/2,wr[1],0.3),b1[0],b1[1]); } ctx.quadraticCurveTo(250,-60,160,40); ctx.closePath(); ctx.fillStyle='rgba(40,10,8,0.92)'; ctx.fill(); ctx.strokeStyle=L(al); lw(2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(...W2[1]); ctx.lineTo(...W2[2]); lw(4); ctx.stroke(); tips.forEach(p=>{ ctx.beginPath(); ctx.moveTo(...W2[2]); ctx.quadraticCurveTo((W2[2][0]+p[0])/2+12,(W2[2][1]+p[1])/2+10,...p); lw(2.6); ctx.stroke(); });
    for(let k=0;k<tips.length-1;k++){ const a1=tips[k], b1=tips[k+1]; for(let m=1;m<4;m++){ const f=m/4; ctx.beginPath(); ctx.moveTo(lerp(W2[2][0],lerp(a1[0],b1[0],f),0.15),lerp(W2[2][1],lerp(a1[1],b1[1],f),0.15)); ctx.lineTo(lerp(W2[2][0],lerp(a1[0],b1[0],f),0.8),lerp(W2[2][1],lerp(a1[1],b1[1],f),0.8)); ctx.strokeStyle=L(al*0.3); lw(1); ctx.stroke(); } } ctx.restore(); };
  wing(10,-70,0.5,-0.15+flap*0.8);
  // 尾
  ctx.beginPath(); ctx.moveTo(140,40); ctx.bezierCurveTo(320,160,480,120,560,30); ctx.bezierCurveTo(600,-20,640,0,620,40); ctx.bezierCurveTo(560,170,330,210,120,110); ctx.closePath(); ctx.fillStyle=D; ctx.fill(); ctx.strokeStyle=L(0.95); lw(2.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(610,10); ctx.lineTo(680,-30); ctx.lineTo(650,40); ctx.lineTo(700,70); ctx.lineTo(620,60); ctx.closePath(); ctx.fillStyle=D; ctx.fill(); ctx.stroke();
  // 后腿
  ctx.beginPath(); ctx.moveTo(60,40); ctx.bezierCurveTo(170,40,180,160,120,200); ctx.lineTo(150,250); ctx.lineTo(60,250); ctx.lineTo(70,200); ctx.bezierCurveTo(20,150,0,100,60,40); ctx.fillStyle=D; ctx.fill(); ctx.stroke();
  for(let k=0;k<3;k++){ ctx.beginPath(); ctx.moveTo(80+k*25,250); ctx.quadraticCurveTo(70+k*25,272,58+k*25,268); lw(2.4); ctx.stroke(); }
  // 身体
  ctx.beginPath(); ctx.ellipse(0,0,170,110,-0.12,0,TAU); ctx.fillStyle=D; ctx.fill(); ctx.strokeStyle=L(1); lw(2.6); ctx.stroke();
  for(let k=0;k<7;k++){ ctx.beginPath(); const xx=-120+k*32; ctx.moveTo(xx,40+Math.abs(k-3)*4); ctx.quadraticCurveTo(xx+14,70,xx+4,96); ctx.strokeStyle=L(0.55); lw(1.4); ctx.stroke(); } // 腹甲
  for(let r=0;r<3;r++) for(let k=0;k<6;k++){ ctx.beginPath(); ctx.arc(-80+k*34+r*16,-50+r*26,11,0.2,Math.PI-0.2); ctx.strokeStyle=L(0.35); lw(1); ctx.stroke(); }
  // 前腿
  ctx.beginPath(); ctx.moveTo(-90,40); ctx.bezierCurveTo(-60,110,-120,170,-150,200); ctx.lineTo(-110,250); ctx.lineTo(-190,250); ctx.lineTo(-180,200); ctx.bezierCurveTo(-170,140,-150,90,-130,30); ctx.fillStyle=D; ctx.fill(); ctx.strokeStyle=L(0.95); lw(2.2); ctx.stroke();
  for(let k=0;k<3;k++){ ctx.beginPath(); ctx.moveTo(-170+k*25,250); ctx.quadraticCurveTo(-180+k*25,272,-192+k*25,268); lw(2.4); ctx.stroke(); }
  // 脖子
  const nk=Math.sin(t*1.5)*8;
  ctx.beginPath(); ctx.moveTo(-110,-70); ctx.bezierCurveTo(-200,-110,-200,-230,-300+nk,-260); ctx.lineTo(-330+nk,-205); ctx.bezierCurveTo(-250,-170,-230,-40,-150,20); ctx.closePath(); ctx.fillStyle=D; ctx.fill(); ctx.stroke();
  for(let k=0;k<8;k++){ const q=k/8; ctx.beginPath(); ctx.moveTo(lerp(-150,-320,q)+nk*q,lerp(15,-205,q)); ctx.lineTo(lerp(-110,-300,q)+nk*q,lerp(-60,-252,q)); ctx.strokeStyle=L(0.4); lw(1.2); ctx.stroke(); }
  // 背刺
  for(let k=0;k<9;k++){ const q=k/8, bx=lerp(-300,120,q), by=lerp(-262,-100,q)+Math.sin(q*3)*-40; ctx.beginPath(); ctx.moveTo(bx-14,by+6); ctx.lineTo(bx+4,by-34); ctx.lineTo(bx+16,by+8); ctx.fillStyle=D; ctx.fill(); ctx.strokeStyle=L(0.9); lw(1.6); ctx.stroke(); }
  // 头（张口朝左下）
  ctx.save(); ctx.translate(-320+nk,-235); ctx.rotate(0.25);
  ctx.beginPath(); ctx.moveTo(20,-30); ctx.lineTo(-120,-24); ctx.lineTo(-150,-6); ctx.lineTo(-60,0); ctx.lineTo(10,20); ctx.closePath(); ctx.fillStyle=D; ctx.fill(); ctx.strokeStyle=L(1); lw(2.4); ctx.stroke();
  ctx.save(); ctx.rotate(0.32); ctx.beginPath(); ctx.moveTo(10,12); ctx.lineTo(-120,14); ctx.lineTo(-130,28); ctx.lineTo(0,40); ctx.closePath(); ctx.fillStyle=D; ctx.fill(); ctx.stroke(); ctx.restore();
  for(let k=0;k<6;k++){ ctx.beginPath(); ctx.moveTo(-40-k*16,-1); ctx.lineTo(-46-k*16,10); ctx.lineTo(-52-k*16,-1); ctx.fillStyle=rgba([255,240,220],0.9); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(0,-28); ctx.bezierCurveTo(30,-70,70,-90,110,-80); ctx.bezierCurveTo(70,-70,40,-50,14,-20); ctx.fillStyle=D; ctx.fill(); ctx.strokeStyle=L(1); lw(2); ctx.stroke(); // 角
  ctx.beginPath(); ctx.moveTo(-14,-30); ctx.bezierCurveTo(10,-90,50,-110,80,-112); ctx.strokeStyle=L(0.6); lw(1.6); ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,-60,-14,18,[255,90,40],1); glow(ctx,-60,-14,4,[255,240,200],1); ctx.restore();
  ctx.restore();
  // 近侧翅膀
  wing(-30,-80,1,-0.05+flap);
  // 长矛刺进胸口
  if(o.lance){ ctx.strokeStyle=rgba([235,225,210],0.95); lw(7); ctx.beginPath(); ctx.moveTo(-760,620); ctx.lineTo(-120,-10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-150,22); ctx.lineTo(-90,-40); ctx.lineTo(-104,6); ctx.closePath(); ctx.fillStyle=rgba([255,250,240],1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-560,420); ctx.lineTo(-470,380); ctx.lineTo(-520,450); ctx.closePath(); ctx.fillStyle=rgba([200,40,30],0.9); ctx.fill(); }
  ctx.restore();
  // 火：从嘴里喷出的粒子流（屏幕坐标）
  if(o.fire>0){ const mx=x+(-320-140)*s, my=y+(-235+ -20)*s+40*s; ctx.save(); ctx.globalCompositeOperation='lighter'; const r=rng(77);
    for(let i=0;i<420;i++){ const ph=r(), life=((t*1.6+ph)%1), sp=(r()-0.5)*0.5, d=life*1300*s*o.fire, ang=Math.PI*0.86+sp*(0.3+life);
      const px=mx+Math.cos(ang)*d, py=my+Math.sin(ang)*d+life*life*80*s, rr=(12+life*110)*s;
      const col=life<0.25?[255,240,170]:(life<0.6?[255,150,60]:[200,60,30]); glow(ctx,px,py,rr,col,(1-life)*0.5*a*o.fire); }
    ctx.restore(); } }

// ───────── 背景 ─────────
function bgFill(ctx,top,bot){ const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,top); g.addColorStop(1,bot); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
function embers(ctx,t,a){ if(a<=0.01) return; ctx.save(); ctx.globalCompositeOperation='lighter'; const r=rng(44); for(let i=0;i<160;i++){ const x=(r()*W+Math.sin(t*0.8+i)*30), y=(r()*H-t*(60+r()*90)+H*20)%H; glow(ctx,x,y,3+r()*5,[255,140+r()*80,60],a*(0.3+0.5*r())); } ctx.restore(); }
function rain(ctx,t,a,dens=700,spd=1500){ if(a<=0.01) return; const r=rng(3); ctx.save(); ctx.strokeStyle=rgba(RAIN,0.38*a); ctx.lineWidth=1.3; ctx.beginPath();
  for(let i=0;i<dens;i++){ const X=r()*1300-100, Y=(r()*2200+t*spd*(0.7+r()*0.6))%2100-100, L=30+r()*70; ctx.moveTo(X,Y); ctx.lineTo(X-L*0.16,Y+L); } ctx.stroke(); ctx.restore(); }
// 龟裂的田（预渲染）
const CRACK=(()=>{ const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'), r=rng(19);
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2a1a0c'); gr.addColorStop(0.45,'#3a2412'); gr.addColorStop(1,'#140b05'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.lineCap='round'; for(let i=0;i<260;i++){ let x=r()*W, y=600+r()*1400, a=r()*TAU; const n=6+r()*14|0, w=0.8+r()*2.6; g.strokeStyle=`rgba(8,4,2,${0.6+r()*0.4})`; g.lineWidth=w; g.beginPath(); g.moveTo(x,y);
    for(let k=0;k<n;k++){ a+=(r()-0.5)*1.1; const st=12+r()*30; x+=Math.cos(a)*st; y+=Math.sin(a)*st*0.6; g.lineTo(x,y); } g.stroke(); }
  for(let i=0;i<180;i++){ const x=r()*W, y=640+r()*1300; g.strokeStyle='rgba(120,80,40,0.25)'; g.lineWidth=1; g.beginPath(); g.moveTo(x,y); g.lineTo(x+(r()-0.5)*60,y+(r()-0.5)*20); g.stroke(); }
  return c; })();
// 土龙：尘土粒子聚成一条龙的样子
const CLAY=(()=>{ const r=rng(29), s=[]; for(let i=0;i<2200;i++){ const u=Math.pow(r(),0.85), v=r()*2-1; s.push({u,v,sx:r()*W,sy:1500+r()*500,ph:r(),sz:1.5+r()*3}); } return s; })();
function claySpine(t){ return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1); return [180+u*720+Math.sin(t*0.6)*6, 1010+Math.sin(u*TAU*1.2+0.4)*40*(0.4+u)-Math.max(0,0.14-u)*420]; }); }

// ───────── 甲骨（卜辞）─────────
function oracle(ctx,t,a0,a1){ if(t<a0||t>a1) return; const k=ease(P(t,a0,a0+0.6)), ko=P(t,a1-0.4,a1), A=k*(1-ko); ctx.save(); ctx.globalAlpha=A; ctx.translate(540,1020); ctx.scale(lerp(0.92,1,k),lerp(0.92,1,k));
  // 龟甲形骨片
  ctx.beginPath(); ctx.moveTo(-300,-260); ctx.bezierCurveTo(-120,-330,120,-330,300,-260); ctx.bezierCurveTo(360,-60,350,160,280,280); ctx.bezierCurveTo(100,340,-100,340,-280,280); ctx.bezierCurveTo(-350,160,-360,-60,-300,-260); ctx.closePath();
  const g=ctx.createLinearGradient(-300,-300,300,300); g.addColorStop(0,'#d8c6a0'); g.addColorStop(1,'#a88d62'); ctx.fillStyle=g; ctx.fill(); ctx.strokeStyle='rgba(60,36,14,0.8)'; ctx.lineWidth=3; ctx.stroke();
  const r=rng(5); ctx.strokeStyle='rgba(70,40,16,0.45)'; ctx.lineWidth=1.4; for(let i=0;i<14;i++){ let x=(r()-0.5)*500, y=(r()-0.5)*500; ctx.beginPath(); ctx.moveTo(x,y); for(let j=0;j<5;j++){ x+=(r()-0.5)*70; y+=r()*40; ctx.lineTo(x,y);} ctx.stroke(); }
  // 刻字：一字一字刻出来（竖排两行）
  const lines=['其作龙于','凡田有雨'], tot=8; ctx.font=`400 96px ${DISP}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  let n=0; lines.forEach((ln,c)=>[...ln].forEach((ch,j)=>{ const kk=P(t,a0+0.6+n*0.32,a0+0.6+n*0.32+0.25); n++; if(kk<=0) return; const xx=(c?-90:90), yy=-170+j*112;
    ctx.save(); ctx.globalAlpha=A*kk; ctx.fillStyle='rgb(58,30,12)'; ctx.fillText(ch,xx+2,yy+2); ctx.fillStyle='rgb(110,60,24)'; ctx.fillText(ch,xx,yy); ctx.restore();
    if(kk<1){ ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,xx+40*(1-kk),yy+40*(kk-0.5),26,[255,220,160],0.8*(1-kk)); ctx.restore(); } }));
  ctx.restore(); }

// ───────── 皇权：玉玺 + 团龙 ─────────
function seal(ctx,t){ const k=t<LT.seal?0:1, drop=P(t,LT.seal,LT.seal+0.35), s=lerp(1.7,1,ein(drop)), a=P(t,LT.seal,LT.seal+0.12)*(1-P(t,LT.five-0.4,LT.five));
  if(a<=0.01) return; ctx.save(); ctx.globalAlpha=a; ctx.translate(540,CYL); ctx.scale(s,s);
  const L=al=>rgba(IMP,al); ctx.lineWidth=5; ctx.strokeStyle=L(0.95); ctx.strokeRect(-380,-380,760,760); ctx.lineWidth=2; ctx.strokeRect(-350,-350,700,700);
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ ctx.save(); ctx.translate(sx*350,sy*350); ctx.scale(sx,sy); ctx.beginPath(); for(let k2=0;k2<=24;k2++){ const an=k2/24*TAU*1.3, rr=40*(1-k2/32); k2?ctx.lineTo(-Math.cos(an)*rr-30,-Math.sin(an)*rr-30):ctx.moveTo(-Math.cos(an)*rr-30,-Math.sin(an)*rr-30); } ctx.strokeStyle=L(0.7); ctx.stroke(); ctx.restore(); }
  ctx.restore(); }
// 大爪特写：五趾，第五趾被剪掉
function bigClaw(ctx,t){ const a=P(t,LT.five,LT.five+0.4)*(1-P(t,LT.dance-0.4,LT.dance)); if(a<=0.01) return; ctx.save(); ctx.globalAlpha=a; ctx.translate(540,1120); ctx.scale(1.45,1.45); ctx.lineCap='round'; ctx.lineJoin='round';
  const L=al=>rgba(IMP,al), D='rgb(20,14,6)';
  // 腕
  ctx.beginPath(); ctx.moveTo(-120,420); ctx.bezierCurveTo(-110,250,-150,150,-110,60); ctx.lineTo(110,60); ctx.bezierCurveTo(150,150,110,250,120,420); ctx.closePath(); ctx.fillStyle=D; ctx.fill(); ctx.strokeStyle=L(1); ctx.lineWidth=3; ctx.stroke();
  for(let r=0;r<5;r++) for(let k=0;k<5;k++){ ctx.beginPath(); ctx.arc(-80+k*40+(r%2)*20,120+r*55,18,0.2,Math.PI-0.2); ctx.strokeStyle=L(0.45); ctx.lineWidth=1.4; ctx.stroke(); }
  // 肘毛
  for(let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(110,200+k*30); ctx.quadraticCurveTo(220+k*10,220+k*30,300+Math.sin(t*2+k)*20,160+k*40); ctx.strokeStyle=L(0.7); ctx.lineWidth=2; ctx.stroke(); }
  const angs=[-1.5,-0.75,0,0.75,1.5], cutK=ease(P(t,LT.cut,LT.cut+0.25)), fall=P(t,LT.cut+0.25,LT.cut+1.6);
  angs.forEach((an,i)=>{ const isCut=i===4; let ox=0, oy=0, rot=0, al=1; if(isCut&&t>=LT.cut+0.25){ ox=120*fall; oy=900*fall*fall; rot=fall*2.2; al=1-fall; }
    const pop=backOut(P(t,LT.five+0.3+i*0.25,LT.five+0.6+i*0.25)); if(pop<=0) return;
    ctx.save(); ctx.translate(ox,oy); ctx.rotate(rot*0.3); ctx.globalAlpha=a*al; ctx.rotate(an*0.55); ctx.scale(pop,pop);
    // 趾两节 + 弯钩
    ctx.beginPath(); ctx.moveTo(-26,40); ctx.bezierCurveTo(-34,-60,-24,-150,-14,-210); ctx.lineTo(14,-210); ctx.bezierCurveTo(24,-150,34,-60,26,40); ctx.closePath(); ctx.fillStyle=D; ctx.fill(); ctx.strokeStyle=L(1); ctx.lineWidth=2.6; ctx.stroke();
    for(const yy of [-40,-120]){ ctx.beginPath(); ctx.moveTo(-28,yy); ctx.quadraticCurveTo(0,yy+14,28,yy); ctx.strokeStyle=L(0.6); ctx.lineWidth=1.6; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-16,-206); ctx.bezierCurveTo(-10,-270,30,-300,52,-290); ctx.bezierCurveTo(30,-270,18,-240,16,-206); ctx.closePath(); ctx.fillStyle=rgba([250,236,200],0.95); ctx.fill(); ctx.strokeStyle=L(0.9); ctx.lineWidth=1.6; ctx.stroke();
    // 编号
    ctx.rotate(-an*0.55); ctx.font=`400 54px ${DISP}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=isCut&&t>LT.cut?'rgba(255,90,70,0.95)':'#f4ead8'; ctx.fillText(String(i+1),Math.sin(an*0.55)*340,-Math.cos(an*0.55)*340);
    ctx.restore(); });
  // 剪刀线
  if(cutK>0&&cutK<1||(t>=LT.cut&&t<LT.cut+0.5)){ const kk=P(t,LT.cut,LT.cut+0.25); ctx.save(); ctx.rotate(1.5*0.55); ctx.strokeStyle=`rgba(255,250,240,${1-P(t,LT.cut+0.25,LT.cut+0.5)})`; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-80,-20); ctx.lineTo(-80+160*kk,-20); ctx.stroke(); ctx.restore(); }
  ctx.restore(); }

// ───────── 舞龙：一根根竿子撑起龙身，下面是人 ─────────
function danceFigures(ctx,t,S,cam,a){ if(a<=0.01) return; ctx.save(); ctx.globalAlpha=a; ctx.lineCap='round'; const L=al=>rgba(GOLD,al);
  for(let k=1;k<=9;k++){ const i=Math.round(k/10*(S.length-1)), q=proj(cam,S[i]); const gx=q[0], gy=1300+Math.sin(t*4+k*0.7)*10, bob=Math.sin(t*4+k*0.7);
    ctx.strokeStyle=L(0.85); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(q[0],q[1]); ctx.lineTo(gx,gy-100); ctx.stroke(); // 竿
    // 人：头、身、手臂、腿（跑动）
    ctx.save(); ctx.translate(gx,gy); ctx.scale(1.7,1.7); ctx.translate(-gx,-gy); ctx.lineWidth=3; ctx.strokeStyle=rgba([255,120,90],0.9); ctx.beginPath(); ctx.arc(gx+10,gy-90,12,0,TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx+10,gy-76); ctx.lineTo(gx+8,gy-20); ctx.moveTo(gx+10,gy-64); ctx.lineTo(gx,gy-60); ctx.moveTo(gx+8,gy-20); ctx.lineTo(gx-6+bob*12,gy+24); ctx.moveTo(gx+8,gy-20); ctx.lineTo(gx+22-bob*12,gy+24); ctx.stroke(); ctx.restore(); }
  ctx.restore(); }

// ───────── 三维龙的脊线与相机 ─────────
const UP3=t=>{ // drop：从下方冲上来
  const k=expo(P(t,LT.drop,LT.drop+1.4)); return poseHero(t).map(p=>[p[0],p[1]+1500*(1-k),p[2]]); };
const DANCE3=(t)=>{ const raw=[]; for(let k=0;k<=240;k++){ const u=k/240; raw.push([-620+u*1300, -60+Math.sin(u*TAU*1.4-t*3.2)*120+Math.sin(u*TAU*0.5)*40, Math.cos(u*TAU*1.4-t*3.2)*120]); } return resample(raw).reverse(); };

const LOFF=document.createElement('canvas'); LOFF.width=W; LOFF.height=H;
function sceneChina(ctx,t,o){ // 雨中的中国龙
  const S=o.S||poseHero(t), cam=makeCam({yaw:o.yaw??-0.15,pitch:0.06,D:o.D||1800,f:1500,cx:o.cx||540,cy:o.cy||CYL}); return {r:drawDragon3D(ctx,t,S,cam,{R:72,tilt:0.05,head2d:true,col:o.col,lit:2,part:o.part,a:o.a}),cam,S}; }

function renderL(ctx,t){ ctx.setTransform(1,0,0,1,0,0);
  const sk=(t>=LT.drop?Math.max(0,1-(t-LT.drop)/0.35)*14:0)+(t>=LT.seal?Math.max(0,1-(t-LT.seal-0.35)/0.3)*(t>LT.seal+0.35?10:0):0);
  // ── 0–4 钩子：左右分屏 ──
  if(t<LT.west){ // 左：火；右：雨
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,540,H); ctx.clip(); bgFill(ctx,'#2a0806','#090202'); embers(ctx,t,0.9); drawWest(ctx,t,390,1000,0.56,{fire:1,lance:true}); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(540,0,540,H); ctx.clip(); bgFill(ctx,'#0b1424','#03060c'); rain(ctx,t,1); sceneChina(ctx,t,{cx:900,cy:1000,D:2700,yaw:-0.1}); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createLinearGradient(530,0,550,0); g.addColorStop(0,'rgba(255,220,160,0)'); g.addColorStop(0.5,'rgba(255,220,160,0.7)'); g.addColorStop(1,'rgba(255,220,160,0)'); ctx.fillStyle=g; ctx.fillRect(530,170,20,1300); ctx.restore(); }
  // ── 4–14.5 西方的龙 ──
  else if(t<LT.dry){ const k=P(t,LT.turn,LT.turn+1.6); bgFill(ctx,'#2a0806','#090202'); embers(ctx,t,1-k);
    const fire=(1-k)*(t<LT.west+0.6?ease(P(t,LT.west,LT.west+0.6)):1);
    drawWest(ctx,t,560,1000,0.92,{fire,gold:t>=7.0,a:1-0.7*k,col:k>0?[lerp(255,150,k),lerp(120,150,k),lerp(60,170,k)]:FIRE});
    if(k>0){ ctx.save(); ctx.globalAlpha=k; bgFill(ctx,'rgba(11,20,36,0.85)','rgba(3,6,12,0.9)'); ctx.restore(); rain(ctx,t,k); } }
  // ── 14.5–27 渴：龟裂的田、土龙、卜辞 ──
  else if(t<LT.drop){ ctx.drawImage(CRACK,0,0); const heat=1-P(t,LT.dark,LT.drop);
    ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,540,360,520,[255,170,80],0.35*heat); glow(ctx,540,360,120,[255,240,200],0.6*heat); ctx.restore();
    // 热浪：地面上的光晕抖动
    // 土龙
    if(t>=LT.clay-1){ const S=claySpine(t), F=frame(S); ctx.save();
      for(const p of CLAY){ const ta=LT.clay+p.u*2.6+p.ph*0.5, k=ease(P(t,ta-1.4,ta)); if(k<=0) continue; const q=at(F,p.u,p.v*0.95,62); const swirl=(1-k)*2;
        const x=lerp(p.sx,q[0],k)+Math.sin(swirl+p.ph*6)*40*(1-k), y=lerp(p.sy,q[1],k)-Math.sin(Math.PI*k)*120; const al=Math.min(1,k*2)*(t<LT.bone?1:1-0.6*P(t,LT.bone,LT.bone+0.6));
        ctx.fillStyle=`rgba(${190+p.ph*60|0},${130+p.ph*50|0},${70+p.ph*30|0},${al})`; ctx.fillRect(x-p.sz/2,y-p.sz/2,p.sz,p.sz); }
      ctx.restore(); }
    oracle(ctx,t,LT.bone,LT.dark+0.2);
    const dk=P(t,LT.dark,LT.drop-0.1); if(dk>0){ ctx.fillStyle=`rgba(0,0,0,${0.82*dk})`; ctx.fillRect(0,0,W,H); } }
  // ── 27–36 暴雨，龙冲上云端 ──
  else if(t<LT.seal){ ctx.setTransform(1,0,0,1,Math.sin(t*97)*sk,Math.cos(t*83)*sk); bgFill(ctx,'#0b1424','#03060c');
    const fl=[27.25,30.0,33.0].reduce((s,o)=>s+Math.exp(-Math.pow((t-o)/0.08,2))*(t>=o?1:0.3),0)*0.7; if(fl>0.02){ ctx.fillStyle=`rgba(200,220,255,${0.22*fl})`; ctx.fillRect(-40,-40,W+80,H+80); }
    clouds(ctx,t,1.2,[50,64,100]); rain(ctx,t,1,1100,1900);
    cloudScroll(ctx,170+Math.sin(t*0.3)*20,1350,1.0,0.9,t); cloudScroll(ctx,930,620,0.7,0.8,t,-1);
    const yaw=t<LT.storm?-0.15:lerp(-0.15,0.45,eIO(P(t,LT.storm,LT.seal)));
    const res=sceneChina(ctx,t,{S:UP3(t),yaw,cy:1080}); if(res.r) pearl(ctx,t,res.r.pearl[0],res.r.pearl[1],Math.min(36,24*res.r.pearl[3]),P(t,LT.drop+0.8,LT.drop+1.5));
    cloudScroll(ctx,860,1430,1.2,0.95,t,-1); rain(ctx,t+3,0.6,300,2300);
    burst(ctx,t,LT.drop,540,1300); const fi=1-P(t,LT.drop,LT.drop+0.3); if(fi>0){ ctx.fillStyle=`rgba(0,0,0,${0.7*fi})`; ctx.fillRect(-40,-40,W+80,H+80); } }
  // ── 36–46 皇权 ──
  else if(t<LT.dance){ ctx.setTransform(1,0,0,1,Math.sin(t*97)*sk,Math.cos(t*83)*sk); bgFill(ctx,'#2a1c06','#0a0602');
    ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,540,CYL,700,[255,190,60],0.18); ctx.restore();
    const ringA=P(t,LT.seal-0.1,LT.seal+0.2)*(1-P(t,LT.five-0.4,LT.five));
    if(ringA>0){ const s=lerp(1.7,1,ein(P(t,LT.seal,LT.seal+0.35))); const cam=makeCam({yaw:0,pitch:0.0,D:1800*s*1.3,f:1500,cy:CYL}); drawDragon3D(ctx,t,poseRing(t).map(p=>[p[0]*0.95,p[1]*0.95,p[2]*0.3]),cam,{R:52,tilt:0.3,head2d:true,col:IMP,a:ringA,lit:2}); }
    seal(ctx,t); bigClaw(ctx,t); }
  // ── 46–54 舞龙 ──
  else if(t<LT.end){ bgFill(ctx,'#1d0a08','#060203'); ctx.save(); ctx.globalCompositeOperation='lighter'; const r=rng(61); for(let i=0;i<40;i++){ const x=r()*W, y=200+r()*900; glow(ctx,x,y+Math.sin(t*2+i)*10,40+r()*60,[255,90+r()*60,50],0.12); } ctx.restore();
    const S=DANCE3(t), cam=makeCam({yaw:-0.05,pitch:0.12,D:1900,f:1500,cy:900}); const a=P(t,LT.dance,LT.dance+0.6)*(1-P(t,LT.end-0.4,LT.end));
    danceFigures(ctx,t,S,cam,a); drawDragon3D(ctx,t,S,cam,{R:46,tilt:0.0,head2d:true,a,lit:2}); }
  // ── 54–60 并置 ──
  else { const k=ease(P(t,LT.end,LT.end+0.8));
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,540,H); ctx.clip(); bgFill(ctx,'#2a0806','#090202'); embers(ctx,t,0.9); drawWest(ctx,t,390,1020,0.56,{fire:1,gold:true}); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(540,0,540,H); ctx.clip(); bgFill(ctx,'#0b1424','#03060c'); rain(ctx,t,1); sceneChina(ctx,t,{cx:900,cy:1000,D:2700,yaw:-0.1}); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,220,160,0.5)'; ctx.fillRect(538,170,4,1300*k); ctx.restore(); }
  ctx.setTransform(1,0,0,1,0,0);
  textsL(ctx,t); brand(ctx,t);
  const v=ctx.createRadialGradient(540,900,520,540,900,1250); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.5)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  const fo=P(t,LDUR-0.6,LDUR); if(fo>0){ ctx.fillStyle=`rgba(0,0,0,${fo})`; ctx.fillRect(0,0,W,H); } }

function textsL(ctx,t){ const red={col:'#ffe2cf'}, gold={};
  // 钩子：首帧就在
  if(t<LT.west){ ctx.save(); ctx.font=`400 112px ${DISP}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.globalAlpha=1-P(t,LT.west-0.3,LT.west); ctx.fillStyle='#f4ead8'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=24; ctx.fillText('同一个「龙」',540,330);
    ctx.font=`400 76px ${DISP}`; ctx.fillStyle='#ffd2b8'; ctx.fillText('他们屠龙',270,1250); ctx.fillStyle='#f4ead8'; ctx.fillText('我们拜龙',810,1250); ctx.restore(); }
  say(ctx,t,'它喷火',540,320,110,4.2,6.9,red); say(ctx,t,'它守着金子',540,320,96,7.0,9.5,red);
  say(ctx,t,'在《圣经》里',540,300,76,9.6,12.0,red); say(ctx,t,'龙，就是魔鬼',540,410,96,9.9,12.0,red); src(ctx,t,'《启示录》12:9：大龙就是那古蛇，名叫魔鬼',1310,10.2,12.0);
  pop(ctx,t,'可中国的龙，不喷火',540,330,84,12.2,14.4);
  say(ctx,t,'3000 多年前',540,300,104,14.6,17.9); say(ctx,t,'天，不下雨',540,430,84,15.2,17.9);
  say(ctx,t,'商朝人在田里',540,300,80,18.0,22.4); say(ctx,t,'造了一条龙',540,420,96,18.4,22.4);
  say(ctx,t,'甲骨卜辞',540,330,76,22.6,26.3); src(ctx,t,'其作龙于凡田，有雨 —— 在凡地的田里造龙，会下雨',1320,23.2,26.3);
  pop(ctx,t,'它下雨',540,330,150,LT.drop+0.05,29.9);
  say(ctx,t,'旱而为应龙之状',540,300,84,30.0,33.0); say(ctx,t,'乃得大雨',540,410,96,30.4,33.0); src(ctx,t,'《山海经 · 大荒东经》',1320,30.4,33.0);
  say(ctx,t,'种地的人',540,300,84,33.1,35.9); say(ctx,t,'命在天上',540,410,104,33.5,35.9);
  say(ctx,t,'后来，皇帝把龙收走了',540,300,76,36.2,38.5);
  say(ctx,t,'1270 年',540,280,110,38.6,40.9); say(ctx,t,'民间不许织龙',540,400,84,38.9,40.9); src(ctx,t,'元 · 至元七年：不得织造日、月、龙、凤缎匹',1320,39.0,40.9);
  say(ctx,t,'五爪二角，才叫龙',540,300,84,41.0,43.5); src(ctx,t,'元 · 延祐元年：龙谓五爪二角者',1320,41.3,43.5);
  say(ctx,t,'于是，商人少织一只爪',540,280,70,43.6,45.95); say(ctx,t,'街上的龙，只有四个爪儿',540,380,64,44.3,45.95); src(ctx,t,'元 · 大德元年（1297）官员奏报',1320,44.5,45.95);
  say(ctx,t,'舞龙，本来就是求雨',540,300,84,46.2,49.6); say(ctx,t,'龙，又回到了人群里',540,300,84,49.8,53.9);
  say(ctx,t,'一个，夺走你的东西',270,1250,50,54.3,LDUR,red); say(ctx,t,'一个，给你送来雨',810,1250,50,55.0,LDUR);
  say(ctx,t,'你觉得「龙」',540,300,90,56.2,LDUR); say(ctx,t,'该翻译成 dragon 吗？',540,420,72,56.7,LDUR); }
window.__ep={render:renderL,DUR:LDUR};
