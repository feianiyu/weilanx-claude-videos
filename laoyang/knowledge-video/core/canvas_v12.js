// =====================================================================
// 老杨魔方 · 深度 v12「无边框无限空间运镜引擎」（canvas_v12.js）
// 设计原则：
//   - 无卡片外框束缚、无连接线条、无强行全局逻辑图谱
//   - 仅以无限画布的空间甩镜运镜（Whip Pan + 方向运动模糊 + 香槟金镜头光晕
//     + 景深虚化 + 三层视差光尘）衔接各幕，把动画舞台无限延展
//   - 统一 v11 黑曜石 × 拉丝钛银 × 香槟金（#DFB668 / #F5DFAA）美学，
//     无缝衔接章节魔方转场（wall/seam 等 6 段）与真实金属音效（sfx_metal）
// =====================================================================
(function(){
const _cl=x=>x<0?0:x>1?1:x;
const _io=x=>{x=_cl(x);return x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
const _eio=x=>{x=_cl(x);if(x<=0)return 0;if(x>=1)return 1;return x<0.5?Math.pow(2,20*x-10)/2:(2-Math.pow(2,-20*x+10))/2;};
const _lerp=(a,b,p)=>a+(b-a)*p;
const _rnd=i=>{const x=Math.sin(i*12.9898+78.233)*43758.5453;return x-Math.floor(x);};

let _inited=false, _pos=[], _gridEl=null, _dustCv=null, _dustX=null, _leakEl=null, _mbgEl=null, _cardsEl=null, _coordsEl=null;
const FX=540, FY=855; // 屏幕开放舞台视觉中心

// 为每幕分配错落的开放空间坐标（交替大跨度方向，确保每次甩镜都有强烈空间穿行感）
const _STEPS=[
  [1480, 420],
  [-1360, 740],
  [1420, 560],
  [-1280, 680],
  [1360, -320],
  [1180, 780],
];

function _init(CARDS){
  if(_inited)return;
  _inited=true;
  const vEl=document.getElementById('v');
  _cardsEl=document.getElementById('cards');
  if(!vEl||!_cardsEl)return;
  document.body.classList.add('v12');
  vEl.classList.add('v12');

  // 1. 注入 SVG 方向运动模糊滤镜
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','0');svg.setAttribute('height','0');
  svg.style.position='absolute';
  svg.innerHTML='<defs><filter id="v12-mb" x="-4%" y="-4%" width="108%" height="108%"><feGaussianBlur id="v12-mbg" stdDeviation="0 0"/></filter></defs>';
  vEl.appendChild(svg);
  _mbgEl=document.getElementById('v12-mbg');

  // 2. 远景微点阵蓝图层（0.42x 视差，极克制，无边框感）
  _gridEl=document.createElement('div');
  _gridEl.id='v12-grid';
  vEl.insertBefore(_gridEl,_cardsEl);

  // 3. 前景香槟金光尘层（1.45x 视差，甩镜时自动拉出动态光丝）
  _dustCv=document.createElement('canvas');
  _dustCv.id='v12-dust';_dustCv.width=540;_dustCv.height=960;
  vEl.insertBefore(_dustCv,document.getElementById('fxo'));
  _dustX=_dustCv.getContext('2d');

  // 4. 甩镜香槟金镜头漏光层
  _leakEl=document.createElement('div');
  _leakEl.id='v12-leak';
  vEl.insertBefore(_leakEl,document.getElementById('fxo'));

  // 5. 右上角克制空间坐标 HUD
  _coordsEl=document.createElement('div');
  _coordsEl.id='v12-coords';
  vEl.appendChild(_coordsEl);

  // 6. 把每张卡片锚定在无限空间的独立坐标 (wx, wy)
  _cardsEl.style.overflow='visible';
  _cardsEl.style.transformOrigin='0 0';
  let cx=0, cy=0;
  _pos=CARDS.map((k,i)=>{
    if(i>0){
      const d=_STEPS[(i-1)%_STEPS.length];
      cx+=d[0]; cy+=d[1];
    }
    k.el.style.left=(cx-430)+'px';
    k.el.style.top=(cy-455)+'px';
    k.el.dataset.v12x=cx;
    k.el.dataset.v12y=cy;
    return {x:cx, y:cy, t0:k.c.t0, t1:k.c.t1};
  });
}

function _camAt(t){
  if(!_pos.length)return {x:0,y:0,z:1,r:0,idx:0};
  let i=0;
  for(let k=0;k<_pos.length;k++){
    if(t>=_pos[k].t0-0.01)i=k;
  }
  const cur=_pos[i], nxt=_pos[i+1];
  const dur=Math.max(0.5,cur.t1-cur.t0);
  // 甩镜窗口：当前幕末尾 0.34s 开始起势，到下一幕前 0.38s 精准落位
  const lead=0.34, tail=0.38, wDur=lead+tail;
  if(nxt && t>=cur.t1-lead){
    const raw=_cl((t-(cur.t1-lead))/wDur);
    const u=_eio(raw);
    const arc=-0.22*Math.sin(raw*Math.PI); // 甩镜中途微微拉远，放大空间纵深
    return {
      x:_lerp(cur.x,nxt.x,u),
      y:_lerp(cur.y,nxt.y,u),
      z:1.02+arc,
      r:((nxt.x>cur.x?-1:1)*1.4*Math.sin(raw*Math.PI)),
      idx:raw<0.5?i:i+1,
      whip:Math.sin(raw*Math.PI)
    };
  }
  const prev=_pos[i-1];
  if(prev && t<cur.t0+tail){
    const raw=_cl((t-(prev.t1-lead))/wDur);
    const u=_eio(raw);
    const arc=-0.22*Math.sin(raw*Math.PI);
    return {
      x:_lerp(prev.x,cur.x,u),
      y:_lerp(prev.y,cur.y,u),
      z:1.02+arc,
      r:((cur.x>prev.x?-1:1)*1.4*Math.sin(raw*Math.PI)),
      idx:raw<0.5?i-1:i,
      whip:Math.sin(raw*Math.PI)
    };
  }
  // 幕内缓慢电影推进（0.99 -> 1.028，保证四周留足安全边距绝不吃边）+ 持续微呼吸
  const age=_cl((t-cur.t0)/dur);
  const openZ=(i===0 && t<1.1)?_lerp(1.16,0.99,_io(_cl(t/1.1))):_lerp(0.99,1.028,age);
  const openR=(i===0 && t<1.1)?_lerp(-1.2,0,_io(_cl(t/1.1))):Math.sin(t*0.85+i)*0.32;
  return {x:cur.x, y:cur.y, z:openZ, r:openR, idx:i, whip:0};
}

function _drawDust(t,c,vx,vy,spd){
  if(!_dustX)return;
  const X=_dustX; X.clearRect(0,0,540,960);
  for(let i=0;i<72;i++){
    const f=1.25+_rnd(i*3.7)*0.65;
    const bx=_rnd(i*1.7)*620, by=_rnd(i*2.9)*1040;
    const px=(((bx-c.x*0.35*f+Math.sin(t*0.45+i)*7)%620)+620)%620-40;
    const py=(((by-c.y*0.35*f+Math.cos(t*0.35+i)*7)%1040)+1040)%1040-40;
    const al=0.14+_rnd(i*5.1)*0.34, rad=0.7+(f-1.25)*2.0;
    if(spd>4){
      X.strokeStyle=`rgba(245,223,170,${(al*1.2).toFixed(3)})`;
      X.lineWidth=rad;
      X.beginPath();X.moveTo(px,py);X.lineTo(px-vx*0.26*f,py-vy*0.26*f);X.stroke();
    }else{
      X.fillStyle=`rgba(245,223,170,${al.toFixed(3)})`;
      X.beginPath();X.arc(px,py,rad,0,6.283);X.fill();
    }
  }
}

window.V12_FRAME=function(t,CARDS){
  _init(CARDS);
  if(!_cardsEl||!_pos.length)return;
  const c=_camAt(t), c1=_camAt(Math.max(0,t-1/30));
  _cardsEl.style.transform=`translate(${FX}px,${FY}px) rotate(${c.r.toFixed(3)}deg) scale(${c.z.toFixed(4)}) translate(${(-c.x).toFixed(2)}px,${(-c.y).toFixed(2)}px)`;

  const vx=(c.x-c1.x)*c.z, vy=(c.y-c1.y)*c.z, spd=Math.hypot(vx,vy);
  // 方向运动模糊（仅甩镜高速移动时启动，静止时 0 模糊保持 100% 锐利）
  const bx=Math.min(14,Math.abs(vx)*0.16), by=Math.min(14,Math.abs(vy)*0.16);
  if(bx+by>0.6&&_mbgEl){
    _mbgEl.setAttribute('stdDeviation',`${bx.toFixed(2)} ${by.toFixed(2)}`);
    _cardsEl.style.filter='url(#v12-mb)';
  }else{
    _cardsEl.style.filter='';
  }

  // 远景微点阵视差
  if(_gridEl){
    const zs=Math.pow(c.z,0.45);
    _gridEl.style.backgroundSize=`${(52*zs).toFixed(1)}px ${(52*zs).toFixed(1)}px`;
    _gridEl.style.backgroundPosition=`${(FX-c.x*0.42*zs).toFixed(1)}px ${(FY-c.y*0.42*zs).toFixed(1)}px`;
  }

  // 香槟金甩镜光晕
  if(_leakEl){
    _leakEl.style.opacity=Math.min(0.48,spd*0.0085).toFixed(3);
    _leakEl.style.setProperty('--lx',(50-Math.sign(vx||1)*24)+'%');
  }

  // 前景视差光尘
  _drawDust(t,c,vx,vy,spd);

  // 右上角极简空间坐标
  if(_coordsEl){
    _coordsEl.textContent=`SPACE ${c.x>=0?'+':''}${Math.round(c.x)} · ${c.y>=0?'+':''}${Math.round(c.y)}  ${c.z.toFixed(2)}×`;
  }

  // 空间景深：当前幕清晰居中，前后相邻幕在甩镜过程中保持可见并带柔和景深虚化
  CARDS.forEach((k,i)=>{
    const dIdx=Math.abs(i-c.idx);
    if(dIdx===0){
      k.el.style.visibility='visible';
      k.el.style.opacity='1';
      k.el.style.transform='';
      k.el.style.filter='';
      k.el.style.clipPath='';
    }else if(dIdx===1 && (c.whip>0.02 || Math.abs(t-k.c.t0)<0.85 || Math.abs(t-k.c.t1)<0.85)){
      const near=Math.max(c.whip, 0.35);
      k.el.style.visibility='visible';
      k.el.style.opacity=(0.68*near).toFixed(3);
      k.el.style.transform='';
      k.el.style.filter=`blur(${(3.2*(1-near*0.5)).toFixed(1)}px) brightness(0.62)`;
      k.el.style.clipPath='';
    }else{
      k.el.style.visibility='hidden';
      k.el.style.opacity='0';
    }
  });
};
})();
