/**
 * 光点开场 glowline · 招牌动效（参数化，任意一期都能调）。
 * 每个函数只负责"这一帧怎么画"，时间编排（什么时候出现、关键帧）由调用方用 kf / seg 算好再传进来。
 * 用法与"换场景演法"见同目录 README.md。
 */
import {blob, dot, sparkle} from './draw';
import {c, clamp, CX, CY, eo3, font, GC, H, lerp, mixHex, rgba, seg, smooth, superPath, superPoint, W, withCtx, type TimedPt, type Vec} from './core';
import {cubeLogo} from './draw';

/* ═════════ 1. 光盘 glowDisc：发光的椭圆"托盘"，一串从光点下方生出、向下推进变大 ═════════ */
let DISC: HTMLCanvasElement | null = null;
const discSprite = () => {
  if (DISC) return DISC;
  const cv = document.createElement('canvas');
  cv.width = 800;
  cv.height = 300;
  const g = cv.getContext('2d') as CanvasRenderingContext2D;
  g.filter = 'blur(22px)';
  const gr = g.createLinearGradient(0, 50, 0, 250);
  gr.addColorStop(0, 'rgba(20,30,255,0)');
  gr.addColorStop(0.4, 'rgba(30,45,255,0.8)');
  gr.addColorStop(0.75, 'rgba(30,170,255,1)');
  gr.addColorStop(1, 'rgba(120,255,255,1)');
  g.fillStyle = gr;
  g.beginPath();
  g.ellipse(400, 150, 320, 80, 0, 0, Math.PI * 2);
  g.fill();
  g.filter = 'blur(9px)';
  g.fillStyle = 'rgba(80,255,250,0.95)';
  g.beginPath();
  g.ellipse(400, 185, 250, 32, 0, 0, Math.PI * 2);
  g.fill();
  g.filter = 'blur(3px)';
  g.fillStyle = 'rgba(220,255,255,0.95)';
  g.beginPath();
  g.ellipse(400, 196, 170, 9, 0, 0, Math.PI * 2);
  g.fill();
  DISC = cv;
  return cv;
};
/** 一只光盘：中心 (x, y)、宽 w（高 = 0.375w），叠加发光 */
export const glowDisc = (x: number, y: number, w: number, a: number) => {
  if (a <= 0 || w <= 0) return;
  withCtx(() => {
    const g = c();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = a;
    g.drawImage(discSprite(), x - w / 2, y - w * 0.1875, w, w * 0.375);
  });
};

/* ═════════ 2. 冲刷 wash：顶部蓝光压下（topVeil）→ 一刀切成满屏青光、光带向下扫出（washBand） ═════════ */
export const topVeil = (h: number, color = GC.blueDeep) => {
  if (h <= 0) return;
  const g = c();
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, rgba(color, 1));
  gr.addColorStop(0.6, rgba(color, 0.55));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, h);
};
/** 光带上缘在 top：上缘青绿 → 青 → 蓝，下面一直铺到屏幕底 */
export const washBand = (top: number, band = 1500, colors: [string, string, string] = ['#22e6a0', '#19f0ff', GC.blueDeep]) => {
  const g = c();
  const gr = g.createLinearGradient(0, top, 0, top + band);
  gr.addColorStop(0, rgba(colors[0], 0));
  gr.addColorStop(0.08, rgba(colors[0], 0.9));
  gr.addColorStop(0.28, rgba(colors[1], 1));
  gr.addColorStop(0.62, rgba(colors[1], 1));
  gr.addColorStop(0.9, rgba(colors[2], 1));
  gr.addColorStop(1, rgba(colors[2], 1));
  g.fillStyle = gr;
  g.fillRect(0, top, W, H - top + 10);
};

