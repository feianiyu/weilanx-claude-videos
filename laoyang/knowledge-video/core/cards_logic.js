// =====================================================================
// 老杨魔方 · 深度 v5「逻辑图谱版」—— 逻辑结构图卡库（STANDARD_DEEP_V5.md）
// 一种逻辑关系 = 一种图形。13 种新卡，全部是 SVG，跟着口播的 step 一块块长出来：
//   cycle 飞轮/循环   tree 拆解树     funnel 漏斗       pyramid 金字塔/层级
//   venn 交集         timeline 时间轴  iceberg 冰山      sankey 分流
//   donut 构成环      versus 新旧对照  ladder 阶梯演进   dots 单位图（每 100 个里有几个）
//   forces 力场（推力 vs 阻力）
// 纯函数：每帧由 CARD_RENDER[type](k,t) 按时间算样子；不用真实时间、不用 Math.random。
// 动画单元：SVG 里的 <g class="lu" data-ls="step" data-fx="fade|pop|grow|draw" data-o="原点" data-hot data-dim data-out data-delay>
//   （用 data-ls 而不是 data-s，避免被 cards.js 的通用单元逻辑接管）
// 颜色纪律同 v4：白线是常态；橙 #F5A623 只给重点；红 #E8553A 只给断点 / 冲突 / 阻力。
// =====================================================================
const LG={o:'#F5A623',r:'#E8553A',w:'#F4F1EA',l:'rgba(244,241,234,.6)',g:'#8E8A82',bg:'rgba(10,10,10,.72)'};
// ---------- 文字工具 ----------
const _lgLen=s=>[...String(s).replace(/\*/g,'')].reduce((a,ch)=>a+(/[\x00-\xff]/.test(ch)?0.56:1),0);
const _lgFit=(s,size,maxW)=>{const L=Math.max(...String(s).split('|').map(_lgLen),1);return Math.max(22,Math.min(size,Math.floor(maxW/L)));};
const _lgSpan=s=>esc(s).replace(/\*([^*]+)\*/g,'<tspan class="lgem">$1</tspan>');
// 多行文字：| 换行；*词* 橙色；自动缩字号到 maxW
function LT(x,y,s,o={}){if(s==null||s==='')return '';const size=o.fit===false?(o.size||36):_lgFit(s,o.size||36,o.w||800),ls=String(s).split('|'),lh=size*1.22,y0=y-(ls.length-1)*lh/2+size*0.36;
 return `<text class="${o.cls||'lgt'}" x="${x}" y="${y0.toFixed(1)}" font-size="${size}" text-anchor="${o.a||'middle'}"${o.fill?` fill="${o.fill}"`:''}>`+ls.map((l,i)=>`<tspan x="${x}" ${i?`dy="${lh.toFixed(1)}"`:''}>${_lgSpan(l)}</tspan>`).join('')+`</text>`;}
// 动画单元
function LU(inner,o={}){const a=[`class="lu${o.cls?' '+o.cls:''}"`,`data-ls="${o.s==null?0:o.s}"`,`data-fx="${o.fx||'fade'}"`];
 ['hot','dim','out','delay'].forEach(k=>{if(o[k]!=null)a.push(`data-${k}="${o[k]}"`);});if(o.o)a.push(`data-o="${o.o}"`);return `<g ${a.join(' ')}>${inner}</g>`;}
const _lgSvg=(W,H,inner,defs='')=>`<div class="lgx"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>`+
 `<marker id="lgAw" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="rgba(244,241,234,.8)"/></marker>`+
 `<marker id="lgAo" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#F5A623"/></marker>`+
 `<marker id="lgAr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#E8553A"/></marker>`+
 `<filter id="lgGl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>${defs}</defs>${inner}</svg></div>`;
const _box=(cx,cy,w,h,t,n,o={})=>`<rect class="lgbox${o.k?' k-'+o.k:''}" x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" rx="${o.rx==null?12:o.rx}"/>`+
 (n?LT(cx,cy-h*0.13,t,{size:o.size||36,w:w-28,cls:'lgt lgbt'})+LT(cx,cy+h*0.24,n,{size:o.ns||25,w:w-24,cls:'lgn'}):LT(cx,cy,t,{size:o.size||36,w:w-28,cls:'lgt lgbt'}));
const _S=(x,d)=>x&&x.s!=null?x.s:d;
const _pol=(cx,cy,r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];

