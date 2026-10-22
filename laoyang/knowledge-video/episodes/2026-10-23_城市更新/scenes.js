// =====================================================================
// 《城市更新，从工程改造走向长期运营》（老板读研报）· 本期场景
// 文字效果（本期 3 种）：光扫（c1 报告判断）· 粒子/吹散（c3 接起来）· 逐字（c5 缺的能力）
// =====================================================================
const GOLD='#F0B429',GRN='#3CF07A';
const fade=(t,a,b,d)=>cl((t-a)/(d||0.3))*(1-cl((t-b)/(d||0.3)));

// ---------------- c0：75 平方公里地块点亮 + 150 栋楼 ----------------
const P0=(function(){const C=15,R=8,W=46,x0=196,y0=820;const cells=[];for(let r=0;r<R;r++)for(let c=0;c<C;c++)cells.push([x0+c*W,y0+r*W]);
 const ord=[...cells.keys()].sort((a,b)=>rnd(a*1.7+3)-rnd(b*1.7+3));const lit=new Set(ord.slice(0,75));return {cells,lit,W};})();
SCENES.c0={
 canvas(t,a){const t0=T('v01|盘活|s'),t1=T('v01|一百五十栋|s'),t2=T('v02|但|s');const dim=1-0.6*cl((t-t2)/0.5);
  P0.cells.forEach((p,i)=>{const pin=cl((t-S.c0.start-0.1-(i%15)*0.012-Math.floor(i/15)*0.03)/0.3);if(pin<=0)return;
   const on=P0.lit.has(i)?eo(cl((t-t0-rnd(i)*0.9)/0.25)):0;const s=P0.W-10;
   X.save();X.globalAlpha=a*pin*dim*(on>0?0.35+0.55*on:0.22);X.strokeStyle=on>0.5?GOLD:IV;X.lineWidth=1.5;X.strokeRect(p[0],p[1],s,s);
   if(on>0){X.fillStyle=rgba(GOLD,0.22*on);X.fillRect(p[0],p[1],s,s);}X.restore();});
  // 150 栋：地块上冒出的细楼线（每根代表 5 栋）
  for(let k=0;k<30;k++){const q=eo(cl((t-t1-k*0.03)/0.35));if(q<=0)continue;const i=[...P0.lit][k*2];const p=P0.cells[i];const h=(30+rnd(k*5)*60)*q;
   gline([[p[0]+18,p[1]+18],[p[0]+18,p[1]+18-h]],IV,2,a*0.8*dim);}},
 dom(t){const t0=T('v01|七十五|s'),t1=T('v01|一百五十栋|s'),t2=T('v02|设计|s'),t3=T('v02|施工|s'),t4=T('v02|拿到|s');
  rise('a0n1',cl((t-t0+0.15)/0.3));countUp('a0n1',75,(t-t0)/0.6);rise('a0l1',cl((t-t0)/0.3));
  rise('a0n2',cl((t-t1+0.15)/0.3));countUp('a0n2',150,(t-t1)/0.6);rise('a0l2',cl((t-t1)/0.3));
  rise('a0c1',cl((t-t2+0.1)/0.3));rise('a0c2',cl((t-t3+0.1)/0.3));const c3=rise('a0c3',cl((t-t4)/0.2));
  const g=cl((t-t4)/0.25);['a0c1','a0c2'].forEach(id=>{const e=$(id);e.style.borderColor=g>0.5?'#8C857A':'';e.style.color=g>0.5?'#8C857A':'';});
  c3.style.transform=`scale(${(1.25-0.25*eo(cl((t-t4)/0.25))).toFixed(3)})`;op('a0src',cl((t-t0)/0.4));},
 free(t,a){const t4=T('v02|拿到|s');if(t<t4)return;const q=eo(cl((t-t4)/0.25));
  // 两个技能被划掉
  [[190,1226,340],[400,1226,550]].forEach(([x0,y,x1])=>gline([[x0-6,y],[lerp(x0-6,x1+6,q),y]],GR,3,a*0.9));}};