/* ═════════ 3. 光环 ringStar：超椭圆描边 + 锥形渐变光晕（青/蓝交替旋转），e 从 1 拉到 2.7 = 圆 → 菱形 → 四角星 ═════════ */
export type RingOpts = {cx?: number; cy?: number; S: number; e: number; rot: number; spin: number; glowA: number; lineA: number; colors?: [string, string]};
export const ringStar = ({cx = CX, cy = CY, S, e, rot, spin, glowA, lineA, colors = [GC.blue, GC.teal]}: RingOpts) => {
  const g = c();
  const [b, t2] = colors;
  if (glowA > 0)
    withCtx(() => {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = glowA;
      g.filter = `blur(${20 * clamp(S / 400, 0.3, 1.2)}px)`;
      superPath(cx, cy, S * 1.02, e, rot);
      const cg = g.createConicGradient(spin, cx, cy);
      [[0, b, 1], [0.12, b, 0], [0.24, t2, 1], [0.38, b, 1], [0.5, b, 0], [0.63, t2, 1], [0.78, b, 1], [0.9, b, 0.1], [1, b, 1]].forEach(([p, col, a]) =>
        cg.addColorStop(p as number, rgba(col as string, a as number)),
      );
      g.strokeStyle = cg;
      g.lineWidth = 48 * clamp(S / 450, 0.3, 1.1);
      g.stroke();
    });
  if (lineA > 0)
    withCtx(() => {
      g.globalAlpha = lineA;
      superPath(cx, cy, S, e, rot);
      const cg = g.createConicGradient(spin, cx, cy);
      cg.addColorStop(0, 'rgba(120,140,255,0.9)');
      cg.addColorStop(0.25, 'rgba(160,255,230,0.75)');
      cg.addColorStop(0.5, 'rgba(110,120,255,0.35)');
      cg.addColorStop(0.75, 'rgba(170,190,255,0.9)');
      cg.addColorStop(1, 'rgba(120,140,255,0.9)');
      g.strokeStyle = cg;
      g.lineWidth = 2.2;
      g.stroke();
    });
};
/** 光环上的节点白点（n 个，均匀分布，phi 整体转角） */
export const ringNodes = (o: {cx?: number; cy?: number; S: number; e: number; rot: number; phi: number; n?: number; a: number; halo?: number}) => {
  const {cx = CX, cy = CY, S, e, rot, phi, n = 4, a, halo = 0} = o;
  for (let k = 0; k < n; k++) {
    const [x, y] = superPoint(cx, cy, S, e, rot, (k * Math.PI * 2) / n + phi);
    blob(x, y, 70, GC.blue, 0.9 * halo, 'lighter');
    dot(x, y, 10, a);
  }
};

/* ═════════ 4. 玻璃透镜 lensText：文字在玻璃球里折射、带色散，清晰区从中心向外扩 ═════════ */
let LENS_SRC: HTMLCanvasElement | null = null;
let LENS_OUT: HTMLCanvasElement | null = null;
/**
 * R 球半径；D 折射强度 0–1（0 = 完全清晰）；clearR 清晰区半径（从 0 涨到 > R 即"从中心化开"）。
 * 逐像素计算，只在 D > 0 的几帧调用（约 20 帧），其余时间直接 fillText。
 */
