// =====================================================================
// 老杨魔方 · 深度 v4 逻辑结构版 —— 结构图卡（STANDARD_DEEP_V4.md）
//   map   ：节点 + 连线 + 标签，跟着口播一步步长出来；镜头在图上推拉；讲到哪亮哪，其余变暗。
//   stack ：层级柱（N 根横条，从 14 层压到 5 层、3 层）。
// 纯函数：每帧由 CARD_RENDER[type](k,t) 按时间算样子；不用真实时间、不用 Math.random。
// 坐标：世界坐标 W×H（默认 920×860），(0,0) 在左上。
// map data:
//  {eyebrow,title,W,H,
//   nodes:[{id,x,y,w,h,t,n,kind:'box'|'ai'|'hot'|'ghost'|'person'|'warn',s,out,hot,dim,show}],
//     s=出现的 step；out=从哪个 step 起淡出；hot=从哪个 step 起变橙；dim=从哪个 step 起变暗（0.3）
//   edges:[{a,b,s,kind:'line'|'flow'|'break'|'up'|'dash',label,out,via:'v'|'h'|'d'}],
//   tags:[{x,y,t,s,kind:'tag'|'sticker'|'note',out,rot}],
//   bands:[{x,y,w,h,t,s,out}]           // 横贯的发光带（如「AI 在中间」）
//   cams:[{s,x,y,z}]                    // 镜头：看向世界坐标 (x,y)，放大 z；不写 = 看全图
//   focus:[{s,ids:[...],until}]          // 这一段只亮这些节点 / 连线 id（连线 id = a+'-'+b），其余压暗
//  }
// =====================================================================
const MAP_C={line:'rgba(244,241,234,.55)',flow:'#F5A623',break:'#E8553A',up:'#F5A623',dash:'rgba(244,241,234,.45)'};
function _mpNode(n){const w=n.w||200,h=n.h||(n.n?96:72),k=n.kind||'box';
 return `<g class="mpn k-${k}" data-id="${esc(n.id)}" transform="translate(${n.x},${n.y})">`+
  `<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${k==='ai'?h/2:10}"/>`+
  (k==='ai'?`<text class="mpn-ai" x="${-w/2+22}" y="7">AI</text>`:'')+
  `<text class="mpn-t" x="${k==='ai'?14:0}" y="${n.n?-6:11}">${esc(n.t||'')}</text>`+
  (n.n?`<text class="mpn-n" x="0" y="30">${esc(n.n)}</text>`:'')+`</g>`;}
function _mpPath(A,B,via){ // 两节点之间的路径（从边框出发）
 const ax=A.x,ay=A.y,bx=B.x,by=B.y,ah=(A.h||(A.n?96:72))/2,bh=(B.h||(B.n?96:72))/2,aw=(A.w||200)/2,bw=(B.w||200)/2;
 if(via==='h'||(!via&&Math.abs(by-ay)<Math.abs(bx-ax)*0.6)){const s=bx>ax?1:-1;const x1=ax+s*aw,x2=bx-s*bw;
  return Math.abs(by-ay)<2?`M${x1},${ay} L${x2},${by}`:`M${x1},${ay} L${(x1+x2)/2},${ay} L${(x1+x2)/2},${by} L${x2},${by}`;}
 const s=by>ay?1:-1;const y1=ay+s*ah,y2=by-s*bh;
 if(via==='d'||Math.abs(bx-ax)<2)return `M${ax},${y1} L${bx},${y2}`;
 const ym=(y1+y2)/2;return `M${ax},${y1} L${ax},${ym} L${bx},${ym} L${bx},${y2}`;}
