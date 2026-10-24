// =====================================================================
// 《城市更新，卡住的不是项目，而是规则》· 本期场景（标准版，老板读研报 · 城市更新系列第二集）
// 文字效果（3 种）：碎裂（c1 是规则）· 雾化（c2 还没有路）· 光扫（c5 你们赔不赔）
// 主线：100 户签约点阵停在 94 格
// =====================================================================
const GOLD='#F0B429';
const up=(t,t0,d)=>eo(cl((t-t0)/(d||0.4)));
function ctext(s,x,y,size,col,a,align){if(a<=0.003)return;X.save();X.font=`800 ${size}px NSC`;X.textAlign=align||'center';X.textBaseline='middle';X.fillStyle=rgba(col,a);X.fillText(s,x,y);X.restore();}
function vtext(s,x,y0,size,col,a){for(let i=0;i<s.length;i++)ctext(s[i],x,y0+i*(size+4),size,col,a);}
function rect(x0,y0,x1,y1,col,w,a,dash){line([[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]],col,w,a,false,dash);}
function bar(x0,x1,base,h,col,a){if(h<=0.5||a<=0.003)return;const g=X.createLinearGradient(0,base-h,0,base);g.addColorStop(0,rgba(col,0.5*a));g.addColorStop(1,rgba(col,0.06*a));
 X.fillStyle=g;X.fillRect(x0,base-h,x1-x0,h);gline([[x0,base],[x0,base-h],[x1,base-h],[x1,base]],col,2,a);}

// ---------------- 100 户点阵（c0 主角，c1 作背景） ----------------
const GX=i=>330+(i%10)*42, GY=i=>660+Math.floor(i/10)*42;
const NOS=[17,38,59,48,86,79];   // 没签的 6 户（集中在右侧，方便牵标签）
const ORD=[...Array(100).keys()].filter(i=>!NOS.includes(i)).sort((a,b)=>rnd(a*3.7)-rnd(b*3.7));
function grid(t,a,tS,tE,pulse){
 for(let i=0;i<100;i++){const k=ORD.indexOf(i);const on=k>=0&&t>lerp(tS,tE,k/93);const x=GX(i),y=GY(i);
  if(on){X.fillStyle=rgba(AU,0.42*a);X.fillRect(x,y,36,36);rect(x,y,x+36,y+36,AU,1.4,a*0.9);}
  else{const pu=NOS.includes(i)&&pulse?0.45+0.55*Math.abs(Math.sin(t*3+i)):0.3;rect(x,y,x+36,y+36,IV,1.4,a*pu);}}}
const BAR0=180,BAR1=740,BY=1186;
SCENES.c0={
 canvas(t,a){const tS=T('v01|签约|s'),t94=T('v01|九十四|s'),tN=T('v02|剩下|s'),t95=T('v03|九十五|s'),tR=T('v04|利息|s');
  grid(t,a,tS-0.1,t94+0.1,t>tN);
  // 进度条：涨到 94% 就停，抖一下
  const p=0.94*eo(cl((t-tS+0.1)/(t94-tS+0.3))),sh=t>t94+0.2&&t<t94+0.7?Math.sin((t-t94)*60)*3*(1-cl((t-t94-0.2)/0.5)):0;
  line([[BAR0,BY],[BAR1,BY]],IV,10,a*0.25);if(p>0)gline([[BAR0,BY],[BAR0+(BAR1-BAR0)*p+sh,BY]],AU,8,a);
  // 没签的 6 户：牵出原因
  [['要更多补偿','v02|补偿|s',17],['联系不上','v02|联系不上|s',38],['就是不想走','v02|不想走|s',59]].forEach(([s,k,i],j)=>{const q=up(t,T(k)-0.2,0.3);if(q<=0)return;const x=GX(i)+36,y=GY(i)+18,ly=700+j*110;
   line([[x,y],[770,ly]],IV,1.2,a*q*0.6);ctext(s,775,ly,28,IV,a*q,'left');});
  // 门槛 95%：差的那 1%
  const tq=up(t,t95-0.2,0.3);if(tq>0){const x95=BAR0+(BAR1-BAR0)*0.95;gline([[x95,BY-26],[x95,BY+26]],AU,3,a*tq);const x94=BAR0+(BAR1-BAR0)*0.94;line([[x94,BY-18],[x95,BY-18]],AU,2,a*tq,false,[3,3]);}
  // 利息照样在走：金点不停地从进度条漏下去
  const lq=a*up(t,tR-0.2,0.4);if(lq>0)for(let k=0;k<16;k++){const ph=((t-tR)*0.9+k/16)%1;if(ph<0)continue;dot(BAR0+40+rnd(k*5)*460,BY+12+ph*150,2.6,AU,lq*(1-ph));}},
 dom(t){const s0=0,tS=T('v01|签约|s'),t94=T('v01|九十四|s'),tL=T('v04|停一年|s');op('r0cap',up(t,s0,0.3));
  const n=op('r0n',up(t,tS,0.3));n.textContent=Math.round(94*eo(cl((t-tS+0.1)/(t94-tS+0.3))))+'%';
  rise('r0th',up(t,T('v03|九十五|s')-0.1,0.3));rise('r0day',up(t,tL-0.1,0.3));$('r0d').textContent=Math.round(365*eo(cl((t-tL)/1.6)));op('r0src',up(t,T('v03|条例|s')));}};