export const lensText = (o: {text: string; size?: number; weight?: number; spacing?: number; cx?: number; cy?: number; R: number; D: number; clearR: number}) => {
  const {text, size = 66, weight = 300, spacing = 4, cx = CX, cy = CY, R, D, clearR} = o;
  if (!LENS_SRC) {
    LENS_SRC = document.createElement('canvas');
    LENS_SRC.width = 1000;
    LENS_SRC.height = 1000;
    LENS_OUT = document.createElement('canvas');
    LENS_OUT.width = 1000;
    LENS_OUT.height = 1000;
  }
  const s = LENS_SRC.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D;
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.clearRect(0, 0, 1000, 1000);
  s.font = font(weight, size);
  s.letterSpacing = `${spacing}px`;
  s.textAlign = 'center';
  s.textBaseline = 'middle';
  s.fillStyle = '#fff';
  s.fillText(text, 500, 500);
  const half = Math.min(490, Math.ceil(R));
  const n = half * 2;
  const src = s.getImageData(0, 0, 1000, 1000).data;
  const o2 = (LENS_OUT as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
  const img = o2.createImageData(n, n);
  const d = img.data;
  const samp = (x: number, y: number) => {
    const xi = x | 0, yi = y | 0;
    if (xi < 0 || yi < 0 || xi >= 1000 || yi >= 1000) return 0;
    return src[(yi * 1000 + xi) * 4 + 3];
  };
  const band = size * 2.1; // 只处理文字所在的横带和边缘折返区
  for (let j = 0; j < n; j++) {
    const dy = j - half;
    if (Math.abs(dy) > band && Math.abs(dy) < half * 0.55) continue;
    for (let i = 0; i < n; i++) {
      const dx = i - half, r = Math.hypot(dx, dy);
      if (r >= R) continue;
      const nr = r / R;
      const w = smooth(clearR - 70, clearR + 50, r) * D;
      const ch = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const kk = 1 + (k - 1) * 0.07;
        let f;
        if (nr < 0.74) f = Math.pow(nr, 1 + 1.1 * w * kk) / Math.max(nr, 1e-4);
        else {
          const m = 0.74 - (nr - 0.74) * 2.4 * kk;
          f = lerp(1, Math.max(0.05, m) / nr, w);
        }
        ch[k] = samp(500 + dx * f, 500 + dy * f);
      }
      const p = (j * n + i) * 4;
      const mx = Math.max(ch[0], ch[1], ch[2]);
      d[p] = ch[0] * 0.75;
      d[p + 1] = ch[1];
      d[p + 2] = mx;
      d[p + 3] = mx;
    }
  }
  o2.clearRect(0, 0, 1000, 1000);
  o2.putImageData(img, 0, 0);
  const g = c();
  g.drawImage(LENS_OUT as HTMLCanvasElement, 0, 0, n, n, cx - half, cy - half, n, n);
  withCtx(() => {
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
    gr.addColorStop(0, 'rgba(30,60,255,0)');
    gr.addColorStop(0.8, rgba('#2040ff', 0.22 * D));
    gr.addColorStop(1, rgba('#60c8ff', 0.4 * D));
    g.fillStyle = gr;
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fill();
    g.filter = 'blur(3px)';
    g.strokeStyle = rgba('#e8fbff', 0.85 * D);
    g.lineWidth = 7;
    g.beginPath();
    g.arc(cx, cy, R * 0.9, Math.PI * 0.2, Math.PI * 0.75);
    g.stroke();
    g.lineWidth = 4;
    g.strokeStyle = rgba('#9feaff', 0.7 * D);
    g.beginPath();
    g.arc(cx, cy, R * 0.88, -Math.PI * 0.42, -Math.PI * 0.12);
    g.stroke();
  });
};

/* ═════════ 5. 膨胀白闪 inflateFlash：一个光点胀成带色散边的巨大白圆，盖满全屏 = 黑底切白底 ═════════ */
export const inflateFlash = (cx: number, cy: number, r: number, haloA: number) => {
  const g = c();
  blob(cx, cy, r * 1.6 + 75, '#2a3cff', 0.95 * haloA, 'lighter');
  withCtx(() => {
    g.globalCompositeOperation = 'lighter';
    g.filter = `blur(${r * 0.07}px)`;
    const cg = g.createConicGradient(-Math.PI / 2, cx, cy);
    cg.addColorStop(0, GC.blue);
    cg.addColorStop(0.12, '#c43cff');
    cg.addColorStop(0.28, GC.blue);
    cg.addColorStop(0.42, GC.blue);
    cg.addColorStop(0.55, GC.cyan);
    cg.addColorStop(0.78, GC.cyan);
    cg.addColorStop(0.92, '#2a6bff');
    cg.addColorStop(1, GC.blue);
    g.strokeStyle = cg;
    g.lineWidth = r * 0.16;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  });
  withCtx(() => {
    g.filter = `blur(${Math.max(0, r * 0.012)}px)`;
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(cx + r * 0.02, cy - r * 0.01, r * 0.95, 0, Math.PI * 2);
    g.fill();
  });
};
/** 径向擦除：从 (x, y) 长出的一团实色光（白底 → 青光 → 硬切黑底用） */
export const radialWipe = (x: number, y: number, r: number, color = GC.cyan) => {
  if (r <= 0) return;
  const g = c();
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(color, 1));
  gr.addColorStop(0.55, rgba(color, 0.95));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
};

