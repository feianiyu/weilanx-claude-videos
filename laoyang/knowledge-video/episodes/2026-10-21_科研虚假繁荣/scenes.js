// =====================================================================
// 《科研虚假繁荣》（系列上集）· 本期场景
// 文字效果（本期 3 种）：碎裂（v07「虚假繁荣，破了」）· 雾化/雾散（v10「旧地图，找不到新大陆」）· 逐字（v11 提问）
// 粒子世界（候选）：c0 资金流（粒子数与转化比等比）
// =====================================================================
const INV=[526,775,1000,1178,1521,1867,2541,2595,2953,2728.4];     // 科技活动费用（亿元），2015–2023 回推约数，2024 公报值
const OUT=[596,826,925,1395,2154,2365,2580,2575,2580,2200.9];     // 科技成果转让收入（亿元），引自原文数据图
const BX0=205,BDX=70,BW=44,BY=1240,BH=380/2953;                     // 柱子几何
const bx=i=>BX0+i*BDX, byv=v=>BY-v*BH;

// ---------------- c0：一块钱进去，八毛一回来 ----------------
const P0=(function(){
 const N=1100,CX=540,CY=1030,R=78,SP=0.3;            // SP：每秒走完路径的比例（漂）
 const tIn=T('v01|投进去|s')-0.3;
 const R0=[...Array(N)].map((_,i)=>({a:rnd(i*1.31+3),b:rnd(i*2.17+5),c:rnd(i*3.71+7),d:rnd(i*5.13+11)}));
 // 路径：0–0.4 输入直线；0.4–0.6 绕「科研」转一圈；0.6–1 输出直线
 function pos(i,t){const p=R0[i];const tl=tIn+p.a*1.4;if(t<tl)return null;              // 1.4s 内陆续发出，从左边流进来
  const s=(t-tl)*SP*(0.85+0.3*p.b),u=s-Math.floor(s);
  const jy=(p.c-0.5)*2*(10+6*Math.abs(nz(i,t,0.4)));
  if(u<0.4){const q=u/0.4;return {x:lerp(170,CX-R,q),y:CY+jy,seg:0};}
  if(u<0.6){const q=(u-0.4)/0.2,an=Math.PI+q*Math.PI*2*0.92;const rr=R+jy*0.6;return {x:CX+Math.cos(an)*rr,y:CY+Math.sin(an)*rr,seg:1,q};}
  return {x:lerp(CX+R,910,(u-0.6)/0.4),y:CY+jy,seg:2,u:(u-0.6)/0.4};}
 function draw(t,a){const [c,g]=layer('p0');g.globalCompositeOperation='lighter';
  const tOut=T('v01|转回|s'),tOld=T('v02|十年前|s');const keep=0.81;
  for(let i=0;i<N;i++){const P=pos(i,t);if(!P)continue;let x=P.x,y=P.y,al=0.5,col='#FFE9C4';
   if(P.seg===2){const lost=R0[i].d>keep;                                                  // 19% 在出口掉下去
    if(lost){const fu=P.u;y+=180*fu*fu+20*fu;x=lerp(CX+R,CX+R+120,fu)+nz(i,t,0.5)*10*fu;al=0.45*(1-fu);col='#8C857A';}
    else{col='#F0B429';al=0.65;}
    al*=cl((t-tOut+0.6)/0.6);}
   if(al<=0.01)continue;g.globalAlpha=al*a;g.fillStyle=col;g.fillRect(x-1.2,y-1.2,2.4,2.4);}
  // 十年前：输出端叠一条更宽的象牙色幽灵流（113%）
  const og=cl((t-tOld)/0.6);if(og>0){g.fillStyle='#FFE9C4';for(let i=0;i<Math.round(N*0.4*1.13);i++){const u=(rnd(i*7.7)+(t-tIn)*SP*0.9)%1,x=lerp(CX+R+10,910,u),y=CY-62+(rnd(i*3.3)-0.5)*2*20;g.globalAlpha=0.32*og*a*Math.sin(Math.PI*u);g.fillRect(x-1,y-1,2,2);}}
  g.globalAlpha=1;present(c,1,0.6);
  // 「科研」黑箱：旋转虚线圈
  const ra=a*cl((t-tIn)/0.5);if(ra>0){X.save();X.translate(CX,CY);X.rotate(t*0.8);X.setLineDash([6,10]);X.strokeStyle=rgba(IV,0.45*ra);X.lineWidth=2;X.beginPath();X.arc(0,0,R+30,0,6.283);X.stroke();X.restore();}}
 return {draw,tIn};})();

