// =====================================================================
// 《为什么我们越来越努力，却越来越没有安全感？》· 本期场景（深度版 · 口播随笔，画面全部为意象 / 示意）
// 文字效果（3 种）：雾化（c1 这种冷从哪里来）· 逐字（c2 少一点自责、c6 结尾）· 粒子（c5 下一步）
// 贯穿意象：光线小人 · 落雪（寒冬）· 台阶 → 平衡木 · 雷达图 · 暖窗
// =====================================================================
const GOLD='#F0B429';
const up=(t,t0,d)=>eo(cl((t-t0)/(d||0.4)));
const win=(t,a0,a1,d)=>up(t,a0,d)*(1-cl((t-a1)/(d||0.4)));   // a0 进、a1 出
function ctext(s,x,y,size,col,a,align){if(a<=0.003)return;X.save();X.font=`800 ${size}px NSC`;X.textAlign=align||'center';X.textBaseline='middle';X.fillStyle=rgba(col,a);X.fillText(s,x,y);X.restore();}
function rect(x0,y0,x1,y1,col,w,a,dash){line([[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]],col,w,a,false,dash);}
function card(x0,y0,x1,y1,s,col,a,size){if(a<=0.003)return;X.fillStyle=rgba('#0E0C09',0.6*a);X.fillRect(x0,y0,x1-x0,y1-y0);rect(x0,y0,x1,y1,col,1.8,a*0.9);if(s)ctext(s,(x0+x1)/2,(y0+y1)/2,size||32,col,a);}
function circ(cx,cy,r,col,w,a,f0,f1){const P=[];const A=f0||0,B=f1===undefined?6.283:f1;for(let k=0;k<=48;k++){const an=lerp(A,B,k/48);P.push([cx+Math.cos(an)*r,cy+Math.sin(an)*r]);}gline(P,col,w,a);}
function bar(x0,x1,base,h,col,a){if(h<=0.5||a<=0.003)return;const g=X.createLinearGradient(0,base-h,0,base);g.addColorStop(0,rgba(col,0.5*a));g.addColorStop(1,rgba(col,0.06*a));
 X.fillStyle=g;X.fillRect(x0,base-h,x1-x0,h);gline([[x0,base],[x0,base-h],[x1,base-h],[x1,base]],col,2,a);}
// 光线小人：walk = 步伐相位；pose: 0 走路 / 1 张开双臂保持平衡
function person(x,y,s,col,a,walk,pose,tilt){if(a<=0.003)return;X.save();X.translate(x,y);X.rotate(tilt||0);const sw=Math.sin(walk||0);
 circ(0,-66*s,11*s,col,2.4,a);gline([[0,-54*s],[0,-24*s]],col,2.6,a);
 gline([[0,-24*s],[10*s*sw,0]],col,2.6,a);gline([[0,-24*s],[-10*s*sw,0]],col,2.6,a);
 if(pose)gline([[-30*s,-46*s],[0,-48*s],[30*s,-46*s]],col,2.4,a);else{gline([[0,-48*s],[-9*s*sw,-30*s]],col,2.4,a);gline([[0,-48*s],[9*s*sw,-30*s]],col,2.4,a);}
 X.restore();}
// 落雪（寒冬）：确定性飘落
function snow(t,a,n,seed){if(a<=0.003)return;for(let i=0;i<n;i++){const r0=rnd(seed+i),r1=rnd(seed+i*3.1),sp=24+r1*40;const y=600+((t*sp+rnd(seed+i*5.3)*780)%780),x=150+r0*780+Math.sin(t*0.6+i)*16;
 dot(x,y,1.2+r1*1.4,IV,a*(0.35+0.4*rnd(seed+i*7)));}}
function stairs(x0,y0,x1,y1,n){const P=[[x0,y0]];const dx=(x1-x0)/n,dy=(y1-y0)/n;for(let k=0;k<n;k++){P.push([x0+dx*k,y0+dy*(k+1)]);P.push([x0+dx*(k+1),y0+dy*(k+1)]);}return P;}

