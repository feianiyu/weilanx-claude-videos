// 蚂蚁群体的真实行为模拟（确定性，页面加载时预算好每一帧，render 只查表 → 画面仍是时间的纯函数）
// 依据的行为：
//  · 走走停停（间歇性运动）：一段行走后有概率短暂停顿
//  · 相关随机游走：朝向带惯性的随机摆动，转向有最大角速度
//  · 沿信息素路径觅食：出巢→食物→带着食物回巢→在巢里歇一会→再出巢；离路径越远，拉回的力越大
//  · 迎面相遇会停下碰触角（antennation），近距离互相避让
//  · 闲着的工蚁：大部分时间不动，偶尔挪几步，原地理触角
//  · 腿的摆动按走过的距离推进（不走就不动腿）
const SIM_FPS=30;
function makePath(P,n=500){ const pts=[]; let L=0,prev=null;
  for(let i=0;i<=n;i++){ const p=bez(P,i/n); if(prev) L+=Math.hypot(p[0]-prev[0],p[1]-prev[1]); pts.push([p[0],p[1],L]); prev=p; }
  for(const p of pts) p[3]=p[2]/L; // u：0=食物，1=窝
  const tan=pts.map((p,i)=>{ const a=pts[Math.max(0,i-1)], b=pts[Math.min(n,i+1)]; const d=Math.hypot(b[0]-a[0],b[1]-a[1]); return [(b[0]-a[0])/d,(b[1]-a[1])/d]; });
  return {pts,tan,n,L};}
function nearest(path,x,y,hint){ let best=hint, bd=1e18; const lo=Math.max(0,hint-14), hi=Math.min(path.n,hint+14);
  for(let i=lo;i<=hi;i++){ const p=path.pts[i], d=(p[0]-x)**2+(p[1]-y)**2; if(d<bd){bd=d;best=i;} }
  if(best===lo&&lo>0||best===hi&&hi<path.n){ for(let i=0;i<=path.n;i+=4){ const p=path.pts[i], d=(p[0]-x)**2+(p[1]-y)**2; if(d<bd){bd=d;best=i;} } }
  return best;}
