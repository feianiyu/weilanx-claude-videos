/**
 * 光点开场 glowline · 绘制原件：光球、光点、星芒、立方体 logo、逐词浮现的字。
 * 所有函数画到 bindCtx 绑定的画布上。
 */
import {CUBE_PATHS} from '../laoyang/brand';
import {c, eis, eo3, font, GC, mixHex, rgba, seg, superPath, withCtx} from './core';

/** 软光球（径向渐变）。comp：'source-over' 颜色饱满不发白，'screen' / 'lighter' 叠加发亮 */
export const blob = (x: number, y: number, r: number, color: string, a: number, comp: GlobalCompositeOperation = 'screen') => {
  if (a <= 0 || r <= 0) return;
  withCtx(() => {
    const g = c();
    g.globalCompositeOperation = comp;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgba(color, a));
    gr.addColorStop(0.45, rgba(color, a * 0.9));
    gr.addColorStop(0.78, rgba(color, a * 0.32));
    gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  });
};

/** 实心光点（贯穿全片的那颗"白点"） */
export const dot = (x: number, y: number, r = 9, a = 1, color = '#ffffff', glow = 0) => {
  if (a <= 0) return;
  withCtx(() => {
    const g = c();
    g.globalAlpha = a;
    if (glow > 0) {
      g.shadowColor = color;
      g.shadowBlur = glow;
    }
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  });
};

export type SparkleOpts = {
  rot?: number; // 平面旋转
  flip?: number; // 绕竖轴的 3D 翻转角（cos 决定宽度，背面换紫色）
  a?: number;
  mode?: 'fill' | 'line'; // 玻璃实心 / 线稿
  onLight?: boolean; // 浅底上不发光、描边更深
  glow?: number; // 外发光强度 0–1
};
/** 四角星芒（玻璃质感）：e=2.7 的超椭圆 + 外发光 + 3D 翻转 */
export const sparkle = (x: number, y: number, size: number, o: SparkleOpts = {}) => {
  const {rot = 0, flip = 0, a = 1, mode = 'fill', onLight = false, glow = 1} = o;
  if (a <= 0 || size <= 0) return;
  const sx = Math.max(0.06, Math.abs(Math.cos(flip)));
  const back = Math.cos(flip) < 0;
  withCtx(() => {
    const g = c();
    g.globalAlpha = a;
    if (glow > 0 && !onLight) {
      withCtx(() => {
        g.globalCompositeOperation = 'lighter';
        g.filter = `blur(${size * 0.35}px)`;
        superPath(x, y, size * 1.05, 2.7, rot, sx, 1);
        g.fillStyle = rgba(GC.blue, 0.75 * glow);
        g.fill();
      });
    }
    superPath(x, y, size, 2.7, rot, sx, 1);
    if (mode === 'fill') {
      const gr = g.createLinearGradient(x - size * sx, y - size, x + size * sx, y + size);
      if (back) {
        gr.addColorStop(0, '#2a30ff');
        gr.addColorStop(0.5, '#7c5cff');
        gr.addColorStop(1, '#c43cff');
      } else {
        gr.addColorStop(0, '#2a35ff');
        gr.addColorStop(0.42, '#dfe4ff');
        gr.addColorStop(0.55, '#ffffff');
        gr.addColorStop(1, '#39d6ff');
      }
      g.fillStyle = gr;
      g.fill();
      g.lineWidth = Math.max(1.2, size * 0.04);
      g.strokeStyle = onLight ? 'rgba(60,60,255,0.8)' : 'rgba(170,190,255,0.9)';
      g.stroke();
    } else {
      const gr = g.createLinearGradient(x - size, y - size, x + size, y + size);
      gr.addColorStop(0, '#8a6bff');
      gr.addColorStop(0.5, '#ffffff');
      gr.addColorStop(1, '#a9f6ff');
      g.strokeStyle = gr;
      g.lineWidth = Math.max(1.5, size * 0.05);
      g.stroke();
    }
  });
};

/** 立方体 logo（几何直接取 laoyang/brand 的 CUBE_PATHS，与标准看板一致）。style 可以是颜色或渐变 */
let CUBE2D: Path2D[] | null = null;
export const cubeLogo = (x: number, y: number, size: number, style: string | CanvasGradient, a = 1, glow = 0) => {
  if (a <= 0) return;
  if (!CUBE2D) CUBE2D = CUBE_PATHS.map((d) => new Path2D(d));
  const k = size / 120;
  withCtx(() => {
    const g = c();
    g.globalAlpha = a;
    g.translate(x - 60 * k, y - 60 * k);
    g.scale(k, k);
    g.lineWidth = 12;
    g.lineCap = 'butt';
    g.lineJoin = 'miter';
    g.strokeStyle = style;
    if (glow) {
      g.shadowColor = typeof style === 'string' ? style : GC.green;
      g.shadowBlur = glow / k;
    }
    for (const p of CUBE2D as Path2D[]) g.stroke(p);
  });
};

export type Word = {s: string; tin: number; tout?: number; dim?: number};
export type WordsOpts = {weight?: number; color?: string; gap?: number; spacing?: number; dur?: number; outDur?: number; dimColor?: string | null};
/**
 * 逐词模糊浮现的一行字（居中于 cx）：每个词从模糊 + 透明 + 微微下沉中浮出；tout 起模糊淡出；dim 起变灰。
 * 中文建议 60–76 号、weight 300/400，比同位置的英文大 20% 左右才压得住画面。
 */
export const wordsLine = (t: number, words: Word[], cx: number, y: number, size: number, o: WordsOpts = {}) => {
  const {weight = 300, color = '#ffffff', gap = 0.28, spacing = 2, dur = 0.32, outDur = 0.22, dimColor = null} = o;
  withCtx(() => {
    const g = c();
    g.font = font(weight, size);
    g.letterSpacing = `${spacing}px`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    const ws = words.map((w) => g.measureText(w.s).width);
    const total = ws.reduce((p, q) => p + q, 0) + gap * size * (words.length - 1);
    let x = cx - total / 2;
    words.forEach((w, i) => {
      const ain = eo3(seg(t, w.tin, w.tin + dur));
      const aout = w.tout != null ? 1 - eis(seg(t, w.tout, w.tout + outDur)) : 1;
      const a = ain * aout;
      if (a > 0.003) {
        withCtx(() => {
          const b = (1 - ain) * 14 + (1 - aout) * 10;
          if (b > 0.3) g.filter = `blur(${b}px)`;
          g.globalAlpha *= a;
          let col = color;
          if (dimColor && w.dim != null) col = mixHex(color.startsWith('#') ? color : '#ffffff', dimColor, eis(seg(t, w.dim, w.dim + 0.15)));
          g.fillStyle = col;
          g.fillText(w.s, x, y + (1 - ain) * 12);
        });
      }
      x += ws[i] + gap * size;
    });
  });
};
