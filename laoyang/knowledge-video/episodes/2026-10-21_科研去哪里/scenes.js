// =====================================================================
// 《科研去哪里》（系列中集）· 本期场景
// 文字效果（本期 3 种，与上集错开）：粒子/吹散（v04）· 水流/融化（v06）· 光扫（v10）
// =====================================================================
const GOLD='#F0B429',GRN='#3CF07A';

// ---------------- c0：100 分钱 → 81 分回来 → 聚成罗盘 ----------------
const Q0=(function(){const G=[...Array(100)].map((_,i)=>[180+(i%10)*34,700+Math.floor(i/10)*34]);
 const ord=[...Array(100).keys()].sort((a,b)=>rnd(a+9)-rnd(b+9));const keep=new Set(ord.slice(0,81));
 const CX=540,CY=980,R=150;const tgt=[];let k=0;
 for(let i=0;i<100;i++){if(!keep.has(i)){tgt.push(null);continue;}
  if(k<56){const an=k/56*6.283;tgt.push([Math.cos(an)*R,Math.sin(an)*R,0]);}else{const u=(k-56)/24;tgt.push([0,lerp(-R*0.85,R*0.85,u),1]);}k++;}
 return {G,keep,tgt,CX,CY,R};})();
function needleAng(t){const t2=T('v02|去哪里|s');return 0.6*Math.sin((t-t2)*1.7)+0.35*Math.sin((t-t2)*3.1);}
SCENES.c0={
 free(t,a){const t0=T('v01|投|s'),tg=T('v01|八毛一|s'),tc=T('v02|去哪里|s')-0.3;const {G,keep,tgt,CX,CY}=Q0;const [c,g]=layer('q0');g.globalCompositeOperation='lighter';
  const ang=needleAng(t),ca=Math.cos(ang),sa=Math.sin(ang);
  for(let i=0;i<100;i++){const pin=eo(cl((t-t0-i*0.008)/0.4));if(pin<=0)continue;const lost=!keep.has(i);const lit=cl((t-tg+0.3-(i%10)*0.02)/0.3);
   let [x,y]=G[i];let col=lit>0.5?(lost?'#8C857A':GOLD):'#FFE9C4',al=pin*(lost?lerp(0.8,0.25,lit):0.85);
   const m=eo(cl((t-tc-rnd(i)*0.25)/0.9));
   if(m>0){if(lost){al*=1-m;y+=40*m;}else{const [tx,ty,nd]=tgt[i];const rx=nd?tx*ca-ty*sa:tx,ry=nd?tx*sa+ty*ca:ty;x=lerp(x,CX+rx,m);y=lerp(y,CY+ry,m)-Math.sin(Math.PI*m)*60;col=nd?GOLD:'#FFE9C4';}}
   if(al<=0.01)continue;g.globalAlpha=al*a;g.fillStyle=col;const r=m>0.9&&!lost?2:4.5;g.fillRect(x-r,y-r,2*r,2*r);}
  g.globalAlpha=1;present(c,1,0.5);},
 dom(t){const tg=T('v01|八毛一|s'),tc=T('v02|去哪里|s');const out=1-cl((t-tc+0.4)/0.3);
  rise('q0l',cl((t-tg+0.3)/0.3)*out);rise('q0n',cl((t-tg+0.2)/0.3)*out);$('q0n').firstChild.textContent=Math.round(81*eo(cl((t-tg+0.2)/0.7)));
  rise('q0q',cl((t-T('v01|还要不要|s'))/0.35)*out);op('q0src',cl((t-tg)/0.4));}};

