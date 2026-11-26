// =====================================================================
// 老杨魔方 · 深度 v10「具象场景与视觉隐喻引擎」（cards_vivid.js）
// 4 大具象视觉舞台，把抽象商业/宏观逻辑变成「听什么就看见什么」的动态画面：
//   1. ticker   金融行情剧变终端（实时发光分时/K线、红区熔断暴跌、绿区暴力V型拉升、成交量柱、跳动市值）
//   2. social   社媒 / 官宣 / 快讯拟真卡（认证徽章、引用官宣原文、荧光笔划重点、转发/热议实时跳动）
//   3. metaphor 物理动态隐喻舞台（6 种内置高质感 2.5D 场景：pipe 管道阀门 / squeeze 液压挤压 /
//               reservoir 蓄水池水位 / gears 精密齿轮 / domino 多米诺连锁 / chip 算力芯片脉冲）
//   4. actors   棋盘博弈群像卡（多方阵营棋子、力量对抗粒子流、筹码倾斜、动态立场气泡）
// 全部纯函数：每帧由 CARD_RENDER[type](k,t) 按时间计算，零外部素材、零版权风险、支持并行渲染。
// =====================================================================
(function(){
const _vEO=x=>1-Math.pow(1-cl(x),3);
const _vIO=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const _vBO=x=>{const u=cl(x)-1;return 1+2.2*u*u*u+1.2*u*u;};
const _vLerp=(a,b,p)=>a+(b-a)*p;
const _vFmt=(n,dec=0)=>dec>0?n.toFixed(dec):Math.round(n).toLocaleString('en-US');

// ==================== 1. ticker 金融行情剧变终端 ====================
// data: {eyebrow, title, symbol:"NVDA · 英伟达", unit:"美元",
//        pts:[{x:"11-11", y:165, s:0}, {x:"11-12", y:125, s:1, tag:"-6000亿美元", tone:"bad", note:"股价跌至$125"},
//             {x:"11-23", y:168, s:3, tag:"+9500亿美元", tone:"good", note:"单日收涨+31%"}],
//        verdict:{t:"市场用真金白银投票", s:4}}
function _tkHtml(d){
 return head(d)+`<div class="vv-box vv-tk">`+
  `<div class="tk-bar"><div class="tk-sym"><i class="tk-dot"></i><b>${esc(d.symbol||'MARKET')}</b><span>${esc(d.sub||'LIVE TERMINAL')}</span></div>`+
  `<div class="tk-read"><span class="tk-val">--</span><span class="tk-chg">--</span></div></div>`+
  `<canvas class="tk-cv" width="872" height="450"></canvas>`+
  `</div>`+(d.verdict?U(sOf(d.verdict,9),hi(d.verdict.t||d.verdict),'vv-vd'):'');
}
function _tkFrame(k,t){
 const c=k.c,d=c.data||{},el=k.el;
 const cv=el.querySelector('.tk-cv');if(!cv)return;
 const valEl=el.querySelector('.tk-val'),chgEl=el.querySelector('.tk-chg');
 const X=cv.getContext('2d'),W=cv.width,H=cv.height;
 X.clearRect(0,0,W,H);

 const pts=d.pts||[];if(pts.length<2)return;
 const ys=pts.map(p=>p.y),mn=Math.min(...ys),mx=Math.max(...ys),pad=(mx-mn||1)*0.22;
 const yLo=mn-pad,yHi=mx+pad;
 const L=52,R=W-44,T=48,B=H-92,CW=R-L,CH=B-T;
 const px=i=>L+i/(pts.length-1)*CW;
 const py=v=>B-(v-yLo)/(yHi-yLo)*CH;

 // 1. 终端深色网格 + 虚线参考线
 X.save();
 X.strokeStyle='rgba(244,241,234,0.08)';X.lineWidth=1.5;
 for(let i=0;i<=4;i++){const y=T+i*CH/4;X.beginPath();X.moveTo(L,y);X.lineTo(R,y);X.stroke();}
 for(let i=0;i<pts.length;i++){const x=px(i);X.beginPath();X.moveTo(x,T);X.lineTo(x,B);X.stroke();}
 // 基准虚线（起点价格）
 const yBase=py(pts[0].y);
 X.setLineDash([8,8]);X.strokeStyle='rgba(245,166,35,0.35)';X.lineWidth=2;
 X.beginPath();X.moveTo(L,yBase);X.lineTo(R,yBase);X.stroke();X.setLineDash([]);
 X.restore();

 // 2. 根据 step 算当前曲线推进到哪一段（0 .. pts.length-1）
 let prog=0;
 for(let i=1;i<pts.length;i++){
  const s=pts[i].s!=null?pts[i].s:i;
  const ts=tau(c,s),dur=0.85;
  const u=_vIO(cl((t-ts)/dur));
  if(t>=ts)prog=Math.max(prog,(i-1)+u);
 }
 // 开头即使还没到 step 1 也先画出起点到第一小段微脉冲
 const baseU=_vEO(cl((t-c.t0)/0.5));
 prog=Math.max(prog,Math.min(0.15,0.15*baseU));

 // 3. 生成插值微波动路径（模拟真实分时/K线毛刺感，纯确定性）
 const NSEG=96,curIdx=Math.min(pts.length-1,prog);
 const maxStep=Math.max(1,Math.floor(curIdx/(pts.length-1)*NSEG));
 const curve=[];
 for(let j=0;j<=maxStep;j++){
  const u=j/NSEG*(pts.length-1);
  const i0=Math.min(pts.length-2,Math.floor(u)),f=u-i0;
  const y0=pts[i0].y,y1=pts[i0+1].y;
  // 端点精确命中，中间加确定性金融分时微震
  const jitter=Math.sin(j*1.7+i0*3.1)*Math.sin(f*Math.PI)*(mx-mn)*0.045;
  const yv=_vLerp(y0,y1,_vIO(f))+jitter;
  const tone=pts[i0+1].tone||(y1<y0?'bad':'good');
  curve.push({x:L+u/(pts.length-1)*CW,y:py(yv),yv,tone,i0});
 }

 // 4. 底部脉冲成交量柱
 X.save();
 for(let j=0;j<curve.length;j+=2){
  const pt=curve[j],prev=curve[Math.max(0,j-2)];
  const delta=Math.abs(pt.yv-prev.yv)/(mx-mn||1);
  const vh=10+Math.min(54,delta*280+rnd(j*5.3)*14);
  X.fillStyle=pt.tone==='bad'?'rgba(255,90,78,0.45)':'rgba(60,240,122,0.45)';
  X.fillRect(pt.x-4,B+60-vh,8,vh);
 }
 X.restore();

 // 5. 分段绘制发光折线 + 渐变面积填充（红跌 / 绿涨）
 for(let j=1;j<curve.length;j++){
  const a=curve[j-1],b=curve[j],isBad=b.tone==='bad';
  const col=isBad?'#FF5A4E':'#3CF07A',rgb=isBad?'255,90,78':'60,240,122';
  // 面积填充
  const g=X.createLinearGradient(0,Math.min(a.y,b.y),0,B);
  g.addColorStop(0,`rgba(${rgb},0.34)`);g.addColorStop(1,`rgba(${rgb},0.0)`);
  X.fillStyle=g;X.beginPath();X.moveTo(a.x,a.y);X.lineTo(b.x,b.y);X.lineTo(b.x,B);X.lineTo(a.x,B);X.closePath();X.fill();
  // 外辉光 + 主发光线
  X.save();X.lineCap='round';
  X.strokeStyle=`rgba(${rgb},0.28)`;X.lineWidth=14;X.beginPath();X.moveTo(a.x,a.y);X.lineTo(b.x,b.y);X.stroke();
  X.strokeStyle=col;X.lineWidth=5.5;X.beginPath();X.moveTo(a.x,a.y);X.lineTo(b.x,b.y);X.stroke();
  X.restore();
 }

 // 6. 末端高亮光标点
 const last=curve[curve.length-1];
 if(last){
  const isBad=last.tone==='bad',rgb=isBad?'255,90,78':'60,240,122';
  const rP=12+6*Math.sin(t*10);
  X.save();X.globalCompositeOperation='lighter';
  X.fillStyle=`rgba(${rgb},0.35)`;X.beginPath();X.arc(last.x,last.y,rP,0,6.283);X.fill();
  X.fillStyle='#fff';X.beginPath();X.arc(last.x,last.y,6.5,0,6.283);X.fill();
  X.restore();
  // 更新顶部实时读数
  if(valEl){
   const pre=d.prefix||'$',unit=d.unit||'';
   valEl.textContent=pre+_vFmt(last.yv,d.dec||0)+unit;
   const pct=((last.yv-pts[0].y)/Math.max(1,pts[0].y)*100);
   chgEl.textContent=(pct>=0?'+':'')+pct.toFixed(1)+'%';
   chgEl.className='tk-chg '+(pct<0?'bad':'good');
  }
 }

 // 7. 关键拐点标注胶囊（自动防裁切，带弹性弹入）
 X.save();X.font='900 24px "NSC",sans-serif';X.textAlign='center';
 pts.forEach((p,i)=>{
  // X 轴日期刻度
  X.fillStyle='rgba(200,195,186,0.75)';X.font='700 22px "NSC",sans-serif';
  X.fillText(p.x||'',px(i),H-10);
  if(!p.tag&&!p.note)return;
  const s=p.s!=null?p.s:i,ts=tau(c,s)+0.45;
  const q=_vBO(cl((t-ts)/0.35));if(t<ts)return;
  const cx=Math.max(150,Math.min(W-150,px(i))),cy=py(p.y);
  const isBad=p.tone==='bad',col=isBad?'#FF5A4E':'#3CF07A';
  const above=cy>T+125;
  const by=above?cy-66:cy+58;
  X.save();X.translate(cx,by);X.scale(q,q);
  const txt=p.tag||'',sub=p.note||'';
  X.font='900 28px "NSC",sans-serif';
  const tw=Math.max(X.measureText(txt).width,sub?X.measureText(sub).width*0.78:0)+36;
  const bh=sub?74:46;
  X.fillStyle='rgba(10,12,16,0.92)';X.strokeStyle=col;X.lineWidth=3;
  X.beginPath();X.roundRect(-tw/2,-bh/2,tw,bh,10);X.fill();X.stroke();
  X.fillStyle=col;X.fillText(txt,0,sub?-6:10);
  if(sub){X.font='700 21px "NSC",sans-serif';X.fillStyle='#E6E1D7';X.fillText(sub,0,22);}
  X.restore();
  // 连接点
  X.fillStyle=col;X.beginPath();X.arc(px(i),cy,8,0,6.283);X.fill();
 });
 X.restore();
}

// ==================== 2. social 社媒 / 官宣 / 快讯拟真卡 ====================
// data: {eyebrow, author:"Elon Musk", handle:"@elonmusk", avatar:"M", badge:"官宣转发", time:"2026-11-23",
//        quote:{author:"NVIDIA 官方声明", text:"董事会全票通过，正式邀请黄仁勋重返 CEO 岗位"},
//        text:"马斯克转发，只说了一句：", highlight:{t:"错误已更正。", s:1},
//        stats:[{k:"转发", to:128000, unit:"+"}, {k:"热议", to:450000, unit:"+"}],
//        foot:{t:"一句话背后，是硅谷的共识", s:2}}
function _soHtml(d){
 const av=esc(d.avatar||(d.author||'N')[0]);
 return (d.eyebrow?U(0,esc(d.eyebrow),'ey'):'')+
  `<div class="vv-box vv-so">`+
   `<div class="so-hd"><div class="so-av">${av}</div><div class="so-id"><b>${esc(d.author||'官方发布')}<i class="so-v">✓</i></b><span>${esc(d.handle||'')} · ${esc(d.time||'')}</span></div>`+
   (d.badge?`<div class="so-bdg">${esc(d.badge)}</div>`:'')+`</div>`+
   (d.text?U(0,hi(d.text),'so-tx'):'')+
   (d.highlight?U(sOf(d.highlight,1),`<span class="so-hi" data-s="${sOf(d.highlight,1)}" data-fx="mark">${hi(d.highlight.t||d.highlight)}</span>`,'so-big','data-fx="slam"'):'')+
   (d.quote?U(sOf(d.quote,0),`<div class="so-qt"><b>${esc(d.quote.author||'原帖')}</b><p>${hi(d.quote.text||'')}</p></div>`,'so-qtw'):'')+
   (d.stats?`<div class="so-st">`+d.stats.map((st,i)=>`<div class="so-si"><span>${esc(st.k)}</span><b class="so-cnt" data-to="${st.to||0}" data-unit="${esc(st.unit||'')}" data-s="${sOf(st,1)}">0</b></div>`).join('')+`</div>`:'')+
  `</div>`+
  (d.foot?U(sOf(d.foot,2),hi(d.foot.t||d.foot),'vv-vd'):'');
}
function _soFrame(k,t){
 const c=k.c,el=k.el;
 el.querySelectorAll('.so-cnt').forEach(b=>{
  const s=+(b.dataset.s||1),ts=tau(c,s),to=+(b.dataset.to||0),unit=b.dataset.unit||'';
  const q=_vEO(cl((t-ts)/1.1));
  const live=to>100&&t>ts+1.1?Math.floor((t-ts-1.1)*to*0.012):0;   // 保持热搜实时递增的活感
  const val=to*q+live;
  b.textContent=(val>=10000?(val/10000).toFixed(1)+'万':_vFmt(val,0))+unit;
 });
}

// ==================== 3. metaphor 物理动态隐喻舞台（6 大场景） ====================
// data: {eyebrow, title, scene:"pipe|squeeze|reservoir|gears|domino|chip",
//        labels:[...], stages:[{s, state, note}], verdict:{t, s}}
function _mpHtml(d){
 return head(d)+`<div class="vv-box vv-mp"><canvas class="mp-cv" width="872" height="500"></canvas><div class="mp-cap"></div></div>`+
  (d.verdict?U(sOf(d.verdict,9),hi(d.verdict.t||d.verdict),'vv-vd'):'');
}

function _mpPipe(X,W,H,t,st,d){
 // 发光工业管道 + 能量粒子流 + 中央机械阀门（normal -> choke 堵住变红 -> burst 扩容爆发）
 const cy=H*0.50,r=68,vx=W*0.52;
 const choke=st.state==='choke'?1:0, surge=st.state==='surge'?1:0;
 const fCol=choke?'#FF5A4E':(surge?'#3CF07A':'#F5A623');
 const fRGB=choke?'255,90,78':(surge?'60,240,122':'245,166,35');
 // 背景科技格栅
 X.strokeStyle='rgba(244,241,234,0.06)';X.lineWidth=1;
 for(let x=40;x<W;x+=56){X.beginPath();X.moveTo(x,30);X.lineTo(x,H-30);X.stroke();}
 for(let y=40;y<H;y+=56){X.beginPath();X.moveTo(30,y);X.lineTo(W-30,y);X.stroke();}
 // 管道外壁（金属渐变）
 const pg=X.createLinearGradient(0,cy-r,0,cy+r);
 pg.addColorStop(0,'#2b2d34');pg.addColorStop(0.25,'#4a4d57');pg.addColorStop(0.55,'#15171c');pg.addColorStop(1,'#282a30');
 X.fillStyle=pg;X.strokeStyle=`rgba(${fRGB},0.65)`;X.lineWidth=3.5;
 X.beginPath();X.roundRect(44,cy-r,W-88,r*2,16);X.fill();X.stroke();
 // 管道内腔暗槽
 X.fillStyle='#090a0d';X.beginPath();X.roundRect(54,cy-r+16,W-108,(r-16)*2,10);X.fill();
 // 流动能量粒子流
 X.save();X.beginPath();X.roundRect(54,cy-r+16,W-108,(r-16)*2,10);X.clip();
 X.globalCompositeOperation='lighter';
 const spd=choke?95:(surge?440:260);
 for(let i=0;i<70;i++){
  const r0=rnd(i*7.1+1),r1=rnd(i*13.3+2);
  let px=((r0*(W-108)+t*spd*(0.7+0.6*r1))%(W-108))+54;
  if(choke&&px>vx-30){px=54+((px-54)*0.48);} // 阀门堵住时粒子在左侧高压堆积
  const py=cy+(r1-0.5)*(r-24)*1.75;
  const len=choke?14:(surge?42:26);
  const g=X.createLinearGradient(px-len,py,px+6,py);
  g.addColorStop(0,`rgba(${fRGB},0)`);g.addColorStop(1,`rgba(${fRGB},0.92)`);
  X.strokeStyle=g;X.lineWidth=3+r0*4;X.lineCap='round';
  X.beginPath();X.moveTo(px-len,py);X.lineTo(px,py);X.stroke();
 }
 X.restore();
 // 法兰接头环
 for(const fx of [180,W-180]){
  X.fillStyle='#353842';X.strokeStyle='rgba(244,241,234,0.35)';X.lineWidth=2;
  X.fillRect(fx-14,cy-r-12,28,r*2+24);X.strokeRect(fx-14,cy-r-12,28,r*2+24);
 }
 // 中央机械阀门（旋转手轮 + 压力光环）
 X.save();X.translate(vx,cy);
 const vGlow=X.createRadialGradient(0,0,10,0,0,120);
 vGlow.addColorStop(0,`rgba(${fRGB},0.35)`);vGlow.addColorStop(1,'rgba(0,0,0,0)');
 X.fillStyle=vGlow;X.beginPath();X.arc(0,0,120,0,6.283);X.fill();
 X.rotate(t*(choke?0.4:(surge?3.2:1.5)));
 X.strokeStyle=fCol;X.lineWidth=10;X.beginPath();X.arc(0,0,52,0,6.283);X.stroke();
 for(let i=0;i<4;i++){X.rotate(Math.PI/2);X.beginPath();X.moveTo(-48,0);X.lineTo(48,0);X.stroke();}
 X.fillStyle='#111';X.beginPath();X.arc(0,0,18,0,6.283);X.fill();X.stroke();
 X.restore();
 // 两侧标签（如：算力输入 / 核心阀门 / AI 爆发输出）
 const L=(d.labels||['上游供给','核心阀门','终端输出']);
 X.font='900 28px "NSC",sans-serif';X.textAlign='center';
 X.fillStyle='#E6E1D7';X.fillText(L[0]||'',130,cy-r-34);
 X.fillStyle=fCol;X.fillText(L[1]||'',vx,cy-r-46);
 X.fillStyle='#E6E1D7';X.fillText(L[2]||'',W-130,cy-r-34);
 // 底部状态压力条
 const pPct=choke?0.92:(surge?0.88:0.52+0.08*Math.sin(t*3));
 X.fillStyle='rgba(244,241,234,0.12)';X.fillRect(140,H-64,W-280,14);
 X.fillStyle=fCol;X.fillRect(140,H-64,(W-280)*pPct,14);
 X.font='700 22px "NSC",sans-serif';X.fillStyle=fCol;
 X.fillText(st.note||(choke?'⚠ 阀门卡死 · 流量受阻':(surge?'⚡ 全速扩容 · 能量爆发':'● 稳定输送中')),W/2,H-82);
}

function _mpSqueeze(X,W,H,t,st,d){
 // 双面重型液压板向中间挤压（带持续警示斜纹流动 + 受压迸发火星 + 压力表呼吸）
 const lv=window._LV||0;
 const baseP=st.p!=null?st.p:(st.state==='crush'?0.88:0.35);
 const p=cl(baseP+Math.sin(t*3.2)*0.03+lv*0.03);
 const cy=H*0.5,gap=_vLerp(150,52,p);
 const col=p>0.65?'#FF5A4E':'#F5A623',rgb=p>0.65?'255,90,78':'245,166,35';
 // 上下液压柱
 X.fillStyle='#2a2d34';X.fillRect(W/2-44,0,88,cy-gap-36);X.fillRect(W/2-44,cy+gap+36,88,H-(cy+gap+36));
 // 上下重型压板 + 流动警示斜纹
 for(const dir of [-1,1]){
  const y=dir<0?cy-gap-42:cy+gap;
  X.save();X.beginPath();X.rect(120,y,W-240,42);X.clip();
  X.fillStyle='#1b1d22';X.fillRect(120,y,W-240,42);
  X.strokeStyle=`rgba(${rgb},0.35)`;X.lineWidth=14;
  const off=(t*55*dir)%48;
  for(let sx=80+off;sx<W-80;sx+=48){X.beginPath();X.moveTo(sx,y-8);X.lineTo(sx+26,y+50);X.stroke();}
  X.restore();
  X.strokeStyle=col;X.lineWidth=3;X.strokeRect(120,y,W-240,42);
 }
 // 被挤压的中间核心块 + 迸发压力火星
 const bh=Math.max(48,gap*1.6),bw=360+p*110;
 const sh=p>0.55?Math.sin(t*48)*(2+3*p):0;
 X.save();X.translate(W/2+sh,cy);
 const g=X.createRadialGradient(0,0,10,0,0,220+40*lv);
 g.addColorStop(0,`rgba(${rgb},${(0.38+0.22*lv).toFixed(3)})`);g.addColorStop(1,'rgba(0,0,0,0)');
 X.fillStyle=g;X.beginPath();X.arc(0,0,220+40*lv,0,6.283);X.fill();
 X.fillStyle=`rgba(${rgb},0.22)`;X.strokeStyle=col;X.lineWidth=4;
 X.beginPath();X.roundRect(-bw/2,-bh/2,bw,bh,12);X.fill();X.stroke();
 X.font='900 34px "NSC",sans-serif';X.fillStyle='#fff';X.textAlign='center';
 X.fillText((d.labels&&d.labels[1])||'中下游利润空间',0,12);
 // 两侧持续迸发火星粒子
 X.globalCompositeOperation='lighter';
 for(let i=0;i<24;i++){
  const side=i%2===0?1:-1,u=((t*(1.4+rnd(i*3.1))+rnd(i*7.7))%1);
  const px=side*(bw/2+u*150),py=(rnd(i*5.3)-0.5)*bh*0.9+(u*u*36*(i%3-1));
  X.fillStyle=`rgba(${rgb},${((1-u)*0.85).toFixed(3)})`;
  X.beginPath();X.arc(px,py,2.2+rnd(i*9.1)*2.5,0,6.283);X.fill();
 }
 X.restore();
 // 上下压力标签
 X.font='900 28px "NSC",sans-serif';X.textAlign='center';X.fillStyle='#FF8A70';
 X.fillText('▼ '+((d.labels&&d.labels[0])||'上游成本上涨'),W/2,Math.max(46,cy-gap-58));
 X.fillText('▲ '+((d.labels&&d.labels[2])||'下游需求收缩'),W/2,Math.min(H-22,cy+gap+78));
}

function _mpReservoir(X,W,H,t,st,d){
 // 动态蓄水池：进水管 + 波动液面 + 底部漏水 + 警戒线
 const lvl=st.p!=null?st.p:(st.state==='low'?0.28:(st.state==='high'?0.82:0.55));
 const tx=150,ty=110,tw=W-300,th=300;
 const col=lvl<0.35?'#FF5A4E':(lvl>0.75?'#3CF07A':'#F5A623');
 const rgb=lvl<0.35?'255,90,78':(lvl>0.75?'60,240,122':'245,166,35');
 // 水池液面
 const wy=ty+th*(1-lvl);
 X.save();X.beginPath();X.rect(tx,ty,tw,th);X.clip();
 X.beginPath();X.moveTo(tx,ty+th);
 for(let x=0;x<=tw;x+=16){X.lineTo(tx+x,wy+Math.sin(t*3.8+x*0.03)*8);}
 X.lineTo(tx+tw,ty+th);X.closePath();
 const wg=X.createLinearGradient(0,wy,0,ty+th);
 wg.addColorStop(0,`rgba(${rgb},0.65)`);wg.addColorStop(1,`rgba(${rgb},0.15)`);
 X.fillStyle=wg;X.fill();
 X.strokeStyle=col;X.lineWidth=4;X.stroke();
 X.restore();
 // 容器边框
 X.strokeStyle='rgba(244,241,234,0.55)';X.lineWidth=4;X.strokeRect(tx,ty,tw,th);
 // 警戒线
 const warnY=ty+th*0.68;
 X.save();X.setLineDash([10,8]);X.strokeStyle='#FF5A4E';X.lineWidth=2.5;
 X.beginPath();X.moveTo(tx-20,warnY);X.lineTo(tx+tw+20,warnY);X.stroke();X.restore();
 // 顶部注水 / 底部排水标签
 X.font='900 28px "NSC",sans-serif';X.textAlign='center';
 X.fillStyle='#3CF07A';X.fillText('↓ '+((d.labels&&d.labels[0])||'资金流入'),W/2,68);
 X.fillStyle='#FF8A70';X.fillText('↓ '+((d.labels&&d.labels[2])||'持续流出'),W/2,H-30);
 X.font='900 58px "NSC",sans-serif';X.fillStyle='#fff';X.fillText(Math.round(lvl*100)+'%',W/2,ty+th/2+20);
}

function _mpGears(X,W,H,t,st,d){
 // 三组精密金属齿轮咬合（可卡死报警）
 const jam=st.state==='jam',spd=jam?0.05:(st.state==='fast'?2.4:1.1);
 const drawGear=(cx,cy,R,teeth,ang,col)=>{
  X.save();X.translate(cx,cy);X.rotate(ang);
  X.fillStyle='rgba(20,22,28,0.92)';X.strokeStyle=col;X.lineWidth=4;
  X.beginPath();
  for(let i=0;i<teeth*2;i++){
   const a=i*Math.PI/teeth,rad=i%2===0?R+14:R-4;
   if(i===0)X.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);else X.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);
  }
  X.closePath();X.fill();X.stroke();
  X.beginPath();X.arc(0,0,R*0.42,0,6.283);X.stroke();
  X.restore();
 };
 const a=t*spd+(jam?Math.sin(t*40)*0.04:0);
 drawGear(W*0.32,H*0.46,96,12,a,'#F5A623');
 drawGear(W*0.56,H*0.56,74,9,-a*12/9+0.3,jam?'#FF5A4E':'#3CF07A');
 drawGear(W*0.74,H*0.38,60,8,a*12/8,'#4FD1C5');
 const L=d.labels||['核心引擎','传导齿轮','终端放大'];
 X.font='900 26px "NSC",sans-serif';X.textAlign='center';X.fillStyle='#F4F1EA';
 X.fillText(L[0]||'',W*0.32,H*0.46+10);X.fillText(L[1]||'',W*0.56,H*0.56+10);X.fillText(L[2]||'',W*0.74,H*0.38+10);
}

