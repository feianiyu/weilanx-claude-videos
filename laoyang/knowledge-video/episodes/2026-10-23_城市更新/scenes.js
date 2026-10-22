// =====================================================================
// 《城市更新：从工程改造走向长期运营》· 本期场景（标准版，老板读研报）
// 文字效果（3 种）：光扫（c1 走向长期运营）· 水流（c3 才有持续收入）· 逐字（c4 一直经营下去）
// =====================================================================
const GOLD='#F0B429';
const up=(t,t0,d)=>eo(cl((t-t0)/(d||0.4)));
function bar(x0,x1,base,h,col,a){if(h<=0.5||a<=0.003)return;const g=X.createLinearGradient(0,base-h,0,base);g.addColorStop(0,rgba(col,0.5*a));g.addColorStop(1,rgba(col,0.06*a));
 X.fillStyle=g;X.fillRect(x0,base-h,x1-x0,h);gline([[x0,base],[x0,base-h],[x1,base-h],[x1,base]],col,2,a);}
function hbar(x0,y,len,hh,col,a){if(len<=0.5||a<=0.003)return;const g=X.createLinearGradient(x0,0,x0+len,0);g.addColorStop(0,rgba(col,0.1*a));g.addColorStop(1,rgba(col,0.5*a));
 X.fillStyle=g;X.fillRect(x0,y-hh/2,len,hh);gline([[x0,y-hh/2],[x0+len,y-hh/2],[x0+len,y+hh/2],[x0,y+hh/2]],col,1.6,a);}
function ctext(s,x,y,size,col,a,align){if(a<=0.003)return;X.save();X.font=`800 ${size}px NSC`;X.textAlign=align||'center';X.textBaseline='middle';X.fillStyle=rgba(col,a);X.fillText(s,x,y);X.restore();}
function rect(x0,y0,x1,y1,col,w,a,dash){line([[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]],col,w,a,false,dash);}

// ---------------- c0：地块网格 → 75 平方公里亮起 → 150 栋楼升起 → 会设计、会施工不够了 ----------------
const P0=[...Array(84)].map((_,i)=>({x:190+(i%7)*48,y:820+Math.floor(i/7)*30,lit:rnd(i*3.3)<0.42}));   // 左：地块（示意）
const B0=[...Array(150)].map((_,i)=>({x:580+(i%15)*22,h:18+rnd(i*1.7)*70,row:Math.floor(i/15)}));            // 右：150 栋楼
SCENES.c0={
 canvas(t,a){const t75=T('v01|七十五|s'),t150=T('v01|一百五十|s'),tg=T('v02|拿到|s');const dimAll=1-0.55*cl((t-tg)/0.6);
  // 第一帧就有：地块网格
  P0.forEach((p,i)=>{const lit=p.lit&&t>t75-0.1+rnd(i)*0.6;rect(p.x,p.y,p.x+42,p.y+24,lit?AU:IV,1.2,a*dimAll*(lit?0.9:0.25));
   if(lit){X.fillStyle=rgba(AU,0.18*a*dimAll);X.fillRect(p.x,p.y,42,24);}});
  // 150 栋：从后往前一排排升起
  const bq=t-t150+0.2;B0.forEach((b,i)=>{const q=eo(cl((bq-b.row*0.09-rnd(i)*0.15)/0.5));if(q<=0)return;const base=1180-b.row*0.0,x=b.x+(b.row%2)*6,y=1180-b.row*30;
   line([[x,y],[x,y-b.h*q*0.6]],i%5?IV:AU,3,a*dimAll*(0.35+0.04*b.row));});
  line([[180,1190],[900,1190]],IV,1.5,0.4*a);
  if(t>tg)smoke(t,tg,540,1240,600,80,7,a,410);},
 dom(t){const t75=T('v01|七十五|s'),t150=T('v01|一百五十|s'),tg=T('v02|拿到|s');const dimAll=1-0.55*cl((t-tg)/0.6);
  rise('u0a',up(t,t75-0.15,0.3)*dimAll);countUp('u0a',75,(t-t75+0.15)/0.8);op('u0al',up(t,t75)*dimAll);
  rise('u0b',up(t,t150-0.15,0.3)*dimAll);countUp('u0b',150,(t-t150+0.15)/0.8);op('u0bl',up(t,t150)*dimAll);
  const out=1-cl((t-tg-0.2)/0.4);[['u0c1','v02|设计|s'],['u0c2','v02|施工|s']].forEach(([id,k])=>{const e=rise(id,up(t,T(k)-0.1,0.3)*out);});
  op('u0src',up(t,t75));}};

