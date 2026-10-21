// =====================================================================
// 老杨魔方 · 核心观点文字的出场 / 退场库 fx_text.js（与 fx.js / fx_particles.js 同一闭包）
// 用法（在 SCENES.cN.free 里调用）：
//   showText('k1', {lines:[[['规划行业',null],['不会消失','#F0B429']]], size:72, cy:980}, t, tIn, tOut, '水流', '融化', a)
//   入场：粒子 · 雾化 · 水流 · 光扫 · 碎裂 · 逐字      退场：吹散 · 雾散 · 融化 · 光扫 · 碎裂 · 逐字
// 每种效果的性格（按内容选，不要一期全用）：
//   粒子/吹散  从无到有、聚少成多；数字、结论诞生；「消失、被风吹走」
//   雾化/雾散  模糊→清晰，含蓄、回忆、看不清的局势；「烟消云散」
//   水流/融化  流动、变化、渗透；趋势、周期、「冲刷/融化/流失」
//   光扫       确认、定论、权威数据；干脆利落
//   碎裂       冲击、打破、失效；「被注销、崩盘」，用在击拍上
//   逐字       克制的默认款；提问、金句、留白
// 全部是时间的纯函数；文字画在离屏层，经 present() 羽化 + 轻辉光合成
// =====================================================================
const TXDUR={in:{'粒子':1.5,'雾化':1.7,'水流':1.7,'光扫':1.0,'碎裂':0.6,'逐字':1.2},out:{'吹散':1.4,'雾散':1.8,'融化':1.7,'光扫':0.9,'碎裂':1.2,'逐字':1.0}};
const _TX={};
function txLayer(key,spec){
 const size=spec.size||72,lh=spec.lh||Math.round(size*1.34),font=`${spec.weight||900} ${size}px NSC`;
 if(_TX[key])return _TX[key];
 const n=spec.lines.length,H=Math.ceil(lh*n+40),c=document.createElement('canvas');c.width=1080;c.height=H;const g=c.getContext('2d');
 g.font=font;g.textBaseline='middle';let minx=1e9,maxx=-1e9;const chars=[];
 spec.lines.forEach((ln,j)=>{const w=ln.reduce((s,[t])=>s+g.measureText(t).width,0);let x=540-w/2;const y=20+lh*(j+0.5);minx=Math.min(minx,x);maxx=Math.max(maxx,x+w);
  ln.forEach(([t,col])=>{for(const ch of t){const cw=g.measureText(ch).width;g.fillStyle=col||'#FFFFFF';g.fillText(ch,x,y);chars.push({ch,x,y,w:cw,col:col||'#FFFFFF'});x+=cw;}});});
 const L={c,H,top:Math.round((spec.cy||980)-H/2),minx,maxx,chars,font,size};
 // 粒子采样点（带颜色）
 const d=g.getImageData(0,0,1080,H).data,pts=[];const st=spec.step||3;
 for(let y=0;y<H;y+=st)for(let x=Math.floor(minx);x<maxx;x+=st){const k=(y*1080+x)*4;if(d[k+3]>140)pts.push([x,y,`rgb(${d[k]},${d[k+1]},${d[k+2]})`]);}
 L.pts=pts;
 // 雾化用的分形噪声（0..1）
 const W=1080,nzA=new Float32Array(W*H),lat=(s,ix,iy)=>rnd(ix*157.1+iy*311.7+s*17.3);
 for(const [sc,amp,s] of [[46,0.55,1],[18,0.3,2],[7,0.15,3]])for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),u=SM(fx-ix),v=SM(fy-iy);
  nzA[y*W+x]+=amp*lerp(lerp(lat(s,ix,iy),lat(s,ix+1,iy),u),lerp(lat(s,ix,iy+1),lat(s,ix+1,iy+1),u),v);}
 L.noise=nzA;
 // 碎裂用的三角片（网格抖动顶点）
 const cols=11,rows=4,bx0=minx-10,bx1=maxx+10,V=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const jit=(i>0&&i<cols&&j>0&&j<rows)?1:0;V.push([lerp(bx0,bx1,i/cols)+(rnd(i*13+j*7+1)-.5)*jit*44,lerp(6,H-6,j/rows)+(rnd(i*5+j*11+2)-.5)*jit*22]);}
 const tris=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=V[j*(cols+1)+i],b=V[j*(cols+1)+i+1],c2=V[(j+1)*(cols+1)+i],e=V[(j+1)*(cols+1)+i+1];
  const ts=rnd(i*3+j*17)>0.5?[[a,b,e],[a,e,c2]]:[[a,b,c2],[b,e,c2]];ts.forEach(tr=>tris.push({p:tr,cx:(tr[0][0]+tr[1][0]+tr[2][0])/3,cy:(tr[0][1]+tr[1][1]+tr[2][1])/3,s:tris.length}));}
 L.tris=tris;
 if(document.fonts.check(font))_TX[key]=L;   // 字体没加载好不缓存
 return L;}

