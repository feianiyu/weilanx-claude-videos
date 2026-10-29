// =====================================================================
// 《你的公司，现在卖得掉吗？》· 本期场景（标准版，画面均为示意）
// 文字效果（3 种）：碎裂（c2 你越急它越不值钱）· 光扫（c3 买的是你这个人）· 逐字（c5 卖不掉的公司，等于你被它拴住了）
// 贯穿道具：公司小楼 + 一张价签
// =====================================================================
const GOLD='#F0B429';
const up=(t,t0,d)=>eo(cl((t-t0)/(d||0.4)));
const win=(t,a0,a1,d)=>up(t,a0,d)*(1-cl((t-a1)/(d||0.4)));
function ctext(s,x,y,size,col,a,align){if(a<=0.003)return;X.save();X.font=`800 ${size}px NSC`;X.textAlign=align||'center';X.textBaseline='middle';X.fillStyle=rgba(col,a);X.fillText(s,x,y);X.restore();}
function rect(x0,y0,x1,y1,col,w,a,dash){line([[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]],col,w,a,false,dash);}
function card(x0,y0,x1,y1,s,col,a,size){if(a<=0.003)return;X.fillStyle=rgba('#0E0C09',0.62*a);X.fillRect(x0,y0,x1-x0,y1-y0);rect(x0,y0,x1,y1,col,1.8,a*0.9);if(s)ctext(s,(x0+x1)/2,(y0+y1)/2,size||32,col,a);}
function circ(cx,cy,r,col,w,a,f0,f1){const P=[];const A=f0||0,B=f1===undefined?6.283:f1;for(let k=0;k<=48;k++){const an=lerp(A,B,k/48);P.push([cx+Math.cos(an)*r,cy+Math.sin(an)*r]);}gline(P,col,w,a);}
function bar(x0,x1,base,h,col,a){if(h<=0.5||a<=0.003)return;const g=X.createLinearGradient(0,base-h,0,base);g.addColorStop(0,rgba(col,0.5*a));g.addColorStop(1,rgba(col,0.06*a));X.fillStyle=g;X.fillRect(x0,base-h,x1-x0,h);gline([[x0,base],[x0,base-h],[x1,base-h],[x1,base]],col,2,a);}
function person(x,y,s,col,a,pose){if(a<=0.003)return;circ(x,y-66*s,11*s,col,2.4,a);gline([[x,y-54*s],[x,y-24*s]],col,2.6,a);gline([[x,y-24*s],[x-9*s,y]],col,2.6,a);gline([[x,y-24*s],[x+9*s,y]],col,2.6,a);
 if(pose==='hug')gline([[x-6*s,-0+y-48*s],[x+26*s,y-40*s],[x+30*s,y-30*s]],col,2.4,a);else{gline([[x,y-48*s],[x-12*s,y-30*s]],col,2.4,a);gline([[x,y-48*s],[x+12*s,y-30*s]],col,2.4,a);}}
// 公司小楼
function company(cx,by,w,h,col,a,lit){if(a<=0.003)return;card(cx-w/2,by-h,cx+w/2,by,'',col,a);for(let r=0;r<Math.floor(h/46);r++)for(let c=0;c<Math.floor(w/52);c++){const on=lit===undefined?0.5:lit;X.fillStyle=rgba(on>0.5?AU:IV,(0.12+0.4*on*((r*7+c*3)%5>1?1:0.3))*a);X.fillRect(cx-w/2+16+c*52,by-h+16+r*46,26,22);}}
// 价签：挂绳 + 签身 + 文字
function tag(x,y,s,col,a,rot,size){if(a<=0.003)return;X.save();X.translate(x,y);X.rotate(rot||0);const P=[[0,0],[40,-26],[200,-26],[200,26],[40,26],[0,0]];gline(P,col,2.4,a);X.fillStyle=rgba('#0E0C09',0.7*a);X.beginPath();P.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.fill();gline(P,col,2.4,a);circ(26,0,6,col,2,a);ctext(s,120,0,size||32,col,a);X.restore();}