// ---------------- c1：报告 → 从工程改造走向长期运营 → 交付不再是终点 ----------------
const LC=[[220,'策划'],[380,'设计'],[540,'施工'],[700,'交付'],[870,'运营']],LY=1000;
SCENES.c1={
 canvas(t,a){const s1=S.c1.start,tp=T('v04|过去|s'),te=T('v04|结束|s'),tc=T('v04|策划|s'),to=T('v04|运营|s'),ti=T('v04|持续收入|s');
  // 报告卡片下面：一条金色细线慢慢扫（v03 期间不空）
  const la=a*up(t,s1,0.4)*(1-cl((t-tp)/0.4));if(la>0){const q=((t-s1)*0.35)%1;gline([[250,820],[830,820]],IV,1,la*0.3);dot(lerp(250,830,q),820,3.5,AU,la);}
  // 生命周期线
  const lq=a*up(t,tp-0.2,0.4);if(lq<=0)return;
  const g0=eo(cl((t-tp)/1.0));gline(partial([[LC[0][0],LY],[LC[3][0],LY]],g0),te<t?GR:IV,3,lq);
  LC.slice(0,4).forEach(([x,s],i)=>{const on=cl((t-tp-i*0.2)/0.3);dot(x,LY,i===0&&t>tc?7:5,i===0&&t>tc?AU:IV,lq*on);ctext(s,x,LY+46,30,i===0&&t>tc?AU:IV,lq*on*0.9);});
  if(t>te){const q=up(t,te,0.2);line([[LC[3][0],LY-24],[LC[3][0],LY+24]],IV,4,lq*q);impactRing(t,te,LC[3][0],LY,60,30,lq,IV);}
  // 从策划就定清楚：一条弧线从策划连到运营
  if(t>tc){const q=eo(cl((t-tc)/1.0));const A=[];for(let k=0;k<=40;k++){const u=k/40;A.push([lerp(LC[0][0],LC[4][0],u),LY-60-Math.sin(Math.PI*u)*130]);}gline(partial(A,q),AU,2,lq*0.8);}
  if(t>to-0.2){const q=up(t,to-0.2,0.3);dot(LC[4][0],LY,7,AU,lq*q);ctext('运营',LC[4][0],LY+46,30,AU,lq*q);line([[LC[3][0],LY],[LC[4][0],LY]],AU,2,lq*q*0.6,false,[6,6]);}
  // 持续收入：交付之后金点一直往前流
  const fq=a*up(t,ti-0.3,0.4);if(fq>0)for(let k=0;k<14;k++){const ph=((t-ti)*0.5+k/14)%1;if(ph<0)continue;dot(lerp(LC[3][0],LC[4][0]+40,ph),LY,2.6,AU,fq*Math.sin(Math.PI*ph));}},
 free(t,a){showText('u1core',{lines:[[['从工程改造，',null]],[['走向长期运营',GOLD]]],size:76,cy:1060},t,T('v03|工程改造|s')-0.3,T('v04|过去|s')+0.1,'光扫','光扫',a);},
 dom(t){const s1=S.c1.start,tp=T('v04|过去|s');const c=rise('u1card',up(t,s1+0.1,0.4)*(1-0.6*cl((t-tp)/0.4)));op('u1src',up(t,s1));}};