// ---------------- c0：很忙，心里没底 → 想动又不敢 → 以前的台阶 → 现在先稳住 ----------------
SCENES.c0={
 canvas(t,a){const tB=T('v02|很忙|s'),tD=T('v02|没底|s'),tJ=T('v03|换一份工作|s'),tO=T('v03|自己的事情|s'),tC=T('v03|代价|s'),tS=T('v04|努力几年|s'),tG=T('v04|好起来|s'),tN=T('v05|现在|s'),tW=T('v05|稳住|s');
  // 地面 + 跑步机一样往后退的地砖（第一帧就有）
  line([[200,1180],[880,1180]],IV,1.5,a*0.5);const tr=1-cl((t-tN)/0.5);for(let k=0;k<12;k++){const x=200+((k*60-t*110)%680+680)%680;line([[x,1192],[x+24,1192]],IV,2,a*0.35*tr);}
  // 时钟转得飞快
  const ck=a*win(t,tB-0.2,tJ,0.4);if(ck>0){circ(770,760,58,IV,2,ck);const h=(t-tB)*4,m=(t-tB)*14;gline([[770,760],[770+Math.cos(h)*30,760+Math.sin(h)*30]],AU,3,ck);gline([[770,760],[770+Math.cos(m)*46,760+Math.sin(m)*46]],IV,2,ck);}
  // 心里没底：前面的路走进雾里
  const fg=a*win(t,tD-0.2,tS,0.5);if(fg>0){for(let x=600;x<900;x+=26)line([[x,1110],[x+12,1110]],IV,2,fg*(1-(x-600)/300));smoke(t,tD,860,1040,220,160,8,fg,120);}
  // 想动又不敢：一扇抖动的门、一摞代价
  const dq=a*win(t,tJ-0.2,tS,0.4);if(dq>0){const j=(rnd(Math.floor(t*14))-.5)*10*up(t,tJ,0.3);card(220+j,690,440+j,800,'换一份工作',IV,dq*up(t,tJ-0.2,0.3),32);
   card(640,690,860,800,'做自己的事',IV,dq*up(t,tO-0.2,0.3),32);const cq=up(t,tC-0.1,0.3);for(let k=0;k<6;k++)dot(700+k*20,850-((k*7)%3)*12,7,AU,dq*cq*0.9);if(cq>0)ctext('试错的代价',750,900,28,AU,dq*cq);}
  // 以前：台阶一级级往上
  const sq=a*(1-cl((t-tN-0.6)/0.6));const sp=eo(cl((t-tS+0.2)/1.6));if(sp>0&&sq>0){const S1=stairs(230,1170,850,760,6),flat=cl((t-tN)/1.2);const P=partial(S1,sp).map(([x,y])=>[x,lerp(y,1000,flat)]);gline(P,AU,3,a);if(t>tG&&flat<0.5)dot(850,760,7,AU,a*(1-flat*2)*(0.6+0.4*Math.sin(t*5)));}
  // 现在：台阶压成一根平衡木，人站上去张开双臂
  const fl=cl((t-tN)/1.2);if(fl>0)gline([[230,1000],[850,1000]],AU,3,a*fl);
  const onBeam=eo(cl((t-tN-0.4)/0.8)),wob=Math.sin((t-tN)*3.2)*0.12*Math.exp(-Math.max(0,t-tW)*0.8);
  person(540,lerp(1180,1000,onBeam),1.6,IV,a,onBeam>0?0:t*6,onBeam>0.5?1:0,onBeam>0.5?wob:0);},
 dom(t){op('e0n',up(t,0.2));}};

// ---------------- c1：时代的寒冬 → 这种冷从哪里来 → 三个角度 ----------------
SCENES.c1={
 canvas(t,a){const s1=S.c1.start,tW=T('v06|寒冬|s'),tQ=T('v07|往下问|s'),tC=T('v07|这种冷|s'),t3=T('v08|三个角度|s');
  snow(t,a*up(t,s1,1.0),70,40);
  person(400,1180,1.4,IV,a*(1-cl((t-t3)/0.4))*0.8,0,0,0);line([[200,1180],[880,1180]],IV,1.5,a*0.4);
  // 温度计往下掉
  const th=a*win(t,s1+0.2,tC,0.5);if(th>0){rect(780,720,820,1060,IV,2,th);const lv=lerp(0.75,0.12,eo(cl((t-tW+0.2)/1.2)));X.fillStyle=rgba(AU,0.7*th);X.fillRect(786,1056-330*lv,28,330*lv);circ(800,1090,28,IV,2,th);dot(800,1090,14,AU,th);}
  // 往下问一步
  const dq=a*win(t,tQ-0.2,t3,0.4);if(dq>0){const q=eo(cl((t-tQ+0.2)/0.7));gline([[540,640],[540,lerp(640,780,q)]],AU,2.4,dq);if(q>=1)line([[526,766],[540,780],[554,766]],AU,2.4,dq);}
  // 三个角度：三扇门
  const g3=a*up(t,t3-0.2,0.5);if(g3>0)['一','二','三'].forEach((s,i)=>{const q=up(t,t3-0.2+i*0.2,0.4);const x=230+i*230;card(x,800,x+160,1120,'',AU,g3*q);ctext(s,x+80,960,64,AU,g3*q);
   X.save();X.globalCompositeOperation='lighter';const gr=X.createRadialGradient(x+80,960,0,x+80,960,140);gr.addColorStop(0,rgba(AU,0.12*g3*q));gr.addColorStop(1,rgba(AU,0));X.fillStyle=gr;X.fillRect(x-60,820,280,280);X.restore();});},
 free(t,a){showText('e1core',{lines:[[['这种冷，',null]],[['究竟从哪里来？',GOLD]]],size:72,cy:930},t,T('v07|这种冷|s')-0.25,T('v08|三个角度|s')-0.4,'雾化','雾散',a);}};

