// =====================================================================
// 天强 2026 年度峰会宣传片 · 场景
// 主线：一组三角晶格（呼应天强洞察 logo）——十四年一年长一格 → 停长变成笼子 → 裂开，「向新生长」长出来
// =====================================================================
const sq=x=>x*x;
const st=k=>D.tl[k][0], en=k=>D.tl[k][1];
const PAL=['#F5A623','#F7C04A','#C8D44A','#8BC34A','#5FB8E8','#3A8DFF'];
function setO(id,v){const e=$(id);e.style.opacity=(+v).toFixed(3);return e;}
function show(id,p,dy,blur,dx){const e=$(id);p=cl(p);e.style.opacity=p.toFixed(3);
 e.style.translate=`${((1-p)*(dx||0)).toFixed(1)}px ${((1-p)*(dy===undefined?28:dy)).toFixed(1)}px`;
 e.style.filter=blur&&p<0.99?`blur(${((1-p)*blur).toFixed(1)}px)`:'none';return e;}
const win=(t,a,b,fi,fo)=>Math.min(eo(cl((t-a)/(fi||0.45))),b===undefined?1:1-cl((t-b)/(fo||0.4)));
function keys(t,kf){if(t<=kf[0][0])return kf[0][1];for(let i=1;i<kf.length;i++)if(t<=kf[i][0]){const [a,va]=kf[i-1],[b,vb]=kf[i];return lerp(va,vb,io(cl((t-a)/(b-a))));}return kf[kf.length-1][1];}
function palAt(u){u=cl(u)*(PAL.length-1);const i=Math.min(PAL.length-2,Math.floor(u)),a=_hx(PAL[i]),b=_hx(PAL[i+1]),w=u-i;return '#'+[0,1,2].map(k=>Math.round(lerp(a[k],b[k],w)).toString(16).padStart(2,'0')).join('');}
function strokeTri(p,col,w,a,q){if(a<=0.003)return;const pts=q<1?partial([p[0],p[1],p[2],p[0]],q):[p[0],p[1],p[2],p[0]];
 X.save();X.globalCompositeOperation='lighter';X.lineJoin='round';X.lineCap='round';
 for(const [lw,al] of [[w*4,0.07],[w*2,0.16],[w,0.85]]){X.beginPath();X.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)X.lineTo(pts[i][0],pts[i][1]);X.strokeStyle=col.startsWith('#')?rgba(col,al*a):col.replace('rgb(','rgba(').replace(')',`,${al*a})`);X.lineWidth=lw;X.stroke();}
 X.restore();}
function fillTri(p,col,a){if(a<=0.003)return;X.save();X.beginPath();X.moveTo(p[0][0],p[0][1]);X.lineTo(p[1][0],p[1][1]);X.lineTo(p[2][0],p[2][1]);X.closePath();
 X.fillStyle=col.startsWith('#')?rgba(col,a):col.replace('rgb(','rgba(').replace(')',`,${a})`);X.fill();X.restore();}
// ---------- 晶格：竖边 + 斜边的三角网格（和天强洞察 logo 同一种格子） ----------
const LCX=540,LCY=930,LW=116,LH=116;
const LAT=(()=>{const out=[];
 for(let i=-6;i<6;i++){const oi=(((i%2)+2)%2)*LH/2,oj=((((i+1)%2)+2)%2)*LH/2,xa=LCX+i*LW,xb=xa+LW;
  for(let j=-8;j<8;j++){const A0=[xa,LCY+j*LH+oi],A1=[xa,LCY+(j+1)*LH+oi],B0=[xb,LCY+j*LH+oj],B1=[xb,LCY+(j+1)*LH+oj];
   if(oi===0){out.push([A0,A1,B0]);out.push([B0,B1,A1]);}else{out.push([B0,B1,A0]);out.push([A0,A1,B1]);}}}
 out.forEach((p,k)=>{const cx=(p[0][0]+p[1][0]+p[2][0])/3,cy=(p[0][1]+p[1][1]+p[2][1])/3;p.c=[cx,cy];p.d=Math.hypot(cx-LCX,(cy-LCY)*0.82)+rnd(k*7.3)*70;p.k=k;});
 out.sort((a,b)=>a.d-b.d);return out;})();