// ---------------- c0：做了二十年一直赚钱 → 今天想退出，卖得掉吗 ----------------
SCENES.c0={
 canvas(t,a){const t1=T('v01|十几二十年|s'),tE=T('v02|退出|s'),tS=T('v02|卖得掉吗|s'),tM=T('v02|能卖多少|s');
  line([[200,1220],[880,1220]],IV,1.5,a*0.45);
  // 二十根年度柱子一根根长出来（第一帧就有前几根）
  for(let k=0;k<20;k++){const q=up(t,-0.2+k*((t1+2.2)/20),0.4);bar(212+k*33,236+k*33,1220,(30+k*6+Math.sin(k*1.3)*10)*q,AU,a*0.55);}
  company(540,1100,260,300,IV,a*up(t,0,0.5),0.4+0.4*cl((t-t1)/2));
  // 退出：右侧一个出口箭头
  const eq=a*up(t,tE-0.1,0.4);if(eq>0){rect(780,800,880,1100,IV,2,eq,[8,6]);gline([[720,960],[840,960]],AU,3,eq);line([[820,940],[840,960],[820,980]],AU,3,eq);ctext('退出',830,1140,30,IV,eq);}
  // 卖得掉吗：价签挂在楼上，一直在晃
  const tq=a*up(t,tS-0.1,0.4);if(tq>0){const sw=Math.sin(t*2.2)*0.06;line([[640,800],[640,740]],IV,1.5,tq);tag(640,740,t>tM?'¥ ？':'？',AU,tq,0.12+sw,t>tM?36:44);}},
};

// ---------------- c1：二十年的老板 → 高价上门他没卖 → 现金流紧了回头想卖 → 压价一半、不接电话 ----------------
SCENES.c1={
 canvas(t,a){const s1=S.c1.start,tD=T('v04|上门|s'),tO=T('v04|出价不低|s'),tR=T('v05|舍不得|s'),tC=T('v06|现金流紧|s'),tB=T('v06|回头想卖|s'),tG=T('v06|同一批买家|s'),tH=T('v06|压价一半|s'),tP=T('v06|不接电话|s');
  line([[200,1220],[880,1220]],IV,1.5,a*0.45);
  company(320,1200,200,240,IV,a,0.6-0.4*cl((t-tC)/0.8));person(460,1220,1.3,IV,a,t>tR&&t<tB?'hug':0);ctext('做了二十年',320,1240,28,IV,a*0.7);
  // 现金流：楼下一根金条在缩短、变灰
  const cq=a*up(t,s1+0.2,0.4);if(cq>0){const lv=1-0.75*eo(cl((t-tC+0.1)/1.2));X.fillStyle=rgba(t>tC?GR:AU,0.6*cq);X.fillRect(220,1250,200*lv,14);rect(220,1250,420,1264,IV,1,cq*0.5);ctext('现金流',470,1257,26,IV,cq*0.7,'left');}
  // 第一次：买家上门，出高价；他舍不得，买家走了
  const b1=a*win(t,tD-0.2,tC-0.3,0.5);if(b1>0){const walk=eo(cl((t-tD+0.2)/1.0)),leave=eo(cl((t-tR-0.6)/1.2));[0,1,2].forEach(i=>person(lerp(960,640+i*70,walk)+leave*260,1220,1.1,IV,b1*(1-leave),0));
   const oq=up(t,tO-0.1,0.3)*(1-leave);if(oq>0)tag(620,860,'高价',AU,b1*oq,0,34);if(oq>0)ctext('出价不低',720,800,30,AU,b1*oq);}
  // 第二次：回头想卖，同一批买家
  const b2=a*up(t,tG-0.2,0.5);if(b2>0){[0,1,2].forEach(i=>{const off=i===2&&t>tP?1:0;person(640+i*90,1220,1.1,i===2&&t>tP?GR:IV,b2*(1-0.5*off),0);});
   const h=eo(cl((t-tH+0.1)/0.4));if(h>0){tag(600,880,h>0.5?'半价':'原价',h>0.5?IV:AU,b2,0,34);ctext('压价一半',700,820,30,AU,b2*h);gline([[640,900],[lerp(640,800,h),860]],AU,3,b2*h);impactRing(t,tH+0.1,700,880,120,40,b2,AU);}
   const pq=up(t,tP-0.1,0.3);if(pq>0){card(790,1000,860,1110,'',GR,b2*pq);for(let k=0;k<3;k++){const q=((t-tP)*1.4+k/3)%1;circ(825,1055,40+40*q,GR,1.4,b2*pq*(1-q)*0.7,-0.8,0.8);}ctext('不接电话',825,1150,28,GR,b2*pq);}}
  if(t>tB-0.2){const q=up(t,tB-0.2,0.4);gline([[500,1120],[lerp(500,600,q),1120]],IV,2,a*q*(1-cl((t-tG)/0.4)));}}};