// ---------------- c2：老经验 vs 新环境 → 同样努力，回报不同 → 别只看赶上机会的人 ----------------
const TREE=[[540,1180],[400,1040],[680,1040],[320,900],[480,900],[600,900],[760,900],[540,760]];   // 组织树（示意）
const GEN=[...Array(40).keys()];const LUCKY=[3,12,21,27,36];
SCENES.c2={
 canvas(t,a){const s2=S.c2.start,tU=T('v09|不适合|s'),tR=T('v10|好好读书|s'),tF=T('v11|不能保证|s'),tE=T('v12|举个例子|s'),tX=T('v13|扩张|s'),tP=T('v13|晋升|s'),tA=T('v14|调整阶段|s'),tH=T('v14|更努力|s'),tM=T('v14|管理岗位|s'),
   tSm=T('v15|同样的努力|s'),tRw=T('v15|回报|s'),tL=T('v16|多看一层环境|s'),tG=T('v17|父辈|s'),tB=T('v18|买房获利|s'),tI=T('v18|忽略|s'),tN=T('v18|没有赶上|s'),tRf=T('v19|参考|s'),tO=T('v19|行动路线|s');
  snow(t,a*0.5,30,40);
  // 一张旧地图：路线对不上新地形
  const mq=a*win(t,s2+0.1,tR-0.2,0.4);if(mq>0){card(260,660,820,980,'',IV,mq);ctext('熟悉的成功经验',540,700,30,IV,mq);const R=[[300,920],[420,820],[560,880],[700,780],[790,840]];
   const bad=cl((t-tU)/0.4);line(R,bad>0.5?GR:AU,2.6,mq,false,[8,6]);const W=[];for(let k=0;k<=40;k++){const x=260+k*14;W.push([x,1080+Math.sin(k*0.5+t*0.8)*36*bad+Math.sin(k*0.23)*20]);}gline(W,IV,2,mq*0.6);if(bad>0)ctext('环境变了',540,1160,30,IV,mq*bad);}
  // 一条清楚的路：读书 → 工作 → 踏实肯干 → 再分叉成不同结果
  const rq=a*win(t,tR-0.3,tE,0.4);if(rq>0){gline(partial([[200,1100],[640,1100]],eo(cl((t-tR+0.3)/1.4))),AU,3,rq);
   [[300,'读书','v10|好好读书|s'],[440,'工作','v10|找份工作|s'],[580,'踏实肯干','v10|踏实肯干|s']].forEach(([x,s,k])=>{const q=up(t,T(k)-0.1,0.3);dot(x,1100,5,AU,rq*q);ctext(s,x,1050,30,IV,rq*q);});
   const fq=eo(cl((t-tF+0.1)/0.9));if(fq>0)[[860,880],[880,980],[880,1100],[870,1220],[840,1290]].forEach(([x,y],i)=>{const e=[lerp(640,x,fq),lerp(1100,y,fq)];gline([[640,1100],e],i===1?AU:IV,2,rq*(i===1?0.9:0.45));dot(e[0],e[1],4+(i===1?2:0),i===1?AU:IV,rq*fq*0.8);});}
  // 举个例子：企业扩张 → 调整
  const tq=a*win(t,tE-0.1,tSm-0.2,0.4);if(tq>0){rect(220,660,860,1250,IV,1,tq*0.3,[4,8]);const grow=t<tA?cl((t-tX+0.2)/2.2):cl((tA-tX+0.2)/2.2);const nb=Math.floor(1+grow*6.99);
   TREE.forEach((p,i)=>{if(i===0)return;const par=TREE[i<3?0:i<7?(i<5?1:2):3];if(i<nb||i===7)line([par,p],IV,1.4,tq*(i===7?0.25:0.5));});
   TREE.forEach((p,i)=>{if(i===7){if(t>tA)rect(p[0]-60,p[1]-26,p[0]+60,p[1]+26,AU,1.8,tq*(t>tM?0.5+0.5*Math.sin(t*5):0.4),[6,5]);return;}if(i<nb)card(p[0]-60,p[1]-26,p[0]+60,p[1]+26,'',IV,tq*0.8);});
   const lv=eo(cl((t-tP)/0.6)),me=[lerp(400,320,lv),lerp(1040,900,lv)];dot(me[0],me[1],8,AU,tq);if(t>tH){for(let k=0;k<2;k++){const q=((t-tH)*1.2+k*0.5)%1;circ(me[0],me[1],10+30*q,AU,1.6,tq*(1-q));}}
   if(t>tA)ctext('团队不再扩大',540,1230,30,IV,tq*up(t,tA,0.3));}
  // 同样的努力，不同的回报
  const bq=a*win(t,tSm-0.2,tL,0.4);if(bq>0){[[360,0.82,'环境 A'],[720,0.32,'环境 B']].forEach(([x,r,s])=>{bar(x-90,x-20,1180,220*up(t,tSm,0.6),IV,bq*0.7);bar(x+20,x+90,1180,300*r*up(t,tRw-0.2,0.7),AU,bq);ctext('努力',x-55,1214,28,IV,bq);ctext('回报',x+55,1214,28,AU,bq);ctext(s,x,700,32,IV,bq);});}
  // 多看一层环境：小人外面多一圈
  const lq=a*win(t,tL-0.1,tG,0.5);if(lq>0){person(540,1220,1.2,IV,lq,0,0,0);circ(540,1180,lerp(40,120,up(t,tL,0.8)),AU,1.6,lq*0.7);}
  // 父辈：一代人里，只看见赶上机会的几个
  const gq=a*win(t,tG-0.2,tRf-0.2,0.4);if(gq>0)GEN.forEach(i=>{const x=270+(i%10)*60,y=760+Math.floor(i/10)*110,luck=LUCKY.includes(i);let al=0.45,col=IV,s=0.6;
   if(t>tB&&luck){col=AU;al=1;s=0.75;}if(t>tI&&!luck)al=0.15;if(t>tN&&!luck){al=0.7;}person(x,y+40,s,col,gq*al*up(t,tG-0.2+i*0.01,0.3),0,0,0);
   if(t>tN&&!luck)circ(x,y,26,IV,1,gq*0.35*(0.5+0.5*Math.sin(t*3+i)));});
  // 别人的结果只能参考：别人的路（虚线）和自己的路分开
  const oq=a*up(t,tRf-0.2,0.4);if(oq>0){line([[260,1180],[480,980],[700,860],[860,720]],AU,2.4,oq*0.7,false,[8,8]);ctext('别人的路：参考',700,800,30,AU,oq*0.8);
   const q=eo(cl((t-tO+0.2)/1.0));gline(partial([[260,1180],[460,1150],[620,1060],[780,1090],[880,1010]],q),IV,3,oq);person(260,1180,1.1,IV,oq,0,0,0);if(q>0.9)ctext('自己的路',820,1150,30,IV,oq);}},
 free(t,a){showText('e2core',{lines:[[['多看一层环境，',null]],[['少一点自责',GOLD]]],size:72,cy:860},t,T('v16|多看一层环境|s')-0.25,T('v17|父辈|s')+0.2,'逐字','逐字',a);},
 dom(t){op('e2n',up(t,T('v12|举个例子|s')));}};