function _mpDomino(X,W,H,t,st,d){
 // 多米诺骨牌连锁倒塌（带持续传导冲击波 + 碎光粒子）
 const n=Math.max(4,(d.labels||[]).length||5),p=st.p!=null?st.p:cl(t*0.25);
 const baseY=H*0.74;
 X.strokeStyle='rgba(244,241,234,0.22)';X.lineWidth=3;X.beginPath();X.moveTo(60,baseY);X.lineTo(W-60,baseY);X.stroke();
 // 底部能量传导扫描波
 const waveX=100+((t*240)%(W-200));
 const wg=X.createLinearGradient(waveX-90,0,waveX+20,0);
 wg.addColorStop(0,'rgba(255,90,78,0)');wg.addColorStop(1,'rgba(255,90,78,0.8)');
 X.strokeStyle=wg;X.lineWidth=5;X.beginPath();X.moveTo(waveX-90,baseY);X.lineTo(waveX,baseY);X.stroke();
 for(let i=0;i<n;i++){
  const x=120+i*(W-240)/(n-1);
  const fall=cl((p*n-i)*1.3);
  const ang=_vEO(fall)*1.18+(fall>0.1?Math.sin(t*5+i)*0.02:Math.sin(t*2.5+i)*0.015);
  const col=fall>0.1?'#FF5A4E':'#F5A623';
  if(fall>0.2){
   const r=(18+((t*42+i*19)%55));
   X.strokeStyle=`rgba(255,90,78,${(0.45*(1-r/75)).toFixed(3)})`;X.lineWidth=2.5;
   X.beginPath();X.ellipse(x+50,baseY,r,r*0.28,0,0,6.283);X.stroke();
  }
  X.save();X.translate(x,baseY);X.rotate(ang);
  X.fillStyle=fall>0.1?'rgba(255,90,78,0.24)':'rgba(245,166,35,0.16)';X.strokeStyle=col;X.lineWidth=3.5;
  X.beginPath();X.roundRect(-22,-180,44,180,8);X.fill();X.stroke();
  X.restore();
  X.font='900 24px "NSC",sans-serif';X.textAlign='center';X.fillStyle=fall>0.1?'#FF8A70':'#E6E1D7';
  X.fillText((d.labels&&d.labels[i])||`第${i+1}环`,x,baseY+44);
 }
}