// ---------------- c1：撒胡椒面 → 选准一个方向 ----------------
const TG=[[300,700],[430,800],[570,690],[700,830],[830,700],[240,900],[380,960],[520,880],[650,980],[800,940],[880,820],[330,790],[610,780],[460,1050]];
const SRC=[170,1130],PICK=4;
SCENES.c1={
 free(t,a){const t3=T('v03|科研|s'),tp=T('v04|胡椒面|s'),td=T('v04|方向|s');const [c,g]=layer('q1');g.globalCompositeOperation='lighter';
  // 小靶点
  TG.forEach((p,j)=>{const pin=eo(cl((t-t3-j*0.07)/0.3));if(pin<=0)return;const dead=j===PICK?0:cl((t-td-rnd(j)*0.3)/0.5);const fz=cl((t-tp-0.6-rnd(j+3)*0.4)/0.5);
   const big=j===PICK?eo(cl((t-td-0.3)/0.4)):0;const r=14+16*big;g.globalAlpha=a*pin*(1-dead)*(j===PICK?1:(1-0.6*fz));g.strokeStyle=j===PICK&&big>0?GOLD:'#FFE9C4';g.lineWidth=2;
   g.beginPath();g.arc(p[0],p[1],r,0,6.283);g.stroke();g.beginPath();g.arc(p[0],p[1],r*0.45,0,6.283);g.stroke();});
  // 撒：稀疏粒子飞向各个靶
  if(t>tp-0.2&&t<td+0.8){for(let i=0;i<140;i++){const j=i%TG.length,ph=((t-tp+0.2)*0.9+rnd(i*3.1))%1;const p=TG[j];
   const x=lerp(SRC[0],p[0],ph)+(rnd(i)-.5)*30*ph,y=lerp(SRC[1],p[1],ph)-Math.sin(Math.PI*ph)*80;g.globalAlpha=a*0.5*Math.sin(Math.PI*ph)*(1-cl((t-td)/0.5));g.fillStyle='#FFE9C4';g.fillRect(x-1,y-1,2,2);}}
  // 聚：一束打中选中的靶
  if(t>td){const P=TG[PICK];const b=eo(cl((t-td)/0.5));for(let i=0;i<260;i++){const ph=((t-td)*1.4+rnd(i*7.3))%1;const x=lerp(SRC[0],P[0],ph),y=lerp(SRC[1],P[1],ph)+(rnd(i)-.5)*6*(1-ph);
   g.globalAlpha=a*b*0.8*Math.sin(Math.PI*Math.min(1,ph*1.1));g.fillStyle=GOLD;g.fillRect(x-1.2,y-1.2,2.4,2.4);}}
  g.globalAlpha=1;present(c,1,0.55);
  impactRing(t,td+0.5,TG[PICK][0],TG[PICK][1],140,90,a,AU);
  if(t>tp)smoke(t,tp+0.6,540,860,700,340,10,a*0.7,600);
  showText('q1core',{lines:[[['方向选对，',null]],[['才不是沉没成本',GOLD]]],size:64,cy:1215},t,td-0.1,Q1OUT(),'粒子','吹散',a);},
 dom(t){const tp=T('v04|胡椒面|s'),td=T('v04|方向|s');op('q1a',cl((t-tp+0.2)/0.3)*(1-cl((t-td)/0.3)));op('q1b',cl((t-td-0.1)/0.3));op('q1src',cl((t-T('v03|科研|s'))/0.4));}};
const Q1OUT=()=>Math.max(T('v04|沉没成本|e')+0.3,T('v04|方向|s')+TXDUR.in['粒子']+1.0);   // 落地后至少停 1 秒

// ---------------- c2：价值链向前、向深、向后 ----------------
const NX=[250,430,610,790],NY=760;
SCENES.c2={
 canvas(t,a){const t0=S.c2.start,tf=T('v05|向前|s'),tdp=T('v05|向深|s'),tb=T('v05|向后|s');
  const L0=eo(cl((t-t0-0.2)/0.8));line([[NX[0],NY],[lerp(NX[0],NX[3],L0),NY]],IV,2,0.45*a);
  NX.forEach((x,i)=>{const on=i===1?1:(i===0?cl((t-tf)/0.3):i===3?cl((t-tb)/0.3):0);dot(x+22,NY,i===1?6:4,on>0.5?(i===3?GRN:AU):IV,a*cl((t-t0-0.2-i*0.15)/0.3));});
  // 向前：金色箭头从设计流向前策
  const f=eo(cl((t-tf)/0.6));if(f>0){gline([[NX[1]+22,NY-12],[lerp(NX[1]+22,NX[0]-40,f),NY-12]],AU,3,a);for(let k=0;k<5;k++){const ph=((t-tf)*0.8+k/5)%1;dot(lerp(NX[1]+22,NX[0]-40,ph),NY-12,2.4,AU,a*f);}}
  // 向深：往下钻
  const d=eo(cl((t-tdp)/0.6));if(d>0){gline([[NX[1]+22,NY+40],[NX[1]+22,lerp(NY+40,880,d)]],AU,3,a);line([[NX[1]+10,lerp(NY+40,880,d)-12],[NX[1]+22,lerp(NY+40,880,d)],[NX[1]+34,lerp(NY+40,880,d)-12]],AU,3,a*d);}
  // 向后：绿色延伸到运营以后，长周期
  const b=eo(cl((t-tb)/0.8));if(b>0){gline([[NX[1]+22,NY+12],[lerp(NX[1]+22,NX[3]+120,b),NY+12]],GRN,3,a);for(let k=0;k<8;k++){const ph=((t-tb)*0.5+k/8)%1;dot(lerp(NX[2],NX[3]+120,ph),NY+12,2.2,GRN,a*b);}}},
 free(t,a){const tw=T('v06|从|s')-0.15;
  showText('q2core',{lines:[[['一次性设计费',null]],[['→ 全周期运维费',GRN]]],size:72,cy:1150},t,tw,S.c2.end-TXDUR.out['融化']-0.1,'水流','融化',a,0.3);},
 dom(t){const t0=S.c2.start;[0,1,2,3].forEach(i=>op('q2n'+i,cl((t-t0-0.2-i*0.15)/0.3)));
  rise('q2f',eo(cl((t-T('v05|向前|s'))/0.35)));rise('q2d',eo(cl((t-T('v05|向深|s'))/0.35)));rise('q2b',eo(cl((t-T('v05|向后|s'))/0.35)));op('q2src',cl((t-t0)/0.4));}};

