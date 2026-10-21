// ===== 本期场景《规划院转型》V2.3：画布函数（每期重写这一部分）=====
// ================= c0：网格里生长的线框大楼 =================
const CAM={F:700,hy:1030,cx:360};
function P(x,y,z,ang,dx){const ca=Math.cos(ang),sa=Math.sin(ang);const xx=x*ca-z*sa, zz=x*sa+z*ca+7;const s=CAM.F/zz;return [CAM.cx+(dx||0)+xx*s,CAM.hy+(1.2-y)*s];}
function floorGrid(t,a){if(a<=0)return;
 for(let i=-6;i<=6;i++){const p1=P(i*0.5,0,-3,0.55+0.05*t),p2=P(i*0.5,0,3,0.55+0.05*t);line([p1,p2],IV,1.2,0.10*a);const q1=P(-3,0,i*0.5,0.55+0.05*t),q2=P(3,0,i*0.5,0.55+0.05*t);line([q1,q2],IV,1.2,0.10*a);}}
function tower(t,a){
 if(a<=0)return;const t0=T('v01|一栋|s'),t40=T('v01|大楼|s'),t2k=T('v01|两千万|s'),tpl=T('v01|盘活|s');
 const ang=0.55+0.05*t, H=3.6;const w=0.8,d=0.8;const cs=[[-w,-d],[w,-d],[w,d],[-w,d]];
 const NF=18;const grow=cl((t-t0+0.15)/(t40-t0+0.25));   // 逐层生长
 const sp=eo(cl((t-t2k)/0.35))*(1-io(cl((t-tpl+0.1)/0.6)));  // 分拆→重组
 const live=cl((t-tpl)/0.6);
 floorGrid(t,a);
 for(let f=0;f<=NF;f++){const y=f*H/NF;const fp=cl(grow*NF*1.0-f+1);if(fp<=0)continue;
  const blk=Math.floor(f/5);const dx=sp*(blk%2?1:-1)*(26+blk*14),dy=-sp*blk*14;
  const ring=cs.map(([x,z])=>{const p=P(x,y,z,ang,dx);return [p[0],p[1]+dy-(1-eo(fp))*18];});
  const col=live>0?AU:(sp>0.05?GR:IV);gline(ring,col,f%6===0?2:1.2,a*eo(fp)*(f%6===0?0.85:0.45)*(1-0.4*sp),true);
  if(f<NF){for(const [x,z] of cs){const p=P(x,y,z,ang,dx),q=P(x,y+H/NF,z,ang,dx);const qq=cl(grow*NF-f);if(qq>0)gline([[p[0],p[1]+dy],[lerp(p[0],q[0],qq),lerp(p[1],q[1],qq)+dy]],col,1.6,a*0.8*(1-0.4*sp));}}
  // 窗点（盘活后亮金）
  if(f<NF&&f>0&&live>0)for(let j=0;j<3;j++){const p=P(-w+(j+0.5)*(2*w/3),y+H/NF*0.5,-d,ang,dx);if(rnd(f*7+j)>0.35)dot(p[0],p[1]+dy,2.2,AU,a*live*cl(live*NF-f*0.6));}
 }
 // 分拆碎屑
 if(t>t2k&&t<t2k+1.2){const pts=[];for(let i=0;i<40;i++){const f=Math.floor(rnd(i+9)*NF);const p=P((rnd(i)-.5)*2*w,f*H/NF,-d,ang);pts.push(p);}disperse(pts,t,t2k,a,IV,31,0.8);}
 // 盘活：自下而上光扫环
 const lq=cl((t-tpl)/0.9);if(lq>0&&lq<1){const y=lq*H;const ring=cs.map(([x,z])=>P(x*1.08,y,z*1.08,ang));gline(ring,AU,3,a*Math.sin(Math.PI*lq),true);}
 // 刻度尺计数器（右侧）
 const rx=545,ry0=CAM.hy+1.2*CAM.F/7,ry1=ry0-grow*(3.6*CAM.F/7);
 line([[rx,ry0],[rx,ry0-3.6*CAM.F/7]],IV,1.5,0.18*a);
 for(let k=0;k<=36;k++){const y=ry0-k*(3.6*CAM.F/7)/36;if(y<ry1-0.5)break;line([[rx,y],[rx+(k%5?10:22),y]],O,k%5?1.4:2.4,a*0.8);}
 gline([[rx-14,ry1],[rx+30,ry1]],O,2.5,a*cl(grow*3));
 const t2=cl((t-t2k)/0.4);if(t2>0){const y=ry0-2;gline([[rx-14,y],[rx+30,y]],G,2.5,a*t2);dot(rx+30,y,4,G,a*t2);}
 return {ry1};}