/* ═════════ 6. 渐变胶囊 → 卡片：白 → 淡紫青 → 深蓝到青（三段 alpha 由调用方给） ═════════ */
export const morphPill = (x: number, y: number, w: number, h: number, r: number, stage: [number, number, number]) => {
  const g = c();
  const stops: [number, string][][] = [
    [[0, '#ffffff'], [0.86, '#ffffff'], [1, '#2df7f0']],
    [[0, '#a3a3ff'], [0.5, '#c9d4ff'], [1, '#8ffcf2']],
    [[0, '#0a1060'], [0.5, '#1f3bff'], [1, '#18f8f0']],
  ];
  stage.forEach((a, i) => {
    if (a <= 0) return;
    withCtx(() => {
      g.globalAlpha = a;
      const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      stops[i].forEach(([p, col]) => gr.addColorStop(p, col));
      g.fillStyle = gr;
      roundRectPathLocal(x - w / 2, y - h / 2, w, h, r);
      g.fill();
    });
  });
};
const roundRectPathLocal = (x: number, y: number, w: number, h: number, r: number) => {
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
/** 深蓝 → 电光蓝 → 青的大卡片（左下暗、右上亮），带一圈细白边 */
export const gradientCard = (x0: number, y0: number, x1: number, y1: number, r = 36) => {
  const g = c();
  roundRectPathLocal(x0, y0, x1 - x0, y1 - y0, r);
  const gr = g.createLinearGradient(x0, y1, x1, y0);
  gr.addColorStop(0, '#04051a');
  gr.addColorStop(0.22, '#0c128a');
  gr.addColorStop(0.48, GC.blueDeep);
  gr.addColorStop(0.75, '#1f86ff');
  gr.addColorStop(1, '#19f5ff');
  g.fillStyle = gr;
  g.fill();
  g.strokeStyle = 'rgba(220,230,255,0.55)';
  g.lineWidth = 2;
  g.stroke();
};

/* ═════════ 7. 彗尾 cometTrail：一个点沿轨迹运动时身后拖出的渐变粗线（头青、中蓝、尾品红） ═════════ */
export const cometTrail = (pos: (t: number) => Vec, t: number, o: {len?: number; tStart: number; tEnd: number; fade?: number; width?: number; n?: number}) => {
  const {len = 0.2, tStart, tEnd, fade = 1, width = 10, n = 22} = o;
  if (fade <= 0) return;
  const g = c();
  withCtx(() => {
    for (let i = 0; i < n; i++) {
      const ta = t - len * (i / n), tb = t - len * ((i + 1) / n);
      if (tb < tStart) break;
      const [xa, ya] = pos(Math.min(ta, tEnd));
      const [xb, yb] = pos(Math.min(tb, tEnd));
      g.strokeStyle = i < 7 ? mixHex(GC.cyan, '#3a46ff', i / 7) : mixHex('#3a46ff', '#d43cff', (i - 7) / (n - 7));
      g.globalAlpha = (1 - i / n) * fade;
      g.lineWidth = width * (1 - i / n) + 1.5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(xa, ya);
      g.lineTo(xb, yb);
      g.stroke();
    }
  });
};

/* ═════════ 8. 绳线串胶囊：一根带点头的灰线在白底上游走，碰到黑胶囊时从接触点扩散一团色光 ═════════ */
export type CapsuleOpts = {
  w?: number;
  h?: number;
  flash?: number; // 碰撞色光扩散 0–1
  flashCol?: string;
  contact?: Vec | null; // 接触点（胶囊局部坐标）
  contactA?: number; // 接触瞬间的小光团
  iconFlip?: number;
  sc?: number;
  textA?: number;
  blobMorph?: number; // 1 = 还是一团模糊渐变色，0 = 成形的黑胶囊
  textSize?: number;
};
export const capsule = (x: number, y: number, rot: number, label: string, o: CapsuleOpts = {}) => {
  const {w: PW = 620, h: PH = 180, flash = 0, flashCol = '#a020ff', contact = null, contactA = 0, iconFlip = 0, sc = 1, textA = 1, blobMorph = 0, textSize = 62} = o;
  const g = c();
  withCtx(() => {
    g.translate(x, y);
    g.rotate(rot);
    g.scale(sc, sc);
    if (blobMorph > 0)
      withCtx(() => {
        g.globalAlpha = blobMorph;
        g.filter = `blur(${18 * blobMorph}px)`;
        const w = lerp(PW, PW * 0.7, blobMorph), h = lerp(PH, PH * 0.53, blobMorph);
        roundRectPathLocal(-w / 2, -h / 2, w, h, h / 2);
        const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0);
        gr.addColorStop(0, '#d43cff');
        gr.addColorStop(0.45, '#3a2bff');
        gr.addColorStop(1, '#19f5ff');
        g.fillStyle = gr;
        g.fill();
      });
    const solid = 1 - blobMorph;
    if (solid <= 0) return;
    g.globalAlpha = solid;
    roundRectPathLocal(-PW / 2, -PH / 2, PW, PH, PH / 2);
    g.fillStyle = '#0b0b0d';
    g.fill();
    if (contact && (flash > 0 || contactA > 0))
      withCtx(() => {
        roundRectPathLocal(-PW / 2, -PH / 2, PW, PH, PH / 2);
        g.clip();
        const rr = 90 + 330 * flash;
        const a = Math.max(contactA, flash);
        blob(contact[0], contact[1], rr, flashCol, a, 'source-over');
        blob(contact[0], contact[1], rr * 0.6, flashCol, a, 'source-over');
      });
    const gx = -PW / 2 + 110;
    withCtx(() => {
      g.globalAlpha = solid * textA;
      sparkle(gx, 0, 26, {flip: iconFlip, glow: 0.6});
      g.font = font(400, textSize);
      g.letterSpacing = '4px';
      g.textBaseline = 'middle';
      g.textAlign = 'left';
      g.fillStyle = 'rgba(236,236,244,0.92)';
      g.fillText(label, gx + 62, 2);
    });
  });
};
/** 碰撞后的回弹缩放（t0 = 碰撞时刻） */
export const bump = (t: number, t0: number) => {
  const u = t - t0;
  return u > 0 && u < 0.6 ? 0.05 * Math.sin(u * 18) * Math.exp(-u * 7) : 0;
};
/** 画出已走过的绳线；toS 把世界坐标换成屏幕坐标（镜头） */
export const stringLine = (seen: TimedPt[], toS: (p: Vec) => Vec, color = '#7a7a7a', width = 2.6) => {
  if (seen.length < 2) return;
  const g = c();
  withCtx(() => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.beginPath();
    seen.forEach((p, i) => {
      const [x, y] = toS([p[1], p[2]]);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.stroke();
  });
};

/* ═════════ 9. 描边轨迹 track：一个点画出一条带发光的线（例：画出圆角框），右侧渐隐 ═════════ */
export type Track = {pts: [number, number, number][]; L: number}; // [累计弧长, x, y]
export const makeTrack = (pts: Vec[]): Track => {
  let L = 0;
  const out: [number, number, number][] = [[0, pts[0][0], pts[0][1]]];
  for (let i = 1; i < pts.length; i++) {
    L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    out.push([L, pts[i][0], pts[i][1]]);
  }
  return {pts: out, L};
};
/**
 * 画到弧长 s 为止。lead：前 lead 长度是"引线"，只跟着点头短短一截（像点在飞）；fadeR 0–1 让 x 在 fadeX 区间的部分渐隐。
 * glow：线下一层模糊的蓝 → 青绿发光。tint：x < tintX 的部分渐变成紫蓝。
 */
export const drawTrack = (tr: Track, s: number, o: {lead?: number; fadeR?: number; fadeX?: Vec; glowBlur?: number; tint?: number; tintX?: number; head?: boolean; alpha?: number} = {}) => {
  const {lead = 450, fadeR = 0, fadeX = [520, 880], glowBlur = 12, tint = 0, tintX = 420, head = true, alpha = 1} = o;
  const pts = tr.pts.filter((p) => p[0] <= s);
  if (pts.length < 2) return;
  const g = c();
  withCtx(() => {
    g.globalCompositeOperation = 'lighter';
    g.filter = `blur(${glowBlur}px)`;
    const gr = g.createLinearGradient(200, 0, 930, 0);
    gr.addColorStop(0, rgba('#3a2cff', 0.9));
    gr.addColorStop(0.6, rgba(GC.blue, 0.85));
    gr.addColorStop(1, rgba(GC.teal, 0.9));
    g.strokeStyle = gr;
    g.lineWidth = 16;
    g.globalAlpha *= alpha;
    g.beginPath();
    pts.filter((p) => p[0] > lead + 20).forEach((p, i) => (i ? g.lineTo(p[1], p[2]) : g.moveTo(p[1], p[2])));
    g.stroke();
  });
  const base = g.globalAlpha;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i], q = pts[i - 1];
    const age = (s - p[0]) / 900;
    let a = 1;
    if (p[0] < lead) a = 1 - clamp((s - p[0]) / 90);
    a *= 1 - fadeR * smooth(fadeX[0], fadeX[1], p[1]);
    if (a <= 0.01) continue;
    g.strokeStyle = p[1] < tintX ? mixHex('#ffffff', '#7a6cff', tint) : '#ffffff';
    g.globalAlpha = base * alpha * a * (0.55 + 0.45 * clamp(1 - age));
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(q[1], q[2]);
    g.lineTo(p[1], p[2]);
    g.stroke();
  }
  g.globalAlpha = base;
  if (head) {
    const h = pts[pts.length - 1];
    dot(h[1], h[2], 8, alpha);
  }
};
/** 圆角框轨迹（含从左侧飞入的引线与右上角小回钩），本期「融会贯通」用 */
export const roundedFrameTrack = (o: {left?: number; right?: number; top?: number; bottom?: number; leadFrom?: number; hookR?: number} = {}) => {
  const {left = 130, right = 923, top = 855, bottom = 1085, leadFrom = 420, hookR = 53} = o;
  const r = (bottom - top) / 2;
  const hx = right - hookR, hy = top + hookR;
  const pts: Vec[] = [];
  for (let x = leadFrom; x <= hx; x += 15) pts.push([x, hy + hookR]);
  for (let a = 0; a <= 180; a += 6) {
    const th = Math.PI / 2 - (a * Math.PI) / 180;
    pts.push([hx + hookR * Math.cos(th), hy + hookR * Math.sin(th)]);
  }
  const lx = left + r, my = top + r;
  for (let x = hx; x >= lx; x -= 15) pts.push([x, top]);
  for (let a = 0; a <= 180; a += 5) {
    const th = -Math.PI / 2 - (a * Math.PI) / 180;
    pts.push([lx + r * Math.cos(th), my + r * Math.sin(th)]);
  }
  for (let x = lx; x <= hx - 10; x += 15) pts.push([x, bottom]);
  return makeTrack(pts);
};

