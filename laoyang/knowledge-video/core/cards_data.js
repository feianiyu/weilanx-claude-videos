// =====================================================================
// 老杨魔方 · 深度 v6 —— 数据类图卡（STANDARD_DEEP_V6.md），依赖 cards_logic.js 的 LT / LU / _lgSvg / LOGIC_FRAME
//   tilemap  中国方块地图：每省一格，按数值上色，讲到哪个省亮哪个
//   flowmap  世界流向图（示意布局）：区域之间的弧线，宽度按量，光点沿弧流动；量可在某一步变粗 / 变细
//   bubble   气泡图：两个维度 + 气泡大小；气泡可在某一步挪到新位置（讲「迁移」）
//   race     排名赛跑：几个时期的排名，条子按名次上下换位、长短跟着变
// 纯函数：不用真实时间和 Math.random。
// =====================================================================
// 中国 34 个省级行政区的方块位置（9 列 × 8 行，近似地理位置）
const CN_TILES={黑龙江:[8,0],新疆:[1,1],内蒙古:[5,1],吉林:[8,1],甘肃:[3,2],宁夏:[4,2],北京:[6,2],天津:[7,2],辽宁:[8,2],
 青海:[2,3],陕西:[4,3],山西:[5,3],河北:[6,3],山东:[7,3],西藏:[1,4],四川:[3,4],重庆:[4,4],河南:[5,4],安徽:[6,4],江苏:[7,4],上海:[8,4],
 云南:[3,5],贵州:[4,5],湖北:[5,5],江西:[6,5],浙江:[7,5],广西:[4,6],湖南:[5,6],广东:[6,6],福建:[7,6],台湾:[8,6],海南:[4,7],澳门:[5,7],香港:[6,7]};
const CN_SHORT={黑龙江:'黑',内蒙古:'蒙',新疆:'新',西藏:'藏',宁夏:'宁',广西:'桂'};
const _cnName=k=>k.length<=2?k:(CN_SHORT[k]||k.slice(0,2));
// 世界区域的示意位置（920 × 620）
const WORLD={北美:[150,190],美国:[150,200],拉美:[240,440],欧洲:[430,150],俄罗斯:[620,80],中东:[540,280],非洲:[440,410],印度:[630,350],
 中国:[730,230],日韩:[850,180],东盟:[750,400],澳洲:[830,540]};
const _mix=(a,b,p)=>{const A=[0,1,2].map(i=>parseInt(a.slice(1+2*i,3+2*i),16)),B=[0,1,2].map(i=>parseInt(b.slice(1+2*i,3+2*i),16));return '#'+A.map((x,i)=>Math.round(x+(B[i]-x)*p).toString(16).padStart(2,'0')).join('');};

