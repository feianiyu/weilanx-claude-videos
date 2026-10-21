import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, rand} from '../anim';
import {drawP, glow, L, LF, pop, soft} from './theme';

/**
 * 老杨魔方竖版舞台层：绿光呼吸底、颗粒、底鼓镜头微推、冲击波环、粒子聚成的标题、
 * 富文本大字（粗黑体 + 绿色宋体强调）、药丸标签（可勾选 / 划掉）、手绘圈注、「示意」角标。
 * 全部 1080×1920，动画都是帧号 f 的纯函数。
 */

/**
 * 绿光底：近黑 + 几团慢慢漂移、呼吸的品牌绿光 + 暗角。
 * focus 光最浓的位置（百分比），strength 浓度，pulse 底鼓脉冲（0–1）让光跟着拍子亮一下。
 */
export const GlowBg: React.FC<{f: number; focus?: [number, number]; strength?: number; pulse?: number; gold?: number}> = ({f, focus = [50, 42], strength = 1, pulse = 0, gold = 0}) => {
  const blobs = [
    {x: focus[0], y: focus[1], rx: 70, ry: 34, a: 0.22, sp: 0.6, c: L.glow},
    {x: 100 - focus[0] * 0.6, y: focus[1] + 30, rx: 60, ry: 26, a: 0.12, sp: 0.45, c: L.glow},
    {x: 30, y: 12, rx: 70, ry: 18, a: 0.07, sp: 0.3, c: L.glow},
    {x: 60, y: 70, rx: 55, ry: 22, a: 0.16 * gold, sp: 0.4, c: 'rgba(245,166,35,'},
  ];
  return (
    <AbsoluteFill style={{background: L.bg}}>
      {blobs.map((b, i) => {
        if (b.a <= 0.001) return null;
        const x = b.x + Math.sin(f / (100 + i * 30) + i) * 7 * b.sp;
        const y = b.y + Math.cos(f / (120 + i * 25) + i * 2) * 4 * b.sp;
        const a = b.a * strength * (0.85 + 0.15 * Math.sin(f / 50 + i) + 0.35 * pulse * (i === 0 ? 1 : 0.4));
        return <AbsoluteFill key={i} style={{background: `radial-gradient(ellipse ${b.rx}% ${b.ry}% at ${x}% ${y}%, ${b.c}${a.toFixed(3)}) 0%, ${b.c}${(a * 0.3).toFixed(3)}) 48%, rgba(0,0,0,0) 76%)`}} />;
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 48%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.78) 100%)'}} />
    </AbsoluteFill>
  );
};

/** 细网格：很淡的工程网格，给画面一点「经营分析」的质感；drift 让它缓慢上移 */
export const GridLines: React.FC<{f: number; opacity?: number; step?: number}> = ({f, opacity = 0.06, step = 90}) => {
  const off = (f * 0.4) % step;
  return (
    <AbsoluteFill style={{opacity}}>
      <svg width={1080} height={1920}>
        {Array.from({length: Math.ceil(1080 / step) + 1}, (_, i) => (
          <line key={`v${i}`} x1={i * step} y1={0} x2={i * step} y2={1920} stroke={L.green} strokeWidth={1} />
        ))}
        {Array.from({length: Math.ceil(1920 / step) + 2}, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * step - off} x2={1080} y2={i * step - off} stroke={L.green} strokeWidth={1} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** 胶片颗粒：静态噪点，叠在最上层 */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity}}>
    <svg width="100%" height="100%">
      <filter id="ly-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0.8  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.5 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ly-grain)" />
    </svg>
  </AbsoluteFill>
);

/** 镜头：底鼓 pulse 让整个画面微微推近；punch 0–1 额外的重拍推镜 */
export const Camera: React.FC<{pulse?: number; punch?: number; children: React.ReactNode}> = ({pulse = 0, punch = 0, children}) => (
  <AbsoluteFill style={{transform: `scale(${1 + 0.012 * pulse + 0.05 * punch})`, transformOrigin: '50% 46%'}}>{children}</AbsoluteFill>
);

/** 冲击波环：at 帧从 (x, y) 扩散的一圈绿光，0.6 秒散尽 */
export const ShockRing: React.FC<{f: number; at: number; x?: number; y?: number; color?: string; max?: number}> = ({f, at, x = 540, y = 860, color = L.green, max = 900}) => {
  const t = (f - at) / 18;
  if (t < 0 || t > 1) return null;
  const e = 1 - Math.pow(1 - t, 2.4);
  const r = 40 + max * e;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={10 * (1 - t) + 1} opacity={(1 - t) * 0.8} style={{filter: `blur(${2 + 6 * t}px)`}} />
      <circle cx={x} cy={y} r={r * 0.72} fill="none" stroke={color} strokeWidth={3 * (1 - t)} opacity={(1 - t) * 0.5} />
    </svg>
  );
};

