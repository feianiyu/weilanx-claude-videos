// 文字效果演示：每段一句核心观点，入场在章节开始 0.35s 后，退场留到章节结束前
const GD='#F0B429',GN='#3CF07A';
const DEMO=[
 ['c0',{lines:[[['最大的一单，',null]],[['交货了。',GD]]],size:84},'粒子','吹散'],
 ['c1',{lines:[[['老本行，',null],['见底了',GD]]],size:80},'雾化','雾散'],
 ['c2',{lines:[[['规划行业',null],['不会消失',GN]],[['只会画图的，越来越少',null]]],size:68},'水流','融化'],
 ['c3',{lines:[[['收入下降 ',null],['33.82%',GD]]],size:80},'光扫','光扫'],
 ['c4',{lines:[[['90家',GD],['甲级资质',null]],[['一次注销',null]]],size:76},'碎裂','碎裂'],
 ['c5',{lines:[[['你站哪边？',null]]],size:88},'逐字','逐字'],
];
DEMO.forEach(([id,spec,fi,fo],k)=>{spec.cy=990;
 SCENES[id]={canvas(t,a){},dom(t){},
  free(t,a){const s=S[id],tIn=s.start+0.35,tOut=s.end-TXDUR.out[fo]-0.15;
   farField(t,a*0.7,260,300+k*50);showText('d'+k,spec,t,tIn,tOut,fi,fo,a);
   if(fi==='碎裂'){X.save();X.beginPath();X.rect(100,560,880,840);X.clip();impactRing(t,tIn+TXDUR.in[fi],540,990,420,110,a,AU);X.restore();}}};});
HOOKS.texA=()=>0.4;