Object.assign(CARD_EXT,{
 // ① 飞轮 / 循环 {title,items:[{t,n,s,hot}],center:{t,s},flow:{s},break:{i,s,label},bad:true}
 //   bad:true = 恶性循环（红色）；break.i = 第几段弧断开（从第 i 个节点出发的那段）
 cycle:d=>{const W=920,H=760,cx=460,cy=390,R=270,n=d.items.length,col=d.bad?LG.r:LG.o;
  const ang=i=>-Math.PI/2+i*2*Math.PI/n,nw=n>4?236:260,nh=n>4?108:116;
  let arcs='';d.items.forEach((it,i)=>{const gp=a=>(Math.abs(Math.sin(a))*nw/2+Math.abs(Math.cos(a))*nh/2+26)/R,a0=ang(i)+gp(ang(i)),a1=ang(i+1)-gp(ang(i+1)),[x0,y0]=_pol(cx,cy,R,a0),[x1,y1]=_pol(cx,cy,R,a1);
   const br=d.break&&d.break.i===i;
   arcs+=LU(`<path class="dr" d="M${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" marker-end="url(#${d.bad?'lgAr':'lgAo'})"/>`,{s:_S(it,i)+(i===n-1?0:0),fx:'draw',delay:0.25,out:br?d.break.s:null});
   if(br){const [mx,my]=_pol(cx,cy,R,(ang(i)+ang(i+1))/2);
    arcs+=LU(`<path d="M${mx-20},${my-20} L${mx+20},${my+20} M${mx+20},${my-20} L${mx-20},${my+20}" stroke="${LG.r}" stroke-width="9" stroke-linecap="round"/>`+(d.break.label?LT(mx+(mx>cx?70:-70),my+(my>cy?50:-50),d.break.label,{size:30,w:260,cls:'lgt lgred',a:mx>cx?'start':'end'}):''),{s:d.break.s,fx:'pop'});}});
  const nodes=d.items.map((it,i)=>{const [x,y]=_pol(cx,cy,R,ang(i));return LU(_box(x,y,nw,nh,it.t,it.n,{size:34}),{s:_S(it,i),fx:'pop',hot:it.hot,dim:it.dim});}).join('');
  const orb=d.flow?[0,1,2,3].map(j=>`<circle class="lgorb" r="11" fill="${col}" data-j="${j}"/>`).join(''):'';
  const ctr=d.center?LU(`<circle cx="${cx}" cy="${cy}" r="118" fill="rgba(245,166,35,.10)" stroke="${col}" stroke-width="3" stroke-dasharray="6 10"/>`+LT(cx,cy,d.center.t,{size:40,w:200,cls:'lgt lgbt'}),{s:_S(d.center,n),fx:'pop'}):'';
  return head(d)+_lgSvg(W,H,`<g class="lgorbs" data-cx="${cx}" data-cy="${cy}" data-r="${R}" data-fs="${d.flow?d.flow.s:''}" data-n="${n}" data-bk="${d.break?d.break.i:''}" data-bs="${d.break?d.break.s:''}">${orb}</g>`+arcs+ctr+nodes);},

 // ② 拆解树（金字塔原理）{title,root:{t,n,s},kids:[{t,n,s,hot,dim,kids:[{t,s,hot,dim}]}]}  最多 3 枝 × 3 叶
 tree:d=>{const W=920,k=d.kids,n=k.length,cw=W/n,maxL=Math.max(0,...k.map(x=>(x.kids||[]).length)),H=Math.min(820,360+maxL*128);
  const rootY=64,l1=250;let g=LU(_box(W/2,rootY,Math.min(560,W-120),d.root.n?104:88,d.root.t,d.root.n,{k:'hot',size:40}),{s:_S(d.root,0),fx:'pop'});
  k.forEach((c,i)=>{const x=cw*(i+0.5),bw=cw-30;
   g+=LU(`<path class="dr" d="M${W/2},${rootY+(d.root.n?52:44)} L${W/2},${(rootY+l1)/2+4} L${x},${(rootY+l1)/2+4} L${x},${l1-50}" fill="none" stroke="${LG.l}" stroke-width="3" marker-end="url(#lgAw)"/>`,{s:_S(c,i+1),fx:'draw',dim:c.dim});
   g+=LU(_box(x,l1,bw,c.n?104:88,c.t,c.n,{size:36}),{s:_S(c,i+1),fx:'pop',delay:0.2,hot:c.hot,dim:c.dim});
   (c.kids||[]).forEach((q,j)=>{const y=l1+150+j*128;
    g+=LU(`<path class="dr" d="M${x-bw/2+26},${l1+(c.n?52:44)} L${x-bw/2+26},${y} L${x-bw/2+44},${y}" fill="none" stroke="${LG.l}" stroke-width="3"/>`+
     `<rect class="lgleaf" x="${x-bw/2+44}" y="${y-44}" width="${bw-44}" height="88" rx="10"/>`+LT(x+22,y,q.t,{size:32,w:bw-70,cls:'lgt'}),{s:_S(q,i+1),fx:'fade',delay:0.35+j*0.15,hot:q.hot,dim:q.dim??c.dim});});});
  return head(d)+_lgSvg(W,H,g);},

 // ③ 漏斗 {title,unit,levels:[{t,val,v,s,hot,rate}],note:{t,s}}   v 只决定宽度（相对第一层）；rate 写在两层之间的小字（如「剩 38%」）
 funnel:d=>{const W=920,L=d.levels,n=L.length,rowH=Math.min(140,640/n),H=n*rowH+30,mx=L[0].v;
  const wid=v=>Math.max(380,820*v/mx);let g='';
  L.forEach((l,i)=>{const w0=wid(l.v),w1=i<n-1?wid(L[i+1].v):w0*0.86,y=i*rowH+10,hh=rowH-16;
   g+=LU(`<path class="lgfun" d="M${(W-w0)/2},${y} L${(W+w0)/2},${y} L${(W+w1)/2},${y+hh} L${(W-w1)/2},${y+hh} z"/>`+
    LT(W/2,y+hh/2,(l.t||'')+(l.val?'　'+l.val:''),{size:38,w:Math.min(w0,w1)-40,cls:'lgt lgbt'}),{s:_S(l,i),fx:'grow',o:'center top',hot:l.hot,dim:l.dim});
   if(l.rate&&i<n-1)g+=LU(LT((W+w1)/2+18,y+hh+6,l.rate,{size:28,w:200,a:'start',cls:'lgt lgor'}),{s:_S(L[i+1],i+1),fx:'fade',delay:0.3});});
  return head(d)+_lgSvg(W,H,g)+(d.note?`<div class="u lg-note" data-s="${_S(d.note,n)}">${hi(d.note.t||d.note)}</div>`:'');},

 // ④ 金字塔 / 层级 {title,levels:[{t,n,s,hot,dim}]}   levels[0] 在塔尖；默认从塔底往上长（s 自己写）
 pyramid:d=>{const W=920,L=d.levels,n=L.length,H=Math.min(760,n*150+20),rh=(H-20)/n,top=300,bot=880;let g='';
  L.forEach((l,i)=>{const y0=10+i*rh,y1=y0+rh-10,w0=top+(bot-top)*i/n,w1=top+(bot-top)*(i+1)/n;
   g+=LU(`<path class="lgpyr" d="M${(W-w0)/2},${y0} L${(W+w0)/2},${y0} L${(W+w1)/2},${y1} L${(W-w1)/2},${y1} z"/>`+
    (l.n?LT(W/2,(y0+y1)/2-16,l.t,{size:38,w:w0-50,cls:'lgt lgbt'})+LT(W/2,(y0+y1)/2+28,l.n,{size:25,w:w0-40,cls:'lgn'}):LT(W/2,(y0+y1)/2,l.t,{size:40,w:w0-50,cls:'lgt lgbt'})),
    {s:_S(l,n-i),fx:'pop',hot:l.hot,dim:l.dim});});
  return head(d)+_lgSvg(W,H,g);},

 // ⑤ 交集 {title,sets:[{t,n,s}]（2 或 3 个）,mid:{t,s}}  交集区域填橙，中间写结论
 venn:d=>{const W=920,S=d.sets,three=S.length>2,H=three?780:620,r=three?220:250;
  const C=three?[[330,270],[590,270],[460,490]]:[[320,310],[600,310]];
  const defs=C.map((c,i)=>`<clipPath id="lgV${i}"><circle cx="${c[0]}" cy="${c[1]}" r="${r}"/></clipPath>`).join('');
  let g=S.map((s,i)=>{const [x,y]=C[i],lx=three?(i===0?x-90:i===1?x+90:x):(i?x+110:x-110),ly=three?(i===2?y+110:y-90):y;
   return LU(`<circle class="lgvc" cx="${x}" cy="${y}" r="${r}"/>`+LT(lx,ly-(s.n?18:0),s.t,{size:40,w:200,cls:'lgt lgbt'})+(s.n?LT(lx,ly+28,s.n,{size:25,w:200,cls:'lgn'}):''),{s:_S(s,i),fx:'pop'});}).join('');
  if(d.mid){const inner=three?`<g clip-path="url(#lgV0)"><g clip-path="url(#lgV1)"><circle cx="${C[2][0]}" cy="${C[2][1]}" r="${r}" fill="#F5A623" clip-path="url(#lgV2)"/></g></g>`
    :`<g clip-path="url(#lgV0)"><circle cx="${C[1][0]}" cy="${C[1][1]}" r="${r}" fill="#F5A623"/></g>`;
   const mx=three?460:460,my=three?355:310;
   g+=LU(`<g opacity=".92">${inner}</g>`+LT(mx,my,d.mid.t,{size:34,w:three?150:200,cls:'lgt lgdark'}),{s:_S(d.mid,S.length),fx:'pop'});}
  return head(d)+_lgSvg(W,H,g,defs);},

 // ⑥ 时间轴（竖）{title,items:[{d,t,n,s,hot,dim}],now:{i,label,s}}  左边日期，右边事件；轴线跟着事件往下画
 timeline:d=>{const W=920,I=d.items,n=I.length,gap=Math.min(150,720/n),H=n*gap+20,ax=230;let g='';
  I.forEach((it,i)=>{const y=20+i*gap+gap/2-10;
   if(i>0)g+=LU(`<line class="dr" x1="${ax}" y1="${y-gap+16}" x2="${ax}" y2="${y-16}" stroke="${LG.l}" stroke-width="4"/>`,{s:_S(it,i),fx:'draw'});
   g+=LU(`<circle cx="${ax}" cy="${y}" r="14" class="lgtd"/>`+LT(ax-38,y,it.d,{size:34,w:180,a:'end',cls:'lgt lgdate'})+
    (it.n?LT(ax+44,y-20,it.t,{size:36,w:620,a:'start',cls:'lgt lgbt'})+LT(ax+44,y+26,it.n,{size:26,w:620,a:'start',cls:'lgn'}):LT(ax+44,y,it.t,{size:36,w:620,a:'start',cls:'lgt lgbt'})),
    {s:_S(it,i),fx:'fade',hot:it.hot,dim:it.dim});});
  if(d.now){const y=20+d.now.i*gap+gap/2-10;g+=LU(`<circle cx="${ax}" cy="${y}" r="30" fill="none" stroke="${LG.o}" stroke-width="4"/>`+(d.now.label?`<rect x="${W-200}" y="${y-28}" width="180" height="56" rx="8" fill="${LG.o}"/>`+LT(W-110,y,d.now.label,{size:30,w:160,cls:'lgt lgdark'}):''),{s:d.now.s,fx:'pop'});}
  return head(d)+_lgSvg(W,H,g);},

 // ⑦ 冰山（表象 vs 本质）{title,above:[{t,s}],below:[{t,s,hot}],wl:"看得见的",bl:"看不见的"}
 iceberg:d=>{const W=920,H=800,wy=230;
  let g=`<rect x="0" y="${wy}" width="${W}" height="${H-wy}" fill="rgba(60,110,150,.16)"/>`+
   `<path class="lgwave" d="M0,${wy} ${[...Array(23)].map((_,i)=>`Q${i*40+20},${wy+(i%2?7:-7)} ${i*40+40},${wy}`).join(' ')}" fill="none" stroke="rgba(160,210,240,.7)" stroke-width="3"/>`+
   LT(24,wy-22,d.wl||'水面上：人人看得见',{size:26,w:420,a:'start',cls:'lgn',fit:false})+LT(24,wy+42,d.bl||'水面下：真正起作用的',{size:26,w:420,a:'start',cls:'lgn',fit:false});
  g+=`<path d="M380,${wy} L440,70 L500,110 L560,${wy} z" class="lgice"/>`;
  g+=LU(`<path d="M150,${wy} L790,${wy} L860,520 L700,${H-20} L260,${H-30} L70,500 z" class="lgice lgdeep"/>`,{s:d.deepS??1,fx:'fade'});
  (d.above||[]).forEach((a,i)=>{g+=LU(LT(650+0,80+i*62,a.t,{size:34,w:260,a:'start',cls:'lgt lgbt'}),{s:_S(a,0),fx:'fade',dim:a.dim});});
  const B=d.below||[],gap=Math.min(110,(H-wy-120)/Math.max(1,B.length));
  B.forEach((b,i)=>{g+=LU(LT(460,wy+110+i*gap,b.t,{size:38,w:560,cls:'lgt lgbt'}),{s:_S(b,i+1),fx:'pop',hot:b.hot});});
  return head(d)+_lgSvg(W,H,g);},

 // ⑧ 分流（桑基）{title,unit,from:{t,val},outs:[{t,val,v,s,hot,dim}]}  一个总量往下分成几股，带子宽度按 v
 sankey:d=>{const W=920,H=720,O=d.outs,tot=O.reduce((a,b)=>a+b.v,0),SW=760,sx=(W-SW)/2,gapB=24,BW=W-60-gapB*(O.length-1);
  const F=d.from||{},n=O.length,minW=Math.min(150,BW/n);
  let g=LU(`<rect x="${sx}" y="10" width="${SW}" height="96" rx="12" class="lgsrc"/>`+LT(W/2,58,(F.t||'')+(F.val?'　'+F.val:''),{size:42,w:SW-40,cls:'lgt lgdark'}),{s:_S(F,0),fx:'grow',o:'center center'});
  let a=sx,b=30;O.forEach((o,i)=>{const ws=SW*o.v/tot,wb=minW+(BW-n*minW)*o.v/tot,y0=106,y1=500,mid=(y0+y1)/2;
   const p=`M${a},${y0} C${a},${mid} ${b},${mid} ${b},${y1} L${b+wb},${y1} C${b+wb},${mid} ${a+ws},${mid} ${a+ws},${y0} z`;
   const c=`M${a+ws/2},${y0} C${a+ws/2},${mid} ${b+wb/2},${mid} ${b+wb/2},${y1}`;
   g+=LU(`<path d="${p}" class="lgrib"/><path class="lgsp" d="${c}" fill="none" stroke="none"/>`+[0,1,2].map(j=>`<circle class="lgsd" r="7" data-j="${j}"/>`).join('')+
    `<rect x="${b}" y="${y1}" width="${wb}" height="22" class="lgdst"/>`+LT(b+wb/2,y1+80,o.t,{size:34,w:wb+gapB-6,cls:'lgt lgbt'})+(o.val?LT(b+wb/2,y1+136,o.val,{size:44,w:wb,cls:'lgt lgnum'}):''),
    {s:_S(o,i+1),fx:'grow',o:'center top',hot:o.hot,dim:o.dim,cls:'lgsk'});a+=ws;b+=wb+gapB;});
  return head(d)+_lgSvg(W,H,g)+(d.unit?`<div class="u ch-unit" data-s="0">${esc(d.unit)}</div>`:'');},

 // ⑨ 构成环 {title,center:{num,dec,unit,label},parts:[{t,v,val,s,hot}]}  环一段段画出来，下面是图例
 donut:d=>{const W=920,P=d.parts,cx=460,cy=290,r=210,C=2*Math.PI*r,tot=P.reduce((a,b)=>a+b.v,0),H=600+Math.ceil(P.length/2)*70;let acc=0,g=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(244,241,234,.12)" stroke-width="74"/>`;
  P.forEach((p,i)=>{const f=p.v/tot,col=p.hot?LG.o:['#CFC9BE','#8E8A82','#5E5B55','#B3ADA2','#77736C'][i%5];
   g+=LU(`<circle class="dr lgarc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="74" data-len="${(C*f-4).toFixed(1)}" transform="rotate(${(-90+acc*360).toFixed(2)} ${cx} ${cy})"/>`,{s:_S(p,i+1),fx:'draw',hot:p.hot,dim:p.dim});
   const lx=i%2?490:60,ly=600+Math.floor(i/2)*70;
   g+=LU(`<rect x="${lx}" y="${ly-16}" width="32" height="32" rx="4" fill="${col}"/>`+LT(lx+48,ly,p.t+(p.val?'　'+p.val:''),{size:32,w:360,a:'start',cls:'lgt'+(p.hot?' lgor':'')}),{s:_S(p,i+1),fx:'fade',delay:0.2});acc+=f;});
  const c=d.center||{};g+=`<text class="lgt lgnum" x="${cx}" y="${cy+30}" font-size="104" text-anchor="middle"><tspan class="lgcnt" data-to="${c.num??''}" data-dec="${c.dec||0}">${c.num??''}</tspan><tspan font-size="46">${esc(c.unit||'')}</tspan></text>`+
   (c.label?LT(cx,cy+92,c.label,{size:28,w:300,cls:'lgn'}):'');
  return head(d)+_lgSvg(W,H,g);},

 // ⑩ 新旧对照 {title,left:"以前",right:"现在",rows:[{a,b,s}],verdict:{t,s}}  每行：左边灰掉，右边亮橙
 versus:d=>{const W=920,R=d.rows,rh=Math.min(130,600/R.length),H=110+R.length*rh;
  let g=`<text class="lgt lgcol" x="210" y="62" font-size="40" text-anchor="middle">${_lgSpan(d.left||'以前')}</text><text class="lgt lgcol lgor" x="710" y="62" font-size="40" text-anchor="middle">${_lgSpan(d.right||'现在')}</text>`+
   `<line x1="40" y1="92" x2="${W-40}" y2="92" stroke="rgba(244,241,234,.35)" stroke-width="2"/>`;
  R.forEach((r,i)=>{const y=110+i*rh+rh/2;
   g+=LU(LT(210,y,r.a,{size:34,w:360,cls:'lgt lgold'}),{s:_S(r,i+1),fx:'fade'});
   g+=LU(`<path d="M${420},${y} L${490},${y}" stroke="${LG.o}" stroke-width="5" marker-end="url(#lgAo)" class="dr"/>`,{s:_S(r,i+1),fx:'draw',delay:0.35});
   g+=LU(`<rect x="520" y="${y-rh/2+12}" width="380" height="${rh-24}" rx="10" class="lgnew"/>`+LT(710,y,r.b,{size:36,w:350,cls:'lgt lgbt'}),{s:_S(r,i+1),fx:'pop',delay:0.6});});
  return head(d)+_lgSvg(W,H,g)+(d.verdict?`<div class="u lg-note" data-s="${_S(d.verdict,R.length+1)}">${hi(d.verdict.t||d.verdict)}</div>`:'');},

 // ⑪ 阶梯 / 演进 {title,steps:[{t,n,s,hot,dim}],now:{i,s,label}}  从左下往右上走的台阶；now 标「你在这」
 ladder:d=>{const W=920,P=d.steps,n=P.length,sw=(W-40)/n,sh=Math.min(130,560/n),H=n*sh+190;let g='';
  P.forEach((p,i)=>{const x=20+i*sw,top=H-30-(i+1)*sh;
   g+=LU(`<rect class="lgstep" x="${x}" y="${top}" width="${sw-10}" height="${(i+1)*sh}" rx="8"/>`+LT(x+(sw-10)/2,top+46,`${i+1}`,{size:40,w:80,cls:'lgt lgnum'}),{s:_S(p,i),fx:'grow',o:'center bottom',hot:p.hot,dim:p.dim});
   g+=LU(LT(x+(sw-10)/2,top-(p.n?92:48),p.t,{size:34,w:sw-6,cls:'lgt lgbt'})+(p.n?LT(x+(sw-10)/2,top-38,p.n,{size:24,w:sw-6,cls:'lgn'}):''),{s:_S(p,i),fx:'fade',delay:0.25,hot:p.hot,dim:p.dim});});
  if(d.now){const i=d.now.i,x=20+i*sw+(sw-10)/2,top=H-30-(i+1)*sh;g+=LU(`<path d="M${x},${top+90} l-22,40 h44 z" fill="${LG.o}"/>`+(d.now.label?LT(x,top+170,d.now.label,{size:30,w:sw+40,cls:'lgt lgor'}):''),{s:d.now.s,fx:'pop'});}
  return head(d)+_lgSvg(W,H,g);},

 // ⑫ 单位图 {title,total:100,on:37,s,label,red:{n,s,label},cols:10}  100 个点，一颗颗亮起来；大数字跟着跳
 dots:d=>{const W=920,T=d.total||100,cols=d.cols||10,rows=Math.ceil(T/cols),cell=Math.min(58,560/cols),H=rows*cell+20,ox=W-cols*cell-10;let g='';
  const red=d.red?d.red.n:0;
  for(let i=0;i<T;i++){const x=ox+(i%cols)*cell+cell/2,y=10+Math.floor(i/cols)*cell+cell/2;
   g+=`<circle cx="${x}" cy="${y}" r="${cell*0.36}" fill="rgba(244,241,234,.18)"/>`;
   if(i<d.on)g+=LU(`<circle cx="${x}" cy="${y}" r="${cell*0.36}" fill="${LG.o}"/>`,{s:d.s||1,fx:'pop',delay:(i*Math.min(0.02,1.2/d.on)).toFixed(3)});
   else if(i>=T-red)g+=LU(`<circle cx="${x}" cy="${y}" r="${cell*0.36}" fill="${LG.r}"/>`,{s:d.red.s,fx:'pop',delay:((T-1-i)*0.02).toFixed(3)});}
  const tx=ox-30;
  g+=`<text class="lgt lgnum" x="${tx}" y="${H/2-10}" font-size="150" text-anchor="end"><tspan class="lgcnt" data-to="${d.on}" data-cs="${d.s||1}">${d.on}</tspan></text>`+LT(tx,H/2+50,`/ ${T}`,{size:40,w:200,a:'end',cls:'lgn',fit:false})+
   (d.label?LU(LT(tx,H/2+120,d.label,{size:30,w:tx-10,a:'end',cls:'lgt'}),{s:d.s||1,fx:'fade'}):'')+
   (d.red&&d.red.label?LU(LT(tx,H/2+175,d.red.label,{size:28,w:tx-10,a:'end',cls:'lgt lgred'}),{s:d.red.s,fx:'fade'}):'');
  return head(d)+_lgSvg(W,H,g);},

 // ⑬ 力场（推力 vs 阻力）{title,center:"现状",push:[{t,w,s}],pull:[{t,w,s}],net:{dir:1|-1,s,t}}
 //   push 从左往右推（橙），pull 从右往左挡（红）；w 1–5 决定箭头长短；net 到时中线往净方向挪
 forces:d=>{const W=920,P=d.push||[],Q=d.pull||[],n=Math.max(P.length,Q.length),rh=Math.min(150,620/n),H=n*rh+150,cx=460;let g='';
  g+=`<g class="lgfc" data-ns="${d.net?d.net.s:''}" data-dir="${d.net?d.net.dir:0}"><line x1="${cx}" y1="20" x2="${cx}" y2="${H-110}" stroke="${LG.w}" stroke-width="6"/>`+
   `<rect x="${cx-90}" y="${H-104}" width="180" height="56" rx="8" class="lgbox"/>`+LT(cx,H-76,d.center||'现状',{size:32,w:160,cls:'lgt lgbt'})+`</g>`;
  const AL=w=>80+w*64,arrow=(y,w,dir,col,mk)=>{const L=AL(w),x0=dir>0?cx-14-L:cx+14+L,x1=dir>0?cx-14:cx+14;return `<line class="dr" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${col}" stroke-width="${10+w*2}" marker-end="url(#${mk})"/>`;};
  P.forEach((p,i)=>{const y=70+i*rh+rh/2-20,w=p.w||3;g+=LU(arrow(y,w,1,LG.o,'lgAo')+LT(cx-14-AL(w),y-44,p.t,{size:32,w:AL(w),a:'start',cls:'lgt lgor'}),{s:_S(p,i+1),fx:'draw',dim:p.dim});});
  Q.forEach((p,i)=>{const y=70+i*rh+rh/2-20,w=p.w||3;g+=LU(arrow(y,w,-1,LG.r,'lgAr')+LT(cx+14+AL(w),y-44,p.t,{size:32,w:AL(w),a:'end',cls:'lgt lgred'}),{s:_S(p,P.length+i+1),fx:'draw',dim:p.dim});});
  return head(d)+_lgSvg(W,H,g)+(d.net&&d.net.t?`<div class="u lg-note" data-s="${d.net.s}">${hi(d.net.t)}</div>`:'');},
});

