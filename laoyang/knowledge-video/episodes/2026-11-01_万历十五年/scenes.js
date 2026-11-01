// =====================================================================
// 《重读万历十五年》· 本期场景
// 全片一个意象：一张整齐的点阵 =「系统」，六颗光点 = 六个顶级的人。
//   c0 点阵极静 → 从内部一颗颗暗下去（表面太平，里面已空）
//   c1 六颗光点各自用尽全力，各自熄成灰（改 / 圆 / 廉 / 武 / 权 / 醒）→ 六颗灰烬排成一行
//   c2 笔直的格线被人情缠成乱结；能人被缠住，灰点随波漂着
//   c3 齿轮越转越快，产出始终为 0
//   c4 一颗光点从下限升起，撞上看不见的天花板 —— 天花板原来就是那张点阵
//   c5 二选一：人不行 / 路不通
// 文字效果（3 种）：光扫（v11）· 碎裂（v16，落在收一拍后的击拍上）；c0 不用核心文字，只靠头条
// 颜色：同一时刻只亮一种彩色——金色给「正在发力的人」，其余象牙低透明、失败的变灰
// =====================================================================
const GOLD='#F0B429',GRAY='#8C857A',IVO='#FFE9C4';

// ---------------- 点阵（系统）----------------
const GC=13,GRW=13,GX=i=>220+i*50,GY=j=>650+j*50;
const GRID=[];for(let j=0;j<GRW;j++)for(let i=0;i<GC;i++)GRID.push({i,j,x:GX(i),y:GY(j),k:j*GC+i});
// 「从内部溃烂」的顺序：离中心越近越早暗，带一点随机
const ROT=GRID.map(p=>Math.hypot(p.i-6,p.j-6)/8.5*0.75+rnd(p.k*1.7)*0.25);

// 六个人：所在节点、名字、关键时刻（全部挂在配音的词上）
const PP=[
 {n:'张居正',w:'改',x:GX(2),y:GY(2),on:()=>T('v04|张居正|s'),off:()=>T('v04|抄家|s')},
 {n:'申时行',w:'圆',x:GX(9),y:GY(3),on:()=>T('v05|申时形|s'),off:()=>T('v05|没救下局|s')},
 {n:'海瑞',  w:'廉',x:GX(6),y:GY(5),on:()=>T('v06|海瑞|s'),off:()=>T('v06|没人听|s')},
 {n:'戚继光',w:'武',x:GX(2),y:GY(8),on:()=>T('v07|戚继光|s'),off:()=>T('v07|罢了官|s')},
 {n:'万历',  w:'权',x:GX(7),y:GY(9),on:()=>T('v08|万历|s'),off:()=>T('v08|不上朝|s')},
 {n:'李贽',  w:'醒',x:880,y:GY(1),on:()=>T('v09|李贽|s'),off:()=>T('v09|狱中|s')}];
// 申时行的「裂缝」：一竖条缺掉的点
const CRACK=new Set(GRID.filter(p=>p.i===10&&p.j>=2&&p.j<=6).map(p=>p.k));
// 灰烬一行（v10）
const ASH=PP.map((_,m)=>[275+m*106,1250]);

function canvasText(txt,x,y,size,col,al,align){if(al<=0.01)return;X.save();X.font=`800 ${size}px NSC`;X.textAlign=align||'center';X.textBaseline='middle';
 X.fillStyle=rgba(col,al);X.shadowColor='rgba(0,0,0,.7)';X.shadowBlur=8;X.fillText(txt,x,y);X.restore();}

// 每个人在 t 时刻的位置、颜色、亮度
function person(m,t){const p=PP[m],t1=p.on(),t2=p.off(),t3=S.c1.start;let x=p.x,y=p.y,col=IVO,al=0,r=4;
 const drop=eo(cl((t-T('v03|六个人|s')-m*0.12)/0.5));if(drop<=0)return null;y-=(1-drop)*120;al=0.45*drop;
 const act=cl((t-t1)/0.25),dead=cl((t-t2)/0.5);
 if(act>0){col=dead>0.5?GRAY:GOLD;al=lerp(0.45,1,act)*(1-0.45*dead);r=lerp(4,6.5,act)*(1-0.25*dead);}
 if(m===2&&act>0){const up=eo(cl((t-t1)/0.6));y-=70*up;if(dead<0.5)col='#FFFFFF';}             // 海瑞：被托上高台
 if(m===3&&t>T('v07|靠山|s')){const s=eo(cl((t-T('v07|靠山|s'))/0.6));x=lerp(p.x,170,s);}      // 戚继光：被推到边缘
 if(m===1&&act>0&&dead<1){const an=(t-t1)*2.6;x=GX(10)+Math.cos(an)*60;y=GY(4)+Math.sin(an)*110;} // 申时行：绕着裂缝打转
 if(m===5)al*=1-cl((t-t2-0.2)/0.8);                                                           // 李贽：熄灭
 // v10：六颗灰烬排成一行
 const g=eo(cl((t-T('v10|所有人|s')-m*0.08)/0.8));if(g>0){x=lerp(x,ASH[m][0],g);y=lerp(y,ASH[m][1],g);col=GRAY;al=Math.max(al,0.6)*(m===5?1:1);if(m===5)al=0.6*g;r=5;}
 return {x,y,col,al,r,act,dead};}