SCENES.c0={
 free(t,a){farField(t,a*0.7,300,40);P0.draw(t,a);},
 dom(t){const tIn=T('v01|投进去|s'),tOut=T('v01|八毛一|s'),tOld=T('v02|十年前|s');
  rise('k0inL',cl((t-tIn+0.2)/0.3));rise('k0in',cl((t-tIn+0.1)/0.3));op('k0lab',cl((t-tIn-0.2)/0.4)*0.9);
  rise('k0outL',cl((t-tOut+0.5)/0.3));rise('k0out',cl((t-tOut+0.4)/0.3));
  $('k0out').firstChild.textContent=(0.81*eo(cl((t-tOut+0.4)/0.8))).toFixed(2);
  rise('k0old',eo(cl((t-tOld)/0.4)));op('k0n1',cl((t-tOut)/0.4));op('k0n2',cl((t-tOut-0.2)/0.4));}};

// ---------------- c1：投入十年柱子 ----------------
function invBars(t,a,mode){if(a<=0)return;      // mode 0 = 生长；1 = 退成幽灵（c2 用）
 const t0=T('v03|十年里|s'),t5=T('v03|五倍多|s'),t24=T('v04|二零二四年|s'),tdn=T('v04|下降|s');
 for(let i=0;i<10;i++){let h;
  if(i<9){const ti=lerp(t0,t5-0.3,i/8);h=INV[i]*BH*eo(cl((t-ti)/0.5));}
  else{const up=eo(cl((t-t24)/0.5)),dn=io(cl((t-tdn-0.05)/SPEED.hit));h=(INV[8]*up-(INV[8]-INV[9])*dn)*BH;}
  if(h<=0.5)continue;const x=bx(i),top=BY-h;
  const hot=mode===0&&((i===8&&t>t5-0.2&&t<t24)||(i===9&&t>tdn));const col=hot?AU:IV;const al=mode===1?0.18:(hot?0.9:0.5);
  X.fillStyle=rgba(col,al*a);for(let y=BY-3;y>top;y-=6)X.fillRect(x,y,BW,3);                       // 点阵柱
  X.fillStyle=rgba(col,(mode===1?0.25:0.95)*a);X.fillRect(x,top-1,BW,3);}
 line([[180,BY+4],[900,BY+4]],IV,1.5,0.3*a);
 if(mode===0){impactRing(t,tdn+0.2,bx(9)+BW/2,byv(INV[9]),120,36,a,AU);
  const g5=cl((t-t5)/0.5);if(g5>0&&t<t24){gline([[bx(0)+BW/2,byv(INV[0])-14],[bx(8)+BW/2,byv(INV[8])-14]],AU,1.6,a*g5*0.7);}}}
SCENES.c1={
 canvas(t,a){invBars(t,a,0);},
 dom(t){const t0=T('v03|十年里|s'),t5=T('v03|五倍多|s'),t24=T('v04|二零二四年|s'),tdn=T('v04|下降|s');
  op('k1lab',cl((t-t0)/0.4));rise('k1w',cl((t-t0)/0.4));
  if(t<t24){$('k1pre').textContent='约';$('k1n').textContent=Math.round(2953*eo(cl((t-t0)/(t5-t0+0.2))));}
  else{$('k1pre').textContent='2024年';const q=io(cl((t-tdn-0.05)/0.3));$('k1n').textContent=(2953-(2953-2728.4)*q).toFixed(q>=1?1:0);}
  rise('k1x5',cl((t-t5)/0.3)*(1-cl((t-t24+0.2)/0.3)));
  const d=op('k1dn',cl((t-tdn)/0.25));d.style.transform=`scale(${(1.3-0.3*eo(cl((t-tdn)/0.25))).toFixed(3)})`;
  op('k1y0',cl((t-t0)/0.4));op('k1y1',cl((t-t24)/0.4));op('k1n1',cl((t-t0-0.5)/0.4));op('k1n2',cl((t-t24)/0.4));}};