// ================= c1：订单水位 → 三层边界 =================
function tank(t,a){if(a<=0)return;const tj=T('v03|见底|s'),t3=T('v03|规划院|s');
 const x0=180,x1=900,y0=850,y1=1270;const lv=lerp(0.78,0.05,io(cl((t-tj+0.2)/1.0)));const ap=eo(cl((t-t3+0.1)/0.5));
 line([[x0,y0],[x0,y1],[x1,y1],[x1,y0]],IV,2,0.45*a*ap);
 for(let k=1;k<5;k++)line([[x0,y1-k*(y1-y0)/5],[x0+16,y1-k*(y1-y0)/5]],IV,1.5,0.4*a*ap);
 const wy=y1-(y1-y0)*lv*ap;const pts=[];for(let i=0;i<=48;i++){const x=lerp(x0+3,x1-3,i/48);pts.push([x,wy+5*Math.sin(i*0.5+t*3.2)]);}
 X.save();X.beginPath();X.moveTo(x0+3,y1-2);pts.forEach(p=>X.lineTo(p[0],p[1]));X.lineTo(x1-3,y1-2);X.closePath();const g=X.createLinearGradient(0,wy,0,y1);g.addColorStop(0,rgba(O,0.32*a));g.addColorStop(1,rgba(O,0.06*a));X.fillStyle=g;X.fill();X.restore();
 gline(pts,AU,2.2,a*ap);
 // 订单图纸沿线落入（排空前）
 for(let i=0;i<6;i++){const ph=((t-t3)*0.7+i/6)%1;if(t<t3||t>tj)continue;const x=260+i*110;dot(x,lerp(y0-30,wy,ph),2.2,IV,a*0.6*Math.sin(Math.PI*ph));}
 // 见底：排水粒子
 if(t>tj)for(let i=0;i<26;i++){const ph=((t-tj)*0.9+rnd(i))%1;dot(lerp(x0+20,x1-20,rnd(i+5)),wy+ph*(y1-wy),1.6,AU,a*(1-ph)*cl((t-tj)/0.3)*(1-cl((t-tj-1.6)/0.5)));}
}
function rgon(cx,cy,r,n,seed,rot){const out=[];for(let i=0;i<n;i++){const an=rot+i*6.283/n;const rr=r*(0.82+0.22*rnd(seed+i));out.push([cx+Math.cos(an)*rr,cy+Math.sin(an)*rr*0.78]);}out.push(out[0]);return out;}
const BND=[rgon(600,1060,300,11,3,-0.2),rgon(640,1080,200,9,17,0.3),rgon(670,1092,108,7,41,0.1)];
function bounds(t,a){if(a<=0)return;const ts=T('v04|省市|s');const tf=T('v04|基本|s'),td=T('v04|交货|s');
 BND.forEach((pl,i)=>{const t0=ts+i*0.38;const q=cl((t-t0+0.25)/0.45);if(q<=0)return;const drop=(1-eo(cl((t-t0+0.1)/0.2)))*-30;
  const pp=pl.map(p=>[p[0],p[1]+drop]);const col=i==2?AU:IV;gline(partial(pp,eo(q)),col,i==0?2.4:2,a*(i==0?0.7:0.85));
  const land=cl((t-t0)/0.5);if(land>0&&land<1){const c=pp[0];X.save();X.globalCompositeOperation='lighter';X.beginPath();X.ellipse(i==0?600:i==1?640:670,(i==0?1060:i==1?1080:1092),(i==0?300:i==1?200:108)*(1+0.25*land),(i==0?234:i==1?156:84)*(1+0.25*land),0,0,6.283);X.strokeStyle=rgba(O,0.35*a*(1-land));X.lineWidth=3;X.stroke();X.restore();}
 });
 // 批复完成：内部点阵逐点点亮
 const fq=cl((t-tf)/1.1);if(fq>0){for(let y=850;y<=1290;y+=26)for(let x=330;x<=900;x+=26){const d=Math.hypot(x-640,(y-1075)/0.78);if(d>300*0.95)continue;const on=cl(fq*1.4-d/300);if(on>0){X.fillStyle=rgba(AU,0.55*on*a);X.fillRect(x-1.5,y-1.5,3,3);}}}
}
// ================= c2：下坠曲线 + 证书点阵烟散 =================
const CH={x0:180,x1:900,y0:1140,y100:860,xd:700};
function chart(t,a){if(a<=0)return;const t0=T('v05|新|s'),tdn=T('v05|下降|s');
 const y66=CH.y0-(CH.y0-CH.y100)*(1-0.3382);
 line([[CH.x0,CH.y100-30],[CH.x0,CH.y0],[CH.x1,CH.y0]],IV,2,0.35*a);
 for(let i=1;i<4;i++)line([[CH.x0,CH.y0-i*70],[CH.x1,CH.y0-i*70]],IV,1,0.07*a,false,[6,8]);
 X.save();X.font='700 28px NSC';X.fillStyle=rgba('#B4AC9F',a);X.textAlign='center';X.fillText('2022年',440,CH.y0+36);X.fillText('2023年',815,CH.y0+36);X.restore();
 const pIn=eo(cl((t-t0)/1.6));const fall=io(cl((t-tdn-0.05)/0.5));const tail=eo(cl((t-tdn-0.55)/0.5));
 const pts=[[200,CH.y100],[lerp(200,CH.xd,pIn),CH.y100]];
 if(fall>0)pts.push([lerp(CH.xd,CH.xd+36,fall),lerp(CH.y100,y66,fall)]);
 if(tail>0)pts.push([lerp(CH.xd+36,890,tail),y66]);
 gline(pts,fall>0?O:IV,3.2,a);
 // 参照线 + 差额括号
 if(fall>0){line([[CH.xd,CH.y100],[890,CH.y100]],IV,1.5,0.35*a*tail,false,[8,8]);
  const bx=870;line([[bx,CH.y100],[bx,lerp(CH.y100,y66,tail)]],AU,2,0.9*a*tail);line([[bx-10,CH.y100],[bx+10,CH.y100]],AU,2,0.9*a*tail);if(tail>0.98)line([[bx-10,y66],[bx+10,y66]],AU,2,0.9*a);}
 const tip=pts[pts.length-1];
 // 下坠粒子拖尾
 if(fall>0&&fall<1)for(let i=0;i<26;i++){const dd=i/26;const y=lerp(CH.y100,tip[1],1-dd);dot(tip[0]-dd*30+(rnd(i)-.5)*12,y-rnd(i+3)*8,2.4*(1-dd),AU,a*(1-dd));}
 dot(tip[0],tip[1],5,fall>0?AU:IV,a);
 // 触底冲击：环 + 碎粒
 const ti=tdn+0.55,q=cl((t-ti)/0.7),ip=[CH.xd+36,y66];if(q>0&&q<1){X.save();X.globalCompositeOperation='lighter';for(const k of [0,0.18]){const qq=cl(q-k);X.beginPath();X.ellipse(ip[0],ip[1],20+170*eo(qq),8+46*eo(qq),0,0,6.283);X.strokeStyle=rgba(AU,0.6*a*(1-qq));X.lineWidth=3;X.stroke();}X.restore();
  const ps=[];for(let i=0;i<26;i++)ps.push(ip);disperse(ps,t,ti,a,AU,77,1.1);}
}
const CERT=[...Array(90)].map((_,i)=>({x:195+(i%15)*47.5,y:920+Math.floor(i/15)*44}));
(function(){const ord=CERT.map((_,i)=>i).sort((a,b)=>rnd(a+50)-rnd(b+50));ord.forEach((v,j)=>CERT[v].r=j);})();
function certs(t,a){if(a<=0)return;const t0=T('v06|今年|s'),tz=T('v06|注销|s');
 CERT.forEach((c,i)=>{const pin=cl((t-t0-i*0.006)/0.3);if(pin<=0)return;const ti=tz+c.r*0.016;const g=cl((t-ti)/0.25),br=cl((t-ti-0.35)/1.2);
  const col=g>0.5?GR:O;
  if(br<1){X.strokeStyle=rgba(col,a*pin*(1-br)*(g>0.5?0.7:0.95));X.lineWidth=2;X.strokeRect(c.x,c.y+(-12*br),34,26);X.fillStyle=rgba(col,a*pin*0.14*(1-br));X.fillRect(c.x,c.y-12*br,34,26);X.fillStyle=rgba(col,a*pin*0.8*(1-br));X.fillRect(c.x+7,c.y+11-12*br,20,2.5);}
  if(br>0&&br<1){for(let k=0;k<4;k++){const an=rnd(i*9+k)*6.283,sp=20+rnd(i*5+k)*60;dot(c.x+17+Math.cos(an)*sp*br,c.y+13+Math.sin(an)*sp*br-80*br*br,1.4,k%2?'#B9AE9C':O,a*(1-br)*0.7);}}
  X.strokeStyle=rgba(GR,a*0.10*cl(br*3));X.lineWidth=1;X.strokeRect(c.x,c.y,34,26);
 });
 // 烟雾从点阵升起
 for(let r=0;r<3;r++)smoke(t,tz+0.3+r*0.35,540,1010,700,180,10,a,100+r*40);
}
// ================= c3：雷达找地 + 文本粒子流 =================
const PAR=(function(){const out=[];const n=8,m=8,x0=200,y0=830,s=58;
 const J=(i,j)=>[x0+i*s+(rnd(i*31+j*7)-.5)*22,y0+j*s+(rnd(i*17+j*29)-.5)*22];
 for(let j=0;j<m-1;j++)for(let i=0;i<n-1;i++){const q=[J(i,j),J(i+1,j),J(i+1,j+1),J(i,j+1)];const cx=(q[0][0]+q[2][0])/2,cy=(q[0][1]+q[2][1])/2;if(Math.hypot(cx-400,cy-1030)<200)out.push({q,cx,cy});}
 const pick=[];let k=0;while(pick.length<8&&k<600){const i=Math.floor(rnd(k*7+3)*out.length);if(!pick.includes(i)&&Math.hypot(out[i].cx-400,out[i].cy-1030)<165&&pick.every(j=>Math.hypot(out[j].cx-out[i].cx,out[j].cy-out[i].cy)>60))pick.push(i);k++;}
 return {out,pick};})();
