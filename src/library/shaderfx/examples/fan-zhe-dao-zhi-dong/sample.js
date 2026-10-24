/* 反者道之动 · 15 秒新版样片：彩雾 + Paper Shaders 背景 + TextFX 字卡 + 竖屏安全区 */
import {ShaderBG, noiseReady} from '../../shaderbg.js';
import {smokeRingFragmentShader} from '../../lib/shaders/smoke-ring.js';
import {godRaysFragmentShader} from '../../lib/shaders/god-rays.js';
import {neuroNoiseFragmentShader} from '../../lib/shaders/neuro-noise.js';
import {blurIn, splitPop, decrypt, shiny, echo} from '../../textfx.js';

const W = 1080, H = 1920, FPS = 30, DUR = 15;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const eo3 = x => 1 - Math.pow(1 - x, 3);
const F = t => Math.round(t * FPS);
const HIT = {c1: 3.5, d1: 4.0, fire: 7.0, storm: 13.0};
const NEON = {...MIST_PALETTES.ruby, bg: ['#030208', '#07050f', '#0d0818'], shadow: 'rgba(0,0,0,0.85)', body: [[24, 30, 70], [60, 20, 70], [16, 60, 64]]};
const FIRE = [0, 1, 2, 3, 4, 5].map(k => HIT.fire + k);
const drive = makeDrive({bands: window.BANDS, curve: [2.0, 1.4, 1.6], gain: [1.15, 1, 1.2],
  burst: [{from: F(HIT.d1), attack: 3, hold: 6, release: 70}, ...FIRE.map(s => ({from: F(s), attack: 3, hold: 0, release: 18, peak: 0.42}))],
  contract: [{from: F(HIT.c1), attack: 3, hold: 12, release: 3}, ...FIRE.map(s => ({from: F(s + 0.55), attack: 4, hold: 0, release: 10, peak: 0.35}))],
  twist: [{from: F(HIT.storm), attack: 40, hold: 20, release: 30, ease: 'in'}]});
const MCV = document.createElement('canvas'); MCV.width = W; MCV.height = H;
const LAYERS = (() => { const fog = document.createElement('canvas'); fog.width = W / 2; fog.height = H / 2; const dots = document.createElement('canvas'); dots.width = W; dots.height = H; return {fog, dots}; })();

await noiseReady;
// 背景着色器（半分辨率渲染再放大，柔和且快）
const ring = new ShaderBG(smokeRingFragmentShader, 540, 960);
ring.set({colorBack: '#00000000', colors: ['#ffe3a5', '#f5b83d', '#ff5fa2', '#ff5fa266'], noiseScale: 2, noiseIterations: 3, radius: 0.42, thickness: 0.7, innerShape: 0.7, scale: 0.9, fit: 'contain', speed: 0.8});
const rays = new ShaderBG(godRaysFragmentShader, 540, 960);
rays.set({offsetY: 0, colorBack: '#00000000', colorBloom: '#5a1a6e', colors: ['#ff47d4', '#ff8c00', '#ffffff', '#5fe3ff'], density: 0.45, spotty: 0.15, midIntensity: 0.5, midSize: 0.25, intensity: 0.85, bloom: 0.5, fit: 'contain', speed: 1.2});
const wind = new ShaderBG(neuroNoiseFragmentShader, 540, 960);
wind.set({colorFront: '#bff4ff', colorMid: '#2a7fb0', colorBack: '#000000', brightness: 0.04, contrast: 0.35, scale: 1.4, fit: 'none', speed: 2.2});