// ---------------- c2：产出线叠上来 → 剪刀差 ----------------
SCENES.c2={
 canvas(t,a){const t0=S.c2.start,tn=T('v05|两千二百点九亿|s'),tx=T('v06|二零二二|s'),tf=T('v06|熄火|s');
  invBars(t,a,1);
  const P=INV.map((v,i)=>[bx(i)+BW/2,byv(v)]),Q=OUT.map((v,i)=>[bx(i)+BW/2,byv(v)]);
  gline(partial(P,eo(cl((t-t0)/0.8))),IV,2,a*0.75);
  const qq=eo(cl((t-t0-0.5)/1.6));gline(partial(Q,qq),AU,2.6,a);
  Q.forEach((p,i)=>{if(i/9<=qq+0.001)dot(p[0],p[1],i===9?5:3,AU,a*(i===9&&t>tn?1:0.7));});
  P.forEach((p,i)=>{if(i/9<=eo(cl((t-t0)/0.8))+0.001)dot(p[0],p[1],2.4,IV,a*0.6);});
  // 剪刀差：2021–2024 两线之间填充斜线
  const sq=eo(cl((t-tf)/0.6));if(sq>0){X.save();X.beginPath();for(let i=6;i<=9;i++)X.lineTo(P[i][0],P[i][1]);for(let i=9;i>=6;i--)X.lineTo(Q[i][0],Q[i][1]);X.closePath();X.clip();
   X.strokeStyle=rgba(AU,0.35*a*sq);X.lineWidth=1.2;for(let k=-400;k<400;k+=10){X.beginPath();X.moveTo(P[6][0]+k,700);X.lineTo(P[6][0]+k+300,1300);X.stroke();}X.restore();}
  // 2022、2023 停滞：两点脉冲
  const pq=cl((t-tx)/0.4);if(pq>0)for(const i of [7,8]){const r=8+10*Math.abs(Math.sin((t-tx)*4));X.save();X.globalCompositeOperation='lighter';X.strokeStyle=rgba(AU,0.6*a*pq);X.lineWidth=2;X.beginPath();X.arc(Q[i][0],Q[i][1],r,0,6.283);X.stroke();X.restore();}},
 dom(t){const t0=S.c2.start,tn=T('v05|两千二百点九亿|s'),tj=T('v05|减少|s'),t2=T('v05|两倍|s'),tf=T('v06|熄火|s');
  op('k2lab',cl((t-t0-0.3)/0.4));rise('k2w',cl((t-tn+0.3)/0.3));$('k2n').textContent=(2200.9*eo(cl((t-tn+0.3)/0.9))).toFixed(1);
  const cmp=1-cl((t-tf+0.2)/0.3);rise('k2a',cl((t-tj)/0.3)*cmp);rise('k2b',cl((t-tj-0.25)/0.3)*cmp);op('k2x',cl((t-t2)/0.3)*cmp);
  rise('k2cut',cl((t-tf)/0.35));op('k2la',cl((t-t0)/0.4));op('k2lb',cl((t-t0-0.5)/0.4));op('k2n1',cl((t-tn)/0.4));op('k2n2',cl((t-t0)/0.4));}};

