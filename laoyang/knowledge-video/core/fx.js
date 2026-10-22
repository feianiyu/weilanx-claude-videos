// =====================================================================
// 老杨魔方 · 知识分享版 · 通用动效库 fx.js
// 与 shell.html 在同一闭包里运行：可直接用 X(画布) T(锚点) S(章节) rgba cl eo io lerp rnd $
// 颜色常量：O 橙 #F5A623（强调/线）· AU 金 #F0B429（数字/高光）· G 绿 #3CF07A（正向/新）
//           IV 象牙 #FFE9C4（中性线）· GR 灰 #8C857A（旧/失效）· RD 红 #E8553A（印章/警示）
// ---------------------------------------------------------------------
// 画线    gline(pts,col,w,a,close)   发光线（宽淡+细亮，lighter 合成）——主视觉线条一律用它
//         line(pts,col,w,a,close,dash) 普通线（坐标轴、参照虚线、刻度）
//         partial(pts,q) / along(pts,q) 折线按长度截取 / 取点 —— 描线生长、粒子沿线流动
// 点      dot(x,y,r,col,a)            带光晕的点（粒子、节点、窗灯）
// 氛围    smoke(t,t0,cx,cy,sx,sy,n,a,seed,col)  烟雾团 2.4s：消失、注销、旧事物退场
//         disperse(pts,t,t0,a,col,seed,spd)     粒子四散上浮 1.1s：分拆、碎掉、旧图形瓦解
//         samplePts(polyline,n)                 把一个形状采样成点，交给 disperse
//         sweep(t,t0,dur,a)                     斜向金色光扫：章节切换、结论落定
//         texture(t,a,boost)                    底层点阵+扫描线（shell 已全程调用）
//         impactRing(t,t0,x,y,rx,ry,a,col)      双层椭圆冲击波 0.8s：判断落下、数字触底
// 文字    op(id,v) 透明度 · rise(id,p,dy) 上浮入场 · glitchEl(el,g,f) 故障抖动
//         hl(el,on,col) 方框高亮描边 · countUp(id,to,p,fmt) 数字滚动
// =====================================================================
// 发光线：宽淡 + 细亮（'lighter' 合成）
function gline(pts,col,w,a,close){
 if(a<=0.003||pts.length<2)return;X.save();X.globalCompositeOperation='lighter';X.lineJoin='round';X.lineCap='round';
 for(const [lw,al] of [[w*4,0.08],[w*2,0.18],[w,0.9]]){X.beginPath();X.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)X.lineTo(pts[i][0],pts[i][1]);if(close)X.closePath();X.strokeStyle=rgba(col,al*a);X.lineWidth=lw;X.stroke();}
 X.restore();}
function line(pts,col,w,a,close,dash){ // 普通线（不发光）
 if(a<=0.003||pts.length<2)return;X.save();X.lineJoin='round';X.lineCap='round';if(dash)X.setLineDash(dash);X.beginPath();X.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)X.lineTo(pts[i][0],pts[i][1]);if(close)X.closePath();X.strokeStyle=rgba(col,a);X.lineWidth=w;X.stroke();X.restore();}
function dot(x,y,r,col,a){if(a<=0.003)return;X.save();X.globalCompositeOperation='lighter';X.fillStyle=rgba(col,a*0.22);X.beginPath();X.arc(x,y,r*2.6,0,6.283);X.fill();X.fillStyle=rgba(col,a);X.beginPath();X.arc(x,y,r,0,6.283);X.fill();X.restore();}
function partial(pts,q){ // 按长度截取折线前 q
 if(q>=1)return pts;if(q<=0)return [pts[0]];const L=[];let tot=0;for(let j=1;j<pts.length;j++){const d=Math.hypot(pts[j][0]-pts[j-1][0],pts[j][1]-pts[j-1][1]);L.push(d);tot+=d;}
 let rem=tot*q;const out=[pts[0]];for(let j=1;j<pts.length;j++){if(rem>=L[j-1]){out.push(pts[j]);rem-=L[j-1];}else{const u=rem/L[j-1];out.push([lerp(pts[j-1][0],pts[j][0],u),lerp(pts[j-1][1],pts[j][1],u)]);break;}}return out;}