// ---------- 静止 ----------
function txHold(g,L){g.drawImage(L.c,0,L.top);}
// ---------- 粒子 ----------
function txParticles(g,L,q,t,mode){const N=L.pts.length,w=L.maxx-L.minx;g.save();g.globalCompositeOperation='lighter';
 for(let i=0;i<N;i++){const [x,y,col]=L.pts[i];let px,py,al;const k=x*0.7311+y*1.3717;   // 随机种子跟位置走，不跟序号走：不同机器字体抗锯齿差一两个边缘点时，其余粒子轨迹不变
  if(mode==='in'){const dl=rnd(k*1.7)*0.3+(x-L.minx)/w*0.15,u=eo(cl((q-dl)/0.55));if(u<=0)continue;
   const an=rnd(k*3.1)*6.283,r0=260+rnd(k*5.3)*520,sx=x+Math.cos(an)*r0,sy=y+Math.sin(an)*r0*0.6;
   px=lerp(sx,x,u)+Math.sin(Math.PI*u)*40*(rnd(k*7.9)-.5);py=lerp(sy,y,u);al=u*(1-cl((q-0.82)/0.18));}
  else{const dl=(x-L.minx)/w*0.38+rnd(k*2.9)*0.08,u=cl((q-dl)/0.6);if(u<=0){px=x;py=y;al=cl(q/0.06);}   // 风从左吹到右
   else{const e=eo(u);px=x+(120+320*rnd(k*4.3))*e+nz(k,t,0.8)*20*u;py=y-(30+150*rnd(k*6.1))*e+nz(k+9,t,0.7)*14*u;al=1-u;}}
  if(al<=0.01)continue;g.globalAlpha=al;g.fillStyle=col;g.fillRect(px-1.1,py+L.top-1.1,2.2,2.2);}
 g.restore();
 if(mode==='in'){const a=cl((q-0.82)/0.18);if(a>0){g.globalAlpha=a;txHold(g,L);g.globalAlpha=1;}}
 else{const a=1-cl(q/0.06);if(a>0){g.globalAlpha=a;txHold(g,L);g.globalAlpha=1;}}}
// ---------- 雾化（模糊 + 分形噪声阈值；雾一层层散开/聚拢） ----------
function txFog(g,L,q,t,mode){const e=mode==='in'?eo(q):1-Math.pow(q,1.25);if(e<=0.003)return;
 const cy=L.top+L.H/2,ma=mode==='in'?Math.sin(Math.PI*cl(q*1.1))*0.8:Math.sin(Math.PI*cl(q))*1.0;
 if(ma>0.01){g.save();g.globalCompositeOperation='lighter';for(let k=0;k<16;k++){const r0=rnd(k*3.3),r1=rnd(k*5.9),r2=rnd(k*7.1);const x=lerp(L.minx-40,L.maxx+40,r0)+(t*14+r1*40)%60-30,y=cy+(r1-.5)*L.H*0.9-(mode==='out'?60*q*(0.5+r2):0),R=70+90*r2+(mode==='out'?80*q:40*(1-q));
  const gr=g.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,rgba('#D9D2C4',0.085*ma));gr.addColorStop(1,rgba('#D9D2C4',0));g.fillStyle=gr;g.beginPath();g.arc(x,y,R,0,6.283);g.fill();}g.restore();}
 const [c2,g2]=layer('_txfog',1080,L.H);const blur=(mode==='in'?20:26)*(1-e);g2.filter=`blur(${blur.toFixed(1)}px)`;g2.drawImage(L.c,0,0);g2.filter='none';
 const x0=Math.max(0,Math.floor(L.minx-50)),x1=Math.min(1080,Math.ceil(L.maxx+50)),bw=x1-x0;const im=g2.getImageData(x0,0,bw,L.H),d=im.data;
 const thr=mode==='in'?e*1.5-0.25:e*1.25-0.05,sh=Math.floor(t*26),N=L.noise;
 for(let y=0;y<L.H;y++)for(let x=0;x<bw;x++){const k=(y*bw+x)*4;if(!d[k+3])continue;const xx=(x+x0+sh)%1080;const m=SM((thr-N[y*1080+xx])/0.22);d[k+3]=d[k+3]*m;}
 g2.putImageData(im,x0,0);const dy=mode==='out'?-36*eo(q):10*(1-e);g.drawImage(c2,0,L.top+dy);}