// ---------------- c3：泡沫破了 → 五张病历卡 ----------------
const CARDS=[['课题式','验收即解散','v08|课题式|s'],['生产型','只为画图更快','v08|生产型|s'],['农闲式','闲了才搞科研','v08|农闲式|s'],['被动式','搞科研少拿奖金','v09|被动式|s'],['孤岛式','专利锁进档案柜','v09|孤岛式|s']];
const CPOS=[[160,800],[422,800],[684,800],[291,990],[553,990]];
(function(){$('k3cards').innerHTML=CARDS.map((c,i)=>`<div class="box" id="k3k${i}" style="left:${CPOS[i][0]}px;top:${CPOS[i][1]}px;width:236px;height:160px;opacity:0"><div style="font-size:44px">${c[0]}</div><div style="font-size:30px;color:#B4AC9F;font-weight:700">${c[1]}</div></div>`).join('');})();
const C3OUT=()=>T('v08|课题式|s')-0.75;                       // 「破了」停留约 1.3s 再逐字退场
const C3FREE=()=>C3OUT()+TXDUR.out['逐字']-0.15;              // 卡片最早出现时刻（文字基本退完）
const BUB=[[300,990,'v07|堆|s'],[540,940,'v07|凑|s'],[780,990,'v07|刷|s']];
SCENES.c3={
 canvas(t,a){const tb=T('v07|破了|s');
  // 三团泡沫：膨胀（漂）→ 破（击）
  BUB.forEach(([cx,cy,k],j)=>{const t0=T(k)-0.15,grow=eo(cl((t-t0)/1.2)),R=40+70*grow+6*Math.sin(t*3+j);
   if(t<tb){for(let i=0;i<70;i++){const an=rnd(j*100+i)*6.283+t*0.3*(rnd(i)-.5),rr=R*Math.sqrt(rnd(j*50+i*3));dot(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr*0.9,1.5,IV,a*grow*0.6);}
    X.save();X.strokeStyle=rgba(IV,0.35*a*grow);X.lineWidth=1.5;X.beginPath();X.arc(cx,cy,R,0,6.283);X.stroke();X.restore();}
   else if(t<tb+1.2){disperse(samplePts([[cx-R,cy],[cx,cy-R],[cx+R,cy],[cx,cy+R],[cx-R,cy]],48),t,tb,a,IV,300+j*40,1.6);}});
  // 病历卡：变灰后划一道
  CARDS.forEach((c,i)=>{const td=Math.max(T(c[2]),C3FREE())+0.8;const q=eo(cl((t-td)/0.35));if(q<=0)return;const [x,y]=CPOS[i];line([[x+18,y+142],[lerp(x+18,x+218,q),lerp(y+142,y+18,q)]],GR,2.5,a*0.9);});
  // 孤岛式：上锁
  const tl=T('v09|档案柜|s'),lq=eo(cl((t-tl)/0.3));if(lq>0){const [x,y]=CPOS[4],cx=x+200,cy=y+30;X.save();X.globalAlpha=a*lq;X.strokeStyle=AU;X.lineWidth=4;X.beginPath();X.arc(cx,cy-6,14,Math.PI,0);X.stroke();X.fillStyle=AU;X.fillRect(cx-19,cy-6,38,30);X.restore();}},
 free(t,a){const tb=T('v07|破了|s'),tOut=C3OUT();
  showText('k3core',{lines:[[['虚假繁荣，',null],['破了',GDc()]]],size:84,cy:1000},t,tb-TXDUR.in['碎裂'],tOut,'碎裂','逐字',a);
  impactRing(t,tb,540,1000,420,110,a*(t<tOut?1:0),AU);},
 dom(t){const tb=T('v07|破了|s');[['k3a','v07|堆|s'],['k3b','v07|凑|s'],['k3c','v07|刷|s']].forEach(([id,k])=>op(id,cl((t-T(k))/0.3)*(1-cl((t-tb)/0.2))));
  CARDS.forEach((c,i)=>{const ti=Math.max(T(c[2]),C3FREE());const p=eo(cl((t-ti+0.1)/0.3));const e=op('k3k'+i,p);e.style.transform=`translateY(${(-30*(1-p)).toFixed(1)}px)`;
   const g=cl((t-ti-0.8)/0.4);e.style.color=g>0.5?'#8C857A':'#fff';e.style.borderColor=g>0.5?'rgba(140,133,122,.4)':'rgba(255,236,200,.32)';});
  op('k3src',cl((t-T('v08|病症|s'))/0.4));}};
function GDc(){return '#F0B429';}

// ---------------- c4：我的判断 · 旧地图 ----------------
const MAPR=(function(){const out=[];for(const [cx,cy,n,s] of [[420,1150,6,3],[700,1210,4,17]])for(let k=1;k<=n;k++)out.push({cx,cy,r:k*34,seed:s+k*7});return out;})();
SCENES.c4={
 canvas(t,a){const tm=T('v10|拿着|s')-0.2;const q=cl((t-tm)/1.2);if(q<=0)return;
  MAPR.forEach((m,k)=>{const pts=[];for(let i=0;i<=48;i++){const an=i/48*6.283;const rr=m.r*(1+0.18*Math.sin(an*3+m.seed)+0.08*Math.sin(an*5+m.seed*2)+0.03*Math.sin(t*0.4+k));pts.push([m.cx+Math.cos(an)*rr*1.4,m.cy+Math.sin(an)*rr*0.7]);}
   line(partial(pts,eo(cl(q*1.4-k*0.05))),IV,1.2,a*0.28);});
  // 虚线航线：走到地图边缘就断了
  const route=[[150,1300],[300,1230],[430,1180],[560,1200],[690,1150],[800,1120]];line(partial(route,eo(cl((t-tm-0.4)/1.4))),AU,2,a*0.7,false,[10,10]);},
 free(t,a){const tm=T('v10|拿着|s')-0.25,tOut=S.c5.start-TXDUR.out['雾散']-0.1;
  showText('k4core',{lines:[[['旧地图，',null],['找不到新大陆',GDc()]]],size:72,cy:1090},t,tm,tOut,'雾化','雾散',a,0.25);},
 dom(t){const tj=T('v10|我|s'),tb=T('v10|商业模式|s')-0.15;const jq=cl((t-tj-0.4)/0.22);const e=op('k4top',jq>0?1:0);e.style.transform=`scale(${(1.2-0.2*eo(jq)).toFixed(4)})`;
  op('k4b',cl((t-tb)/0.35));hl(e,t>tb,'#F5A623');op('k4src',cl((t-T('v10|拿着|s'))/0.4));}};

