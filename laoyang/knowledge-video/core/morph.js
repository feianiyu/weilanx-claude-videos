// =====================================================================
// 老杨魔方 · 深度 v6 —— 粒子接力转场（STANDARD_DEEP_V6.md §3）
// 换卡时，上一张图散成橙色光点，沿弧线飞到下一张图的位置，下一张图在光点落地时长出来。
// 让一期从「翻幻灯片」变成「一条连续的动画」。
// 开关：lines.json 写 "morph": true（全期，hook 前后除外）；单张卡写 "morph": false 跳过它进场的那一次。
// 纯函数：粒子的起点、终点由各卡的静态布局算出（只算一次，和渲染顺序无关）；位置 = 时间的函数；随机用哈希。
// =====================================================================
const _mh=(i,k)=>{const x=Math.sin(i*12.9898+k*78.233)*43758.5453;return x-Math.floor(x);};
const MORPH_WIN=[0.45,0.55];   // 换卡时刻前 0.45s 开始散，后 0.55s 落完
const MORPH_N=170;
let _MP=null,_MC=null;
function _mBoxes(k){   // 一张卡上「画了东西的地方」：屏幕坐标的方框列表 [x,y,w,h,权重]
 const el=k.el,saveT=el.style.transform,saveV=el.style.visibility;el.style.transform='none';el.style.visibility='hidden';
 const out=[];const svg=el.querySelector('.lgx svg, .mp svg');
 if(svg){const R=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal,sx=R.width/vb.width,sy=R.height/vb.height;
  const rc=svg.querySelector('.lgrcs');if(rc){const n=+rc.dataset.n,rh=+rc.dataset.rh;for(let i=0;i<n;i++)out.push([R.left+190*sx,R.top+(20+i*rh+12)*sy,(400-i*50)*sx,(rh-24)*sy,3]);}
  svg.querySelectorAll('.lgbw').forEach(g=>{const r=+g.querySelector('circle').getAttribute('r'),x=+g.dataset.x0,y=+g.dataset.y0;out.push([R.left+(x-r)*sx,R.top+(y-r)*sy,2*r*sx,2*r*sy,2*r]);});
  [...svg.querySelectorAll('.lu, .mpn, .lgtile')].forEach(u=>{if(u.closest('.lgbw'))return;let b;try{b=u.getBBox();}catch(e){return;}
   if(!b.width&&!b.height)return;const w=u.dataset&&u.dataset.hot!=null?3:1;
   out.push([R.left+b.x*sx,R.top+b.y*sy,Math.max(4,b.width*sx),Math.max(4,b.height*sy),w*Math.sqrt(Math.max(16,b.width*b.height*sx*sy))]);});}
 if(!out.length){const sel=['.big','.hk','.pc-t','.q-box','.bars','.chain','.bl-w','.mx','.wf','.ln-svg','.cols','.ls','.sh-box','.ti'];
  for(const s of sel){const e=el.querySelector(s);if(e){const r=e.getBoundingClientRect();if(r.width&&r.height){out.push([r.left,r.top,r.width,r.height,1]);break;}}}}
 if(!out.length){const r=el.getBoundingClientRect();out.push([r.left+r.width*0.2,r.top+r.height*0.3,r.width*0.6,r.height*0.3,1]);}
 el.style.transform=saveT;el.style.visibility=saveV;return out;}
function _mPick(B,i,salt){const tot=B.reduce((a,b)=>a+b[4],0);let r=_mh(i,salt)*tot;for(const b of B){r-=b[4];if(r<=0)return [b[0]+_mh(i,salt+1)*b[2],b[1]+_mh(i,salt+2)*b[3]];}const b=B[B.length-1];return [b[0]+b[2]/2,b[1]+b[3]/2];}
function _mPlan(CARDS){const P=[];
 for(let i=1;i<CARDS.length;i++){const A=CARDS[i-1],B=CARDS[i];
  if(['hook'].includes(A.c.type)||['hook','fxtext'].includes(B.c.type)||B.c.morph===false||Math.abs(A.c.t1-B.c.t0)>0.05)continue;
  const SA=_mBoxes(A),SB=_mBoxes(B),T=B.c.t0;
  const pts=[...Array(MORPH_N)].map((_,j)=>{const a=_mPick(SA,j,i*7+1),b=_mPick(SB,j,i*7+4),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;
   const bend=(_mh(j,i*7+5)-0.5)*0.9*L+(_mh(i,3)>0.5?1:-1)*0.25*L;   // 每次换卡整体往一侧绕，单个光点再各自偏一点
   return {a,b,c:[mx-dy/L*bend,my+dx/L*bend],d:_mh(j,i*7+6)*0.28,r:2.2+3.2*_mh(j,i*7+7)};});
  P.push({T,pts});}
 return P;}
function MORPH_FRAME(t,CARDS){
 if(!window.DATA.morph)return;
 if(!_MC){_MC=document.createElement('canvas');_MC.id='morph';_MC.width=1080;_MC.height=1920;Object.assign(_MC.style,{position:'absolute',left:'0',top:'0',width:'1080px',height:'1920px',pointerEvents:'none',zIndex:30});
  document.getElementById('cards').appendChild(_MC);}
 if(!_MP)_MP=_mPlan(CARDS);
 const X=_MC.getContext('2d'),C0=document.getElementById('cards').getBoundingClientRect(),sc=C0.width/1080;X.clearRect(0,0,1080,1920);
 _MP.forEach(m=>{const a=m.T-MORPH_WIN[0],b=m.T+MORPH_WIN[1];if(t<a||t>b)return;
  X.save();X.globalCompositeOperation='lighter';
  m.pts.forEach(p=>{const u0=(t-a-p.d)/(b-a-0.28);if(u0<=0||u0>=1)return;const u=io(u0);
   const q=(s)=>{const v=1-s;return [v*v*p.a[0]+2*v*s*p.c[0]+s*s*p.b[0],v*v*p.a[1]+2*v*s*p.c[1]+s*s*p.b[1]];};
   const [x,y]=q(u),[x2,y2]=q(Math.max(0,u-0.07)),al=Math.sin(u0*Math.PI);
   const X1=(x-C0.left)/sc,Y1=(y-C0.top)/sc,X2=(x2-C0.left)/sc,Y2=(y2-C0.top)/sc;
   X.strokeStyle=`rgba(245,166,35,${(0.45*al).toFixed(3)})`;X.lineWidth=p.r*0.9;X.lineCap='round';X.beginPath();X.moveTo(X2,Y2);X.lineTo(X1,Y1);X.stroke();
   X.fillStyle=`rgba(255,214,140,${(0.95*al).toFixed(3)})`;X.beginPath();X.arc(X1,Y1,p.r*(0.7+0.5*Math.sin(u0*Math.PI)),0,6.2832);X.fill();
   X.fillStyle=`rgba(245,166,35,${(0.18*al).toFixed(3)})`;X.beginPath();X.arc(X1,Y1,p.r*3.2,0,6.2832);X.fill();});
  X.restore();});}
