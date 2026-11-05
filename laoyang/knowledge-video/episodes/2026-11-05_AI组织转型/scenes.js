// =====================================================================
// 《AI组织转型》本期场景
// 文字效果（本期 3 种）：粒子/吹散（c0）· 水流/融化（c3）· 光扫/光扫（c5）
// =====================================================================
const GOLD='#F0B429',GRN='#3CF07A',GREY='#8C857A';

// ---------------- c0：一成 vs 十倍（两根柱子） ----------------
SCENES.c0={
 canvas(t,a){const t0=S.c0.start,t1=T('v01|一成|s'),t2=T('v01|十倍|s');
  const BASE=1200;
  const h1=60*eo(cl((t-t1)/0.5));gline([[320,BASE],[320,BASE-h1]],GREY,10,a*0.9);
  const h2=320*eo(cl((t-t2)/0.6));gline([[760,BASE],[760,BASE-h2]],GOLD,10,a);
  if(t>t2)impactRing(t,t2+0.1,760,BASE-h2,160,90,a,GOLD);
  line([[160,BASE],[920,BASE]],IV,1.5,a*0.35);},
 free(t,a){const t3=T('v02|组织|s')-0.15;
  showText('c0core',{lines:[[['差距不在工具',null]],[['在组织',GOLD]]],size:72,cy:1020},t,t3,S.c0.end-TXDUR.out['吹散']-0.2,'粒子','吹散',a);},
 dom(t){const t1=T('v01|一成|s'),t2=T('v01|十倍|s');rise('c0a',eo(cl((t-t1)/0.35)));rise('c0b',eo(cl((t-t2)/0.35)));op('c0note',cl((t-S.c0.start-0.3)/0.4));}};

// ---------------- c1：算力没少花 / 试点难铺开 —— 超级个体已经打开十倍 ----------------
SCENES.c1={
 canvas(t,a){const t0=S.c1.start,ts=T('v04|超级个体|s');
  // 灰色碎点：试点推不开
  for(let i=0;i<30;i++){const ph=cl((t-t0-0.2-rnd(i)*0.4)/0.6);if(ph<=0)continue;const x=260+rnd(i*3)*420,y=660+rnd(i*5)*260;
   dot(x,y,1.8,GREY,a*0.5*eo(ph)*(0.6+0.4*Math.sin(t*2+i)));}
  // 绿色上扬线：超级个体十倍
  const q=eo(cl((t-ts)/0.8));if(q>0){const pts=[];for(let i=0;i<=20;i++){const u=i/20;pts.push([lerp(640,900,u),lerp(1150,760,Math.pow(u,0.7))]);}
   gline(partial(pts,q),GRN,3,a);for(let k=0;k<6;k++){const ph=((t-ts)*0.6+k/6)%1;const p=along(pts,ph);dot(p[0],p[1],2.4,GRN,a*q);}}},
 dom(t){const t0=S.c1.start;rise('c1a',eo(cl((t-t0-0.1)/0.35)));rise('c1b',eo(cl((t-t0+0.1)/0.35)));
  rise('c1c',eo(cl((t-T('v04|超级个体|s'))/0.35)));op('c1note',cl((t-t0)/0.4));}};

// ---------------- c2：某企业人才负责人的分享 ----------------
SCENES.c2={
 canvas(t,a){const tw=T('v05|人才负责人|s'),tn=T('v05|不代表|s');
  sweep(t,tw-0.1,0.8,a*0.6);
  if(t>tn)impactRing(t,tn+0.05,540,900,320,70,a,IV);},
 dom(t){op('c2who',cl((t-T('v05|人才负责人|s'))/0.35));
  rise('c2q',eo(cl((t-T('v05|不代表|s'))/0.4)));
  rise('c2tool',eo(cl((t-T('v06|嵌入|s'))/0.4)));
  op('c2src',cl((t-S.c2.start)/0.4));}};