// ---------------- c3：机会和接住之间有距离 → AI 让初稿变快 → 工具进步 ≠ 加薪 → 看见趋势 ≠ 获得收益 ----------------
SCENES.c3={
 canvas(t,a){const s3=S.c3.start,tD=T('v20|距离|s'),tA=T('v21|AI|s'),tT=T('v22|新工具|s'),tF=T('v22|变快|s'),tE=T('v22|效率提高|s'),tY=T('v23|员工|s'),tW=T('v24|工作量增加|s'),tJ=T('v24|岗位要求改变|s'),tK=T('v24|客户沟通|s'),
   tG=T('v25|工具进步|s'),tS=T('v25|加薪|s'),tL=T('v26|学习新的用法|s'),tR=T('v26|重新寻找|s'),tM=T('v26|需要时间|s'),tP=T('v27|技术在进步|s'),tX=T('v27|更焦虑|s'),tB=T('v27|同时发生|s'),tH=T('v28|行业|s'),tV=T('v29|看见|s'),tI=T('v29|实际收益|s');
  snow(t,a*0.35,24,77);
  // 两块台地，中间一道缝：机会 / 接住
  const gq=a*win(t,s3+0.1,tA,0.4);if(gq>0){gline([[200,1100],[440,1100]],IV,3,gq);gline([[640,1100],[880,1100]],IV,3,gq);dot(320,1040,14,AU,gq*(0.7+0.3*Math.sin(t*3)));ctext('机会',320,990,30,AU,gq);person(760,1100,1.2,IV,gq,0,0,0);ctext('接住',760,990,30,IV,gq);
   const q=up(t,tD-0.1,0.4);if(q>0){line([[450,1140],[630,1140]],AU,2,gq*q,false,[5,5]);ctext('距离',540,1180,30,AU,gq*q);}}
  // AI：初稿的卡片在传送带上越跑越快
  const cq=a*win(t,tA-0.2,tW-0.2,0.4);if(cq>0){ctext('AI',540,700,64,AU,cq*up(t,tA-0.2,0.3));const belt=up(t,tA,0.4);if(belt>0){line([[200,1060],[880,1060]],IV,2,cq*belt*0.7);
   const v=t<tF?50:lerp(50,260,cl((t-tF)/0.8));const ph=t<tF?(t-tA)*50:(tF-tA)*50+((t-tF)*(50+260)/2);for(let k=0;k<7;k++){const x=200+((ph+k*100)%680);card(x,970,x+56,1050,'',IV,cq*belt*0.85);line([[x+10,990],[x+46,990]],IV,2,cq*belt*0.5);line([[x+10,1006],[x+38,1006]],IV,2,cq*belt*0.5);}
   if(t>tE){const q=up(t,tE,0.6);bar(800,850,920,150*q,AU,cq);ctext('效率',825,940,28,AU,cq*q);}}
   if(t>tY-0.2){person(540,1250,1.0,IV,cq*up(t,tY-0.2,0.3),0,0,0);ctext('员工呢？',640,1210,30,IV,cq*up(t,tY,0.3),'left');}}
  // 对员工：三种可能
  const bq=a*win(t,tW-0.3,tG-0.2,0.4);if(bq>0){person(800,1180,1.3,IV,bq,0,0,0);[['工作量增加',tW,760],['岗位要求改变',tJ,900],['沟通、审美、交付',tK,1040]].forEach(([s,tk,y])=>{const q=up(t,tk-0.15,0.35);if(q<=0)return;gline([[780,1110],[lerp(780,520,q),y]],IV,1.4,bq*q*0.6);ctext(s,500,y,32,IV,bq*q,'right');});}
  // 工具进步，不会自动变成加薪：齿轮在转，金点走到半路就断了
  const wq=a*win(t,tG-0.3,tL-0.2,0.4);if(wq>0){const r=70,c=[340,940],an=(t-tG)*1.5;const P=[];for(let k=0;k<=48;k++){const u=k/48*6.283,rr=r+(Math.floor(k/3)%2?12:0);P.push([c[0]+Math.cos(u+an)*rr,c[1]+Math.sin(u+an)*rr]);}gline(P,IV,2,wq);dot(c[0],c[1],8,IV,wq);ctext('工具进步',340,1060,30,IV,wq);
   person(800,1060,1.2,IV,wq,0,0,0);for(let k=0;k<8;k++){const ph=((t-tG)*0.6+k/8)%1;const x=lerp(430,760,ph);if(x>600)continue;dot(x,940+Math.sin(ph*8)*6,3,AU,wq*(1-(x-430)/170));}
   if(t>tS){const q=up(t,tS,0.3);line([[620,900],[620,980]],AU,2,wq*q,false,[4,4]);ctext('加薪',760,960,30,GR,wq*q);}}
  // 学新用法、换工作方式、重新找位置：都要时间
  const lq=a*win(t,tL-0.3,tP-0.2,0.4);if(lq>0){[300,540,780].forEach(x=>rect(x-60,1100,x+60,1200,IV,1.6,lq*0.6,[6,5]));const p=t<tR?lerp(300,540,eo(cl((t-tL)/2))):lerp(540,780,eo(cl((t-tR)/1.4)));person(p,1190,1.1,AU,lq,t*5,0,0);
   if(t>tM-0.2){const q=up(t,tM-0.2,0.3);circ(760,800,52,IV,2,lq*q);const m=(t-tM)*3;gline([[760,800],[760+Math.cos(m)*40,800+Math.sin(m)*40]],AU,2.4,lq*q);ctext('需要时间',760,890,30,IV,lq*q);}}
  // 技术在进步 / 我更焦虑：两条线一起往上
  const pq=a*win(t,tP-0.3,tH-0.2,0.4);if(pq>0){line([[240,1220],[240,700]],IV,1.5,pq*0.5);line([[240,1220],[860,1220]],IV,1.5,pq*0.5);
   const q1=eo(cl((t-tP+0.2)/1.4)),q2=eo(cl((t-tX+0.2)/1.4));const L1=[[260,1180],[480,1080],[680,920],[840,760]],L2=[[260,1200],[480,1150],[680,1010],[840,880]];
   gline(partial(L1,q1),AU,3,pq);gline(partial(L2,q2),IV,3,pq*0.8);if(q1>0.9)ctext('技术在进步',840,720,30,AU,pq,'right');if(q2>0.9)ctext('我更焦虑',840,840,30,IV,pq,'right');impactRing(t,tB,700,960,120,60,pq,AU);}
  // 情况都不同
  const hq=a*win(t,tH-0.2,tV-0.2,0.4);if(hq>0)[[330,60,'行业'],[540,90,'企业'],[760,50,'家庭']].forEach(([x,r,s],i)=>{const q=up(t,tH-0.2+i*0.3,0.4);circ(x,960,r,IV,2,hq*q);ctext(s,x,960,30,IV,hq*q);});
  // 看见趋势 ≠ 获得收益：两块之间隔着一道缝
  const vq=a*up(t,tV-0.2,0.4);if(vq>0){card(200,880,460,1000,'看见趋势',IV,vq,34);const q=up(t,tI-0.2,0.4);card(620,880,880,1000,'获得收益',AU,vq*q,34);
   if(q>0){line([[470,940],[610,940]],AU,2,vq*q,false,[6,6]);ctext('两件事',540,1060,30,IV,vq*q);}}},
 dom(t){op('e3n',up(t,T('v22|新工具|s')));}};