// ---------------- c1：卡住的不是项目，是规则 ----------------
SCENES.c1={
 canvas(t,a){grid(t,a*0.22,-10,-9,false);   // 项目还在，压暗做背景
  const tr=T('v05|规则|s');for(let k=0;k<5;k++){const y=760+k*90,q=eo(cl((t-tr-0.15-k*0.05)/0.5));if(q>0)gline([[540-380*q,y],[540+380*q,y]],AU,1.4,a*0.35);}},
 free(t,a){const tr=T('v05|规则|s');showText('r1core',{lines:[[['卡住的，',null],['是规则',GOLD]]],size:84,cy:900},t,tr-0.5,S.c1.end-TXDUR.out['雾散']-0.05,'碎裂','雾散',a);
  impactRing(t,tr+0.05,540,900,320,100,a,AU);}};

// ---------------- c2：书架上缺一本 → 地方条例打架 → 3/4 vs 95% → 门槛后面还没有路 ----------------
const BOOKS=[[250,'土地管理法'],[330,'城乡规划法'],[410,'民法典']];
SCENES.c2={
 canvas(t,a){const s2=S.c2.start,tL=T('v06|城市更新法|s'),tD=T('v07|地方条例|s'),tF=T('v07|打架|s'),tM=T('v08|民法典|s'),t34=T('v08|四分之三|s'),t95=T('v08|九十五|s'),tQ=T('v09|门槛高|s'),tP=T('v10|可门槛|s');
  // 书架（v06–v07）
  const sa=a*up(t,s2,0.4)*(1-cl((t-tM+0.2)/0.4));
  if(sa>0){line([[220,980],[600,980]],IV,2,sa*0.6);
   BOOKS.forEach(([x,s],i)=>{const q=up(t,s2+0.15+i*0.15,0.3);rect(x,700,x+64,975,IV,1.6,sa*q*0.8);X.fillStyle=rgba(IV,0.08*sa*q);X.fillRect(x,700,64,275);vtext(s,x+32,730,28,IV,sa*q);});
   const q=up(t,tL-0.1,0.4);rect(490,700,554,975,AU,2,sa*q,[7,6]);vtext('城市更新法',522,730,28,AU,sa*q*(0.6+0.4*Math.sin(t*4)));
   // 地方条例在补
   for(let k=0;k<4;k++){const qk=up(t,tD-0.1+k*0.15,0.3);if(qk<=0)continue;const y=720+k*62,x=660+(k%2)*24;rect(x,y,x+200,y+48,IV,1.4,sa*qk*0.8);ctext('地方条例',x+100,y+24,28,IV,sa*qk);}
   // 和上位法打架
   if(t>tF-0.1){const f=1-cl((t-tF-0.6)/0.6);for(let k=0;k<3;k++){const y=760+k*70,P=[[650,y]];for(let m=1;m<=6;m++)P.push([650-m*14,y+(m%2?-14:14)]);gline(P,AU,2,sa*f*(0.5+0.5*rnd(Math.floor(t*20)+k)));}}}
  // 两根门槛柱（v08 起）
  const pa=a*up(t,tM,0.4)*(1-0.7*cl((t-tP)/0.5));
  if(pa>0){line([[220,1180],[880,1180]],IV,1.5,pa*0.5);bar(300,420,1180,480*0.75*eo(cl((t-t34+0.2)/0.6)),IV,pa*0.8);bar(660,780,1180,480*0.95*eo(cl((t-t95+0.2)/0.6)),AU,pa);
   // 门槛高，是为了不再强拆：95% 那条线亮成一道墙
   const w=up(t,tQ-0.1,0.5);if(w>0){const y=1180-480*0.95;gline([[640,y],[640+260*w,y]],AU,4,pa*(0.6+0.4*Math.sin((t-tQ)*3)));}}
  // 门槛后面：一条没画完的虚线路，走进雾里
  if(t>tP-0.2){const q=eo(cl((t-tP+0.2)/1.4));const y0=1180-480*0.95,P=[];for(let k=0;k<=30;k++){const u=k/30;P.push([780+u*140,y0-20*Math.sin(u*3)-u*60]);}
   const pp=partial(P,q);for(let k=1;k<pp.length;k+=2)line([pp[k-1],pp[k]],AU,2.4,a*(1-k/pp.length*0.8));smoke(t,tP+0.5,880,640,160,120,8,a,520);}},
 free(t,a){showText('r2core',{lines:[[['门槛后面，',null],['还没有路',GOLD]]],size:76,cy:960},t,T('v10|可门槛|s')-0.1,S.c2.end-TXDUR.out['雾散']-0.05,'雾化','雾散',a);},
 dom(t){const s2=S.c2.start,tM=T('v08|民法典|s'),tP=T('v10|可门槛|s');const sa=1-cl((t-tM+0.2)/0.4),pa=up(t,tM,0.4)*(1-0.7*cl((t-tP)/0.5));
  op('r2cap',up(t,s2)*sa);rise('r2n0',pa*up(t,T('v08|四分之三|s')+0.2,0.3));rise('r2n1',pa*up(t,T('v08|九十五|s')+0.2,0.3));
  op('r2l0',pa*up(t,T('v08|四分之三|s')-0.2));op('r2l1',pa*up(t,T('v08|九十五|s')-0.2));op('r2src',up(t,tM));}};

