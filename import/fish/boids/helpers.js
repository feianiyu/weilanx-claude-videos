const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo3=x=>1-Math.pow(1-x,3);
const eio=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
const lerp=(a,b,k)=>a+(b-a)*k;
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const W=540,H=960;


/* ---------- 水墨底：纸纹 + 一圈圈淡绿光晕 ---------- */
function makeLayer(fn){const c=document.createElement('canvas');c.width=W;c.height=H;fn(c.getContext('2d'));return c;}
const PAPER=makeLayer(g=>{
  g.fillStyle='#F3F4EE'; g.fillRect(0,0,W,H);
  const r=rng(3);
  for(let i=0;i<9000;i++){const x=r()*W,y=r()*H; g.fillStyle=`rgba(${r()<.5?60:255},${r()<.5?80:255},70,${0.025+r()*0.03})`; g.fillRect(x,y,1,1);}
  for(let i=0;i<60;i++){const x=r()*W,y=r()*H,l=10+r()*40,a=r()*TAU; g.strokeStyle=`rgba(90,110,95,${0.03+r()*0.03})`; g.lineWidth=0.6; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke();}
  const v=g.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.75); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(70,90,75,0.10)'); g.fillStyle=v; g.fillRect(0,0,W,H);
});
const HALO=makeLayer(g=>{
  const cx=W/2,cy=H*0.42,R=520;
  const gr=g.createRadialGradient(cx,cy,0,cx,cy,R);
  for(let i=0;i<=60;i++){
    const r=i/60;
    const ring=0.5+0.5*Math.cos(r*TAU*5.2);
    const fall=Math.pow(1-r,1.4);
    const core=Math.exp(-r*r*9)*0.35;
    const a=(ring*0.20+core)*fall;
    gr.addColorStop(r,`rgba(${Math.round(lerp(150,190,r))},${Math.round(lerp(205,225,r))},${Math.round(lerp(165,190,r))},${a.toFixed(3)})`);
  }
  g.fillStyle=gr; g.fillRect(0,0,W,H);
});
function inkBg(ctx,t,cy){
  ctx.drawImage(PAPER,0,0);
  const s=1+0.035*Math.sin(t*0.55), dy=(cy-H*0.42);
  ctx.save(); ctx.globalAlpha=0.9; ctx.translate(W/2,H*0.42+dy); ctx.scale(s,s); ctx.translate(-W/2,-H*0.42); ctx.drawImage(HALO,0,0); ctx.restore();
  ctx.save(); ctx.globalAlpha=0.35; ctx.translate(W/2,H*0.42+dy); ctx.scale(1.35-0.035*Math.sin(t*0.55),1.35); ctx.rotate(0.3); ctx.translate(-W/2,-H*0.42); ctx.drawImage(HALO,0,0); ctx.restore();
}


