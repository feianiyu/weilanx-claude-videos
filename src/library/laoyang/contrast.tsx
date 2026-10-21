import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, rand} from '../anim';
import {L, LF, LL} from './theme';

/**
 * 「疏密 / 快慢 / 色彩」对比组件：
 *   Nebula 星云（极密、极慢，可整体收缩撞进一个点）
 *   BigNumber 巨大数字（极疏，金，可抖动、跳位、色散）
 *   KpiGrid 36 格滚动数字（极密、极快，可从底部逐行退潮变灰）
 *   SlamBand 横切实心色带（文字从右侧甩入替换）
 *   CircleWipe 圆形擦除换底（面积线性增长，亮度平滑过渡，不闪白）
 *   FallingDots 浅底上缓慢飘落的灰点（上一幕的残渣）
 * 都是帧号 f 的纯函数；粒子用 canvas 画，位置由 rand(seed) 预先算好。
 */

const eo = (t: number, p = 3) => 1 - Math.pow(1 - clamp01(t), p);
const ei = (t: number, p = 3) => Math.pow(clamp01(t), p);
const gauss = (s: number) => (rand(s) + rand(s + 0.31) + rand(s + 0.67) + rand(s + 0.91) - 2) / 2;

/** canvas 图层：每帧整张重画 */
export const CanvasLayer: React.FC<{f: number; draw: (g: CanvasRenderingContext2D) => void; w?: number; h?: number; style?: React.CSSProperties}> = ({f, draw, w = 1080, h = 1920, style}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, w, h);
    draw(g);
  });
  return <canvas ref={ref} width={w} height={h} data-f={f} style={{position: 'absolute', left: 0, top: 0, ...style}} />;
};

/* ---------------- 星云 ---------------- */

type Star = {a: number; r: number; jx: number; jy: number; size: number; alpha: number; col: number; tx: number; ty: number; spin: number};
const N_STARS = 13000;
let STARS: Star[] | null = null;
const stars = () => {
  if (STARS) return STARS;
  STARS = Array.from({length: N_STARS}, (_, i) => {
    const s = i * 7.13 + 1;
    const c = rand(s + 5);
    return {
      a: rand(s) * Math.PI * 2,
      r: Math.pow(rand(s + 1), 0.55) * 640,
      jx: gauss(s + 2) * 120,
      jy: gauss(s + 3) * 160,
      size: 1 + rand(s + 4) * 2.2,
      alpha: 0.3 + rand(s + 6) * 0.65,
      col: c < 0.03 ? 1 : c < 0.05 ? 2 : 0, // 0 灰绿 1 亮绿 2 金
      tx: rand(s + 7),
      ty: rand(s + 8),
      spin: 0.6 + rand(s + 9) * 0.8,
    };
  });
  return STARS;
};
const STAR_COL = ['159,184,173', '43,224,138', '245,166,35'];

/** 星云某个元素在第 f 帧的旋转角（内圈快、外圈慢的差速旋转） */
export const nebulaAngle = (a: number, r: number, f: number, spin = 1) => a + f * 0.0022 * spin * (0.5 + 140 / (r + 120));

/**
 * 星云：cx, cy 中心；contract 0–1 收缩进度（0 正常漂浮，1 全部撞到 target 矩形里），
 * 收缩时粒子拖出越来越长的轨迹、颜色从灰绿变金；glow 中心光晕强度。
 */
