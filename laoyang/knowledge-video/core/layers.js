// =====================================================================
// 老杨魔方 · 深度 v7「版式层 + 标注层」（STANDARD_DEEP_V7.md，2026-11-14）
// 思路取自咨询公司做图的方式：图型不必多，变化来自「同一张图 × 不同版式 × 不同标注」的组合。
// 全部字段写在卡片的 data 里，不写就和 v6 一模一样（旧期逐像素不变）。
//
// 版式层（data.lay 或对应字段，可叠加）：
//   full   整屏一张图（默认）
//   take   图 + 结论栏          data.take = {t, s, label}
//   pair   两张图对比           data.pair = {type, data, label}，data.pairDir = "v"（上下，默认）| "h"（左右）
//   table  上图下表             data.table = {head:[..], rows:[[..] 或 {c:[..], s, hot}], s}
//   multi  小图并列（卡片类型）  type:"multi"，data = {kind:"bar|ring|spark|num", cols, items:[{t, val, v, max, pts, s, hot}]}
//   focus  镜头推近到局部        data.focus = {on:"要放大的那几个字", z:1.6, s, back}
//   note   全屏数字 + 注释       data.lay = "note"（配 bignum），data.notes = [{t, s}]
//   carry  跨卡延续             data.carry = true 或 {t:"接上一张"}：顶部留一张上一张卡的缩略图
// 标注层（data.ann = [...]，每条 {k, on, to, t, s, c, side}，on / to 写卡片上看得见的那几个字）：
//   circle 圈注   band 高亮带   tag 标签   callout 结论框   delta 差额箭头   bracket 括号求和   base 基准线
//   unit:true = 标整块（找到的字所在的那一个动画单元，比如一整格小图、一整行），不只标那几个字
// 纯函数：位置在第一帧算一次，之后只按时间改透明度和描线长度；不用真实时间、不用 Math.random。
// =====================================================================
const LY_KEYS=['lay','ann','take','pair','table','notes','carry','focus'];
function LY_HAS(d){return !!d&&LY_KEYS.some(k=>d[k]!=null);}
// ---------- 版式层：改卡片的 HTML ----------
function LY_WRAP(c,CARDS_,prevEl){const d=c.data||{};let h=CARDS_[c.type](d);
 if(d.pair){const P=d.pair,lb=P.label;
  h=`<div class="ly-pair ${d.pairDir==='h'?'h':'v'}"><div class="ly-pa">${h}</div>`+
   `<div class="ly-vs${lb&&lb.s?' u':''}"${lb&&lb.s?` data-s="${lb.s}"`:''}><i></i><span>${hi((lb&&(lb.t||lb))||'VS')}</span><i></i></div>`+
   `<div class="ly-pb">${CARDS_[P.type](P.data||{})}</div></div>`;}
 if(d.lay==='note'&&d.notes)h+=`<div class="ly-notes">`+d.notes.map((n,i)=>U(sOf(n,i+1),hi(n.t||n),'ly-note'+(n.hot?' hot':''))).join('')+`</div>`;
 if(d.table){const T=d.table;h+=`<div class="ly-tb">`+(T.head?`<div class="ly-tr ly-th">`+T.head.map(x=>`<span>${hi(x)}</span>`).join('')+`</div>`:'')+
   T.rows.map((r,i)=>{const cs=Array.isArray(r)?r:r.c;return U(Array.isArray(r)?sOf(T,0):sOf(r,sOf(T,0)),cs.map(x=>`<span>${hi(x)}</span>`).join(''),'ly-tr'+(r.hot?' hot':''));}).join('')+`</div>`;}
 if(d.take){const K=d.take;h+=U(sOf(K,0),`<span class="ly-tkl">${esc(K.label||'结论')}</span><b>${hi(K.t||K)}</b>`,'ly-tk');}
 if(d.carry&&prevEl)h=`<div class="ly-cr"><div class="ly-crl">${esc(d.carry.t||'接上一张')}</div><div class="ly-crs">${prevEl.innerHTML}</div></div>`+h;
 if(d.focus)h=`<div class="ly-cam">${h}</div>`;
 return h;}
