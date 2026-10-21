import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {CornerMark, CubeLogo} from '../../library/laoyang/brand';
import {GlowBg, Grain, GridLines, segs} from '../../library/laoyang/stage';
import {glow, L, LF} from '../../library/laoyang/theme';
import {TITLE} from './timeline';

/**
 * 封面：左上角标、主标题（粗黑体 + 绿宋强调）、金色副标 + 短横线、下方居中小立方体。
 * 同一个组件出两种尺寸：1080×1920（竖版封面）和 1080×1440（3:4，抖音 / 视频号主页网格）。
 * 主要文字放在画面中上部，3:4 裁切时也不会被切掉。
 */
const MAIN = 'KPI 为什么\n总被【玩坏】？';
const COVER_LINE = '指标一旦成了目标，就不再是好指标';

export const Ep52Cover: React.FC = () => {
  const {height} = useVideoConfig();
  const tall = height > 1600;
  const cy = tall ? 860 : 640;
  return (
    <AbsoluteFill style={{background: L.bg}}>
      <GlowBg f={0} focus={[50, (cy / height) * 100]} strength={1.3} />
      <GridLines f={0} opacity={0.05} />
      <CornerMark f={60} x={64} y={tall ? 132 : 72} />
      <div style={{position: 'absolute', left: 0, right: 0, top: cy - 300, textAlign: 'center'}}>
        {MAIN.split('\n').map((line, i) => (
          <div key={i} style={{fontFamily: LF.sans, fontWeight: 900, fontSize: 132, lineHeight: 1.28, letterSpacing: 6, whiteSpace: 'nowrap', ...glow(L.ink, 16, 0.4)}}>
            {segs(line).map((s, j) => (s.k === 'em' ? <span key={j} style={{fontFamily: LF.serif, fontWeight: 700, fontSize: 146, ...glow(L.green, 26, 1)}}>{s.t}</span> : <span key={j}>{s.t}</span>))}
          </div>
        ))}
        <div style={{marginTop: 46, fontFamily: LF.serif, fontWeight: 500, fontSize: 52, letterSpacing: 14, color: L.gold}}>{TITLE}</div>
        <div style={{margin: '26px auto 0', width: 110, height: 7, background: L.gold}} />
        <div style={{marginTop: 30, fontFamily: LF.sans, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: L.inkDim}}>{COVER_LINE}</div>
      </div>
      <div style={{position: 'absolute', left: 540 - 50, top: (tall ? 1655 : 1250) - 50}}>
        <CubeLogo size={100} color={L.green} glowR={10} />
      </div>
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
