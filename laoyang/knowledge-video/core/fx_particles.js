// =====================================================================
// 老杨魔方 · 粒子世界库 fx_particles.js（v2 实验，与 fx.js 同一闭包）
// 设计原则：
//  · 一批粒子贯穿一章（以后贯穿全片），每个阶段只是换「阵型」，转场 = 粒子流过去，不淡入淡出
//  · 位置是时间的解析函数（不逐帧模拟）→ render(t) 仍是纯函数，可分段并行渲染
//  · 密度 = 亮度：粒子画在离屏层上用 lighter 叠加，聚的地方自然发亮；再加半分辨率辉光
//  · 三档速度：漂（4–8s 背景）/ 推（0.6–1.2s 讲述）/ 击（0.12–0.25s 冲击）；makeWarp 做「时间变慢」
//  · 中间区不再硬裁切：present() 用羽化遮罩，粒子在底板边缘渐隐
// =====================================================================
const SM=x=>{x=cl(x);return x*x*(3-2*x);};
const SPEED={drift:6,push:0.9,hit:0.18};           // 三档速度（秒）
// 解析平滑噪声（-1..1），每个粒子相位不同
function nz(i,t,f){return Math.sin(t*f*(0.7+0.6*rnd(i*3.1+.3))+rnd(i+.7)*6.283)*0.6+Math.sin(t*f*1.9*(0.6+0.8*rnd(i*5.7+.1))+rnd(i*2.3+.9)*6.283)*0.4;}
// 时间变速：wins=[[起,止,速度倍率,过渡秒]] → τ(t)。慢放窗口内运动变慢，窗口外恢复；用 τ 驱动所有「漂」的运动
function makeWarp(wins,tA,tB){const dt=1/240,n=Math.ceil((tB-tA)/dt)+2,tab=new Float64Array(n);let acc=0;
 const w=t=>{let f=1;for(const [a,b,k,r] of wins){const u=Math.min(cl((t-a+r)/r),cl((b+r-t)/r));f=Math.min(f,lerp(1,k,SM(u)));}return f;};
 for(let j=0;j<n;j++){tab[j]=acc;acc+=w(tA+j*dt)*dt;}
 return t=>{if(t<=tA)return t-tA;const x=(t-tA)/dt,j=Math.floor(x);if(j>=n-1)return tab[n-1]+(t-tA-(n-1)*dt);return tab[j]+(tab[j+1]-tab[j])*(x-j);};}
// 离屏图层（按名字复用）
const _LY={};
function layer(name,w,h){if(!_LY[name]){const c=document.createElement('canvas');c.width=w||1080;c.height=h||1920;_LY[name]=c;}
 const c=_LY[name],g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.filter='none';g.clearRect(0,0,c.width,c.height);return [c,g];}
// 羽化遮罩：中间区四边渐隐（取代硬矩形裁切）
let _MASK=null;
function featherMask(){if(_MASK)return _MASK;const c=document.createElement('canvas');c.width=1080;c.height=1920;const g=c.getContext('2d');
 const x0=96,x1=984,y0=566,y1=1404,W=x1-x0,H=y1-y0;
 let gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(70/W,'#fff');gr.addColorStop(1-70/W,'#fff');gr.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=gr;g.fillRect(x0,y0,W,H);g.globalCompositeOperation='destination-in';
 gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(50/H,'#fff');gr.addColorStop(1-120/H,'#fff');gr.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=gr;g.fillRect(0,y0,1080,H);_MASK=c;return c;}
// 把图层合成到主画布：羽化 + 叠加 + 辉光（bloom 0–1）
function present(c,a,bloom){const g=c.getContext('2d');g.globalCompositeOperation='destination-in';g.globalAlpha=1;g.drawImage(featherMask(),0,0,c.width,c.height);
 X.save();X.globalCompositeOperation='lighter';X.globalAlpha=cl(a);X.drawImage(c,0,0,1080,1920);
 if(bloom>0){const [b,bg]=layer('_bloom',270,480);bg.filter='blur(5px)';bg.drawImage(c,0,0,270,480);X.globalAlpha=cl(a*bloom);X.drawImage(b,0,0,1080,1920);}
 X.restore();}
// 图层上画发光线（宽淡 + 细亮）
function glineOn(g,pts,col,w,a){if(a<=0.003||pts.length<2)return;g.save();g.globalCompositeOperation='lighter';g.lineJoin='round';g.lineCap='round';
 for(const [lw,al] of [[w*4,0.08],[w*2,0.18],[w,0.9]]){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.strokeStyle=rgba(col,al*a);g.lineWidth=lw;g.stroke();}g.restore();}
// 远景层：慢速视差的模糊微粒（漂），给画面景深；半分辨率画，模糊后放大
function farField(t,a,n,seed){if(a<=0)return;const [c,g]=layer('_far0',540,960);g.fillStyle='#FFE9C4';
 for(let i=0;i<n;i++){const s=seed+i*1.7;const x=((rnd(s)+t*0.004*(0.4+rnd(s+1)))%1)*600-30,y=280+rnd(s+2)*420+Math.sin(t*0.3+rnd(s+3)*6.283)*6;
  g.globalAlpha=(0.10+0.25*rnd(s+4))*(0.6+0.4*Math.sin(t*0.9+rnd(s+5)*6.283));const r=0.6+1.6*rnd(s+6);g.fillRect(x-r,y-r,2*r,2*r);}
 const [c2,g2]=layer('_far',540,960);g2.filter='blur(1.6px)';g2.drawImage(c,0,0);present(c2,a,0);}
// 阵型采样
function sampleRectOutline(x,y,w,h,n){const P=2*(w+h),out=[];for(let k=0;k<n;k++){let d=(k+0.5)/n*P;
 if(d<w)out.push([x+d,y]);else if((d-=w)<h)out.push([x+w,y+d]);else if((d-=h)<w)out.push([x+w-d,y+h]);else{d-=w;out.push([x,y+h-d]);}}return out;}
function sampleLine(pts,n){const out=[];for(let i=0;i<n;i++)out.push(along(pts,n>1?i/(n-1):0));return out;}
function textToPoints(txt,font,cx,cy,step){const [c,g]=layer('_txt',1080,400);g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.fillText(txt,540,200);
 const d=g.getImageData(0,0,1080,400).data,out=[];for(let y=0;y<400;y+=step)for(let x=0;x<1080;x+=step)if(d[(y*1080+x)*4+3]>128)out.push([cx+x-540,cy+y-200]);return out;}
// 颜色插值（hex → 'r,g,b'）
const _hx=h=>{const n=parseInt(h.slice(1),16);return [n>>16,(n>>8)&255,n&255];};
function mixRGB(c1,c2,u){const a=_hx(c1),b=_hx(c2);return `rgb(${Math.round(lerp(a[0],b[0],u))},${Math.round(lerp(a[1],b[1],u))},${Math.round(lerp(a[2],b[2],u))})`;}