SCENES.c0={
 free(t,a){const t0=S.c0.start,tr=T('v02|尽头|s')-0.2;const [c,g]=layer('w0');g.globalCompositeOperation='lighter';
  for(const p of GRID){const pin=eo(cl((t-t0-0.15-p.j*0.05)/0.5));if(pin<=0)continue;
   const rot=cl((t-tr-ROT[p.k]*1.6)/0.6);const col=rot>0.5?GRAY:IVO;const al=pin*lerp(0.75,0.18,rot);
   g.globalAlpha=al*a;g.fillStyle=col;const r=lerp(2.6,1.8,rot);g.fillRect(p.x-r,p.y-r,2*r,2*r);}
  g.globalAlpha=1;present(c,1,0.4);
  // 极淡的格线：秩序感
  const lq=eo(cl((t-t0-0.6)/1.2));for(let j=0;j<GRW;j++)line([[GX(0),GY(j)],[GX(GC-1),GY(j)]],IVO,1,0.05*a*lq);},
 dom(t){op('w0n',0);}};

// 公用：c1 及以后的底层点阵（已经暗下去的状态）
function gridBase(t,a,fn){const [c,g]=layer('wg');g.globalCompositeOperation='lighter';
 for(const p of GRID){let [x,y,al,col]=[p.x,p.y,0.42,GRAY];const o=fn?fn(p,x,y):null;if(o){if(o.skip)continue;[x,y,al,col]=[o.x??x,o.y??y,o.al??al,o.col??col];}
  g.globalAlpha=al*a;g.fillStyle=col;g.fillRect(x-2.2,y-2.2,4.4,4.4);}
 g.globalAlpha=1;present(c,1,0.3);}