function radar(t,a){if(a<=0)return;const tx=T('v07|厦门|s'),t8=T('v07|八个|s');const cx=400,cy=1030,R=215;const ang=(t-tx)*2.4-1.57;
 X.save();
 PAR.out.forEach((p,i)=>{let d=((Math.atan2(p.cy-cy,p.cx-cx)-ang)%6.283+6.283)%6.283;const trail=d>5.4?cl((d-5.4)/0.88):0;
  const j=PAR.pick.indexOf(i);const lk=j>=0?cl((t-t8-j*0.06)/0.25):0;
  X.beginPath();X.moveTo(p.q[0][0],p.q[0][1]);p.q.slice(1).forEach(v=>X.lineTo(v[0],v[1]));X.closePath();
  X.fillStyle=lk>0?rgba(G,0.10*lk*a):rgba(O,(0.03+0.18*trail)*a);X.fill();
  X.strokeStyle=lk>0?rgba(G,0.9*a):rgba(IV,(0.16+0.3*trail)*a);X.lineWidth=lk>0?2.6:1.1;X.stroke();
  if(lk>0){const s=lerp(44,24,eo(lk));X.strokeStyle=rgba(G,a*lk);X.lineWidth=3;for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){X.beginPath();X.moveTo(p.cx+sx*s,p.cy+sy*s-sy*9);X.lineTo(p.cx+sx*s,p.cy+sy*s);X.lineTo(p.cx+sx*s-sx*9,p.cy+sy*s);X.stroke();}}
 });
 X.globalCompositeOperation='lighter';
 for(const r of [R,R*0.66,R*0.33]){X.beginPath();X.arc(cx,cy,r,0,6.283);X.strokeStyle=rgba(O,0.3*a);X.lineWidth=1.5;X.stroke();}
 for(let i=0;i<20;i++){X.beginPath();X.moveTo(cx,cy);X.arc(cx,cy,R,ang-0.045*(i+1),ang-0.045*i);X.closePath();X.fillStyle=rgba(AU,0.13*(1-i/20)*a);X.fill();}
 X.restore();gline([[cx,cy],[cx+Math.cos(ang)*R,cy+Math.sin(ang)*R]],AU,2.2,a);}