// 小图并列：同一种小图摆一排，一眼比大小 {eyebrow,title,kind,cols,unit,items:[{t,val,v,max,pts,s,hot}]}
CARD_EXT.multi=d=>{const kd=d.kind||'bar',cols=d.cols||Math.min(3,d.items.length),mx=d.max||Math.max(...d.items.map(x=>x.max||x.v||0),1);
 const mini=x=>{if(kd==='bar')return `<div class="sm-bar"><div class="sm-fill" data-fx="grow" style="width:${(100*(x.v||0)/(x.max||mx)).toFixed(1)}%"></div></div>`;
  if(kd==='ring'){const f=(x.v||0)/(x.max||100);return `<svg class="sm-ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" class="sm-rb"/><circle cx="60" cy="60" r="48" class="sm-rf" pathLength="1" stroke-dasharray="${f.toFixed(3)} 1" transform="rotate(-90 60 60)"/></svg>`;}
  if(kd==='spark'){const P=x.pts||[],lo=Math.min(...P),hi_=Math.max(...P),W=300,H=90,X=i=>(i/(P.length-1||1))*W,Y=v=>H-8-(hi_===lo?0.5:(v-lo)/(hi_-lo))*(H-16);
   return `<svg class="sm-sp" viewBox="-6 0 ${W+12} ${H}"><polyline points="${P.map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' ')}"/><circle cx="${X(P.length-1).toFixed(1)}" cy="${Y(P[P.length-1]).toFixed(1)}" r="7"/></svg>`;}
  return '';};
 return head(d)+`<div class="sm-g" style="--mc:${cols}">`+d.items.map((x,i)=>U(sOf(x,i+1),`<div class="sm-t">${hi(x.t)}</div><div class="sm-v">${hi(x.val!=null?x.val:x.v)}</div>`+mini(x)+(x.n?`<div class="sm-n">${hi(x.n)}</div>`:''),'sm'+(x.hot?' hot':''))).join('')+`</div>`+(d.unit?U(0,esc(d.unit),'ch-unit'):'');};
// ---------- 第一帧：排版（在舞台居中之前）----------
let _LY_PRE=false,_LY_POST=false;
function LY_PRE(K){if(_LY_PRE)return;_LY_PRE=true;
 K.forEach(k=>{const d=k.c.data||{};if(!d.pair)return;const el=k.el,pa=el.querySelector('.ly-pa'),pb=el.querySelector('.ly-pb');
  k._pa={c:k.c,el:pa,units:[]};k._pb={c:Object.assign({},k.c,{type:d.pair.type,data:d.pair.data||{}}),el:pb,units:[]};
  const vis=el.style.visibility;el.style.visibility='hidden';el.style.display='block';
  if(d.pairDir==='h'){pa.style.zoom=pb.style.zoom=0.48;}
  else{const h1=pa.getBoundingClientRect().height,h2=pb.getBoundingClientRect().height,z=Math.min(0.72,840/(h1+h2+70));pa.style.zoom=pb.style.zoom=z.toFixed(3);}
  el.style.visibility=vis;});}
// ---------- 第一帧：标注和镜头的位置（在舞台居中之后）----------
const _lyNorm=s=>String(s).replace(/[\s*|]/g,'');
function _lyFind(host,needle){const n=_lyNorm(needle);let best=null,bl=1e9;
 host.querySelectorAll('*').forEach(e=>{if(e.closest('.ly-cr')||e.closest('svg.ann'))return;const tx=_lyNorm(e.textContent);if(!tx.includes(n))return;
  const r=e.getBoundingClientRect();if(!r.width||!r.height)return;if(tx.length<bl){bl=tx.length;best=e;}});
 return best;}
function _lyRect(k,host,needle,unit){let e=_lyFind(host,needle);if(e&&unit)e=e.closest('.u, .lu')||e;if(!e){console.error('标注找不到这几个字：'+needle+'（卡 '+k.c.id+'）');return null;}
 const z=parseFloat(k.el.style.zoom)||1,H=host.getBoundingClientRect(),r=e.getBoundingClientRect();
 const x=(r.left-H.left)/z,y=(r.top-H.top)/z,w=r.width/z,h=r.height/z;return {x,y,w,h,cx:x+w/2,cy:y+h/2,r:x+w,b:y+h};}
const LYC={o:'#F5A623',w:'#F4F1EA',r:'#E8553A'};
const _lyTW=(s,fs)=>Math.max(...String(s).split('|').map(l=>[...l.replace(/\*/g,'')].reduce((a,ch)=>a+(/[\x00-\xff]/.test(ch)?0.56:1),0)))*fs;
function _lyText(x,y,s,fs,col,anchor){const ls=String(s).split('|'),lh=fs*1.25;
 return `<text class="an-tx" x="${x.toFixed(1)}" y="${(y+fs*0.36-(ls.length-1)*lh/2).toFixed(1)}" font-size="${fs}" fill="${col}" text-anchor="${anchor||'middle'}">`+
  ls.map((l,i)=>`<tspan x="${x.toFixed(1)}"${i?` dy="${lh.toFixed(1)}"`:''}>${esc(l).replace(/\*([^*]+)\*/g,'<tspan fill="#F5A623">$1</tspan>')}</tspan>`).join('')+`</text>`;}