SCENES.c1={
 free(t,a){
  const tz=T('v04|张居正|s'),tzb=T('v04|抄家|s'),th1=T('v06|海瑞|s'),th2=T('v06|没人听|s'),ts=T('v05|申时形|s'),tw=T('v10|所有人|s');
  const fade=1-0.7*cl((t-tw)/0.8);
  // 张居正的金线：从他的节点斜劈过去，周围的点被推开；「抄家」时碎掉，网格合拢
  const LZ=[[PP[0].x,PP[0].y],[PP[0].x+560,PP[0].y+360]];const lq=eo(cl((t-tz-0.3)/0.8)),lb=cl((t-tzb)/0.6);
  gridBase(t,a*fade,(p,x,y)=>{
   if(t>ts-0.3&&CRACK.has(p.k))return {skip:true};                                   // 申时行面前的裂缝，一直补不上
   let o={};
   if(lq>0&&lb<1){const dx=LZ[1][0]-LZ[0][0],dy=LZ[1][1]-LZ[0][1],L=Math.hypot(dx,dy),u=((x-LZ[0][0])*dx+(y-LZ[0][1])*dy)/(L*L);
    if(u>0&&u<lq){const d=((x-LZ[0][0])*dy-(y-LZ[0][1])*dx)/L;if(Math.abs(d)<46){const push=(1-Math.abs(d)/46)*22*(1-eo(lb));o.x=x+dy/L*Math.sign(d||1)*push;o.y=y-dx/L*Math.sign(d||1)*push;}}}
   if(t>th1&&t<th2+1.2){const d=Math.hypot(x-PP[2].x,y-PP[2].y);if(d<120){o.al=0.42*cl(d/120+cl((t-th2-0.4)/0.8));}}   // 海瑞四周空无一物
   return o;});
  if(lq>0&&lb<1)gline(partial(LZ,lq),GOLD,3,a*(1-lb));
  if(lb>0&&lb<1)disperse(samplePts(LZ,40),t,tzb,a,GOLD,330,1);
  if(t>tzb)smoke(t,tzb+0.1,PP[0].x,PP[0].y,160,120,5,a*0.6,331,GRAY);
  // 海瑞的高台
  const hq=eo(cl((t-th1)/0.6));if(hq>0)line([[PP[2].x-34,PP[2].y-58],[PP[2].x+34,PP[2].y-58]],IVO,2,a*hq*0.6*fade);
  // 戚继光：最亮的火花；罢官时一圈灰色冲击
  impactRing(t,T('v07|罢了官|s'),170,PP[3].y,70,50,a,GRAY);
  // 万历：三层方笼收紧
  const tc=T('v08|不上朝|s'),cq=eo(cl((t-tc)/0.8));if(cq>0&&t<tw+0.3)[0,1,2].forEach(k=>{const s=lerp(240-k*50,46+k*16,cq);line([[PP[4].x-s/2,PP[4].y-s/2],[PP[4].x+s/2,PP[4].y-s/2],[PP[4].x+s/2,PP[4].y+s/2],[PP[4].x-s/2,PP[4].y+s/2]],IVO,1.6,a*0.55*(1-cl((t-tw)/0.3)),true);});
  // 李贽：在网格外面，熄灭时一缕烟
  if(t>T('v09|狱中|s'))smoke(t,T('v09|狱中|s')+0.1,880,GY(1),90,80,4,a*0.5,332,GRAY);
  // 六个人
  const lab=[];PP.forEach((p,m)=>{const s=person(m,t);if(!s)return;dot(s.x,s.y,s.r,s.col,a*s.al);
   if(m===3&&s.act>0&&s.dead<0.5)dot(s.x,s.y,s.r*1.8,GOLD,a*0.25*(0.6+0.4*Math.sin(t*9)));                 // 戚继光的火花更亮
   const lt=t<tw?cl((t-p.on()+0.05)/0.25)*(1-0.5*cl((t-p.off()-0.4)/0.4)):cl((t-tw-0.6-m*0.08)/0.4);
   lab.push([p.n+(t<tw?' · '+p.w:''),t<tw?s.x+(m===5||m===1?-22:22):s.x,t<tw?s.y-30:s.y+44,lt,t<tw?(m===5||m===1?'right':'left'):'center',t<tw&&s.dead<0.5?GOLD:GRAY]);});
  lab.forEach(([s,x,y,al,al2,col])=>canvasText(s,x,y,30,col,al*a,al2));},
 dom(t){op('w1n',cl((t-S.c1.start-0.3)/0.4)*(1-cl((t-T('v10|所有人|s'))/0.4)));}};