function timerRing(t,a){if(a<=0)return;const tm=T('v07|十分钟|s');const q=eo(cl((t-tm)/0.9));const cx=800,cy=920,r=0;
 // 计时进度条（细线 + 60 格刻度）
 const x0=640,x1=900,y=980;line([[x0,y],[x1,y]],IV,2,0.25*a);for(let k=0;k<=10;k++)line([[lerp(x0,x1,k/10),y],[lerp(x0,x1,k/10),y-(k%5?8:16)]],IV,1.5,0.35*a);
 gline([[x0,y],[lerp(x0,x1,q),y]],AU,3,a*cl((t-tm+0.2)/0.3));}
const GLY='规划文本用地容积率红线控规图则指标地块绿地退线编制审批数据';
function streams(t,a){if(a<=0)return;const tg=T('v07|广州|s'),tj=T('v07|交给|s'),ta=T('v07|智能体|s');const nx=540,ny=1150;
 X.save();X.font='700 28px NSC';X.textAlign='center';X.textBaseline='middle';
 const conv=cl((t-tj+0.2)/0.6);
 for(let s=0;s<8;s++){const sx=200+s*97;const p0=[sx,900],p1=[sx,1040],p2=[nx,ny];
  line([[p0[0],p0[1]],[p1[0],p1[1]]],O,1,0.10*a*cl((t-tg)/0.5));
  for(let k=0;k<7;k++){if(t<tg)continue;const ph=((t-tg)*(0.45+0.4*conv)+k/7+rnd(s*11+k)*0.1)%1;const u=ph;
   const x=(1-u)*(1-u)*p0[0]+2*u*(1-u)*p1[0]+u*u*p2[0],y=(1-u)*(1-u)*p0[1]+2*u*(1-u)*p1[1]+u*u*p2[1];
   const al=a*Math.sin(Math.PI*u)*cl((t-tg)/0.5);
   if(u<0.55-0.3*conv){X.fillStyle=rgba(s%3===1?AU:IV,al*0.85);X.fillText(GLY[(s*7+k*3)%GLY.length],x,y);}   // 文字 → 粒子
   else dot(x,y,2,s%3===1?AU:O,al);}}
 X.restore();
 const ap=cl((t-tg)/0.4),pul=cl((t-ta)/0.3),r=74+6*Math.sin(t*5)*ap+14*pul*(1-cl((t-ta-0.3)/0.6));
 const hex=[...Array(6)].map((_,i)=>[nx+r*Math.cos(i*1.047+0.5236),ny+r*Math.sin(i*1.047+0.5236)]);
 X.save();X.fillStyle=rgba('#100c06',0.8*a*ap);X.beginPath();hex.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.closePath();X.fill();X.restore();
 gline(hex,pul>0?G:O,2.6,a*ap,true);
 if(pul>0){const rr=r+70*cl((t-ta)/0.8);gline([...Array(6)].map((_,i)=>[nx+rr*Math.cos(i*1.047+0.5236),ny+rr*Math.sin(i*1.047+0.5236)]),G,2,a*(1-cl((t-ta)/0.8)),true);}
}
function toolSwap(t,a){const t0=S.c3.start,th=T('v07|换|s'),tx=T('v07|厦门|s');const cx=540,cy=1010;
 const oin=eo(cl((t-t0)/0.4)),oout=cl((t-th-0.1)/0.35);const ao=a*oin*(1-oout);
 if(ao>0){const j=t>th?(rnd(Math.round(t*30))-.5)*24*(1-oout):0;
  X.save();X.translate(cx-60+j,cy);X.rotate(-0.35);line([[-170,-24],[170,-24],[170,24],[-170,24],[-170,-24]],IV,2,0.75*ao);for(let k=-160;k<=160;k+=20)line([[k,-24],[k,-24+(k%100?12:22)]],IV,1.5,0.6*ao);X.restore();
  line([[cx+150+j,cy-120],[cx+105+j,cy+90]],IV,2.4,0.75*ao);line([[cx+150+j,cy-120],[cx+195+j,cy+90]],IV,2.4,0.75*ao);dot(cx+150+j,cy-120,4,IV,ao);
  X.save();X.font='700 32px NSC';X.fillStyle=rgba('#C9C2B6',ao);X.textAlign='center';X.fillText('传统工具',cx,cy+170);X.restore();}
 if(t>th-0.05&&t<th+1.2)disperse(samplePts([[cx-230,cy+60],[cx+110,cy-60],[cx+195,cy+90]],36),t,th,a,IV,88,1);
 const nq=eo(cl((t-th-0.15)/0.6)),nout=cl((t-tx+0.3)/0.3);const an=a*nq*(1-nout);
 if(an>0){const N=[[cx,cy]];for(let i=0;i<6;i++)N.push([cx+150*Math.cos(i*1.047),cy+120*Math.sin(i*1.047)]);
  for(let i=1;i<7;i++){gline(partial([N[0],N[i]],nq),AU,2,an*0.8);gline(partial([N[i],N[i%6+1]],nq),O,1.4,an*0.5);}
  N.forEach((p,i)=>dot(p[0],p[1],i?4:7,i?AU:G,an));
  for(let k=0;k<6;k++){const ph=((t-th)*1.1+k/6)%1;const p=along([N[0],N[k+1]],ph);dot(p[0],p[1],2,IV,an*0.8);}
  X.save();X.font='700 32px NSC';X.fillStyle=rgba('#F0B429',an);X.textAlign='center';X.fillText('AI · 数据 · 智能体',cx,cy+190);X.restore();}}