Object.assign(CARD_EXT,{
 // ⑭ 中国方块地图 {title,vals:{广东:9.1,…},max,unit,hl:[{ids:[…],s,label}],legend:["低","高"]}
 //   没写 vals 的省是暗格；hl 到时这些省描橙边、其余压暗，label 写在图下方
 tilemap:d=>{const W=920,cell=96,gap=6,ox=(W-9*cell)/2,H=8*cell+70,V=d.vals||{},mx=d.max||Math.max(1,...Object.values(V));
  let g='';Object.entries(CN_TILES).forEach(([k,[c,r]],i)=>{const v=V[k],x=ox+c*cell,y=r*cell,has=v!=null,f=has?_mix('#3A342B','#F5A623',Math.min(1,v/mx)):'#1A1815';
   const hls=(d.hl||[]).map((h,j)=>h.ids.includes(k)?j:-1).filter(j=>j>=0);
   g+=`<g class="lgtile" data-k="${esc(k)}" data-hl="${hls.join(',')}" data-r="${r}"><rect x="${x+gap/2}" y="${y+gap/2}" width="${cell-gap}" height="${cell-gap}" rx="8" fill="${f}" class="lgtr${has?' has':''}"/>`+
    `<text class="lgt lgbt lgtt${has&&v/mx>0.55?' dk':''}" x="${x+cell/2}" y="${y+cell/2+(has&&d.showVal!==false?-6:10)}" font-size="28" text-anchor="middle">${esc(_cnName(k))}</text>`+
    (has&&d.showVal!==false?`<text class="lgt lgtv${v/mx>0.55?' dk':''}" x="${x+cell/2}" y="${y+cell/2+28}" font-size="22" text-anchor="middle">${esc(String(v))}</text>`:'')+`</g>`;});
  const lg=d.legend||['低','高'];
  g+=`<defs><linearGradient id="lgTg"><stop offset="0" stop-color="#3A342B"/><stop offset="1" stop-color="#F5A623"/></linearGradient></defs>`+
   `<rect x="${ox+40}" y="${8*cell+22}" width="200" height="18" rx="9" fill="url(#lgTg)"/>`+LT(ox+4,8*cell+31,lg[0],{size:24,a:'start',cls:'lgn',fit:false})+LT(ox+252,8*cell+31,lg[1]+(d.unit?'（'+d.unit+'）':''),{size:24,a:'start',cls:'lgn',fit:false});
  (d.hl||[]).forEach((h,j)=>{if(h.label)g+=LU(LT(W-ox,8*cell+31,h.label,{size:32,w:520,a:'end',cls:'lgt lgor'}),{s:h.s,fx:'fade',out:(d.hl[j+1]||{}).s});});
  return head(d)+_lgSvg(W,H,g);},

 // ⑮ 世界流向图 {title,nodes:{名称:[x,y]}（可选，默认 WORLD）,flows:[{a,b,v,s,label,to:{v,s},hot,bend}],show:[区域…],max}
 flowmap:d=>{const W=920,H=620,P=Object.assign({},WORLD,d.nodes||{}),F=d.flows||[],mx=d.max||Math.max(...F.map(f=>Math.max(f.v,f.to?f.to.v:0)));
  const used=new Set(d.show||F.flatMap(f=>[f.a,f.b]));
  let g=`<g opacity=".5">${[...Array(7)].map((_,i)=>`<line x1="0" y1="${60+i*90}" x2="${W}" y2="${60+i*90}" stroke="rgba(244,241,234,.06)" stroke-width="2"/>`).join('')}</g>`;
  F.forEach((f,i)=>{const [x0,y0]=P[f.a],[x1,y1]=P[f.b],mx2=(x0+x1)/2,my2=(y0+y1)/2,dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,b=(f.bend==null?0.28:f.bend)*L;
   const cx=mx2-dy/L*b,cy=my2+dx/L*b,p=`M${x0},${y0} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1},${y1}`;
   g+=`<g class="lu lgfw" data-ls="${f.s||0}" data-fx="draw" data-w0="${(4+22*f.v/mx).toFixed(1)}" data-w1="${f.to?(4+22*f.to.v/mx).toFixed(1):''}" data-ws="${f.to?f.to.s:''}"${f.hot!=null?` data-hot="${f.hot}"`:''}>`+
    `<path class="dr lgfp" d="${p}" fill="none" stroke="${f.hot!=null?'#F5A623':'rgba(244,241,234,.55)'}" stroke-width="${(4+22*f.v/mx).toFixed(1)}" stroke-linecap="round"/>`+
    [0,1,2,3].map(j=>`<circle class="lgfd" r="7" fill="#F5A623" data-j="${j}"/>`).join('')+
    (f.label?LT(cx+(cx>W/2?-10:10),cy+(cy>my2?34:-24),f.label,{size:28,w:300,cls:'lgt lgor',a:cx>W/2?'end':'start'}):'')+`</g>`;});
  Object.keys(P).filter(k=>!used.has(k)&&!(k==='美国'&&used.has('北美'))&&!(k==='北美'&&used.has('美国'))).forEach(k=>{const [x,y]=P[k];g+=`<g opacity=".35"><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#F4F1EA" stroke-width="3"/>`+LT(x,y-28,k,{size:24,w:160,cls:'lgn'})+`</g>`;});
  [...used].forEach(k=>{const [x,y]=P[k];g+=`<g><circle cx="${x}" cy="${y}" r="16" fill="#0A0A0A" stroke="#F4F1EA" stroke-width="4"/>`+LT(x,y-38,k,{size:32,w:200,cls:'lgt lgbt'})+`</g>`;});
  return head(d)+_lgSvg(W,H,g)+(d.note?`<div class="u lg-note" data-s="${_S(d.note,F.length+1)}">${hi(d.note.t||d.note)}</div>`:'')+`<div class="u ch-unit" data-s="0">${esc(d.unit||'示意布局，非实际地图')}</div>`;},

 // ⑯ 气泡图 {title,xl:["低","高"],yl:["低","高"],xt,yt,items:[{t,x,y,r,s,hot,dim,move:{x,y,s}}]}  x、y 取 0–1；r 是相对大小 1–10
 bubble:d=>{const W=920,H=700,L=90,R=W-30,T=20,B=H-80,X=v=>L+v*(R-L),Y=v=>B-v*(B-T);
  let g=`<line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="rgba(244,241,234,.5)" stroke-width="3" marker-end="url(#lgAw)"/><line x1="${L}" y1="${B}" x2="${L}" y2="${T}" stroke="rgba(244,241,234,.5)" stroke-width="3" marker-end="url(#lgAw)"/>`+
   LT((L+R)/2,B+50,d.xt||'',{size:28,w:600,cls:'lgn'})+LT(L+10,B+50,(d.xl||[''])[0],{size:24,a:'start',cls:'lgn',w:150})+LT(R,B+50,(d.xl||['',''])[1],{size:24,a:'end',cls:'lgn',w:150})+
   `<text class="lgn" x="${L-40}" y="${(T+B)/2}" font-size="28" text-anchor="middle" transform="rotate(-90 ${L-40} ${(T+B)/2})">${esc(d.yt||'')}</text>`;
  (d.items||[]).forEach((it,i)=>{const r=18+(it.r||3)*9,col=it.hot!=null?'#F5A623':'rgba(244,241,234,.75)';
   g+=`<g class="lgbw" data-x0="${X(it.x)}" data-y0="${Y(it.y)}"${it.move?` data-x1="${X(it.move.x)}" data-y1="${Y(it.move.y)}" data-ms="${it.move.s}"`:''}>`+
    LU(`<circle cx="0" cy="0" r="${r}" class="lgbub${it.hot!=null?' hot':''}"/>`+LT(0,-r-22,it.t,{size:30,w:240,cls:'lgt lgbt'}),{s:_S(it,i+1),fx:'pop',hot:it.hot,dim:it.dim})+`</g>`;});
  return head(d)+_lgSvg(W,H,g);},

 // ⑰ 排名赛跑 {title,unit,periods:["2015","2020","2025"],items:[{t,vals:[…],hot}],top:6}  第 i 个时期在第 i 个 step 到（第 0 个随卡）
 race:d=>{const W=920,n=Math.min(d.top||6,d.items.length),rh=92,H=n*rh+150;
  const bars=d.items.map((it,i)=>`<g class="lgrc" data-i="${i}"><rect class="lgrb${it.hot?' hot':''}" x="190" y="${-rh/2+12}" height="${rh-24}" rx="6" width="10"/>`+
   `<text class="lgt lgbt" x="172" y="12" font-size="34" text-anchor="end">${_lgSpan(it.t)}</text><text class="lgt lgnum lgrv" x="210" y="12" font-size="32">0</text></g>`).join('');
  return head(d)+_lgSvg(W,H,`<text class="lgnum lgrp" x="${W-10}" y="${H-24}" font-size="110" text-anchor="end" opacity=".9">${esc(d.periods[0])}</text>`+
   `<g class="lgrcs" data-rh="${rh}" data-n="${n}">${bars}</g>`)+(d.unit?`<div class="u ch-unit" data-s="0">${esc(d.unit)}</div>`:'');},
});