function along(pts,q){const p=partial(pts,q);return p[p.length-1];}
// 烟雾：暖灰柔团，按 t 确定性漂移、扩散、淡出
function smoke(t,t0,cx,cy,sx,sy,n,a,seed,col){
 const age=t-t0;if(age<0||age>2.4||a<=0)return;X.save();
 for(let i=0;i<n;i++){const r0=rnd(seed+i),r1=rnd(seed+i*3+1),r2=rnd(seed+i*7+2);const d=r2*0.5;const ag=(age-d*0.5)/(1.6+r1);if(ag<=0||ag>=1)continue;
  const x=cx+(r0-.5)*sx+(r1-.5)*80*ag,y=cy+(r1-.5)*sy-120*ag*(0.5+r2),R=40+70*r1+160*ag;
  const al=a*0.20*Math.sin(Math.PI*Math.min(1,ag*1.6))*(1-ag);
  const g=X.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,rgba(col||'#B9AE9C',al));g.addColorStop(1,rgba(col||'#B9AE9C',0));X.fillStyle=g;X.beginPath();X.arc(x,y,R,0,6.283);X.fill();}
 X.restore();}
// 粒子消散：一组点向外飘散 + 上浮
function disperse(pts,t,t0,a,col,seed,spd){const q=cl((t-t0)/1.1);if(q<=0||a<=0)return;
 for(let i=0;i<pts.length;i++){const p=pts[i];const an=rnd(seed+i)*6.283,sp=(30+rnd(seed+i*5)*110)*(spd||1);
  dot(p[0]+Math.cos(an)*sp*eo(q),p[1]+Math.sin(an)*sp*eo(q)-70*q*q,1.6,i%4?col:IV,a*(1-q));}}
function samplePts(pl,n){const out=[];for(let i=0;i<n;i++)out.push(along(pl,i/(n-1)));return out;}
// 光扫：斜向金色光带扫过中间区
function sweep(t,t0,dur,a){const q=(t-t0)/dur;if(q<=0||q>=1)return;X.save();X.beginPath();X.rect(100,560,880,820);X.clip();X.globalCompositeOperation='lighter';
 const x=lerp(-300,1380,io(q));const g=X.createLinearGradient(x-160,0,x+160,0);g.addColorStop(0,rgba(AU,0));g.addColorStop(.5,rgba(AU,0.16*a*Math.sin(Math.PI*q)));g.addColorStop(1,rgba(AU,0));
 X.setTransform(1,0,-0.35,1,0,0);X.translate(400,0);X.fillStyle=g;X.fillRect(x-200,560,400,820);X.restore();}
// 底层科技纹理：点阵网格 + 慢扫描线（暖色、低透明度）
function texture(t,a,boost){if(a<=0)return;X.save();
 for(let y=620;y<=1360;y+=40)for(let x=180;x<=900;x+=40){const w=0.5+0.5*Math.sin(t*0.8+x*0.013+y*0.011);X.fillStyle=rgba(IV,(0.05+0.05*w+0.12*boost)*a);X.fillRect(x-1,y-1,2,2);}
 const sy=620+((t*70)%760);const g=X.createLinearGradient(0,sy-40,0,sy+2);g.addColorStop(0,rgba(O,0));g.addColorStop(1,rgba(O,0.07*a));X.fillStyle=g;X.fillRect(140,sy-40,800,42);
 X.restore();}

function op(id,v){const e=$(id);e.style.opacity=(+v).toFixed(3);return e;}
function rise(id,p,dy){const e=op(id,p);e.style.transform=`translateY(${((1-p)*(dy||16)).toFixed(1)}px)`;return e;}
function glitchEl(el,g,f){if(g<=0.01){el.style.filter='';el.style.translate='';return;}
 el.style.translate=`${((rnd(f*3.1)-.5)*18*g).toFixed(1)}px 0`;el.style.filter=`drop-shadow(${(-6*g).toFixed(1)}px 0 0 rgba(245,166,35,.8)) drop-shadow(${(6*g).toFixed(1)}px 0 0 rgba(255,233,196,.6))`;}
function hl(el,on,col){el.style.borderColor=on?col:'rgba(255,236,200,.32)';el.style.boxShadow=on?`0 0 0 2px ${col},0 0 26px ${col}55`:'';}

function impactRing(t,t0,x,y,rx,ry,a,col){const q=cl((t-t0)/0.8);if(q<=0||q>=1||a<=0)return;X.save();X.globalCompositeOperation='lighter';
 for(const k of [0,0.15]){const qq=cl(q-k);X.beginPath();X.ellipse(x,y,rx*0.2+rx*eo(qq),ry*0.2+ry*eo(qq),0,0,6.283);X.strokeStyle=rgba(col||AU,0.55*a*(1-qq));X.lineWidth=3;X.stroke();}X.restore();}
function countUp(id,to,p,fmt){const e=$(id);const v=to*eo(cl(p));e.textContent=fmt?fmt(v):String(Math.round(v));return e;}