// ================= c4：漂移的资质证书（克制） =================
const CERTS=[[175,792,-3],[615,802,3],[175,982,2],[615,992,-3]];
(function(){$('certs').innerHTML=CERTS.map((c,i)=>`<div class="cert" id="ct${i}" style="left:${c[0]}px;top:${c[1]}px;opacity:0"><b>甲级资质</b><i>规划编制单位</i><div class="tr" id="tr${i}">转让</div></div>`).join('');})();
function c4canvas(t,a){if(a<=0)return;const tb=T('v08|业务|s');const q=eo(cl((t-tb)/0.6));
 const x0=160,x1=920,y=1272;line([[x0,y],[x1,y]],IV,10,0.10*a);
 X.save();X.lineCap='round';X.strokeStyle=rgba(O,0.85*a*cl((t-tb+0.1)/0.3));X.lineWidth=10;X.beginPath();X.moveTo(x0,y);X.lineTo(lerp(x0,x1,lerp(0.95,0.42,q)),y);X.stroke();X.restore();
 for(let i=0;i<24;i++){const ph=(t*0.05+rnd(i+300))%1;dot(170+rnd(i+200)*740,1300-ph*600,1.2,'#B9AE9C',a*0.4*Math.sin(Math.PI*ph));}}
function c4dom(t){const t0=T('v08|这|s'),tz=T('v08|资质|s'),tr=T('v08|转让|s');
 CERTS.forEach((c,i)=>{const ti=t0+i*0.35;const p=eo(cl((t-ti)/0.6));const el=$('ct'+i);
  const fade=cl((t-tz-i*0.12)/0.6);el.style.opacity=(p*(1-0.35*fade)).toFixed(3);
  el.style.transform=`translate(${(Math.sin(t*0.45+i*1.7)*10).toFixed(1)}px,${(Math.cos(t*0.38+i)*8-16*(1-p)).toFixed(1)}px) rotate(${(c[2]+Math.sin(t*0.3+i)*1.2).toFixed(2)}deg)`;
  el.style.borderColor=fade>0.5?'rgba(160,150,135,.35)':'rgba(255,236,200,.45)';
  const tq=cl((t-tr-[0,0.08,0.16,0.24][i])/0.18);const tg=$('tr'+i);tg.style.opacity=tq.toFixed(3);tg.style.transform=`scale(${(1.5-0.5*eo(tq)).toFixed(3)}) rotate(-8deg)`;});}