// ---------------- c2：最值钱的时候最不想卖 → 撑不住才卖，买家闻到味道 → 腰斩 ----------------
const VAL=[[220,1180],[340,1060],[460,900],[560,820],[660,880],[760,1000],[860,1100]],WANT=[[220,1200],[340,1190],[460,1170],[560,1160],[660,1080],[760,900],[860,760]];
SCENES.c2={
 canvas(t,a){const s2=S.c2.start,tV=T('v08|最值钱|s'),tW=T('v08|舍不得卖|s'),tC=T('v09|撑不住|s'),tN=T('v09|闻到味道|s'),tY=T('v09|腰斩|s'),tJ=T('v10|越急|s');
  const ca=a*(1-0.75*cl((t-tJ+0.3)/0.5));
  line([[200,1220],[880,1220]],IV,1.5,ca*0.5);line([[200,1220],[200,700]],IV,1.5,ca*0.5);ctext('时间',870,1250,26,IV,ca*0.6,'right');
  const q1=eo(cl((t-s2-0.1)/1.6));gline(partial(VAL,q1),AU,3,ca);if(q1>0.95)ctext('公司值多少',870,1130,28,AU,ca,'right');
  const q2=eo(cl((t-tV+0.2)/1.6));gline(partial(WANT,q2),IV,2.6,ca*0.8);if(q2>0.95)ctext('你想不想卖',870,720,28,IV,ca,'right');
  if(t>tV){const q=up(t,tV,0.3);dot(560,820,7,AU,ca*q);ctext('最值钱',560,780,28,AU,ca*q);}
  if(t>tW){const q=up(t,tW,0.4);dot(560,1160,6,IV,ca*q);line([[560,830],[560,1150]],IV,1.5,ca*q*0.7,false,[6,6]);ctext('最不想卖',600,1130,28,IV,ca*q,'left');}
  // 撑不住、急着出手：买家闻到味道，价值那头腰斩
  if(t>tC){const q=up(t,tC,0.3);dot(860,760,7,IV,ca*q);ctext('急着出手',830,800,28,IV,ca*q,'right');}
  if(t>tN){for(let k=0;k<3;k++){const q=((t-tN)*0.9+k/3)%1;circ(860,760,30+80*q,AU,1.6,ca*(1-q)*0.6,Math.PI*0.6,Math.PI*1.3);}}
  if(t>tY-0.1){const q=eo(cl((t-tY+0.1)/0.3));line([[860,1100],[860,lerp(1100,1160,q)]],AU,3,ca);dot(860,lerp(1100,1160,q),7,AU,ca);ctext('腰斩',820,1170,30,AU,ca*q,'right');impactRing(t,tY,860,1160,90,30,ca,AU);}},
 free(t,a){const tJ=T('v10|越急|s');showText('k2core',{lines:[[['你越急，',null]],[['它越不值钱',GOLD]]],size:80,cy:940},t,T('v10|不值钱|s')-0.5,S.c2.end-TXDUR.out['碎裂']+0.2,'碎裂','碎裂',a);},
 dom(t){op('k2n',up(t,S.c2.start));}};

