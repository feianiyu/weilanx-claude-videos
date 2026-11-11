"""页面内检查（qc.py 和 regress.py 共用）：中间区越界、字幕位置/溢出"""
CHECK = """(()=>{const out=[];
if(document.getElementById('cards')){   // 深度版：卡片区 x80–1000 / y400–1310，字幕 y1500–1730（页脚线 1745）
 const ST=document.body.classList.contains('stage'),ZL=ST?104:76,ZR=ST?976:1004,ZB=ST?1392:1312;   // 深度 v3 舞台模式：整卡 0.94 倍并居中，卡片区 x104–976（视频号安全区）/ y396–1392
 document.querySelectorAll('#cards .card').forEach(c=>{if(getComputedStyle(c).visibility==='hidden'||+c.style.opacity<0.5)return;
  c.querySelectorAll('*').forEach(e=>{let op=1;for(let x=e;x&&x!==c;x=x.parentElement)op*=+(getComputedStyle(x).opacity);if(op<0.3)return;
   if(e.closest('.ch-in'))return;if(e.closest('.mp svg')&&e.tagName!=='svg')return;   /* 结构图：图内元素被 svg 裁切，只查 svg 外框 */
   if(e.dataset&&e.dataset.fx==='slam'){const tr=getComputedStyle(e).transform;if(tr!=='none'&&!tr.startsWith('matrix(1, 0, 0, 1'))return;}   /* 砸入动效缩放途中的那几帧不算越界 */
   const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
   if(r.left<ZL||r.right>ZR||r.top<396||r.bottom>ZB)out.push(c.dataset.id+' 越界(出卡片区) '+[r.left,r.top,r.right,r.bottom].map(Math.round)+' '+String(e.textContent||(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className)||e.tagName).trim().slice(0,12));});});
 ['brand','series','src','foot'].forEach(id=>{const e=document.getElementById(id);if(!e||!e.textContent.trim())return;const g=document.createRange();g.selectNodeContents(e);const r=g.getBoundingClientRect();if(r.width&&(r.left<103||r.right>977))out.push('视频号安全区：#'+id+' '+Math.round(r.left)+'–'+Math.round(r.right));});
 const s=document.getElementById('sub');if(s.textContent){const r=s.getBoundingClientRect();if(r.top<1500)out.push('字幕太高');if(r.bottom>1730)out.push('字幕压到页脚');if(s.scrollWidth>s.clientWidth+2)out.push('字幕溢出');}
 return out;}
const v2=document.getElementById('v').classList.contains('v2');const L0=v2?104:104,R0=v2?976:976,T0=v2?530:590,SL=v2?120:150,SR=v2?960:930;
const box=e=>{const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(own){const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect();}
 if(e.children.length)return null;return e.getBoundingClientRect();};
document.querySelectorAll('#stage .scene').forEach(c=>{if(getComputedStyle(c).visibility==='hidden'||+c.style.opacity<0.5)return;
 c.querySelectorAll('*').forEach(e=>{if(e.closest('svg')&&e.tagName!=='svg')return;if(e.id==='endT')return;
  let op=1;for(let x=e;x&&x!==c;x=x.parentElement)op*=+getComputedStyle(x).opacity;if(op<0.3)return;
  const r=box(e);if(!r||!r.width||!r.height)return;const nm=(e.textContent||e.tagName).trim().slice(0,12);const R=[r.left,r.top,r.right,r.bottom].map(Math.round);
  if(r.left<L0||r.right>R0||r.top<T0||r.bottom>1396)out.push(c.dataset.sec+' 越界(出底板) '+R+' '+nm);
  else if(r.left<SL||r.right>SR)out.push(c.dataset.sec+' 提示:出安全线 '+R+' '+nm);});});
const s=document.getElementById('sub');if(s.textContent&&s.getBoundingClientRect().top<1450)out.push('字幕太高');
if(s.textContent&&s.getBoundingClientRect().bottom>1640)out.push('字幕压到署名');
if(s.scrollWidth>s.clientWidth+2)out.push('字幕溢出');
return out;})()"""