function drawFish(ctx,x,y,ang,L,a,tone,green,swim){
  if(a<=0.01||L<3) return;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.globalAlpha=a;
  const Hh=L*0.16, w=Math.sin(swim||0)*L*0.04;
  const ink=green?[11,90,46]:[30+tone*20,52+tone*25,88+tone*30];
  const rgb=(k,al)=>`rgba(${Math.round(lerp(ink[0],235,k))},${Math.round(lerp(ink[1],240,k))},${Math.round(lerp(ink[2],236,k))},${al})`;
  // 洇开的底
  ctx.fillStyle=rgb(0.55,0.12);
  ctx.beginPath(); ctx.ellipse(0,0,L*0.56,Hh*1.6,0,0,TAU); ctx.fill();
  // 尾
  ctx.fillStyle=rgb(0.45,0.55);
  ctx.beginPath(); ctx.moveTo(-L*0.36,0); ctx.quadraticCurveTo(-L*0.46,-Hh*0.2,-L*0.56,-Hh*1.15+w); ctx.quadraticCurveTo(-L*0.5,0,-L*0.56,Hh*1.15+w); ctx.quadraticCurveTo(-L*0.46,Hh*0.2,-L*0.36,0); ctx.fill();
  ctx.strokeStyle=rgb(0.2,0.35); ctx.lineWidth=Math.max(0.4,L*0.008);
  for(let k=-2;k<=2;k++){ctx.beginPath(); ctx.moveTo(-L*0.38,0); ctx.lineTo(-L*0.53,k*Hh*0.45+w); ctx.stroke();}
  // 身
  const gr=ctx.createLinearGradient(-L*0.4,0,L*0.5,0);
  gr.addColorStop(0,rgb(0.6,0.35)); gr.addColorStop(0.55,rgb(0.15,0.85)); gr.addColorStop(1,rgb(0.05,0.95));
  ctx.fillStyle=gr;
  ctx.beginPath(); ctx.moveTo(L*0.5,Hh*0.1);
  ctx.bezierCurveTo(L*0.4,-Hh*1.15,-L*0.05,-Hh*1.05,-L*0.38,-Hh*0.25);
  ctx.lineTo(-L*0.38,Hh*0.25);
  ctx.bezierCurveTo(-L*0.05,Hh*0.95,L*0.38,Hh*0.95,L*0.5,Hh*0.1); ctx.fill();
  // 腹部留白
  ctx.fillStyle=rgb(0.85,0.55); ctx.beginPath(); ctx.ellipse(L*0.08,Hh*0.42,L*0.26,Hh*0.28,0,0,TAU); ctx.fill();
  // 背线
  ctx.strokeStyle=rgb(0,0.75); ctx.lineWidth=Math.max(0.6,L*0.022); ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(L*0.42,-Hh*0.45); ctx.bezierCurveTo(L*0.2,-Hh*1.0,-L*0.1,-Hh*0.9,-L*0.36,-Hh*0.22); ctx.stroke();
  // 背鳍、胸鳍
  ctx.fillStyle=rgb(0.35,0.45);
  ctx.beginPath(); ctx.moveTo(L*0.02,-Hh*0.92); ctx.lineTo(-L*0.12,-Hh*1.6); ctx.lineTo(-L*0.16,-Hh*0.8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(L*0.22,Hh*0.4); ctx.lineTo(L*0.08,Hh*1.2+w); ctx.lineTo(L*0.12,Hh*0.4); ctx.fill();
  // 鳃线 + 眼
  if(L>16){
    ctx.strokeStyle=rgb(0.1,0.5); ctx.lineWidth=Math.max(0.4,L*0.01);
    ctx.beginPath(); ctx.arc(L*0.32,0,Hh*0.8,-1.1,1.0); ctx.stroke();
    ctx.fillStyle='rgba(245,247,242,0.95)'; ctx.beginPath(); ctx.arc(L*0.4,-Hh*0.2,Hh*0.3,0,TAU); ctx.fill();
    ctx.fillStyle='#141c22'; ctx.beginPath(); ctx.arc(L*0.41,-Hh*0.2,Hh*0.17,0,TAU); ctx.fill();
  }
  ctx.restore();
}

const LOGO_IMG=new Image(); LOGO_IMG.src="data:image/png;base64,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";
function logoImg(ctx,cx,cy,size,al){ if(!LOGO_IMG.complete||!LOGO_IMG.naturalWidth||al<=0) return; ctx.save(); ctx.globalAlpha=al; ctx.drawImage(LOGO_IMG,cx-size/2,cy-size/2,size,size); ctx.restore(); }
const BRAND_FONT='"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
function topIP(ctx,al){
  if(al<=0) return;
  const y=122;
  logoImg(ctx,W/2-37,y,20,0.6*al);
  ctx.save(); ctx.globalAlpha=0.6*al; ctx.fillStyle='#0B5A2E'; ctx.font='900 14px '+BRAND_FONT; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText('老杨魔方',W/2-23,y+1); ctx.restore();
}

function fishSimple(ctx,x,y,ang,L,a,tone,ph){
  const Hh=L*0.17, w=Math.sin(ph)*L*0.06;
  const c=Math.round(lerp(28,60,tone)), g=Math.round(lerp(48,82,tone)), b=Math.round(lerp(80,118,tone));
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.globalAlpha=a;
  ctx.fillStyle=`rgba(${c},${g},${b},0.82)`;
  ctx.beginPath(); ctx.moveTo(L*0.5,0); ctx.quadraticCurveTo(L*0.15,-Hh,-L*0.35,-Hh*0.2); ctx.lineTo(-L*0.52,-Hh*0.9+w); ctx.lineTo(-L*0.44,w*0.5); ctx.lineTo(-L*0.52,Hh*0.9+w); ctx.lineTo(-L*0.35,Hh*0.2); ctx.quadraticCurveTo(L*0.15,Hh,L*0.5,0); ctx.fill();
  ctx.restore();
}
