// =====================================================================
// 《「你看着办」，是老板最贵的一句话》· 本期场景（标准版，画面均为示意）
// 文字效果（3 种）：碎裂（c0 办砸了，算你的）· 光扫（c3 不是授权，是把风险推给他）· 逐字（c5 授权，不是放手不管，是把边界讲清楚）
// 贯穿道具：一个「你看着办」对话气泡 + 老板 / 员工两个小人 + 任务卡
// =====================================================================
const GOLD='#F0B429';
const up=(t,t0,d)=>eo(cl((t-t0)/(d||0.4)));
const win=(t,a0,a1,d)=>up(t,a0,d)*(1-cl((t-a1)/(d||0.4)));
function ctext(s,x,y,size,col,a,align){if(a<=0.003)return;X.save();X.font=`800 ${size}px NSC`;X.textAlign=align||'center';X.textBaseline='middle';X.fillStyle=rgba(col,a);X.fillText(s,x,y);X.restore();}
function rect(x0,y0,x1,y1,col,w,a,dash){line([[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]],col,w,a,false,dash);}
function card(x0,y0,x1,y1,s,col,a,size){if(a<=0.003)return;X.fillStyle=rgba('#0E0C09',0.62*a);X.fillRect(x0,y0,x1-x0,y1-y0);rect(x0,y0,x1,y1,col,1.8,a*0.9);if(s)ctext(s,(x0+x1)/2,(y0+y1)/2,size||32,col,a);}
function circ(cx,cy,r,col,w,a,f0,f1){const P=[];const A=f0||0,B=f1===undefined?6.283:f1;for(let k=0;k<=48;k++){const an=lerp(A,B,k/48);P.push([cx+Math.cos(an)*r,cy+Math.sin(an)*r]);}gline(P,col,w,a);}
function person(x,y,s,col,a){if(a<=0.003)return;circ(x,y-66*s,11*s,col,2.4,a);gline([[x,y-54*s],[x,y-24*s]],col,2.6,a);gline([[x,y-24*s],[x-9*s,y]],col,2.6,a);gline([[x,y-24*s],[x+9*s,y]],col,2.6,a);
 gline([[x,y-48*s],[x-12*s,y-30*s]],col,2.4,a);gline([[x,y-48*s],[x+12*s,y-30*s]],col,2.4,a);}
// 对话气泡：圆角框 + 小尾巴（tail：尾巴尖的 x，指向下方说话人）
function bubble(cx,cy,w,h,s,col,a,size,tail){if(a<=0.003)return;const x0=cx-w/2,y0=cy-h/2,x1=cx+w/2,y1=cy+h/2,r=18,tx=tail===undefined?cx:tail;
 const P=[];for(let k=0;k<=8;k++){const an=Math.PI+k/8*Math.PI/2;P.push([x0+r+Math.cos(an)*r,y0+r+Math.sin(an)*r]);}
 for(let k=0;k<=8;k++){const an=-Math.PI/2+k/8*Math.PI/2;P.push([x1-r+Math.cos(an)*r,y0+r+Math.sin(an)*r]);}
 for(let k=0;k<=8;k++){const an=k/8*Math.PI/2;P.push([x1-r+Math.cos(an)*r,y1-r+Math.sin(an)*r]);}
 const bx=Math.max(x0+40,Math.min(x1-40,tx));P.push([bx+20,y1],[tx,y1+34],[bx-20,y1]);
 for(let k=0;k<=8;k++){const an=Math.PI/2+k/8*Math.PI/2;P.push([x0+r+Math.cos(an)*r,y1-r+Math.sin(an)*r]);}P.push(P[0]);
 X.fillStyle=rgba('#0E0C09',0.7*a);X.beginPath();P.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.fill();gline(P,col,2.4,a);if(s)ctext(s,cx,cy,size||40,col,a);}