// ================= c5：判断结构图 =================
function c5canvas(t,a){if(a<=0)return;const tj=T('v09|我|s'),to=T('v09|只|s'),tl2=T('v09|业务|s'),tn=T('v09|能|s'),tai=T('v09|懂|s'),top=T('v09|懂存量|s'),tw=T('v09|新型|s');
 // 判断落下：冲击环
 const q=cl((t-tj)/0.8);if(q>0&&q<1){X.save();X.globalCompositeOperation='lighter';for(const k of [0,0.15]){const qq=cl(q-k);X.beginPath();X.ellipse(540,830,80+420*eo(qq),30+120*eo(qq),0,0,6.283);X.strokeStyle=rgba(AU,0.55*a*(1-qq));X.lineWidth=3;X.stroke();}X.restore();}
 // 旧路：灰线 → 烟雾消散
 const oldP=[[420,880],[420,915],[370,915],[370,950]];const lessP=[[580,1025],[600,1025]];
 const oq=cl((t-to)/0.4),od=cl((t-tn)/0.5);
 if(od<1){line(partial(oldP,eo(oq)),GR,3,a*(1-od));const lq=cl((t-tl2)/0.8);if(lq>0){const dn=[[600,1060],[600,lerp(1060,1150,eo(lq))]];line(dn,GR,3,a*(1-od));line([[588,dn[1][1]-12],[600,dn[1][1]],[612,dn[1][1]-12]],GR,3,a*(1-od)*cl(lq*3));}}
 if(t>tn){smoke(t,tn,370,1025,420,160,12,a,500);disperse(samplePts([[160,950],[580,950],[580,1100],[160,1100],[160,950]],40),t,tn,a,'#B9AE9C',61,0.9);}
 // 两条出路线：从顶部节点流向两个新节点
 const R1=[[470,880],[470,935],[325,935],[325,990]],R2=[[610,880],[610,935],[740,935],[740,990]];
 const r1=eo(cl((t-tn-0.1)/0.5)),r2=eo(cl((t-tn-0.25)/0.5));
 gline(partial(R1,r1),G,2.6,a*(t>tn?1:0));gline(partial(R2,r2),AU,2.6,a*(t>tn?1:0));
 for(let k=0;k<4;k++){const ph=((t-tn)*0.8+k/4)%1;if(t>tn+0.6){const p=along(R1,ph),p2=along(R2,ph);dot(p[0],p[1],2.6,G,a*0.9);dot(p2[0],p2[1],2.6,AU,a*0.9);}}
 // 汇合到新型企业
 const M1=[[325,1090],[325,1135],[540,1135],[540,1176]],M2=[[740,1090],[740,1135],[540,1135],[540,1176]];const mq=eo(cl((t-tw+0.2)/0.5));
 gline(partial(M1,mq),G,2.4,a);gline(partial(M2,mq),AU,2.4,a);
 if(mq>=1)for(let k=0;k<3;k++){const ph=((t-tw)*0.9+k/3)%1;const p=along(M1,ph),p2=along(M2,ph);dot(p[0],p[1],2.4,G,a*0.9);dot(p2[0],p2[1],2.4,AU,a*0.9);}
 sweep(t,tw+0.3,0.9,a);
}
// ================= c6：二选一图形 =================
function panels(t,a){if(a<=0)return;const tl=T('v10|城市|s'),tr=T('v10|技术|s');const pl=cl((t-tl)/0.4),pr=cl((t-tr)/0.4);
 // 左：资产流 + 上升柱（城市投行）
 for(let i=0;i<5;i++){const h=(36+i*26)*eo(cl((t-S.c6.start-0.2-i*0.06)/0.5));X.fillStyle=rgba(i==4?G:O,(0.2+0.55*pl)*a);X.fillRect(210+i*50,1040-h,30,h);}
 gline([[200,1010],[260,975],[320,985],[390,915],[450,890]],G,2.6,a*(0.3+0.7*pl));
 // 右：蓝图网格 + 圆规（技术本行）
 for(let i=0;i<6;i++){line([[640,850+i*36],[870,850+i*36]],IV,1,(0.12+0.25*pr)*a);line([[630+i*48,850],[630+i*48,1030]],IV,1,(0.12+0.25*pr)*a);}
 const ca=-1.57+6.283*eo(pr);X.save();X.beginPath();X.arc(750,945,66,-1.57,ca);X.strokeStyle=rgba(AU,(0.3+0.7*pr)*a);X.lineWidth=3;X.stroke();X.restore();
 gline([[750,875],[718,990]],AU,2.4,a*(0.3+0.7*pr));gline([[750,875],[782,990]],AU,2.4,a*(0.3+0.7*pr));
 // VS 中线闪光
 const vq=cl((t-S.c6.start-0.25)/0.5);if(vq>0){gline([[540,820],[540,lerp(820,940,eo(vq))]],AU,2,a*0.7);gline([[540,1200],[540,lerp(1200,1060,eo(vq))]],AU,2,a*0.7);}}

// =====================================================================
// 本期挂载：SCENES[章节] = {canvas(t,a,f) 画线条粒子, dom(t,a,f) 驱动 scenes.html 文字}
// t 已处理「收一拍」静止；a = 章节可见度 0–1；f = 帧号（故障抖动用）
// =====================================================================
HOOKS.texBoost=(t,V)=>V[3]>0?cl((t-T('v07|换|s'))/0.4)*(1-cl((t-T('v07|厦门|s'))/0.5)):0;