export const Nebula: React.FC<{f: number; contract?: number; cx?: number; cy?: number; target?: [number, number, number, number]; glow?: number; opacity?: number}> = ({f, contract = 0, cx = 540, cy = 900, target = [110, 820, 760, 250], glow = 1, opacity = 1}) => {
  const draw = (g: CanvasRenderingContext2D) => {
    g.globalAlpha = opacity;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, 820);
    rg.addColorStop(0, `rgba(70,150,115,${0.5 * glow * (1 - contract)})`);
    rg.addColorStop(0.45, `rgba(30,80,60,${0.25 * glow * (1 - contract)})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 1080, 1920);
    g.globalCompositeOperation = 'lighter';
    const c = contract;
    const ce = ei(c, 2.6);
    const trail = c > 0.02;
    const pos = (s: Star, k: number, ff: number) => {
      const ang = nebulaAngle(s.a, s.r, ff, s.spin) + k * 2.4;
      const ox = cx + Math.cos(ang) * s.r * 0.95 + s.jx;
      const oy = cy + Math.sin(ang) * s.r * 1.25 + s.jy;
      const tx = target[0] + s.tx * target[2];
      const ty = target[1] + s.ty * target[3];
      return [ox + (tx - ox) * k, oy + (ty - oy) * k];
    };
    const ceP = ei(clamp01(c - 0.06), 2.6);
    for (const s of stars()) {
      const [x, y] = pos(s, ce, f);
      // 收缩时颜色往金色走
      const col = s.col === 0 && c > 0.3 ? (rand(s.a * 100) < (c - 0.3) * 1.4 ? 2 : 0) : s.col;
      const a = s.alpha * (1 - 0.3 * c);
      if (trail) {
        const [px, py] = pos(s, ceP, f - 1);
        g.strokeStyle = `rgba(${STAR_COL[col]},${a * 0.7})`;
        g.lineWidth = s.size * (1 + c);
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(x, y);
        g.stroke();
      } else {
        g.fillStyle = `rgba(${STAR_COL[col]},${a})`;
        g.fillRect(x - s.size / 2, y - s.size / 2, s.size, s.size);
      }
    }
    // 关系线：若隐若现
    if (c < 0.5) {
      g.lineWidth = 1;
      for (let i = 0; i < 220; i++) {
        const s = stars()[i * 37];
        const [x, y] = pos(s, ce, f);
        const tw = 0.5 + 0.5 * Math.sin(f / 40 + i);
        g.strokeStyle = `rgba(159,184,173,${0.09 * tw * (1 - c * 2)})`;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + gauss(i + 0.5) * 220, y + gauss(i + 0.8) * 220);
        g.stroke();
      }
    }
  };
  return <CanvasLayer f={f} draw={draw} />;
};

/** 漂在星云里的小字（随星云旋转，收缩时被吸进 target 中心并淡出） */
export const NebulaWords: React.FC<{f: number; words: string[]; at: number; every?: number; contract?: number; cx?: number; cy?: number; target?: [number, number]}> = ({f, words, at, every = 7, contract = 0, cx = 540, cy = 900, target = [480, 940]}) => (
  <>
    {words.map((w, i) => {
      const a0 = (i / words.length) * Math.PI * 2 + rand(i + 40);
      const r = 200 + rand(i + 41) * 360;
      const ang = nebulaAngle(a0, r, f);
      const k = ei(contract, 2.6);
      const x = cx + Math.cos(ang) * r * 0.95;
      const y = cy + Math.sin(ang) * r * 1.2;
      const px = x + (target[0] - x) * k;
      const py = y + (target[1] - y) * k;
      const on = clamp01((f - at - i * every) / 14);
      const tw = 0.55 + 0.45 * Math.sin(f / 30 + i * 2.1);
      const o = on * tw * (1 - clamp01(contract * 1.6));
      if (o <= 0.01) return null;
      return (
        <div key={w} style={{position: 'absolute', left: px - 80, top: py - 16, width: 160, textAlign: 'center', fontFamily: LF.sans, fontWeight: 500, fontSize: 28 + rand(i + 42) * 14, letterSpacing: 3, color: `rgba(200,220,210,${o})`, filter: on < 1 ? `blur(${(1 - on) * 6}px)` : undefined}}>
          {w}
        </div>
      );
    })}
  </>
);

/** 金色收束轨迹：数字出现后，周围留一圈极淡的、缓慢往数字里流的细线 */
export const ConvergeStreaks: React.FC<{f: number; at: number; out?: number; cx?: number; cy?: number; color?: string}> = ({f, at, out, cx = 430, cy = 990, color = '245,166,35'}) => {
  const t = f - at;
  if (t < 0) return null;
  const o = clamp01(t / 10) * (out === undefined ? 1 : 1 - clamp01((f - out) / 14));
  if (o <= 0) return null;
  const draw = (g: CanvasRenderingContext2D) => {
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 700; i++) {
      const a = rand(i + 900) * Math.PI * 2;
      const r0 = 320 + rand(i + 901) * 900;
      const ph = (rand(i + 902) + t * (0.004 + rand(i + 903) * 0.006)) % 1; // 缓慢往里流
      const rr = r0 * (1 - ph * 0.7);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * 1.1;
      const len = 0.06 + rand(i + 904) * 0.08;
      g.strokeStyle = `rgba(${color},${(0.04 + rand(i + 905) * 0.12) * o * Math.sin(Math.PI * ph)})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (cx - x) * len, y + (cy - y) * len);
      g.stroke();
    }
  };
  return <CanvasLayer f={f} draw={draw} />;
};