const NY=14,PER=6,NL=NY*PER;   // 十四年，每年长 6 格
const GROW=LAT.slice(0,NL);
// ---------- 公共：缓慢上浮的光尘 ----------
function dust(t,a,n,seed,col){if(a<=0)return;for(let i=0;i<n;i++){const s=seed+i*3.7;const x=rnd(s)*1080+Math.sin(t*0.4+rnd(s+1)*6)*30;
 const y=1750-((t*(14+22*rnd(s+2))+rnd(s+3)*1700)%1700);const tw=0.5+0.5*Math.sin(t*2.1+rnd(s+4)*6.28);dot(x,y,0.9+1.6*rnd(s+5),col||(i%3?PL:AU),a*(0.25+0.45*tw));}}

// ---------- 底图：转速 / 亮度 / 饱和 ----------
const tReveal=T('v08|向新生长|s');
HOOKS.bg=t=>{const S3=S.c3.start;
 const b=keys(t,[[0,1.0],[S.c2.start-0.3,0.95],[S.c2.start+0.4,0.55],[S3,0.5],[tReveal-0.2,0.6],[tReveal+0.5,1.35],[S.c4.start,1.0],[S.c6.start-0.2,1.0],[S.c6.start+0.5,0.38],[S.c7.start,0.38],[S.c7.start+0.8,0.85]]);
 const s=keys(t,[[S.c2.start,1.0],[S.c2.start+0.5,0.45],[tReveal-0.2,0.6],[tReveal+0.6,1.15],[S.c4.start+1,1.0]]);
 const rot=t*2.2+40*eo(cl((t-tReveal)/3.0))-6*eo(cl((t-S.c2.start)/2));
 const z=1+0.08*Math.sin(Math.PI*cl((t-tReveal+0.3)/2.2));return {rot,b,s,z};};

// ================= c0 冷开场 =================
SCENES.c0={
 canvas(t,a){dust(t,a,40,11);
  // 远处一层淡晶格，慢慢旋入
  X.save();X.translate(540,930);X.rotate(-0.06+0.02*t);X.scale(1.35,1.35);X.translate(-540,-930);
  LAT.forEach((p,k)=>{const al=0.10*a*(0.5+0.5*Math.sin(t*1.3+k*0.7));strokeTri(p,PL,1.2,al,1);});X.restore();
  const e0=S.c0.end;
  showText('q1',{lines:[[['看见了，也行动了，',null]]],size:68,cy:740},t,-2,e0-0.55,'逐字','吹散',a,0.3);
  showText('q2',{lines:[[['为什么还是',null],['没改变','#F7C04A'],['？',null]]],size:92,cy:900},t,T('v01|为什么|s')-0.08,e0-0.5,'碎裂','吹散',a,0.45);
  impactRing(t,T('v01|没改变|s'),540,900,420,120,a,AU);},
 dom(t,a){show('c0k',1,0);}
};

// ================= c1 十四年 =================
const Y0=T('v02|二零一三|s'),Y1=T('v04|断过|e');
const yT=y=>lerp(Y0,Y1-0.4,y/(NY-1)), T23=yT(10);
const CURVE=(()=>{const out=[];for(let i=0;i<=60;i++){const u=i/60;out.push([130+u*820,640-320*(1-Math.exp(-3.6*u))/(1-Math.exp(-3.6))+18*Math.max(0,u-0.8)/0.2]);}return out;})();
function latGrow(t,a,dim){GROW.forEach((p,k)=>{const y=Math.floor(k/PER),ta=yT(y)+(k%PER)*0.05;const q=cl((t-ta)/0.45);if(q<=0)return;
  const up=t>=T23,c=up?'#FFFFFF':PL,fl=Math.exp(-(t-ta)*3);
  strokeTri(p,c,up?2.0:1.6,a*dim*(up?0.95:0.75),eo(q));fillTri(p,up?'#8FA8FF':PL,a*dim*(0.05+0.25*fl));
  if(up&&y>=10)fillTri(p,AU,a*dim*0.12);});}
