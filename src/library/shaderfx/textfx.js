/**
 * TextFX：竖屏字卡的入场 / 退场效果（canvas 2D，纯函数：同一 t 永远同一帧）。
 * 效果的种类参考了 React Bits 的文字动效清单，代码为自写实现（未复制其源码）。
 * 节奏按《动效节奏标准》：入场减速（ease-out）、退场加速（ease-in）、退场时长 = 入场的 70%，
 * 逐字错开总时长 < 0.5s，冲击类可过冲 15–25%，克制类不过冲。
 *
 * 通用参数：fx(ctx, text, x, y, t, {size, color, weight, t0, t1, dur, glow, font})
 *   t0 = 入场开始，t1 = 退场开始（不传就不退场），dur = 入场时长
 */
const SANS = '"Noto Sans SC","Noto Sans CJK SC","PingFang SC",sans-serif';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);              // 入场：减速
const easeIn = x => Math.pow(clamp(x), 3);                        // 退场：加速
const backOut = (x, s = 1.70158) => { x = clamp(x) - 1; return x * x * ((s + 1) * x + s) + 1; };  // 过冲
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function font(o) { return `${o.weight ?? 900} ${o.size ?? 80}px ${o.font ?? SANS}`; }
function chars(ctx, text, x, o) {
  ctx.font = font(o);
  const cs = [...text], ws = cs.map(c => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0);
  let cx = x - total / 2; const out = [];
  cs.forEach((c, i) => { out.push({c, x: cx + ws[i] / 2, w: ws[i], i}); cx += ws[i]; });
  return out;
}
function draw(ctx, c, x, y, o, alpha, extra = {}) {
  if (alpha <= 0.003) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = font(o); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (extra.blur) ctx.filter = `blur(${extra.blur.toFixed(1)}px)`;
  ctx.translate(x, y); if (extra.scale) ctx.scale(extra.scale, extra.scale); if (extra.rot) ctx.rotate(extra.rot);
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 24; ctx.fillStyle = extra.color ?? o.color ?? '#F4F6F2'; ctx.fillText(c, 0, 0);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 30; ctx.fillText(c, 0, 0); }
  ctx.shadowBlur = 0; ctx.fillText(c, 0, 0); ctx.restore();
}
// 入场进度 a（0→1）与退场进度 b（0→1）
function phases(t, o, n, i, stagger) {
  const dur = o.dur ?? 0.6, st = Math.min(stagger, 0.5 / Math.max(1, n - 1));
  const a = (t - (o.t0 ?? 0) - i * st) / dur;
  const b = o.t1 == null ? 0 : (t - o.t1 - (n - 1 - i) * st * 0.6) / (dur * 0.7);
  return [a, b];
}