/** 逐字打出（每字模糊淡入），居中于 cx */
export const typeOn = (text: string, cx: number, y: number, size: number, t: number, t0: number, o: {step?: number; dur?: number; weight?: number; spacing?: number; blur?: number; color?: string} = {}) => {
  const {step = 0.11, dur = 0.13, weight = 400, spacing = 6, blur = 0, color = '#ffffff'} = o;
  const g = c();
  withCtx(() => {
    g.font = font(weight, size);
    g.letterSpacing = `${spacing}px`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    const chars = Array.from(text);
    let x = cx - g.measureText(text).width / 2;
    chars.forEach((ch, i) => {
      const a = eo3(seg(t, t0 + i * step, t0 + i * step + dur));
      const cw = g.measureText(ch).width + spacing;
      if (a > 0)
        withCtx(() => {
          g.globalAlpha *= a;
          if (a < 1 || blur > 0.3) g.filter = `blur(${(1 - a) * 8 + blur}px)`;
          g.fillStyle = color;
          g.fillText(ch, x, y);
        });
      x += cw;
    });
  });
};

/* ═════════ 10. 雾团 blobCluster：几团饱和色光绕一个中心转，跟着最新出现的词走 ═════════ */
export type BlobDef = {c: string; r: number; w: number; ph: number; k: number};
export const BLOBS_DEFAULT: BlobDef[] = [
  {c: GC.blue, r: 220, w: 1.3, ph: 0.0, k: 1.0},
  {c: GC.magenta, r: 165, w: -1.6, ph: 2.1, k: 1.1},
  {c: '#18d4ff', r: 160, w: 1.9, ph: 4.0, k: 0.9},
  {c: '#2a3cff', r: 175, w: -1.1, ph: 1.0, k: 1.2},
];
/** center 团中心；spread 散开半径；A 总透明度；grow 尺寸倍数；t0 起转时刻；inAt[i] 第 i 团出现时刻 */
export const blobCluster = (t: number, o: {center: Vec; spread: number; A: number; grow: number; t0: number; blobs?: BlobDef[]; inAt?: number[]; comp?: GlobalCompositeOperation}) => {
  const {center, spread, A, grow, t0, blobs = BLOBS_DEFAULT, inAt, comp = 'source-over'} = o;
  blobs.forEach((b, i) => {
    const ang = b.ph + b.w * (t - t0) * 1.4;
    const x = center[0] + Math.cos(ang) * spread * b.k;
    const y = center[1] + Math.sin(ang) * spread * b.k * 0.75;
    const ai = inAt ? seg(t, inAt[i], inAt[i] + 0.3) : 1;
    blob(x, y, b.r * grow * 0.85, b.c, 0.92 * A * ai, comp);
  });
};

