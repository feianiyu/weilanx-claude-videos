// 思想可见 ·《画了 6000 年的龙，为什么没人见过？》竖版 1080×1920 / 30fps / 无旁白。画面 = 时间 t 的纯函数。
// 性格：庄重型（入场 12–20 帧，缓动 (0.4,0,0.2,1)，不过冲）；27 秒一次 drop（九似拼龙）用冲击型。
const W=1080,H=1920,FPS=30,DUR=58.5;
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const lerp=(a,b,k)=>a+(b-a)*k, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), P=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo3=x=>1-Math.pow(1-x,3), eIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, sm=x=>x*x*(3-2*x), ein=x=>x*x*x, expo=x=>x>=1?1:1-Math.pow(2,-10*x);
const ease=x=>{ // cubic-bezier(0.4,0,0.2,1)：庄重型主缓动
  if(x<=0) return 0; if(x>=1) return 1; let lo=0,hi=1,u=x; for(let i=0;i<22;i++){ u=(lo+hi)/2; const bx=3*(1-u)*(1-u)*u*0.4+3*(1-u)*u*u*0.2+u*u*u; if(bx<x) lo=u; else hi=u; }
  return 3*(1-u)*u*u*1+u*u*u; };
const gauss=r=>{let u=0;for(let i=0;i<4;i++)u+=r();return (u-2)/0.58;};
const TAU=Math.PI*2;
const GOLD=[255,212,140], WARM=[255,234,196], WHITE=[255,255,255], JADE=[130,214,170], TURQ=[70,205,200], SHELL=[236,230,216];
const SANS='"Noto Sans SC",sans-serif', DISP='"QingKe","Noto Sans SC",sans-serif';
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${clamp(a,0,1)})`;
const SPR={}; function sprite(col){ const k=col.map(v=>v|0).join(','); if(SPR[k]) return SPR[k]; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,`rgba(${k},1)`); gr.addColorStop(0.25,`rgba(${k},0.35)`); gr.addColorStop(1,`rgba(${k},0)`); g.fillStyle=gr; g.fillRect(0,0,64,64); return SPR[k]=c; }
function glow(ctx,x,y,r,col,a){ if(a<=0.004||r<=0.3) return; const ga=ctx.globalAlpha; ctx.globalAlpha=Math.min(1,a*ga); ctx.drawImage(sprite(col),x-r,y-r,2*r,2*r); ctx.globalAlpha=ga; }
// 节拍：80 BPM，每拍 0.75 s，每小节 3 s；drop 在第 9 小节（27.0 s）
const T={hook:0,shell:6,jade:12,turq:18,ask:24,dark:26.3,drop:27,nine:[27.6,0.6],fly:33,size:36,qian:42,end:48,q:54};

// ───────── 龙的脊线与身体 ─────────
const NS=150; // 脊线采样点数
function widthAt(u){ const body=0.78+0.32*Math.sin(Math.PI*Math.min(1,u*1.5)); const tail=u<0.7?1:Math.pow(Math.max(0,1-(u-0.7)/0.3),0.85); return body*tail; }
function frame(pts){ // 切线、法线
  return pts.map((p,i)=>{ const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)]; let tx=b[0]-a[0], ty=b[1]-a[1]; const l=Math.hypot(tx,ty)||1; tx/=l; ty/=l; return {x:p[0],y:p[1],tx,ty,nx:-ty,ny:tx}; }); }
const at=(F,u,v,w0)=>{ const f=F[Math.round(clamp(u,0,1)*(F.length-1))]; const w=w0*widthAt(u)*v; return [f.x+f.nx*w,f.y+f.ny*w]; };

// 各段的脊线（返回 NS 个点）
function spineShell(t){ return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1); return [190+u*720, 800+Math.sin(u*TAU*1.2+0.6)*26*(0.4+u)-Math.max(0,0.12-u)*260]; }); }
function spineC(t){ const r=232; return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1), th=(-62-u*236)*Math.PI/180; return [560+Math.cos(th)*r, 800+Math.sin(th)*r]; }); }
function spineTurq(t){ return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1); return [540+Math.sin(u*TAU*1.25+0.3)*120*(0.5+0.5*u)+Math.sin(t*1.2+u*6)*6, 420+u*860]; }); }
// 跟随运动：龙头沿轨迹走，身体每一节都走龙头走过的路（真实的蛇形运动）
function catmull(K,τ){ let i=0; while(i<K.length-2&&τ>=K[i+1][0]) i++; const p0=K[Math.max(0,i-1)],p1=K[i],p2=K[i+1],p3=K[Math.min(K.length-1,i+2)]; const s=clamp((τ-p1[0])/(p2[0]-p1[0]),0,1);
  const f=(a,b,c,d)=>0.5*((2*b)+(-a+c)*s+(2*a-5*b+4*c-d)*s*s+(-a+3*b-3*c+d)*s*s*s); return [f(p0[1],p1[1],p2[1],p3[1]),f(p0[2],p1[2],p2[2],p3[2])]; }
const PATH=[ // [时间, x, y]
  [24,540,1500],[25,300,1200],[26,700,900],[27,540,560],[28,300,520],[29,250,800],[30,600,1000],[31,850,760],[32,700,480],[33,420,420],[34,180,700],[35,420,1020],[36,820,950],[37,940,640],[38,700,420],[39,380,500],[40,250,820],[41,500,1050],[42,1180,1180],
  [43,800,1240],[44.1,330,1200],[44.8,200,1090],[45.3,400,800],[45.8,700,520],[46.4,820,400],[47.0,640,240],[47.6,540,40],[48.2,520,-260],[49,520,-500]];
const LAG=2.1;
function spineFollow(t,lag=LAG,K=PATH){ return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1); return catmull(K,t-u*lag); }); }
const HOOK=[[-5,1050,700],[-3,900,800],[0,700,900],[2,450,980],[4,250,1050],[6,60,1100],[8,-200,1150]];
// 九似拼装时的静止姿态：一条 S 形，头在上方朝左
function spinePose(t){ const k=t*0.6; return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1); return [560+Math.sin(u*TAU*1.05+0.9+Math.sin(k+u*3)*0.06)*250*(0.55+0.45*Math.min(1,u*2)), 560+u*760]; }); }
const mixS=(A,B,k)=>A.map((p,i)=>[lerp(p[0],B[i][0],k),lerp(p[1],B[i][1],k)]);
function spineEnd(t){ const r=250; return Array.from({length:NS},(_,i)=>{ const u=i/(NS-1), th=(-62-u*236)*Math.PI/180+Math.sin(t*0.8+u*5)*0.01; return [560+Math.cos(th)*r, 760+Math.sin(th)*r]; }); }

// ───────── 画龙（金线）：身体、鳞、背鳍、腹甲、腿爪、头、尾 ─────────
// part(name) 返回该部件的位移/透明度（九似拼装用）；默认全在位
const NONE={dx:0,dy:0,a:1};
function drawDragon(ctx,t,S,opt){ const F=frame(S), w0=opt.w||40, A=opt.a??1, part=opt.part||(()=>NONE), lit=opt.lit??2, col=opt.col||GOLD;
  if(A<=0.01) return; ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  const sideL=[],sideR=[]; for(let i=0;i<NS;i++){ const u=i/(NS-1); sideL.push(at(F,u,1,w0)); sideR.push(at(F,u,-1,w0)); }
  const withPart=(name,fn)=>{ const p=part(name); if(p.a<=0.01) return; ctx.save(); ctx.translate(p.dx,p.dy); ctx.globalAlpha=A*p.a; fn(); ctx.restore(); };
  const line=(pts,i0,i1)=>{ ctx.beginPath(); for(let i=i0;i<=i1;i++) i===i0?ctx.moveTo(pts[i][0],pts[i][1]):ctx.lineTo(pts[i][0],pts[i][1]); ctx.stroke(); };
  const iNeck=Math.round(0.16*(NS-1));
  // 身体外形（项以后）+ 背鳍 + 尾
  withPart('body',()=>{ const k=opt.draw??1, i1=Math.max(iNeck+1,Math.round(lerp(iNeck,NS-1,k)));
    // 身体底色：极暗的填充，让金线浮起来
    ctx.beginPath(); for(let i=iNeck;i<=i1;i++) i===iNeck?ctx.moveTo(...sideL[i]):ctx.lineTo(...sideL[i]); for(let i=i1;i>=iNeck;i--) ctx.lineTo(...sideR[i]); ctx.closePath(); ctx.fillStyle='rgba(8,10,18,0.78)'; ctx.fill();
    ctx.strokeStyle=rgba(col,0.92); ctx.lineWidth=2.4; line(sideL,iNeck,i1); line(sideR,iNeck,i1);
    for(let i=iNeck;i<=i1-2;i+=4){ const u=i/(NS-1), f=F[i], w=w0*widthAt(u); if(w<3) continue; const b=sideL[i], h=w*0.55*(1+0.25*Math.sin(i*1.7));
      ctx.beginPath(); ctx.moveTo(b[0]-f.tx*w*0.18,b[1]-f.ty*w*0.18); ctx.lineTo(b[0]+f.nx*h+f.tx*w*0.25,b[1]+f.ny*h+f.ty*w*0.25); ctx.lineTo(b[0]+f.tx*w*0.3,b[1]+f.ty*w*0.3); ctx.strokeStyle=rgba(col,0.7); ctx.lineWidth=1.6; ctx.stroke(); }
    if(k>=1){ const f=F[NS-1]; ctx.strokeStyle=rgba(col,0.85); ctx.lineWidth=1.8; for(let j=-2;j<=2;j++){ const L=w0*(1.6+0.4*Math.abs(j)), sw=Math.sin(t*3+j)*0.25;
      ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.quadraticCurveTo(f.x+f.tx*L*0.6+f.nx*j*w0*0.35,f.y+f.ty*L*0.6+f.ny*j*w0*0.35,f.x+f.tx*L+f.nx*(j*w0*0.6+sw*w0),f.y+f.ty*L+f.ny*(j*w0*0.6+sw*w0)); ctx.stroke(); } } });
  // 项：脖子一段外形 + 鬃毛
  withPart('neck',()=>{ ctx.beginPath(); for(let i=0;i<=iNeck+1;i++) i===0?ctx.moveTo(...sideL[i]):ctx.lineTo(...sideL[i]); for(let i=iNeck+1;i>=0;i--) ctx.lineTo(...sideR[i]); ctx.closePath(); ctx.fillStyle='rgba(8,10,18,0.78)'; ctx.fill();
    ctx.strokeStyle=rgba(col,0.92); ctx.lineWidth=2.4; line(sideL,0,iNeck+1); line(sideR,0,iNeck+1);
    for(let i=2;i<iNeck;i+=3){ const f=F[i], b=sideL[i], L=w0*(0.9+0.5*Math.sin(i)), sw=Math.sin(t*2.2+i*0.6)*0.35; ctx.strokeStyle=rgba(col,0.6); ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(b[0],b[1]); ctx.quadraticCurveTo(b[0]+f.nx*L*0.6+f.tx*L*0.5,b[1]+f.ny*L*0.6+f.ty*L*0.5,b[0]+f.nx*L*(0.7+sw*0.2)+f.tx*L*1.3,b[1]+f.ny*L*(0.7+sw*0.2)+f.ty*L*1.3); ctx.stroke(); } });
  // 腹：腹甲横纹
  withPart('belly',()=>{ ctx.strokeStyle=rgba(col,0.55); ctx.lineWidth=1.3; for(let i=iNeck;i<NS*0.9;i+=3){ const u=i/(NS-1), a=at(F,u,-1,w0), b=at(F,u,-0.45,w0); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); } });
  // 鳞：三列鳞片，开口朝尾；lit 之前的鳞会亮起
  withPart('scales',()=>{ for(let i=iNeck+2;i<NS*0.92;i+=3){ const u=i/(NS-1), f=F[i], w=w0*widthAt(u); if(w<5) continue; const ang=Math.atan2(f.ty,f.tx);
      for(const j of [-0.05,0.4,0.8]){ if(j===0.8&&w<12) continue; const [cx,cy]=at(F,u,j-0.1,w0); const r=w*0.26; const on=u<lit?1:0, flash=Math.exp(-Math.pow((lit-u)*14,2));
        ctx.strokeStyle=rgba(on?WARM:col,0.45+0.4*on+0.4*flash); ctx.lineWidth=1.2+flash*1.2; ctx.beginPath(); ctx.arc(cx,cy,r,ang+Math.PI/2,ang-Math.PI/2,false); ctx.stroke();
        if(flash>0.3) glow(ctx,cx,cy,r*2.2,WARM,0.5*flash); } } });
  // 掌与爪：四条腿
  const legs=[[0.21,-1,0],[0.27,1,1],[0.6,-1,2],[0.66,1,3]];
  const legGeom=(u,side,k)=>{ const f=F[Math.round(u*(NS-1))], w=w0*widthAt(u), b=at(F,u,side*0.9,w0); const out=[f.nx*side,f.ny*side], back=[f.tx,f.ty];
    const sw=Math.sin(t*2.4+k*1.7)*0.3; const knee=[b[0]+out[0]*w*1.3+back[0]*w*(0.5+sw*0.4),b[1]+out[1]*w*1.3+back[1]*w*(0.5+sw*0.4)];
    const palm=[knee[0]+out[0]*w*0.9-back[0]*w*(0.6-sw*0.5),knee[1]+out[1]*w*0.9-back[1]*w*(0.6-sw*0.5)]; return {b,knee,palm,out,back,w}; };
  withPart('palm',()=>{ for(const [u,side,k] of legs){ const g=legGeom(u,side,k); ctx.strokeStyle=rgba(col,0.9); ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(...g.b); ctx.quadraticCurveTo(g.knee[0],g.knee[1],g.palm[0],g.palm[1]); ctx.stroke();
      ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(g.b[0]+g.back[0]*g.w*0.5,g.b[1]+g.back[1]*g.w*0.5); ctx.quadraticCurveTo(g.knee[0]+g.back[0]*g.w*0.4,g.knee[1]+g.back[1]*g.w*0.4,g.palm[0]+g.back[0]*g.w*0.25,g.palm[1]+g.back[1]*g.w*0.25); ctx.stroke();
      ctx.beginPath(); ctx.arc(g.palm[0],g.palm[1],g.w*0.22,0,TAU); ctx.stroke(); } });
  withPart('claw',()=>{ for(const [u,side,k] of legs){ const g=legGeom(u,side,k); ctx.strokeStyle=rgba(WARM,0.95); ctx.lineWidth=1.8;
      for(let c=-1.5;c<=1.5;c+=1){ const dir=[g.out[0]*0.8-g.back[0]*c*0.45,g.out[1]*0.8-g.back[1]*c*0.45], L=g.w*0.75, e=[g.palm[0]+dir[0]*L,g.palm[1]+dir[1]*L];
        ctx.beginPath(); ctx.moveTo(g.palm[0]+dir[0]*g.w*0.2,g.palm[1]+dir[1]*g.w*0.2); ctx.quadraticCurveTo(e[0],e[1],e[0]-g.back[0]*g.w*0.25+g.out[0]*-g.w*0.05,e[1]-g.back[1]*g.w*0.25); ctx.stroke(); } } });
  // 头：局部坐标，x 轴朝龙头前方
  const f0=F[0], hx=-f0.tx, hy=-f0.ty, s=w0/32, flip=opt.flip?-1:(hx<0?-1:1); // 头始终「上方」朝画面上
  const head=(name,fn)=>withPart(name,()=>{ ctx.save(); ctx.translate(f0.x,f0.y); ctx.transform(hx*s,hy*s,-hy*s*flip,hx*s*flip,0,0); fn(); ctx.restore(); });
  head('head',()=>{ ctx.beginPath(); ctx.moveTo(-6,-34); ctx.bezierCurveTo(30,-44,70,-34,104,-22); ctx.quadraticCurveTo(122,-18,120,-4); ctx.quadraticCurveTo(112,2,96,4); ctx.lineTo(70,6); ctx.lineTo(98,14);
    ctx.quadraticCurveTo(84,30,52,30); ctx.bezierCurveTo(30,32,10,34,-6,34); ctx.closePath(); ctx.fillStyle='rgba(8,10,18,0.85)'; ctx.fill(); ctx.strokeStyle=rgba(col,0.95); ctx.lineWidth=2.4/s; ctx.stroke();
    ctx.lineWidth=1.4/s; ctx.beginPath(); ctx.moveTo(34,-38); ctx.quadraticCurveTo(48,-30,64,-34); ctx.stroke(); // 眉弓
    for(let k=0;k<4;k++){ ctx.beginPath(); ctx.moveTo(74+k*7,6); ctx.lineTo(77+k*7,0); ctx.stroke(); } // 牙
    // 须：从鼻端拖向身后，随时间摆
    ctx.lineWidth=1.6/s; ctx.strokeStyle=rgba(col,0.85); for(const [y0,sg] of [[-14,-1],[-8,1]]){ ctx.beginPath(); ctx.moveTo(112,y0); for(let k=1;k<=24;k++){ const x=112+30-k*12, y=y0+sg*(k*2.4)+Math.sin(t*3+k*0.5)*k*0.9; ctx.lineTo(x,y); } ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(60,30); ctx.quadraticCurveTo(40,58+Math.sin(t*2)*4,10,66); ctx.stroke(); }); // 须髯
  head('eye',()=>{ ctx.strokeStyle=rgba(WARM,1); ctx.lineWidth=1.8/s; ctx.beginPath(); ctx.ellipse(52,-18,9,6,-0.2,0,TAU); ctx.stroke(); ctx.globalCompositeOperation='lighter'; glow(ctx,52,-18,16,WARM,0.95); glow(ctx,52,-18,4,WHITE,1); });
  head('horn',()=>{ ctx.strokeStyle=rgba(col,0.95); ctx.lineWidth=2.4/s; const sw=Math.sin(t*1.5)*3; ctx.beginPath(); ctx.moveTo(26,-36); ctx.bezierCurveTo(10,-80,-30,-100,-70+sw,-128); ctx.stroke();
    ctx.lineWidth=1.8/s; for(const [x0,y0,x1,y1] of [[8,-70,22,-108],[-20,-94,-14,-136],[-46,-112,-62,-148]]){ ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo((x0+x1)/2+8,(y0+y1)/2,x1+sw,y1); ctx.stroke(); } });
  head('ear',()=>{ ctx.strokeStyle=rgba(col,0.9); ctx.lineWidth=1.8/s; ctx.beginPath(); ctx.moveTo(10,-30); ctx.quadraticCurveTo(-16,-58,-44,-52); ctx.quadraticCurveTo(-18,-36,4,-24); ctx.stroke(); });
  ctx.restore(); }

// ───────── 环境：金尘、云 ─────────
const DUST=(()=>{const r=rng(5);return Array.from({length:420},()=>({x:r()*W,y:r()*H,z:0.2+r()*0.8,ph:r()*6.28,f:0.4+r()*1.2,b:r()}));})();
function dust(ctx,t,a){ ctx.save(); ctx.globalCompositeOperation='lighter'; for(const d of DUST){ const x=(d.x+t*8*d.z+Math.sin(t*0.3+d.ph)*20+W)%W, y=(d.y-t*14*d.z+H*10)%H, tw=0.5+0.5*Math.sin(t*d.f+d.ph);
  const al=a*(0.12+0.4*d.b)*tw*d.z; if(d.b>0.85) glow(ctx,x,y,6*d.z,GOLD,al); else { ctx.fillStyle=rgba(GOLD,al); ctx.fillRect(x,y,1.6*d.z,1.6*d.z); } } ctx.restore(); }
const CLOUD=(()=>{const r=rng(9);return Array.from({length:26},()=>({x:r()*W,y:r()*H,r:220+r()*360,v:6+r()*14,ph:r()*6.28}));})();
function clouds(ctx,t,a,col=[40,52,86]){ if(a<=0.01) return; for(const c of CLOUD){ const x=(c.x+t*c.v+W*2)%(W+800)-400, y=c.y+Math.sin(t*0.2+c.ph)*30; const g=ctx.createRadialGradient(x,y,0,x,y,c.r); g.addColorStop(0,rgba(col,0.22*a)); g.addColorStop(1,rgba(col,0)); ctx.fillStyle=g; ctx.fillRect(x-c.r,y-c.r,c.r*2,c.r*2); } }

// ───────── 字 ─────────
// 模糊聚焦入场（庄重型 15 帧）；退场 9 帧上提淡出；落地后静止
function say(ctx,t,txt,x,y,size,a0,a1,o={}){ const tin=o.tin??0.5, tout=o.tout??0.3; if(t<a0||t>a1) return; const ki=ease(P(t,a0,a0+tin)), ko=P(t,a1-tout,a1);
  const a=ki*(1-ko); if(a<=0.01) return; ctx.save(); ctx.font=`${o.w||400} ${size}px ${o.font||DISP}`; ctx.textAlign=o.align||'center'; ctx.textBaseline='middle';
  const blur=(1-ki)*10; if(blur>0.3) ctx.filter=`blur(${blur.toFixed(1)}px)`; ctx.globalAlpha=a; ctx.fillStyle=o.col||'#f4ead8';
  ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=18; ctx.fillText(txt,x,y-ko*18+(1-ki)*6); ctx.restore(); }
// 逐字弹入（冲击型：每字 2 帧错开，8 帧落地，带一点过冲）
function pop(ctx,t,txt,x,y,size,a0,a1,o={}){ if(t<a0||t>a1) return; const ch=[...txt]; ctx.save(); ctx.font=`400 ${size}px ${o.font||DISP}`; ctx.textBaseline='middle';
  const wid=ch.map(c=>ctx.measureText(c).width), tot=wid.reduce((s,v)=>s+v,0); let cx=x-tot/2; const ko=P(t,a1-0.25,a1);
  ch.forEach((c,i)=>{ const k=P(t,a0+i*0.066,a0+i*0.066+0.27); if(k>0){ const s=k<1?1+0.18*Math.sin(Math.PI*k)*(1-k)+ (1-expo(k))*-0.4:1; ctx.save(); ctx.translate(cx+wid[i]/2,y); ctx.scale(s,s);
    ctx.globalAlpha=clamp(k*3,0,1)*(1-ko); ctx.fillStyle=o.col||'#f4ead8'; ctx.shadowColor=o.glow||'rgba(255,190,110,0.55)'; ctx.shadowBlur=26; ctx.textAlign='center'; ctx.fillText(c,0,0); ctx.restore(); } cx+=wid[i]; });
  ctx.restore(); }
const src=(ctx,t,txt,y,a0,a1)=>say(ctx,t,txt,540,y,30,a0,a1,{font:SANS,w:700,col:'rgba(255,214,150,0.8)',tin:0.45});

// ───────── 0 开场 / 1 蚌壳 / 2 玉 C / 3 绿松石 ─────────
const SH=(()=>{const r=rng(21),s=[]; for(let i=0;i<760;i++){ const u=Math.pow(r(),0.9), v=(r()*2-1); s.push({u,v,sx:r()*W,sy:r()*H*0.4-300,rot:r()*TAU,len:5+r()*5,ph:r()});}
  // 头（抬起）与四条短腿：用额外的偏移点
  for(let i=0;i<120;i++){ const a=r()*TAU, rr=Math.sqrt(r()); s.push({u:0,v:0,ox:-30+Math.cos(a)*rr*46,oy:-60+Math.sin(a)*rr*34,sx:r()*W,sy:r()*H*0.4-300,rot:r()*TAU,len:5+r()*5,ph:r()}); }
  for(const [u,sd] of [[0.2,1],[0.27,1],[0.62,1],[0.7,1]]) for(let i=0;i<22;i++){ const k=i/21; s.push({u,v:0,ox:-k*26,oy:34+k*58,sx:r()*W,sy:r()*H*0.4-300,rot:r()*TAU,len:5+r()*4,ph:r()}); }
  return s;})();
const TILES=(()=>{const r=rng(23),s=[]; for(let i=0;i<80;i++) for(let j=0;j<25;j++) s.push({u:i/79,v:(j+0.5)/25*2-1,jit:r(),sw:r()*TAU,rad:200+r()*500}); return s;})();
function scenePre(ctx,t){
  // 蚌壳：从上方落下，按龙身从头到尾摆好
  const S1=spineShell(t), F1=frame(S1), SC=spineC(t), FC=frame(SC), ST=spineTurq(t), FT=frame(ST);
  if(t>=T.shell-0.5&&t<T.jade+2.2){ const morph=eIO(P(t,T.jade,T.jade+1.6)), fade=1-P(t,T.jade+1.1,T.jade+2.0);
    ctx.save(); for(const s of SH){ const ta=T.shell+0.3+s.u*2.4+s.ph*0.35, k=ease(P(t,ta-1.0,ta)); if(k<=0) continue;
      const p1=at(F1,s.u,s.v*0.92,34).map((v,j)=>v+(j?s.oy||0:s.ox||0)), pc=at(FC,s.u,s.v*0.92,46), tx=lerp(p1[0],pc[0],morph), ty=lerp(p1[1],pc[1],morph);
      const x=lerp(s.sx,tx,k), y=lerp(s.sy,ty,k), col=[lerp(SHELL[0],JADE[0],morph),lerp(SHELL[1],JADE[1],morph),lerp(SHELL[2],JADE[2],morph)];
      ctx.save(); ctx.translate(x,y); ctx.rotate(s.rot+(1-k)*3); ctx.fillStyle=rgba(col,0.85*fade*Math.min(1,k*2)); ctx.beginPath(); ctx.ellipse(0,0,s.len,s.len*0.62,0,0,TAU); ctx.fill(); ctx.restore(); }
    ctx.restore(); }
  // 玉龙：贝壳化成一整块玉
  const jA=sm(P(t,T.jade+0.9,T.jade+1.9))*(1-P(t,T.turq,T.turq+0.25));
  if(jA>0.01){ ctx.save(); ctx.globalAlpha=jA; const L=[],R=[]; for(let i=0;i<NS;i++){ const u=i/(NS-1), tp=u<0.72?1:Math.pow(1-(u-0.72)/0.28,0.7)+0.04; L.push(at(FC,u,tp,46)); R.push(at(FC,u,-tp,46)); }
    ctx.beginPath(); L.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p)); for(let i=NS-1;i>=0;i--) ctx.lineTo(...R[i]); ctx.closePath();
    const g=ctx.createLinearGradient(300,560,820,1040); g.addColorStop(0,'rgba(60,110,90,0.9)'); g.addColorStop(0.5,'rgba(110,170,135,0.85)'); g.addColorStop(1,'rgba(40,80,70,0.9)'); ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle=rgba(GOLD,0.9); ctx.lineWidth=2.4; ctx.stroke();
    // 红山玉龙的长鬣：从头顶向后飘
    const f=FC[0]; ctx.strokeStyle=rgba(GOLD,0.85); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(f.x+f.nx*30,f.y+f.ny*30); ctx.quadraticCurveTo(f.x+f.nx*120+f.tx*60,f.y+f.ny*120+f.ty*60,f.x+f.nx*90+f.tx*190,f.y+f.ny*90+f.ty*190); ctx.stroke();
    ctx.globalCompositeOperation='lighter'; glow(ctx,f.x+f.tx*-6+f.nx*-8,f.y+f.ty*-6+f.ny*-8,14,WARM,0.9);
    // 玉的光泽：一道扫光沿身体走一遍（#022）
    const ks=P(t,T.jade+2.2,T.jade+3.6); if(ks>0&&ks<1){ const p=FC[Math.round(ks*(NS-1))]; glow(ctx,p.x,p.y,120,[200,255,220],0.35*Math.sin(Math.PI*ks)); }
    ctx.restore(); }
  // 绿松石：2000 片，从玉龙身上剥落，一片片贴成一条长龙；24 秒后被卷成漩涡吸进中心
  if(t>=T.turq-0.1&&t<T.dark+0.5){ ctx.save(); const sw=eIO(P(t,T.ask,T.dark)); ctx.globalCompositeOperation='lighter';
    for(const s of TILES){ const ta=T.turq+0.6+s.u*2.2+s.jit*0.4, k=ease(P(t,ta-1.2,ta)); const pc=at(FC,s.u,s.v*0.95,46), pt=at(FT,s.u,s.v*0.95,40);
      let x=lerp(pc[0],pt[0],k)+Math.sin(Math.PI*k)*Math.cos(s.sw)*70, y=lerp(pc[1],pt[1],k)+Math.sin(Math.PI*k)*Math.sin(s.sw)*70;
      if(sw>0){ const dx=x-540, dy=y-900, r=Math.hypot(dx,dy)*(1-sw)+sw*8, an=Math.atan2(dy,dx)+sw*(4+s.jit*3); x=540+Math.cos(an)*r; y=900+Math.sin(an)*r; }
      const a=(t<T.turq+0.25?P(t,T.turq,T.turq+0.25):1)*(0.55+0.45*Math.sin(t*3+s.sw))*(1-P(t,T.dark,T.dark+0.4));
      ctx.fillStyle=rgba(k>=1&&s.jit<0.2?[150,240,230]:TURQ,a*0.85); const z=4.2*(1-sw*0.6); ctx.save(); ctx.translate(x,y); ctx.rotate(s.sw*0.3+(1-k)*2); ctx.fillRect(-z/2,-z/2,z,z*1.3); ctx.restore(); }
    // 二里头绿松石龙的方头
    const kh=P(t,T.turq+0.6,T.turq+1.2)*(1-sw); if(kh>0){ const f=FT[0]; ctx.strokeStyle=rgba(GOLD,0.85*kh); ctx.lineWidth=2.4; ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(Math.atan2(f.ty,f.tx)+Math.PI); ctx.strokeRect(-6,-46,70,92);
      glow(ctx,30,-20,12,WARM,kh); glow(ctx,30,20,12,WARM,kh); ctx.restore(); }
    // 中心的亮核
    if(sw>0){ glow(ctx,540,900,40+160*sw,WARM,0.8*sw*(1-P(t,T.dark,T.drop))); }
    ctx.restore(); } }

// ───────── 4 九似 ─────────
// Motion Prompt #143 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#143  分解图 Exploded view：九个部件从四周飞回，按顺序装上
// Motion Prompt #003 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#003  迸发 Burst：drop 那一帧，中心亮核炸开一圈环和射线
// Motion Prompt #004 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#004  描线 Line draw：龙身先描出一条线
const NINE=[['horn','角','鹿'],['head','头','驼'],['eye','眼','鬼'],['neck','项','蛇'],['belly','腹','蜃'],['scales','鳞','鱼'],['claw','爪','鹰'],['palm','掌','虎'],['ear','耳','牛']];
const nineT=i=>T.nine[0]+i*T.nine[1];
function ninePart(t){ return name=>{ if(name==='body') return NONE; const i=NINE.findIndex(n=>n[0]===name); const t0=nineT(i), k=expo(P(t,t0-0.45,t0)); const an=i*0.7+0.4, d=1100*(1-k);
  return {dx:Math.cos(an)*d,dy:Math.sin(an)*d,a:P(t,t0-0.45,t0-0.25)}; }; }
function burst(ctx,t,t0,x,y,s=1){ const kb=P(t,t0,t0+0.6); if(kb<=0||kb>=1) return; const e=expo(kb); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=rgba(WARM,(1-kb)*0.85); ctx.lineWidth=3*(1-kb)+1;
  ctx.beginPath(); ctx.arc(x,y,(30+560*e)*s,0,TAU); ctx.stroke(); for(let i=0;i<20;i++){ const an=i/20*TAU+0.15, r0=(50+260*e)*s, r1=(80+640*e)*s; ctx.strokeStyle=rgba(GOLD,(1-kb)*0.7); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+Math.cos(an)*r0,y+Math.sin(an)*r0); ctx.lineTo(x+Math.cos(an)*r1,y+Math.sin(an)*r1); ctx.stroke(); }
  glow(ctx,x,y,(220*(1-kb)+30)*s,WHITE,(1-kb)*0.7); ctx.restore(); }

// ───────── 合成 ─────────
function spineAt(t){ // 27 秒之后龙的脊线
  if(t<T.fly) return spinePose(t);
  if(t<T.end){ const k=eIO(P(t,T.fly,T.fly+0.9)); const f=spineFollow(t); return k<1?mixS(spinePose(t),f,k):f; }
  return mixS(spineFollow(Math.min(t,48.0)),spineEnd(t),eIO(P(t,T.end,T.end+2.2))); }
function render(ctx,t){
  ctx.setTransform(1,0,0,1,0,0); const bg=ctx.createRadialGradient(540,860,0,540,860,1300); bg.addColorStop(0,'#141a2c'); bg.addColorStop(0.55,'#070a14'); bg.addColorStop(1,'#020308'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  // 冲击震屏（#024）
  const sk=Math.max(0,1-(t-T.drop)/0.35)*(t>=T.drop?14:0); ctx.setTransform(1,0,0,1,Math.sin(t*97)*sk,Math.cos(t*83)*sk);
  clouds(ctx,t,t<T.drop?0.6:1);
  const dim=1-0.75*P(t,T.dark,T.drop-0.1)*(t<T.drop?1:0);
  dust(ctx,t,(0.7+0.5*P(t,T.drop,T.drop+0.4))*dim);
  // 开场：一条巨龙在云后掠过，只露出一段身子（见首不见尾）
  if(t<6.4){ ctx.save(); ctx.translate(540,860); ctx.scale(2.4,2.4); ctx.translate(-540,-860); drawDragon(ctx,t,spineFollow(t,2.6,HOOK),{w:42,a:0.42*(1-P(t,5.0,6.3)),lit:2}); ctx.restore(); clouds(ctx,t+40,1.3,[30,40,70]); }
  ctx.globalAlpha=dim; scenePre(ctx,t); ctx.globalAlpha=1;
  if(t>=T.drop){ let S=spineAt(t); const opt={w:t<T.fly+0.9?lerp(52,42,eIO(P(t,T.fly,T.fly+0.9))):42,part:ninePart(t),draw:eIO(P(t,T.drop,T.drop+0.6)),lit:-1};
    // 鳞片一片片亮起
    opt.lit=lerp(-0.1,1.1,P(t,nineT(5),nineT(5)+1.4));
    // 能细能巨：先缩成一根金线，再大到看不清全身，然后消失，再亮回来（36–42）
    let sc=1, cx=540, cy=860, A=1;
    if(t>=T.size&&t<T.qian){ const k1=eIO(P(t,36.2,37.4)), k2=eIO(P(t,38.0,39.0)), k3=eIO(P(t,39.6,40.4));
      sc=lerp(1,0.16,k1); if(t>=38.0){ sc=lerp(0.16,3.6,k2); cy=lerp(860,700,k2); } if(t>=39.6){ A=1-k3; } if(t>=40.6){ sc=1; cy=860; A=ease(P(t,40.6,41.2)); } }
    if(t>=T.qian&&t<T.qian+0.4){ A=1; }
    ctx.save(); ctx.translate(cx,cy); ctx.scale(sc,sc); ctx.translate(-540,-860); drawDragon(ctx,t,S,{...opt,a:A}); ctx.restore();
    if(t>=40.6&&t<41.4) burst(ctx,t,40.6,540,860,0.6);
    // 乾卦：水面线
    const wA=win(t,T.qian,48.3,0.5); if(wA>0){ ctx.save(); ctx.strokeStyle=`rgba(170,195,230,${0.45*wA})`; ctx.lineWidth=1.4; for(let k=0;k<5;k++){ const y=1100+k*16; ctx.beginPath(); for(let x=0;x<=W;x+=20) x?ctx.lineTo(x,y+Math.sin(x*0.02+t*2+k)*3):ctx.moveTo(x,y); ctx.globalAlpha=1-k*0.18; ctx.stroke(); }
      // 潜龙在水下：水面以下再压一层暗色
      ctx.globalAlpha=1; const g=ctx.createLinearGradient(0,1100,0,1400); g.addColorStop(0,`rgba(5,10,22,${0.55*wA})`); g.addColorStop(1,`rgba(5,10,22,${0.8*wA})`); ctx.fillStyle=g; ctx.fillRect(0,1100,W,820); ctx.restore(); }
    burst(ctx,t,T.drop,540,900); }
  ctx.setTransform(1,0,0,1,0,0);
  texts(ctx,t);
  brand(ctx,t);
  const v=ctx.createRadialGradient(540,900,520,540,900,1250); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.5)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  const fo=P(t,DUR-0.6,DUR); if(fo>0){ ctx.fillStyle=`rgba(0,0,0,${fo})`; ctx.fillRect(0,0,W,H); }
}
const win=(t,a,b,f=0.6)=>P(t,a,a+f)*(1-P(t,b-f,b));
function texts(ctx,t){
  // 首帧即钩子
  if(t<3.0){ ctx.save(); ctx.font=`400 150px ${DISP}`; ctx.textAlign='center'; ctx.textBaseline='middle'; const a=1-P(t,2.7,3.0); ctx.globalAlpha=a; ctx.fillStyle='#f4ead8'; ctx.shadowColor='rgba(255,190,110,0.5)'; ctx.shadowBlur=30; ctx.fillText('6000 年',540,520); ctx.restore();
    say(ctx,t,'没有一个人见过龙',540,690,76,-1,3.0,{tin:0.01}); }
  say(ctx,t,'可它，一次也没缺席',540,600,70,3.1,5.8);
  say(ctx,t,'6400 年前',540,330,110,6.0,11.8); say(ctx,t,'有人用蚌壳，摆了一条龙',540,470,60,6.6,11.8); src(ctx,t,'河南濮阳西水坡 · 长 1.78 米',1150,7.2,11.8);
  say(ctx,t,'5000 多年前',540,330,110,12.0,17.8); say(ctx,t,'玉龙，弯成一个 C',540,470,60,12.6,17.8); src(ctx,t,'红山文化 · 中国国家博物馆藏',1150,13.2,17.8);
  say(ctx,t,'3600 多年前',540,250,104,18.0,23.8); say(ctx,t,'2000 多片绿松石，拼一条龙',540,360,56,18.6,23.8); src(ctx,t,'河南偃师 · 二里头遗址',1310,19.2,23.8);
  say(ctx,t,'龙，到底长什么样？',540,560,74,24.1,26.4,{tout:0.25});
  // drop：九似
  pop(ctx,t,'龙是拼出来的',540,300,104,T.drop+0.05,33.0);
  NINE.forEach(([n,a,b],i)=>{ const t0=nineT(i); if(t<t0||t>t0+0.62) return; ctx.save(); const k=expo(P(t,t0,t0+0.2)), ko=P(t,t0+0.5,t0+0.62);
    ctx.globalAlpha=k*(1-ko); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=`400 92px ${DISP}`; ctx.fillStyle='#f4ead8'; ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=16;
    ctx.fillText(`${a} 似 ${b}`,540,1205-(1-k)*20); ctx.restore(); });
  src(ctx,t,'宋 · 郭若虚《图画见闻志》：画龙「分成九似」',1315,T.drop+0.6,33.0);
  say(ctx,t,'九种动物，一条龙',540,300,84,33.2,35.9);
  say(ctx,t,'能细能巨',540,300,96,36.1,38.9); say(ctx,t,'能幽能明',540,300,96,39.1,41.8); src(ctx,t,'东汉 · 许慎《说文解字》',420,36.6,41.8);
  [['潜龙勿用',42.1],['见龙在田',43.6],['飞龙在天',45.1],['亢龙有悔',46.6]].forEach(([s,a])=>say(ctx,t,s,540,290,96,a,a+1.45,{tin:0.35,tout:0.2}));
  src(ctx,t,'《周易 · 乾》',400,42.4,48.0);
  say(ctx,t,'6000 年，样子改了无数次',540,330,64,48.4,51.2); say(ctx,t,'能屈能伸，一直没改',540,330,72,51.4,54.0);
  say(ctx,t,'你觉得龙——',540,1180,64,54.2,DUR); say(ctx,t,'是古人见过的，还是想出来的？',540,1275,52,54.9,DUR); }
function brand(ctx,t){ ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,86,210,16,GOLD,0.9); glow(ctx,86,210,3,WHITE,1); ctx.restore();
  ctx.save(); ctx.font=`700 30px ${SANS}`; ctx.textBaseline='middle'; ctx.fillStyle='rgba(255,214,150,0.85)'; ctx.fillText('思想可见',110,211); ctx.restore(); }
window.__ep={render,DUR};
