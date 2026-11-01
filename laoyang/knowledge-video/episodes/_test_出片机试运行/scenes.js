// ===== 本期场景：只写 SCENES，需要的画布函数写在上面（可直接用 fx.js 的 gline/smoke/disperse/sweep/impactRing…）=====
// 锚点 T('句号|词|s或e') = 那个词在配音里开始/结束的时刻；build.py 会自动扫描这里所有 T('...') 生成锚点
SCENES.c0={
 canvas(t,a){const t0=T('v01|一句|s');gline(partial([[160,1000],[540,1000],[920,860]],eo(cl((t-t0)/0.8))),AU,3,a);},
 dom(t){const t0=T('v01|一句|s');op('k0lab',cl((t-t0)/0.3));rise('k0num',cl((t-t0)/0.3));countUp('k0num',100,(t-t0)/1.2);}};
SCENES.c1={
 canvas(t,a){},
 dom(t){rise('k1a',eo(cl((t-T('v02|第一|s'))/0.4)));rise('k1b',eo(cl((t-T('v03|第二|s'))/0.4)));op('k1src',cl((t-T('v02|二零二六|s'))/0.4));}};
SCENES.c2={
 canvas(t,a){impactRing(t,T('v04|我的判断|s'),540,960,420,120,a);sweep(t,T('v04|结论|s'),0.9,a);},
 dom(t){const q=cl((t-T('v04|我的判断|s'))/0.22);const e=op('k2box',q>0?1:0);e.style.transform=`scale(${(1.25-0.25*eo(q)).toFixed(4)})`;hl(e,t>T('v04|结论|s'),'#F0B429');}};