// ---------------- c2：规则被人情缠成乱结 ----------------
const KNOTS=[[GX(3),GY(4)],[GX(8),GY(3)],[GX(5),GY(8)],[GX(10),GY(9)],[GX(2),GY(10)],[GX(9),GY(6)]];
const ABLE=[[GX(3),GY(4)],[GX(9),GY(6)],[GX(5),GY(8)]];          // 能人：被缠住的金点
SCENES.c2={
 canvas(t,a){const t0=S.c2.start,tr=T('v12|人情|s'),tg=T('v13|好人|s'),tm=T('v13|平庸|s');
  const dim=1-0.65*cl((t-T('v11|拿道德|s')+0.2)/0.4)*(1-cl((t-tr+0.3)/0.5));    // 核心文字在的时候格线退后
  const wob=eo(cl((t-tr)/2.2))*(1+0.6*cl((t-tg)/1.5));
  // 格线：先是笔直的，说到「人情」开始弯、缠
  for(let j=0;j<GRW;j+=2){const pts=[];for(let s=0;s<=36;s++){const x=lerp(GX(0),GX(GC-1),s/36);pts.push([x,GY(j)+wob*18*nz(j*40+s,t*0.6,1.3)]);}line(pts,IVO,1.2,0.22*a*dim*eo(cl((t-t0)/0.6)));}
  for(let i=0;i<GC;i+=2){const pts=[];for(let s=0;s<=36;s++){const y=lerp(GY(0),GY(GRW-1),s/36);pts.push([GX(i)+wob*18*nz(i*40+s+500,t*0.6,1.3),y]);}line(pts,IVO,1.2,0.22*a*dim*eo(cl((t-t0)/0.6)));}
  // 乱结：一圈圈越缠越紧的线
  KNOTS.forEach(([cx,cy],k)=>{const q=eo(cl((t-tr-k*0.15)/1.2));if(q<=0)return;const pts=[];const turns=2+3*q;
   for(let s=0;s<=80;s++){const u=s/80,an=u*turns*6.283+k;const R=lerp(46,10,u)*(1-0.3*cl((t-tg)/1.5));pts.push([cx+Math.cos(an)*R*(1+0.25*Math.sin(an*1.7)),cy+Math.sin(an)*R]);}
   line(partial(pts,q),GRAY,1.4,0.55*a);});},
 free(t,a){const tg=T('v13|好人|s'),tm=T('v13|平庸|s');const [c,g]=layer('w2');g.globalCompositeOperation='lighter';
  // 能人：金点在结里来回挣，挣不出来
  ABLE.forEach(([x,y],k)=>{const q=cl((t-tg-k*0.15)/0.3);if(q<=0)return;const jx=Math.sin(t*14+k)*4*q,jy=Math.cos(t*11+k*2)*3*q;
   g.globalAlpha=a*q;g.fillStyle=GOLD;g.beginPath();g.arc(x+jx,y+jy,6,0,6.283);g.fill();});
  // 平庸的人：灰点随波漂着，不受任何阻碍
  const mq=cl((t-tm)/0.5);if(mq>0)for(let i=0;i<46;i++){const x=200+((rnd(i*3.1)*640+(t-tm)*22*(0.5+rnd(i)))%660),y=660+rnd(i*5.3)*600+Math.sin(t*0.9+i)*14;
   g.globalAlpha=a*mq*0.7;g.fillStyle=GRAY;g.fillRect(x-2,y-2,4,4);}
  g.globalAlpha=1;present(c,1,0.4);
  showText('w2core',{lines:[[['拿道德',null]],[['代替制度',GOLD]]],size:84,cy:980},t,T('v11|拿道德|s')-0.15,W2OUT(),'光扫','光扫',a);},
 dom(t){op('w2a',cl((t-T('v12|人情|s'))/0.4));}};
const W2OUT=()=>Math.max(T('v12|流程|s'),T('v11|拿道德|s')-0.15+TXDUR.in['光扫']+1.0);

// ---------------- c3：齿轮空转，产出为 0 ----------------
const GEARS=[{x:380,y:930,r:118,n:12,d:1},{x:585,y:830,r:84,n:9,d:-1},{x:600,y:1060,r:70,n:8,d:-1}];
function gear(g,t,a,ang){const pts=[];const n=g.n*2;for(let s=0;s<=n*4;s++){const u=s/(n*4),an=u*6.283+ang;const tooth=(Math.floor(u*n*2)%2)?1:0.84;pts.push([g.x+Math.cos(an)*g.r*tooth,g.y+Math.sin(an)*g.r*tooth]);}
 gline(pts,IVO,1.8,a*0.8,true);line([[g.x-8,g.y],[g.x+8,g.y]],IVO,2,a*0.6);line([[g.x,g.y-8],[g.x,g.y+8]],IVO,2,a*0.6);}
SCENES.c3={
 canvas(t,a){const t0=S.c3.start,tb=T('v15|很忙|s'),tn=T('v15|内耗|s');
  // 转速：先慢，说到「很忙」加速到 4 倍（转角 = 转速对时间的积分，保持纯函数）
  const w0=0.6,w1=2.6,acc=0.6,u=Math.max(0,t-tb);const ph=w0*(t-t0)+(w1-w0)*(u-acc*(1-Math.exp(-u/acc)));
  GEARS.forEach((g,k)=>{const q=eo(cl((t-t0-0.15-k*0.15)/0.5));if(q>0)gear(g,t,a*q,ph*g.d*(118/g.r));});
  // 输出：一根空的进度条
  const bq=eo(cl((t-t0-0.6)/0.5));line([[720,1150],[900,1150]],IVO,2,a*0.4*bq);line([[720,1150],[720+2,1150]],GOLD,4,a*bq);
  if(t>tn)smoke(t,tn,490,820,300,200,7,a*0.7,520,GRAY);},
 dom(t){op('w3out',cl((t-S.c3.start-0.6)/0.4));op('w3n',cl((t-S.c3.start-0.3)/0.4));}};