// ---------- 每帧（在 LOGIC_FRAME 之后补各自的动作）----------
function _dataTick(k,t){const c=k.c,d=c.data||{},el=k.el;
 if(c.type==='tilemap'){if(!k._tm)k._tm=[...el.querySelectorAll('.lgtile')];
  const H=d.hl||[];let cur=-1;H.forEach((h,j)=>{if(t>=tau(c,h.s))cur=j;});const q=cur>=0?eo(cl((t-tau(c,H[cur].s))/0.5)):0;
  k._tm.forEach(g=>{const r=+g.dataset.r,a=eo(cl((t-c.t0-0.05*r)/0.45)),on=cur>=0&&g.dataset.hl.split(',').includes(String(cur));
   g.style.opacity=(a*(cur<0||on?1:1-0.65*q)).toFixed(3);g.classList.toggle('on',on&&q>0.3);});}
 if(c.type==='flowmap'){if(!k._fm)k._fm=[...el.querySelectorAll('.lgfw')].map(g=>({g,p:g.querySelector('.lgfp'),L:g.querySelector('.lgfp').getTotalLength(),ds:[...g.querySelectorAll('.lgfd')]}));
  k._fm.forEach((f,i)=>{const T0=tau(c,+f.g.dataset.ls),live=_lgE(t,T0+0.7,0.4),w0=+f.g.dataset.w0;let w=w0;
   if(f.g.dataset.ws!==''){const q=io(cl((t-tau(c,+f.g.dataset.ws))/1.0));w=w0+(+f.g.dataset.w1-w0)*q;}f.p.setAttribute('stroke-width',w.toFixed(1));
   f.ds.forEach((dot,j)=>{const u=((t*0.3+j/4+i*0.13)%1),pt=f.p.getPointAtLength(u*f.L);dot.setAttribute('cx',pt.x.toFixed(1));dot.setAttribute('cy',pt.y.toFixed(1));dot.setAttribute('r',(3+w*0.28).toFixed(1));dot.style.opacity=(live*Math.sin(u*Math.PI)).toFixed(3);});});}
 if(c.type==='bubble'){if(!k._bb)k._bb=[...el.querySelectorAll('.lgbw')];
  k._bb.forEach(g=>{let x=+g.dataset.x0,y=+g.dataset.y0;if(g.dataset.ms!=null){const q=io(cl((t-tau(c,+g.dataset.ms))/1.2));x+=(+g.dataset.x1-x)*q;y+=(+g.dataset.y1-y)*q;}g.setAttribute('transform',`translate(${x.toFixed(1)},${y.toFixed(1)})`);});}
 if(c.type==='race'){const box=el.querySelector('.lgrcs');if(!k._rc)k._rc={gs:[...el.querySelectorAll('.lgrc')],per:el.querySelector('.lgrp')};
  const P=d.periods,I=d.items,rh=+box.dataset.rh,n=+box.dataset.n;let a=0,q=0;for(let i=1;i<P.length;i++){const T=tau(c,i);if(t>=T){a=i-1;q=io(cl((t-T)/1.6));}}
  if(q>=1){a=Math.min(P.length-1,a+1);q=0;}const b=Math.min(P.length-1,a+1);
  const val=it=>it.vals[a]+(it.vals[b]-it.vals[a])*q,rank=j=>[...I.keys()].sort((x,y)=>I[y].vals[j]-I[x].vals[j]),ra=rank(a),rb=rank(b);
  const mx=Math.max(...I.map(val)),grow=_lgE(t,c.t0+0.1,0.8);
  k._rc.gs.forEach((g,i)=>{const pa=ra.indexOf(i),pb=rb.indexOf(i),pos=pa+(pb-pa)*q,v=val(I[i]);
   g.setAttribute('transform',`translate(0,${(20+rh/2+pos*rh).toFixed(1)})`);g.style.opacity=pos<n-0.01?Math.min(1,n-pos).toFixed(3):'0';
   const w=Math.max(8,(W_RACE-210)*v/mx*grow);g.querySelector('rect').setAttribute('width',w.toFixed(1));const tv=g.querySelector('.lgrv');tv.setAttribute('x',(200+w+14).toFixed(1));
   const dec=(String(I[i].vals[0]).split('.')[1]||'').length;tv.textContent=(v*grow).toFixed(dec);});
  k._rc.per.textContent=q>0.5?P[b]:P[a];}
}
const W_RACE=760;
['tilemap','flowmap','bubble','race'].forEach(ty=>CARD_RENDER[ty]=(k,t)=>{LOGIC_FRAME(k,t);_dataTick(k,t);});