// ---------------- c3：大建 → 大管大修；BIM→CIM→孪生 ----------------
function plane(cx,cy,w,h,col,al){const s=0.5;line([[cx-w/2,cy],[cx,cy-h*s],[cx+w/2,cy],[cx,cy+h*s],[cx-w/2,cy]],col,1.8,al);}
SCENES.c3={
 canvas(t,a){const t0=S.c3.start,tm=T('v07|大管|s'),tq=T('v08|全域|s'),tbim=T('v08|BIM|s'),ttw=T('v08|孪生|s');
  // 塔吊线框（大建）→ 变灰烟散
  const cq=eo(cl((t-t0)/0.5)),cg=cl((t-tm)/0.5);const cr=[[300,1210],[300,700],[560,700],[300,750],[260,700],[300,700]];
  if(cg<1)line(partial(cr,cq),cg>0.3?GR:IV,2.5,a*(1-cg)*0.8);if(t>tm&&t<tm+2.4)smoke(t,tm,380,950,300,380,8,a,720);
  // 桥 + 监测点（大管大修）
  const bq=eo(cl((t-tm-0.2)/0.7));const B=[];for(let i=0;i<=40;i++){const u=i/40;B.push([lerp(330,900,u),1215-Math.sin(Math.PI*u)*90])}
  gline(partial(B,bq),IV,2,a*0.7);line([[300,1215],[930,1215]],IV,1.5,a*0.4*bq);
  for(let k=0;k<9;k++){const u=(k+0.5)/9,p=along(B,u),on=cl((t-tm-0.6-k*0.12)/0.2);if(on>0){dot(p[0],p[1],3.4,GRN,a*on*(0.7+0.3*Math.sin(t*4+k)));}}
  // BIM→CIM→孪生 三层
  [0,1,2].forEach(i=>{const ti=i===0?tbim:i===1?tbim+0.4:ttw;const q=eo(cl((t-ti)/0.4));if(q<=0)return;plane(640,930-i*90-(1-q)*20,400,190,i===2?GRN:IV,a*q*(i===2?0.95:0.6));});},
 dom(t){[['q3a','v08|全域|s'],['q3b','v08|融合|s'],['q3c','v08|自主|s']].forEach(([id,k])=>{const p=eo(cl((t-T(k))/0.3));const e=op(id,p);e.style.transform=`translateY(${(-24*(1-p)).toFixed(1)}px)`;});
  const tbim=T('v08|BIM|s');op('q3p0',cl((t-tbim)/0.3));op('q3p1',cl((t-tbim-0.4)/0.3));op('q3p2',cl((t-T('v08|孪生|s'))/0.3));op('q3src',cl((t-S.c3.start)/0.4));}};

// ---------------- c4：工艺包 → 装备 → 软件 → 循环（闭环） ----------------
const RC=[540,990],RR=230,KEYS=['v09|工艺包|s','v09|装备|s','v09|工业软件|s','v09|循环经济|s'];
SCENES.c4={
 canvas(t,a){const tl=T(KEYS[3]);
  KEYS.forEach((k,i)=>{const q=eo(cl((t-T(k))/0.6));if(q<=0)return;const a0=-Math.PI/2+i*Math.PI/2+0.32,a1=a0+(Math.PI/2-0.64)*q;
   const pts=[];for(let s=0;s<=20;s++){const an=lerp(a0,a1,s/20);pts.push([RC[0]+Math.cos(an)*RR,RC[1]+Math.sin(an)*RR*0.95]);}gline(pts,i===3?GRN:AU,2.4,a);});
  const lq=cl((t-tl-0.4)/0.5);if(lq>0)for(let k=0;k<16;k++){const an=-Math.PI/2+((t-tl)*0.9+k/16)*6.283;dot(RC[0]+Math.cos(an)*RR,RC[1]+Math.sin(an)*RR*0.95,2.4,GRN,a*lq*0.9);}
  impactRing(t,tl+0.4,RC[0],RC[1],260,220,a,GRN);},
 dom(t){KEYS.forEach((k,i)=>{const p=eo(cl((t-T(k)+0.1)/0.35));const e=op('q4k'+i,p);e.style.transform=`scale(${(1.2-0.2*p).toFixed(3)})`;hl(e,t>T(KEYS[3])+0.4,i===3?'#3CF07A':'#F0B429');});op('q4src',cl((t-S.c4.start)/0.4));}};

