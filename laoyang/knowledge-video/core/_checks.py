"""页面内检查（qc.py 和 regress.py 共用）：中间区越界、字幕位置/溢出"""
CHECK = """(()=>{const out=[];const v2=document.getElementById('v').classList.contains('v2'),v3=document.getElementById('v').classList.contains('v3'),B0=v3?1290:1396;const L0=v3?96:104,R0=v3?984:976,T0=v3?455:v2?530:590,SL=v3?100:v2?120:150,SR=v3?980:v2?960:930;
const box=e=>{const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(own){const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect();}
 if(e.children.length)return null;return e.getBoundingClientRect();};
document.querySelectorAll('#stage .scene, #stage .card').forEach(c=>{if(getComputedStyle(c).visibility==='hidden'||+c.style.opacity<0.5)return;
 c.querySelectorAll('*').forEach(e=>{if(e.closest('svg')&&e.tagName!=='svg')return;if(e.id==='endT')return;
  let op=1;for(let x=e;x&&x!==c;x=x.parentElement)op*=+getComputedStyle(x).opacity;if(op<0.3)return;
  const r=box(e);if(!r||!r.width||!r.height)return;const nm=(e.textContent||e.tagName).trim().slice(0,12);const R=[r.left,r.top,r.right,r.bottom].map(Math.round);
  if(r.left<L0||r.right>R0||r.top<T0||r.bottom>B0)out.push(c.dataset.sec+' 越界(出底板) '+R+' '+nm);
  else if(r.left<SL||r.right>SR)out.push(c.dataset.sec+' 提示:出安全线 '+R+' '+nm);});});
const s=document.getElementById('sub');if(s.textContent&&s.getBoundingClientRect().top<(v3?1370:1450))out.push('字幕太高');
if(s.textContent&&s.getBoundingClientRect().bottom>(v3?1540:1640))out.push('字幕压到署名');
if(s.scrollWidth>s.clientWidth+2)out.push('字幕溢出');
return out;})()"""
