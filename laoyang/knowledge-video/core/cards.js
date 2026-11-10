// =====================================================================
// 老杨魔方 · 深度拆解版 卡片库（cards.js）—— 跨期复用，每期在 lines.json → cards 里配置
// 一张卡 = 一个 HTML 模板；模板里的「单元」写 data-s="n"：0 = 随卡出现，n = 第 n 个 step 锚点到时出现。
// 动效只有这几种（STANDARD_DEEP.md §5.3）：淡入上移 / grow 长出 / count 数字滚动 / strike 删除线 /
// pop 贴纸弹入 / zoom 图表推近。纯函数：每帧由 renderCards(t) 根据时间算样子，不用真实时间和 Math.random。
// =====================================================================
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const hi=s=>esc(s).replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\|/g,'<br>');   // *词* 橙色强调，| 换行
const U=(s,inner,cls='',extra='')=>`<div class="u ${cls}" data-s="${s}" ${extra}>${inner}</div>`;
const sOf=(x,d)=>x&&x.s!=null?x.s:d;
const num=(v,dec,unit)=>`<span class="cnt" data-to="${v}" data-dec="${dec==null?(String(v).split('.')[1]||'').length:dec}">${v}</span>${unit?`<span class="unit">${esc(unit)}</span>`:''}`;
const head=d=>(d.eyebrow?U(0,esc(d.eyebrow),'ey'):'')+(d.title?U(0,hi(d.title),'ti'):'');