/* ---------------- 巨大数字 ---------------- */

/**
 * 巨大数字：left 左对齐（编辑式排版），value 显示的数（字符串），unit 小一号的单位；
 * at 重拍帧（放大 1.22→1 砸下、亮一下）；jitter 0–1 抖动 / 色散强度；out 起向前放大、模糊、淡出（裂开）。
 */
export const BigNumber: React.FC<{f: number; at: number; value: string; unit?: string; x?: number; y?: number; size?: number; color?: string; jitter?: number; out?: number}> = ({f, at, value, unit = '%', x = 80, y = 760, size: size0 = 360, color = L.gold, jitter = 0, out}) => {
  // 位数变多时整体缩小，保证不出右边界（「98.7」4 位按 size0，「103.5」5 位约 0.8 倍）
  const size = size0 * Math.min(1, 4.3 / Math.max(4.3, value.replace('.', '').length + 0.3 + 0.9));
  const t = f - at;
  if (t < 0) return null;
  const slam = eo(t / 7, 3);
  const o = out === undefined ? 0 : clamp01((f - out) / 6);
  if (o >= 1) return null;
  const s = 1.22 - 0.22 * slam + o * 0.6;
  const flash = Math.exp(-t / 5);
  const breathe = 0.5 + 0.5 * Math.sin(t / 22);
  const jx = jitter * (rand(Math.floor(f / 2) + 7) - 0.5) * 26;
  const jy = jitter * (rand(Math.floor(f / 2) + 9) - 0.5) * 10;
  const split = jitter * 10;
  const glyph = (dx: number, c: string, op: number, blend?: React.CSSProperties['mixBlendMode']) => (
    <div style={{position: 'absolute', left: dx, top: 0, whiteSpace: 'nowrap', fontFamily: LF.num, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.04, color: c, opacity: op, mixBlendMode: blend, fontVariantNumeric: 'tabular-nums'}}>
      {value}
      <span style={{fontSize: size * 0.36, letterSpacing: 0}}>{unit}</span>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: x + jx, top: y + jy, transform: `scale(${s})`, transformOrigin: '30% 55%', opacity: 1 - o, filter: o > 0 ? `blur(${o * 24}px)` : undefined}}>
      {split > 0.5 && glyph(-split, '#ff3d55', 0.55 * jitter, 'screen')}
      {split > 0.5 && glyph(split, '#2BE08A', 0.55 * jitter, 'screen')}
      <div style={{position: 'relative', textShadow: `0 0 ${30 + 30 * breathe + 40 * flash}px rgba(245,166,35,${0.35 + 0.25 * breathe + 0.3 * flash})`}}>{glyph(0, flash > 0.5 ? '#ffd58a' : color, 1)}</div>
    </div>
  );
};

/* ---------------- 滚动数字格子 ---------------- */

/**
 * 36 格滚动数字：cols × rows 铺满 y0–y1；at 起各格从中心往外依次弹出；
 * 数字更新得越来越快（period 从 8 帧加速到 1 帧），一路涨过 100；
 * grayAt 起从最底一行往上、每 rowStep 帧一行褪成灰色并停住（退潮）。
 */