// 火气（老板头顶的三道折线）/ 委屈（员工头顶的汗滴）
function fume(x,y,col,a,t){if(a<=0.003)return;for(let k=-1;k<=1;k++){const j=Math.sin(t*16+k*2)*3;gline([[x+k*16,y],[x+k*16+6+j,y-14],[x+k*16-2,y-26],[x+k*16+4+j,y-40]],col,2.6,a);}}
function drop(x,y,col,a){if(a<=0.003)return;const P=[];for(let k=0;k<=24;k++){const an=k/24*6.283;P.push([x+Math.sin(an)*9*(1-0.5*Math.max(0,-Math.cos(an))),y+Math.cos(an)*-14]);}gline(P,col,2.2,a);}

const BX=320,EX=760,FY=1220;   // 老板 / 员工站位
// ---------------- c0：「你看着办」→ 老板以为是信任 → 员工听到的是：办砸了，算你的 ----------------
SCENES.c0={
 canvas(t,a){const tT=T('v02|信任|s'),tE=T('v03|员工|s'),tZ=T('v03|办砸了|s');
  // 第 0 帧就在：气泡 + 两个小人
  const bq=a*(1-0.35*cl((t-tE)/0.6));bubble(540,760,420,130,'你看着办',IV,bq,56,BX+40);
  line([[200,FY],[880,FY]],IV,1.5,a*0.4);person(BX,FY,1.5,IV,a);person(EX,FY,1.5,IV,a);ctext('老板',BX,FY+36,28,IV,a*0.75);ctext('员工',EX,FY+36,28,IV,a*0.75);
  // 老板那头：亮成「信任」
  const lq=a*up(t,tT-0.25,0.4);if(lq>0){gline(partial([[460,840],[400,880]],lq),AU,2.6,lq);ctext('以为：信任',BX,912,40,AU,lq*(1-0.5*cl((t-tZ)/0.4)));}
  // 员工那头：虚线一路传过去，到「办砸了」裂开
  const rq=a*up(t,tE-0.1,0.4);if(rq>0){line(partial([[620,840],[700,890]],rq),IV,2.2,rq,false,[8,6]);ctext('听到的是……',EX,912,36,IV,rq*0.8*(1-cl((t-tZ)/0.3)));}
  if(t>tZ-0.05)impactRing(t,tZ,540,1010,260,50,a,AU);},
 free(t,a){showText('k0core',{lines:[[['听到：办砸了，',null],['算你的',GOLD]]],size:60,cy:1010},t,T('v03|办砸了|s')-0.08,S.c0.end-TXDUR.out['碎裂']+0.25,'碎裂','碎裂',a);}};

// ---------------- c1：任务交下去 → 三天后三个方案推回来 → 老板火了 / 员工委屈 ----------------
SCENES.c1={
 canvas(t,a){const s1=S.c1.start,tG=T('v04|交下去|s'),tK=T('v04|你看着办|s'),t3=T('v05|三天后|s'),tF=T('v05|三个方案|s'),tP=T('v05|请你挑|s'),tH=T('v06|火了|s'),tQ=T('v06|还要问我|s'),tW=T('v07|委屈|s'),tN=T('v07|你说不对|s');
  line([[200,FY],[880,FY]],IV,1.5,a*0.4);person(BX,FY,1.5,t>tH-0.1&&t<tW?AU:IV,a);person(EX,FY,1.5,t>tW-0.1?AU:IV,a);
  // 任务卡：从老板手里沿弧线递到员工
  const g=eo(cl((t-tG)/1.0)),ga=a*up(t,s1,0.4)*(1-cl((t-t3)/0.4));if(ga>0){const x=lerp(BX+60,EX-70,g),y=1080-Math.sin(Math.PI*g)*160;card(x-60,y-36,x+60,y+36,'任务',IV,ga,30);}
  bubble(BX+60,860,280,90,'你看着办',IV,a*win(t,tK-0.15,t3,0.3),36,BX+10);
  // 三天后：日历翻三页
  const ca=a*win(t,t3-0.1,tH-0.2,0.4);if(ca>0){const n=Math.min(3,1+Math.floor(cl((t-t3)/0.9)*3));card(480,700,600,800,'',IV,ca);ctext(`第 ${n} 天`,540,750,32,IV,ca);}
  // 三个方案扇形推回老板
  const fa=a*up(t,tF-0.15,0.4)*(1-0.6*cl((t-tW)/0.5));if(fa>0)['A','B','C'].forEach((s,i)=>{const m=eo(cl((t-tP+0.1-i*0.12)/0.9));const x=lerp(EX-90+i*10,BX+70+i*70,m),y=lerp(1000-i*90,960-(i-1)*20,m);card(x-48,y-32,x+48,y+32,'方案'+s,IV,fa,26);});
  // 老板火了
  const ha=a*win(t,tH-0.1,tW,0.3);if(ha>0){fume(BX,FY-140,AU,ha,t);bubble(BX+120,780,370,90,'这点事还要问我？',AU,ha*up(t,tQ-0.2,0.3),34,BX+20);}
  // 员工委屈
  const wa=a*up(t,tW-0.1,0.3);if(wa>0){drop(EX+30,FY-150,AU,wa);bubble(EX-110,780,400,90,'上次我定了…',AU,wa,34,EX-10);if(t>tN-0.2)ctext('你说不对',EX-110,860,30,IV,wa*up(t,tN-0.2,0.3));}},
 dom(t){op('k1n',up(t,S.c1.start));}};

