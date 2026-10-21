import React from 'react';
import {clamp01} from '../anim';
import {drawP, L, LF, LL, pop, soft} from './theme';

type Tone = 'dark' | 'light';

/**
 * 「老杨魔方」品牌件：立方体 logo、左上角标、底部脉动 logo、片尾署名组合。
 * 立方体按标准看板画：粗笔画、扁平单色的等轴测立方体轮廓（不是三阶魔方网格）。
 * 外轮廓是断开的六边形——顶部倒 V、左右两根竖条、底部 V；中间一个「Y」（左上、右上两笔汇到中心，再一笔向下）；各段之间留缺口。
 */

type P2 = [number, number];
const R = 50;
const RC = R * 0.8660254;
const C0: P2 = [60, 60];
const V = {
  T: [60, 60 - R] as P2,
  UR: [60 + RC, 60 - R / 2] as P2,
  LR: [60 + RC, 60 + R / 2] as P2,
  B: [60, 60 + R] as P2,
  LL: [60 - RC, 60 + R / 2] as P2,
  UL: [60 - RC, 60 - R / 2] as P2,
  C: C0,
};
/** 从 a 朝 b 走 d */
const toward = (a: P2, b: P2, d: number): P2 => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.hypot(dx, dy);
  return [a[0] + (dx / n) * d, a[1] + (dy / n) * d];
};
const pts = (...p: P2[]) => p.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join(' ');

const GAP = 10;
/** 六段路径（顺序即画出顺序）：顶部倒 V、右竖、底部 V、左竖、Y 的两臂、Y 的竖笔 */
export const CUBE_PATHS: string[] = [
  pts(toward(V.UL, V.T, GAP), V.T, toward(V.UR, V.T, GAP)),
  pts(toward(V.UR, V.LR, GAP), toward(V.LR, V.UR, GAP)),
  pts(toward(V.LR, V.B, GAP), V.B, toward(V.LL, V.B, GAP)),
  pts(toward(V.LL, V.UL, GAP), toward(V.UL, V.LL, GAP)),
  pts(toward(V.UL, V.C, GAP), V.C, toward(V.UR, V.C, GAP)),
  pts(V.C, toward(V.B, V.C, GAP)),
];

/**
 * 立方体 logo。size 高度（px）；color 深底亮绿 / 浅底深绿；
 * draw 0–1 笔画画出进度（六段依次画，默认 1 = 完整）；glowR 外发光半径（0 不发光）。
 */
export const CubeLogo: React.FC<{size?: number; color?: string; draw?: number; glowR?: number; style?: React.CSSProperties}> = ({size = 100, color = L.green, draw = 1, glowR = 0, style}) => {
  const n = CUBE_PATHS.length;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{overflow: 'visible', filter: glowR > 0 ? `drop-shadow(0 0 ${glowR}px ${color}aa)` : undefined, ...style}}
    >
      {CUBE_PATHS.map((d, i) => {
        // 六段错开：每段占 0.45 的时间窗，依次起笔
        const p = clamp01((draw - (i / n) * 0.55) / 0.45);
        if (p <= 0) return null;
        return <path key={i} d={d} fill="none" stroke={color} strokeWidth={12} strokeLinecap="butt" strokeLinejoin="miter" pathLength={1} strokeDasharray={p >= 1 ? undefined : `${p} 1`} />;
      })}
    </svg>
  );
};

/**
 * 左上角常驻小标：立方体 + 老杨魔方（粗黑体）+ 竖线 + 企业经营观察（宋体灰）。
 * at 出现帧；整片常驻时 at 取 0。
 */