/** 把「普通【绿宋强调】〔金〕〖红〗」拆成带样式的段 */
type Seg = {t: string; k?: 'em' | 'gold' | 'red'};
export const segs = (s: string): Seg[] => {
  const out: Seg[] = [];
  const map: Record<string, [string, Seg['k']]> = {'【': ['】', 'em'], '〔': ['〕', 'gold'], '〖': ['〗', 'red']};
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const m = map[s[i]];
    if (m) {
      const e = s.indexOf(m[0], i + 1);
      if (e > i) {
        if (buf) out.push({t: buf});
        buf = '';
        out.push({t: s.slice(i + 1, e), k: m[1]});
        i = e;
        continue;
      }
    }
    buf += s[i];
  }
  if (buf) out.push({t: buf});
  return out;
};
/** 去掉标记后的纯文字（测字数用） */
export const plain = (s: string) => segs(s).map((x) => x.t).join('');

/**
 * 富文本一行：粗黑体白字；【】绿色宋体（略大一号、带发光），〔〕金，〖〗红。
 * at 弹出帧，out 淡出帧；y 行中心；size 字号；align 对齐方式（居中时 x 无效）。
 */
export const RichLine: React.FC<{f: number; at: number; text: string; y: number; size?: number; out?: number; align?: 'center' | 'left'; x?: number; dim?: number}> = ({f, at, text, y, size = 92, out, align = 'center', x = 100, dim = 1}) => {
  const a = pop(f, at, 10, out);
  if (a.v <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: align === 'center' ? 40 : x,
        right: align === 'center' ? 40 : undefined,
        top: y - size * 0.62,
        textAlign: align,
        whiteSpace: 'nowrap',
        fontFamily: LF.sans,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: size * 0.04,
        lineHeight: 1.2,
        ...glow(L.ink, 14, 0.35),
        ...a.style,
        opacity: (a.style.opacity as number) * dim,
        transformOrigin: align === 'center' ? '50% 50%' : '0% 50%',
      }}
    >
      {segs(text).map((s, i) => {
        if (s.k === 'em') return <span key={i} style={{fontFamily: LF.serif, fontWeight: 700, fontSize: size * 1.08, ...glow(L.green, 22, 0.9)}}>{s.t}</span>;
        if (s.k === 'gold') return <span key={i} style={glow(L.gold, 18, 0.8)}>{s.t}</span>;
        if (s.k === 'red') return <span key={i} style={glow(L.red, 16, 0.7)}>{s.t}</span>;
        return <span key={i}>{s.t}</span>;
      })}
    </div>
  );
};

/** 小号说明行：灰色宋体，用于出处 / 补充（≤ 1 行） */
export const NoteLine: React.FC<{f: number; at: number; text: string; y: number; out?: number; size?: number; color?: string}> = ({f, at, text, y, out, size = 34, color = L.gray}) => {
  const a = soft(f, at, 14, out);
  if (a.v <= 0) return null;
  return <div style={{position: 'absolute', left: 60, right: 60, top: y, textAlign: 'center', fontFamily: LF.serif, fontWeight: 500, fontSize: size, letterSpacing: 3, color, ...a.style}}>{text}</div>;
};

/**
 * 粒子聚成的标题：at 起两三百颗绿 / 金光点从四周旋进来聚到标题处，标题由模糊浮出；
 * 之后英文宽字距行、金色副标题依次出现，最下面一根金色短横线。instant 标题在重拍帧直接亮出。
 */