// ---------- 水流显现（波前从左流过，行偏移 = 折射，后面有流动的高光） ----------
function txWaterIn(g,L,q,t){const w=L.maxx-L.minx,xf=lerp(L.minx-90,L.maxx+90,Math.pow(cl(q*1.08),0.8)),amp=16*Math.pow(1-q,1.3);
 for(let y=0;y<L.H;y+=2){const xe=xf+26*Math.sin(y*0.045+t*5.5)+10*Math.sin(y*0.13-t*7);const ww=xe-L.minx+20;if(ww<=0)continue;
  const dx=amp*Math.sin(y*0.09+t*8)+amp*0.5*Math.sin(y*0.031-t*5);g.drawImage(L.c,L.minx-20,y,ww,2,L.minx-20+dx,L.top+y,ww,2);
  const sh=Math.sin(y*0.16-t*9+Math.sin(t*2)*2);if(sh>0.86){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=0.5*(sh-0.86)/0.14*(0.4+0.6*(1-q));g.drawImage(L.c,L.minx-20,y,ww,2,L.minx-20+dx,L.top+y,ww,2);g.restore();}}
 const a=Math.sin(Math.PI*cl(q));if(a>0.02){const pts=[];for(let y=0;y<=L.H;y+=6)pts.push([xf+26*Math.sin(y*0.045+t*5.5)+10*Math.sin(y*0.13-t*7),L.top+y]);glineOn(g,pts,'#BFEFFF',1.6,a*0.55);
  g.save();g.globalCompositeOperation='lighter';for(let k=0;k<26;k++){const yy=rnd(k*3.7)*L.H,xx=pts[Math.floor(yy/6)][0]-rnd(k*5.1)*60*(0.5+q),r=1+rnd(k)*1.6;g.globalAlpha=a*0.7*rnd(k+Math.floor(t*12)*0.1);g.fillStyle='#E6FAFF';g.fillRect(xx-r,L.top+yy-r,2*r,2*r);}g.restore();}}
// ---------- 融化下流（每列按噪声延迟往下流、拉长、变淡，滴落水珠） ----------
function txMelt(g,L,q,t){const [c2,g2]=layer('_txmelt',1080,1920);const cw=2;
 for(let x=Math.floor(L.minx)-4;x<L.maxx+4;x+=cw){
  const dl=0.5+0.32*Math.sin(x*0.011+0.4)+0.14*Math.sin(x*0.037+1.3)+0.05*Math.sin(x*0.13);const age=q*1.75-dl*0.95;
  if(age<=0){g2.drawImage(L.c,x,0,cw,L.H,x,L.top,cw,L.H);continue;}
  const dy=170*age*age+6*age,st=1+0.9*age,al=1-cl(age/1.0);if(al<=0)continue;
  g2.globalAlpha=al;g2.drawImage(L.c,x,0,cw,L.H,x,L.top+dy,cw,L.H*st);
  const dk=Math.sin(x*0.29)*Math.sin(x*0.071);if(dk>0.82){const dd=L.top+L.H*0.75+dy*1.5+50*age;g2.globalAlpha=al*0.9;g2.fillStyle='#E9F4F6';g2.beginPath();g2.ellipse(x+1,dd,2.2,3.4,0,0,6.283);g2.fill();}}
 g2.globalAlpha=1;g.save();g.filter=`blur(${(0.4+2.2*cl(q)).toFixed(2)}px)`;g.drawImage(c2,0,0);g.restore();
 // 水面高光：沿下流前沿的细亮线
 g.save();g.globalCompositeOperation='lighter';g.globalAlpha=0.35*Math.sin(Math.PI*cl(q));g.filter='blur(2px)';g.drawImage(c2,0,4);g.restore();}
// ---------- 光扫显影 / 光扫抹去 ----------
function txSweep(g,L,q,t,mode){const e=io(q),ex=lerp(L.minx-140,L.maxx+140,e),[c2,g2]=layer('_txsw',1080,L.H);g2.drawImage(L.c,0,0);
 g2.globalCompositeOperation='destination-in';const gr=g2.createLinearGradient(ex-110,0,ex+10,0);
 if(mode==='in'){gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');}else{gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');}
 g2.fillStyle=gr;g2.fillRect(0,0,1080,L.H);g.drawImage(c2,0,L.top);
 const a=Math.sin(Math.PI*q);glineOn(g,[[ex-18,L.top-14],[ex+18,L.top+L.H+14]],AU,2.2,a);
 g.save();g.globalCompositeOperation='lighter';for(let k=0;k<18;k++){const yy=L.top+rnd(k*4.1)*L.H,xx=ex-rnd(k*2.3)*80,r=0.8+rnd(k*9)*1.6;g.globalAlpha=a*rnd(k+Math.floor(t*15)*0.37);g.fillStyle='#FFE9C4';g.fillRect(xx-r,yy-r,2*r,2*r);}g.restore();}
