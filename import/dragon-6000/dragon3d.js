// ───────── 三维中国龙（Canvas 2D 上做三维投影 + 画家算法排序）─────────
// 龙身是一根沿三维脊线扫出的管子：每一圈截面切成若干块，每块按法线打光、背面剔除，块上画鱼鳞；腹面画横向腹甲；
// 背上一簇簇火焰毛，肘后火焰毛，四爪（三前一后）带弯钩；头由上颌管 + 可张开的下颌管组成，配獠牙、卷舌、眼、眉、鹿角、耳、鬃、长须、须髯；尾端一大束飘发。
// 所有图元先收集成 {z, 画法}，按远到近排序再画，盘绕时近处身段自然压住远处。
const V3={add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];},
  lin:(...ps)=>{ let r=[0,0,0]; for(let i=0;i<ps.length;i+=2){ r[0]+=ps[i][0]*ps[i+1]; r[1]+=ps[i][1]*ps[i+1]; r[2]+=ps[i][2]*ps[i+1]; } return r; }};
const {add:va,sub:vs,mul:vm,dot:vd,cross:vc,norm:vn,lin:vl}=V3;
// 相机：yaw 绕竖轴，pitch 绕横轴，D 为距离；世界坐标 y 朝下（与屏幕一致）
function makeCam(o){ const c={yaw:0,pitch:0,D:1700,f:1600,cx:540,cy:860,tgt:[0,0,0],...o}; c.cy1=Math.cos(c.yaw); c.sy1=Math.sin(c.yaw); c.cp=Math.cos(c.pitch); c.sp=Math.sin(c.pitch); return c; }
function toView(c,p){ const x=p[0]-c.tgt[0], y=p[1]-c.tgt[1], z=p[2]-c.tgt[2]; const x1=x*c.cy1-z*c.sy1, z1=x*c.sy1+z*c.cy1; const y2=y*c.cp-z1*c.sp, z2=y*c.sp+z1*c.cp; return [x1,y2,z2+c.D]; }
function dirView(c,n){ const x1=n[0]*c.cy1-n[2]*c.sy1, z1=n[0]*c.sy1+n[2]*c.cy1; return [x1,n[1]*c.cp-z1*c.sp,n[1]*c.sp+z1*c.cp]; }
function proj(c,p){ const v=toView(c,p); const z=Math.max(30,v[2]), s=c.f/z; return [c.cx+v[0]*s,c.cy+v[1]*s,v[2],s]; }
const LIGHT=vn([-0.45,-0.75,-0.55]);
// 脊线 → 平行移动标架（不扭）
function frames3(S){ const n=S.length, Tn=[], N=[], B=[];
  for(let i=0;i<n;i++){ Tn.push(vn(vs(S[Math.min(n-1,i+1)],S[Math.max(0,i-1)]))); }
  let up=[0,-1,0]; if(Math.abs(vd(up,Tn[0]))>0.9) up=[0,0,-1]; N[0]=vn(vs(up,vm(Tn[0],vd(up,Tn[0]))));
  for(let i=1;i<n;i++){ const p=N[i-1]; N[i]=vn(vs(p,vm(Tn[i],vd(p,Tn[i])))); }
  for(let i=0;i<n;i++) B[i]=vc(Tn[i],N[i]);
  return {T:Tn,N,B}; }
function catmull3(K,s){ const n=K.length; let i=Math.floor(clamp(s,0,n-1.0001)); const f=clamp(s-i,0,1); const p0=K[Math.max(0,i-1)],p1=K[i],p2=K[Math.min(n-1,i+1)],p3=K[Math.min(n-1,i+2)];
  return [0,1,2].map(d=>0.5*((2*p1[d])+(-p0[d]+p2[d])*f+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*f*f+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*f*f*f)); }
function catmullT(K,τ){ let i=0; while(i<K.length-2&&τ>=K[i+1][0]) i++; const s=i+clamp((τ-K[i][0])/(K[i+1][0]-K[i][0]),0,1); return catmull3(K.map(k=>[k[1],k[2],k[3]]),s); }
const NS3=170;
function resample(pts,n=NS3){ // 按弧长均匀重采样
  const L=[0]; for(let i=1;i<pts.length;i++) L.push(L[i-1]+Math.hypot(...vs(pts[i],pts[i-1]))); const tot=L[L.length-1], out=[]; let j=0;
  for(let k=0;k<n;k++){ const d=k/(n-1)*tot; while(j<L.length-2&&L[j+1]<d) j++; const f=(d-L[j])/((L[j+1]-L[j])||1); out.push([lerp(pts[j][0],pts[j+1][0],f),lerp(pts[j][1],pts[j+1][1],f),lerp(pts[j][2],pts[j+1][2],f)]); } return out; }