export const SparkTitle: React.FC<{f: number; at: number; title: string; en?: string; sub?: string; y?: number; size?: number; out?: number; instant?: boolean}> = ({f, at, title, en, sub, y = 820, size = 150, out, instant}) => {
  const t = f - at;
  if (t < 0) return null;
  const o = out === undefined ? 1 : 1 - clamp01((f - out) / 12);
  if (o <= 0) return null;
  const conv = clamp01(t / 16);
  const e = 1 - Math.pow(1 - conv, 3);
  const w = Math.min(960, size * Array.from(title).length * 1.02);
  const tv = instant ? 0.65 + 0.35 * clamp01(t / 10) : clamp01((t - 8) / 12);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 18% at 50% ${(y / 1920) * 100}%, rgba(43,224,138,${0.26 * tv}) 0%, rgba(20,120,70,${0.12 * tv}) 45%, rgba(0,0,0,0) 76%)`}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {Array.from({length: 240}, (_, i) => {
          const a0 = rand(i) * Math.PI * 2;
          const r0 = 520 + rand(i + 3) * 520;
          const sx = 540 + Math.cos(a0 + e * 1.3) * r0 * 0.7 * (1 - e);
          const sy = y + Math.sin(a0 + e * 1.3) * r0 * (1 - e);
          const tx = 540 + (rand(i + 7) - 0.5) * w;
          const ty = y + (rand(i + 11) - 0.5) * size * 0.9;
          const px = sx * (1 - e) + tx * e;
          const py = sy * (1 - e) + ty * e;
          const fade = conv < 1 ? 1 : 1 - clamp01((t - 16) / 18);
          if (fade <= 0) return null;
          return <circle key={i} cx={px} cy={py} r={1 + rand(i + 5) * 2.2} fill={rand(i + 13) < 0.22 ? L.gold : L.green} opacity={(0.45 + 0.55 * rand(i + 9)) * fade} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: y - size * 0.62, textAlign: 'center', opacity: tv, filter: tv < 1 ? `blur(${(1 - tv) * 12}px)` : undefined, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: LF.sans, fontWeight: 900, fontSize: size, letterSpacing: size * 0.08, color: '#eafff3', textShadow: `0 0 6px #d8ffe9, 0 0 24px rgba(43,224,138,0.9), 0 0 64px rgba(19,162,78,0.7), 0 4px 18px rgba(0,0,0,0.8)`}}>{title}</span>
      </div>
      {en && (
        <div style={{position: 'absolute', left: 0, right: 0, top: y + size * 0.78, textAlign: 'center', fontFamily: LF.latin, fontWeight: 600, fontSize: size * 0.22, letterSpacing: '0.42em', color: L.inkDim, opacity: clamp01((t - 18) / 12)}}>
          {en.toUpperCase()}
        </div>
      )}
      {sub && (
        <div style={{position: 'absolute', left: 0, right: 0, top: y + size * 1.2, textAlign: 'center', fontFamily: LF.serif, fontWeight: 500, fontSize: size * 0.27, letterSpacing: '0.3em', color: L.gold, opacity: clamp01((t - 26) / 12)}}>
          {sub}
        </div>
      )}
      <div style={{position: 'absolute', left: 540 - 50 * clamp01((t - 30) / 12), top: y + size * (sub ? 1.72 : 1.2), width: 100 * clamp01((t - 30) / 12), height: 6, background: L.gold}} />
    </AbsoluteFill>
  );
};

/**
 * 药丸标签：圆角描边框 + 文字；state 'on' 绿色描边、'strike' 被划掉褪色（红线从左到右划过）、'check' 前面打勾。
 * stateAt 状态变化的帧（划线 / 打勾从这一帧开始画）。
 */