// cfg: {seed,P,scale,nFor,nIdle,t0,t1,rec0, nestR, idleSX, idleSY, events:{take:[t,count], refill:[t0,t1,count], clear:t, fatigue:[t0,t1], replace:bool}}
function simulate(cfg){
  const r=rng(cfg.seed), S=cfg.scale, path=makePath(cfg.P), nest=cfg.P[3], food=cfg.P[0];
  const N=cfg.nFor+cfg.nIdle, dt=1/SIM_FPS;
  const A=[];
  for(let i=0;i<N;i++){ const isF=i<cfg.nFor; const a={id:i,forager:isF,x:0,y:0,ang:r()*6.28,v:0,vmax:(95+r()*55)*S,turn:0,leg:r()*6.28,ant:r()*6.28,
      mode:isF?'out':'idle',timer:r()*2,walkT:0.5+r()*1.5,paused:0,hint:0,lane:gauss(r)*0.55,carry:0,kind:isF?1:0,rem:-1,remT:1e9,actT:1e9,tiredT:1e9,
      hx:0,hy:0,u:1};
    if(isF){ const k=Math.floor(r()*path.n); const p=path.pts[k]; a.x=p[0]+gauss(r)*8*S; a.y=p[1]+gauss(r)*8*S; a.hint=k; a.mode=r()<0.5?'out':'back'; a.carry=a.mode==='back'?1:0; }
    else { a.hx=nest[0]+gauss(r)*cfg.idleSX*S; a.hy=nest[1]+gauss(r)*cfg.idleSY*S+18*S; a.x=a.hx; a.y=a.hy; a.hint=path.n; a.timer=r()*20; }
    A.push(a); }
  const E=cfg.events||{};
  const nRec=Math.round((cfg.t1-cfg.rec0)*SIM_FPS)+1, STR=9, out=new Float32Array(nRec*N*STR);
  const cell=14*S, grid=new Map(); const key=(x,y)=>((Math.floor(x/cell)+1000)*4096+(Math.floor(y/cell)+1000));
  let removedPicked=false, refillPicked=false, clearPicked=false, fatiguePicked=false;
  const corridor=u=>(8+44*Math.pow(u,1.6))*S;
  const steps=Math.round((cfg.t1-cfg.t0)*SIM_FPS);
  for(let s=0;s<=steps;s++){ const t=cfg.t0+s*dt;
    // ── 实验事件 ──
    if(E.take&&!removedPicked&&t>=E.take[0]){ removedPicked=true; const cand=A.filter(a=>a.forager&&a.rem<0&&a.mode!=='nest'&&a.u>0.05&&a.u<0.93);
      for(let k=cand.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[cand[k],cand[j]]=[cand[j],cand[k]];}
      cand.slice(0,E.take[1]).forEach(a=>{a.remT=t+r()*0.35;}); }
    if(E.refill&&!refillPicked&&t>=E.refill[0]){ refillPicked=true; const idle=A.filter(a=>!a.forager&&a.rem<0).sort((p,q)=>Math.hypot(p.x-nest[0],p.y-nest[1])-Math.hypot(q.x-nest[0],q.y-nest[1]));
      idle.slice(0,E.refill[2]).forEach((a,k)=>{a.actT=E.refill[0]+(E.refill[1]-E.refill[0])*k/E.refill[2]+r()*0.1;}); }
    if(E.clear&&!clearPicked&&t>=E.clear){ clearPicked=true; A.filter(a=>!a.forager&&a.actT>1e8).forEach(a=>{a.remT=t+r()*0.5;}); }
    if(E.fatigue&&!fatiguePicked&&t>=E.fatigue[0]-0.01){ fatiguePicked=true; const fs=A.filter(a=>a.forager);
      fs.forEach(a=>{a.tiredT=E.fatigue[0]+r()*(E.fatigue[1]-E.fatigue[0]);});
      if(E.replace){ const idle=A.filter(a=>!a.forager); const order=fs.slice().sort((p,q)=>p.tiredT-q.tiredT); idle.forEach((a,k)=>{ if(k<order.length) a.actT=order[k].tiredT+0.3+r()*0.4; }); } }
    // ── 网格 ──
    grid.clear(); for(const a of A){ if(a.rem>=0) continue; const k=key(a.x,a.y); let c=grid.get(k); if(!c){c=[];grid.set(k,c);} c.push(a); }
    for(const a of A){
      if(a.rem>=0){ a.rem=Math.min(1,a.rem+dt/0.9); continue; }
      if(t>=a.remT){ a.rem=0; continue; }
      if(!a.forager&&t>=a.actT){ a.forager=true; a.mode='nestexit'; a.timer=0.2+r()*0.6; a.vmax=(90+r()*50)*S; }
      a.kind=a.forager?Math.min(1,a.kind+dt/1.0):a.kind;
      if(a.mode==='tired'){ a.v*=0.85; a.kind=Math.max(0.22,a.kind-dt/1.6); a.ant+=dt*1.5; continue; }
      if(a.forager&&t>=a.tiredT){ a.mode='tired'; continue; }
      let want=a.ang, speed=0;
      // 走走停停
      if(a.paused>0){ a.paused-=dt; speed=0; }
      else { a.walkT-=dt; if(a.walkT<=0){ a.walkT=0.6+r()*2.2; if(r()<0.3) a.paused=0.12+r()*0.5; } speed=a.vmax*(0.85+0.15*Math.sin(t*3+a.id)); }
      if(!a.forager){ // 闲着的：大部分时间不动
        a.timer-=dt; speed=0;
        if(a.timer<0&&a.timer>-(0.6+(a.id%5)*0.3)){ speed=28*S; }
        else if(a.timer<=-(0.6+(a.id%5)*0.3)){ a.timer=6+r()*22; a.ang+=gauss(r)*1.2; }
        const dx=a.hx-a.x, dy=a.hy-a.y; if(Math.hypot(dx,dy)>40*S) want=Math.atan2(dy,dx);
        a.ant+=dt*(1.2+Math.sin(t*0.7+a.id)*0.8);
      } else if(a.mode==='nest'||a.mode==='nestexit'){
        a.timer-=dt; const dx=nest[0]-a.x, dy=nest[1]-a.y, d=Math.hypot(dx,dy);
        if(a.mode==='nest'){ speed=d>14*S?speed*0.6:0; want=Math.atan2(dy,dx)+gauss(r)*0.3; if(a.timer<=0){ a.mode='nestexit'; a.timer=0.3; } }
        else { a.mode='out'; a.carry=0; a.hint=path.n; }
      } else {
        a.hint=nearest(path,a.x,a.y,a.hint); const p=path.pts[a.hint], tg=path.tan[a.hint]; a.u=p[3];
        if(a.mode==='out'&&a.hint<=3){ a.mode='feed'; a.timer=0.4+r()*0.9; }
        if(a.mode==='back'&&a.hint>=path.n-3){ a.mode='nest'; a.timer=1+r()*4; a.carry=a.carry; }
        if(a.mode==='feed'){ a.timer-=dt; speed=0; want=a.ang+gauss(r)*0.2; if(a.timer<=0){ a.mode='back'; a.carry=1; a.ang+=Math.PI*(0.8+r()*0.4); } }
        else { const dir=a.mode==='out'?-1:1; const w=corridor(p[3]), nx=-tg[1], ny=tg[0];
          const lat=(a.x-p[0])*nx+(a.y-p[1])*ny, target=a.lane*w, e=(target-lat)/w;
          const vx=tg[0]*dir+nx*clamp(e,-1.5,1.5)*0.9, vy=tg[1]*dir+ny*clamp(e,-1.5,1.5)*0.9;
          want=Math.atan2(vy,vx); if(a.carry) speed*=0.8; }
      }
      // 相关随机游走 + 有限转向
      a.turn=a.turn*0.94+gauss(r)*0.22; want+=a.turn*0.35;
      let d=((want-a.ang+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI; const maxT=3.2*dt; a.ang+=clamp(d,-maxT,maxT);
      // 相遇：迎面碰触角 / 避让
      const gx=Math.floor(a.x/cell), gy=Math.floor(a.y/cell);
      for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){ const c=grid.get((gx+ix+1000)*4096+(gy+iy+1000)); if(!c) continue;
        for(const b of c){ if(b===a) continue; const dx=b.x-a.x, dy=b.y-a.y, dd=Math.hypot(dx,dy); if(dd<1e-3) continue;
          const minD=(a.forager&&b.forager?12:8)*S; if(dd<minD){ const push=(minD-dd)*0.3; a.x-=dx/dd*push; a.y-=dy/dd*push; }
          if(a.forager&&b.forager&&dd<12*S&&a.paused<=0&&speed>0){ const ca=Math.cos(a.ang)*Math.cos(b.ang)+Math.sin(a.ang)*Math.sin(b.ang);
            const ahead=(dx*Math.cos(a.ang)+dy*Math.sin(a.ang))/dd; if(ca<-0.4&&ahead>0.5&&r()<0.12){ a.paused=0.18+r()*0.35; a.ant+=1.5; } } } }
      a.v+= (speed-a.v)*Math.min(1,dt*12);
      const step=a.v*dt; a.x+=Math.cos(a.ang)*step; a.y+=Math.sin(a.ang)*step;
      a.leg+=step/(7*S)*Math.PI; a.ant+=dt*(a.v>5?6:1);
    }
    // ── 记录 ──
    if(t>=cfg.rec0-1e-6){ const fi=Math.round((t-cfg.rec0)*SIM_FPS); if(fi>=0&&fi<nRec){ let o=fi*N*STR;
      for(const a of A){ out[o]=a.x; out[o+1]=a.y; out[o+2]=a.ang; out[o+3]=a.leg; out[o+4]=a.mode==='tired'?-Math.max(0.001,(a.kind-0.22)/0.78):(a.forager?a.kind:Math.min(a.kind,0)); out[o+5]=a.rem; out[o+6]=a.carry; out[o+7]=a.forager?a.u:-1; out[o+8]=a.ant; o+=STR; } } }
  }
  return {out,N,nRec,rec0:cfg.rec0,STR,ant:A.map(a=>a.ant),nest,P:cfg.P,scale:S};}
function simFrame(sim,t){ const fi=clamp(Math.round((t-sim.rec0)*SIM_FPS),0,sim.nRec-1); return fi*sim.N*sim.STR; }