/** 1. 模糊聚焦（克制、含蓄）：每个字从模糊和下沉里浮出来 */
export function blurIn(ctx, text, x, y, t, o = {}) {
  const cs = chars(ctx, text, x, o);
  for (const k of cs) {
    const [a, b] = phases(t, o, cs.length, k.i, 0.06);
    if (a <= 0) continue;
    const ia = easeOut(a), ob = easeIn(b);
    draw(ctx, k.c, k.x, y + (1 - ia) * 0.35 * (o.size ?? 80) - ob * 0.25 * (o.size ?? 80), o, ia * (1 - ob), {blur: (1 - ia) * 18 + ob * 14});
  }
}
/** 2. 逐字弹入（冲击、卡点）：从放大和上方砸下来，带 20% 过冲 */
export function splitPop(ctx, text, x, y, t, o = {}) {
  const cs = chars(ctx, text, x, o);
  for (const k of cs) {
    const [a, b] = phases(t, o, cs.length, k.i, 0.05);
    if (a <= 0) continue;
    const s = backOut(a, 2.2), ob = easeIn(b);
    const sc = (1.6 - 0.6 * s) * (1 - 0.3 * ob);
    draw(ctx, k.c, k.x, y - (1 - clamp(a * 1.4)) * 0.5 * (o.size ?? 80) + ob * 0.4 * (o.size ?? 80), o, clamp(a * 3) * (1 - ob), {scale: sc});
  }
}
/** 3. 乱码解码（揭秘、反转）：每个字先在候选字里乱跳，从左到右依次锁定 */
const POOL = '道德天地人反动无有虚实阴阳刚柔水火风雨方圆一二三万物生化变常名象';
export function decrypt(ctx, text, x, y, t, o = {}) {
  const cs = chars(ctx, text, x, o), dur = o.dur ?? 0.9, t0 = o.t0 ?? 0;
  for (const k of cs) {
    const lockAt = t0 + dur * (0.35 + 0.65 * (k.i + 1) / cs.length);
    if (t < t0) continue;
    const ob = o.t1 == null ? 0 : easeIn((t - o.t1) / (dur * 0.5));
    if (t < lockAt) {
      const flick = Math.floor(t * 24 + k.i * 7);
      const g = POOL[Math.floor(hash(flick + k.i * 31) * POOL.length)];
      draw(ctx, g, k.x, y, o, 0.55 * (1 - ob), {color: o.scramble ?? 'rgba(160,220,255,0.9)'});
    } else {
      const fl = clamp((t - lockAt) / 0.12);
      draw(ctx, k.c, k.x, y, o, (0.6 + 0.4 * fl) * (1 - ob), {scale: 1 + 0.12 * (1 - fl)});
    }
  }
}
/** 4. 流光扫过（确认、权威）：整句出现后，一道亮光从左扫到右 */
export function shiny(ctx, text, x, y, t, o = {}) {
  const t0 = o.t0 ?? 0, dur = o.dur ?? 0.5, a = easeOut((t - t0) / dur);
  if (a <= 0) return;
  const ob = o.t1 == null ? 0 : easeIn((t - o.t1) / (dur * 0.7));
  ctx.save(); ctx.font = font(o); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width, sz = o.size ?? 80;
  ctx.globalAlpha = a * (1 - ob); ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 24; ctx.fillStyle = o.color ?? '#F4F6F2'; ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  const sweep = ((t - t0 - dur * 0.6) / (o.sweep ?? 0.9));
  if (sweep > 0 && sweep < 1.4) {
    const sx = x - w / 2 - sz + (w + 2 * sz) * sweep;
    const g = ctx.createLinearGradient(sx - sz, 0, sx + sz, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, o.shine ?? 'rgba(255,250,235,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = g; ctx.fillText(text, x, y);
  }
  ctx.restore();
}
/** 5. 重影回声（余韵、强调）：主字落定，身后拖出几层渐淡的回声 */
export function echo(ctx, text, x, y, t, o = {}) {
  const t0 = o.t0 ?? 0, dur = o.dur ?? 0.5, a = easeOut((t - t0) / dur);
  if (a <= 0) return;
  const ob = o.t1 == null ? 0 : easeIn((t - o.t1) / (dur * 0.7));
  const sz = o.size ?? 80, n = o.layers ?? 4;
  for (let k = n; k >= 1; k--) {
    const spread = (1 - a) * 0.6 + 0.12 + 0.04 * Math.sin(t * 3 + k);
    ctx.save(); ctx.globalAlpha = (1 - ob) * a * 0.18 * (1 - k / (n + 1)); ctx.font = font(o); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = o.echoColor ?? o.color ?? '#F4F6F2'; ctx.translate(x, y + k * sz * spread * 0.35); ctx.scale(1 + k * 0.04, 1 + k * 0.04); ctx.fillText(text, 0, 0); ctx.restore();
  }
  draw(ctx, text, x, y, o, a * (1 - ob), {scale: 1 + 0.15 * (1 - a)});
}
/** 6. 焦点切换（对比、二选一）：几个词并排，焦点框在词之间移动，未聚焦的词模糊 */
export function trueFocus(ctx, words, x, y, t, o = {}) {
  ctx.font = font(o);
  const gap = (o.size ?? 80) * 0.8, ws = words.map(w => ctx.measureText(w).width), total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let cx = x - total / 2; const pos = ws.map(w => { const c = cx + w / 2; cx += w + gap; return c; });
  const t0 = o.t0 ?? 0, hold = o.hold ?? 0.8, k = Math.max(0, t - t0) / hold;
  const idx = Math.floor(k) % words.length, nxt = (idx + 1) % words.length, f = easeOut((k % 1 - 0.7) / 0.3);
  const ob = o.t1 == null ? 0 : easeIn((t - o.t1) / 0.35), ai = easeOut((t - t0) / 0.4);
  if (ai <= 0) return;
  words.forEach((w, i) => {
    const focus = i === idx ? 1 - f : i === nxt ? f : 0;
    draw(ctx, w, pos[i], y, {...o, color: (o.colors ?? [])[i] ?? o.color}, ai * (1 - ob) * (0.35 + 0.65 * focus), {blur: (1 - focus) * 7});
  });
  const fx = pos[idx] + (pos[nxt] - pos[idx]) * f, fw = ws[idx] + (ws[nxt] - ws[idx]) * f, sz = o.size ?? 80;
  const bx = fx - fw / 2 - sz * 0.25, by = y - sz * 0.7, bw = fw + sz * 0.5, bh = sz * 1.4, L = sz * 0.3;
  ctx.save(); ctx.globalAlpha = ai * (1 - ob); ctx.strokeStyle = o.frame ?? '#F5B83D'; ctx.lineWidth = 5; ctx.shadowColor = o.frame ?? '#F5B83D'; ctx.shadowBlur = 16;
  for (const [px, py, dx, dy] of [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(px + dx * L, py); ctx.lineTo(px, py); ctx.lineTo(px, py + dy * L); ctx.stroke();
  }
  ctx.restore();
}
export const TEXT_FX = {blurIn, splitPop, decrypt, shiny, echo, trueFocus};