// ---------------- c1：价值链在「交付」之后延伸到「运营」 ----------------
const NX1=[195,345,495,645],NY1=840;
SCENES.c1={
 canvas(t,a){const s=S.c1.start,tg=T('v03|工程改造|s'),tl=T('v03|长期运营|s'),tp=T('v04|过去|s'),tn=T('v04|现在|s');
  const q=eo(cl((t-s-0.2)/1.0));const old=cl((t-tp)/0.4)*(1-cl((t-tn)/0.4));
  line([[NX1[0],NY1],[lerp(NX1[0],NX1[3],q),NY1]],old>0.5?GR:IV,3,a*0.7);
  NX1.forEach((x,i)=>dot(x,NY1,i===3?7:5,(tg<t&&t<tl+0.3)?AU:IV,a*cl((t-s-0.2-i*0.2)/0.3)));
  // 交付处的终止线（过去：交付就结束）
  const st=cl((t-T('v04|交付就结束|s'))/0.25)*(1-cl((t-tn)/0.4));if(st>0)line([[NX1[3]+16,NY1-34],[NX1[3]+16,NY1+34]],GR,4,a*st);
  // 长期运营：绿线一直往后延伸 + 流动的点
  const g=eo(cl((t-tl)/0.9));if(g>0){gline([[NX1[3],NY1],[lerp(NX1[3],930,g),NY1]],GRN,3.4,a);
   for(let k=0;k<10;k++){const ph=((t-tl)*0.35+k/10)%1;dot(lerp(NX1[3],930,ph),NY1,2.4,GRN,a*g*(1-0.6*old));}
   for(let k=0;k<6;k++){const x=NX1[3]+40+k*48;line([[x,NY1+14],[x,NY1+24]],GRN,1.5,a*g*0.6);}}
  // 现在：策划阶段就连到运营（金色弧）
  const arc=eo(cl((t-tn)/0.8));if(arc>0){const P=[];for(let i=0;i<=40;i++){const u=i/40;P.push([lerp(NX1[0],840,u),NY1-30-Math.sin(Math.PI*u)*150]);}
   gline(partial(P,arc),AU,3,a);if(arc>0.98)dot(840,NY1-30,6,AU,a);}
  impactRing(t,tl+0.2,840,NY1,120,60,a,GRN);},
 free(t,a){showText('a1core',{lines:[[['从工程改造，',null]],[['走向',null],['长期运营',GRN]]],size:76,cy:1150},t,T('v03|城市更新正在|s')-0.25,T('v04|现在|s')-0.1,'光扫','光扫',a);},
 dom(t){const s=S.c1.start;[0,1,2,3].forEach(i=>op('a1n'+i,cl((t-s-0.2-i*0.2)/0.3)));op('a1n4',cl((t-T('v03|长期运营|s'))/0.4));
  rise('a1old',fade(t,T('v04|过去|s'),T('v04|现在|s')));rise('a1q1',cl((t-T('v04|谁来运营|s')+0.1)/0.3));rise('a1q2',cl((t-T('v04|持续收入|s')+0.2)/0.3));
  op('a1src',cl((t-T('v03|发布|s'))/0.4));}};

// ---------------- c2：10/23/14 → 43 个省市 → 北京 1321 个项目 ----------------
const M43=(function(){const out=[];const kinds=[...Array(15).fill(0),...Array(4).fill(1),...Array(24).fill(2)];
 for(let i=0;i<43;i++){const an=rnd(i*3.7)*6.283,r=Math.sqrt(rnd(i*5.3+1))*1;out.push({x:540+Math.cos(an)*r*330,y:1000+Math.sin(an)*r*150,k:kinds[(i*7)%43]});}return out;})();
const BJ=(function(){const N=1321,C=48,out=[];for(let i=0;i<N;i++){const c=i%C,r=Math.floor(i/C);out.push([300+c*10+(r%2)*5,760+r*12]);}return out;})();
SCENES.c2={
 canvas(t,a){const t6=T('v06|四十三|s'),tp=T('v06|具体项目|s'),t7=T('v07|北京|s'),tq=T('v07|一千三百二十一|s'),t8=T('v08|标准|s');
  // 43 个省市点
  const mOut=cl((t-t7)/0.4);if(t>t6-0.1&&mOut<1)M43.forEach((m,i)=>{const p=eo(cl((t-t6-i*0.02)/0.15));if(p<=0)return;const col=m.k===1?AU:IV,r=m.k===0?6:m.k===1?8:4;
   dot(m.x,m.y,r*p,col,a*(1-mOut)*(m.k===1?1:0.75));
   if(t>tp){for(let j=0;j<4;j++){const ph=((t-tp)*0.7+rnd(i*4+j))%1;dot(m.x+(rnd(i+j*9)-.5)*60*ph,m.y-40*ph,1.6,IV,a*(1-mOut)*0.6*Math.sin(Math.PI*ph));}}});
  // 北京 1321 个项目：从一点铺开成点阵；「标准」一扫，扫过的变绿
  if(t>t7){const [c,g]=layer('bj');g.globalCompositeOperation='lighter';const sw=lerp(260,820,eo(cl((t-t8)/0.9)));
   BJ.forEach((p,i)=>{const q=eo(cl((t-tq+0.2-rnd(i)*0.8)/0.4));if(q<=0)return;const x=lerp(540,p[0],q),y=lerp(1000,p[1],q);
    g.globalAlpha=a*0.85;g.fillStyle=(t>t8&&p[0]<sw)?GRN:(rnd(i*2)<0.5?GOLD:'#FFE9C4');g.fillRect(x-1.6,y-1.6,3.2,3.2);});
   g.globalAlpha=1;present(c,1,0.4);if(t>t8&&t<t8+1.2)line([[sw,740],[sw,1100]],GRN,2,a*0.8);}},
 dom(t){const t5=T('v05|十项|s'),t6=T('v06|四十三|s'),t7=T('v07|北京|s'),ty=T('v07|一千零四十九|s');const out5=1-cl((t-t7+0.3)/0.3);
  [['v05|十项|s',10],['v05|二十三项|s',23],['v05|十四项|s',14]].forEach(([k,n],i)=>{const tk=T(k);const p=eo(cl((t-tk+0.15)/0.3));const e=op('a2b'+i,p*out5);
   e.style.transform=`scale(${(1.15-0.15*p).toFixed(3)})`;countUp('a2k'+i,n,(t-tk)/0.5);hl(e,t>tk&&t<tk+0.6,'#F0B429');});
  rise('a2m',fade(t,t6+0.4,t7-0.3));op('a2src',cl((t-t5)/0.4)*(1-cl((t-t7)/0.3)));
  rise('a2bj',cl((t-t7)/0.3));rise('a2y',cl((t-ty+0.15)/0.3));countUp('a2y',1049.5,(t-ty)/0.8,v=>v.toFixed(1));rise('a2yl',cl((t-ty)/0.3));op('a2src2',cl((t-t7)/0.4));}};