function mistScale(t) { return t < HIT.d1 ? 0.62 : 0.95; }
function bgFill(ctx) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, NEON.bg[0]); g.addColorStop(0.5, NEON.bg[1]); g.addColorStop(1, NEON.bg[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function layer(ctx, src, a, t, mode = 'lighter') { if (a <= 0.01) return; const cv = src.render(t); ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = mode; ctx.drawImage(cv, 0, 0, W, H); ctx.restore(); }
function band(ctx, cy, h, a) { if (a <= 0) return; const g = ctx.createLinearGradient(0, cy - h, 0, cy + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(0,0,0,${0.6 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, cy - h, W, h * 2); }
const SANS = '"Noto Sans SC","Noto Sans CJK SC",sans-serif';
function small(ctx, s, y, a, col = 'rgba(244,246,242,0.6)', size = 28) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = `500 ${size}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 16; ctx.fillText(s, 540, y); ctx.restore(); }
function brand(ctx) {   // 安全区顶部（y≈210），不进状态栏
  ctx.save();
  for (const [r, a] of [[14, 0.24], [8, 0.55], [4.5, 1]]) { ctx.globalAlpha = a; ctx.fillStyle = '#F5B83D'; ctx.beginPath(); ctx.arc(468, 212, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 0.85; ctx.fillStyle = '#E6E1D6'; ctx.font = `900 28px ${SANS}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('思想可见', 490, 213);
  ctx.restore();
}
const WORDS = [['曲则全', '弯，反而能保全'], ['枉则直', '屈，反而能伸直'], ['洼则盈', '低，反而能盛满'], ['敝则新', '旧，反而能出新'], ['少则得', '少，反而能得到'], ['多则惑', '多，反而会迷惑']];
const HOT = '#FFE3A5', PINK = '#FF5FA2', CYAN = '#5FE3FF', WHITE = '#F4F6F2';
const DIM = {120: 0.85, 121: 0.54, 122: 0.62, 123: 0.9};
function raysAlpha(t) {
  let a = 0;
  if (t >= HIT.d1) a = Math.max(a, 0.85 * Math.exp(-(t - HIT.d1) / 0.9) * seg(t, HIT.d1, HIT.d1 + 0.28), t < 7 ? 0.22 * seg(t, HIT.d1, HIT.d1 + 0.3) : 0);
  for (const s of FIRE) if (t >= s) a = Math.max(a, 0.5 * Math.exp(-(t - s) / 0.35) * seg(t, s, s + 0.17));
  return a * (1 - seg(t, 12.9, 13.3));
}
function render(ctx, t) {
  const f = Math.round(t * FPS);
  bgFill(ctx);
  // 环境层：道的烟环 → 神光 → 风
  layer(ctx, ring, 0.55 * (1 - seg(t, 3.3, 3.7)), t);
  layer(ctx, rays, raysAlpha(t), t);
  layer(ctx, wind, 0.55 * seg(t, 12.9, 13.4), t);
  // 主角：彩雾
  drawMist(MCV, LAYERS, {f, drive, palette: NEON, seed: 11, x: 540, y: 960, scale: mistScale(t), density: 1, background: false});
  ctx.save(); ctx.globalAlpha = DIM[f] ?? 1; ctx.drawImage(MCV, 0, 0); ctx.restore();
  const g = seg(t, HIT.c1 - 0.1, HIT.c1 + 0.1) * (1 - seg(t, HIT.d1 - 0.03, HIT.d1)); if (g > 0) { ctx.fillStyle = `rgba(0,0,0,${0.4 * g})`; ctx.fillRect(0, 0, W, H); }

  // ---------- 字（全部在 168–1330px 安全带） ----------
  if (t < 3.3) { band(ctx, 500, 200, 1 - seg(t, 3.0, 3.3));
    splitPop(ctx, '物极必反', 540, 440, t, {size: 150, color: HOT, glow: 'rgba(255,200,120,0.55)', t0: -1, t1: 3.05, dur: 0.3});
    blurIn(ctx, '这四个字，不是老子说的', 540, 600, t, {size: 56, color: WHITE, t0: -1, t1: 3.05, dur: 0.4}); }
  if (t >= 3.35 && t < 4.0) { band(ctx, 520, 110, 1); blurIn(ctx, '老子说的是——', 540, 520, t, {size: 64, color: WHITE, t0: 3.38, t1: 3.85, dur: 0.25}); }
  if (t >= 4.0 && t < 7.0) {
    band(ctx, 960, 170, 1 - seg(t, 6.75, 7));
    if (t < 4.85) decrypt(ctx, '反者道之动', 540, 960, t, {size: 150, color: HOT, glow: 'rgba(255,190,110,0.7)', t0: 4.0, dur: 0.8});
    else shiny(ctx, '反者道之动', 540, 960, t, {size: 150, color: HOT, t0: 4.85 - 0.5, dur: 0.01, t1: 6.75, sweep: 0.8});
    small(ctx, '——《道德经》第四十章', 1060, seg(t, 4.85, 5.1) * (1 - seg(t, 6.6, 6.9)), 'rgba(244,246,242,0.6)', 30);
    band(ctx, 1250, 80, seg(t, 4.9, 5.2) * (1 - seg(t, 6.6, 6.9)));
    blurIn(ctx, '事情走到头，就会往回走', 540, 1250, t, {size: 54, color: WHITE, t0: 4.95, t1: 6.75, dur: 0.4});
  }
  if (t >= 7 && t < 13) {
    band(ctx, 330, 70, 1); blurIn(ctx, '老子在第二十二章，一口气说了六个', 540, 330, t, {size: 44, color: WHITE, t0: 7.0, t1: 12.8, dur: 0.35});
    WORDS.forEach(([w, m], i) => { const a = HIT.fire + i; if (t < a || t >= a + 1) return;
      band(ctx, 1000, 190, 1);
      splitPop(ctx, w, 540, 940, t, {size: 170, color: i % 2 ? CYAN : PINK, glow: i % 2 ? 'rgba(95,227,255,0.6)' : 'rgba(255,95,162,0.6)', t0: a, t1: a + 0.8, dur: 0.28});
      blurIn(ctx, m, 540, 1110, t, {size: 52, color: WHITE, t0: a + 0.12, t1: a + 0.82, dur: 0.22}); });
  }
  if (t >= 13) {
    band(ctx, 960, 200, 1);
    echo(ctx, '飘风不终朝', 540, 880, t, {size: 120, color: CYAN, t0: 13.0, dur: 0.45});
    echo(ctx, '骤雨不终日', 540, 1040, t, {size: 120, color: CYAN, t0: 13.45, dur: 0.45});
    band(ctx, 1240, 70, seg(t, 13.9, 14.2));
    blurIn(ctx, '狂风刮不过一早上，暴雨下不完一整天', 540, 1235, t, {size: 44, color: WHITE, t0: 13.95, dur: 0.4});
    small(ctx, '——第二十三章', 1295, seg(t, 14.2, 14.5));
  }
  brand(ctx);
}
window.__ep = {render, DUR};
