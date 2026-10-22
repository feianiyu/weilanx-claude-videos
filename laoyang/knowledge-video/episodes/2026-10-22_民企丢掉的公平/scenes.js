// =====================================================================
// 《民企丢掉的公平》深度版 · 本期场景
// 文字效果（3 种入场）：碎裂（c0 规则公平 / c4 分配问题）· 水流→融化（c2 利润越摊越薄）· 光扫（c6 是公平）
// 重点段：c6「鸟笼里轻舞飞扬」——金色鸟笼、光之鸟起舞拖出光带、撞上笼顶时间变慢、三根栏杆化开、鸟飞出
// =====================================================================
const GOLD='#F0B429';
function bar(x0,x1,base,h,col,a){if(h<=0.5||a<=0.003)return;const g=X.createLinearGradient(0,base-h,0,base);g.addColorStop(0,rgba(col,0.5*a));g.addColorStop(1,rgba(col,0.06*a));
 X.fillStyle=g;X.fillRect(x0,base-h,x1-x0,h);gline([[x0,base],[x0,base-h],[x1,base-h],[x1,base]],col,2,a);}
function hbar(x0,y,len,hh,col,a){if(len<=0.5||a<=0.003)return;const g=X.createLinearGradient(x0,0,x0+len,0);g.addColorStop(0,rgba(col,0.08*a));g.addColorStop(1,rgba(col,0.5*a));
 X.fillStyle=g;X.fillRect(x0,y-hh/2,len,hh);gline([[x0,y-hh/2],[x0+len,y-hh/2],[x0+len,y+hh/2],[x0,y+hh/2]],col,1.6,a);}
function ctext(s,x,y,size,col,a,align){if(a<=0.003)return;X.save();X.font=`800 ${size}px NSC`;X.textAlign=align||'left';X.textBaseline='middle';X.fillStyle=rgba(col,a);X.fillText(s,x,y);X.restore();}
const up=(t,t0,d)=>eo(cl((t-t0)/(d||0.4)));
const fmt1=v=>v.toFixed(1);
// 10×10 点阵（c1 调研、c4 债券共用）
const GX=i=>220+(i%10)*40, GY=i=>680+Math.floor(i/10)*40;

// ---------------- c0：每百元资产的营业收入 → 规则公平 ----------------
const BASE0=1180,K0=4.4;
function c0fade(t){return (1-0.8*cl((t-T('v03|很多人|s'))/0.5))*(1-cl((t-T('v04|我不|s'))/0.4));}
SCENES.c0={
 canvas(t,a){const t0=T('v01|同样|s'),tL=T('v01|九十六|s'),tR=T('v01|五十六|s'),tg=T('v02|七成|s');const fd=a*c0fade(t);
  // 第一帧就有内容：100 元资产 = 100 个金点，说到「九十六」时散开
  const pre=a*(1-cl((t-tL+0.3)/0.6));if(pre>0)for(let i=0;i<100;i++){const sp=eo(cl((t-tL+0.3)/0.6));const x=441+(i%10)*22,y=800+Math.floor(i/10)*22,an=rnd(i*3.7)*6.283;
   dot(x+nz(i,t,0.5)*2+Math.cos(an)*120*sp,y+nz(i+9,t,0.5)*2+Math.sin(an)*120*sp,2.6,AU,pre*(0.55+0.3*Math.sin(t*2+i*0.4)));}
  line([[220,BASE0],[860,BASE0]],IV,1.5,0.4*fd*up(t,t0));
  // 「我不这么看」→「规则公平」：一条金色的规则基线从中间画开，公平落在线上
  const tn2=T('v04|我不|s'),tf2=T('v04|公平|s'),rq=eo(cl((t-tn2-0.2)/Math.max(0.4,tf2-tn2-0.1)));
  if(rq>0){const hw=330*rq,ra=a*(1-cl((t-S.c0.end+1.0)/0.6));gline([[540-hw,1052],[540+hw,1052]],AU,2.4,ra);if(rq<1){dot(540-hw,1052,4,AU,ra);dot(540+hw,1052,4,AU,ra);}}
  const hL=96.4*K0*up(t,tL-0.2,0.9),hR=55.7*K0*up(t,tR-0.2,0.9);
  bar(300,420,BASE0,hL,AU,fd);bar(640,760,BASE0,hR,IV,fd*0.75);
  const g=up(t,tg-0.2,0.5);if(g>0){const yL=BASE0-96.4*K0,yR=BASE0-55.7*K0;line([[760,yR],[800,yR]],IV,1.5,fd*g*0.6,false,[6,6]);line([[420,yL],[800,yL]],AU,1.5,fd*g*0.6,false,[6,6]);
   gline([[800,yR],[800,lerp(yR,yL,g)]],AU,3,fd);}
  // 「我不这么看」：两张标签化成烟
  const tn=T('v04|我不|s');if(t>tn)smoke(t,tn,540,900,520,120,9,a,610);},
 free(t,a){const tf=T('v04|公平|s');
  showText('m0core',{lines:[[['规则公平',GOLD]]],size:88,cy:960},t,tf-0.5,S.c0.end-TXDUR.out['雾散']-0.15,'碎裂','雾散',a);
  impactRing(t,tf+0.05,540,960,300,90,a,AU);},
 dom(t){const t0=T('v01|同样|s'),tL=T('v01|九十六|s'),tR=T('v01|五十六|s'),fd=c0fade(t);
  op('m0cap',up(t,t0)*fd);
  const pL=cl((t-tL+0.2)/0.9),pR=cl((t-tR+0.2)/0.9);
  const eL=rise('m0nL',up(t,tL-0.2,0.3)*fd);eL.style.top=(BASE0-96.4*K0*eo(pL)-104).toFixed(1)+'px';countUp('m0nL',96.4,pL,fmt1);
  const eR=rise('m0nR',up(t,tR-0.2,0.3)*fd);eR.style.top=(BASE0-55.7*K0*eo(pR)-104).toFixed(1)+'px';countUp('m0nR',55.7,pR,fmt1);
  op('m0lL',up(t,tL-0.3)*fd);op('m0lR',up(t,tR-0.3)*fd);op('m0src',up(t,tL)*fd);
  const g=rise('m0gap',up(t,T('v02|七成|s'),0.3)*fd);g.style.top=(BASE0-(96.4+55.7)/2*K0-26).toFixed(1)+'px';
  const tn=T('v04|我不|s'),out=1-cl((t-tn)/0.3);
  rise('m0p1',up(t,T('v03|利润|s')-0.1,0.3)*out);rise('m0p2',up(t,T('v03|市场|s')-0.1,0.3)*out);
  op('m0src2',up(t,T('v05|官方|s'),0.5));}};

