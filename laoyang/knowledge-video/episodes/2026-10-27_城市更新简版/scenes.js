// =====================================================================
// 《城市更新：从工程改造走向长期运营》· v3 简版样片
// 规则：底图是主角；数据区一次只有一张卡；动作只有四种——上浮淡入、数字滚动、进度条填充、点亮
// =====================================================================
// 只改数字那一段文字（保留 <small> 单位）
function num(id,to,p,dec){const e=$(id),v=to*eo(cl(p));const s=dec?v.toFixed(dec):String(Math.round(v));if(e.firstChild&&e.firstChild.nodeType===3)e.firstChild.nodeValue=s;else e.textContent=s;}
// 一组卡片换场：前一组上移淡出，后一组上浮淡入
function swap(id,t,tIn,tOut){const p=up(t,tIn,0.4)*(tOut?1-cl((t-tOut)/0.3):1);const e=$(id);e.style.opacity=p.toFixed(3);e.style.transform=`translateY(${((1-up(t,tIn,0.4))*24-(tOut?cl((t-tOut)/0.3)*30:0)).toFixed(1)}px)`;}

// ---------------- c0：上海 75 平方公里 / 150 栋 → 会设计、会施工还不够 ----------------
SCENES.c0={dom(t){const t75=T('v01|七十五|s'),t150=T('v01|一百五十|s'),tB=T('v02|但这批活|s'),tD=T('v02|会设计|s'),tC=T('v02|会施工|s'),tN=T('v02|拿到|s');
 card('a0n',1);num('a0n',75,1);card('a0c',up(t,t75+0.2,0.4));
 card('a0l',up(t,t150-0.2,0.4));num('a0v',150,(t-t150)/0.8);
 const dm=1-0.55*up(t,tB,0.4);['a0n','a0c','a0l'].forEach(k=>$(k).style.opacity=(+$(k).style.opacity*dm).toFixed(3));
 card('a0x1',up(t,tD-0.1,0.35));card('a0x2',up(t,tC-0.1,0.35));card('a0x3',up(t,tN-0.1,0.35));on('a0x3',t>tN+0.2);}};

// ---------------- c1：报告：从工程改造走向长期运营 → 过去交付就结束 / 现在策划时就定运营 ----------------
SCENES.c1={dom(t){const s1=S.c1.start,tG=T('v03|工程改造|s'),tZ=T('v03|走向|s'),tP=T('v04|过去|s'),tE=T('v04|结束|s'),tX=T('v04|现在|s'),tY=T('v04|持续收入|s');
 card('a1d',up(t,s1,0.4));card('a1q1',up(t,s1+0.4,0.4));card('a1q2',up(t,tZ-0.1,0.4));
 card('a1l1',up(t,tP-0.1,0.35));card('a1b1',up(t,tP-0.1,0.35));bar('a1b1',0.62*eo(cl((t-tP)/1.2)));
 card('a1l2',up(t,tX-0.1,0.35));card('a1b2',up(t,tX-0.1,0.35));bar('a1b2',0.62*eo(cl((t-tX)/0.6))+0.38*eo(cl((t-tY+0.3)/0.9)));}};

// ---------------- c2：10 / 23 / 14 → 43 个省市 → 北京第一批 1321 个项目（新实施 745）· 1049.5 亿 ----------------
SCENES.c2={dom(t){const s2=S.c2.start,t10=T('v06|十项|s'),t23=T('v06|二十三项|s'),t14=T('v06|十四项|s'),t7=T('v07|到今年|s'),t43=T('v07|四十三|s'),tJ=T('v07|具体项目|s'),t8=T('v08|北京|s'),tN=T('v08|一千三百二十一|s'),tM=T('v08|一千零四十九点五|s');
 swap('a2A',t,s2,t7-0.35);card('a2t',up(t,s2+0.1,0.4));
 [[t10,10],[t23,23],[t14,14]].forEach(([tt,v],i)=>{const e=card('a2n'+(i+1),up(t,s2+i*0.15,0.4));e.style.opacity=(+e.style.opacity*(0.3+0.7*up(t,tt-0.15,0.3))).toFixed(3);num('a2n'+(i+1),v,1);card('a2c'+(i+1),up(t,tt,0.35));});
 swap('a2B',t,t7-0.1,t8-0.35);num('a2n4',43,(t-t7)/1.4);card('a2c4',up(t,t43+0.3,0.4));card('a2l4',up(t,tJ-0.2,0.4));
 swap('a2C',t,t8-0.1);num('a2n5',1321,(t-t8)/(tN-t8+0.6));card('a2c5',up(t,tN+0.3,0.4));
 card('a2l5',up(t,tN+0.6,0.35));card('a2b5',up(t,tN+0.6,0.35));num('a2v5',745,(t-tN-0.7)/1.0);bar('a2b5',(745/1321)*eo(cl((t-tN-0.7)/1.0)));
 card('a2l6',up(t,tM-0.15,0.4));}};

// ---------------- c3：机会延伸到五段 → 只做一段 vs 改造 + 运营 ----------------
const R3=['v10|工程建设|s','v10|资产整合|s','v10|招商租赁|s','v10|商业经营|s','v10|社区服务|s'];
SCENES.c3={dom(t){const tA=T('v11|只做一段|s'),tO=T('v11|一次性|s'),tL=T('v11|接起来|s'),tS=T('v11|持续收入|s');
 swap('a3A',t,S.c3.start,tA-0.35);
 R3.forEach((k,i)=>{const tk=T(k);const e=card('a3r'+i,up(t,S.c3.start+i*0.12,0.4));if(i>0)e.style.opacity=(+e.style.opacity*(0.4+0.6*up(t,tk-0.2,0.3))).toFixed(3);on('a3r'+i,i>0&&t>tk);});
 swap('a3B',t,tA-0.1);card('a3l1',1);bar('a3b1',0.22*eo(cl((t-tO+0.2)/0.6)));
 card('a3l2',up(t,tL-0.2,0.4));card('a3b2',up(t,tL-0.2,0.4));bar('a3b2',eo(cl((t-tS+0.4)/1.4)));}};

// ---------------- c4：不只看改得好不好，还要看能不能一直用下去 ----------------
SCENES.c4={dom(t){const s4=S.c4.start,tG=T('v12|改得好不好|s'),tY=T('v12|一直|s');
 card('a4q1',up(t,s4+0.1,0.4));card('a4q2',up(t,tY-0.6,0.4));card('a4q3',up(t,tY+0.2,0.4));}};

// ---------------- c5：写清三项 → 第三项写不出来 = 缺的能力 → 自己建 / 找合作 / 收购 ----------------
const R5=['v14|交付后|s','v14|运营收入|s','v14|多做|s'];
SCENES.c5={dom(t){const tL=T('v13|三项|s'),tW=T('v15|写不出来|s'),tK=['v16|自己建|s','v16|找合作|s','v16|收购|s'].map(T);
 card('a5h',up(t,S.c5.start+0.1,0.4));
 R5.forEach((k,i)=>{const e=card('a5r'+i,up(t,S.c5.start+0.3+i*0.12,0.4));e.style.opacity=(+e.style.opacity*(0.35+0.65*up(t,T(k)-0.15,0.3))).toFixed(3);on('a5r'+i,i===2?t>tW:t>T(k)+0.2&&t<tW);});
 tK.forEach((tk,i)=>{card('a5k'+i,up(t,tk-0.15,0.35));on('a5k'+i,t>tk);});}};