// ---------------- c2：10/23/14 → 43 省市 → 北京 1321 个项目 → 分钱的标准变了 ----------------
const D43=[...Array(43)].map((_,i)=>({x:210+rnd(i*7.1)*660,y:900+rnd(i*3.9)*250,k:i<15?0:i<19?1:2}));   // 15 省区 · 4 直辖市 · 24 地级市（分布示意）
SCENES.c2={
 canvas(t,a){const s2=S.c2.start,tP=T('v07|到今年|s'),t43=T('v07|四十三|s'),tJ=T('v07|具体项目|s'),tB=T('v08|北京|s'),tM=T('v09|钱不少|s'),tS=T('v09|变了|s');
  // 三个框：「规模已经定下来了」先画出框
  const fa=a*(1-0.7*cl((t-tP)/0.5))*(1-cl((t-tB)/0.4));
  [0,1,2].forEach(i=>{const q=eo(cl((t-s2-0.1-i*0.15)/0.6));if(q>0){const x=190+i*250;line(partial([[x,660],[x+200,660],[x+200,840],[x,840],[x,660]],q),i===1?AU:IV,2,fa*0.8);}});
  // 43 个省市点
  const da=a*up(t,tP,0.4)*(1-cl((t-tB+0.1)/0.4));if(da>0)D43.forEach((d,i)=>{const on=cl((t-t43+0.3-i*0.02)/0.25);const r=d.k===1?7:d.k===0?5:3.5;dot(d.x,d.y,r,d.k===0?AU:IV,da*(0.25+0.75*on));
   if(t>tJ){for(let m=0;m<3;m++){const q=eo(cl((t-tJ-i*0.015-m*0.1)/0.4));if(q>0){const an=m*2.1+i,x=d.x+Math.cos(an)*16*q,y=d.y+Math.sin(an)*12*q;rect(x-3,y-3,x+3,y+3,AU,1,da*q*0.8);}}}});
  // 北京：745 / 576
  const ba=a*up(t,tB,0.4)*(1-0.6*cl((t-tM)/0.4));if(ba>0){const tq=T('v08|一千三百二十一|s');const q=eo(cl((t-tq)/0.8));const W=680;hbar(200,950,W*745/1321*q,30,AU,ba);
   if(q>0)hbar(200+W*745/1321+4,950,W*576/1321*q,30,IV,ba*0.7);}
  // 分钱的标准变了：天平从水平倾向「持续运营」
  const sa=a*up(t,tM-0.1,0.4);if(sa>0){const ang=-0.2*eo(cl((t-tS+0.1)/0.6));const cx=540,cy=1110,L=250,c=Math.cos(ang),s=Math.sin(ang);
   const pL=[cx-L*c,cy-L*s],pR=[cx+L*c,cy+L*s];gline([pL,pR],IV,3,sa);gline([[cx,cy],[cx-26,cy+70],[cx+26,cy+70],[cx,cy]],IV,2,sa*0.7);
   for(let i=0;i<10;i++)dot(pL[0]-30+(i%5)*15,pL[1]-10-Math.floor(i/5)*14,4,AU,sa*0.9);for(let i=0;i<10;i++)dot(pR[0]-30+(i%5)*15,pR[1]-10-Math.floor(i/5)*14,4,AU,sa*0.9);
   ctext('改造交付',pL[0],pL[1]+44,30,IV,sa*0.8);ctext('持续运营',pR[0],pR[1]+44,30,t>tS?AU:IV,sa);}},
 dom(t){const tP=T('v07|到今年|s'),tB=T('v08|北京|s'),tM=T('v09|钱不少|s');const fa=(1-0.7*cl((t-tP)/0.5))*(1-cl((t-tB)/0.4));
  [['v06|十项|s',10],['v06|二十三项|s',23],['v06|十四项|s',14]].forEach(([k,v],i)=>{const tk=T(k);rise('u2n'+i,up(t,tk-0.15,0.25)*fa);countUp('u2n'+i,v,(t-tk+0.15)/0.5);op('u2l'+i,up(t,tk)*fa);});
  const da=up(t,T('v07|四十三|s'),0.3)*(1-cl((t-tB+0.1)/0.4));rise('u2p',da);op('u2src',up(t,T('v06|十项|s'))*(1-cl((t-tB)/0.3)));
  const ba=up(t,tB,0.4)*(1-0.6*cl((t-tM)/0.4));const t1=T('v08|一千三百二十一|s'),t2=T('v08|一千零四十九点五|s');
  rise('u2bj',ba*up(t,t1-0.2,0.3));countUp('u2bj',1321,(t-t1+0.2)/0.9);op('u2bjl',ba*up(t,t1-0.2));
  rise('u2inv',ba*up(t,t2-0.2,0.3));countUp('u2inv',1049.5,(t-t2+0.2)/0.9,v=>v.toFixed(1));op('u2invl',ba*up(t,t2-0.2));
  op('u2s0',ba*up(t,t1+0.6));op('u2s1',ba*up(t,t1+0.8));op('u2src2',up(t,tB));}};