export const Pill: React.FC<{f: number; at: number; text: string; x?: number; y: number; w?: number; size?: number; state?: 'on' | 'strike' | 'check'; stateAt?: number; out?: number; color?: string}> = ({f, at, text, x = 540, y, w = 760, size = 54, state = 'on', stateAt, out, color = L.green}) => {
  const a = pop(f, at, 10, out);
  if (a.v <= 0) return null;
  const h = size * 1.9;
  const sp = stateAt === undefined ? 1 : drawP(f, stateAt, 10);
  const struck = state === 'strike' ? sp : 0;
  const checked = state === 'check' ? sp : 0;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, ...a.style}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: h / 2,
          border: `3px solid ${struck > 0 ? `rgba(140,147,142,${0.5 + 0.5 * (1 - struck)})` : color}`,
          background: `rgba(43,224,138,${0.08 * (1 - struck)})`,
          boxShadow: struck > 0.5 ? undefined : `0 0 18px ${color}55, inset 0 0 14px ${color}22`,
        }}
      />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: size * 0.4, fontFamily: LF.sans, fontWeight: 900, fontSize: size, color: struck > 0 ? `rgba(246,247,245,${1 - 0.6 * struck})` : L.ink, whiteSpace: 'nowrap'}}>
        {checked > 0 && (
          <svg width={size * 0.9} height={size * 0.9} viewBox="0 0 40 40">
            <path d="M6 21 L16 31 L34 9" fill="none" stroke={L.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${checked} 1`} />
          </svg>
        )}
        {segs(text).map((s, i) => (
          <span key={i} style={s.k === 'gold' ? {color: L.gold} : s.k === 'em' ? {color: L.green} : s.k === 'red' ? {color: L.red} : undefined}>
            {s.t}
          </span>
        ))}
      </div>
      {struck > 0 && <div style={{position: 'absolute', left: w * 0.08, top: h / 2 - 3, height: 6, width: w * 0.84 * struck, background: L.red, boxShadow: `0 0 10px ${L.red}`}} />}
    </div>
  );
};

/** 手绘圈注：围着 (cx, cy) 一圈略歪的金色椭圆，at 起 14 帧画完，按 4fps 轻微抖动 */
export const Scribble: React.FC<{f: number; at: number; cx: number; cy: number; rx: number; ry: number; color?: string; out?: number; seed?: number}> = ({f, at, cx, cy, rx, ry, color = L.gold, out, seed = 3}) => {
  const p = drawP(f, at, 14);
  if (p <= 0) return null;
  const o = out === undefined ? 1 : 1 - clamp01((f - out) / 10);
  const step = Math.floor(f / 7.5);
  const pts: string[] = [];
  const N = 48;
  for (let i = 0; i <= N * 1.12; i++) {
    const th = -Math.PI * 0.62 + (i / N) * Math.PI * 2;
    const k = 1 + (rand(seed + i * 3 + step * 101) - 0.5) * 0.04 + (i / N) * 0.06;
    pts.push(`${i ? 'L' : 'M'}${(cx + Math.cos(th) * rx * k).toFixed(1)} ${(cy + Math.sin(th) * ry * k - (i / N) * 8).toFixed(1)}`);
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
      <path d={pts.join(' ')} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} style={{filter: `drop-shadow(0 0 8px ${color}99)`}} />
    </svg>
  );
};

/** 「示意」角标：自创框架、举例画面必须标 */
export const Illustrative: React.FC<{f: number; at: number; out?: number; x?: number; y?: number}> = ({f, at, out, x = 900, y = 300}) => {
  const a = soft(f, at, 10, out);
  if (a.v <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, padding: '6px 14px', border: `2px solid ${L.inkFaint}`, borderRadius: 8, fontFamily: LF.sans, fontWeight: 700, fontSize: 26, color: L.gray, letterSpacing: 4, ...a.style}}>示意</div>
  );
};

/** 段落小标：金色短横线 + 宽字距小字（如「01 · 现象」） */
export const SectionTag: React.FC<{f: number; at: number; text: string; out?: number; y?: number}> = ({f, at, text, out, y = 330}) => {
  const a = soft(f, at, 12, out);
  if (a.v <= 0) return null;
  const w = drawP(f, at, 12);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, ...a.style}}>
      <div style={{width: 60 * w, height: 4, background: L.gold}} />
      <div style={{fontFamily: LF.sans, fontWeight: 700, fontSize: 34, letterSpacing: 12, color: L.gold}}>{text}</div>
      <div style={{width: 60 * w, height: 4, background: L.gold}} />
    </div>
  );
};