function _mpChip(X,W,H,t,st,d){
 // 算力芯片主板 + 多层高速光脉冲 + 旋转雷达环 + 核心扫描线
 const cx=W/2,cy=H/2,sz=196,lv=window._LV||0;
 const spd=st.state==='surge'?1.55:0.95;
 X.save();
 // 旋转双层 HUD 算力扫描环
 X.save();X.translate(cx,cy);
 for(const [r,rs,dash,col] of [[175,t*0.65,[24,14],'rgba(245,166,35,0.34)'],[215,-t*0.42,[10,14],'rgba(60,240,122,0.28)']]){
  X.save();X.rotate(rs);X.setLineDash(dash);X.strokeStyle=col;X.lineWidth=2.5;
  X.beginPath();X.arc(0,0,r,0,6.283);X.stroke();X.restore();
 }
 X.restore();
 // 纵横电路轨迹 + 双向高速数据脉冲包
 X.strokeStyle='rgba(245,166,35,0.22)';X.lineWidth=2.5;
 for(let i=-4;i<=4;i++){
  const o=i*38;
  X.beginPath();X.moveTo(48,cy+o);X.lineTo(W-48,cy+o);X.stroke();
  X.beginPath();X.moveTo(cx+o,28);X.lineTo(cx+o,H-28);X.stroke();
  const u1=((t*spd+i*0.19)%1+1)%1,u2=1-((t*spd*0.8+i*0.23)%1+1)%1;
  X.fillStyle=i%2===0?'#F5A623':'#3CF07A';
  X.beginPath();X.arc(48+u1*(W-96),cy+o,5.5+lv*2.5,0,6.283);X.fill();
  X.fillStyle=i%2===0?'#4FD1C5':'#F5A623';
  X.beginPath();X.arc(cx+o,28+u2*(H-56),4.5+lv*2,0,6.283);X.fill();
 }
 // 芯片核心块 + 声画呼吸光晕 + 内部矩阵扫描线
 const cg=X.createRadialGradient(cx,cy,20,cx,cy,175);
 cg.addColorStop(0,`rgba(245,166,35,${(0.24+0.22*lv).toFixed(3)})`);cg.addColorStop(1,'rgba(0,0,0,0)');
 X.fillStyle=cg;X.beginPath();X.arc(cx,cy,175,0,6.283);X.fill();
 X.fillStyle='#101218';X.strokeStyle='#F5A623';X.lineWidth=5;
 X.beginPath();X.roundRect(cx-sz/2,cy-sz/2,sz,sz,18);X.fill();X.stroke();
 // 内部动态亮起的 4x4 算力单元网格
 for(let gx=0;gx<4;gx++)for(let gy=0;gy<4;gy++){
  const pulse=0.12+0.32*(0.5+0.5*Math.sin(t*4.2+gx*1.3+gy*2.1));
  X.fillStyle=`rgba(245,166,35,${pulse.toFixed(3)})`;
  X.fillRect(cx-sz/2+24+gx*38,cy-sz/2+24+gy*38,32,32);
 }
 // 核心扫描光条
 const scanY=cy-sz/2+16+((t*110)%(sz-32));
 X.fillStyle='rgba(60,240,122,0.55)';X.fillRect(cx-sz/2+14,scanY,sz-28,4);
 X.font='900 36px "NSC",sans-serif';X.textAlign='center';X.fillStyle='#fff';
 X.shadowColor='#000';X.shadowBlur=12;
 X.fillText((d.labels&&d.labels[0])||'AI 算力核',cx,cy+12);
 X.restore();
}

