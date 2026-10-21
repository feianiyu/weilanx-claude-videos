import React from 'react';
import {AbsoluteFill} from 'remotion';
import {GlowCanvas} from '../../library/glowline/GlowCanvas';
import {c, clearFrame, CX, font, GC} from '../../library/glowline/core';
import {blob, cubeLogo} from '../../library/glowline/draw';
import {TEXT} from './timeline';

/** ep53 封面（9:16）：雾团 + 两行主标题 + 左上角「立方体 老杨魔方」+ 底部署名小字 */
const drawCover = () => {
  clearFrame('#000');
  blob(430, 900, 300, GC.magenta, 0.9, 'source-over');
  blob(650, 860, 360, GC.blue, 0.95, 'source-over');
  blob(580, 1080, 280, '#18d4ff', 0.9, 'source-over');
  blob(760, 1060, 240, '#2a3cff', 0.8, 'source-over');
  const g = c();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';
  g.font = font(300, 132);
  g.letterSpacing = '10px';
  g.fillText(TEXT.line1.join(''), CX, 880);
  g.fillText(TEXT.line2.join(''), CX, 1060);
  g.font = font(400, 40);
  g.letterSpacing = '8px';
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillText('30 秒，看一个想法如何长出形状', CX, 1290);
  cubeLogo(118, 170, 70, GC.green, 1, 0);
  g.textAlign = 'left';
  g.font = font(900, 44);
  g.letterSpacing = '3px';
  g.fillStyle = '#F6F7F5';
  g.fillText('老杨魔方', 170, 172);
  g.textAlign = 'center';
  g.font = font(500, 42);
  g.fillStyle = '#f4f4f6';
  g.fillText(TEXT.caption, CX, 1676);
};

export const Ep53Cover: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <GlowCanvas f={0} render={drawCover} />
  </AbsoluteFill>
);