// ---------------- c5：二选一 ----------------
SCENES.c5={
 canvas(t,a){const tl=T('v11|接着投|s'),tr=T('v11|选方向|s'),pl=cl((t-tl)/0.4),pr=cl((t-tr)/0.4);
  for(let k=0;k<6;k++){X.save();X.strokeStyle=rgba(k===5?AU:IV,(0.25+0.6*pl)*a);X.lineWidth=2;X.beginPath();X.ellipse(325,1040-k*16,62,14,0,0,6.283);X.stroke();X.restore();}   // 硬币堆
  const cx=755,cy=980,ang=-0.6+0.4*Math.sin(t*1.6)*(1-pr)+(pr>0?0:0);X.save();X.strokeStyle=rgba(AU,(0.3+0.7*pr)*a);X.lineWidth=2.5;X.beginPath();X.arc(cx,cy,70,0,6.283);X.stroke();X.restore();   // 罗盘
  gline([[cx-Math.cos(ang)*58,cy-Math.sin(ang)*58],[cx+Math.cos(ang)*58,cy+Math.sin(ang)*58]],AU,3,a*(0.3+0.7*pr));
  const vq=cl((t-S.c5.start-0.25)/0.5);if(vq>0){gline([[540,820],[540,lerp(820,920,eo(vq))]],AU,2,a*0.7);gline([[540,1150],[540,lerp(1150,1030,eo(vq))]],AU,2,a*0.7);}},
 free(t,a){const s=S.c5;showText('k5core',{lines:[[['你们院，选哪边？',null]]],size:64,cy:1266},t,T('v11|你们|s')-0.2,s.end-TXDUR.out['逐字']-0.05,'逐字','逐字',a);},
 dom(t){const tl=T('v11|接着投|s'),tr=T('v11|选方向|s');const pl=cl((t-tl)/0.35),pr=cl((t-tr)/0.35);
  hl($('k5L'),pl>0,'#FFE9C4');$('k5L').style.color=pl>0?'#FFE9C4':'#C9C2B6';hl($('k5R'),pr>0,'#F0B429');$('k5R').style.color=pr>0?'#F0B429':'#C9C2B6';
  const l0=eo(cl((t-S.c5.start)/0.4));$('k5L').style.transform=`translateX(${(-50*(1-l0)).toFixed(1)}px)`;$('k5R').style.transform=`translateX(${(50*(1-l0)).toFixed(1)}px)`;$('k5L').style.opacity=$('k5R').style.opacity=l0.toFixed(3);
  const vq=eo(cl((t-S.c5.start-0.25)/0.3));const vs=op('k5vs',vq);vs.style.transform=`scale(${(1.5-0.5*vq).toFixed(3)})`;vs.style.textShadow='0 0 18px rgba(245,166,35,.6),0 3px 10px rgba(0,0,0,.7)';}};

// ---------------- c6 片尾：外壳 logo + 「下期讲：去哪里」 ----------------
SCENES.c6={free(t,a){const tq=T('v12|下期|s'),q=eo(cl((t-tq+0.1)/0.4));if(q<=0)return;
 X.save();X.globalAlpha=a*q;X.font='800 36px NSC';X.textAlign='center';X.textBaseline='middle';X.fillStyle='#C9C2B6';X.fillText('下期讲：',496,1218+10*(1-q));X.fillStyle='#F5A623';X.fillText('去哪里',600,1218+10*(1-q));X.restore();}};

HOOKS.texA=(t,V)=>1-0.6*V[0];