SCENES.c1={
 canvas(t,a){dust(t,a,34,21);
  const dim=keys(t,[[T('v03|高速|s')-0.3,1],[T('v03|高速|s'),0.32],[T('v04|一年|s')-0.3,0.32],[T('v04|一年|s'),0.95],[T('v05|设计企业|s')-0.4,0.95],[T('v05|设计企业|s'),0.3]]);
  latGrow(t,a,dim);
  // 2023 升级：一圈光
  impactRing(t,T23,LCX,LCY,520,300,a,AU);
  // 行业曲线
  const c0=T('v03|高速|s')-0.2,c1=T('v03|放缓|e'),cA=win(t,c0,T('v05|同一个问题|s')-0.3,0.3,0.5);
  if(cA>0){const q=eo(cl((t-c0)/(c1-c0)));const pts=partial(CURVE,q);gline(pts,AU,3.2,a*cA);const hd=pts[pts.length-1];dot(hd[0],hd[1],5,'#FFF4D6',a*cA);
   line([[130,660],[950,660]],PL,1.5,0.35*a*cA,false,[6,10]);}
  // 同一个问题
  const qT=T('v05|设计企业|s')-0.15;
  showText('c1q',{lines:[[['设计企业',null],['该怎么认识自己',null]],[['往哪里走？','#F7C04A']]],size:66,cy:470},t,qT,S.c1.end-1.0,'逐字','雾散',a,0.35);},
 dom(t,a){const c0=T('v03|高速|s')-0.2,cE=T('v05|同一个问题|s')-0.3;
  show('cvA',win(t,c0+0.2,cE),20);show('cvB',win(t,T('v03|放缓|s'),cE),20);
  show('cvC',win(t,T('v03|增量|s')-0.1,cE),20,6);setO('cvArrow',win(t,T('v03|存量压力|s')-0.2,cE));show('cvD',win(t,T('v03|存量压力|s')-0.1,cE),20,6,-30);
  const yr=$('yr');const n=Math.max(0,Math.min(NY-1,Math.floor((t-Y0)/((Y1-0.4-Y0)/(NY-1))+1e-6)));yr.textContent=String(2013+n);
  show('yr',win(t,Y0-0.25,S.c1.end-0.6),20,8);yr.style.scale=(1+0.08*Math.exp(-sq((t-T23)*6))).toFixed(3);
  show('ylab1',win(t,T('v02|思翔|s')-0.1,T23-0.3),16);show('ylab2',win(t,T23,T('v04|一年|s')-0.2),16);show('ylab3',win(t,T('v04|一年|s'),S.c1.end-0.6),16);}
};

// ================= c2 困住 =================
const tShr=T('v06|收缩|s'),tNo=T('v07|没变|s');
SCENES.c2={
 canvas(t,a,f){const s0=S.c2.start;const sc=1-0.1*eo(cl((t-tShr)/0.5));const wq=eo(cl((t-s0)/1.2));
  X.save();X.translate(LCX,LCY);X.scale(sc,sc);X.translate(-LCX,-LCY);
  const sh=t>=tNo&&t<tNo+0.35?(rnd(f*3.1)-.5)*14:0;X.translate(sh,0);
  GROW.forEach((p,k)=>{strokeTri(p,mixRGB('#FFFFFF','#7C82A8',wq),lerp(2,4.2,wq),a*0.9,1);fillTri(p,'#0A0C26',a*0.25*wq);});
  // 笼子里的企业：来回冲撞，出不去
  const tri=(v,L)=>{const m=((v%(2*L))+2*L)%(2*L);return m<L?m:2*L-m;};
  for(let i=0;i<46;i++){const R=330*sc,sp=60+120*rnd(i*3.3),an=rnd(i*5.1)*6.283;const bx=tri(rnd(i)*2*R+Math.cos(an)*sp*t,2*R)-R,by=tri(rnd(i*2.7)*2*R+Math.sin(an)*sp*t,2*R)-R;
   const x=LCX+bx*0.9,y=LCY+by*0.82;const red=cl((t-tNo)/0.3);dot(x,y,3.2,red>0?RD:PL,a*(0.55+0.35*Math.sin(t*3+i)));}
  X.restore();
  impactRing(t,tShr,LCX,LCY,480,380,a,'#7C82A8');impactRing(t,tNo,LCX,LCY,520,420,a,RD);},
 dom(t,a,f){show('c2h',win(t,S.c2.start+0.1,T('v07|看见了|s')-0.2),24,8);
  show('ck1',win(t,T('v07|看见了|s')-0.1),24,6);show('ck2',win(t,T('v07|也行动了|s')-0.05),24,6);
  const e=show('ck3',win(t,tNo-0.12,undefined,0.2),30,10);glitchEl(e,t>=tNo&&t<tNo+0.4?1-(t-tNo)/0.4:0,f);}
};