// ---------------- c4：期待和现实的落差 → 固定的时间表 → 条件本来就不同 → 看清走了多远 ----------------
SCENES.c4={
 canvas(t,a){const s4=S.c4.start,tM=T('v30|磨合|s'),tG=T('v31|落差|s'),tAge=T('v32|某个年龄|s'),tSc=T('v33|时间表|s'),tLg=T('v33|落后|s'),tC=T('v34|条件|s'),tY=T('v35|一年时间|s'),tN=T('v35|下个月|s'),tK=T('v36|谨慎|s'),tI=T('v37|收入|s'),tF=T('v37|走了多远|s');
  snow(t,a*0.35,24,91);
  // 期待（直线）和现实（起伏）分开
  const eq=a*win(t,s4+0.1,tAge-0.2,0.4);if(eq>0){const q=eo(cl((t-s4-0.1)/1.6));line(partial([[220,1180],[860,720]],q),AU,2.6,eq,false,[10,7]);const R=[];for(let k=0;k<=40;k++){const u=k/40;R.push([220+u*640,1180-u*200+Math.sin(u*9)*24]);}gline(partial(R,q),IV,3,eq);
   if(q>0.95){ctext('期待',860,690,30,AU,eq,'right');ctext('现实',860,1010,30,IV,eq,'right');}const g=up(t,tG-0.1,0.5);if(g>0){line([[880,725],[880,lerp(725,975,g)]],AU,3,eq);ctext('落差',900,850,30,AU,eq*g,'left');}}
  // 固定的时间表：检查点一个个往前跑，人追不上
  const sq=a*win(t,tAge-0.3,tC-0.2,0.4);if(sq>0){line([[200,1180],[880,1180]],IV,1.5,sq*0.5);for(let k=0;k<8;k++)line([[240+k*88,1170],[240+k*88,1190]],IV,1.5,sq*0.5);
   const run=t>tSc?(t-tSc)*40:0;[['收入','v32|收入|s',460],['房子','v32|买什么房|s',620],['事业','v32|事业|s',780]].forEach(([s,k,x])=>{const q=up(t,T(k)-0.15,0.3);const xx=Math.min(x+run,960);card(xx-56,1060,xx+56,1120,s,AU,sq*q*(xx>900?0:1),30);ctext('应该',xx,1030,28,IV,sq*q*0.7*(xx>900?0:1));});
   const lag=up(t,tLg-0.1,0.5);person(300,1180,1.2,lag>0.5?GR:IV,sq,t<tLg?t*5:0,0,0);}
  // 条件本来就不同：同样是辞职，一条跑道长、一条跑道短
  const cq=a*win(t,tC-0.3,tF-0.4,0.4);if(cq>0){person(260,880,1.0,IV,cq,0,0,0);person(260,1120,1.0,IV,cq,0,0,0);
   [850,1090].forEach(y=>{line([[300,y-14],[880,y-14]],IV,1.2,cq*0.35);line([[300,y+14],[880,y+14]],IV,1.2,cq*0.35);for(let x=320;x<880;x+=40)line([[x,y],[x+16,y]],IV,1.5,cq*0.25);});line([[300,820],[300,1120]],AU,2.4,cq*0.8);ctext('同样是辞职',300,770,30,AU,cq,'left');
   const qa=eo(cl((t-tY+0.2)/1.0)),qb=eo(cl((t-tN+0.2)/0.6));hbarH(300,850,560*qa,AU,cq);hbarH(300,1090,130*qb,t>tK?AU:IV,cq);
   if(qa>0.5)ctext('一年，慢慢找方向',580,800,30,AU,cq);if(qb>0.5)ctext('下个月，要付生活费',300,1040,30,IV,cq,'left');
   if(t>tK){const q=0.5+0.5*Math.sin((t-tK)*4);rect(296,1070,436,1110,AU,2,cq*q);ctext('谨慎，有它的理由',640,1090,30,AU,cq*up(t,tK,0.4),'left');}}
  // 只用一把尺子比，看不清自己走了多远
  const fq=a*up(t,tI-0.3,0.4);if(fq>0){const rq=win(t,tI-0.3,tF-0.2,0.4);line([[200,760],[880,760]],IV,2,fq*rq*0.6,false,[3,8]);ctext('收入 · 职位 · 资产',540,720,30,IV,fq*rq);
   const q=eo(cl((t-tF+0.2)/1.4));if(q>0){const P=[[180,1180],[320,1150],[440,1170],[560,1110],[680,1130],[780,1080]];gline(partial(P,q),AU,3,fq);for(let k=0;k<5;k++){const p=along(P,(k+1)/6);if(q>(k+1)/6)dot(p[0],p[1],4,AU,fq);}person(780,1080,1.1,IV,fq*q,0,0,0);if(q>0.95)ctext('已经走了这么远',540,1240,30,AU,fq);}}},
 dom(t){op('e4n',up(t,T('v34|条件|s')));}};