// ---------------- c2：问题不在员工不担事 → 四个字少说了三件事 → 结果 / 资源 / 边界 ----------------
SCENES.c2={
 canvas(t,a){const s2=S.c2.start,t4=T('v09|四个字|s'),t3=T('v09|三件事|s');
  // 不担事？——划掉
  const na=a*win(t,s2-0.1,t4-0.1,0.4);if(na>0){person(540,1060,1.8,IV,na);ctext('不担事？',540,800,56,IV,na);const q=eo(cl((t-T('v08|不担事|e')+0.1)/0.4));if(q>0)gline([[420,800],[lerp(420,660,q),800]],AU,4,na);}
  // 四个字，下面浮出三个空格子，再逐个填上
  const fa=a*up(t,t4-0.2,0.4);if(fa>0){bubble(540,720,420,120,'你看着办',IV,fa,52);
   const B=[['结果','v10|要什么结果|s','要什么'],['资源','v10|能动用多少|s','能动用多少'],['边界','v10|回来找你|s','到哪一步回来']];
   B.forEach(([s,k,d],i)=>{const q=up(t,t3-0.1+i*0.15,0.35);if(q<=0)return;const x=280+i*260,y=1010;const on=up(t,T(k)-0.15,0.35);
    line([[540,800],[x,y-90]],IV,1.4,fa*q*0.5,false,[6,6]);
    if(on<1)rect(x-105,y-80,x+105,y+80,IV,2,fa*q*(1-on),[10,8]);
    if(on>0){card(x-105,y-80,x+105,y+80,'',AU,fa*on);ctext(s,x,y-16,48,AU,fa*on);ctext(d,x,y+42,26,IV,fa*on*0.85);}
    else ctext('？',x,y,56,IV,fa*q*0.6);});}}};