// ---------------- c4：下限与上限 ----------------
const CEIL=720,FLOOR=1000;
SCENES.c4={
 canvas(t,a){const tj=T('v16|我|s'),tl=T('v16|下限|s'),tu=T('v16|上限|s'),ts=T('v17|系统|s');
  impactRing(t,tj,540,860,420,140,a,AU);
  const fq=eo(cl((t-tl+0.2)/0.4));if(fq>0)gline([[200,FLOOR],[lerp(200,880,fq),FLOOR]],GOLD,2.4,a);
  // 光点从下限升起，撞上天花板，弹回一点
  const rise=cl((t-tl)/(tu-tl+0.05));const hit=t>tu?Math.exp(-(t-tu)*4)*Math.sin((t-tu)*18)*14:0;
  if(t>tl-0.1){const y=lerp(FLOOR-16,CEIL+16,eo(rise))+(t>tu?Math.abs(hit):0);dot(540,y,6,GOLD,a);for(let k=1;k<6;k++)dot(540,y+k*14*(1-cl((t-tu)/0.3)),3,GOLD,a*0.12*(6-k));}
  // 天花板：撞上的那一刻才显形；说到「系统」时露出原形——还是那张点阵
  const cf=t>tu?Math.exp(-(t-tu)*3):0;if(t>tu)line([[200,CEIL],[880,CEIL]],IVO,2,a*(0.25+0.6*cf));
  impactRing(t,tu,540,CEIL,180,30,a,IVO);
  const gq=cl((t-ts)/0.8);if(gq>0)for(let j=0;j<3;j++)for(let i=0;i<GC;i++){const al=gq*cl((gq*3-j)*1);dot(GX(i),CEIL-j*44,1.8,GRAY,a*0.7*al);}},
 free(t,a){showText('w4core',{lines:[[['努力决定',null],['下限',GOLD]],[['系统决定',null],['上限',IVO]]],size:76,cy:1200},t,T('v16|个人|s')-0.05,W4OUT(),'碎裂','逐字',a);},
 dom(t){op('w4dn',cl((t-T('v16|下限|s'))/0.3));op('w4up',cl((t-T('v16|上限|s'))/0.3));}};
const W4OUT=()=>Math.max(T('v17|系统的问题|s'),T('v16|个人|s')+TXDUR.in['碎裂']+1.2);

// ---------------- c5：二选一（片尾章） ----------------
SCENES.c5={
 canvas(t,a){const s=S.c5.start,pl=cl((t-T('v18|人不行|s'))/0.4),pr=cl((t-T('v18|路不通|s'))/0.4);
  // 左：一颗暗下去的点；右：一条被墙挡住的金线
  dot(325,880,6,GRAY,a*(0.3+0.6*pl));
  const rq=eo(cl((t-s-0.3)/0.6));gline(partial([[640,1060],[700,940],[760,960],[815,850]],rq),GOLD,3,a*(0.35+0.65*pr));
  line([[845,780],[845,1100]],IVO,3,a*(0.3+0.6*pr));
  const vq=cl((t-s-0.25)/0.5);if(vq>0){gline([[540,670],[540,lerp(670,850,eo(vq))]],AU,2,a*0.7);gline([[540,1160],[540,lerp(1160,970,eo(vq))]],AU,2,a*0.7);}},
 dom(t){const pl=cl((t-T('v18|人不行|s'))/0.35),pr=cl((t-T('v18|路不通|s'))/0.35);
  hl($('w5L'),pl>0,'#FFE9C4');$('w5L').style.color=pl>0?'#FFE9C4':'#C9C2B6';hl($('w5R'),pr>0,'#F0B429');$('w5R').style.color=pr>0?'#F0B429':'#C9C2B6';
  const l0=eo(cl((t-S.c5.start)/0.4));$('w5L').style.transform=`translateX(${(-50*(1-l0)).toFixed(1)}px)`;$('w5R').style.transform=`translateX(${(50*(1-l0)).toFixed(1)}px)`;$('w5L').style.opacity=$('w5R').style.opacity=l0.toFixed(3);
  const vq=eo(cl((t-S.c5.start-0.25)/0.3));const vs=op('w5vs',vq);vs.style.transform=`scale(${(1.5-0.5*vq).toFixed(3)})`;vs.style.textShadow='0 0 18px rgba(245,166,35,.6),0 3px 10px rgba(0,0,0,.7)';}};

// 点阵章节压低外壳底纹，免得两层点阵打架
HOOKS.texA=(t,V)=>1-0.7*Math.max(V[0],V[1],V[2]);