// ---------- 碎裂（三角片：入场从四周飞拢，退场炸开下坠） ----------
function txShatter(g,L,q,t,mode){const cx0=mode==='in'?(L.minx+L.maxx)/2:L.minx+(L.maxx-L.minx)*0.35,cy0=L.H/2;
 L.tris.forEach((tr,i)=>{const dx=tr.cx-cx0,dy=tr.cy-cy0,dist=Math.hypot(dx,dy)+1;let u;
  if(mode==='in'){u=1-eo(cl((q-rnd(i*2.1)*0.25)/0.75));}else{u=cl((q-dist/(L.maxx-L.minx)*0.35)/0.65);}
  if(u<=0.001){g.save();g.beginPath();tr.p.forEach((p,k)=>k?g.lineTo(p[0],p[1]+L.top):g.moveTo(p[0],p[1]+L.top));g.closePath();g.clip();g.drawImage(L.c,0,L.top);g.restore();return;}
  const e=mode==='in'?u:eo(u),sp=(mode==='in'?260:180)+rnd(i*5.7)*260,ox=dx/dist*sp*e+(rnd(i*3.3)-.5)*80*e,oy=dy/dist*sp*e*0.6+(mode==='out'?260*u*u:0),rot=(rnd(i*7.1)-.5)*3.2*e,al=mode==='in'?1-u:1-u*u;
  if(al<=0.01)return;g.save();g.globalAlpha=al;g.translate(tr.cx+ox,tr.cy+L.top+oy);g.rotate(rot);g.translate(-tr.cx,-(tr.cy+L.top));
  g.beginPath();tr.p.forEach((p,k)=>k?g.lineTo(p[0],p[1]+L.top):g.moveTo(p[0],p[1]+L.top));g.closePath();g.clip();g.drawImage(L.c,0,L.top);
  if(e>0.05){g.strokeStyle=rgba('#FFE9C4',0.5*al*Math.min(1,e*4));g.lineWidth=1;g.stroke();}g.restore();});}
// ---------- 逐字：从宽字距+模糊里一个个落定 / 一个个松开上飘 ----------
function txChars(g,L,q,t,mode){const n=L.chars.length,mid=540;g.save();g.font=L.font;g.textBaseline='middle';
 L.chars.forEach((c,i)=>{const dl=i/Math.max(1,n-1)*0.45;let u=cl((q-dl)/0.55);let x=c.x,y=c.y,al,b;
  if(mode==='in'){const e=eo(u);x=c.x+(c.x+c.w/2-mid)*0.35*(1-e);y=c.y+18*(1-e);al=e;b=8*(1-e);}
  else{const e=io(u);x=c.x+(c.x+c.w/2-mid)*0.3*e;y=c.y-40*e;al=1-e;b=10*e;}
  if(al<=0.01)return;g.globalAlpha=al;g.filter=b>0.3?`blur(${b.toFixed(1)}px)`:'none';g.fillStyle=c.col;g.fillText(c.ch,x,y+L.top);});
 g.restore();}

const TXIN={'粒子':(g,L,q,t)=>txParticles(g,L,q,t,'in'),'雾化':(g,L,q,t)=>txFog(g,L,q,t,'in'),'水流':txWaterIn,'光扫':(g,L,q,t)=>txSweep(g,L,q,t,'in'),'碎裂':(g,L,q,t)=>txShatter(g,L,q,t,'in'),'逐字':(g,L,q,t)=>txChars(g,L,q,t,'in')};
const TXOUT={'吹散':(g,L,q,t)=>txParticles(g,L,q,t,'out'),'雾散':(g,L,q,t)=>txFog(g,L,q,t,'out'),'融化':txMelt,'光扫':(g,L,q,t)=>txSweep(g,L,q,t,'out'),'碎裂':(g,L,q,t)=>txShatter(g,L,q,t,'out'),'逐字':(g,L,q,t)=>txChars(g,L,q,t,'out')};
// 总入口：tIn 开始入场，tOut 开始退场（退场时长见 TXDUR.out）
function showText(key,spec,t,tIn,tOut,inFx,outFx,a,bloom){if(t<tIn||a<=0)return;const L=txLayer(key,spec);const di=TXDUR.in[inFx],dO=TXDUR.out[outFx];
 if(t>tOut+dO)return;const [c,g]=layer('_tx');
 if(t<tIn+di)TXIN[inFx](g,L,(t-tIn)/di,t);else if(t<tOut)txHold(g,L);else TXOUT[outFx](g,L,(t-tOut)/dO,t);
 present(c,a,bloom===undefined?0.35:bloom);}