const _lyPill=(x,y,s,fs,col,dark)=>{const w=_lyTW(s,fs)+fs*1.1,h=fs*1.6;return `<rect class="an-fill" x="${(x-w/2).toFixed(1)}" y="${(y-h/2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(h/2).toFixed(1)}" fill="${col}"/>`+_lyText(x,y,s,fs,dark?'#111':'#F4F1EA');};
const _lyCl=(v,a,b)=>Math.max(a,Math.min(b,v));
function _lyAnn(k,host,a){const col=LYC[a.c||'o'],R=_lyRect(k,host,a.on,a.unit);if(!R)return '';let g='',draw='';const t=a.t||'',fs=a.fs||30;
 if(a.k==='circle'){const px=a.pad||18;draw=`<ellipse class="an-dr" pathLength="1" cx="${R.cx.toFixed(1)}" cy="${R.cy.toFixed(1)}" rx="${(R.w/2+px).toFixed(1)}" ry="${(R.h/2+px*0.8).toFixed(1)}" stroke="${col}"/>`;
  if(t)g+=_lyPill(_lyCl(R.r+px+_lyTW(t,fs)/2+18,_lyTW(t,fs)/2+20,900-_lyTW(t,fs)/2),R.y-px-fs*0.4,t,fs,col,true);}
 else if(a.k==='band'){const x=a.wide?-12:R.x-14,w=a.wide?944:R.w+28;g+=`<rect class="an-band" data-w="${w.toFixed(1)}" x="${x.toFixed(1)}" y="${(R.y-8).toFixed(1)}" width="0" height="${(R.h+16).toFixed(1)}" rx="8" fill="${col}" fill-opacity="0.18"/>`;
  draw=`<line class="an-dr" pathLength="1" x1="${x.toFixed(1)}" y1="${(R.b+8).toFixed(1)}" x2="${(x+w).toFixed(1)}" y2="${(R.b+8).toFixed(1)}" stroke="${col}"/>`;}
 else if(a.k==='tag'){const w=_lyTW(t,fs)+fs*1.1;let x=R.r+14+w/2;if(x+w/2>930)x=R.x-14-w/2;if(a.side==='t')x=R.cx;
  const y=a.side==='t'?R.y-fs*1.1:R.cy;g+=_lyPill(_lyCl(x,w/2-10,930-w/2),y,t,fs,col,true);}
 else if(a.k==='callout'){const w=_lyTW(t,fs)+48,ln=String(t).split('|').length,h=ln*fs*1.25+36,side=a.side||(R.cy>455?'t':'b');
  let bx,by,ax,ay,ex,ey;
  if(side==='r'||side==='l'){bx=side==='r'?_lyCl(R.r+60,-10,930-w):_lyCl(R.x-60-w,-10,930-w);by=R.cy-h/2;ax=side==='r'?bx:bx+w;ay=R.cy;ex=side==='r'?R.r+8:R.x-8;ey=R.cy;}
  else{bx=_lyCl(R.cx-w/2,-10,930-w);by=side==='t'?R.y-h-56:R.b+56;ax=_lyCl(R.cx,bx+24,bx+w-24);ay=side==='t'?by+h:by;ex=R.cx;ey=side==='t'?R.y-6:R.b+6;}
  draw=`<line class="an-dr" pathLength="1" x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${col}"/>`;
  g+=`<rect class="an-fill" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="10" fill="rgba(10,10,10,.88)" stroke="${col}" stroke-width="3"/>`+_lyText(bx+w/2,by+h/2,t,fs,'#F4F1EA');}
 else if(a.k==='delta'||a.k==='bracket'){const B=_lyRect(k,host,a.to,a.unit);if(!B)return '';
  const horiz=a.side?['t','b'].includes(a.side):Math.abs(B.cx-R.cx)>Math.abs(B.cy-R.cy);
  if(a.k==='delta'){let x1,y1,x2,y2,qx,qy;
   if(horiz){x1=R.cx;y1=R.y-10;x2=B.cx;y2=B.y-10;const top=Math.min(y1,y2);qx=(x1+x2)/2;qy=top-(a.lift||110);}
   else{x1=R.r+12;y1=R.cy;x2=B.r+12;y2=B.cy;qx=Math.max(x1,x2)+(a.lift||130);qy=(y1+y2)/2;}
   draw=`<path class="an-dr" pathLength="1" d="M${x1.toFixed(1)},${y1.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" stroke="${col}" marker-end="url(#anA_${a.c||'o'})"/>`;
   if(t){const mx=0.25*x1+0.5*qx+0.25*x2,my=0.25*y1+0.5*qy+0.25*y2,w=_lyTW(t,fs)+fs*1.1;g+=_lyPill(_lyCl(horiz?mx:mx+w/2-10,w/2-10,930-w/2),horiz?my-fs*0.9:my,t,fs,col,true);}}
  else{let p,lx,ly,an='middle';
   if(horiz){const x1=Math.min(R.x,B.x),x2=Math.max(R.r,B.r),y=Math.max(R.b,B.b)+18,m=(x1+x2)/2,dp=22;p=`M${x1},${y} q0,${dp} ${dp},${dp} L${m-dp},${y+dp} q${dp},0 ${dp},${dp} q0,-${dp} ${dp},-${dp} L${x2-dp},${y+dp} q${dp},0 ${dp},-${dp}`;lx=m;ly=y+dp*2+fs*0.9;}
   else{const y1=Math.min(R.y,B.y),y2=Math.max(R.b,B.b),x=Math.min(905,Math.max(R.r,B.r)+18),m=(y1+y2)/2,dp=22;p=`M${x},${y1} q${dp},0 ${dp},${dp} L${x+dp},${m-dp} q0,${dp} ${dp},${dp} q-${dp},0 -${dp},${dp} L${x+dp},${y2-dp} q0,${dp} -${dp},${dp}`;lx=x+dp*2+12;ly=m;an='start';
    if(lx+_lyTW(t,fs)>950){lx=x-12;an='end';}}
   draw=`<path class="an-dr" pathLength="1" d="${p}" stroke="${col}"/>`;if(t)g+=_lyText(lx,ly,t,fs,col,an);}}
 else if(a.k==='base'){const y=a.y!=null?a.y:R.cy;draw=`<line class="an-dr an-dash" x1="-12" y1="${y.toFixed(1)}" x2="932" y2="${y.toFixed(1)}" stroke="${col}"/>`;
  if(t)g+=_lyText(928,y-fs*0.85,t,fs,col,'end');}
 else{console.error('不认识的标注：'+a.k+'（卡 '+k.c.id+'）');return '';}
 return `<g class="an" data-s="${a.s==null?0:a.s}">${draw}<g class="an-lb">${g}</g></g>`;}