const CARD_EXT={
 map:d=>{const W=d.W||920,H=d.H||860,N={};(d.nodes||[]).forEach(n=>N[n.id]=n);
  const edges=(d.edges||[]).map((e,i)=>{const A=N[e.a],B=N[e.b];if(!A||!B){console.error('map 连线找不到节点',e.a,e.b);return '';}
   const p=_mpPath(A,B,e.via),col=MAP_C[e.kind||'line']||MAP_C.line;
   return `<g class="mpe k-${e.kind||'line'}" data-i="${i}"><path d="${p}" stroke="${col}" fill="none" stroke-width="${e.kind==='flow'||e.kind==='up'?4:3}" ${e.kind==='dash'?'stroke-dasharray="10 10"':''} marker-end="${e.kind==='break'||e.kind==='dash'||e.noArrow?'':'url(#mpA'+(e.kind==='flow'||e.kind==='up'?'o':'w')+')'}"/>`+
    (e.kind==='break'?`<g class="mpx"><path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#E8553A" stroke-width="6"/></g>`:'')+
    (e.kind==='flow'||e.kind==='up'?[0,1,2].map(j=>`<circle class="mpd" r="7" fill="#F5A623"/>`).join(''):'')+
    (e.label?`<text class="mpe-l">${esc(e.label)}</text>`:'')+`</g>`;}).join('');
  const bands=(d.bands||[]).map((b,i)=>`<g class="mpb" data-i="${i}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.h/2}"/><text x="${b.x+b.w/2}" y="${b.y+b.h/2+12}">${esc(b.t||'')}</text></g>`).join('');
  const tags=(d.tags||[]).map((g,i)=>`<g class="mpt k-${g.kind||'tag'}" data-i="${i}" transform="translate(${g.x},${g.y}) rotate(${g.rot||0})">${g.kind==='sticker'?'<rect class="mpt-bg" rx="8"/>':''}<text>${esc(g.t)}</text></g>`).join('');
  return head(d)+`<div class="mp"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>`+
   `<marker id="mpAw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="rgba(244,241,234,.75)"/></marker>`+
   `<marker id="mpAo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#F5A623"/></marker>`+
   `<filter id="mpG" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs>`+
   `<g class="mp-cam">${bands}${edges}${(d.nodes||[]).map(_mpNode).join('')}${tags}</g></svg></div>`;},
 // 层级柱 {eyebrow,title,max:14,levels:[{n,label,s}],note}
 stack:d=>{const mx=d.max||Math.max(...d.levels.map(l=>l.n));
  return head(d)+`<div class="stk"><div class="stk-bars">`+[...Array(mx)].map((_,i)=>`<div class="stk-b" data-i="${i}"></div>`).join('')+`</div>`+
   `<div class="stk-side"><div class="stk-num">${mx}</div><div class="stk-lab"></div></div></div>`+(d.note?U(sOf(d.note,1),hi(d.note.text||d.note),'stk-note'):'');},
};
// ---------- 每帧 ----------
const _ease=(t,T0,d)=>eo(cl((t-T0)/d));
function _stepOn(c,s,t,d){return s==null?1:_ease(t,tau(c,s),d||0.4);}
function _offAt(c,s,t){return s==null?0:_ease(t,tau(c,s),0.5);}
const CARD_RENDER={
 map:(k,t)=>{const c=k.c,d=c.data||{},W=d.W||920,H=d.H||860,el=k.el;
  if(!k._m){k._m={nodes:[...el.querySelectorAll('.mpn')],edges:[...el.querySelectorAll('.mpe')],tags:[...el.querySelectorAll('.mpt')],bands:[...el.querySelectorAll('.mpb')],cam:el.querySelector('.mp-cam')};
   k._m.edges.forEach(g=>{const p=g.querySelector('path');g._len=p.getTotalLength();p.style.strokeDasharray=g.classList.contains('k-dash')?'10 10':g._len;
    const m=p.getPointAtLength(g._len/2),x=g.querySelector('.mpx'),l=g.querySelector('.mpe-l');if(x)x.setAttribute('transform',`translate(${m.x},${m.y})`);
    if(l){l.setAttribute('x',m.x+(d.edges[+g.dataset.i].lx||14));l.setAttribute('y',m.y+(d.edges[+g.dataset.i].ly||-12));}});
   k._m.tags.forEach(g=>{const r=g.querySelector('.mpt-bg');if(!r)return;const b=g.querySelector('text').getBBox();
    r.setAttribute('x',b.x-16);r.setAttribute('y',b.y-8);r.setAttribute('width',b.width+32);r.setAttribute('height',b.height+16);});}
  const M=k._m;
  // 聚焦：当前有效的 focus 段
  let foc=null;(d.focus||[]).forEach(f=>{const a=_stepOn(c,f.s,t,0.5),b=f.until!=null?_offAt(c,f.until,t):0;const w=a*(1-b);if(w>0.001&&(!foc||w>foc.w))foc={ids:new Set(f.ids),w};});
  const fdim=id=>foc&&!foc.ids.has(id)?1-0.72*foc.w:1;
  M.nodes.forEach((g,i)=>{const n=d.nodes[i],p=_stepOn(c,n.s,t,0.4),o=_offAt(c,n.out,t),hot=n.hot!=null?_ease(t,tau(c,n.hot),0.4):0,dm=n.dim!=null?_ease(t,tau(c,n.dim),0.6):0;
   const sc=0.82+0.18*p;g.setAttribute('transform',`translate(${n.x},${n.y}) scale(${sc.toFixed(4)})`);
   g.style.opacity=(p*(1-o)*(1-0.7*dm)*fdim(n.id)).toFixed(3);g.classList.toggle('on-hot',hot>0.5);g.style.setProperty('--h',hot.toFixed(3));});
  M.edges.forEach((g,i)=>{const e=d.edges[i],T0=tau(c,e.s||0)+(e.delay||0),q=io(cl((t-T0)/0.7)),o=_offAt(c,e.out,t),p=g.querySelector('path');
   if(!g.classList.contains('k-dash'))p.style.strokeDashoffset=(g._len*(1-q)).toFixed(1);
   g.style.opacity=((t>=T0?1:0)*(1-o)*fdim(e.a+'-'+e.b)).toFixed(3);
   const x=g.querySelector('.mpx');if(x)x.style.opacity=_ease(t,T0+0.6,0.25).toFixed(3);
   const l=g.querySelector('.mpe-l');if(l)l.style.opacity=_ease(t,T0+0.4,0.3).toFixed(3);
   const ds=g.querySelectorAll('.mpd');if(ds.length){const live=q>=1;ds.forEach((dot,j)=>{const u=((t-T0)*0.45+j/3)%1;const pt=p.getPointAtLength(u*g._len);
     dot.setAttribute('cx',pt.x.toFixed(1));dot.setAttribute('cy',pt.y.toFixed(1));dot.style.opacity=live?(Math.sin(u*Math.PI)).toFixed(3):0;});}});
  M.bands.forEach((g,i)=>{const b=d.bands[i],p=_stepOn(c,b.s,t,0.6),o=_offAt(c,b.out,t);g.style.opacity=(p*(1-o)).toFixed(3);
   g.querySelector('rect').setAttribute('width',(b.w*p).toFixed(1));g.querySelector('rect').setAttribute('x',(b.x+b.w*(1-p)/2).toFixed(1));});
  M.tags.forEach((g,i)=>{const a=d.tags[i],p=a.kind==='sticker'?cl((t-tau(c,a.s||0))/0.25):_stepOn(c,a.s,t,0.4),o=_offAt(c,a.out,t);
   const k2=a.kind==='sticker'?1.4-0.4*eo(p):1;g.setAttribute('transform',`translate(${a.x},${a.y}) rotate(${a.rot||0}) scale(${k2.toFixed(3)})`);g.style.opacity=(p*(1-o)).toFixed(3);});
  // 镜头：在相邻关键帧之间缓动（1.1s）
  const cams=[{s:0,x:W/2,y:H/2,z:1},...(d.cams||[])];let cur=cams[0],from=cams[0],q=1;
  cams.forEach((cm,i)=>{if(i===0)return;const T0=tau(c,cm.s);if(t>=T0){from=cur;cur=cm;q=io(cl((t-T0)/1.1));}});
  const X=from.x+(cur.x-from.x)*q,Y=from.y+(cur.y-from.y)*q,Z=from.z+(cur.z-from.z)*q;
  M.cam.setAttribute('transform',`translate(${(W/2-X*Z).toFixed(2)},${(H/2-Y*Z).toFixed(2)}) scale(${Z.toFixed(4)})`);},
 stack:(k,t)=>{const c=k.c,d=c.data,mx=d.max||Math.max(...d.levels.map(l=>l.n));
  if(!k._s)k._s={bars:[...k.el.querySelectorAll('.stk-b')],num:k.el.querySelector('.stk-num'),lab:k.el.querySelector('.stk-lab')};
  let n=mx,lab='',from=mx,q=1;d.levels.forEach(l=>{const T0=tau(c,l.s||0);if(t>=T0){from=n;n=l.n;lab=l.label||'';q=io(cl((t-T0)/0.9));}});
  const cur=from+(n-from)*q;
  k._s.bars.forEach((b,i)=>{const on=cl(cur-i);b.style.height=(34*on).toFixed(1)+'px';b.style.marginTop=(9*on).toFixed(1)+'px';b.style.opacity=(0.25+0.75*on).toFixed(3);b.classList.toggle('lit',i<n&&n<mx);});
  k._s.num.textContent=Math.round(cur);k._s.lab.textContent=lab;},
};
