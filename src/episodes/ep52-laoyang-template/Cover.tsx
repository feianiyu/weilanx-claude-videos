import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {CornerMark, CubeLogo} from '../../library/laoyang/brand';
import {CanvasLayer} from '../../library/laoyang/contrast';
import {Grain} from '../../library/laoyang/stage';
import {L, LF} from '../../library/laoyang/theme';
import {rand} from '../../library/anim';

/**
 * 封面（v2 同款对比）：上方一片稀疏的灰绿星点，左对齐一个巨大的金色 98.7%，下面两行粗黑体标题，「玩坏」用绿色宋体。
 * 同一个组件出 1080×1920（竖版）和 1080×1440（3:4 主页网格）；3:4 时整体上移，主体不被裁。
 */
export const Ep52Cover: React.FC = () => {
  const {height} = useVideoConfig();
  const tall = height > 1600;
  const top = tall ? 560 : 300;
  const draw = (g: CanvasRenderingContext2D) => {
    const rg = g.createRadialGradient(430, top + 260, 0, 430, top + 260, 620);
    rg.addColorStop(0, 'rgba(245,166,35,0.18)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 1080, height);
    for (let i = 0; i < 2600; i++) {
      const x = rand(i) * 1080;
      const y = Math.pow(rand(i + 0.5), 1.8) * (top + 40);
      const s = 0.6 + rand(i + 0.7) * 1.6;
      g.fillStyle = `rgba(159,184,173,${0.1 + rand(i + 0.9) * 0.45})`;
      g.fillRect(x, y, s, s);
    }
    g.lineWidth = 1;
    for (let i = 0; i < 260; i++) {
      const a = rand(i + 50) * Math.PI * 2;
      const r = 380 + rand(i + 51) * 600;
      const x = 430 + Math.cos(a) * r;
      const y = top + 260 + Math.sin(a) * r;
      g.strokeStyle = `rgba(245,166,35,${0.04 + rand(i + 52) * 0.1})`;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (430 - x) * 0.1, y + (top + 260 - y) * 0.1);
      g.stroke();
    }
  };
  return (
    <AbsoluteFill style={{background: '#050706'}}>
      <CanvasLayer f={0} draw={draw} h={height} />
      <CornerMark f={60} x={64} y={tall ? 132 : 72} />
      <div style={{position: 'absolute', left: 100, top: top - 56, fontFamily: LF.sans, fontWeight: 500, fontSize: 26, letterSpacing: '0.4em', color: '#a07a30'}}>KPI · 达成率</div>
      <div style={{position: 'absolute', left: 100, top: top - 14, width: 120, height: 3, background: L.gold}} />
      <div style={{position: 'absolute', left: 80, top, whiteSpace: 'nowrap', fontFamily: LF.num, fontWeight: 800, fontSize: 340, lineHeight: 1, letterSpacing: -13, color: L.gold, textShadow: '0 0 50px rgba(245,166,35,0.5)'}}>
        98.7<span style={{fontSize: 122, letterSpacing: 0}}>%</span>
      </div>
      <div style={{position: 'absolute', left: 100, top: top + 400, fontFamily: LF.sans, fontWeight: 900, fontSize: 120, lineHeight: 1.22, letterSpacing: 4, color: L.ink}}>
        <div>KPI 为什么</div>
        <div>
          总被<span style={{fontFamily: LF.serif, fontWeight: 700, fontSize: 132, color: L.green, textShadow: '0 0 30px rgba(43,224,138,0.6)'}}>玩坏</span>？
        </div>
      </div>
      <div style={{position: 'absolute', left: 100, top: top + 730, fontFamily: LF.sans, fontWeight: 500, fontSize: 36, letterSpacing: 6, color: L.gray}}>古德哈特定律 · 指标一旦成了目标</div>
      {tall && (
        <div style={{position: 'absolute', left: 490, top: 1605}}>
          <CubeLogo size={100} color={L.green} glowR={10} />
        </div>
      )}
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