function hbarH(x0,y,len,col,a){if(len<=0.5||a<=0.003)return;const g=X.createLinearGradient(x0,0,x0+len,0);g.addColorStop(0,rgba(col,0.1*a));g.addColorStop(1,rgba(col,0.5*a));X.fillStyle=g;X.fillRect(x0,y-14,len,28);gline([[x0,y-14],[x0+len,y-14],[x0+len,y+14],[x0,y+14]],col,1.6,a);}

// ---------------- c5：下一步更稳、更有选择 → 小步试 → 换一把尺子 ----------------
const STEPS=[[260,1180],[400,1130],[540,1080],[680,1030],[820,980]];
SCENES.c5={
 canvas(t,a){const s5=S.c5.start,tL=T('v39|一次改变命运|s'),tN=T('v39|下一步|s'),tB=T('v40|比如|s'),tC=T('v41|收藏教程|s'),tW=T('v41|每周|s'),tS=T('v41|节省了多少时间|s'),tR=T('v41|是否可靠|s'),tCost=T('v42|更小的代价|s'),tJ=T('v42|更具体的判断|s'),tM=T('v43|衡量|s');
  // 天边慢慢亮起来，雪变小
  snow(t,a*0.22,18,55);X.save();X.globalCompositeOperation='lighter';const gl=X.createRadialGradient(540,1300,0,540,1300,520);gl.addColorStop(0,rgba(AU,0.13*a*up(t,s5,2.0)));gl.addColorStop(1,rgba(AU,0));X.fillStyle=gl;X.fillRect(100,800,880,600);X.restore();
  line([[200,1220],[880,1220]],IV,1.5,a*0.4);
  const tq=a*win(t,s5,tL-0.1,0.6);if(tq>0){person(540,1220,1.5,IV,tq,0,0,0);for(let i=0;i<70;i++){const ph=((t-s5)*0.12+rnd(i*2.3))%1;const x=220+rnd(i*5.1)*640+Math.sin(t*0.7+i)*14,y=1220-ph*560;dot(x,y,1.6+rnd(i)*1.6,AU,tq*Math.sin(Math.PI*ph)*0.8);}}
  // 一次改变命运（大跳，虚线，退场）→ 下一步（小台阶 + 扶手）
  const lq=a*win(t,tL-0.2,tN,0.5);if(lq>0){const P=[];for(let k=0;k<=40;k++){const u=k/40;P.push([lerp(260,820,u),lerp(1180,700,u)-Math.sin(Math.PI*u)*120]);}line(partial(P,eo(cl((t-tL+0.2)/1.0))),IV,2.4,lq,false,[8,8]);ctext('一次改变命运',540,640,32,IV,lq);}
  const st=a*win(t,tN-0.2,tC-0.2,0.5);if(st>0){STEPS.forEach((p,i)=>{const q=up(t,tN+i*0.25,0.4);gline([[p[0]-60,p[1]],[p[0]+60,p[1]]],AU,3,st*q);if(i)line([[STEPS[i-1][0]+60,STEPS[i-1][1]],[p[0]-60,p[1]]],AU,2,st*q*0.6);});
   const hr=eo(cl((t-tN-0.6)/1.2));line(partial(STEPS.map(([x,y])=>[x,y-90]),hr),IV,2,st*0.6);
   [['看岗位要求','v40|真实的岗位要求|s'],['做个小项目','v40|小项目|s'],['试试适应','v40|是否适应|s'],['再加投入','v40|投入更多|s']].forEach(([s,k],i)=>{const q=up(t,T(k)-0.15,0.3);ctext(s,STEPS[i+1][0],STEPS[i+1][1]-40,28,AU,st*q);});
   const pi=t<tB?0:Math.min(4,Math.floor(1+(t-tB)/1.8));const pp=STEPS[pi];person(pp[0],pp[1],1.0,IV,st,0,0,0);}
  // 学 AI：别停在收藏；挑一项每周重复的活，掐表、核对
  const aq=a*win(t,tC-0.3,tCost-0.2,0.4);if(aq>0){const cd=win(t,tC-0.3,tW,0.4);for(let k=0;k<6;k++)card(220+k*6,1100-k*22,400+k*6,1140-k*22,k===5?'收藏的教程':'',GR,aq*cd*0.8,28);
   const wq=up(t,tW-0.2,0.4);card(420,880,700,1000,'每周重复的工作',IV,aq*wq,30);
   const sq=up(t,tS-0.2,0.4);if(sq>0){circ(800,940,56,IV,2,aq*sq);const m=-Math.PI/2+eo(cl((t-tS)/1.6))*4.2;gline([[800,940],[800+Math.cos(m)*44,940+Math.sin(m)*44]],AU,3,aq*sq);ctext('省了多少',800,1030,28,IV,aq*sq);}
   const rq=up(t,tR-0.1,0.4);if(rq>0){gline(partial([[500,1080],[540,1120],[620,1040]],rq),AU,4,aq);ctext('结果可靠吗',560,1170,28,AU,aq*rq);}}
  // 更小的代价 → 更具体的判断
  const cq=a*win(t,tCost-0.2,tM-0.2,0.4);if(cq>0){dot(320,980,12,AU,cq);ctext('更小的代价',320,1050,30,IV,cq);const q=up(t,tJ-0.2,0.5);if(q>0){gline([[380,980],[lerp(380,640,q),980]],AU,2,cq);circ(720,970,52,AU,2.4,cq*q);gline([[757,1007],[800,1050]],AU,4,cq*q);ctext('更具体的判断',720,1100,30,AU,cq*q);}}
  // 换一把尺子：能力 / 选择 / 身体 / 生活
  const rq=a*up(t,tM-0.2,0.5);if(rq>0){const C=[540,960],R=190;const AX=[['能力','v44|能力|s',-Math.PI/2],['选择','v44|选择|s',0],['身体','v44|身体|s',Math.PI/2],['生活','v44|生活|s',Math.PI]];
   [0.33,0.66,1].forEach(f=>{const P=AX.map(x=>[C[0]+Math.cos(x[2])*R*f,C[1]+Math.sin(x[2])*R*f]);P.push(P[0]);line(P,IV,1,rq*0.3);});
   const V=AX.map(([s,k,an],i)=>{const q=eo(cl((t-T(k)+0.1)/0.6));const v=0.75*q;line([C,[C[0]+Math.cos(an)*R,C[1]+Math.sin(an)*R]],IV,1,rq*0.4);
    ctext(s,C[0]+Math.cos(an)*(R+44),C[1]+Math.sin(an)*(R+34),30,q>0?AU:IV,rq);return [C[0]+Math.cos(an)*R*v,C[1]+Math.sin(an)*R*v];});
   const P=[...V,V[0]];gline(P,AU,3,rq*(T('v44|能力|s')<t?1:0));X.fillStyle=rgba(AU,0.1*rq);X.beginPath();P.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.fill();}},
 free(t,a){showText('e5core',{lines:[[['下一步，',null]],[['更稳、更有选择',GOLD]]],size:72,cy:800},t,T('v39|下一步|s')-0.3,T('v40|真实的岗位要求|s')-0.2,'粒子','吹散',a);}};