// ---------------- c3：看过的卖家 → 值钱的公司离了你照样转 → 什么都压在你身上，买的就是你 → 不值钱 ----------------
function hub(cx,cy,a,t,mode,t0){   // mode 0：离了老板照样转；1：什么都连在老板身上
 const N=[['账目',-2.2],['客户',-1.2],['团队',-0.2],['订单',0.8],['关系',1.8]];
 if(mode===0){company(cx,cy+140,300,300,AU,a,0.9);const g=(t-t0)*1.2;const P=[];for(let k=0;k<=36;k++){const u=k/36*6.283,rr=44+(Math.floor(k/3)%2?10:0);P.push([cx+Math.cos(u+g)*rr,cy-40+Math.sin(u+g)*rr]);}gline(P,AU,2.4,a);}
 else{N.forEach(([s,an],i)=>{const x=cx+Math.cos(an)*230,y=cy+Math.sin(an)*170;const q=up(t,t0+i*0.15,0.3);gline([[cx,cy],[lerp(cx,x,q),lerp(cy,y,q)]],IV,2,a*q);card(x-60,y-26,x+60,y+26,s,IV,a*q,28);});person(cx,cy+60,1.6,AU,a,0);circ(cx,cy,90,AU,2,a*0.7);}}
SCENES.c3={
 canvas(t,a){const s3=S.c3.start,tK=T('v11|卖家|s'),tC=T('v12|共同点|s'),tL=T('v12|离了老板|s'),tR=T('v13|反过来|s'),tY=T('v13|是你这个人|s'),tZ=T('v14|不值钱|s');
  // 看过的卖家：一排排公司从眼前流过
  const fa=a*win(t,s3,tC,0.5);if(fa>0)for(let i=0;i<24;i++){const ph=((t-s3)*0.18+rnd(i*2.7))%1;const x=lerp(180,900,ph),y=720+(i%4)*120;company(x,y+60,70,80,IV,fa*Math.sin(Math.PI*ph)*0.8,0.3);}
  if(t>s3+0.2&&t<tC+0.4)ctext('20 多年 · 看过的卖家',540,1240,32,AU,fa);
  // 好卖的公司：老板退到一边，公司照样转；三项一项项亮
  const ga=a*win(t,tC-0.2,tR-0.3,0.5);if(ga>0){const off=eo(cl((t-tL)/0.8));person(lerp(540,820,off),lerp(760,1220,off),1.2,IV,ga*(1-0.5*off),0);hub(540,880,ga,t,0,tC);
   [['账目清楚','v12|账目清楚|s'],['客户认公司','v12|客户不只认你|s'],['团队顶得上','v12|团队顶得上|s']].forEach(([s,k],i)=>{const q=up(t,T(k)-0.1,0.3);if(q>0){card(200+i*240,1150,400+i*240,1210,s,AU,ga*q,28);}});}
  // 反过来：什么都连在老板一个人身上
  const ha=a*up(t,tR-0.2,0.5);if(ha>0){hub(540,960,ha*(1-0.5*cl((t-tY)/0.6)),t,1,tR);if(t>tZ-0.2){const q=eo(cl((t-tZ+0.2)/0.8));tag(700,1180+q*60,'价格',GR,ha*(1-q*0.4),0.3+q*0.6,32);ctext('不值钱',820,1290,30,GR,ha*up(t,tZ,0.3));}}},
 free(t,a){showText('k3core',{lines:[[['买的不是公司，',null]],[['是你这个人',GOLD]]],size:72,cy:720},t,T('v13|不是公司|s')-0.25,S.c3.end-TXDUR.out['光扫']-0.05,'光扫','光扫',a);},
 dom(t){op('k3n',up(t,T('v12|共同点|s')));}};