// ================= c3 向新生长 =================
const VINES=[...Array(13)].map((_,i)=>{const u=i/12,x0=540+(u-.5)*120,ang=(u-.5)*1.9,len=780+220*rnd(i*3.9);
 const pts=[];for(let k=0;k<=40;k++){const s=k/40;pts.push([x0+Math.sin(ang)*len*s+Math.sin(s*5+i)*30*s,1520-Math.cos(ang*0.8)*len*s-60*s*s]);}return {pts,col:palAt(u),dl:rnd(i*2.2)*0.35};});
SCENES.c3={
 canvas(t,a){const t0=S.c3.start;dust(t,a,50,31,AU);
  const drift=cl((t-t0)/(tReveal-t0)),bq=cl((t-tReveal)/1.3);
  GROW.forEach((p,k)=>{const [cx,cy]=p.c,dx=cx-LCX,dy=cy-LCY,dd=Math.hypot(dx,dy)+1;
   const off=24*drift+700*eo(bq)*(0.6+0.6*rnd(k*4.4)),rot=(rnd(k*2.2)-.5)*2.6*eo(bq);const al=a*(1-bq);
   if(al<=0.01)return;const col=mixRGB('#7C82A8',palAt((cx-200)/680),eo(drift));
   X.save();X.translate(cx+dx/dd*off,cy+dy/dd*off-120*bq*bq);X.rotate(rot);X.translate(-cx,-cy);strokeTri(p,col,lerp(4.2,2.2,drift),al,1);
   if(drift>0.3)fillTri(p,col,al*0.10*drift);X.restore();});
  // 裂缝里透出的光
  if(t<tReveal+0.2){const g=cl((t-t0)/(tReveal-t0));const gr=X.createRadialGradient(LCX,LCY,0,LCX,LCY,90+420*g*g);gr.addColorStop(0,rgba('#FFF2C9',0.55*g*a));gr.addColorStop(1,rgba('#FFF2C9',0));
   X.save();X.globalCompositeOperation='lighter';X.fillStyle=gr;X.fillRect(0,300,1080,1300);X.restore();}
  // 彩色生长线
  VINES.forEach((v,i)=>{const q=eo(cl((t-tReveal+0.55-v.dl)/1.4));if(q<=0)return;gline(partial(v.pts,q),v.col,2.6,a*0.85);
   const hd=along(v.pts,q);dot(hd[0],hd[1],3.4,'#FFFFFF',a*(1-cl((t-tReveal-1.2)/0.8))*0.9);});
  impactRing(t,tReveal,540,790,560,240,a,AU);
  // 迸出的彩色粒子
  if(t>=tReveal&&t<tReveal+2.2){const q=(t-tReveal)/2.2;for(let i=0;i<90;i++){const an=rnd(i*3.1)*6.283,sp=200+500*rnd(i*1.7);
   dot(540+Math.cos(an)*sp*eo(q),790+Math.sin(an)*sp*eo(q)*0.6-80*q,1.6+1.4*rnd(i),PAL[i%6],a*(1-q));}}
  showText('rd',{lines:[[['重新定义设计企业的',null]],[['价值、边界与未来','#F7C04A']]],size:58,cy:1230},t,T('v09|重新定义|s')-0.1,1e9,'光扫','光扫',a,0.3);},
 dom(t,a){show('c3y',win(t,S.c3.start+0.1,tReveal-0.25,0.4,0.3),20,10);
  const q=eo(cl((t-tReveal+0.08)/0.9)),e=$('xxsz');e.style.opacity=q.toFixed(3);
  e.style.transform=`translateY(${(Math.sin(t*1.1)*4).toFixed(1)}px) scale(${(1.28-0.28*q).toFixed(4)})`;e.style.filter=q<0.99?`blur(${(18*(1-q)).toFixed(1)}px)`:'drop-shadow(0 0 22px rgba(247,192,74,.25))';}
};