// ---------------- c3：机会从工程延伸到运营全链 ----------------
const KX=[220,380,540,700,860],KY=700,KK=['v09|工程建设|s','v09|资产整合|s','v09|招商租赁|s','v09|商业经营|s','v09|社区服务|s'];
SCENES.c3={
 canvas(t,a){const tc=T('v10|只做一段|s'),tj=T('v10|接起来|s');
  KK.forEach((k,i)=>{const q=eo(cl((t-T(k))/0.3));if(q<=0)return;if(i>0)gline([[KX[i-1]+12,KY],[lerp(KX[i-1]+12,KX[i]-12,q),KY]],t>tj?GRN:IV,2.4,a*(t>tj?1:0.6));
   dot(KX[i],KY,i===0?8:6,i===0?AU:(t>tj?GRN:IV),a*q);});
  // 收入曲线：左边只有一次脉冲，右边接起来后持续往上
  const ax=cl((t-tc+0.3)/0.5);if(ax>0){line([[180,1060],[900,1060]],IV,1.5,a*0.4*ax);line([[180,860],[180,1060]],IV,1.5,a*0.4*ax);}
  const one=cl((t-tc)/0.6);if(one>0){const P=[];for(let i=0;i<=40;i++){const u=i/40,x=lerp(180,520,u);P.push([x,1060-Math.exp(-Math.pow((u-0.18)/0.07,2))*150]);}gline(partial(P,eo(one)),GR,2.6,a);}
  const cont=eo(cl((t-tj)/1.2));if(cont>0){const P=[];for(let i=0;i<=40;i++){const u=i/40,x=lerp(560,900,u);P.push([x,1060-u*150-Math.sin(u*18)*8]);}gline(partial(P,cont),GRN,3,a);
   for(let k=0;k<14;k++){const ph=((t-tj)*0.6+k/14)%1;dot(lerp(KX[0],KX[4],ph),KY,2.4,GRN,a*cont);}}},
 free(t,a){const tj=T('v10|才有|s');showText('a3core',{lines:[[['改造接上运营，',null]],[['才有',null],['持续收入',GRN]]],size:72,cy:1190},t,tj-0.3,S.c3.end-TXDUR.out['吹散']-0.1,'粒子','吹散',a,0.4);},
 dom(t){KK.forEach((k,i)=>{const p=eo(cl((t-T(k)+0.05)/0.3));const e=rise('a3k'+i,p);e.style.color=t>T('v10|接起来|s')?(i===0?'#E9E4DA':'#3CF07A'):(i===0?'#F0B429':'');});
  rise('a3l1',cl((t-T('v10|只做一段|s'))/0.3));rise('a3l2',cl((t-T('v10|接起来|s'))/0.3));op('a3src',cl((t-S.c3.start)/0.4));}};