/* ═════════ 11. logo 显形 logoReveal：立方体先以蓝青玻璃质感弹出，再亮成品牌绿 ═════════ */
export const logoReveal = (t: number, t0: number, o: {x?: number; y?: number; size?: number; color?: string; glow?: number} = {}) => {
  const {x = CX, y = CY, size = 190, color = GC.green, glow = 18} = o;
  if (t < t0) return;
  const k = (a: number, b: number) => seg(t, t0 + a, t0 + b);
  const sc = t < t0 + 0.26 ? lerp(0.55, 1.07, eo3(k(0, 0.26))) : lerp(1.07, 1, eo3(k(0.26, 0.5)));
  const glass = k(0, 0.1) * (1 - k(0.36, 0.56));
  const green = k(0.34, 0.56);
  const s = size * sc;
  if (glass > 0) {
    const gr = c().createLinearGradient(x - 80, y - 80, x + 80, y + 80);
    gr.addColorStop(0, '#9ff6ff');
    gr.addColorStop(0.5, '#4a5cff');
    gr.addColorStop(1, '#d76bff');
    cubeLogo(x, y, s, gr, glass, 0);
  }
  cubeLogo(x, y, s, color, green, glow);
};

/* ═════════ 12. 逐字加粗扫光 boldSweep：底部小字，一个"粗体高光"从左往右扫过，循环 ═════════ */
export const boldSweep = (text: string, cx: number, y: number, size: number, t: number, t0: number, o: {color?: string; alpha?: number; speed?: number; pause?: number; width?: number} = {}) => {
  const {color = '#f4f4f6', alpha = 1, speed = 0.11, pause = 16, width = 1.6} = o;
  if (alpha <= 0) return;
  const g = c();
  withCtx(() => {
    g.globalAlpha = alpha;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.font = font(500, size);
    g.letterSpacing = '3px';
    const chars = Array.from(text);
    const ws = chars.map((ch) => g.measureText(ch).width);
    let x = cx - ws.reduce((p, q) => p + q, 0) / 2;
    const hi = (((t - t0) / speed) % (chars.length + pause) + (chars.length + pause)) % (chars.length + pause);
    chars.forEach((ch, i) => {
      g.font = font(Math.abs(i - hi) < width ? 900 : 500, size);
      g.fillStyle = color;
      g.fillText(ch, x, y);
      x += ws[i];
    });
  });
};
