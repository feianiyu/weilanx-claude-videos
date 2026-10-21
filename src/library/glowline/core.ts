/**
 * 光点开场 glowline · 基础工具（canvas 2D）。
 * 全部是「时间 t（秒）的纯函数」：同一个 t 永远画出同一帧，可以在 Remotion 里逐帧渲染。
 * 用法：在 `GlowCanvas` 的 draw 回调里拿到 ctx，先 `bindCtx(g)`，之后所有绘制函数都画到这张画布上。
 */

export const W = 1080;
export const H = 1920;
export const CX = 540;
export const CY = 960;

/** 本风格的电光色板（深底用）。品牌色仍以 laoyang/theme.ts 为准。 */
export const GC = {
  blue: '#2433ff', // 电光蓝：光环、光晕主色
  blueDeep: '#1a2bff', // 冲刷带、白闪边
  cyan: '#19f0ff', // 青：冲刷带、径向擦除
  teal: '#1fe3b5', // 青绿：光环交替色
  magenta: '#d832ff', // 品红：雾团、碰撞闪光
  purple: '#7b2cff',
  green: '#2BE08A', // 品牌亮绿（深底 logo）
  greenDeep: '#0B5A2E', // 品牌深绿（浅底 logo）
};

/** 中文细体：LY Sans 300/400 是本目录 fonts.ts 注册的思源黑体 Light/Regular 子集 */
export const GL_SANS = `'LY Sans', 'Noto Sans CJK SC', 'Noto Sans SC', 'PingFang SC', sans-serif`;
export const font = (w: number, s: number) => `${w} ${s}px ${GL_SANS}`;

/* ───────── 数学 / 缓动 ───────── */
export type Ease = (u: number) => number;
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const smooth = (a: number, b: number, x: number) => {
  const u = clamp((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const lin: Ease = (u) => u;
export const eo3: Ease = (u) => 1 - Math.pow(1 - u, 3);
export const ei2: Ease = (u) => u * u;
export const ei3: Ease = (u) => u * u * u;
export const eio: Ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const eis: Ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u));
export const eoBack: Ease = (u) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

export type Vec = [number, number];
type KV = number | number[];

/** 关键帧插值：keys = [[t, v], ...]，v 可以是数字或数组（每段用同一个缓动，段与段之间速度归零） */
export function kf(t: number, keys: [number, number][], ease?: Ease): number;
export function kf(t: number, keys: [number, number[]][], ease?: Ease): number[];
export function kf(t: number, keys: [number, KV][], ease: Ease = eio): KV {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const u = ease((t - t0) / (t1 - t0 || 1));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, (v1 as number[])[j], u)) : lerp(v0, v1 as number, u);
    }
  }
  return keys[keys.length - 1][1];
}

/** 关键帧插值（Catmull-Rom）：经过每个点但速度连续，适合镜头；相邻两点相同则原地停住 */
export function kfSmooth(t: number, keys: [number, Vec][]): Vec {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t > keys[i + 1][0]) continue;
    const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
    const P = (j: number) => keys[Math.max(0, Math.min(keys.length - 1, j))][1];
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    if (p1[0] === p2[0] && p1[1] === p2[1]) return p1;
    const u2 = u * u, u3 = u2 * u;
    const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
  }
  return keys[keys.length - 1][1];
}

/* ───────── 颜色 ───────── */
export const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
export const mixHex = (a: string, b: string, u: number) => {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${A.map((x, i) => Math.round(lerp(x, B[i], u))).join(',')})`;
};

/* ───────── 画布绑定 ───────── */
let ctx: CanvasRenderingContext2D | null = null;
export const bindCtx = (g: CanvasRenderingContext2D) => {
  ctx = g;
};
export const c = (): CanvasRenderingContext2D => {
  if (!ctx) throw new Error('glowline: 先调用 bindCtx(ctx)');
  return ctx;
};
export const withCtx = (fn: () => void) => {
  const g = c();
  g.save();
  try {
    fn();
  } finally {
    g.restore();
  }
};
/** 每帧开头：清成纯色底并复位所有状态 */
export const clearFrame = (bg = '#000') => {
  const g = c();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
};

/* ───────── 路径 ───────── */
export const roundRectPath = (x: number, y: number, w: number, h: number, r: number) => {
  const g = c();
  r = Math.min(r, h / 2, w / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

/** 超椭圆族：e=1 圆，e=2 菱形，e>2 内凹四角星（e≈2.7 是星芒） */
export const superPath = (cx: number, cy: number, S: number, e: number, rot = 0, sx = 1, sy = 1, N = 180) => {
  const g = c();
  g.beginPath();
  for (let k = 0; k <= N; k++) {
    const [X, Y] = superPoint(cx, cy, S, e, rot, (Math.PI * 2 * k) / N, sx, sy);
    if (k) g.lineTo(X, Y);
    else g.moveTo(X, Y);
  }
  g.closePath();
};
export const superPoint = (cx: number, cy: number, S: number, e: number, rot: number, th: number, sx = 1, sy = 1): Vec => {
  const co = Math.cos(th), si = Math.sin(th);
  const x = S * Math.sign(co) * Math.pow(Math.abs(co), e) * sx;
  const y = S * Math.sign(si) * Math.pow(Math.abs(si), e) * sy;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
};

/** 带时间的路径：waypoints [[t, x, y], ...] → Catmull-Rom 致密折线，每点带时间（用来画"边走边画"的线头） */
export type TimedPt = [number, number, number];
export const buildTimedPath = (pts: TimedPt[], per = 10): TimedPt[] => {
  const out: TimedPt[] = [];
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < per; k++) {
      const u = k / per, u2 = u * u, u3 = u2 * u;
      const f = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * u + (2 * a - 5 * b + 4 * cc - d) * u2 + (-a + 3 * b - 3 * cc + d) * u3);
      out.push([lerp(p1[0], p2[0], u), f(p0[1], p1[1], p2[1], p3[1]), f(p0[2], p1[2], p2[2], p3[2])]);
    }
  }
  const L = pts[pts.length - 1];
  out.push([L[0], L[1], L[2]]);
  return out;
};
/** 取 t 时刻之前画出的那一段（最后一点插值到精确线头） */
export const pathUntil = (path: TimedPt[], t: number): TimedPt[] => {
  const res: TimedPt[] = [];
  for (let i = 0; i < path.length; i++) {
    if (path[i][0] <= t) {
      res.push(path[i]);
      continue;
    }
    if (i > 0) {
      const a = path[i - 1], b = path[i], u = (t - a[0]) / (b[0] - a[0]);
      res.push([t, lerp(a[1], b[1], u), lerp(a[2], b[2], u)]);
    }
    break;
  }
  return res;
};