// ================= c4 时间地点 + 三场 =================
const KS=[T('v11|二十六日|s'),T('v12|二十七日|s'),T('v13|二十七日|s')],KE=[st('v12'),st('v13'),en('v13')+0.4];
SCENES.c4={
 canvas(t,a){dust(t,a,30,41);
  // 时间轴竖线：卡片出现时往下长
  const q=eo(cl((t-KS[0]+0.2)/(KS[2]-KS[0]+0.6)));gline(partial([[70,735],[70,1309]],q),AU,2.4,a*0.8);
  KS.forEach((k,i)=>{const p=eo(cl((t-k)/0.3));if(p>0)dot(70,824+198*i,6*p,PAL[i*2],a);});
  impactRing(t,T('v10|十一月|s'),540,440,460,110,a,AU);},
 dom(t,a){show('c4logo',win(t,S.c4.start+0.05),16,6);
  const d=show('dt',win(t,T('v10|十一月|s')-0.12,undefined,0.35),0,14);d.style.scale=(1.18-0.18*eo(cl((t-T('v10|十一月|s')+0.12)/0.35))).toFixed(3);
  show('m1',win(t,T('v10|上海|s')-0.1),18,6);show('m2',win(t,T('v10|一天半|s')-0.1),18,6);show('m3',win(t,T('v10|三场|s')-0.1),18,6);
  ['k1','k2','k3'].forEach((id,i)=>{const e=show(id,win(t,KS[i]-0.12,undefined,0.4),0,10,160);const on=t>=KS[i]-0.1&&t<KE[i];
   e.style.boxShadow=on?`0 0 0 2px ${PAL[i*2]},0 0 34px ${PAL[i*2]}66,0 14px 40px rgba(0,0,30,.45)`:'0 14px 40px rgba(0,0,30,.45)';});}
};

// ================= c5 年度演讲 =================
const tC=[T('v14|二零二三|s'),T('v14|个人年度演讲|s'),T('v14|个人年度演讲|e'),T('v14|第四年|s')];
const tTi=T('v15|推动改变|s')-0.15,tPa=st('v16'),tP=[T('v16|看清处境|s'),T('v16|看见难题|s'),T('v16|看懂方法|s'),T('v16|看见新生|s')];
SCENES.c5={
 canvas(t,a){dust(t,a,30,51);const out=1-cl((t-st('v15')+0.1)/0.4);
  if(out>0)[270,450,630,810].forEach((x,i)=>{const up=i%2===0,h=150,w=172;const p=up?[[x-w/2,850],[x+w/2,850],[x,850-h]]:[[x-w/2,700],[x+w/2,700],[x,850]];
   const q=eo(cl((t-tC[i])/0.4));strokeTri(p,i===3?AU:'#FFFFFF',2.2,a*out*(0.25+0.75*q),1);fillTri(p,i===3?AU:PAL[i+1],a*out*0.28*q);});
  impactRing(t,tC[3],630+180,780,260,120,a,AU);
  // 看见新生：一根新芽
  const qs=eo(cl((t-tP[3]-0.1)/0.9));if(qs>0){const bx=760,by=1185;const stem=[];for(let k=0;k<=20;k++){const s=k/20;stem.push([bx+Math.sin(s*3)*16*s,by-120*s]);}
   gline(partial(stem,qs),'#9CDB5A',3,a);const tip=along(stem,qs);
   if(qs>0.6){const l=eo(cl((qs-0.6)/0.4));X.save();X.translate(tip[0],tip[1]+30);X.globalCompositeOperation='lighter';X.fillStyle=rgba('#9CDB5A',0.75*a);
    X.beginPath();X.ellipse(-22*l,0,24*l,9*l,-0.5,0,6.283);X.fill();X.beginPath();X.ellipse(22*l,-12,24*l,9*l,0.5,0,6.283);X.fill();X.restore();}}
  // 2027：向上的光线
  const q7=eo(cl((t-T('v17|二零二七|s'))/0.8));},
 dom(t,a){const out15=1-cl((t-st('v15')+0.1)/0.4);
  const lg=show('tqdc',win(t,S.c5.start+0.05),16,6);lg.style.opacity=(+lg.style.opacity*(1-0.88*cl((t-tPa)/0.5))).toFixed(3);
  show('who',Math.min(win(t,T('v14|祝波善|s')-0.1),out15),18,6);
  [0,1,2,3].forEach(i=>{const e=show('cl'+i,Math.min(win(t,tC[i]-0.05,undefined,0.3),out15),12,0);e.style.color=i===3?'#F7C04A':'#DDE4FF';});
  show('n4',Math.min(win(t,tC[3]-0.08,undefined,0.3),out15),0,10).style.scale=(1+0.25*Math.exp(-sq((t-tC[3])*5))).toFixed(3);
  const tt=show('ttl',win(t,tTi,undefined,0.6),30,16);const m=io(cl((t-tPa+0.2)/0.6));tt.style.transformOrigin='540px 0';tt.style.transform=`translateY(${(-110*m).toFixed(1)}px) scale(${(1-0.36*m).toFixed(3)})`;
  [0,1,2,3].forEach(i=>{const e=show('p'+i,win(t,tP[i]-0.12,undefined,0.6),18,22);const on=t>=tP[i]-0.1&&t<(i<3?tP[i+1]-0.1:en('v16')+0.3);
   e.style.borderColor=on?(i===3?'#9CDB5A':'#F7C04A'):'rgba(185,198,255,.35)';e.style.boxShadow=on?`0 0 30px ${i===3?'#9CDB5A55':'#F7C04A44'}`:'none';});
  show('to27',win(t,T('v17|二零二七|s')-0.4),24,8);}
};