// ---------------- c3：价值链延伸 → 只做一段只赚一次 → 接起来才有持续收入 ----------------
const CH=[[200,'工程建设','v10|工程建设|s'],[375,'资产整合','v10|资产整合|s'],[540,'招商租赁','v10|招商租赁|s'],[705,'商业经营','v10|商业经营|s'],[880,'社区服务','v10|社区服务|s']],CY=860;
SCENES.c3={
 canvas(t,a){const s3=S.c3.start,t1=T('v11|只做一段|s'),t1x=T('v11|一次性|s'),tj=T('v11|接起来|s');
  const only=cl((t-t1)/0.4)*(1-cl((t-tj)/0.4));   // 「只做一段」时其余几段压暗
  CH.forEach(([x,s,k],i)=>{const tk=i===0?s3+0.2:T(k);const on=cl((t-tk+0.1)/0.3);const dim=i>0?1-0.75*only:1;
   if(i>0){const q=eo(cl((t-tk+0.4)/0.5));gline([[CH[i-1][0],CY],[lerp(CH[i-1][0],x,q),CY]],i===1?IV:AU,2.4,a*dim*(q>0?1:0));}
   dot(x,CY,i===0?6:5,i===0?IV:AU,a*on*dim);ctext(s,x,CY+48,30,i===0?IV:AU,a*on*dim);});
  // 一次性的钱：一枚金币从工程建设掉下来，落地就停
  if(t>t1x-0.4){const q=cl((t-t1x+0.4)/0.5),y=lerp(CY+80,1060,q*q);dot(200,y,6,AU,a*(1-cl((t-tj)/0.5)));if(q>=1)impactRing(t,t1x+0.1,200,1066,50,12,a,AU);}
  // 接起来：链条首尾接成环，金点一直转
  const lq=a*up(t,tj-0.2,0.6);if(lq>0){const A=[];for(let k=0;k<=50;k++){const u=k/50;A.push([lerp(880,200,u),CY+90+Math.sin(Math.PI*u)*110]);}gline(partial(A,eo(cl((t-tj+0.2)/0.8))),AU,2.4,lq);
   const loop=[...CH.map(c=>[c[0],CY]),...A];for(let k=0;k<26;k++){const p=along(loop,((t-tj)*0.12+k/26)%1);dot(p[0],p[1],2.8,AU,lq*0.9);}}},
 free(t,a){showText('u3core',{lines:[[['接起来，',null],['才有持续收入',GOLD]]],size:72,cy:1200},t,T('v11|接起来|s')-0.25,S.c3.end-TXDUR.out['光扫']-0.1,'水流','光扫',a,0.3);},
 dom(t){op('u3src',up(t,S.c3.start));}};

