// ── 字：竖排题字 + 横排小注 + 印章 ──
function vtext(ctx,s,x,y,size,col,a,gap=1.18){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=col; ctx.font=`600 ${size}px ${SERIF}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  let yy=y; for(const ch of s){ if(ch==='，'||ch==='。'||ch==='？'){ ctx.save(); ctx.font=`600 ${size}px ${SERIF}`; ctx.fillText(ch,x+size*0.35,yy-size*0.35); ctx.restore(); yy+=size*0.6; continue; } ctx.fillText(ch,x,yy); yy+=size*gap; } ctx.restore(); }
function note(ctx,lines,x,y,col,a,size=28){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=col; ctx.font=`400 ${size}px ${SERIF}`; ctx.textAlign='left'; ctx.textBaseline='middle';
  lines.forEach((s,i)=>ctx.fillText(s,x,y+i*size*1.9)); ctx.restore(); }
function seal(ctx,x,y,size,txt2,a,k=1){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.translate(x+size/2,y+size/2); ctx.scale(k,k); ctx.rotate(-0.03);
  ctx.fillStyle=ZHU; ctx.fillRect(-size/2,-size/2,size,size); ctx.fillStyle='#f3efe6'; ctx.font=`600 ${size*0.4}px ${SERIF}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(txt2[0],0,-size*0.21); ctx.fillText(txt2[1],0,size*0.23); ctx.restore(); }
const win=(t,a,b,f=0.4)=>seg(t,a,a+f)*(1-seg(t,b-f,b));
const CUBEP=(()=>{const R=50,RC=R*0.8660254,V={T:[60,10],UR:[60+RC,35],LR:[60+RC,85],B:[60,110],LL:[60-RC,85],UL:[60-RC,35],C:[60,60]};
  const tw=(a,b,d)=>{const dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy);return [a[0]+dx/n*d,a[1]+dy/n*d];};const G=10;
  return [[tw(V.UL,V.T,G),V.T,tw(V.UR,V.T,G)],[tw(V.UR,V.LR,G),tw(V.LR,V.UR,G)],[tw(V.LR,V.B,G),V.B,tw(V.LL,V.B,G)],[tw(V.LL,V.UL,G),tw(V.UL,V.LL,G)],[tw(V.UL,V.C,G),V.C,tw(V.UR,V.C,G)],[V.C,tw(V.B,V.C,G)]];})();
function topIP(ctx,dk=0){const y=196;ctx.save();ctx.globalAlpha=0.75;ctx.translate(540-82,y-20);ctx.scale(40/120,40/120);ctx.strokeStyle=dk>0.5?'#2BE08A':'#0B5A2E';ctx.lineWidth=12;
  for(const p of CUBEP){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}ctx.restore();
  ctx.save();ctx.globalAlpha=0.75;ctx.fillStyle=dk>0.5?'#2BE08A':'#0B5A2E';ctx.font=`900 30px ${SANS}`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('老杨魔方',540-30,y+1);ctx.restore();}