// ---------------- c6：十年还没写完 → 寒冬只是感受 → 慢一点、试一点 → 照顾眼前，给未来留空间 ----------------
SCENES.c6={
 canvas(t,a){const s6=S.c6.start,tY=T('v46|二零二零|s'),tF=T('v46|注定|s'),tW=T('v47|寒冬|s'),tP=T('v47|预测|s'),tA=T('v48|承认|s'),tS=T('v48|放慢脚步|s'),tO=T('v48|观察|s'),tTr=T('v48|尝试|s'),tAc=T('v48|积累条件|s'),tM=T('v49|对我来说|s');
  snow(t,a*0.2*(1-cl((t-tM)/3)),16,63);
  // 2020—2030：一页还没写完的纸
  const pq=a*win(t,s6,tA-0.2,0.5);if(pq>0){card(260,660,820,1000,'',IV,pq);for(let k=0;k<5;k++){const y=740+k*50,wq=k===0?eo(cl((t-tY)/1.2))*0.35:0;line([[300,y],[780,y]],IV,1,pq*0.3,false,[4,8]);if(wq>0)gline([[300,y],[300+480*wq,y]],AU,2.4,pq);}
   line([[260,1080],[820,1080]],IV,2,pq*0.6);ctext('2020',260,1120,30,IV,pq);ctext('2030',820,1120,30,IV,pq);if(t>tF)ctext('还没写完',540,1180,32,AU,pq*up(t,tF,0.4));}
  // 「寒冬」两个字被风吹散
  const wq=a*win(t,tW-0.2,tA,0.4);if(wq>0&&t<tP)ctext('寒冬',540,1250,40,IV,wq*0.6);if(t>tP)disperse(samplePts([[480,1250],[600,1250]],30),t,tP,a,IV,640,0.8);
  // 慢一点走：观察、试、攒条件
  const wk=a*win(t,tA-0.2,tM,0.5);if(wk>0){line([[200,1180],[880,1180]],IV,1.5,wk*0.5);const speed=t<tS?1:0.4,x=300+Math.min(260,(t-tA)*speed*36);person(x,1180,1.2,IV,wk,t*(t<tS?6:2.5),0,0);
   if(t>tO){const q=((t-tO)*0.5)%1;circ(x,1110,40+140*q,AU,1.4,wk*(1-q)*0.7,-1.2,1.2);}
   if(t>tTr){for(let k=0;k<3;k++){const q=up(t,tTr+k*0.3,0.3);gline([[x+60+k*50,1180-k*18],[x+100+k*50,1180-k*18]],AU,2.6,wk*q);}}
   if(t>tAc){for(let k=0;k<5;k++){const q=up(t,tAc+k*0.25,0.3);card(760,1140-k*44,860,1180-k*44,'',AU,wk*q);}}}
  // 结尾：一扇暖窗，人在窗外，旁边留出一片空
  const eq=a*up(t,tM-0.3,1.0);if(eq>0){X.save();X.globalCompositeOperation='lighter';const g=X.createRadialGradient(770,770,0,770,770,260);g.addColorStop(0,rgba(AU,0.22*eq));g.addColorStop(1,rgba(AU,0));X.fillStyle=g;X.fillRect(510,510,520,520);X.restore();
   X.fillStyle=rgba(AU,0.35*eq);X.fillRect(700,680,140,180);rect(700,680,840,860,AU,2.4,eq);line([[770,680],[770,860]],AU,1.6,eq*0.8);line([[700,770],[840,770]],AU,1.6,eq*0.8);
   person(320,1220,1.1,IV,eq,0,0,0);line([[200,1220],[880,1220]],IV,1.5,eq*0.4);for(let k=0;k<4;k++)line([[420+k*110,1220],[470+k*110,1220]],AU,2,eq*0.5*(1-k*0.2));}},
 free(t,a){showText('e6core',{lines:[[['照顾好眼前的生活，',null]],[['也给未来留一点空间',GOLD]]],size:64,cy:1030},t,T('v49|照顾好|s')-0.25,1e9,'逐字','逐字',a);}};

HOOKS.texA=(t,V)=>1-0.4*Math.max(V[1],V[6]);