Object.assign(CARD_EXT,{
 // ⑱ 分叉图（K 型 / 分化）{title,trunk:{t,s},up:{t,n,items:[…],s,is,hot},down:{…},ask:{t,s}}
 //   一根主干往右走，在中间分成往上、往下两枝；items 是两枝各自的成员（is = 它们出现的 step）
 diverge:d=>{const W=920,H=720,y0=380,x0=40,xs=330,xe=880,yu=70,yd=690,U=d.up||{},Dn=d.down||{};
  let g=LU(`<path class="dr" d="M${x0},${y0} L${xs},${y0}" stroke="#F4F1EA" stroke-width="14" stroke-linecap="round" fill="none"/>`+LT(x0+(xs-x0)/2,y0+52,(d.trunk||{}).t||'',{size:32,w:300,cls:'lgt lgbt'}),{s:_S(d.trunk,0),fx:'draw'});
  g+=LU(`<path class="dr" d="M${xs},${y0} L${xe-20},${yu+18}" stroke="${U.hot!=null?'#F5A623':'#F4F1EA'}" stroke-width="14" stroke-linecap="round" fill="none" marker-end="url(#${U.hot!=null?'lgAo':'lgAw'})"/>`+
   LT(xe,yu-28,U.t||'',{size:44,w:420,a:'end',cls:'lgt lgbt'+(U.hot!=null?' lgor':'')})+(U.n?LT(xe,yu+30,U.n,{size:26,w:330,a:'end',cls:'lgn'}):''),{s:_S(U,1),fx:'draw',hot:U.hot});
  g+=LU(`<path class="dr" d="M${xs},${y0} L${xe-20},${yd-18}" stroke="${Dn.hot!=null?'#E8553A':'rgba(244,241,234,.55)'}" stroke-width="14" stroke-linecap="round" fill="none" marker-end="url(#${Dn.hot!=null?'lgAr':'lgAw'})"/>`+
   LT(xe,yd+46,Dn.t||'',{size:44,w:420,a:'end',cls:'lgt lgbt'+(Dn.hot!=null?' lgred':'')})+(Dn.n?LT(xe,yd-40,Dn.n,{size:26,w:330,a:'end',cls:'lgn'}):''),{s:_S(Dn,2),fx:'draw'});
  (U.items||[]).forEach((t,i)=>{g+=LU(LT(xe,215+i*52,t,{size:32,w:330,a:'end',cls:'lgt'}),{s:U.is??_S(U,1),fx:'fade',delay:i*0.15});});
  (Dn.items||[]).forEach((t,i)=>{g+=LU(LT(xe,490+i*52,t,{size:32,w:330,a:'end',cls:'lgt'}),{s:Dn.is??_S(Dn,2),fx:'fade',delay:i*0.15});});
  if(d.ask)g+=LU(`<rect x="${x0}" y="140" width="290" height="70" rx="10" fill="#F5A623"/>`+LT(x0+145,175,d.ask.t,{size:34,w:270,cls:'lgt lgdark'}),{s:d.ask.s,fx:'pop'});
  return head(d)+_lgSvg(W,H,g);},

 // ⑲ 正负条形图（有涨有跌）{title,unit,items:[{t,v,s,hot}],total:{t,v,s}}  v 带正负；0 轴的位置按数据自动放
 pnbar:d=>{const W=920,I=d.items||[],T=d.total,all=[...I,...(T?[T]:[])],mn=Math.min(0,...all.map(x=>x.v)),mx=Math.max(0,...all.map(x=>x.v));
  const L0=300,R0=W-190,rh=104,H=all.length*rh+(T?40:10),X=v=>L0+(v-mn)/(mx-mn||1)*(R0-L0),ax=X(0);
  let g='';const row=(it,i,y,isT)=>{const x1=X(it.v),neg=it.v<0,hot=it.hot!=null||isT,col=hot?(neg?'#E8553A':'#F5A623'):(neg?'rgba(244,241,234,.38)':'rgba(244,241,234,.75)');
   const lab=(it.v>0?'+':'')+it.v+(d.unit||'');
   return LU(`<rect x="${Math.min(ax,x1).toFixed(1)}" y="${y-30}" width="${Math.max(4,Math.abs(x1-ax)).toFixed(1)}" height="60" rx="4" fill="${col}"/>`,{s:_S(it,i+1),fx:'grow',o:neg?'right center':'left center'})+
    LU(LT(neg?ax+16:Math.max(ax,x1)+14,y,lab,{size:36,w:200,a:'start',cls:'lgt lgnum'+(hot?'':' lgnn')+(neg&&hot?' lgred':'')}),{s:_S(it,i+1),fx:'fade',delay:0.4})+
    LU(LT(neg&&x1<L0+120?L0-24:L0-24,y,it.t,{size:32,w:270,a:'end',cls:'lgt lgbt'+(isT?' lgor':'')}),{s:_S(it,i+1),fx:'fade'});};
  I.forEach((it,i)=>{g+=row(it,i,40+i*rh,false);});
  if(T){const y=40+I.length*rh+30;g+=LU(`<line x1="20" y1="${y-62}" x2="${W-20}" y2="${y-62}" stroke="rgba(244,241,234,.3)" stroke-width="2" stroke-dasharray="8 8"/>`,{s:_S(T,I.length+1),fx:'fade'})+row(T,I.length,y,true);}
  g=`<line x1="${ax}" y1="0" x2="${ax}" y2="${H}" stroke="rgba(244,241,234,.6)" stroke-width="3"/>`+g;
  return head(d)+_lgSvg(W,H,g)+(d.src?'':'');},
});
['diverge','pnbar'].forEach(ty=>CARD_RENDER[ty]=LOGIC_FRAME);