// ---------------- c4：换一把尺子：改得好不好 → 能不能一直经营下去 ----------------
const BX=[390,690],BY=[700,1110];
SCENES.c4={
 canvas(t,a){const s4=S.c4.start,tg=T('v12|改得好不好|s'),ty=T('v12|一直|s');
  const q=eo(cl((t-s4)/1.0));gline(partial([[BX[0],BY[1]],[BX[0],BY[0]],[BX[1],BY[0]],[BX[1],BY[1]]],q),IV,2.4,a);line([[300,BY[1]],[780,BY[1]]],IV,1.5,a*0.5*q);
  const fl=Math.exp(-Math.pow((t-tg-0.4)/0.35,2));if(fl>0.01)gline([[BX[0],BY[1]],[BX[0],BY[0]],[BX[1],BY[0]],[BX[1],BY[1]]],AU,3,a*fl);
  // 窗灯：说到「一直用下去、经营下去」后一格格亮起来，此起彼伏、不停
  for(let r=0;r<8;r++)for(let c=0;c<5;c++){const i=r*5+c,x=BX[0]+30+c*58,y=BY[0]+28+r*48;const base=a*q*0.12;
   const live=cl((t-ty+0.2-rnd(i)*1.2)/0.3),flick=0.55+0.45*Math.sin(t*1.3+i*1.7);X.fillStyle=rgba(live>0?AU:IV,base+a*live*0.55*flick);X.fillRect(x,y,34,22);}
  // 时间轴：楼下一条往右一直走的线
  if(t>ty){const p=((t-ty)*0.25)%1;gline([[300,BY[1]+40],[780,BY[1]+40]],AU,1.6,a*0.5);dot(lerp(300,780,p),BY[1]+40,4,AU,a);}},
 free(t,a){showText('u4core',{lines:[[['能不能',null],['一直经营下去',GOLD]]],size:68,cy:1240},t,T('v12|一直|s')-0.3,S.c4.end-TXDUR.out['逐字']+0.2,'逐字','逐字',a);},
 dom(t){op('u4n',up(t,S.c4.start));}};

// ---------------- c5：行动清单：列项目 → 写三项 → 写不出来的就是缺口 → 建 / 合作 / 收购 ----------------
const COL=[470,665,840],ROW=[826,926,1026];
const FILLED=[[1,1,0],[1,0,0],[0,1,0]];   // 示意：哪些格子写得出来
SCENES.c5={
 canvas(t,a){const s5=S.c5.start,tl=T('v13|列出来|s'),t3=T('v13|三项|s'),tw=T('v15|写不出来|s'),tg=T('v15|缺的能力|s');
  const q=eo(cl((t-s5-0.1)/0.8));rect(170,700,910,1070,IV,1.5,a*q*0.5);line([[170,770],[910,770]],IV,1,a*q*0.4);
  [365,570,750].forEach((x,i)=>line([[x,700],[x,1070]],IV,1,a*q*(t>t3?0.45:0.2)));
  ROW.forEach((y,r)=>{const on=up(t,tl+r*0.2,0.3);line([[170,y+50],[910,y+50]],IV,1,a*on*0.25);
   COL.forEach((x,c)=>{const tk=T(['v14|谁运营|s','v14|从哪来|s','v14|哪一段|s'][c])+0.3+r*0.15;const ok=FILLED[r][c];const w=up(t,tk,0.5);
    if(ok){if(w>0)gline([[x-50,y],[x-50+100*w,y]],AU,3,a);}
    else if(t>tw){const pu=0.5+0.5*Math.sin((t-tw)*5);rect(x-55,y-18,x+55,y+18,AU,1.6,a*up(t,tw,0.3)*(0.5+0.5*pu),[5,5]);}
    else if(t>tk)line([[x-50,y],[x+50,y]],GR,1,a*0.5,false,[3,6]);});});
  if(t>tg)impactRing(t,tg,700,1100,160,40,a,AU);},
 dom(t){const s5=S.c5.start;op('u5t',up(t,s5));['v14|谁运营|s','v14|从哪来|s','v14|哪一段|s'].forEach((k,i)=>rise('u5h'+i,up(t,T(k)-0.15,0.3)));
  [0,1,2].forEach(r=>op('u5r'+r,up(t,T('v13|列出来|s')+r*0.2,0.3)));rise('u5gap',up(t,T('v15|缺的能力|s')-0.1,0.3));
  ['v16|自己建|s','v16|找合作|s','v16|收购|s'].forEach((k,i)=>{const e=rise('u5o'+i,up(t,T(k)-0.1,0.3));});}};