function _mpFrame(k,t){
 const c=k.c,d=c.data||{},cv=k.el.querySelector('.mp-cv');if(!cv)return;
 const X=cv.getContext('2d'),W=cv.width,H=cv.height;
 X.clearRect(0,0,W,H);
 // 计算当前处于哪个 stage
 const stages=d.stages||[{s:0,state:'normal'}];
 let cur=stages[0];
 for(const sg of stages){if(t>=tau(c,sg.s||0))cur=sg;}
 const sc=d.scene||'pipe';
 if(sc==='pipe')_mpPipe(X,W,H,t,cur,d);
 else if(sc==='squeeze')_mpSqueeze(X,W,H,t,cur,d);
 else if(sc==='reservoir')_mpReservoir(X,W,H,t,cur,d);
 else if(sc==='gears')_mpGears(X,W,H,t,cur,d);
 else if(sc==='domino')_mpDomino(X,W,H,t,cur,d);
 else _mpChip(X,W,H,t,cur,d);
}

// ==================== 4. actors 棋盘博弈群像卡 ====================
// data: {eyebrow, title, left:{name,role,tag,power:0.4}, right:{name,role,tag,power:0.8},
//        clash:{t:"核心博弈点", s:1}, shifts:[{s:2, lp:0.25, rp:0.9, note:"..."}]}
function _acHtml(d){
 const mkSide=(side,cls)=>`<div class="ac-p ${cls}"><div class="ac-ic">${esc((side.name||'A')[0])}</div><b>${esc(side.name||'')}</b><span>${esc(side.role||'')}</span>`+
  (side.tag?`<i>${esc(side.tag)}</i>`:'')+`</div>`;
 return head(d)+`<div class="vv-box vv-ac">`+
  `<div class="ac-row">${mkSide(d.left||{},'ac-l')}<div class="ac-vs">VS</div>${mkSide(d.right||{},'ac-r')}</div>`+
  `<canvas class="ac-cv" width="872" height="92"></canvas>`+
  `<div class="ac-bar"><div class="ac-bl"></div><div class="ac-br"></div></div>`+
  (d.clash?U(sOf(d.clash,1),hi(d.clash.t||d.clash),'ac-cl'):'')+
  `</div>`+(d.verdict?U(sOf(d.verdict,9),hi(d.verdict.t||d.verdict),'vv-vd'):'');
}
function _acFrame(k,t){
 const c=k.c,d=c.data||{},el=k.el;
 let lp=(d.left&&d.left.power)||0.5,rp=(d.right&&d.right.power)||0.5;
 (d.shifts||[]).forEach(sh=>{
  const q=_vIO(cl((t-tau(c,sh.s||1))/0.6));
  if(sh.lp!=null)lp=_vLerp(lp,sh.lp,q);
  if(sh.rp!=null)rp=_vLerp(rp,sh.rp,q);
 });
 const tot=Math.max(0.01,lp+rp),ratio=lp/tot;
 const bl=el.querySelector('.ac-bl'),br=el.querySelector('.ac-br');
 if(bl)bl.style.width=(ratio*100).toFixed(1)+'%';
 if(br)br.style.width=((1-ratio)*100).toFixed(1)+'%';
 // 实时能量对撞粒子束 Canvas
 const cv=el.querySelector('.ac-cv');
 if(cv){
  const X=cv.getContext('2d'),W=cv.width,H=cv.height,cy=H/2,cx=W*ratio,lv=window._LV||0;
  X.clearRect(0,0,W,H);
  X.save();X.globalCompositeOperation='lighter';
  // 左右对撞光束
  const gL=X.createLinearGradient(0,cy,cx,cy);gL.addColorStop(0,'rgba(255,90,78,0.05)');gL.addColorStop(1,'rgba(255,90,78,0.85)');
  const gR=X.createLinearGradient(W,cy,cx,cy);gR.addColorStop(0,'rgba(60,240,122,0.05)');gR.addColorStop(1,'rgba(60,240,122,0.85)');
  X.fillStyle=gL;X.fillRect(0,cy-4,cx,8);
  X.fillStyle=gR;X.fillRect(cx,cy-4,W-cx,8);
  // 流动筹码粒子 + 中心碰撞火花
  for(let i=0;i<16;i++){
   const u=((t*1.6+i*0.13)%1);
   X.fillStyle='rgba(255,140,110,0.9)';X.beginPath();X.arc(u*cx,cy+Math.sin(t*8+i)*10,3,0,6.283);X.fill();
   X.fillStyle='rgba(60,240,122,0.9)';X.beginPath();X.arc(W-u*(W-cx),cy+Math.cos(t*8+i)*10,3,0,6.283);X.fill();
  }
  const spR=24+16*lv+6*Math.sin(t*14);
  const cg=X.createRadialGradient(cx,cy,2,cx,cy,spR);
  cg.addColorStop(0,'#fff');cg.addColorStop(0.4,'rgba(245,166,35,0.85)');cg.addColorStop(1,'rgba(0,0,0,0)');
  X.fillStyle=cg;X.beginPath();X.arc(cx,cy,spR,0,6.283);X.fill();
  X.restore();
 }
}

// 注册到全局卡片库
if(typeof CARD_EXT==='undefined')window.CARD_EXT={};
if(typeof CARD_RENDER==='undefined')window.CARD_RENDER={};
Object.assign(CARD_EXT,{ticker:_tkHtml,social:_soHtml,metaphor:_mpHtml,actors:_acHtml});
Object.assign(CARD_RENDER,{ticker:_tkFrame,social:_soFrame,metaphor:_mpFrame,actors:_acFrame});
})();