// ================= c6 金句 =================
const tG1=T('v18|不是做错了|s'),tG2=T('v18|而是|s'),tCage=T('v18|困住了|s');
SCENES.c6={
 canvas(t,a){dust(t,a,20,61,PL);
  showText('g1',{lines:[[['不是做错了，',null]]],size:78,cy:700},t,tG1-0.1,1e9,'逐字','逐字',a,0.3);
  showText('g2',{lines:[[['而是被「',null],['过去做对的事','#F7C04A'],['」',null]],[['困住了',null]]],size:78,cy:930},t,tG2-0.1,1e9,'雾化','雾散',a,0.35);
  // 金色栅栏落下，把「过去做对的事」关住
  const x0=150,x1=930,y0=840,y1=1050;for(let i=0;i<11;i++){const x=lerp(x0,x1,i/10),q=eo(cl((t-tCage-0.03*Math.abs(i-5))/0.22));if(q<=0)continue;
   gline([[x,y0-240*(1-q)],[x,y0-240*(1-q)+(y1-y0)]],AU,2.0,a*0.42*q);}
  const qh=eo(cl((t-tCage-0.25)/0.3));if(qh>0){gline(partial([[x0,y0],[x1,y0]],qh),AU,3,a*0.8);gline(partial([[x1,y1],[x0,y1]],qh),AU,3,a*0.8);}
  impactRing(t,tCage+0.2,540,945,520,170,a,AU);},
 dom(){}
};

// ================= c7 片尾：报名页 =================
SCENES.c7={
 canvas(t,a){dust(t,a,46,71);
  const p=1+0.0*t;const tq=T('v21|报名|s');[[320,890],[760,890]].forEach(([x,y],i)=>{impactRing(t,tq+i*0.12,x,y,230,230,a,AU);});},
 dom(t,a){const t0=S.c7.start-0.1;
  [['e1',0,14],['e2',0.15],['e3',0.3,10],['e4',0.45],['e5',0.6],['q1',0.8,8],['q2',0.95,8],['e6',1.1],['h1',1.25],['h2',1.4]].forEach(([id,d,b])=>show(id,win(t,t0+d,undefined,0.5),26,b||0));
  show('e7',win(t,T('v20|不设直播|s')-0.1),16,6);
  const tq=T('v21|报名|s');['q1','q2'].forEach((id,i)=>{$(id).style.scale=(1+0.06*Math.exp(-sq((t-tq-i*0.12-0.1)*5))).toFixed(3);});}
};