// ---------------- c1：民间投资占比 → 22% 想扩张 → 看不清 ----------------
const PY=v=>900-(v-50)*24, P15=[260,PY(56.2)], P24=[820,PY(50.1)];
const G1=[...Array(100).keys()].map(i=>i<22?0:i<48?1:i<73?2:3);   // 22 扩大 · 26 观望 · 25 不投 · 其他
SCENES.c1={
 canvas(t,a){const t15=T('v07|二零一五|s'),t24=T('v07|二零二四|s'),tg=T('v09|一份|s');const cf=a*(1-cl((t-tg+0.3)/0.4));
  // 「先看最直接的信号」：一条越来越弱的心跳线，说到 2015 时让位给折线
  const s1=S.c1.start,ea=a*up(t,s1,0.4)*(1-cl((t-t15+0.4)/0.5));
  if(ea>0){const P=[];const amp=120-70*cl((t-s1)/3.5);for(let k=0;k<=150;k++){const x=180+k*4.8,ph=k/150*5-(t-s1)*1.6,u=((ph%1.25)+1.25)%1.25;
    P.push([x,900-amp*(Math.exp(-Math.pow((u-0.6)*14,2))-0.35*Math.exp(-Math.pow((u-0.68)*16,2)))]);}gline(P,AU,2.4,ea);}
  if(cf>0){line([[200,900],[880,900]],IV,1.5,0.35*cf*up(t,t15-0.3),false,[8,8]);
   dot(P15[0],P15[1],6,IV,cf*up(t,t15,0.25));
   const q=eo(cl((t-t24+0.2)/1.0));gline(partial([P15,P24],q),AU,3,cf*(q>0?1:0));if(q>=1)dot(P24[0],P24[1],6,AU,cf);
   impactRing(t,T('v08|六点四|s'),330,1036,200,40,cf,AU);}
  // 调研点阵
  const gq=cl((t-tg+0.2)/0.6);if(gq<=0)return;const tE=T('v09|扩大|s'),tW=T('v10|观望|s'),tN=T('v10|不投|s'),tH=T('v10|超过一半|s'),tF=T('v11|看不清|s');
  const fog=1-0.65*cl((t-tF)/1.2);
  for(let i=0;i<100;i++){const k=G1[i],pin=cl((gq-i*0.004)*3);if(pin<=0)continue;
   let col=IV,al=0.18;
   if(k===0&&t>tE){col=AU;al=0.95;}else if(k===1&&t>tW){col=IV;al=0.85;}else if(k===2&&t>tN){col=GR;al=0.95;}
   if((k===1||k===2)&&t>tH)al*=0.75+0.25*Math.sin((t-tH)*6+i*0.3);
   dot(GX(i),GY(i),k===0&&t>tE?5:4,col,a*pin*al*fog);}
  if(t>tH){const q=up(t,tH,0.4);line([[600,GY(22)],[612,GY(22)],[612,GY(72)],[600,GY(72)]],IV,2,a*q*0.8*fog);}
  if(t>tF)smoke(t,tF,400,860,420,360,12,a,321);},
 dom(t){const tc=T('v07|民间投资|s'),t15=T('v07|二零一五|s'),t24=T('v07|二零二四|s'),tg=T('v09|一份|s');const cf=1-cl((t-tg+0.3)/0.4);
  op('m1cap',up(t,tc)*cf);op('m1half',up(t,t15)*cf*0.8);op('m1y0',up(t,t15)*cf);rise('m1a',up(t,t15+0.2,0.3)*cf);
  op('m1y1',up(t,t24)*cf);rise('m1b',up(t,T('v07|五十点一|s'),0.3)*cf);
  const d=rise('m1dn',up(t,T('v08|六点四|s')-0.15,0.2)*cf);d.style.color=t>T('v08|六点四|s')?'#F0B429':'';op('m1src',up(t,t15)*cf);
  const tH=T('v10|超过一半|s'),tF=T('v11|看不清|s'),fog=1-0.6*cl((t-tF)/1.2);
  rise('m1g0',up(t,T('v09|扩大|s'),0.3)*fog);rise('m1g1',up(t,T('v10|观望|s'),0.3)*fog);rise('m1g2',up(t,T('v10|不投|s'),0.3)*fog);rise('m1sum',up(t,tH,0.3)*fog);
  rise('m1mf',up(t,T('v11|制造业|s'),0.3));op('m1src2',up(t,tg));}};