// ---------------- c4：不缺钱时就收拾成随时能卖 → 有的选 → 明天就做的三件事 ----------------
SCENES.c4={
 canvas(t,a){const s4=S.c4.start,tT=T('v15|收拾成|s'),tA=T('v15|随时能卖|s'),tO=T('v16|有的选|s'),t3=T('v17|三件事|s');
  // 乱线 → 理成整齐的格子
  const ma=a*win(t,s4,tO-0.2,0.5);if(ma>0){const tidy=eo(cl((t-tT)/1.2));for(let i=0;i<14;i++){const r=Math.floor(i/7),c=i%7;const gx=250+c*90,gy=820+r*120;const rx=200+rnd(i*3)*680,ry=700+rnd(i*5)*420;const x=lerp(rx,gx,tidy),y=lerp(ry,gy,tidy),an=lerp(rnd(i*7)*3,0,tidy);
    X.save();X.translate(x,y);X.rotate(an);rect(-34,-24,34,24,tidy>0.9?AU:IV,1.6,ma*0.8);X.restore();}
   if(t>tA)tag(380,1120,'随时能卖',AU,ma*up(t,tA,0.3),0,32);}
  // 有的选：两扇门都亮着
  const oa=a*win(t,tO-0.2,t3-0.2,0.4);if(oa>0){card(260,760,460,1100,'',AU,oa);card(620,760,820,1100,'',AU,oa);ctext('卖',360,930,48,AU,oa);ctext('不卖',720,930,48,AU,oa);}
  // 三件事
  const la=a*up(t,t3-0.2,0.4);if(la>0)[['把账理干净','v17|把账理干净|s'],['大客户认公司','v17|认公司|s'],['分一件事出去','v17|分一件出去|s']].forEach(([s,k],i)=>{const q=up(t,T(k)-0.2,0.35);const y=780+i*150;card(240,y-50,840,y+50,'',q>0?AU:IV,la*(0.4+0.6*q));ctext(s,560,y,36,q>0?AU:IV,la*(0.4+0.6*q));
   if(q>0)gline(partial([[300,y],[320,y+20],[356,y-22]],q),AU,4,la);});}};

// ---------------- c5：刚起步不急 → 过了生存线越早越主动 → 更抗折腾、更值钱 → 卖不掉的公司，等于你被它拴住了 ----------------
SCENES.c5={
 canvas(t,a){const s5=S.c5.start,tS=T('v18|刚起步|s'),tL=T('v19|生存线|s'),tE=T('v19|越早|s'),tK=T('v20|抗折腾|s'),tV=T('v20|更值钱|s');
  line([[200,1240],[880,1240]],IV,1.5,a*0.45);
  const P=[[220,1230],[320,1215],[420,1180],[520,1110],[620,1040],[720,990],[820,960]];const q=eo(cl((t-s5)/1.6));gline(partial(P,q),AU,3,a);
  if(t>tS-0.1){const sq=up(t,tS-0.1,0.3);dot(260,1225,6,IV,a*sq);ctext('刚起步：先不急',300,1280,28,IV,a*sq,'left');}
  if(t>tL-0.2){const lq=eo(cl((t-tL+0.2)/0.7));gline([[200,1120],[lerp(200,880,lq),1120]],AU,2.4,a*0.9);ctext('生存线',220,1090,28,AU,a*lq,'left');}
  if(t>tE){const eq=up(t,tE,0.5);gline([[560,1100],[560,lerp(1100,980,eq)]],AU,3,a*eq);line([[546,994],[560,980],[574,994]],AU,3,a*eq);ctext('越早越主动',580,1010,28,AU,a*eq,'left');}
  // 抗折腾：一栋楼被晃，但站得住
  if(t>tK-0.2){const kq=up(t,tK-0.2,0.4),sh=Math.sin((t-tK)*14)*8*Math.exp(-(t-tK)*1.5);company(790+sh,1230,150,200,t>tV?AU:IV,a*kq,t>tV?0.9:0.4);}},
 free(t,a){showText('k5core',{lines:[[['卖不掉的公司，',null]],[['等于你被它拴住了',GOLD]]],size:68,cy:800},t,T('v20|更值钱|s')+0.3,1e9,'逐字','逐字',a);}};
