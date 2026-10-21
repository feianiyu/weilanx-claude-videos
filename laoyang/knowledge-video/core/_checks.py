"""页面内检查（qc.py 和 regress.py 共用）：中间区越界、字幕位置/溢出"""
CHECK = """(()=>{const out=[];
const box=e=>{const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(own){const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect();}
 if(e.children.length)return null;return e.getBoundingClientRect();};
document.querySelectorAll('#stage .scene').forEach(c=>{if(getComputedStyle(c).visibility==='hidden'||+c.style.opacity<0.5)return;
 c.querySelectorAll('*').forEach(e=>{if(e.closest('svg')&&e.tagName!=='svg')return;if(e.id==='endT')return;
  let op=1;for(let x=e;x&&x!==c;x=x.parentElement)op*=+getComputedStyle(x).opacity;if(op<0.3)return;
  const r=box(e);if(!r||!r.width||!r.height)return;const nm=(e.textContent||e.tagName).trim().slice(0,12);const R=[r.left,r.top,r.right,r.bottom].map(Math.round);
  if(r.left<104||r.right>976||r.top<590||r.bottom>1396)out.push(c.dataset.sec+' 越界(出底板) '+R+' '+nm);
  else if(r.left<150||r.right>930)out.push(c.dataset.sec+' 提示:出安全线160–920 '+R+' '+nm);});});
const s=document.getElementById('sub');if(s.textContent&&s.getBoundingClientRect().top<1450)out.push('字幕太高');
if(s.textContent&&s.getBoundingClientRect().bottom>1640)out.push('字幕压到署名');
if(s.scrollWidth>s.clientWidth+2)out.push('字幕溢出');
return out;})()"""