// ---------------- c2：蛋糕不变大 → PPI 三年 → 利润率 → 越摊越薄 → 欠款冰山 ----------------
const CK=[540,900];
function cake(t,cx,cy,r,a,slices,jit,seed){if(a<=0.003)return;
 gline([...Array(73)].map((_,k)=>[cx+Math.cos(k/72*6.283)*r,cy+Math.sin(k/72*6.283)*r*0.92]),IV,2,a*0.8);
 for(let s=0;s<slices;s++){const an=s/slices*6.283+0.3;line([[cx,cy],[cx+Math.cos(an)*r,cy+Math.sin(an)*r*0.92]],IV,1,a*0.35);}
 for(let i=0;i<90;i++){const rr=Math.sqrt(rnd(seed+i))*r*0.86,an=rnd(seed+i*3)*6.283;
  const x=cx+Math.cos(an)*rr+nz(i,t,2.2)*jit,y=cy+Math.sin(an)*rr*0.92+nz(i+50,t,2.0)*jit;dot(x,y,2.2,i%9?IV:AU,a*0.7);}}
SCENES.c2={
 canvas(t,a){const s0=S.c2.start,tP=T('v13|工业品|s'),tR=T('v14|私营|s'),tL=T('v15|利润|s'),tD=T('v16|收不回来|s'),tI=T('v17|一万多亿|s'),tU=T('v17|普遍|s');
  // 存量里拼：蛋糕里挤满了人
  const c1=a*up(t,s0+0.1,0.6)*(1-cl((t-tP+0.3)/0.4));cake(t,CK[0],CK[1],190,c1,0,10,100);
  // PPI 三年
  const pf=a*(1-cl((t-tL+0.6)/0.4));
  if(t>tP-0.3&&pf>0){line([[280,760],[800,760]],IV,1.5,0.6*pf*up(t,tP-0.3));
   [[360,3.0,0],[540,2.2,0.25],[720,2.6,0]].forEach(([x,v,dl],j)=>{const tj=j<2?tP+0.3+j*0.25:T('v13|二点六|s')-0.2;const h=v*60*up(t,tj,0.6);bar(x-40,x+40,760+h,h,j===2?AU:IV,pf*(j===2?1:0.6));});}
  // 利润率
  if(t>tR-0.3&&pf>0){const q0=up(t,tR-0.2,0.8),q1=up(t,T('v14|四点五一|s')-0.2,0.8);hbar(400,1080,5.31*80*q0,26,IV,pf*0.7);hbar(400,1180,4.51*80*q1,26,AU,pf);
   const g=up(t,T('v14|零点八|s')-0.1,0.4);if(g>0){line([[400+4.51*80,1150],[400+5.31*80,1150]],AU,2,pf*g,false,[5,5]);}}
  // 越摊越薄：切片越来越多，挤得越来越凶；虚线圈想变大又缩回
  const cq=a*up(t,tL-0.4,0.6)*(1-cl((t-tD+0.2)/0.5));
  if(cq>0){const sl=Math.round(6+44*cl((t-tL)/2.0)),jit=8+16*cl((t-T('v15|力气|s'))/1.2);cake(t,540,850,170,cq,sl,jit,300);
   const tg=T('v15|蛋糕|s'),gq=Math.sin(Math.PI*cl((t-tg)/1.6));if(gq>0)line([...Array(73)].map((_,k)=>[540+Math.cos(k/72*6.283)*(170+50*gq),850+Math.sin(k/72*6.283)*(170+50*gq)*0.92]),IV,1.5,cq*0.5*gq,false,[8,8]);}
  // 钱收不回来：金色一直往外流，灰色只回来零星几个
  const tH=T('v16|收不回来|s'),fl=a*up(t,tH-0.2,0.4)*(1-cl((t-tI+0.4)/0.5));
  if(fl>0){ctext('企业',250,1000,34,IV,fl,'center');ctext('应收账款',830,1000,34,IV,fl,'center');line([[310,960],[740,960]],IV,1.5,fl*0.4);line([[740,1040],[310,1040]],IV,1.5,fl*0.3,false,[6,8]);
   for(let i=0;i<40;i++){const ph=((t-tH)*0.45+i/40)%1;if(ph<0)continue;dot(lerp(310,740,ph),960+Math.sin(ph*9+i)*4,3,AU,fl*Math.sin(Math.PI*ph));}
   for(let i=0;i<5;i++){const ph=((t-tH)*0.22+i/5)%1;if(ph<0)continue;dot(lerp(740,310,ph),1040,2.4,GR,fl*0.8*Math.sin(Math.PI*ph));}}
  // 欠款冰山
  const ia=a*up(t,tI-0.2,0.6);if(ia>0){line([[200,1030],[880,1030]],IV,1.5,ia*0.5,false,[10,8]);gline([[470,1030],[540,890],[610,1030]],AU,3,ia);
   const uq=eo(cl((t-tU+0.2)/1.4));if(uq>0){const B=[[470,1030],[330,1170],[420,1300],[660,1310],[770,1160],[610,1030]];gline(partial(B,uq),IV,2,ia*0.45);
    if(uq>0.98){X.save();X.beginPath();B.forEach((p,k)=>k?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.closePath();X.fillStyle=rgba(IV,0.06*ia);X.fill();X.restore();}}}},
 free(t,a){const tL=T('v15|利润|s');
  showText('m2core',{lines:[[['利润',GOLD],['越摊越薄',null]]],size:80,cy:1185},t,tL-0.25,T('v16|收不回来|s'),'水流','融化',a,0.3);},
 dom(t){const tP=T('v13|工业品|s'),tR=T('v14|私营|s'),tL=T('v15|利润|s'),tD=T('v16|一点二万亿|s');const pf=1-cl((t-tL+0.6)/0.4);
  op('m2cap',up(t,tP-0.3)*pf);[0,1,2].forEach(j=>{const tj=j<2?tP+0.3+j*0.25:T('v13|二点六|s')-0.2;op('m2y'+j,up(t,tP-0.2)*pf);rise('m2v'+j,up(t,tj+0.4,0.3)*pf);});
  op('m2r0',up(t,tR-0.2)*pf);op('m2r1',up(t,T('v14|四点五一|s')-0.2)*pf);rise('m2gap',up(t,T('v14|零点八|s'),0.3)*pf);op('m2src',up(t,tP)*pf);
  rise('m2debt',up(t,tD-0.2,0.3));countUp('m2debt',1.2,(t-tD+0.2)/0.8,v=>v.toFixed(1)+'万亿');op('m2debtl',up(t,tD));op('m2src2',up(t,tD));
  op('m2ice',up(t,T('v17|普遍|s')+0.8));}};

// ---------------- c3：往外走 → 外贸 57.3% → 为了活下去 ----------------
SCENES.c3={
 canvas(t,a){const s0=S.c3.start,tw=T('v18|往外走|s'),tn=T('v19|五十七点三|s'),tb=T('v20|出海|s');
  line([[540,640],[540,1260]],IV,1.5,0.4*a*up(t,s0),false,[8,10]);
  const gauge=up(t,T('v19|二零二五|s')-0.2,0.5)*(1-cl((t-tb+0.2)/0.5));
  const sa=a*up(t,tw-0.4,0.8)*(1-0.6*gauge);
  // 国内挤：章节一开始左边先挤满
  const crowd=a*up(t,s0,0.5)*(1-cl((t-tw+0.2)/0.6));if(crowd>0)for(let i=0;i<140;i++){const x=220+rnd(i*2.1)*290+nz(i,t,2.4)*10,y=690+rnd(i*4.3)*540+nz(i+40,t,2.1)*10;dot(x,y,2.2,IV,crowd*0.75);}
  // 出海：右边一条海平线
  const hz=a*up(t,tb-0.2,0.6);if(hz>0){const P=[];for(let k=0;k<=60;k++)P.push([560+k*6,1190+Math.sin(k*0.35+t*2)*6]);gline(P,AU,2,hz*0.8);}
  for(let i=0;i<260;i++){const ph=((t-tw)*0.22*(0.7+0.6*rnd(i*1.3))+rnd(i))%1;if(ph<0)continue;const x=lerp(200,960,ph),y=690+rnd(i*3.7)*540+Math.sin(ph*6+i)*14;
   const lost=t>T('v20|活下去|s')&&rnd(i*5.1)<0.2&&ph>0.5;dot(x,y,2.2,lost?GR:(x>540?AU:IV),sa*Math.sin(Math.PI*ph)*(lost?0.5:0.85));}
  if(gauge>0){const cx=540,cy=880,R=170;X.save();X.lineCap='round';X.strokeStyle=rgba(IV,0.18*a*gauge);X.lineWidth=18;X.beginPath();X.arc(cx,cy,R,0,6.283);X.stroke();X.restore();
   const q=0.573*eo(cl((t-tn+0.3)/1.0));const pts=[];for(let k=0;k<=60;k++){const an=-Math.PI/2+q*6.283*k/60;pts.push([cx+Math.cos(an)*R,cy+Math.sin(an)*R]);}if(q>0)gline(pts,AU,8,a*gauge);}},
 dom(t){const s0=S.c3.start,tn=T('v19|五十七点三|s'),tb=T('v20|出海|s');const gauge=up(t,T('v19|二零二五|s')-0.2,0.5)*(1-cl((t-tb+0.2)/0.5));
  op('m3in',up(t,s0));op('m3out',up(t,s0+0.2));
  rise('m3n',gauge*up(t,tn-0.3,0.3));countUp('m3n',57.3,(t-tn+0.3)/1.0,v=>v.toFixed(1)+'%');op('m3l',gauge);rise('m3hi',gauge*up(t,T('v19|高技术|s'),0.3));op('m3src',gauge);
  op('m3obs',up(t,tb));}};

// ---------------- c4：债券 93% · 111 家 · 贷款四成 → 56789 → 分配问题 ----------------
const R4=[['五成以上',0.5,'v25|五成|s'],['六成以上',0.6,'v25|六成|s'],['七成以上',0.7,'v25|七成|s'],['八成以上',0.8,'v25|八成|s'],['九成以上',0.9,'v25|九成|s']];
SCENES.c4={
 canvas(t,a){const tB=T('v22|债券|s'),t93=T('v22|九十三|s'),tK=T('v24|银行贷款|s'),t4=T('v24|四成|s'),tV=T('v25|可|s');const fa=a*(1-cl((t-tV)/0.4));
  // 「效率更高的一方」：重现开场的两根柱子；「越来越难」：一块灰色重物压到金柱上
  const tq=T('v21|资源|s'),s4=S.c4.start,rb=a*up(t,s4+0.1,0.5)*(1-cl((t-tq+0.1)/0.5));
  if(rb>0){bar(380,470,1120,96.4*3.6,AU,rb);bar(610,700,1120,55.7*3.6,IV,rb*0.7);ctext('私营 96.4',425,1156,30,AU,rb,'center');ctext('国有控股 55.7',655,1156,30,IV,rb*0.8,'center');
   const q=eo(cl((t-T('v21|越来越难|s'))/0.5));if(q>0){const y=lerp(600,1120-96.4*3.6-46,q);X.fillStyle=rgba(GR,0.85*rb);X.fillRect(372,y,106,44);line([[372,y],[478,y],[478,y+44],[372,y+44],[372,y]],IV,1.5,rb*0.5);}}
  // 资源池
  for(let i=0;i<100;i++){const pin=cl((t-tq+0.2-i*0.006)/0.3);if(pin<=0)continue;const gold=i>=93&&t>t93;const bond=t>tB;
   dot(GX(i),GY(i),gold?5:4,gold?AU:IV,fa*pin*(bond?(gold?0.95:0.55):0.45));}
  if(t>tK-0.2){const q=up(t,tK-0.2,0.5);line([[200,1190],[880,1190],[880,1220],[200,1220],[200,1190]],IV,1.5,fa*q*0.6);
   const g=0.42*680*eo(cl((t-t4+0.2)/0.7));if(g>0){X.fillStyle=rgba(AU,0.5*fa);X.fillRect(200,1190,g,30);gline([[200+g,1184],[200+g,1226]],AU,2.5,fa);}}
  // 56789
  const tb=a*up(t,tV+0.1,0.4)*(1-cl((t-T('v26|效率|s'))/0.4));if(tb<=0)return;const dim=1-0.5*cl((t-T('v26|少数|s'))/0.4);
  R4.forEach(([w,p,k],i)=>{const ti=T(k);const q=eo(cl((t-ti+0.15)/0.6));const y=700+i*100;
   line([[420,y],[880,y]],IV,1,tb*0.2);hbar(420,y,440*p*q,30,AU,tb*dim*(q>0?1:0));ctext(w,420+440*p*q+14,y,30,IV,tb*dim*cl(q*3),'left');});},
 free(t,a){const tf=T('v26|分配|s');
  showText('m4core',{lines:[[['这是',null],['分配问题',GOLD]]],size:84,cy:960},t,tf-0.5,S.c4.end-TXDUR.out['碎裂']+0.25,'碎裂','碎裂',a);},
 dom(t){const tB=T('v22|债券|s'),t93=T('v22|九十三|s'),t111=T('v23|一百一十一|s'),tV=T('v25|可|s');const fa=1-cl((t-tV)/0.4);
  op('m4cap',up(t,tB)*fa);rise('m4n93',up(t,t93-0.2,0.3)*fa);countUp('m4n93',93,(t-t93+0.2)/0.8,v=>Math.round(v)+'%');op('m4l93',up(t,t93)*fa);
  rise('m4n111',up(t,t111-0.2,0.3)*fa);countUp('m4n111',111,(t-t111+0.2)/0.8,v=>Math.round(v)+' 家');op('m4l111',up(t,t111)*fa);
  op('m4loan',up(t,T('v24|银行贷款|s'))*fa);op('m4src',up(t,tB)*fa);
  const tb=up(t,tV+0.1,0.4)*(1-cl((t-T('v26|效率|s'))/0.4));const dim=1-0.5*cl((t-T('v26|少数|s'))/0.4);
  [0,1,2,3,4].forEach(i=>op('m4k'+i,tb*dim*up(t,T(R4[i][2])-0.2,0.3)));op('m4src2',tb);}};

// ---------------- c5：法律写了 → 施行 → 四种要素一样平 → 落地之后的每一天 ----------------
const DOC=[[330,660],[750,660],[750,1110],[330,1110],[330,660]];
function c5sink(t){return eo(cl((t-T('v29|落地|s')+0.2)/1.2));}
SCENES.c5={
 canvas(t,a){const tl=Math.min(T('v27|法律|s'),S.c5.start+0.05),tg=T('v29|每一天|s');const sk=c5sink(t),dy=120*sk,da=a*(1-0.75*sk);
  X.save();X.translate(0,dy);gline(partial(DOC,eo(cl((t-tl+0.3)/0.8))),IV,2,da);
  for(let k=0;k<6;k++){const q=eo(cl((t-tl-0.3-k*0.12)/0.4));const L=[300,260,320,220,300,180][k];line([[380,790+k*50],[380+L*q,790+k*50]],IV,3,da*0.4);}X.restore();
  impactRing(t,T('v28|施行|s')+0.1,675,975,190,190,a*(1-sk),RD);
  const te=T('v28|平等|s');if(t>te-0.3){const q=eo(cl((t-te+0.3)/0.9));gline([[540-350*q,1240],[540+350*q,1240]],AU,2.5,a*(1-sk));}
  // 落地之后的每一天：地平线上一天一天亮起，有亮有灭
  if(sk>0){line([[180,1260],[900,1260]],IV,1.5,a*0.5*sk);for(let k=0;k<30;k++){const tk=tg-0.3+k*0.12;const on=cl((t-tk)/0.15);if(on<=0)continue;const ok=rnd(k*7.7)>0.35;
   dot(196+k*24,1260,ok?3.2:2.4,ok?AU:GR,a*on*(ok?0.9:0.6));}}},
 dom(t){const tl=Math.min(T('v27|法律|s'),S.c5.start+0.05),ts=T('v28|施行|s'),sk=c5sink(t);
  const d=op('m5doc',up(t,tl,0.5)*(1-0.75*sk));d.style.transform=`translateY(${(120*sk).toFixed(1)}px)`;
  const q=cl((t-ts+0.05)/0.2);const st=op('m5stamp',(q>0?1:0)*(1-0.75*sk));st.style.transform=`translateY(${(120*sk).toFixed(1)}px) rotate(-12deg) scale(${(1.45-0.45*eo(q)).toFixed(3)})`;
  ['v28|资金|s','v28|技术|s','v28|土地|s','v28|数据|s'].forEach((k,i)=>rise('m5e'+i,up(t,T(k)-0.1,0.3)*(1-0.4*sk)));op('m5src',up(t,ts));}};

// ---------------- c6：我的判断 → 鸟笼里轻舞飞扬 → 三根栏杆化开 → 自己会飞 ----------------
const CG={cx:540,yb:1225,ys:870,yt:705,R:215,N:18};
const BARS=[...Array(CG.N)].map((_,i)=>{const th=i/CG.N*6.283+0.17,d=Math.sin(th),bx=CG.cx+CG.R*Math.cos(th);const P=[];
 for(let s=0;s<=10;s++)P.push([bx,lerp(CG.yb+30*d,CG.ys+20*d,s/10)]);
 const p0=[bx,CG.ys+20*d],p1=[bx,CG.yt+10+12*d],p2=[CG.cx,CG.yt];for(let s=1;s<=14;s++){const u=s/14;P.push([(1-u)*(1-u)*p0[0]+2*u*(1-u)*p1[0]+u*u*p2[0],(1-u)*(1-u)*p0[1]+2*u*(1-u)*p1[1]+u*u*p2[1]]);}
 return {d,P,i};});
const OPEN=[...BARS].sort((a,b)=>b.d-a.d).slice(0,3).map(b=>b.i).sort((a,b)=>BARS[a].P[0][0]-BARS[b].P[0][0]);   // 正对观众的三根
const OPENK=['v32|要素|s','v32|欠款|s','v32|规则|s'];
let WARP=null;function wp(t){if(!WARP){const th=T('v31|天花板|s');WARP=makeWarp([[th-0.25,th+0.9,0.18,0.35]],S.c6.start-1,S.c6.end+1);}return WARP(t);}
function dance(tau){return [CG.cx+122*Math.sin(0.83*tau)+34*Math.sin(2.1*tau+1),1035+88*Math.sin(1.17*tau+0.4)+22*Math.sin(2.7*tau)];}
function birdAt(t){   // 鸟的位置：起舞 → 撞笼顶 → 飞出（都是 t 的纯函数，光带直接取过去的位置）
 const tau=wp(t),p=dance(tau);const th=T('v31|天花板|s');const u=Math.sin(Math.PI*cl((t-th+0.7)/1.8));let x=lerp(p[0],CG.cx+18*Math.sin(tau*3),u*0.85),y=lerp(p[1],CG.yt+70,u);
 const tf=T('v33|自己会飞|s')-0.45;if(t>tf){const q=io(cl((t-tf)/1.5));const s=dance(wp(tf));const c=[CG.cx,1190],e=[1010,520];
  x=(1-q)*(1-q)*s[0]+2*q*(1-q)*c[0]+q*q*e[0];y=(1-q)*(1-q)*s[1]+2*q*(1-q)*c[1]+q*q*e[1];}
 return [x,y];}
function cageT(){return T('v31|比喻|s')+0.3;}
function cageA(t){return eo(cl((t-cageT())/1.4));}
// 镜头：鸟笼出现后整体缓慢推近（以笼心为锚）
function push(t){const tb=T('v31|鸟笼|s');return 1+0.07*SM(cl((t-tb)/14));}
function camOn(ctx,t){const s=push(t);ctx.translate(CG.cx,1000);ctx.scale(s,s);ctx.translate(-CG.cx,-1000);}
function gapOpen(t){return OPEN.reduce((m,bi,k)=>m+cl((t-T(OPENK[k]))/0.8),0)/3;}
SCENES.c6={
 canvas(t,a){const tj=T('v30|我的判断|s');impactRing(t,tj,540,960,420,130,a,AU);
  const jl=a*up(t,tj,0.3)*(1-cl((t-T('v31|比喻|s')-0.3)/0.6));if(jl>0){const hw=360*eo(cl((t-tj)/0.7));gline([[540-hw,1052],[540+hw,1052]],AU,2.4,jl);}
  const ca=cageA(t);if(ca<=0)return;const tfly=T('v33|自己会飞|s');const dimC=1-0.6*cl((t-tfly-0.6)/1.5);
  X.save();camOn(X,t);
  // 光束：从笼顶上方照下来，慢慢摆动（呼应底图的拱窗光）
  X.save();X.globalCompositeOperation='lighter';for(let k=0;k<7;k++){const sw=Math.sin(t*0.25+k)*16,x0=380+k*60+sw,w=26+rnd(k*3)*30;
   const g=X.createLinearGradient(0,600,0,1380);g.addColorStop(0,rgba(IV,0));g.addColorStop(0.35,rgba(IV,0.05*a*ca));g.addColorStop(1,rgba(IV,0));X.fillStyle=g;
   X.beginPath();X.moveTo(x0,600);X.lineTo(x0+w,600);X.lineTo(x0+w*2.4+(k-3)*40,1380);X.lineTo(x0-w*0.6+(k-3)*40,1380);X.closePath();X.fill();}
  // 笼里一团暖光，跟着鸟走
  const [bx,by]=birdAt(t);const gl=X.createRadialGradient(bx,by,0,bx,by,260);gl.addColorStop(0,rgba(AU,0.16*a*ca));gl.addColorStop(1,rgba(AU,0));X.fillStyle=gl;X.fillRect(bx-260,by-260,520,520);
  // 栏杆化开的缺口：光从缺口涌出来
  const go=gapOpen(t);if(go>0){const g2=X.createLinearGradient(0,880,0,1260);g2.addColorStop(0,rgba(IV,0));g2.addColorStop(0.5,rgba(IV,0.3*a*go*dimC));g2.addColorStop(1,rgba(IV,0));
   X.fillStyle=g2;X.beginPath();X.moveTo(CG.cx-70*go,890);X.lineTo(CG.cx+70*go,890);X.lineTo(CG.cx+130*go,1380);X.lineTo(CG.cx-130*go,1380);X.closePath();X.fill();}
  X.restore();
  // 地上的栏杆影子
  for(let k=0;k<9;k++){const x=CG.cx-200+k*50;line([[x,1290],[x+90,1370]],IV,6,a*ca*0.05*dimC);}
  const th=T('v31|天花板|s'),flash=Math.exp(-Math.pow((t-th-0.1)/0.5,2));
  const ring=(y,ry,al,w)=>gline([...Array(61)].map((_,k)=>[CG.cx+Math.cos(k/60*6.283)*CG.R,y+Math.sin(k/60*6.283)*ry]),AU,w||2,al);
  ring(CG.yb,30,a*ca*0.6*dimC,2.4);ring(CG.ys,20,a*ca*0.35*dimC);ring(1060,25,a*ca*0.14*dimC,1.4);
  gline([...Array(25)].map((_,k)=>[CG.cx+Math.cos(k/24*6.283)*16,CG.yt-22+Math.sin(k/24*6.283)*16]),AU,2,a*ca*0.7*dimC);
  BARS.forEach(b=>{const oi=OPEN.indexOf(b.i);const tr=oi>=0?T(OPENK[oi]):1e9;if(t>tr+0.05)return;
   const grow=eo(cl((t-cageT()-(1-b.d)*0.15)/1.8));const front=b.d>0;
   const behind=!front&&Math.abs(b.P[0][0]-CG.cx)<120?1-0.85*gapOpen(t):1;const al=behind*a*dimC*(front?0.5+0.2*b.d:0.16)*(1+1.6*flash)*(oi>=0&&t>tr-0.3?1+2.5*cl((t-tr+0.3)/0.3):1);
   gline(partial(b.P,grow),AU,front?2.2:1.2,al);});
  OPEN.forEach((bi,k)=>{const tr=T(OPENK[k]);if(t>tr)disperse(samplePts(BARS[bi].P,40),t,tr,a,AU,700+k*50,0.9);impactRing(t,tr,BARS[bi].P[0][0],1060,60,140,a*0.8,AU);});
  X.restore();},
 free(t,a){const tn=T('v30|不是利润|s');
  showText('m6core',{lines:[[['不是利润，',null],['是公平',GOLD]]],size:84,cy:960},t,tn-0.25,T('v31|比喻|s')-0.2,'光扫','光扫',a);
  const ca=cageA(t);if(ca<=0)return;const tb=T('v31|鸟笼|s'),tw=T('v31|舞姿|s'),th=T('v31|天花板|s'),tfly=T('v33|自己会飞|s');
  const [c,g]=layer('m6bird');g.globalCompositeOperation='lighter';camOn(g,t);
  const born=eo(cl((t-tb-0.6)/1.4));   // 鸟从四散的光点里聚出来
  // 光带：沿过去的位置，越舞越长、越舞越亮；近处白、远处金
  const len=Math.round(60+70*cl((t-tw)/1.5)+50*cl((t-tfly)/0.6)),dt=0.026,beauty=0.6+0.4*cl((t-tw)/1.2);
  for(const [off,w,al0] of [[0,6,0.85],[1,2,0.5],[-1,2,0.5],[2.2,1,0.3],[-2.2,1,0.3]]){let prev=null;
   for(let j=0;j<len;j++){const tt=t-j*dt;if(tt<tb+0.6)break;const p=birdAt(tt),q=birdAt(tt-0.02),nx=-(p[1]-q[1]),ny=p[0]-q[0],nl=Math.hypot(nx,ny)+1e-6;
    const f=j/len,wv=off*(9+7*Math.sin(j*0.3-t*4))*Math.sqrt(f);const pt=[p[0]+nx/nl*wv,p[1]+ny/nl*wv];
    if(prev)glineOn(g,[prev,pt],f<0.25?'#FFF6E4':GOLD,w*(1-f*0.85),a*born*beauty*al0*Math.pow(1-f,1.2));prev=pt;}}
  // 鸟：一团光晕 + 羽状翅膀（翼展约 190px）+ 三条长尾羽
  const [bx,by]=birdAt(t),[px,py]=birdAt(t-0.03),hd=Math.atan2(by-py,bx-px),flap=Math.sin(wp(t)*6.2),ch=Math.cos(hd),sh=Math.sin(hd);
  const halo=g.createRadialGradient(bx,by,0,bx,by,90);halo.addColorStop(0,rgba('#FFF6E4',0.55*a*born));halo.addColorStop(0.3,rgba(AU,0.18*a*born));halo.addColorStop(1,rgba(AU,0));
  g.fillStyle=halo;g.globalAlpha=1;g.fillRect(bx-90,by-90,180,180);
  const P=[];
  for(const s of [-1,1])for(let k=0;k<150;k++){const u=rnd(k*1.31+s),v=rnd(k*2.77+s);const span=u*95,chord=v*30*(1-0.65*u);
   const lift=flap*u*u*58+Math.sin(u*3)*6;P.push([-chord+6-u*14,s*span*(0.55+0.45*Math.abs(Math.cos(flap*0.8))),lift,0.5+0.5*(1-v)]);}
  for(let k=0;k<40;k++){const u=k/39;P.push([lerp(26,-26,u),Math.sin(u*Math.PI)*9*(rnd(k)-.5),0,1]);}
  for(let k=0;k<54;k++){const s=k%3-1,u=Math.floor(k/3)/17;P.push([-26-u*70,s*u*20+Math.sin(u*4+t*5)*6*u,0,0.8*(1-u)]);}
  P.forEach(([lx,ly,lz,br],k)=>{const x=bx+lx*ch-ly*sh,y=by+lx*sh+ly*ch-lz;const sx=lerp(CG.cx+(rnd(k*3.1)-.5)*420,x,born),sy=lerp(1300-rnd(k*5.3)*560,y,born);
   g.globalAlpha=a*br*(0.6+0.4*rnd(k+Math.floor(t*12)))*Math.max(born,0.35);g.fillStyle=k%6?'#FFF6E4':GOLD;const r=k>=300&&k<340?1.8:1.3;g.fillRect(sx-r,sy-r,2*r,2*r);});
  // 飘落的光羽
  for(let m=0;m<90;m++){const life=2.6,age=((t-tb)+rnd(m*1.9)*life)%life,b0=t-age;if(b0<tb+0.8)continue;const p=birdAt(b0);
   const x=p[0]+nz(m,t,0.6)*16+(rnd(m*2.2)-.5)*36*age/life,y=p[1]+age*42;g.globalAlpha=a*0.75*(1-age/life)*born;g.fillStyle=m%5?'#FFE9C4':GOLD;g.fillRect(x-1.1,y-1.1,2.2,2.2);}
  // 撞上笼顶：碎光往下落
  if(t>th-0.1&&t<th+2.5){for(let m=0;m<80;m++){const an=Math.PI*(0.15+0.7*rnd(m)),sp=60+rnd(m*3)*150,q=cl((wp(t)-wp(th))/1.6);
   const x=CG.cx+Math.cos(an)*sp*eo(q)*(rnd(m*5)>.5?1:-1),y=CG.yt+60+Math.sin(an)*sp*eo(q)*0.4+130*q*q;g.globalAlpha=a*(1-q);g.fillStyle=GOLD;g.fillRect(x-1.3,y-1.3,2.6,2.6);}}
  // 飞出：一路撒光
  if(t>tfly){for(let m=0;m<160;m++){const tt=tfly-0.2+rnd(m)*2.6;if(tt>t)continue;const p=birdAt(tt),age=t-tt;const al=Math.exp(-age*0.8);
   g.globalAlpha=a*al;g.fillStyle=m%4?'#FFF6E4':GOLD;const x=p[0]+(rnd(m*3)-.5)*44*age,y=p[1]+age*30+(rnd(m*7)-.5)*22*age;g.fillRect(x-1.3,y-1.3,2.6,2.6);}}
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;present(c,1,0.9);
  X.save();camOn(X,t);impactRing(t,th+0.1,CG.cx,CG.yt+40,170,46,a,AU);X.restore();},
 dom(t){OPENK.forEach((k,i)=>{const p=up(t,T(k)-0.1,0.35);const e=rise('m6k'+i,p);e.style.color=p>0?'#F0B429':'';});}};

// ---------------- c7：二选一 ----------------
SCENES.c7={
 canvas(t,a){const s=S.c7.start,pl=cl((t-T('v34|笼子里|s'))/0.4),pr=cl((t-T('v34|跳出|s'))/0.4);
  // 左：小鸟笼里一点光在转圈
  const cx=325,cy=860,R=80;for(let k=0;k<9;k++){const th=k/9*6.283,x=cx+R*Math.cos(th),d=Math.sin(th);line([[x,1000+10*d],[x,860+6*d],[cx,780]],AU,1.5,a*(0.2+0.5*pl)*(d>0?1:0.5));}
  line([...Array(41)].map((_,k)=>[cx+Math.cos(k/40*6.283)*R,1000+Math.sin(k/40*6.283)*10]),AU,1.5,a*(0.2+0.5*pl));
  const an=(t-s)*2.2;dot(cx+40*Math.cos(an),930+18*Math.sin(an*1.3),3,IV,a*(0.4+0.6*pl));
  // 右：光点往上飞出画框
  for(let i=0;i<46;i++){const ph=((t-s)*0.35+rnd(i*1.7))%1;const x=640+rnd(i*3.3)*230+Math.sin(ph*5+i)*12,y=1100-ph*420;dot(x,y,1.8,IV,a*(0.2+0.7*pr)*Math.sin(Math.PI*ph));}
  const vq=cl((t-s-0.25)/0.5);if(vq>0){gline([[540,670],[540,lerp(670,850,eo(vq))]],AU,2,a*0.7);gline([[540,1160],[540,lerp(1160,970,eo(vq))]],AU,2,a*0.7);}},
 dom(t){const pl=cl((t-T('v34|笼子里|s'))/0.35),pr=cl((t-T('v34|跳出|s'))/0.35);
  hl($('m7L'),pl>0,'#F0B429');$('m7L').style.color=pl>0?'#F0B429':'#C9C2B6';hl($('m7R'),pr>0,'#FFE9C4');$('m7R').style.color=pr>0?'#FFE9C4':'#C9C2B6';
  const l0=eo(cl((t-S.c7.start)/0.4));$('m7L').style.transform=`translateX(${(-50*(1-l0)).toFixed(1)}px)`;$('m7R').style.transform=`translateX(${(50*(1-l0)).toFixed(1)}px)`;$('m7L').style.opacity=$('m7R').style.opacity=l0.toFixed(3);
  const vq=eo(cl((t-S.c7.start-0.25)/0.3));const vs=op('m7vs',vq);vs.style.transform=`scale(${(1.5-0.5*vq).toFixed(3)})`;vs.style.textShadow='0 0 18px rgba(245,166,35,.6),0 3px 10px rgba(0,0,0,.7)';}};

// 鸟笼段压低底纹点阵，让画面更空
HOOKS.texA=(t,V)=>1-0.7*V[6];