// ---------------- c3：老路走不通 → 拆两成、新建不超两倍 → 拆掉、加面积、卖新房断了 ----------------
const OB=[300,520,760,1120],H0=OB[3]-OB[2];   // 旧楼
SCENES.c3={
 canvas(t,a){const s3=S.c3.start,tX=T('v11|走不通|s'),tL=T('v12|两条线|s'),t20=T('v12|百分之二十|s'),t2=T('v12|不超过二|s'),tK=T('v13|拆掉|s'),tC=T('v13|算不过来|s');
  // 老路 + 路障
  const ra=a*up(t,s3,0.4)*(1-cl((t-tL+0.3)/0.4));
  if(ra>0){gline([[200,1000],[880,1000]],IV,3,ra*0.7);for(let k=0;k<8;k++){const ph=((t-s3)*0.4+k/8)%1;if(t<tX||ph*680+200<640)dot(200+ph*680,1000,3,IV,ra*0.8);}
   if(t>tX-0.1){const q=eo(cl((t-tX+0.1)/0.2));gline([[640,1000-110*q],[640,1000+110*q]],AU,5,ra);impactRing(t,tX,640,1000,90,60,ra,AU);}}
  // 旧楼：顶上两成可拆，新建最多是拆除量的两倍
  const ba=a*up(t,tL-0.2,0.5)*(1-0.6*cl((t-tK)/0.5));
  if(ba>0){const cut=OB[2]+H0*0.2,dz=cl((t-t20)/0.6);
   rect(OB[0],cut,OB[1],OB[3],IV,2,ba*0.8);if(dz<1)rect(OB[0],OB[2],OB[1],cut,IV,2,ba*(1-dz));if(t>t20){smoke(t,t20,410,OB[2]+36,200,60,6,ba,610);line([[OB[0]-20,cut],[OB[1]+20,cut]],AU,1.6,ba,false,[6,5]);}
   for(let r=0;r<6;r++)for(let c=0;c<4;c++){X.fillStyle=rgba(IV,0.12*ba);X.fillRect(OB[0]+22+c*50,cut+24+r*46,28,20);}
   const nq=eo(cl((t-t2+0.2)/0.8)),cap=H0*0.2*2;if(nq>0){bar(600,820,OB[3],cap*nq,AU,ba);gline([[580,OB[3]-cap],[840,OB[3]-cap]],AU,2,ba*nq*(0.6+0.4*Math.sin(t*5)));ctext('新建 ≤ 拆除 × 2',710,OB[3]-cap-30,28,AU,ba*nq);}}
  // 拆掉 → 加面积 → 卖新房，在「算不过来」处断开
  const ka=a*up(t,tK-0.2,0.4);if(ka>0){const brk=cl((t-tC)/0.4);line([[300,1206],[410,1206]],IV,2,ka*up(t,T('v13|加面积|s')-0.2,0.3)*0.7);
   const q2=up(t,T('v13|卖新房|s')-0.2,0.3);if(brk<1)line([[560,1206],[670,1206]],IV,2,ka*q2*0.7*(1-brk));else{line([[560,1206],[605,1206]],GR,2,ka);line([[625,1222],[670,1222]],GR,2,ka);}
   if(t>tC)disperse(samplePts([[560,1206],[670,1206]],18),t,tC,ka,AU,830,0.7);
   for(let k=0;k<10;k++){const ph=((t-tK)*0.6+k/10)%1;if(brk>0&&ph>0.4)continue;dot(lerp(190,860,ph),1250,2.4,AU,ka*0.8*(1-brk*0.7));}}},
 dom(t){const tK=T('v13|拆掉|s'),tC=T('v13|算不过来|s');rise('r3a',up(t,T('v12|百分之二十|s'),0.3));rise('r3b',up(t,T('v12|不超过二|s'),0.3));
  [['r3k0','v13|拆掉|s'],['r3k1','v13|加面积|s'],['r3k2','v13|卖新房|s']].forEach(([id,k])=>{const e=rise(id,up(t,T(k)-0.15,0.3));e.style.opacity=(+e.style.opacity*(1-0.5*cl((t-tC)/0.4))).toFixed(3);});
  op('r3src',up(t,T('v12|两条线|s')));}};