SCENES.c0={
 canvas(t,a){tower(t,a);const tz=T('v02|专家|s'),tg=T('v02|规划院|s');const q=eo(cl((t-tz-0.3)/0.6));
  const L1=[[560,1240],[640,1240]];gline(partial(L1,eo(cl((t-T('v02|接|s'))/0.5))),O,2.6,a*q);
  if(t>tg){const p=cl((t-tg)/0.6);X.save();X.globalCompositeOperation='lighter';X.strokeStyle=rgba(AU,0.6*(1-p)*a);X.lineWidth=3;X.strokeRect(640-20*p,1180-20*p,280+40*p,120+40*p);X.restore();}
  for(let k=0;k<3;k++){const ph=((t-tz)*1.2+k/3)%1;if(t>T('v02|接|s')+0.5){const p=along(L1,ph);dot(p[0],p[1],2.4,AU,a);}}},
 dom(t,a,f){const t40=T('v01|四十亿|s'),tb=T('v01|大楼|s'),t2k=T('v01|两千万|s'),tz=T('v02|专家|s'),tg=T('v02|规划院|s');
  const n=Math.round(40*eo(cl((t-t40+0.05)/(tb-t40+0.2))));$('n40').textContent=n+'亿';rise('n40',cl((t-t40+0.25)/0.3));
  const dim=1-0.55*cl((t-T('v02|某|s'))/0.5);
  $('n40').style.opacity=(cl((t-t40+0.25)/0.3)*dim).toFixed(3);$('lb40').style.opacity=(cl((t-T('v01|一栋|s'))/0.3)*dim).toFixed(3);
  const p2=eo(cl((t-t2k)/0.35));rise('n2k',p2,24).style.opacity=(p2*dim).toFixed(3);op('lb2k',p2*dim);glitchEl($('n2k'),cl(1-(t-t2k)/0.35)*(t>t2k?1:0),f);
  const pl=cl((t-T('v01|盘活|s'))/0.4);$('n2k').style.color=pl>0?'#3CF07A':'#fff';$('n2k').style.textShadow=pl>0?`0 0 ${(18*pl).toFixed(0)}px rgba(60,240,122,.45),0 3px 10px rgba(0,0,0,.6)`:'';
  op('pct',cl((t-T('v01|只求|s'))/0.4)*dim);
  const zp=eo(cl((t-tz+0.05)/0.4));rise('zc',zp).style.transform=`translateX(${(-40*(1-zp)).toFixed(1)}px)`;
  const gp=eo(cl((t-tg+0.1)/0.35));op('zg',gp);hl($('zg'),t>tg,'#F5A623');$('zg').style.color=t>tg?'#F5A623':'#fff';op('zsrc',cl((t-tz-0.4)/0.4));}};

SCENES.c1={
 canvas(t,a){const tv=T('v04|二零二五年|s');const sw=cl((t-tv+0.2)/0.4);tank(t,a*(1-sw));
  if(t>tv-0.2&&t<tv+1.2)disperse(samplePts([[180,850],[180,1270],[900,1270],[900,850]],50),t,tv-0.2,a,AU,13,1);
  bounds(t,a*sw);},
 dom(t){const tv=T('v04|二零二五年|s'),ts=T('v04|省市|s');const sw=cl((t-tv+0.2)/0.4);
  op('tankLab',1-sw);op('tankNote',1-sw);rise('d25',eo(cl((t-tv)/0.4)));
  [['Lp',0],['Lc',1],['Lx',2]].forEach(([id,i])=>{const p=eo(cl((t-ts-i*0.38+0.1)/0.3));const e=op(id,p);e.style.transform=`translateY(${(-26*(1-p)).toFixed(1)}px)`;});
  op('d25src',cl((t-T('v04|基本|s'))/0.4));
  const td=T('v04|交货|s')+0.18;const q=cl((t-td+0.2)/0.2);const st=op('stamp',q>0?Math.min(1,q*1.5):0);st.style.transform=`scale(${(1.7-0.7*eo(q)).toFixed(3)}) rotate(-12deg)`;}};

SCENES.c2={
 canvas(t,a){const sw=T('v06|今年|s');const o=cl((t-sw+0.1)/0.35);chart(t,a*(1-o));if(o>0&&o<1)smoke(t,sw-0.1,540,1000,720,300,10,a,300);certs(t,a*o);},
 dom(t){const sw=T('v06|今年|s'),tp=T('v05|百分之三十三点八二|s');const o1=1-cl((t-sw+0.1)/0.3);
  op('xcLab',o1*cl((t-T('v05|某|s'))/0.4));
  const n=$('n33');const q=eo(cl((t-tp+0.1)/0.9));n.textContent='−'+(33.82*q).toFixed(2)+'%';op('n33',o1*cl((t-T('v05|下降|s')-0.4)/0.3));
  op('n33lab',o1*cl((t-T('v05|下降|s')-0.4)/0.3));op('chartNote',o1*cl((t-T('v05|二零二三年|s'))/0.4));op('xcSrc',o1*cl((t-T('v05|某|s'))/0.4));
  const tn=T('v06|九十|s');rise('n90w',eo(cl((t-T('v06|注销|s'))/0.4)));$('n90').textContent=Math.round(90*eo(cl((t-tn+0.2)/0.6)));
  const wq=eo(cl((t-T('v06|原因|s'))/0.35));rise('why',wq);hl($('why'),t>T('v06|没有|s'),'#F5A623');$('whyT').style.color=t>T('v06|没有|s')?'#F5A623':'#fff';
  op('mnrSrc',cl((t-sw-0.3)/0.4));}};