export const KpiGrid: React.FC<{f: number; at: number; end: number; labels: string[]; cols?: number; y0?: number; y1?: number; grayAt?: number; rowStep?: number; pulse?: number; freezeFrom?: number}> = ({f, at, end, labels, cols = 4, y0 = 200, y1 = 1720, grayAt, rowStep = 7, pulse = 0, freezeFrom}) => {
  if (f < at) return null;
  const ff = freezeFrom !== undefined && f >= freezeFrom ? freezeFrom : f;
  const rows = labels.length;
  const cw = 1080 / cols;
  const ch = (y1 - y0) / rows;
  const L0 = end - at;
  const steps = (fr: number) => {
    const u = Math.max(0, fr - at);
    return Math.floor((u / 8) * (1 + 3.2 * (u / L0)));
  };
  const cells: React.ReactNode[] = [];
  const streaks = (g: CanvasRenderingContext2D) => {
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const grayed = grayAt !== undefined && ff >= grayAt + (rows - 1 - j) * rowStep;
        if (grayed) continue;
        const sp = 18 + 40 * clamp01((ff - at) / L0);
        for (let m = 0; m < 4; m++) {
          const len = 30 + rand(k * 9 + m) * 90;
          const x = i * cw + ((rand(k * 9 + m + 1) * cw + ff * sp * (0.6 + rand(k + m) * 0.8)) % (cw + len)) - len;
          const y = y0 + j * ch + 12 + rand(k * 9 + m + 2) * (ch - 24);
          g.fillStyle = `rgba(43,224,138,${0.06 + rand(k * 9 + m + 3) * 0.12})`;
          g.fillRect(Math.max(i * cw + 4, x), y, Math.min(len, (i + 1) * cw - 4 - Math.max(i * cw + 4, x)), 1 + rand(k + m * 3) * 2);
        }
      }
  };
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      // 从中心往外依次弹出
      const d = Math.hypot(i - (cols - 1) / 2, j - (rows - 1) / 2);
      const pop = eo((f - at - d * 1.4) / 6);
      if (pop <= 0) continue;
      const gStart = grayAt === undefined ? Infinity : grayAt + (rows - 1 - j) * rowStep;
      const gray = clamp01((ff - gStart) / 6);
      const frozenAt = Math.min(ff, gStart);
      const hot = rand(k + 300) < 0.82;
      const st = steps(frozenAt);
      const v = 90 + rand(k + 301) * 6 + st * (0.1 + rand(k + 302) * 0.25) * (hot ? 1 : 0.15);
      const fresh = hot && gray < 1 && steps(frozenAt) !== steps(frozenAt - 2);
      const greenA = (hot ? 0.07 + 0.1 * rand(k + 303) : 0.02) * (1 - gray) + 0.05 * pulse * (1 - gray);
      cells.push(
        <div key={k} style={{position: 'absolute', left: i * cw + 3, top: y0 + j * ch + 3, width: cw - 6, height: ch - 6, background: gray > 0 ? `rgba(${Math.round(43 + (70 - 43) * gray)},${Math.round(224 + (76 - 224) * gray)},${Math.round(138 + (72 - 138) * gray)},${greenA + 0.08 * gray})` : `rgba(43,224,138,${greenA})`, transform: `scale(${0.7 + 0.3 * pop})`, opacity: pop}}>
          <div style={{position: 'absolute', left: 16, top: 12, fontFamily: LF.sans, fontWeight: 500, fontSize: 20, letterSpacing: 3, color: gray > 0.5 ? 'rgba(140,147,142,0.6)' : 'rgba(43,224,138,0.65)'}}>{labels[j]}</div>
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: 38,
              whiteSpace: 'nowrap',
              fontFamily: LF.num,
              fontWeight: 800,
              fontSize: hot ? 74 : 58,
              letterSpacing: -3,
              fontVariantNumeric: 'tabular-nums',
              color: gray > 0.5 ? '#59605c' : hot ? '#5dffb0' : '#3c5046',
              textShadow: hot && gray < 0.5 ? '0 0 18px rgba(43,224,138,0.9)' : undefined,
              transform: fresh ? 'translateY(-6px)' : undefined,
              filter: fresh ? 'blur(1.5px)' : undefined,
            }}
          >
            {v.toFixed(1)}
            <span style={{fontSize: 30}}>{gray > 0.5 ? '' : '↑'}</span>
          </div>
        </div>,
      );
    }
  return (
    <AbsoluteFill>
      <CanvasLayer f={ff} draw={streaks} />
      {cells}
    </AbsoluteFill>
  );
};

