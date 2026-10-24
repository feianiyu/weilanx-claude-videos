// ───────── 细线描龙头（侧面，局部坐标：x 朝前，-y 朝上，头长约 250）─────────
// 线条风：近黑填充只用来遮挡，所有细节都靠线——头骨、眉骨、皱鼻、如意鼻、唇齿、獠牙、杏眼、眼袋、颊鳞、腮毛、鹿角（带节纹）、扇耳、鬃毛、长须、须髯、卷舌。
function drawHead2D(ctx,t,x,y,ang,hs,o={}){ const jaw=o.jaw??(0.3+0.06*Math.sin(t*1.8)), col=o.col||[255,212,140], hi=o.hi||[255,240,214], part=o.part||(()=>({dx:0,dy:0,a:1}));
  const L=a=>rgba(col,a), Hc=a=>rgba(hi,a), DARK=o.dark||'rgb(10,11,18)';
  const flip=Math.cos(ang)<0?-1:1;
  const grp=(name,fn)=>{ const p=part(name); if(p.a<=0.01) return; ctx.save(); ctx.translate(x+p.dx,y+p.dy); ctx.rotate(ang); ctx.scale(hs,hs*flip); ctx.globalAlpha*=p.a; ctx.lineCap='round'; ctx.lineJoin='round'; fn(); ctx.restore(); };
  const lw=v=>{ ctx.lineWidth=v/hs; };
  const lockS=(x0,y0,pts,w,al=0.9,fill=DARK)=>{ // 一缕火焰毛：根宽尾尖，金边 + 中线
    const P=[[x0,y0],...pts], m=P.length, Lf=[], Rt=[];
    for(let k=0;k<m;k++){ const a=P[Math.max(0,k-1)], b=P[Math.min(m-1,k+1)]; let dx=b[0]-a[0], dy=b[1]-a[1]; const l=Math.hypot(dx,dy)||1; dx/=l; dy/=l; const q=k/(m-1), ww=w*Math.pow(1-q,0.85)*(0.6+0.4*Math.sin(Math.min(1,q*3+0.25)*Math.PI/2)); Lf.push([P[k][0]-dy*ww,P[k][1]+dx*ww]); Rt.push([P[k][0]+dy*ww,P[k][1]-dx*ww]); }
    ctx.beginPath(); Lf.forEach((p,k)=>k?ctx.lineTo(...p):ctx.moveTo(...p)); for(let k=m-1;k>=0;k--) ctx.lineTo(...Rt[k]); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=L(al); lw(1.6); ctx.stroke();
    ctx.strokeStyle=L(al*0.55); lw(1); ctx.beginPath(); for(let k=1;k<m-1;k++) k>1?ctx.lineTo(...P[k]):ctx.moveTo(...P[k]); ctx.stroke(); };
  const wave=(x0,y0,dx,dy,n,amp,ph,curl=0)=>{ const pts=[]; for(let k=1;k<=n;k++){ const q=k/n; pts.push([x0+dx*q+Math.sin(ph+q*4)*amp*q*0.3,y0+dy*q+Math.sin(ph+q*5)*amp*q+curl*q*q*q]); } return pts; };
  // ── 鬃毛（最后面）──
  grp('head',()=>{ for(let k=0;k<16;k++){ const s0=k/15, x0=lerp(46,-14,s0), y0=lerp(-92,34,s0), Lx=-(210+70*Math.sin(k*2.1)+40*(1-Math.abs(s0-0.35))), dy=(s0-0.3)*150, ph=t*2.2+k*0.8;
      lockS(x0,y0,wave(x0,y0,Lx,dy,9,22,ph,-30*Math.sin(k)),20+8*Math.sin(k*1.3),0.85); } });
  // ── 远侧鹿角 ──
  const antler=(ox,oy,al,fill)=>{ ctx.save(); ctx.translate(ox,oy); const sw=Math.sin(t*1.2)*3;
    const beam=[[62,-96],[40,-126],[8,-148],[-34,-162],[-86,-170],[-150,-170+sw]], tines=[[1,[[48,-162],[40,-200],[24,-222]]],[3,[[-24,-198],[-36,-232],[-56,-250]]],[4,[[-80,-204],[-100,-232],[-124,-244]]]];
    const bone=(pts0,w0)=>{ const pts=[]; for(let k=0;k<=12;k++){ const sp=k/12*(pts0.length-1), i=Math.min(pts0.length-2,Math.floor(sp)), f=sp-i, p0=pts0[Math.max(0,i-1)],p1=pts0[i],p2=pts0[i+1],p3=pts0[Math.min(pts0.length-1,i+2)]; pts.push([0,1].map(d=>0.5*((2*p1[d])+(-p0[d]+p2[d])*f+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*f*f+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*f*f*f))); } const m=pts.length, Lf=[], Rt=[]; for(let k=0;k<m;k++){ const a=pts[Math.max(0,k-1)], b=pts[Math.min(m-1,k+1)]; let dx=b[0]-a[0], dy=b[1]-a[1]; const l=Math.hypot(dx,dy)||1; dx/=l; dy/=l; const ww=w0*(1-0.7*k/(m-1)); Lf.push([pts[k][0]-dy*ww,pts[k][1]+dx*ww]); Rt.push([pts[k][0]+dy*ww,pts[k][1]-dx*ww]); }
      ctx.beginPath(); Lf.forEach((p,k)=>k?ctx.lineTo(...p):ctx.moveTo(...p)); for(let k=m-1;k>=0;k--) ctx.lineTo(...Rt[k]); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=L(al); lw(1.8); ctx.stroke();
      for(let k=2;k<m-1;k+=2){ ctx.beginPath(); ctx.moveTo(...Lf[k]); ctx.quadraticCurveTo((Lf[k][0]+Rt[k][0])/2+3,(Lf[k][1]+Rt[k][1])/2+3,...Rt[k]); ctx.strokeStyle=L(al*0.6); lw(1); ctx.stroke(); } }; // 节纹
    for(const [i,tp] of tines) bone([beam[i],...tp],7); bone(beam,10); ctx.restore(); };
  grp('horn',()=>antler(18,10,0.5,'rgb(14,14,20)'));
  grp('ear',()=>{ ctx.save(); ctx.translate(14,8); ctx.globalAlpha*=0.6; ear(); ctx.restore(); });
  function ear(){ ctx.beginPath(); ctx.moveTo(46,-80); ctx.bezierCurveTo(20,-118,-14,-132,-40,-126); ctx.bezierCurveTo(-20,-110,8,-88,30,-66); ctx.closePath(); ctx.fillStyle=DARK; ctx.fill(); ctx.strokeStyle=L(0.95); lw(1.8); ctx.stroke();
    for(let k=0;k<4;k++){ ctx.beginPath(); ctx.moveTo(38-k*2,-76+k*2); ctx.quadraticCurveTo(10-k*6,-108+k*6,-30+k*6,-122+k*8); ctx.strokeStyle=L(0.5); lw(1); ctx.stroke(); } }
  // ── 口腔与舌（先画，压在下颌后面）──
  grp('head',()=>{ const rp=(px,py)=>{ const c=Math.cos(jaw), sn=Math.sin(jaw), dx=px-72, dy=py+8; return [72+dx*c-dy*sn,-8+dx*sn+dy*c]; };
    ctx.beginPath(); ctx.moveTo(72,-8); ctx.lineTo(120,-16); ctx.lineTo(200,-26); ctx.lineTo(232,-30); ctx.lineTo(...rp(214,6)); ctx.lineTo(...rp(150,6)); ctx.lineTo(...rp(90,2)); ctx.closePath(); ctx.fillStyle='rgb(58,10,10)'; ctx.fill();
    const a1=rp(110,0), a2=rp(200,0); ctx.beginPath(); ctx.moveTo(...a1); ctx.bezierCurveTo(a1[0]+40,a1[1]+6,a2[0]-20,a2[1]-4,252,-14); ctx.bezierCurveTo(270,-24,266,-42,252,-40); ctx.bezierCurveTo(242,-38,242,-28,250,-26); ctx.strokeStyle='rgba(220,90,70,0.95)'; lw(4); ctx.stroke(); });
  // ── 下颌 ──
  grp('head',()=>{ ctx.save(); ctx.translate(72,-8); ctx.rotate(jaw); ctx.translate(-72,8);
    // 须髯
    for(let k=0;k<6;k++){ const x0=120+k*16, y0=44; lockS(x0,y0,wave(x0,y0,-60-k*12,110+k*10,7,14,t*2+k),9,0.8); }
    ctx.beginPath(); ctx.moveTo(72,-8); ctx.lineTo(206,6); ctx.bezierCurveTo(222,8,230,18,228,30); ctx.bezierCurveTo(224,44,206,50,184,50); ctx.bezierCurveTo(140,50,96,42,58,34); ctx.bezierCurveTo(30,28,10,24,-8,20); ctx.closePath();
    ctx.fillStyle=DARK; ctx.fill(); ctx.strokeStyle=L(1); lw(2.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80,6); ctx.bezierCurveTo(120,16,170,22,212,20); ctx.strokeStyle=L(0.55); lw(1.2); ctx.stroke(); // 下唇线
    for(let k=0;k<5;k++){ ctx.beginPath(); ctx.arc(70+k*26,34,10,Math.PI*1.1,Math.PI*1.9); ctx.strokeStyle=L(0.4); lw(1); ctx.stroke(); } // 颌下鳞
    for(let k=0;k<11;k++){ const xx=96+k*10; ctx.beginPath(); ctx.moveTo(xx,-1+k*0.6); ctx.lineTo(xx+4,-10+k*0.6); ctx.lineTo(xx+8,0+k*0.6); ctx.fillStyle=Hc(0.95); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(186,6); ctx.quadraticCurveTo(192,-14,194,-30); ctx.quadraticCurveTo(200,-12,198,8); ctx.fillStyle=Hc(1); ctx.fill(); ctx.strokeStyle=L(0.8); lw(1); ctx.stroke(); // 下獠牙
    ctx.restore(); });
  // ── 上颌与头骨 ──
  grp('head',()=>{ ctx.beginPath(); ctx.moveTo(-12,-60); ctx.bezierCurveTo(8,-82,38,-98,70,-100); ctx.bezierCurveTo(92,-102,108,-94,120,-84); ctx.bezierCurveTo(132,-74,142,-68,158,-66);
    ctx.bezierCurveTo(178,-64,194,-70,208,-78); ctx.bezierCurveTo(228,-90,254,-76,252,-52); ctx.bezierCurveTo(251,-40,242,-32,232,-30); ctx.lineTo(200,-26); ctx.lineTo(120,-16); ctx.lineTo(72,-8); ctx.bezierCurveTo(52,0,20,8,-12,14); ctx.closePath();
    ctx.fillStyle=DARK; ctx.fill(); ctx.strokeStyle=L(1); lw(2.6); ctx.stroke();
    // 上唇（波浪）与上牙
    ctx.beginPath(); for(let k=0;k<=12;k++){ const xx=lerp(232,80,k/12), yy=lerp(-30,-10,k/12)-((k%2)?4:0); k?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy); } ctx.strokeStyle=L(0.85); lw(1.4); ctx.stroke();
    for(let k=0;k<12;k++){ const xx=100+k*10, yy=lerp(-14,-28,k/11); ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx+4,yy+9); ctx.lineTo(xx+8,yy); ctx.fillStyle=Hc(0.95); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(206,-28); ctx.quadraticCurveTo(212,-4,206,16); ctx.quadraticCurveTo(202,-6,198,-27); ctx.fillStyle=Hc(1); ctx.fill(); ctx.strokeStyle=L(0.8); lw(1); ctx.stroke(); // 上獠牙
    // 鼻梁皱纹
    for(let k=0;k<5;k++){ const xx=150+k*10; ctx.beginPath(); ctx.moveTo(xx,-66+k*0.6); ctx.quadraticCurveTo(xx+5,-58,xx+2,-48); ctx.strokeStyle=L(0.55); lw(1.2); ctx.stroke(); }
    // 如意鼻：鼻头回卷 + 鼻孔
    ctx.beginPath(); for(let k=0;k<=30;k++){ const a=-Math.PI/2+k/30*TAU*1.25, r=16*(1-k/40); k?ctx.lineTo(222+Math.cos(a)*r,-72+Math.sin(a)*r):ctx.moveTo(222+Math.cos(a)*r,-72+Math.sin(a)*r); } ctx.strokeStyle=L(0.9); lw(1.8); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(238,-50,6,4,0.4,0,TAU); ctx.fillStyle='rgb(0,0,0)'; ctx.fill(); ctx.strokeStyle=L(0.9); lw(1.4); ctx.stroke();
    // 颧骨线、颊鳞
    ctx.beginPath(); ctx.moveTo(40,-30); ctx.bezierCurveTo(70,-46,110,-44,150,-40); ctx.strokeStyle=L(0.6); lw(1.4); ctx.stroke();
    for(let r=0;r<3;r++) for(let k=0;k<5;k++){ const xx=4+k*16+r*8, yy=-34+r*12; ctx.beginPath(); ctx.arc(xx,yy,7,0.2,Math.PI-0.2); ctx.strokeStyle=L(0.45); lw(1); ctx.stroke(); }
    // 头顶纹
    ctx.beginPath(); ctx.moveTo(10,-74); ctx.bezierCurveTo(40,-90,80,-92,110,-86); ctx.strokeStyle=L(0.45); lw(1.1); ctx.stroke();
    // 腮毛
    for(let k=0;k<4;k++){ const x0=40+k*8, y0=6+k*6; lockS(x0,y0,wave(x0,y0,-110-k*20,40+k*14,7,10,t*2.4+k),10,0.85); } });
  // ── 眼与眉 ──
  grp('eye',()=>{ ctx.beginPath(); ctx.moveTo(96,-58); ctx.bezierCurveTo(104,-74,132,-78,146,-66); ctx.bezierCurveTo(132,-56,110,-52,96,-58); ctx.closePath();
    const g=ctx.createRadialGradient(124,-64,0,124,-64,22); g.addColorStop(0,'rgb(255,236,170)'); g.addColorStop(1,'rgb(220,120,40)'); ctx.fillStyle=g; ctx.fill(); ctx.strokeStyle=L(1); lw(2); ctx.stroke();
    ctx.beginPath(); ctx.arc(124,-65,8.5,0,TAU); ctx.strokeStyle='rgba(120,40,10,0.9)'; lw(1.4); ctx.stroke(); ctx.beginPath(); ctx.ellipse(124,-65,2.6,7.5,0,0,TAU); ctx.fillStyle='#0a0503'; ctx.fill();
    ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,120,-68,3,WHITE,1); ctx.restore();
    for(const dy of [6,12]){ ctx.beginPath(); ctx.moveTo(100,-56+dy*0.6); ctx.quadraticCurveTo(120,-48+dy,142,-58+dy*0.5); ctx.strokeStyle=L(0.4); lw(1); ctx.stroke(); } // 眼袋
    // 眉骨：一道粗棱压在眼上
    ctx.beginPath(); ctx.moveTo(92,-70); ctx.bezierCurveTo(104,-96,140,-98,154,-76); ctx.bezierCurveTo(140,-86,110,-84,92,-70); ctx.fillStyle=DARK; ctx.fill(); ctx.strokeStyle=L(1); lw(2); ctx.stroke();
    for(let k=0;k<4;k++){ const x0=112-k*6, y0=-90+k*2; lockS(x0,y0,wave(x0,y0,-120-k*30,-50-k*14,7,10,t*2+k),9-k,0.9); } });
  // ── 近侧耳、鹿角 ──
  grp('ear',()=>ear());
  grp('horn',()=>antler(0,0,1,'rgb(40,32,22)'));
  // ── 长须 ──
  grp('head',()=>{ for(const [y0,dir,len] of [[-40,-1,1],[-30,1,0.85]]){ ctx.beginPath(); ctx.moveTo(244,y0); for(let k=1;k<=40;k++){ const q=k/40, xx=244+80*Math.sin(q*Math.PI*0.85)-q*520*len, yy=y0+dir*q*170*len+Math.sin(t*2.4+k*0.28)*30*q; ctx.lineTo(xx,yy); } ctx.strokeStyle=L(0.95); lw(2.6); ctx.stroke(); } });
}