// 姿态：升龙（参考传统立轴龙：头在右上回首张口，身体 S 形盘下，尾在下方散开）
const HERO=[[170,-560,-40],[30,-590,20],[-110,-520,80],[-170,-360,90],[-90,-190,40],[70,-100,-50],[190,20,-90],[190,190,-40],[60,300,60],[-120,340,90],[-200,480,30],[-110,640,-40],[60,720,-60],[150,850,-20]];
function poseHero(t){ const K=HERO.map((p,i)=>[p[0]+Math.sin(t*1.1+i*0.8)*8*(i/12),p[1]+Math.sin(t*1.5)*6*(1-i/12),p[2]+Math.sin(t*0.9+i)*10*(i/12)]); const raw=[]; for(let k=0;k<=240;k++) raw.push(catmull3(K,k/240*(K.length-1))); return resample(raw); }
function poseFollow(t,PATH3,lag){ const raw=[]; for(let k=0;k<=240;k++) raw.push(catmullT(PATH3,t-k/240*lag)); return resample(raw); }
function poseRing(t){ const raw=[]; for(let k=0;k<=240;k++){ const u=k/240, th=(-112+u*322)*Math.PI/180, r=300*(1-0.15*u); raw.push([Math.cos(th)*r+Math.sin(t+u*7)*4, Math.sin(th)*r, Math.sin(u*TAU*1.5+t*0.6)*40]); } return resample(raw); }
const mix3=(A,B,k)=>A.map((p,i)=>[lerp(p[0],B[i][0],k),lerp(p[1],B[i][1],k),lerp(p[2],B[i][2],k)]);
const PROF3=[[0,0.66],[0.06,0.8],[0.16,1.0],[0.35,0.98],[0.6,0.82],[0.8,0.56],[0.92,0.34],[1,0.12]];
function prof3(u){ let i=0; while(i<PROF3.length-2&&u>PROF3[i+1][0]) i++; const a=PROF3[i],b=PROF3[i+1]; return lerp(a[1],b[1],sm(clamp((u-a[0])/(b[0]-a[0]),0,1))); }