/* ---------------- 横切色带 ---------------- */

/**
 * 横切实心色带：at 起 5 帧从中线撑开到 h 高；lines 为 [出现帧, 文字, 字号?]，后一条从右侧甩入、前一条往左甩出；
 * grayAt 起色带 8 帧内由绿变灰、文字变浅灰。
 */
export const SlamBand: React.FC<{f: number; at: number; out?: number; y?: number; h?: number; lines: [number, string, number?][]; grayAt?: number}> = ({f, at, out, y = 985, h = 250, lines, grayAt}) => {
  if (f < at) return null;
  const open = eo((f - at) / 5);
  const close = out === undefined ? 0 : eo((f - out) / 5);
  const hh = h * open * (1 - close);
  if (hh <= 0.5) return null;
  const gr = grayAt === undefined ? 0 : clamp01((f - grayAt) / 8);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * gr);
  const bg = `rgb(${mix(43, 58)},${mix(224, 64)},${mix(138, 61)})`;
  const ink = gr > 0.5 ? '#cfd5d2' : '#03140b';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y - hh / 2, height: hh, background: bg, overflow: 'hidden', boxShadow: gr < 0.5 ? '0 0 80px rgba(43,224,138,0.45)' : undefined}}>
      {lines.map(([la, text, size = 104], i) => {
        const next = lines[i + 1]?.[0];
        if (f < la || (next !== undefined && f >= next + 5)) return null;
        const inP = eo((f - la) / 5);
        const outP = next === undefined ? 0 : eo((f - next) / 5);
        const dx = (1 - inP) * 700 - outP * 900;
        const blur = (1 - inP) * 14 + outP * 14;
        return (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: hh / 2 - size * 0.7, height: size * 1.4, lineHeight: `${size * 1.4}px`, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: LF.sans, fontWeight: 900, fontSize: size, letterSpacing: size * 0.06, color: ink, transform: `translateX(${dx}px) skewX(${-(1 - inP) * 12}deg)`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
            {text}
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- 圆形擦除 ---------------- */

/** 圆形擦除：at 起 dur 帧，从 (x, y) 扩出一个圆盖住全屏，里面画 children（新底色和内容）。
 * 半径按「屏幕被盖住的面积随时间线性增长」反推，整屏平均亮度匀速变化，不会某几帧突然变亮（避免闪烁）。 */
const coverCache = new Map<string, number[]>();
const coverTable = (x: number, y: number) => {
  const key = `${x},${y}`;
  const hit = coverCache.get(key);
  if (hit) return hit;
  const maxR = Math.hypot(Math.max(x, 1080 - x), Math.max(y, 1920 - y)) + 20;
  const pts: [number, number][] = [];
  for (let i = 0; i < 54; i++) for (let j = 0; j < 96; j++) pts.push([i * 20 + 10 - x, j * 20 + 10 - y]);
  const d = pts.map(([dx, dy]) => Math.hypot(dx, dy)).sort((a, b) => a - b);
  // d[k] = 盖住 (k+1)/n 面积所需的半径
  const table = Array.from({length: 101}, (_, k) => (k === 100 ? maxR : d[Math.min(d.length - 1, Math.floor((k / 100) * d.length))]));
  coverCache.set(key, table);
  return table;
};
export const CircleWipe: React.FC<{f: number; at: number; dur?: number; x?: number; y?: number; children: React.ReactNode}> = ({f, at, dur = 18, x = 470, y = 920, children}) => {
  if (f < at) return null;
  const t = clamp01((f - at) / dur);
  const tab = coverTable(x, y);
  const k = t * 100;
  const k0 = Math.floor(k);
  const r = k0 >= 100 ? tab[100] : tab[k0] + (tab[k0 + 1] - tab[k0]) * (k - k0);
  return <AbsoluteFill style={{clipPath: t >= 1 ? undefined : `circle(${r.toFixed(1)}px at ${x}px ${y}px)`}}>{children}</AbsoluteFill>;
};

/* ---------------- 浅底飘落的灰点 ---------------- */

export const FallingDots: React.FC<{f: number; at: number; n?: number; out?: number}> = ({f, at, n = 160, out}) => {
  const t = f - at;
  if (t < 0) return null;
  const o = clamp01(t / 20) * (out === undefined ? 1 : 1 - clamp01((f - out) / 14));
  const draw = (g: CanvasRenderingContext2D) => {
    for (let i = 0; i < n; i++) {
      const x = rand(i + 500) * 1080 + Math.sin(t / 50 + i) * 6;
      const y = -40 + Math.pow(rand(i + 501), 2.4) * 560 + t * (0.25 + rand(i + 502) * 0.7);
      const s = 1 + rand(i + 503) * 2.4;
      g.fillStyle = `rgba(140,147,142,${(0.18 + rand(i + 504) * 0.4) * o})`;
      g.beginPath();
      g.arc(x, y, s, 0, Math.PI * 2);
      g.fill();
    }
  };
  return <CanvasLayer f={f} draw={draw} />;
};

/* ---------------- 编辑式文字 ---------------- */

/**
 * 左对齐的一行字，慢速浮现：at 起 dur 帧从模糊 + 宽字距 + 略下沉收拢到清晰（慢的那一侧），out 起淡出。
 * kind：'sans' 粗黑体、'medium' 中黑、'serif' 宋体、'latin' 英文小标。
 */
export const SlowText: React.FC<{f: number; at: number; text: string; x?: number; y: number; size: number; color: string; kind?: 'sans' | 'medium' | 'serif' | 'latin'; dur?: number; out?: number; spacing?: number; glowColor?: string; align?: 'left' | 'center'}> = ({f, at, text, x = 100, y, size, color, kind = 'sans', dur = 20, out, spacing = 0.06, glowColor, align = 'left'}) => {
  const p = eo((f - at) / dur, 2.4);
  if (p <= 0) return null;
  const o = out === undefined ? 0 : clamp01((f - out) / 14);
  if (o >= 1) return null;
  const fam = kind === 'serif' ? LF.serif : kind === 'latin' ? LF.latin : LF.sans;
  const weight = kind === 'serif' ? 700 : kind === 'latin' ? 600 : kind === 'medium' ? 500 : 900;
  const blur = (1 - p) * Math.max(10, size * 0.12) + o * 10;
  return (
    <div
      style={{
        position: 'absolute',
        left: align === 'center' ? 0 : x,
        right: align === 'center' ? 0 : undefined,
        textAlign: align,
        top: y + (1 - p) * size * 0.12,
        whiteSpace: 'nowrap',
        fontFamily: fam,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.15,
        letterSpacing: size * (spacing + (1 - p) * 0.12),
        color,
        opacity: p * (1 - o),
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        textShadow: glowColor ? `0 0 ${size * 0.25}px ${glowColor}` : undefined,
      }}
    >
      {text}
    </div>
  );
};

/** 细线：at 起 dur 帧从左往右画出；accent 左端一段粗色块 */
export const Rule: React.FC<{f: number; at: number; x?: number; y: number; w?: number; color?: string; accent?: string; accentW?: number; dur?: number; out?: number}> = ({f, at, x = 100, y, w = 880, color = LL.hair, accent, accentW = 120, dur = 20, out}) => {
  const p = eo((f - at) / dur);
  if (p <= 0) return null;
  const o = out === undefined ? 1 : 1 - clamp01((f - out) / 14);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: o}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: w * p, height: 1.5, background: color}} />
      {accent && <div style={{position: 'absolute', left: 0, top: -4, width: accentW * eo((f - at - 4) / 12), height: 9, background: accent}} />}
    </div>
  );
};