export const CornerMark: React.FC<{f: number; at?: number; out?: number; x?: number; y?: number; scale?: number; tone?: Tone}> = ({f, at = 0, out, x = 64, y = 132, scale = 1, tone = 'dark'}) => {
  const light = tone === 'light';
  const a = soft(f, at, 14, out);
  if (a.v <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 16 * scale, ...a.style}}>
      <CubeLogo size={50 * scale} color={light ? LL.green : L.green} draw={drawP(f, at, 18)} />
      <div style={{fontFamily: LF.sans, fontWeight: 900, fontSize: 38 * scale, color: light ? LL.ink : L.ink, letterSpacing: 2 * scale, lineHeight: 1}}>老杨魔方</div>
      <div style={{width: 2, height: 30 * scale, background: light ? 'rgba(18,20,18,0.22)' : L.inkFaint}} />
      <div style={{fontFamily: LF.serif, fontWeight: 700, fontSize: 26 * scale, color: L.gray, letterSpacing: 3 * scale, lineHeight: 1}}>企业经营观察</div>
    </div>
  );
};

/**
 * 底部居中立方体：中心 y≈1655、高 100，随底鼓 pulse（0–1）轻微放大、发光变亮。
 * 片尾出署名组合时用 out 把它收掉，避免两个 logo 同屏。
 */
export const BottomCube: React.FC<{f: number; pulse?: number; at?: number; out?: number; y?: number; size?: number; tone?: Tone}> = ({f, pulse = 0, at = 0, out, y = 1655, size = 100, tone = 'dark'}) => {
  const a = soft(f, at, 14, out);
  if (a.v <= 0) return null;
  const s = 1 + 0.07 * pulse;
  return (
    <div style={{position: 'absolute', left: 540 - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${s})`, ...a.style, opacity: a.v * (0.78 + 0.22 * pulse)}}>
      <CubeLogo size={size} color={tone === 'light' ? LL.green : L.green} glowR={tone === 'light' ? 0 : 6 + 14 * pulse} />
    </div>
  );
};

/**
 * 片尾署名组合（深底版）：立方体 | 老杨魔方 | 企业经营观察 横排，下方绿色短线 + 灰色细长线；整组宽约 840。
 * 按看板要求低调：放画面中下、字号克制、停留短。follow 为 true 时上方加一行小字「关注老杨魔方」。
 */
export const SignOff: React.FC<{f: number; at: number; out?: number; y?: number; follow?: boolean; tone?: Tone}> = ({f, at, out, y = 1380, follow = true, tone = 'dark'}) => {
  const light = tone === 'light';
  const c = light
    ? {logo: LL.green, ink: LL.ink, sub: LL.gray, div: 'rgba(18,20,18,0.2)', line: LL.greenBrand, hair: LL.hair, follow: LL.greenBrand, glow: 0}
    : {logo: L.green, ink: L.ink, sub: L.gray, div: L.inkFaint, line: L.green, hair: L.inkFaint, follow: L.gold, glow: 8};
  const W = 840;
  const a = soft(f, at, 12, out, 14);
  if (a.v <= 0) return null;
  const t1 = pop(f, at + 6, 10);
  const t2 = pop(f, at + 10, 10);
  const line = drawP(f, at + 12, 16);
  const fo = soft(f, at + 20, 14);
  return (
    <div style={{position: 'absolute', left: 540 - W / 2, width: W, top: y, opacity: a.v}}>
      {follow && (
        <div style={{position: 'absolute', left: 0, right: 0, top: -96, textAlign: 'center', fontFamily: LF.sans, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: c.follow, ...fo.style}}>
          关注老杨魔方
        </div>
      )}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28}}>
        <CubeLogo size={92} color={c.logo} draw={drawP(f, at, 20)} glowR={c.glow} />
        <div style={{width: 2, height: 64, background: c.div}} />
        <div style={{fontFamily: LF.sans, fontWeight: 900, fontSize: 70, color: c.ink, letterSpacing: 4, lineHeight: 1, ...t1.style}}>老杨魔方</div>
        <div style={{width: 2, height: 64, background: c.div}} />
        <div style={{fontFamily: LF.serif, fontWeight: 700, fontSize: 38, color: c.sub, letterSpacing: 4, lineHeight: 1, ...t2.style}}>企业经营观察</div>
      </div>
      <div style={{position: 'relative', height: 8, marginTop: 30}}>
        <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: 130 * line, background: c.line}} />
        <div style={{position: 'absolute', left: 150, top: 3, height: 2, width: (W - 150) * clamp01((line - 0.2) / 0.8), background: c.hair}} />
      </div>
    </div>
  );
};