// ---------------- c3：别塞旧流程，围绕价值重新设计组织 ----------------
SCENES.c3={
 canvas(t,a){const t0=S.c3.start,tr=T('v07|重新设计组织|s');
  // 旧流程：方块套方块，灰暗
  const fo=1-cl((t-tr)/0.6);line([[260,660],[500,660],[500,880],[260,880]],GREY,2,a*0.5*fo,true);
  // 新：围绕一个中心点，三条线重新连起来
  const q=eo(cl((t-tr)/0.8));if(q>0){const CX=740,CY=900;[0,1,2].forEach(i=>{const an=-Math.PI/2+i*2.094;const x=CX+Math.cos(an)*140*q,y=CY+Math.sin(an)*140*q;
    gline([[CX,CY],[x,y]],GRN,2.6,a*q);dot(x,y,4,GRN,a*q);});dot(CX,CY,5,GOLD,a*q);}},
 free(t,a){const tr=T('v07|重新设计组织|s')-0.1;
  showText('c3core',{lines:[[['围绕价值',null]],[['重新设计组织',GRN]]],size:64,cy:1240},t,tr,S.c3.end-TXDUR.out['融化']-0.15,'水流','融化',a,0.3);},
 dom(t){const t0=S.c3.start,tr=T('v07|重新设计组织|s');
  op('c3old',(1-cl((t-tr)/0.5))*cl((t-t0)/0.3));op('c3new',eo(cl((t-tr)/0.4)));
  rise('c3role',eo(cl((t-T('v08|重新画|s'))/0.4)));op('c3src',cl((t-t0)/0.4));}};

// ---------------- c4：工具买了不少，组织还是老样子（互相甩锅） ----------------
SCENES.c4={
 canvas(t,a){const t0=S.c4.start,tx=T('v09|没理解需求|s');
  const q=cl((t-t0-0.2)/0.6);if(q>0)gline([[260,730],[760,870]],IV,2,a*0.5*q);
  if(t>tx)smoke(t,tx,540,780,520,260,10,a*0.7,900);},
 dom(t){const t0=S.c4.start;rise('c4a',eo(cl((t-t0-0.1)/0.35)));rise('c4b',eo(cl((t-t0+0.15)/0.35)));op('c4note',cl((t-t0)/0.4));}};

// ---------------- c5：我的判断 —— 有限的游戏 / 无限的游戏 ----------------
SCENES.c5={
 canvas(t,a){const tj=T('v10|我|s'),tl=T('v10|有限的游戏|s'),tn=T('v11|无限的游戏|s');
  if(t>tj)impactRing(t,tj+0.05,540,970,420,120,a,GOLD);
  const q=eo(cl((t-tn)/0.7));if(q>0){for(let k=0;k<10;k++){const an=k/10*6.283;dot(360+Math.cos(an)*70*q,1270+Math.sin(an)*70*q,2.6,GRN,a*q);}}},
 free(t,a){const tn=T('v11|无限的游戏|s')-0.1;
  showText('c5core',{lines:[[['重新设计组织',null]],[['打开十倍可能',GRN]]],size:60,cy:960},t,tn,S.c5.end-TXDUR.out['光扫']-0.1,'光扫','光扫',a);},
 dom(t){op('c5a',cl((t-T('v10|有限的游戏|s'))/0.35));op('c5b',cl((t-T('v11|无限的游戏|s'))/0.35));}};

// ---------------- c6：你在打哪种游戏？ ----------------
SCENES.c6={
 canvas(t,a){const s=S.c6.start,pl=cl((t-T('v12|有限的游戏|s'))/0.4),pr=cl((t-T('v12|无限的游戏|s'))/0.4);
  for(let i=0;i<24;i++){const x=200+rnd(i*3.1)*260,y=740+rnd(i*5.3)*360;dot(x,y,1.6,GREY,a*(0.25+0.5*pl)*(0.5+0.5*Math.sin(t*3+i)));}
  for(let i=0;i<24;i++){const x=640+rnd(i*4.7)*260,y=740+rnd(i*6.1)*360;dot(x,y,1.8,GRN,a*(0.25+0.6*pr)*(0.5+0.5*Math.sin(t*3.4+i)));}},
 dom(t){const pl=cl((t-T('v12|有限的游戏|s'))/0.35),pr=cl((t-T('v12|无限的游戏|s'))/0.35);
  hl($('c6L'),pl>0,GREY);hl($('c6R'),pr>0,GRN);
  const l0=eo(cl((t-S.c6.start)/0.4));$('c6L').style.transform=`translateX(${(-50*(1-l0)).toFixed(1)}px)`;$('c6R').style.transform=`translateX(${(50*(1-l0)).toFixed(1)}px)`;
  $('c6L').style.opacity=$('c6R').style.opacity=l0.toFixed(3);
  const vq=eo(cl((t-S.c6.start-0.25)/0.3));const vs=op('c6vs',vq);vs.style.transform=`scale(${(1.5-0.5*vq).toFixed(3)})`;
  vs.style.textShadow='0 0 18px rgba(245,166,35,.6),0 3px 10px rgba(0,0,0,.7)';}};

HOOKS.texA=(t,V)=>1-0.4*Math.max(V[0]||0,V[2]||0,V[5]||0);
