// 墨蚁 · 真实模拟版：公用部分
const W=1080,H=1920,FPS=30,DUR=40;
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const lerp=(a,b,k)=>a+(b-a)*k, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo3=x=>1-Math.pow(1-x,3), eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, ein=x=>x*x*x;
const gauss=r=>{let u=0;for(let i=0;i<4;i++)u+=r();return (u-2)/0.58;};
const SERIF='"Noto Serif SC","Noto Serif CJK SC",serif', SANS='"Noto Sans SC","Noto Sans CJK SC",sans-serif';
function bez(P,u){const a=(1-u)**3,b=3*u*(1-u)**2,c=3*u*u*(1-u),d=u**3;return [a*P[0][0]+b*P[1][0]+c*P[2][0]+d*P[3][0],a*P[0][1]+b*P[1][1]+c*P[2][1]+d*P[3][1]];}
function bezAng(P,u){const p=bez(P,Math.max(0,u-0.002)),q=bez(P,Math.min(1,u+0.002));return Math.atan2(q[1]-p[1],q[0]-p[0]);}
const INK='#15110d', ZHU='rgba(184,32,36,0.9)';

// ── 宣纸 ──
const PAPER=(()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),r=rng(7);
  g.fillStyle='#f3efe6';g.fillRect(0,0,W,H);
  for(let i=0;i<16000;i++){g.fillStyle=`rgba(${120+r()*40},${105+r()*30},${80+r()*30},${0.012+r()*0.03})`;const x=r()*W,y=r()*H;g.save();g.translate(x,y);g.rotate(r()*3.14);g.fillRect(0,0,r()*5+0.5,r()*0.7+0.3);g.restore();}
  const v=g.createRadialGradient(W/2,H/2,500,W/2,H/2,1300);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(90,70,40,0.10)');g.fillStyle=v;g.fillRect(0,0,W,H);return c;})();
// 窝：淡墨晕（预渲染）
function nestWash(cx,cy,s,seed){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),r=rng(seed);
  for(let i=0;i<70;i++){const a=r()*6.28,d=Math.abs(gauss(r))*70*s,rad=(30+r()*150)*s,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*0.6;
    const gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,`rgba(26,22,18,${0.03+r()*0.04})`);gr.addColorStop(1,'rgba(26,22,18,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}
  return c;}

// ── 一只蚂蚁 ──
function antGlyph(ctx,x,y,ang,s,col,alpha,ph=0,bleed=0){ if(alpha<=0.005) return;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(s,s); ctx.globalAlpha=alpha; ctx.fillStyle=col; ctx.strokeStyle=col;
  const blobs=[[6.3,0,2.5,2.2],[1.6,0,3.1,1.5],[-1.6,0,0.9,0.9],[-6.1,0,4.6,3.3]];
  if(bleed>0){ ctx.globalAlpha=alpha*bleed; for(const [bx,by,rx,ry] of blobs){ctx.beginPath();ctx.ellipse(bx,by,rx*1.5,ry*1.6,0,0,6.29);ctx.fill();} ctx.globalAlpha=alpha; }
  for(const [bx,by,rx,ry] of blobs){ctx.beginPath();ctx.ellipse(bx,by,rx,ry,0,0,6.29);ctx.fill();}
  ctx.lineWidth=0.55; ctx.lineCap='round'; ctx.beginPath();
  for(let i=0;i<3;i++){ const bx=0.4+i*1.4, sw=Math.sin(ph+i*2.1)*0.35;
    for(const sd of [-1,1]){ const kx=bx+[3.2,0.6,-2.6][i]+sw*sd, ky=sd*4.2, fx=kx+[2.6,-0.6,-3.8][i]+sw*sd, fy=sd*7.8;
      ctx.moveTo(bx,sd*0.8); ctx.quadraticCurveTo(lerp(bx,kx,0.5),ky*0.9,kx,ky); ctx.quadraticCurveTo(lerp(kx,fx,0.6),lerp(ky,fy,0.4),fx,fy); } }
  for(const sd of [-1,1]){ ctx.moveTo(8.2,sd*0.8); ctx.lineTo(10.6,sd*2.6); ctx.quadraticCurveTo(12.4,sd*3.4,14.2,sd*2.2); }
  ctx.stroke(); ctx.restore();}