const CARD={
 // 目录卡：交代全局、本期在哪 {eyebrow,title,note,items:[{no,name,note,on}]}
 index:d=>head(d)+(d.note?U(0,esc(d.note),'tnote'):'')+`<div class="ix-grid">`+d.items.map((it,i)=>U(sOf(it,0),
   `<div class="ix-no">${esc(it.no||'')}</div><div class="ix-name">${hi(it.name)}</div><div class="ix-note">${hi(it.note||'')}</div>`+
   (it.on?U(it.on===true?1:it.on,'','ix-on'):''),'ix')).join('')+`</div>`,
 // 焦点卡：本期对象 {eyebrow,title,sub,cols:[{k,v}],foot}
 focus:d=>`<div class="fc-box">`+head(d)+(d.sub?U(0,hi(d.sub),'fc-sub'):'')+`<div class="cols">`+d.cols.map((c,i)=>U(sOf(c,i+1),
   `<div class="ck">${hi(c.k)}</div><div class="cv">${hi(c.v||'')}</div>`+(c.tag?`<span class="tag">${esc(c.tag)}</span>`:''),'col'+(c.on?' on':''))).join('')+`</div></div>`+
   (d.foot?U(sOf(d.foot,d.cols.length+1),hi(d.foot.text||d.foot),'foot-o'):''),
 // 问题卡：抛出本期问题 / 前提 {eyebrow,lines:[...]}（第 1 行随卡，其余逐行）
 question:d=>(d.eyebrow?U(0,esc(d.eyebrow),'ey'):'')+`<div class="q-box">`+d.lines.map((l,i)=>U(i?sOf(l,i):0,hi(l.text||l),'q-line')).join('')+`</div>`,
 // 大数字 + 构成条 {eyebrow,num,dec,unit,label,parts:[{name,val,v}]}
 bignum:d=>(d.eyebrow?U(0,esc(d.eyebrow),'ey'):'')+U(0,num(d.num,d.dec,d.unit),'big','data-fx="count"')+U(0,hi(d.label||''),'big-l')+
   `<div class="bn-bar">`+d.parts.map((p,i)=>{const tot=d.parts.reduce((a,b)=>a+b.v,0);return U(sOf(p,i+1),
   `<div class="bn-seg ${i?'g':'o'}" data-fx="grow"></div><div class="bn-lab"><b>${esc(p.name)}</b><i>${esc(p.val)}</i></div>`,'bn-part',`style="width:${(p.v/tot*100).toFixed(2)}%"`);}).join('')+`</div>`,
 // 分账条：两方怎么分 {title,rows:[{name,left:{name,val,v},right:{name,val,v},verdict}]}
 split:d=>head(d)+d.rows.map((r,i)=>{const p=r.left.v/(r.left.v+r.right.v)*100;return U(sOf(r,i+1),
   `<div class="sp-top"><span>${esc(r.name)}</span><b>${hi(r.verdict||'')}</b></div>
    <div class="sp-bar"><div class="sp-l" data-fx="grow" style="width:${p.toFixed(2)}%"></div><div class="sp-r" style="width:${(100-p).toFixed(2)}%"></div></div>
    <div class="sp-bot"><span>${esc(r.left.name)} ${esc(r.left.val)}</span><span>${esc(r.right.name)} ${esc(r.right.val)}</span></div>`,'sp-row');}).join(''),
 // 双数对比 {title,items:[{label,num,dec,pct}],shift:{from,to,note,s}}
 duo:d=>head(d)+`<div class="cols">`+d.items.map((it,i)=>U(sOf(it,0),`<div class="dl">${esc(it.label)}</div><div class="dn" data-fx="count">${num(it.num,it.dec)}</div>`+
   (it.pct?`<div class="dp">${esc(it.pct)}</div>`:''),'col on')).join('')+`</div>`+
   (d.shift?U(sOf(d.shift,1),`<div class="sh-box"><span>${hi(d.shift.from)}</span><span class="sh-ar">→</span><span>${hi(d.shift.to)}</span></div><div class="sh-note">${hi(d.shift.note||'')}</div>`,'sh'):''),
 // 口径变化 {title,from,to,note}
 shift:d=>head(d)+U(1,`<div class="sh-box"><span>${hi(d.from)}</span><span class="sh-ar">→</span><span>${hi(d.to)}</span></div><div class="sh-note">${hi(d.note||'')}</div>`,'sh'),
 // 柱状对比 + 贴纸 {title,bars:[{label,val,v,hi}],sticker}
 bars:d=>{const mx=Math.max(...d.bars.map(b=>b.v));return head(d)+`<div class="bars">`+d.bars.map((b,i)=>U(sOf(b,i),
   `<div class="bar ${b.hi?'o':'g'}" data-fx="grow" data-dir="y" style="height:${(b.v/mx*440).toFixed(0)}px"><div class="bar-in"><i>${esc(b.label)}</i><b>${esc(b.val)}</b></div></div>`,'bar-w')).join('')+`</div>`+
   (d.sticker?U(sOf(d.sticker,d.bars.length),esc(d.sticker.text||d.sticker),'sticker','data-fx="pop"'):'');},
 // 资金/流程线 {eyebrow,num,dec,unit,label,nodes:[{label,val}],note}
 flow:d=>(d.eyebrow?U(0,esc(d.eyebrow),'ey'):'')+(d.num!=null?U(0,num(d.num,d.dec,d.unit),'big','data-fx="count"'):'')+(d.label?U(0,hi(d.label),'big-l'):'')+
   `<div class="fl">`+U(sOf(d.line,1),'<div class="fl-line" data-fx="grow"></div><div class="fl-ar">▶</div>','fl-lw')+d.nodes.map((n,i)=>U(sOf(n,i+1),
   `<div class="fl-k">${esc(n.label)}</div><div class="fl-v">${esc(n.val)}</div>`,'fl-n',`style="left:${(i/(Math.max(1,d.nodes.length-1))*86).toFixed(1)}%"`)).join('')+`</div>`+
   (d.note?U(sOf(d.note,d.nodes.length+1),`<span>${hi(d.note.k||'')}</span><b>${hi(d.note.v||d.note)}</b>`,'fl-note'):''),
 // 多项图（堆叠柱）{title,legend:[a,b],items:[{name,a,b}],zoom:{s,z,ox},mark:{s,name,label},unit}
 chart:d=>{const mx=Math.max(...d.items.map(x=>x.a+x.b)),n=d.items.length,w=840/n;
   return `<div class="ch-head">`+U(0,hi(d.title),'ti ch-ti')+U(0,`<i class="lg g"></i>${esc(d.legend[0])}<i class="lg o"></i>${esc(d.legend[1])}`,'ch-lg')+`</div>`+
   `<div class="ch-clip"><div class="ch-in" ${d.zoom?`data-zs="${d.zoom.s}" data-z="${d.zoom.z}" style="transform-origin:${d.zoom.ox||'0%'} 100%"`:''}>`+
   d.items.map((x,i)=>`<div class="ch-col" style="left:${(i*w).toFixed(1)}px;width:${w.toFixed(1)}px">`+U(0,
     `<div class="ch-b o" style="height:${(x.b/mx*520).toFixed(1)}px"></div><div class="ch-b g" style="height:${(x.a/mx*520).toFixed(1)}px"></div>`,'ch-stk',`data-fx="grow" data-dir="y" data-delay="${(i*0.025).toFixed(3)}"`)+
     `<div class="ch-n">${esc(x.name)}</div>`+(d.mark&&d.mark.names&&d.mark.names.includes(x.name)?U(d.mark.s,'','ch-mark',`style="height:${((x.a+x.b)/mx*520+16).toFixed(1)}px"`):'')+`</div>`).join('')+
   `</div></div>`+(d.unit?U(0,esc(d.unit),'ch-unit'):'');},
 // 误解卡：划掉旧说法 + 正确机制 {myth,truth,nodes:[{t,s}],sticker}
 myth:d=>U(0,`${hi(d.myth)}<div class="st-line" data-fx="grow" data-s="${sOf(d.strike,1)}"></div>`,'myth')+
   (d.nodes?`<div class="chain">`+d.nodes.map((n,i)=>U(sOf(n,i+2),
   (i?'<div class="arr"></div>':'')+`<div class="node${n.hi?' on':''}"><span>${hi(n.t)}</span><small>${hi(n.n||'')}</small></div>`,'cn')).join('')+`</div>`:'')+
   (d.truth?U(sOf(d.truth,(d.nodes||[]).length+2),hi(d.truth.text||d.truth),'truth'):'')+
   (d.sticker?U(sOf(d.sticker,9),esc(d.sticker.text||d.sticker),'sticker','data-fx="pop"'):''),
 // 因果链 {title,nodes:[{t,n,hi}],sticker}
 chain:d=>head(d)+`<div class="chain">`+d.nodes.map((n,i)=>U(sOf(n,i),(i?'<div class="arr"></div>':'')+
   `<div class="node${n.hi?' on':''}"><span>${hi(n.t)}</span><small>${hi(n.n||'')}</small></div>`,'cn')).join('')+`</div>`+
   (d.sticker?U(sOf(d.sticker,d.nodes.length),esc(d.sticker.text||d.sticker),'sticker','data-fx="pop"'):''),
 // 两端流动 {title,from:{k,v},to:{k,v},dots,tags:[...] ,tagsTitle}
 link:d=>head(d)+`<div class="lk">`+U(0,`<b>${hi(d.from.k)}</b><i>${hi(d.from.v||'')}</i>`,'lk-box')+
   `<div class="lk-mid">`+[...Array(d.dots||5)].map((_,i)=>U(sOf(d.flow,1),'','lk-dot',`data-delay="${(i*0.12).toFixed(2)}"`)).join('')+`</div>`+
   U(sOf(d.flow,1),`<b>${hi(d.to.k)}</b><i>${hi(d.to.v||'')}</i>`,'lk-box o')+`</div>`+
   (d.tagsTitle?U(sOf(d.tagsT,2),hi(d.tagsTitle),'lk-tt'):'')+`<div class="lk-tags">`+(d.tags||[]).map((g,i)=>U(sOf(g,2+(d.tagsTitle?0:0)),hi(g.t||g),'lk-tag')).join('')+`</div>`,
 // 多条线路 {title,from,to,items:[label]}
 routes:d=>head(d)+`<div class="rt-ends">`+U(0,hi(d.from),'rt-from')+U(0,hi(d.to),'rt-to')+`</div>`+d.items.map((r,i)=>U(sOf(r,i+1),
   `<span>${hi(r.t||r)}</span><div class="rt-line" data-fx="grow"></div><div class="rt-dot"></div>`,'rt')).join(''),
 // 左大框 + 右清单 {title,tag,items:[...]}
 list:d=>head(d)+`<div class="ls">`+U(0,hi(d.tag),'ls-tag')+`<div class="ls-items">`+d.items.map((x,i)=>U(sOf(x,i+1),hi(x.t||x),'ls-i')).join('')+`</div></div>`,
 // 收束卡：三栏证据 + 结论框 + 下期 {cols:[{k,v}],box,next}
 close:d=>`<div class="cols c3">`+d.cols.map((c,i)=>U(sOf(c,0),`<div class="ck">${hi(c.k)}</div><div class="cv">${hi(c.v||'')}</div>`,'col')).join('')+`</div>`+
   U(sOf(d.boxS,1),hi(d.box),'cl-box')+(d.next?U(sOf(d.nextS,2),hi(d.next),'cl-next'):''),
 // ===== 深度 v2 新增（2026-11-06）=====
 // 条文卡：法条 / 合同原文，关键词随口播逐个划线 {eyebrow,from(出处一行),parts:["普通",{t:"关键",s:1}],stamp:{text,s}}
 quote:d=>(d.eyebrow?U(0,esc(d.eyebrow),'ey'):'')+(d.from?U(0,esc(d.from),'qt-src'):'')+
   U(0,(d.parts||[]).map(x=>typeof x==='string'?esc(x):`<span class="mk" data-s="${x.s}" data-fx="mark">${esc(x.t)}</span>`).join(''),'qt-body')+
   (d.stamp?U(sOf(d.stamp,9),esc(d.stamp.text||d.stamp),'stamp','data-fx="stamp"'):''),
 // 折线卡：一条线走出趋势 {title,unit,pts:[{x,y}],end:{s,label},from:{label}}（x 只标首尾，y 标首尾值）
 line:d=>{const ys=d.pts.map(p=>p.y),mn=Math.min(...ys),mx=Math.max(...ys),W=860,H=420,n=d.pts.length,pad=(mx-mn||1)*0.12;
   const X=i=>40+i*(W-80)/Math.max(1,n-1),Y=v=>H-30-(v-mn+pad)/(mx-mn+2*pad)*(H-60);
   const pl=d.pts.map((p,i)=>`${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
   return head(d)+U(sOf(d.line,1),`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><line x1="40" y1="${H-30}" x2="${W-40}" y2="${H-30}" stroke="#4a463f" stroke-width="3"/>`+
     `<polyline points="${pl}" fill="none" stroke="#F5A623" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>`+
     d.pts.map((p,i)=>(i===0||i===n-1)?`<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="12" fill="#F5A623"/>`:'').join('')+
     `</svg>`,'ln-svg','data-fx="wipe"')+
   `<div class="ln-lab">`+U(0,`<i>${esc(d.pts[0].x)}</i><b>${esc(d.from?d.from.label:d.pts[0].y)}</b>`,'ln-a')+U(sOf(d.end,2),`<i>${esc(d.pts[n-1].x)}</i><b class="o">${esc(d.end&&d.end.label||d.pts[n-1].y)}</b>`,'ln-b')+`</div>`+
   (d.unit?U(0,esc(d.unit),'ch-unit'):'');},
 // 瀑布卡：一笔账怎么从 A 变成 B（利润桥、估值桥）{title,unit,steps:[{name,v,total}]}（v 正为加、负为减；total:true 表示合计柱，v 为总值）
 waterfall:d=>{let cum=0;const bars=d.steps.map(x=>{const a=x.total?0:cum,b=x.total?x.v:cum+x.v;cum=x.total?x.v:cum+x.v;return {x,lo:Math.min(a,b),hi:Math.max(a,b)}});
   const mx=Math.max(...bars.map(b=>b.hi),1),n=bars.length,w=860/n,H=470;
   return head(d)+`<div class="wf" style="height:${H+110}px">`+bars.map((b,i)=>U(sOf(b.x,i+1),
     `<div class="wf-b ${b.x.total?'t':(b.x.v<0?'d':'u2')}" data-fx="grow" data-dir="y" style="bottom:${(b.lo/mx*H).toFixed(0)}px;height:${Math.max(6,(b.hi-b.lo)/mx*H).toFixed(0)}px"></div>`+
     `<div class="wf-v" style="bottom:${(b.hi/mx*H+10).toFixed(0)}px">${esc((b.x.total?'':(b.x.v>0?'+':''))+b.x.v)}</div><div class="wf-n">${hi(b.x.name)}</div>`,'wf-c',`style="left:${(i*w).toFixed(1)}px;width:${(w-14).toFixed(1)}px"`)).join('')+`</div>`+(d.unit?U(0,esc(d.unit),'ch-unit'):'');},
 // 天平：两边掂量 {title,left:{k,v},right:{k,v},tilt:"left|right",s,verdict}
 balance:d=>head(d)+U(0,`<div class="bl-post"></div><div class="bl-pan l"><b>${hi(d.left.k)}</b><i>${hi(d.left.v||'')}</i></div><div class="bl-pan r"><b>${hi(d.right.k)}</b><i>${hi(d.right.v||'')}</i></div>`+
   `<div class="bl u" data-s="${sOf(d.tiltS,1)}" data-fx="tilt" data-dir="${d.tilt==='left'?-1:1}"><div class="bl-beam"></div></div>`,'bl-w')+
   (d.verdict?U(sOf(d.verdict,2),hi(d.verdict.text||d.verdict),'bl-v'):''),
 // 四象限：把对象摆到坐标里 {title,xl:[低,高],yl:[低,高],quads:[a,b,c,d],dots:[{label,x,y,s,on}]}（x、y 取 0–1；quads 顺序 左上 右上 左下 右下）
 matrix:d=>head(d)+`<div class="mx"><div class="mx-g">`+(d.quads||['','','','']).map((q,i)=>`<div class="mx-q q${i}">${hi(q)}</div>`).join('')+`</div>`+
   `<div class="mx-x"><span>${esc(d.xl[0])}</span><span>${esc(d.xl[1])} →</span></div><div class="mx-y">↑ ${esc(d.yl[1])}　　↓ ${esc(d.yl[0])}</div>`+
   d.dots.map((o,i)=>U(sOf(o,i+1),`<i class="${o.on?'on':''}"></i><span>${hi(o.label)}</span>`,'mx-d',`style="left:${(o.x*100).toFixed(1)}%;top:${((1-o.y)*100).toFixed(1)}%"`)).join('')+`</div>`,
 // 决策清单：看完回去重新想的那几件事（桥接段专用）{title,items:[{t,n}],stamp}
 check:d=>head(d)+`<div class="ck-l">`+d.items.map((x,i)=>U(sOf(x,i+1),
   `<svg class="ck-box" viewBox="0 0 60 60" width="60" height="60"><rect x="4" y="4" width="52" height="52" rx="6" fill="none" stroke="#F5A623" stroke-width="5"/><polyline class="ck-tick" points="14,32 26,44 47,17" fill="none" stroke="#F5A623" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`+
   `<div class="ck-t"><b>${hi(x.t)}</b>${x.n?`<small>${hi(x.n)}</small>`:''}</div>`,'ck-i','data-fx="tick"')).join('')+`</div>`+
   (d.stamp?U(sOf(d.stamp,d.items.length+1),esc(d.stamp.text||d.stamp),'stamp','data-fx="stamp"'):''),
 // ===== 留人套件（深度 v2.2，2026-11-08，lines.json 写 "retain" 才启用；STANDARD_DEEP_V2 §2.7）=====
 // 钩子大字卡：全片第 1 张，0 秒就在屏上，开口那句冲突砸出来 {kicker,lines:["第一行",{t:"第二行",s:1}]}（*词* 橙色）
 //   字符串行随卡依次砸出（每行隔 0.35s）；写成 {t,s} 的行等第 s 个 step 锚点
 hook:d=>{let k=0;const n=Math.max(...(d.lines||[]).map(l=>String(l.t||l).replace(/\*/g,'').length)),fs=Math.min(96,Math.floor(910/n));return `<div class="hk" style="--hf:${fs}px">`+(d.kicker?U(0,esc(d.kicker),'hk-k'):'')+(d.lines||[]).map(l=>typeof l==='string'||l.s==null?U(0,hi(l.t||l),'hk-l',`data-fx="slam" data-delay="${(0.35*k++).toFixed(2)}"`):U(l.s,hi(l.t),'hk-l','data-fx="slam"')).join('')+`</div>`;},
 // 金句卡：结尾那句能截图转发的话 {text,sub,s}（*词* 橙色；下划线随卡长出）
 punch:d=>{const n=Math.max(...String(d.text).replace(/\*/g,'').split('|').map(x=>x.length));return `<div class="pc">`+U(0,'“','pc-q')+U(0,hi(d.text),'pc-t',`data-fx="slam" style="font-size:${Math.min(78,Math.floor(900/n))}px"`)+U(sOf(d.line,1),'<div class="pc-ln" data-fx="grow"></div>','pc-lw')+(d.sub?U(sOf(d.subS,1),hi(d.sub),'pc-s'):'')+`</div>`;},
 // 融合层文字卡（深度 v2.3，需要 lines.json 写 fx）：画在 #fxo 上，见 fx_mist.js
 fxtext:d=>'',
 // 纯文字卡 {eyebrow,title,body:[...]}
 text:d=>head(d)+(d.body||[]).map((b,i)=>U(sOf(b,i+1),hi(b.t||b),'tx')).join(''),
};

// ---------- 实例化 + 逐帧动画 ----------
const CARDS=(window.DATA.cards||[]).map((c,ci)=>{
 const el=document.createElement('div');el.className='card c-'+c.type;el.dataset.id=c.id;
 if(!CARD[c.type]){console.error('unknown card type',c.type);return null;}
 el.innerHTML=CARD[c.type](c.data||{});document.getElementById('cards').appendChild(el);
 const units=[...el.querySelectorAll('[data-s]')].map(u=>({el:u,s:+u.dataset.s,fx:u.dataset.fx||'',dir:u.dataset.dir||'x',delay:+(u.dataset.delay||0),
   cnt:u.querySelector('.cnt'),grow:[...u.querySelectorAll(':scope > [data-fx="grow"], :scope > * > [data-fx="grow"]')].filter(g=>!g.dataset.s)}));
 const zoom=el.querySelector('[data-zs]');
 return {c,el,units,zoom};
}).filter(Boolean);
// 舞台居中（深度 v3，DATA.stage）：卡片内容原来顶对齐，竖屏中段大片空着；量出内容高度后整体下移到内容区的视觉中心（略偏上）
let _STAGED=false;
function stageLayout(){if(_STAGED||!window.DATA.stage)return;_STAGED=true;const z=1.08;document.body.classList.add('stage');
 CARDS.forEach(k=>{const el=k.el;if(k.c.type==='fxtext')return;
  el.style.zoom=z;el.style.left=((1080-920*z)/2/z).toFixed(1)+'px';el.style.top=(400/z).toFixed(1)+'px';
  const vis=el.style.visibility;el.style.visibility='hidden';el.style.display='block';const r0=el.getBoundingClientRect();
  if(['hook','punch'].includes(k.c.type)){const w=el.firstElementChild;if(w){const h=w.getBoundingClientRect().height;w.style.top=(Math.max(0,(910-h)*0.36)/z).toFixed(1)+'px';}}
  else{const kids=[...el.children].filter(e=>getComputedStyle(e).position!=='absolute');
   if(kids.length){const h=Math.max(...kids.map(e=>e.getBoundingClientRect().bottom))-r0.top;const off=Math.max(0,(910-h)*0.42);el.style.top=((400+off)/z).toFixed(1)+'px';}}
  el.style.visibility=vis;});}
function tau(c,s){if(s<=0)return c.t0;const st=c.st||[];return st[s-1]!=null?st[s-1]:c.t0+0.5*s;}
function fmtNum(v,dec){return dec>0?v.toFixed(dec):Math.round(v).toLocaleString('en-US').replace(/,/g,'');}
function renderCards(t){
 stageLayout();let src='',srcA=0;
 CARDS.forEach(k=>{const c=k.c;
  if(t<c.t0-0.01||t>c.t1+0.01){k.el.style.visibility='hidden';k.el.style.opacity=0;return;}
  const pin=c.first?1:eo(cl((t-c.t0)/0.4)),pout=c.last?1:1-cl((t-(c.t1-0.2))/0.2),a=Math.min(pin,pout);
  k.el.style.visibility=a>0?'visible':'hidden';k.el.style.opacity=a.toFixed(3);k.el.style.transform=`translateY(${(24*(1-pin)).toFixed(1)}px)`;
  if(c.data&&c.data.src){src=c.data.src;srcA=a;}
  k.units.forEach(u=>{const T0=tau(c,u.s)+u.delay+(u.s===0&&!c.first?0.08:0);const p=eo(cl((t-T0)/0.35)),pg=eo(cl((t-T0)/0.6));
   if(u.fx==='wipe'){const q=io(cl((t-T0)/1.2));u.el.style.opacity=t>=T0?1:0;u.el.style.clipPath=`inset(0 ${((1-q)*100).toFixed(2)}% 0 0)`;}
   else if(u.fx==='mark'){u.el.style.setProperty('--m',eo(cl((t-T0)/0.45)).toFixed(3));}
   else if(u.fx==='tilt'){const q=eo(cl((t-T0)/0.9));u.el.parentElement.style.setProperty('--k',(q*(+u.el.dataset.dir)).toFixed(4));u.el.style.opacity=1;}
   else if(u.fx==='slam'){const q=cl((t-T0)/0.18);u.el.style.opacity=q.toFixed(3);u.el.style.transform=`scale(${(1+0.28*(1-eo(q))).toFixed(4)})`;}
   else if(u.fx==='stamp'){const q=cl((t-T0)/0.2);u.el.style.opacity=q.toFixed(3);u.el.style.setProperty('--k',(1+1.3*(1-eo(q))).toFixed(3));}
   else if(u.fx==='tick'){u.el.style.opacity=eo(cl((t-T0)/0.3)).toFixed(3);u.el.style.setProperty('--tk',eo(cl((t-T0-0.15)/0.35)).toFixed(3));}
   else if(u.fx==='grow'){u.el.style.opacity=t>=T0?1:0;u.el.style.transform=u.dir==='y'?`scaleY(${pg.toFixed(4)})`:`scaleX(${pg.toFixed(4)})`;}
   else if(u.fx==='pop'){const q=cl((t-T0)/0.25);u.el.style.opacity=q.toFixed(3);u.el.style.setProperty('--k',(1.45-0.45*eo(q)).toFixed(3));}
   else{u.el.style.opacity=p.toFixed(3);u.el.style.transform=u.s===0&&!u.cnt?'':`translateY(${(14*(1-p)).toFixed(1)}px)`;}
   if(u.cnt){const to=+u.cnt.dataset.to,dec=+u.cnt.dataset.dec,q=eo(cl((t-T0)/0.6));u.cnt.textContent=fmtNum(to*q,dec);}
   u.grow.forEach(g=>{g.style.transform=g.dataset.dir==='y'?`scaleY(${pg.toFixed(4)})`:`scaleX(${pg.toFixed(4)})`;});});
  if(k.zoom){const T0=tau(c,+k.zoom.dataset.zs),z=+k.zoom.dataset.z,q=io(cl((t-T0)/1.3));k.zoom.style.transform=`scale(${(1+(z-1)*q).toFixed(4)})`;}
 });
 const se=document.getElementById('src');if(se.dataset.v!==src){se.dataset.v=src;se.textContent=src;}se.style.opacity=srcA.toFixed(3);
}