// ---------------- c5：罗盘锁定 · 方向本身就是战略 ----------------
SCENES.c5={
 canvas(t,a){const tj=T('v10|我|s'),tl=T('v10|选准了|s');const cx=540,cy=850,R=150;
  const q=eo(cl((t-tj-0.2)/0.6));if(q<=0)return;X.save();X.strokeStyle=rgba(IV,0.5*a*q);X.lineWidth=2;X.beginPath();X.arc(cx,cy,R,0,6.283);X.stroke();
  for(let k=0;k<24;k++){const an=k/24*6.283;X.beginPath();X.moveTo(cx+Math.cos(an)*(R-8),cy+Math.sin(an)*(R-8));X.lineTo(cx+Math.cos(an)*R,cy+Math.sin(an)*R);X.stroke();}X.restore();
  const lock=eo(cl((t-tl)/0.5));const ang=lerp(1.2*Math.sin((t-tj)*2.3)+0.5*Math.sin((t-tj)*5.1),-0.9,lock);
  gline([[cx-Math.cos(ang)*R*0.85,cy-Math.sin(ang)*R*0.85],[cx+Math.cos(ang)*R*0.85,cy+Math.sin(ang)*R*0.85]],lock>0.9?AU:IV,3.4,a*q);dot(cx+Math.cos(ang)*R*0.85,cy+Math.sin(ang)*R*0.85,5,lock>0.9?AU:IV,a*q);
  impactRing(t,tl+0.5,cx,cy,200,200,a,AU);},
 free(t,a){showText('q5core',{lines:[[['方向本身，',null],['就是战略',GOLD]]],size:80,cy:1120},t,T('v10|方向|s')-0.1,S.c5.end-TXDUR.out['光扫']-0.1,'光扫','光扫',a);},
 dom(t){op('q5a',cl((t-T('v10|选准了|s'))/0.35));op('q5b',cl((t-T('v10|选不准|s'))/0.35));}};

// ---------------- c6：二选一 ----------------
SCENES.c6={
 canvas(t,a){const s=S.c6.start,pl=cl((t-T('v11|选准|s'))/0.4),pr=cl((t-T('v11|胡椒面|s'))/0.4);
  gline([[200,1040],[440,720]],AU,3,a*(0.3+0.7*pl));for(let k=0;k<6;k++){const ph=((t-s)*1.2+k/6)%1;dot(lerp(200,440,ph),lerp(1040,720,ph),2.4,AU,a*(0.3+0.7*pl));}
  for(let i=0;i<40;i++){const x=640+rnd(i*3.3)*230,y=700+rnd(i*5.1)*340;dot(x,y,1.6,IV,a*(0.25+0.6*pr)*(0.5+0.5*Math.sin(t*3+i)));}
  const vq=cl((t-s-0.25)/0.5);if(vq>0){gline([[540,670],[540,lerp(670,850,eo(vq))]],AU,2,a*0.7);gline([[540,1160],[540,lerp(1160,970,eo(vq))]],AU,2,a*0.7);}},
 dom(t){const pl=cl((t-T('v11|选准|s'))/0.35),pr=cl((t-T('v11|胡椒面|s'))/0.35);
  hl($('q6L'),pl>0,'#F0B429');$('q6L').style.color=pl>0?'#F0B429':'#C9C2B6';hl($('q6R'),pr>0,'#FFE9C4');$('q6R').style.color=pr>0?'#FFE9C4':'#C9C2B6';
  const l0=eo(cl((t-S.c6.start)/0.4));$('q6L').style.transform=`translateX(${(-50*(1-l0)).toFixed(1)}px)`;$('q6R').style.transform=`translateX(${(50*(1-l0)).toFixed(1)}px)`;$('q6L').style.opacity=$('q6R').style.opacity=l0.toFixed(3);
  const vq=eo(cl((t-S.c6.start-0.25)/0.3));const vs=op('q6vs',vq);vs.style.transform=`scale(${(1.5-0.5*vq).toFixed(3)})`;vs.style.textShadow='0 0 18px rgba(245,166,35,.6),0 3px 10px rgba(0,0,0,.7)';}};

HOOKS.texA=(t,V)=>1-0.5*Math.max(V[0],V[1]);