// ---------------- c4：改得好 ≠ 用得下去（楼宇亮窗随年份推进） ----------------
const BW=[380,700],BT=640,BB=1150;
SCENES.c4={
 canvas(t,a){const s=S.c4.start,tg=T('v11|改得好|s'),tu=T('v11|一直用下去|s'),te=T('v11|经营下去|s');
  const q=eo(cl((t-s-0.1)/0.8));const out=[[BW[0],BB],[BW[0],BT+60],[540,BT],[BW[1],BT+60],[BW[1],BB],[BW[0],BB]];gline(partial(out,q),t>tg&&t<tu?AU:IV,2.6,a*0.85);
  // 窗：先是「改好」一下子全亮，再随时间一格格持续点亮（经营）
  for(let r=0;r<9;r++)for(let c=0;c<6;c++){const x=BW[0]+30+c*48,y=BT+100+r*44;const i=r*6+c;
   const flash=cl((t-tg)/0.2)*(1-cl((t-tg-0.6)/0.6));const run=t>tu?(((t-tu)*1.6+rnd(i*3.3)*9)%9<6?1:0.25)*cl((t-tu)/0.5):0;
   const v=Math.max(flash*0.8,run);if(v<=0.02)continue;X.save();X.globalAlpha=a*v*(run>0?0.85:0.6);X.fillStyle=run>0?GRN:AU;X.fillRect(x,y,28,22);X.restore();}
  // 时间轴：年份刻度一直往前走
  const tk=cl((t-te)/0.5);if(tk>0){line([[160,1190],[920,1190]],IV,1.5,a*0.5*tk);for(let k=0;k<9;k++){const x=160+((k*95-(t-te)*60)%760+760)%760;line([[x,1182],[x,1198]],GRN,2,a*tk*0.8);}}
  impactRing(t,s+0.05,540,900,260,260,a,AU);},
 dom(t){rise('a4a',cl((t-T('v11|改得好|s'))/0.3));rise('a4b',cl((t-T('v11|一直用下去|s'))/0.3));op('a4src',cl((t-S.c4.start)/0.4));}};

// ---------------- c5：三项清单 → 缺口 → 三条路 ----------------
const CX5=[425,625,825],RY5=[738,838,938],GAP=[[0,2],[1,1],[2,0]];
function tick(x,y,s,col,a){line([[x-s,y],[x-s*0.3,y+s*0.7],[x+s,y-s*0.8]],col,4,a);}
SCENES.c5={
 canvas(t,a){const s=S.c5.start,tr=T('v12|列出来|s'),th=[T('v13|谁运营|s'),T('v13|收入从哪来|s'),T('v13|哪一段|s')],tw=T('v14|写不出来|s'),tp=T('v15|要么|s');
  const g=cl((t-tr)/0.4);if(g>0){[0,1,2,3].forEach(r=>line([[160,700+r*100],[920,700+r*100]],IV,1.2,a*0.35*g));[0,1,2].forEach(c=>line([[CX5[c]-100,630],[CX5[c]-100,1000]],IV,1.2,a*0.25*g));}
  [0,1,2].forEach(c=>[0,1,2].forEach(r=>{const isGap=GAP.some(([gr,gc])=>gr===r&&gc===c);const tc=th[c]+0.25+r*0.12;
   if(!isGap){const q=cl((t-tc)/0.25);if(q>0)tick(CX5[c],RY5[r],16,AU,a*q*(t>tw?0.4:1));}
   else{const q=cl((t-tw)/0.3);if(q>0){const pul=0.6+0.4*Math.sin((t-tw)*6);line([[CX5[c]-80,RY5[r]-36],[CX5[c]+80,RY5[r]-36],[CX5[c]+80,RY5[r]+36],[CX5[c]-80,RY5[r]+36],[CX5[c]-80,RY5[r]-36]],GOLD,2.4,a*q*pul,false,[8,6]);}
    const pq=eo(cl((t-tp-0.2)/0.6));if(pq>0){const tx=[237,497,774][c];gline([[CX5[c],RY5[r]+40],[lerp(CX5[c],tx,pq),lerp(RY5[r]+40,1222,pq)]],AU,2,a*0.7);}}}));},
 free(t,a){showText('a5core',{lines:[[['写不出的那一段，',null]],[['就是缺的',null],['能力',GOLD]]],size:68,cy:1120},t,T('v14|写不出来|s')-0.25,T('v15|要么|s')+0.1,'逐字','逐字',a);},
 dom(t){const tr=T('v12|列出来|s');[0,1,2].forEach(r=>rise('a5r'+r,cl((t-tr-r*0.15)/0.3)));
  [['v13|谁运营|s'],['v13|收入从哪来|s'],['v13|哪一段|s']].forEach(([k],c)=>rise('a5h'+c,cl((t-T(k)+0.1)/0.3)));
  [['v15|自己建|s'],['v15|找合作|s'],['v15|收购|s']].forEach(([k],i)=>{const p=eo(cl((t-T(k)+0.1)/0.3));const e=rise('a5p'+i,p);hl(e,p>0.9&&t<T(k)+0.8,'#F0B429');});
  op('a5src',cl((t-tr)/0.4));}};

HOOKS.texA=(t,V)=>1-0.5*Math.max(V[0],V[1]);