// ---------- 每帧 ----------
const _lgE=(t,T0,d)=>eo(cl((t-T0)/d));
function _lgInit(k){const el=k.el,us=[...el.querySelectorAll('.lu')].map(u=>{const o={el:u,s:+u.dataset.ls,fx:u.dataset.fx,delay:+(u.dataset.delay||0),
   hot:u.dataset.hot!=null?+u.dataset.hot:null,dim:u.dataset.dim!=null?+u.dataset.dim:null,out:u.dataset.out!=null?+u.dataset.out:null,
   dr:[...u.querySelectorAll('.dr')].map(p=>{let L=+(p.dataset.len||0);if(!L)L=p.getTotalLength?p.getTotalLength():0;if(p.classList.contains('lgarc'))p.style.strokeDasharray=`0 ${2*Math.PI*+p.getAttribute('r')}`;else p.style.strokeDasharray=`${L} ${L+2}`;return {p,L,C:p.classList.contains('lgarc')?2*Math.PI*+p.getAttribute('r'):0};})};
  if(o.fx==='grow'||o.fx==='pop'){u.style.transformBox='fill-box';u.style.transformOrigin=u.dataset.o||'center center';}return o;});
 return {us,cnt:[...el.querySelectorAll('.lgcnt')],orb:el.querySelector('.lgorbs'),sk:[...el.querySelectorAll('.lgsk')].map(g=>({g,p:g.querySelector('.lgsp'),ds:[...g.querySelectorAll('.lgsd')]})),fc:el.querySelector('.lgfc')};}