// ---------------- c3：说不清就是把风险推给他 → 决定被推回来 → 你越来越忙，团队越来越「不担事」 ----------------
SCENES.c3={
 canvas(t,a){const s3=S.c3.start,tR=T('v11|推给了他|s'),tB=T('v12|推回给你|s'),tM=T('v13|越来越忙|s'),tD=T('v13|不担事|s');
  line([[200,FY],[880,FY]],IV,1.5,a*0.4);person(BX,FY,1.5,IV,a);person(EX,FY,1.5,t>tD-0.1?GR:IV,a);
  // 风险块：从老板滑到员工
  const r=eo(cl((t-tR+0.2)/0.7)),ra=a*up(t,s3,0.4)*(1-cl((t-tB+0.3)/0.4));if(ra>0){const x=lerp(BX+90,EX-100,r);card(x-60,1050,x+60,1130,'风险',r>0.9?AU:IV,ra,30);gline([[BX+30,1150],[lerp(BX+30,EX-40,r),1150]],IV,2,ra*0.6);}
  // 决定卡：被推回老板，来回两趟
  const da=a*up(t,tB-0.3,0.3);if(da>0){const ph=cl((t-tB+0.3)/1.4),x=EX-100-(EX-BX-190)*Math.abs(Math.sin(ph*Math.PI*1.5));card(x-60,1050,x+60,1130,'决定',AU,da*(1-cl((t-tM)/0.4)),30);}
  // 越来越忙：老板身边任务卡越堆越高
  const ma=a*up(t,tM-0.3,0.3);if(ma>0){const n=Math.floor(1+cl((t-tM+0.3)/2.2)*5);for(let i=0;i<n;i++){const sh=Math.sin(t*6+i)*2;card(BX+50+sh,FY-40-i*44,BX+170+sh,FY-6-i*44,'',i===n-1?AU:IV,ma*0.85);}ctext('越来越忙',BX+110,FY-80-n*44,30,AU,ma);}
  if(t>tD-0.2)ctext('「不担事」',EX,FY-200,34,GR,a*up(t,tD-0.2,0.3));},
 free(t,a){showText('k3core',{lines:[[['不是授权，',null]],[['是把风险推给他',GOLD]]],size:68,cy:740},t,T('v11|不是授权|s')-0.25,S.c3.end-TXDUR.out['光扫']-0.05,'光扫','光扫',a);}};

// ---------------- c4：换成三句话 → 结果 / 资源 / 边界填满 → 围成一个框，员工在框里自己走 ----------------
SCENES.c4={
 canvas(t,a){const s4=S.c4.start,t3=T('v14|三句话|s'),tL=T('v16|剩下的|s');
  const S3=[['我要的是：什么结果','v15|我要的是什么|s'],['你能动用：多少','v15|你能动用多少|s'],['超过这条线：先来找我','v15|先来找我|s']];
  const la=a*up(t,s4,0.4)*(1-cl((t-tL+0.2)/0.5));if(la>0){bubble(540,700,360,90,'你看着办',GR,la*(1-0.6*up(t,t3,0.4)),36);
   if(t>t3-0.1){const q=eo(cl((t-t3+0.1)/0.4));gline([[380,700],[lerp(380,700,q),700]],AU,3,la);}
   S3.forEach(([s,k],i)=>{const q=up(t,T(k)-0.15,0.35);const y=850+i*140;card(200,y-52,880,y+52,'',q>0?AU:IV,la*(0.35+0.65*q));ctext(q>0?s:'……',540,y,38,q>0?AU:IV,la*(0.35+0.65*q));});}
  // 剩下的，真的让他看着办：三条变成边界框，员工在里面自己走
  const ba=a*up(t,tL-0.3,0.5);if(ba>0){const q=eo(cl((t-tL+0.3)/0.8));rect(lerp(200,260,q),lerp(798,820,q),lerp(880,820,q),lerp(1182,1200,q),AU,3,ba);ctext('边界',290,850,28,AU,ba,'left');
   const wx=540+Math.sin((t-tL)*1.6)*180;person(wx,1150,1.4,IV,ba);bubble(540,720,300,80,'你看着办',AU,ba*up(t,T('v16|看着办|s')-0.2,0.3),32,540);}}};

// ---------------- c5：授权不是放手不管，是把边界讲清楚 → 你听过最头疼的一句「你看着办」？ ----------------
SCENES.c5={
 canvas(t,a){const s5=S.c5.start,tQ=T('v18|你看着办|s'),tW=T('v18|什么时候|s');
  // 边界框留着，淡一点；员工在里面走
  const ba=a*0.5;rect(260,1000,820,1260,AU,2.4,ba);person(540+Math.sin((t-s5)*1.6)*160,1230,1.2,IV,ba);
  if(t>tQ-0.2){const q=up(t,tQ-0.2,0.4);bubble(540,1080,340,90,'你看着办',IV,a*q,36);ctext('？',740,1050,64,AU,a*up(t,tW-0.1,0.3));}},
 free(t,a){showText('k5core',{lines:[[['授权，不是放手不管，',null]],[['是把边界讲清楚',GOLD]]],size:62,cy:780},t,T('v17|授权|s')-0.1,1e9,'逐字','逐字',a);}};
