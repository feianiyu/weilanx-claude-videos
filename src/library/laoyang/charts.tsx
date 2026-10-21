import React from 'react';
import {clamp01} from '../anim';
import {drawP, L, LF, soft} from './theme';

/**
 * 分叉图：两条线从同一点出发，一条一路上扬（报表上的数字），一条走平再往下（真实的经营效果）。
 * 经营题材里「指标和目标脱钩」「增长的假象」都能用。数据是示意形状，画面必须同时挂「示意」角标。
 * at 起两条线一起画，split 帧之后开始分叉；labels 线尾的两个标签。
 */
export const DivergeChart: React.FC<{
  f: number;
  at: number;
  out?: number;
  y?: number;
  h?: number;
  labels?: [string, string];
  dur?: number;
}> = ({f, at, out, y = 700, h = 560, labels = ['报表数字', '真实效果'], dur = 40}) => {
  const a = soft(f, at, 10, out);
  if (a.v <= 0) return null;
  const x0 = 150;
  const x1 = 900;
  const p = drawP(f, at, dur);
  const N = 60;
  // 上扬线：先缓后陡；效果线：先跟着涨一点，过了一半走平再回落
  const up = (u: number) => 0.12 + 0.8 * Math.pow(u, 1.6);
  const real = (u: number) => 0.12 + 0.22 * Math.sin(Math.min(u, 0.55) / 0.55 * Math.PI * 0.5) - 0.2 * Math.pow(clamp01((u - 0.55) / 0.45), 1.5);
  const path = (fn: (u: number) => number) => {
    const n = Math.max(1, Math.round(N * p));
    return Array.from({length: n + 1}, (_, i) => {
      const u = (i / N);
      return `${i ? 'L' : 'M'}${(x0 + (x1 - x0) * u).toFixed(1)} ${(y + h - fn(u) * h).toFixed(1)}`;
    }).join(' ');
  };
  const u = Math.round(N * p) / N;
  const endUp = [x0 + (x1 - x0) * u, y + h - up(u) * h];
  const endReal = [x0 + (x1 - x0) * u, y + h - real(u) * h];
  const lab = clamp01((f - at - dur * 0.85) / 10);
  return (
    <div style={{position: 'absolute', inset: 0, ...a.style}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={x0} y1={y + h} x2={x1 + 20} y2={y + h} stroke={L.inkFaint} strokeWidth={2} />
        <line x1={x0} y1={y} x2={x0} y2={y + h} stroke={L.inkFaint} strokeWidth={2} />
        <path d={path(real)} fill="none" stroke={L.gray} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path(up)} fill="none" stroke={L.green} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" style={{filter: `drop-shadow(0 0 10px ${L.green})`}} />
        <circle cx={endUp[0]} cy={endUp[1]} r={12} fill={L.green} />
        <circle cx={endReal[0]} cy={endReal[1]} r={10} fill={L.gray} />
      </svg>
      <div style={{position: 'absolute', left: endUp[0] - 260, width: 240, top: endUp[1] - 30, textAlign: 'right', fontFamily: LF.sans, fontWeight: 900, fontSize: 44, color: L.green, opacity: lab}}>{labels[0]}</div>
      <div style={{position: 'absolute', left: endReal[0] - 260, width: 240, top: endReal[1] + 20, textAlign: 'right', fontFamily: LF.sans, fontWeight: 900, fontSize: 44, color: L.gray, opacity: lab}}>{labels[1]}</div>
    </div>
  );
};