SCENES.c3={
 canvas(t,a,f){toolSwap(t,a);const tx=T('v07|厦门|s'),tg=T('v07|广州|s');const ra=a*cl((t-tx+0.2)/0.3)*(1-cl((t-tg+0.1)/0.3));radar(t,ra);timerRing(t,ra);
  if(t>tg-0.1&&t<tg+1.2){const ps=PAR.out.filter((_,i)=>i%2==0).map(p=>[p.cx,p.cy]);disperse(ps,t,tg-0.1,a,O,21,1);}
  streams(t,a*cl((t-tg+0.1)/0.3));
  const th=T('v07|换|s');const sq=cl((t-th)/0.6);if(sq>0&&sq<1){gline([[140,lerp(600,1370,io(sq))],[940,lerp(600,1370,io(sq))]],AU,2.4,a*Math.sin(Math.PI*sq));for(let i=0;i<6;i++){if(rnd(f*7+i)>0.5)continue;X.fillStyle=rgba(O,0.10*a);X.fillRect(140+rnd(f+i)*500,620+rnd(f*3+i)*700,120+rnd(i*f)*300,4+rnd(i+f)*10);}}},
 dom(t){const tx=T('v07|厦门|s'),tg=T('v07|广州|s'),tm=T('v07|十分钟|s'),t8=T('v07|八个|s');
  const ob=cl((t-tx+0.2)/0.3)*(1-cl((t-tg+0.1)/0.3));rise('xmLab',ob);
  const tq=eo(cl((t-tm)/0.9));$('tmN').textContent=Math.round(10*tq);op('tm',ob*cl((t-tm+0.2)/0.3));
  op('pkA',ob*cl((t-T('v07|八个|s')+0.6)/0.3));const pk=op('pk8',ob*cl((t-t8)/0.3));pk.style.textShadow=t>t8?'0 0 16px rgba(60,240,122,.5)':'';op('xmSrc',ob);
  const oc=cl((t-tg+0.1)/0.3);rise('gzLab',oc);rise('n13',oc*eo(cl((t-T('v07|十三万|s')+0.1)/0.4)));op('agent',oc*cl((t-T('v07|智能体|s'))/0.3));op('gzSrc',oc);
  $('agent').style.color=t>T('v07|智能体|s')?'#3CF07A':'#fff';}};

SCENES.c4={
 canvas(t,a){c4canvas(t,a);},
 dom(t){c4dom(t);op('bzLab',cl((t-T('v08|传统|s'))/0.4));op('obsNote',cl((t-T('v08|这|s')-0.4)/0.4));}};

SCENES.c5={
 canvas(t,a){c5canvas(t,a);},
 dom(t){const tj=T('v09|我|s'),tn0=T('v09|不会|s'),to=T('v09|只|s'),tf2=T('v09|法定|s'),tl2=T('v09|业务|s'),tn=T('v09|能|s'),tai=T('v09|懂|s'),top2=T('v09|懂存量|s'),tw=T('v09|新型|s');
  const jq=cl((t-tj)/0.22);const jt=op('jTop',jq>0?1:0);jt.style.transform=`scale(${(1.25-0.25*eo(jq)).toFixed(4)})`;op('jNo',cl((t-tn0)/0.35));
  const od=cl((t-tn)/0.45);const oq=eo(cl((t-to-0.1)/0.35));rise('jOld',oq*(1-od));op('jOld2',cl((t-tf2)/0.3));$('jOld').style.color='#9A9286';
  op('jLess',cl((t-tl2)/0.4)*(1-od));
  const aq=eo(cl((t-tai+0.3)/0.4)),pq=eo(cl((t-top2+0.3)/0.4));rise('jAI',Math.max(cl((t-tn-0.45)/0.3)*0.5,aq));rise('jOp',Math.max(cl((t-tn-0.6)/0.3)*0.5,pq));
  hl($('jAI'),t>tai,'#3CF07A');$('jAI').style.color=t>tai?'#3CF07A':'#fff';hl($('jOp'),t>top2,'#F0B429');$('jOp').style.color=t>top2?'#F0B429':'#fff';
  const wq=eo(cl((t-tw+0.1)/0.4));rise('jNew',wq);hl($('jNew'),t>tw+0.2,'#F0B429');$('jNew').style.color=t>tw+0.2?'#F0B429':'#fff';}};

SCENES.c6={
 canvas(t,a){panels(t,a);},
 dom(t){const tl=T('v10|城市|s'),tr=T('v10|技术|s');const pl=cl((t-tl)/0.35),pr=cl((t-tr)/0.35);
  hl($('pL'),pl>0,'#3CF07A');$('pL').style.color=pl>0?'#3CF07A':'#C9C2B6';hl($('pR'),pr>0,'#F0B429');$('pR').style.color=pr>0?'#F0B429':'#C9C2B6';
  const l0=eo(cl((t-S.c6.start)/0.4));$('pL').style.transform=`translateX(${(-50*(1-l0)).toFixed(1)}px)`;$('pR').style.transform=`translateX(${(50*(1-l0)).toFixed(1)}px)`;$('pL').style.opacity=$('pR').style.opacity=l0.toFixed(3);
  const vq=eo(cl((t-S.c6.start-0.25)/0.3));const vs=op('vs',vq);vs.style.transform=`scale(${(1.5-0.5*vq).toFixed(3)})`;vs.style.textShadow='0 0 18px rgba(245,166,35,.6),0 3px 10px rgba(0,0,0,.7)';}};