// ---------------- c4：更新做得成——香港八成、走法庭，规则写死就有下一步 ----------------
SCENES.c4={
 canvas(t,a){const s4=S.c4.start,t8=T('v15|八成|s'),tc=T('v15|法庭|s'),tw=T('v15|写死|s');
  // 回到上一章那条没画完的路（虚线，淡）
  const pa=a*up(t,s4,0.5);const P=[[200,1150],[620,1150]];const solid=eo(cl((t-tw+0.1)/0.8));
  for(let x=200;x<620;x+=28){const u=(x-200)/420;line([[x,1150],[x+14,1150]],IV,2.4,pa*0.5*(1-u*0.6));}
  if(solid>0){gline(partial(P,solid),AU,4,a);if(solid>=1)line([[606,1136],[620,1150],[606,1164]],AU,4,a);}
  // 门槛刻度：90% → 80%
  const q=eo(cl((t-t8+0.2)/0.7)),v=0.9-0.1*q,x0=220,x1=860;line([[x0,860],[x1,860]],IV,8,pa*0.25);gline([[x0,860],[x0+(x1-x0)*v,860]],AU,6,pa);
  [0.8,0.9].forEach((m,j)=>{line([[x0+(x1-x0)*m,844],[x0+(x1-x0)*m,876]],IV,2,pa*0.6);ctext(Math.round(m*100)+'%',x0+(x1-x0)*m,j?822:900,28,IV,pa*0.7);});
  impactRing(t,tc+0.05,805,1045,170,170,a,RD);},
 dom(t){const s4=S.c4.start,t8=T('v15|八成|s'),tc=T('v15|法庭|s');const n=rise('r4n',up(t,T('v15|香港|s')-0.1,0.3));n.textContent=Math.round(90-10*eo(cl((t-t8+0.2)/0.7)))+'%';op('r4l',up(t,T('v15|香港|s')));
  const q=cl((t-tc+0.05)/0.2);const st=op('r4st',q>0?1:0);st.style.transform=`rotate(-10deg) scale(${(1.45-0.45*eo(q)).toFixed(3)})`;rise('r4nx',up(t,T('v15|写死|s')+0.6,0.3));op('r4src',up(t,T('v15|香港|s')));}};