function LY_POST(K){if(_LY_POST)return;_LY_POST=true;
 K.forEach(k=>{const d=k.c.data||{};if(!d.ann&&!d.focus)return;const el=k.el,host=el.querySelector('.ly-cam')||el;
  const vis=el.style.visibility;el.style.visibility='hidden';
  if(d.ann){const defs=`<defs>`+Object.keys(LYC).map(c=>`<marker id="anA_${c}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${LYC[c]}"/></marker>`).join('')+`</defs>`;
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','ann');svg.setAttribute('width','1');svg.setAttribute('height','1');
   svg.innerHTML=defs+d.ann.map(a=>_lyAnn(k,host,a)).join('');host.appendChild(svg);
   k._ann=[...svg.querySelectorAll('g.an')].map(g=>({g,s:+g.dataset.s,dr:[...g.querySelectorAll('.an-dr')],band:[...g.querySelectorAll('.an-band')],lb:g.querySelector('.an-lb')}));}
  if(d.focus){const R=_lyRect(k,host,d.focus.on);if(R){k._cam={el:host,cx:R.cx,cy:R.cy,z:d.focus.z||1.6,s:d.focus.s==null?1:d.focus.s,back:d.focus.back};host.style.transformOrigin=`${R.cx.toFixed(1)}px ${R.cy.toFixed(1)}px`;el.classList.add('ly-clip');}}
  el.style.visibility=vis;});}
// ---------- 每帧 ----------
function LY_FRAME(k,t){const c=k.c;
 if(k._pb&&typeof CARD_RENDER!=='undefined'&&CARD_RENDER[k._pb.c.type])CARD_RENDER[k._pb.c.type](k._pb,t);
 (k._ann||[]).forEach(a=>{const T0=tau(c,a.s),q=io(cl((t-T0)/0.55)),f=eo(cl((t-T0-0.25)/0.35));a.g.style.opacity=t>=T0?1:0;
  a.dr.forEach(p=>{if(p.classList.contains('an-dash')){p.setAttribute('x2',(-12+944*q).toFixed(1));}else p.style.strokeDashoffset=(1-q).toFixed(4);});
  a.band.forEach(b=>b.setAttribute('width',(+b.dataset.w*q).toFixed(1)));a.lb.style.opacity=f.toFixed(3);});
 if(k._cam){const m=k._cam,q=io(cl((t-tau(c,m.s))/1.0))*(m.back!=null?1-io(cl((t-tau(c,m.back))/0.8)):1),z=1+(m.z-1)*q;
  m.el.style.transform=`translate(${((460-m.cx)*q).toFixed(1)}px,${((440-m.cy)*q).toFixed(1)}px) scale(${z.toFixed(4)})`;}}