function drawDragon3D(ctx,t,S,cam,opt={}){ const R=opt.R||44, A=opt.a??1, part=opt.part||(()=>NONE), lit=opt.lit??2, jaw=opt.jaw??(0.38+0.06*Math.sin(t*1.8)), drawK=opt.draw??1;
  if(A<=0.01) return null; const n=S.length, Fr=frames3(S), NJ=18, items=[];
  const push=(z,name,fn)=>items.push([z,name,fn]);
  const P2=p=>proj(cam,p);
  const shade=nrm=>{ const nv=dirView(cam,nrm); return {b:Math.max(0,vd(nv,LIGHT)), nv}; };
  const facing=(p,nrm)=>{ const v=toView(cam,p), nv=dirView(cam,nrm); return vd(v,nv)<0; };
  const LC=opt.col||GOLD, GOLDc=(a)=>rgba(LC,a), WARMc=a=>rgba(WARM,a);
  const fillCol=(b,rim,tint=0)=>{ const k=b*0.75+rim*0.3+tint; return `rgb(${(9+70*k)|0},${(11+52*k)|0},${(20+26*k)|0})`; };
  // ── 身体网格 ──
  const iEnd=Math.max(2,Math.round((n-1)*drawK)); const ring=[];
  for(let i=0;i<=iEnd;i++){ const u=i/(n-1), r=R*prof3(u), off=(i%2)*0.5; const row=[];
    for(let j=0;j<=NJ;j++){ const th=(j+off)/NJ*TAU, nrm=vl(Fr.N[i],Math.cos(th),Fr.B[i],Math.sin(th)); const p=va(S[i],vl(Fr.N[i],Math.cos(th)*r,Fr.B[i],Math.sin(th)*r*0.92)); row.push({p,nrm,th,q:P2(p)}); } ring.push(row); }
  for(let i=0;i<iEnd;i++){ const u=i/(n-1), pname=u<0.1?'neck':'body';
    const vis=[]; for(let j=0;j<NJ;j++){ const a=ring[i][j], c=ring[i+1][j+1]; const mid=vm(va(a.p,c.p),0.5), nr=vn(va(a.nrm,ring[i+1][j].nrm)); vis.push(facing(mid,nr)); }
    for(let j=0;j<NJ;j++){ if(!vis[j]) continue; const a=ring[i][j], b=ring[i][j+1], c=ring[i+1][j+1], d=ring[i+1][j];
      const nr=vn(va(a.nrm,d.nrm)); const {b:lb,nv}=shade(nr); const rim=Math.pow(1-Math.abs(nv[2]),3); const z=(a.q[2]+b.q[2]+c.q[2]+d.q[2])/4, fade=clamp(1.25-(z-cam.D)/1400,0.45,1);
      const thm=((a.th+b.th)/2)%TAU, belly=Math.abs(thm-Math.PI)<0.78, silL=!vis[(j+NJ-1)%NJ], silR=!vis[(j+1)%NJ];
      push(z,pname,()=>{ ctx.beginPath(); ctx.moveTo(a.q[0],a.q[1]); ctx.lineTo(b.q[0],b.q[1]); ctx.lineTo(c.q[0],c.q[1]); ctx.lineTo(d.q[0],d.q[1]); ctx.closePath(); const fc=fillCol(lb,rim,belly?0.22:0); ctx.fillStyle=fc; ctx.fill(); ctx.strokeStyle=fc; ctx.lineWidth=1.2; ctx.stroke();
        if(silL){ ctx.strokeStyle=GOLDc(0.95*fade); ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(a.q[0],a.q[1]); ctx.lineTo(d.q[0],d.q[1]); ctx.stroke(); }
        if(silR){ ctx.strokeStyle=GOLDc(0.95*fade); ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(b.q[0],b.q[1]); ctx.lineTo(c.q[0],c.q[1]); ctx.stroke(); } });
      if(belly) push(z-0.1,u<0.1?'neck':'belly',()=>{ ctx.strokeStyle=GOLDc((0.35+0.55*lb)*fade); ctx.lineWidth=1.3; const mx=(d.q[0]+c.q[0])/2-(a.q[0]+b.q[0])/2, my=(d.q[1]+c.q[1])/2-(a.q[1]+b.q[1])/2;
        ctx.beginPath(); ctx.moveTo(a.q[0],a.q[1]); ctx.quadraticCurveTo((a.q[0]+b.q[0])/2+mx*0.35,(a.q[1]+b.q[1])/2+my*0.35,b.q[0],b.q[1]); ctx.stroke(); });
      else if(u>0.04&&u<0.97) push(z-0.1,'scales',()=>{ const on=u<lit, fl=Math.exp(-Math.pow((lit-u)*16,2)); const mx=(d.q[0]+c.q[0])/2-(a.q[0]+b.q[0])/2, my=(d.q[1]+c.q[1])/2-(a.q[1]+b.q[1])/2;
        ctx.strokeStyle=on?WARMc((0.3+0.65*lb+0.3*fl)*fade):GOLDc((0.25+0.6*lb+0.5*fl)*fade); ctx.lineWidth=1.1+fl*1.2; ctx.beginPath(); ctx.moveTo(a.q[0],a.q[1]); ctx.quadraticCurveTo((a.q[0]+b.q[0])/2+mx*1.35,(a.q[1]+b.q[1])/2+my*1.35,b.q[0],b.q[1]); ctx.stroke();
        if(fl>0.4) glow(ctx,(a.q[0]+c.q[0])/2,(a.q[1]+c.q[1])/2,14*a.q[3],WARM,0.4*fl); }); } }
  // ── 3D 曲线工具：投影后按段画；粗细随透视 ──
  const strand=(pts,name,w,col,al,taper=true)=>{ const Q=pts.map(P2); const z=Q.reduce((s,q)=>s+q[2],0)/Q.length; push(z-0.5,name,()=>{ ctx.lineCap='round'; ctx.strokeStyle=col(al);
      if(!taper){ ctx.lineWidth=w*Q[0][3]; ctx.beginPath(); Q.forEach((q,k)=>k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke(); return; }
      for(let k=1;k<Q.length;k++){ ctx.lineWidth=Math.max(0.6,w*Q[k][3]*(1-k/Q.length*0.85)); ctx.beginPath(); ctx.moveTo(Q[k-1][0],Q[k-1][1]); ctx.lineTo(Q[k][0],Q[k][1]); ctx.stroke(); } }); };
  // 火焰毛（一缕）：根部宽、尾部尖的带子，金边 + 中线
  const lock=(pts,name,w,al=0.85,fill='rgba(30,24,16,0.85)',taperRoot=true)=>{ const Q=pts.map(P2); const z=Q[0][2]; push(z-0.4,name,()=>{ const m=Q.length, Lf=[], Rt=[];
      for(let k=0;k<m;k++){ const a=Q[Math.max(0,k-1)], b=Q[Math.min(m-1,k+1)]; let dx=b[0]-a[0], dy=b[1]-a[1]; const l=Math.hypot(dx,dy)||1; dx/=l; dy/=l; const q=k/(m-1), ww=w*Q[k][3]*Math.pow(1-q,0.9)*(taperRoot?(0.55+0.45*Math.sin(Math.min(1,q*3+0.2)*Math.PI/2)):1);
        Lf.push([Q[k][0]-dy*ww,Q[k][1]+dx*ww]); Rt.push([Q[k][0]+dy*ww,Q[k][1]-dx*ww]); }
      ctx.beginPath(); Lf.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); for(let k=m-1;k>=0;k--) ctx.lineTo(Rt[k][0],Rt[k][1]); ctx.closePath();
      ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=GOLDc(al); ctx.lineWidth=1.5; ctx.lineJoin='round'; ctx.stroke();
      ctx.strokeStyle=GOLDc(al*0.5); ctx.lineWidth=1; ctx.beginPath(); for(let k=1;k<m-1;k++) k>1?ctx.lineTo(Q[k][0],Q[k][1]):ctx.moveTo(Q[k][0],Q[k][1]); ctx.stroke(); }); };
  const tube=(pts,name,w,al=1)=>{ const Q=pts.map(P2); const z=Q.reduce((s,q)=>s+q[2],0)/Q.length; push(z-0.3,name,()=>{ ctx.lineCap='round'; ctx.lineJoin='round';
      for(const pass of [0,1]){ for(let k=1;k<Q.length;k++){ const ww=w*Q[k][3]*(1-0.6*k/Q.length); ctx.lineWidth=pass?Math.max(0.5,ww-3.2):ww; ctx.strokeStyle=pass?'rgb(12,14,24)':GOLDc(0.95*al); ctx.beginPath(); ctx.moveTo(Q[k-1][0],Q[k-1][1]); ctx.lineTo(Q[k][0],Q[k][1]); ctx.stroke(); } } }); };
  // ── 背上火焰毛：每隔几圈一簇，向尾部扫 ──
  for(let i=6;i<iEnd-6;i+=5){ const u=i/(n-1); if(u>0.9) break; const r=R*prof3(u), T=Fr.T[i], N=Fr.N[i], B=Fr.B[i];
    for(let k=0;k<3;k++){ const side=(k-1)*0.3, root=va(S[i],vl(N,r*0.95,B,side*r)), L=R*(1.15+0.45*Math.sin(i*0.7+k))*(0.6+0.4*prof3(u)), ph=t*2.2+i*0.25+k;
      const pts=[]; for(let s=0;s<=6;s++){ const q=s/6; pts.push(va(root,vl(N,L*(Math.sin(q*1.6)*0.95-q*q*0.25),T,L*(q*1.2+q*q*0.5),B,side*L*q*0.6+Math.sin(ph+q*4)*R*0.18*q))); }
      lock(pts,'body',0.26*R,0.85); } }
  // ── 尾端：一大束飘发 ──
  if(drawK>=1){ const i0=Math.round((n-1)*0.88); for(let k=0;k<18;k++){ const i=Math.min(n-1,i0+Math.round(k/18*((n-1)-i0))), T=Fr.T[i], N=Fr.N[i], B=Fr.B[i], an=k*2.4, L=R*(3.2+1.6*Math.sin(k*1.7)), ph=t*2.0+k*0.5;
    const root=S[i], pts=[]; for(let s=0;s<=8;s++){ const q=s/8; pts.push(va(root,vl(T,L*q,N,(Math.cos(an)*0.9*q+Math.sin(ph+q*4)*0.25*q)*L*0.45,B,(Math.sin(an)*0.9*q)*L*0.45))); }
    lock(pts,'body',0.34*R,0.85); } }
  // ── 四条腿 ──
  const legs=[[0.2,1,1],[0.2,-1,1],[0.6,1,0],[0.6,-1,0]];
  for(const [u,side,front] of legs){ const i=Math.round(u*(n-1)); if(i>iEnd) continue; const T=Fr.T[i], N=Fr.N[i], B=Fr.B[i], r=R*prof3(u), Sv=vm(B,side), down=vm(N,-1);
    const ph=t*2.2+side+u*5, sw=Math.sin(ph)*0.18;
    const S0=va(S[i],vl(Sv,r*0.72,down,r*0.45));
    const d1=front?vn(vl(T,-0.45+sw,Sv,0.8,down,0.45)):vn(vl(T,0.55+sw,Sv,0.75,down,0.4));
    const E=va(S0,vm(d1,R*1.7));
    const d2=front?vn(vl(T,-0.9,Sv,0.25,N,0.15+sw)):vn(vl(down,0.65,T,-0.35+sw,Sv,0.35));
    const Wp=va(E,vm(d2,R*1.4));
    // 腿身：一段段的「管」，带鳞纹
    const seg=(p0,p1,r0,r1)=>{ const ax=vn(vs(p1,p0)); let up=vn(vc(ax,Math.abs(ax[1])<0.9?[0,1,0]:[1,0,0])); const sd=vc(ax,up); const M=8, K=5, pts=[];
      for(let a=0;a<=K;a++){ const row=[]; for(let b=0;b<=M;b++){ const th=b/M*TAU, rr=lerp(r0,r1,a/K)*(1+0.12*Math.sin(Math.PI*a/K)); const nrm=vl(up,Math.cos(th),sd,Math.sin(th)); const p=va(va(p0,vm(vs(p1,p0),a/K)),vm(nrm,rr)); row.push({p,nrm,q:P2(p)}); } pts.push(row); }
      for(let a=0;a<K;a++){ const vis=[]; for(let b=0;b<M;b++){ const A1=pts[a][b],C1=pts[a+1][b+1]; vis.push(facing(vm(va(A1.p,C1.p),0.5),vn(va(A1.nrm,C1.nrm)))); }
        for(let b=0;b<M;b++){ if(!vis[b]) continue; const A1=pts[a][b],B1=pts[a][b+1],C1=pts[a+1][b+1],D1=pts[a+1][b]; const nr=vn(va(A1.nrm,C1.nrm));
        const {b:lb,nv}=shade(nr), rim=Math.pow(1-Math.abs(nv[2]),3), z=(A1.q[2]+C1.q[2])/2, prevV=vis[(b+M-1)%M], nextV=vis[(b+1)%M];
        push(z,'palm',()=>{ ctx.beginPath(); ctx.moveTo(A1.q[0],A1.q[1]); ctx.lineTo(B1.q[0],B1.q[1]); ctx.lineTo(C1.q[0],C1.q[1]); ctx.lineTo(D1.q[0],D1.q[1]); ctx.closePath(); const fc=fillCol(lb,rim); ctx.fillStyle=fc; ctx.fill(); ctx.strokeStyle=fc; ctx.lineWidth=1; ctx.stroke();
          ctx.strokeStyle=GOLDc(0.25+0.55*lb); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(A1.q[0],A1.q[1]); ctx.quadraticCurveTo((A1.q[0]+B1.q[0])/2+((D1.q[0]+C1.q[0])-(A1.q[0]+B1.q[0]))*0.6,(A1.q[1]+B1.q[1])/2+((D1.q[1]+C1.q[1])-(A1.q[1]+B1.q[1]))*0.6,B1.q[0],B1.q[1]); ctx.stroke();
          ctx.strokeStyle=GOLDc(0.95); ctx.lineWidth=2.2; if(!prevV){ ctx.beginPath(); ctx.moveTo(A1.q[0],A1.q[1]); ctx.lineTo(D1.q[0],D1.q[1]); ctx.stroke(); } if(!nextV){ ctx.beginPath(); ctx.moveTo(B1.q[0],B1.q[1]); ctx.lineTo(C1.q[0],C1.q[1]); ctx.stroke(); } }); } } };
    seg(S0,E,R*0.62,R*0.46); seg(E,Wp,R*0.44,R*0.32);
    // 肘后火焰毛
    for(let k=0;k<4;k++){ const L=R*(1.4+0.45*k), ph2=t*2.6+k+u*9, pts=[]; for(let s=0;s<=6;s++){ const q=s/6; pts.push(va(E,vl(T,L*q*(front?1:0.8),Sv,L*(0.15-k*0.06)*q,down,L*(0.25*q-0.15*q*q)+Math.sin(ph2+q*3)*R*0.15*q))); } lock(pts,'palm',0.3*R,0.85); }
    // 爪：三前一后，每趾两节，末端弯钩
    const fd=vn(vl(d2,1,down,0.25)), grip=0.5+0.5*Math.sin(ph*0.8);
    for(let k=0;k<4;k++){ const back=k===3; const dir=back?vn(vl(fd,-0.7,down,0.6,Sv,0.1)):vn(vl(fd,1,Sv,(k-1)*0.55)); const p1=va(Wp,vm(dir,R*0.75)), dir2=vn(vl(dir,1,down,0.5+0.4*grip)), p2=va(p1,vm(dir2,R*0.55));
      lock([Wp,vm(va(Wp,p1),0.5),p1,vm(va(p1,p2),0.5),p2],'claw',0.16*R,1,'rgba(70,56,36,0.95)',false);
      const tdir=vn(vl(dir2,0.5,down,1)), tip=va(p2,vm(tdir,R*0.6)), mid=va(p2,vl(dir2,R*0.42,down,R*0.1)); { const tip2=va(p2,vl(dir2,R*0.35,down,R*0.75)), c2=va(p2,vl(dir2,R*0.7,down,R*0.05)), tp=[]; for(let k2=0;k2<=7;k2++){ const q=k2/7; tp.push(vl(p2,(1-q)*(1-q),c2,2*q*(1-q),tip2,q*q)); } lock(tp,'claw',0.15*R,1,'rgba(225,205,165,0.95)',false); } } }
  // ── 头：局部坐标 x 朝前、y 朝上、z 朝侧（单位 R）──
  const F=vm(Fr.T[0],-1), U0=Fr.N[0]; const tl=opt.tilt??0.25; const Fh=vn(vl(F,Math.cos(tl),U0,Math.sin(tl))), U=vn(vl(U0,Math.cos(tl),F,-Math.sin(tl))), Sd=vc(Fh,U);
  const H0=va(S[0],vm(Fh,-R*0.15));
  const L3=(x,y,z)=>va(H0,vl(Fh,x*R,U,y*R,Sd,z*R));
  if(opt.head2d){ const q0=P2(H0), q1=P2(L3(1,0,0)); const ang=Math.atan2(q1[1]-q0[1],q1[0]-q0[0]), hs=Math.hypot(q1[0]-q0[0],q1[1]-q0[1])/46;
    // 颈部的鬃毛和头一起画在最上层
    push(q0[2]-R*0.6,'head',()=>{}); const parts=['head','eye','horn','ear'];
    items.push([q0[2]-R*0.8,'__head',()=>drawHead2D(ctx,t,q0[0],q0[1],ang,hs,{jaw,col:opt.col,part:n=>{ const p=part(n); return p; }})]); }
  else {
  // 上颌 / 头骨：一根粗细变化的管
  const SK0=[[-0.3,0,0.95,0.95],[0.3,0.15,1.15,1.05],[0.9,0.3,1.2,1.0],[1.5,0.25,1.05,0.92],[2.0,0.1,0.85,0.78],[2.6,-0.02,0.66,0.62],[3.2,-0.05,0.58,0.55],[3.7,0.02,0.6,0.56],[4.05,0.12,0.68,0.62],[4.35,0.1,0.52,0.5],[4.55,0.06,0.15,0.15]];
  const SK=[]; for(let k=0;k<=40;k++) SK.push(catmull3(SK0.map(r=>[r[0],r[1],r[2]]),k/40*(SK0.length-1)).concat([catmull3(SK0.map(r=>[r[3],0,0]),k/40*(SK0.length-1))[0]]));
  const headTube=(prof,xf,name)=>{ const M=40, rows=[]; prof.forEach(([x,y,ry,rz])=>{ const row=[]; for(let b=0;b<=M;b++){ const th=b/M*TAU; const lp=xf(x,y+Math.cos(th)*ry,Math.sin(th)*rz); const c0=xf(x,y,0); const nrm=vn(vs(lp,c0)); row.push({p:lp,nrm,q:P2(lp)}); } rows.push(row); });
    for(let a=0;a<rows.length-1;a++){ const vis=[]; for(let b=0;b<M;b++){ const A1=rows[a][b],C1=rows[a+1][b+1]; vis.push(facing(vm(va(A1.p,C1.p),0.5),vn(va(A1.nrm,C1.nrm)))); }
      for(let b=0;b<M;b++){ if(!vis[b]) continue; const A1=rows[a][b],B1=rows[a][b+1],C1=rows[a+1][b+1],D1=rows[a+1][b]; const {b:lb0,nv}=shade(vn(va(A1.nrm,C1.nrm))), lb=0.25+lb0*0.6, rim=Math.pow(1-Math.abs(nv[2]),3), z=(A1.q[2]+C1.q[2])/2;
        const sL=!vis[(b+M-1)%M], sR=!vis[(b+1)%M];
        push(z,name,()=>{ ctx.beginPath(); ctx.moveTo(A1.q[0],A1.q[1]); ctx.lineTo(B1.q[0],B1.q[1]); ctx.lineTo(C1.q[0],C1.q[1]); ctx.lineTo(D1.q[0],D1.q[1]); ctx.closePath(); const fc=fillCol(lb,rim); ctx.fillStyle=fc; ctx.fill(); ctx.strokeStyle=fc; ctx.lineWidth=1; ctx.stroke();
          if(b%3===0&&lb>0.05){ ctx.strokeStyle=GOLDc(0.15+0.45*lb); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(A1.q[0],A1.q[1]); ctx.lineTo(D1.q[0],D1.q[1]); ctx.stroke(); }
          ctx.strokeStyle=GOLDc(0.95); ctx.lineWidth=2.4; if(sL){ ctx.beginPath(); ctx.moveTo(A1.q[0],A1.q[1]); ctx.lineTo(D1.q[0],D1.q[1]); ctx.stroke(); } if(sR){ ctx.beginPath(); ctx.moveTo(B1.q[0],B1.q[1]); ctx.lineTo(C1.q[0],C1.q[1]); ctx.stroke(); } }); } } };
  headTube(SK,(x,y,z)=>L3(x,y,z),'head');
  // 下颌：绕铰点向下张开
  const hinge=[0.9,-0.5]; const JX=(x,y,z)=>{ const dx=x-hinge[0], dy=y-hinge[1]; const c=Math.cos(-jaw), s=Math.sin(-jaw); return L3(hinge[0]+dx*c-dy*s,hinge[1]+dx*s+dy*c,z); };
  { const J0=[[0.7,-0.55,0.42,0.75],[1.6,-0.6,0.36,0.62],[2.6,-0.62,0.3,0.5],[3.5,-0.58,0.28,0.42],[3.9,-0.52,0.25,0.36],[4.05,-0.5,0.08,0.1]]; const J=[]; for(let k=0;k<=20;k++){ const s3=k/20*(J0.length-1); J.push(catmull3(J0.map(r=>[r[0],r[1],r[2]]),s3).concat([catmull3(J0.map(r=>[r[3],0,0]),s3)[0]])); } headTube(J,JX,'head'); }
  // 眉骨：压在眼睛上方的粗棱
  for(const sz of [-1,1]) strand([L3(2.4,0.66,sz*0.52),L3(2.0,0.9,sz*0.66),L3(1.55,1.0,sz*0.74),L3(1.1,1.02,sz*0.76)],'eye',0.2*R,GOLDc,1);
  // 唇线
  for(const sz of [-1,1]) strand([1.2,2.0,2.8,3.6,4.2].map(x=>L3(x,-0.47,sz*lerp(0.95,0.5,(x-1.2)/3))),'head',0.05*R,GOLDc,0.8,false);
  // 口腔（暗红）、獠牙、牙、卷舌
  { const up=[1.2,2.0,2.8,3.6,4.1].map(x=>L3(x,-0.48,0)), lo=[4.0,3.6,2.8,2.0,1.2].map(x=>JX(x,-0.32,0)); const Q=[...up,...lo].map(P2); const z=Q.reduce((s,q)=>s+q[2],0)/Q.length;
    push(z+R*0.2,'head',()=>{ ctx.beginPath(); Q.forEach((q,k)=>k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.closePath(); ctx.fillStyle='rgb(64,12,10)'; ctx.fill(); });
    for(const sz of [-0.42,0.42]){ for(let k=0;k<8;k++){ const x=1.9+k*0.28, big=k===7; const a=L3(x,-0.45,sz), b=L3(x+0.1,-0.45-(big?0.75:0.28),sz*0.95), c=L3(x+0.2,-0.45,sz); const Q2=[a,b,c].map(P2);
        push(Q2[1][2]-1,'head',()=>{ ctx.beginPath(); ctx.moveTo(Q2[0][0],Q2[0][1]); ctx.lineTo(Q2[1][0],Q2[1][1]); ctx.lineTo(Q2[2][0],Q2[2][1]); ctx.closePath(); ctx.fillStyle=WARMc(0.95); ctx.fill(); }); }
      for(let k=0;k<7;k++){ const x=1.8+k*0.3, big=k===6; const a=JX(x,-0.35,sz*0.85), b=JX(x+0.1,-0.35+(big?0.7:0.25),sz*0.8), c=JX(x+0.2,-0.35,sz*0.85); const Q2=[a,b,c].map(P2);
        push(Q2[1][2]-1,'head',()=>{ ctx.beginPath(); ctx.moveTo(Q2[0][0],Q2[0][1]); ctx.lineTo(Q2[1][0],Q2[1][1]); ctx.lineTo(Q2[2][0],Q2[2][1]); ctx.closePath(); ctx.fillStyle=WARMc(0.95); ctx.fill(); }); } }
    const tg=[]; for(let s=0;s<=10;s++){ const q=s/10; tg.push(JX(1.6+q*3.0+Math.sin(q*3)*0.2,-0.3+Math.sin(q*Math.PI)*0.25+q*q*0.9,Math.sin(t*2+q*4)*0.15)); } const tip=tg[10]; tg.push(va(tip,vl(Fh,R*0.25,U,R*0.25)),va(tip,vl(Fh,R*0.05,U,R*0.45)));
    strand(tg,'head',0.22*R,c=>rgba([220,90,70],c),0.95); }
  // 鼻：如意形回卷 + 鼻孔
  for(const sz of [-0.32,0.32]){ const pts=[]; for(let s=0;s<=14;s++){ const an=s/14*TAU*0.9, rr=0.22*(1-s/20); pts.push(L3(4.15+Math.cos(an)*rr,0.5+Math.sin(an)*rr,sz)); } strand(pts,'head',0.07*R,GOLDc,0.9,false); }
  // 眼：发光的杏眼，竖瞳；粗眉向后化成火焰
  for(const sz of [-1,1]){ const E=L3(1.75,0.5,sz*0.7), en=vn(vl(Sd,sz,U,0.35,Fh,0.25)); const vis=facing(E,en), q=P2(E), qf=P2(L3(2.05,0.52,sz*0.7));
    if(vis) push(q[2]-2,'eye',()=>{ const an=Math.atan2(qf[1]-q[1],qf[0]-q[0]), rr=0.44*R*q[3]; ctx.save(); ctx.translate(q[0],q[1]); ctx.rotate(an); ctx.beginPath(); ctx.ellipse(0,0,rr,rr*0.62,0,0,TAU); const ig=ctx.createRadialGradient(0,0,0,0,0,rr); ig.addColorStop(0,'rgb(255,236,170)'); ig.addColorStop(1,'rgb(230,140,50)'); ctx.fillStyle=ig; ctx.fill(); ctx.strokeStyle=GOLDc(1); ctx.lineWidth=2.4; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(rr*0.15,0,rr*0.16,rr*0.55,0,0,TAU); ctx.fillStyle='#120a04'; ctx.fill(); ctx.restore(); ctx.save(); ctx.globalCompositeOperation='lighter'; glow(ctx,q[0],q[1],rr*2.6,WARM,0.7); ctx.restore(); });
    for(let k=0;k<5;k++){ const pts=[]; for(let s=0;s<=8;s++){ const q2=s/8; pts.push(L3(2.25-q2*(2.6+k*0.35),0.78+q2*(0.6+k*0.18)+Math.sin(t*2+k+q2*3)*0.12*q2,sz*(0.6+q2*(0.4+k*0.1)))); } strand(pts,'eye',k?0.1*R:0.16*R,GOLDc,0.9); } }
  // 鹿角：主干 + 三个分叉
  for(const sz of [-1,1]){ const sw=Math.sin(t*1.2)*0.08; const main=[[0.9,0.95,0.4],[0.4,1.6,0.55],[-0.3,2.2,0.75],[-1.1,2.6,0.95],[-2.0,2.85+sw,1.15]].map(([x,y,z])=>L3(x,y,sz*z)); { const sm2=[]; for(let k=0;k<=12;k++) sm2.push(catmull3(main,k/12*(main.length-1))); lock(sm2,'horn',0.22*R,1,'rgba(120,92,52,0.95)',false); }
    for(const [k,dx,dy] of [[1,0.3,0.9],[2,0.2,0.85],[3,-0.1,0.8]]){ const b=main[k]; const tipP=va(b,vl(Fh,dx*R,U,dy*R,Sd,sz*0.15*R)); lock([b,va(b,vl(Fh,dx*R*0.3,U,dy*R*0.45)),va(b,vl(Fh,dx*R*0.7,U,dy*R*0.85,Sd,sz*0.1*R)),tipP],'horn',0.14*R,1,'rgba(120,92,52,0.95)',false); } }
  // 耳：牛耳，向后上
  for(const sz of [-1,1]){ const Q=[L3(0.55,0.75,sz*0.75),L3(0.0,1.25,sz*1.05),L3(-0.6,1.15,sz*1.15),L3(-0.1,0.7,sz*0.9)].map(P2); const z=Q[0][2];
    push(z-1,'ear',()=>{ ctx.beginPath(); ctx.moveTo(Q[0][0],Q[0][1]); ctx.quadraticCurveTo(Q[1][0],Q[1][1],Q[2][0],Q[2][1]); ctx.quadraticCurveTo(Q[3][0],Q[3][1],Q[0][0],Q[0][1]); ctx.fillStyle='rgb(14,16,28)'; ctx.fill(); ctx.strokeStyle=GOLDc(0.95); ctx.lineWidth=2.2; ctx.stroke(); }); }
  // 鬃：从头后、颈上长出，一束束向后飘
  for(let k=0;k<24;k++){ const along=k/23, i=Math.round(along*0.13*(n-1)), r=R*prof3(i/(n-1)), th=(k%7-3)/3*1.25, root=va(S[i],vl(Fr.N[i],Math.cos(th)*r,Fr.B[i],Math.sin(th)*r)), outn=vl(Fr.N[i],Math.cos(th),Fr.B[i],Math.sin(th));
    const L=R*(2.4+1.2*Math.sin(k*1.9)+(1-along)*0.8), ph=t*2.3+k*0.7, pts=[]; for(let s=0;s<=8;s++){ const q=s/8; pts.push(va(root,vl(Fr.T[i],L*q*1.0,outn,L*(0.55*q-0.2*q*q)+Math.sin(ph+q*4)*R*0.25*q))); }
    lock(pts,'head',0.34*R,0.9); }
  // 腮边与下巴的毛
  for(const sz of [-1,1]) for(let k=0;k<6;k++){ const pts=[]; for(let s=0;s<=7;s++){ const q=s/7; pts.push(JX(1.4+k*0.35-q*(1.6+k*0.2),-0.85-q*(1.2+k*0.15)+Math.sin(t*2.2+k+q*3)*0.15*q,sz*(0.5+q*0.5))); } lock(pts,'head',0.2*R,0.85); }
  // 长须：从鼻侧伸出，先向前上，再向后飘
  for(const sz of [-1,1]){ const pts=[]; for(let s=0;s<=40;s++){ const q=s/40; pts.push(L3(4.05+1.8*Math.sin(q*Math.PI*0.85)-q*8.5,0.15+sz*0.0+q*2.2*(sz>0?1:-0.4)+Math.sin(t*2.4+s*0.28)*0.9*q,sz*(0.4+q*2.2))); } strand(pts,'head',0.11*R,GOLDc,0.95); }
  }
  // 火珠位置
  const pearlP=L3(5.4,1.3,0);
  // 画：远到近
  items.sort((a,b)=>b[0]-a[0]);
  ctx.save(); ctx.globalAlpha=A;
  for(const [z,name,fn] of items){ const p=name==='__head'?NONE:part(name); if(p.a<=0.01) continue; if(p.dx||p.dy||p.a<1){ ctx.save(); ctx.translate(p.dx,p.dy); ctx.globalAlpha=A*p.a; fn(); ctx.restore(); } else fn(); }
  ctx.restore();
  return {pearl:P2(pearlP),head:P2(H0)}; }