// ---------------- c5：查两个数 → 超线就是还靠卖新房 → 第七年赔不赔 ----------------
const GA=[[380,880,'v16|拆除面积占比|s',0.32/0.5,0.2/0.5,'32%'],[700,880,'v16|拆建比|s',2.6/4,2/4,'2.6']];   // 读数为示意：刻度 0–50% / 0–4
function gauge(cx,cy,r,v,lim,a,lit){const A0=Math.PI,A1=2*Math.PI;const arc=(f0,f1,col,w,al)=>{const P=[];for(let k=0;k<=30;k++){const an=lerp(A0+(A1-A0)*f0,A0+(A1-A0)*f1,k/30);P.push([cx+Math.cos(an)*r,cy+Math.sin(an)*r]);}gline(P,col,w,al);};
 arc(0,1,IV,3,a*0.35);arc(lim,1,AU,5,a*(lit?1:0.45));const an=A0+(A1-A0)*v;gline([[cx,cy],[cx+Math.cos(an)*(r-14),cy+Math.sin(an)*(r-14)]],v>lim?AU:IV,4,a);dot(cx,cy,6,IV,a);}
SCENES.c5={
 canvas(t,a){const s5=S.c5.start,t1=T('v17|超过|s'),ts=T('v17|卖新房|s'),t7=T('v18|第七年|s'),tq=T('v18|最后|s');const ca=a*(1-cl((t-tq+0.2)/0.5));
  const t2n=T('v16|两个数|s');GA.forEach(([cx,cy,k,v,lim,s])=>{const tk=T(k);const q=up(t,t2n-0.1,0.5);if(q<=0)return;const vv=v*eo(cl((t-tk+0.1)/0.9));gauge(cx,cy,110,vv,lim,ca*q,t>t1);ctext(s,cx,cy+40,30,vv>lim?AU:IV,ca*q*cl((t-tk-0.6)/0.3));});
  // 靠卖新房在撑：卡片底下一摞金币在顶着
  const cq=up(t,ts-0.2,0.4)*ca;if(cq>0)for(let c=0;c<5;c++)for(let r=0;r<4;r++)dot(240+c*30,1150-r*14,7,AU,cq*0.85);
  // 第七年：1–7 年时间轴，第 7 年亮
  const ya=a*up(t,tq,0.4);if(ya>0){line([[220,1180],[860,1180]],IV,1.5,ya*0.5);for(let k=1;k<=7;k++){const x=220+(k-1)*106,on=up(t,tq+k*0.12,0.2);dot(x,1180,k===7?8:4,k===7&&t>t7?AU:IV,ya*on*(k===7&&t>t7?0.6+0.4*Math.sin(t*6):0.8));ctext('第'+k+'年',x,1222,28,k===7?AU:IV,ya*on*(k===7?1:0.6));}}},
 free(t,a){showText('r5core',{lines:[[['第七年出了问题，',null]],[['你们赔不赔？',GOLD]]],size:76,cy:900},t,T('v18|第七年|s')-0.25,1e9,'光扫','光扫',a);},
 dom(t){const s5=S.c5.start,tq=T('v18|最后|s');const ca=1-cl((t-tq+0.2)/0.5);op('r5card',up(t,s5,0.4)*ca);
  op('r5g0',ca*up(t,T('v16|拆除面积占比|s')-0.2));op('r5g1',ca*up(t,T('v16|拆建比|s')-0.2));rise('r5fix',ca*up(t,T('v17|该改|s')-0.1,0.3));op('r5src',ca*up(t,T('v16|拆除面积占比|s')));}};