function LOGIC_FRAME(k,t){if(!k._lg)k._lg=_lgInit(k);const c=k.c,M=k._lg;
 M.us.forEach(u=>{const T0=tau(c,u.s)+u.delay;const p=_lgE(t,T0,0.45),q=io(cl((t-T0)/0.8));
  const hot=u.hot!=null?_lgE(t,tau(c,u.hot),0.4):0,dm=u.dim!=null?_lgE(t,tau(c,u.dim),0.6):0,ot=u.out!=null?_lgE(t,tau(c,u.out),0.5):0;
  let op=1;
  if(u.fx==='fade'){op=p;u.el.style.transform=`translate(0px,${(16*(1-p)).toFixed(1)}px)`;}
  else if(u.fx==='pop'){const z=cl((t-T0)/0.28);op=z;u.el.style.transform=`scale(${(1+0.25*(1-eo(z))).toFixed(4)})`;}
  else if(u.fx==='grow'){op=t>=T0?Math.min(1,p*2):0;const O=u.el.dataset.o||'',sc=O.includes('center center')?`scale(${q.toFixed(4)})`:/^(left|right)/.test(O)?`scaleX(${q.toFixed(4)})`:`scaleY(${q.toFixed(4)})`;u.el.style.transform=sc;}
  else if(u.fx==='draw'){op=t>=T0?1:0;u.dr.forEach(r=>{if(r.C)r.p.style.strokeDasharray=`${(r.L*q).toFixed(1)} ${r.C}`;else r.p.style.strokeDashoffset=(r.L*(1-q)).toFixed(1);});
   [...u.el.children].forEach(ch=>{if(!ch.classList.contains('dr'))ch.style.opacity=_lgE(t,T0+0.35,0.35).toFixed(3);});}
  u.el.classList.toggle('lhot',hot>0.5);
  u.el.style.opacity=(op*(1-ot)*(1-0.72*dm)).toFixed(3);});
 M.cnt.forEach(e=>{const to=+e.dataset.to;if(isNaN(to)||e.dataset.to==='')return;const s=e.dataset.cs!=null?+e.dataset.cs:0,q=eo(cl((t-tau(c,s)-0.05)/(e.dataset.cs!=null?1.4:0.9)));const dec=+(e.dataset.dec||0);e.textContent=dec?(to*q).toFixed(dec):Math.round(to*q);});
 if(M.orb){const g=M.orb,fs=g.dataset.fs;const live=fs!==''?_lgE(t,tau(c,+fs),0.5):0,cx=+g.dataset.cx,cy=+g.dataset.cy,R=+g.dataset.r,n=+g.dataset.n,bk=g.dataset.bk,bs=g.dataset.bs;
  const stop=bk!==''&&t>=tau(c,+bs);
  g.querySelectorAll('.lgorb').forEach((dot,j)=>{let a=-Math.PI/2+((t*0.32+j/4)%1)*2*Math.PI;
   if(stop){const seg=2*Math.PI/n,a0=-Math.PI/2+(+bk)*seg;const rel=((a-a0)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);if(rel>seg*0.5)a=a0+seg*0.5;}  // 断开后：光点堵在断点前
   dot.setAttribute('cx',(cx+R*Math.cos(a)).toFixed(1));dot.setAttribute('cy',(cy+R*Math.sin(a)).toFixed(1));dot.style.opacity=live.toFixed(3);});}
 M.sk.forEach((s,i)=>{if(!s.p)return;const L=s.L||(s.L=s.p.getTotalLength());s.ds.forEach((dot,j)=>{const u=((t*0.38+j/3+i*0.17)%1);const pt=s.p.getPointAtLength(u*L);dot.setAttribute('cx',pt.x.toFixed(1));dot.setAttribute('cy',pt.y.toFixed(1));dot.style.opacity=(Math.sin(u*Math.PI)*0.9).toFixed(3);});});
 if(M.fc&&M.fc.dataset.ns!==''){const q=io(cl((t-tau(c,+M.fc.dataset.ns))/1.2));M.fc.setAttribute('transform',`translate(${(90*q*+M.fc.dataset.dir).toFixed(1)},0)`);}
}
['cycle','tree','funnel','pyramid','venn','timeline','iceberg','sankey','donut','versus','ladder','dots','forces'].forEach(ty=>CARD_RENDER[ty]=LOGIC_FRAME);
