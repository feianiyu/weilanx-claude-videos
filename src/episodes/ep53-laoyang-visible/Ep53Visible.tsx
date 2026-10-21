import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {GlowCanvas} from '../../library/glowline/GlowCanvas';
import {render} from './scenes';
import {FPS} from './timeline';

/**
 * ep53 老杨魔方 ·「让知识可见，让思想有形」光点开场（竖版 32.9 秒，无旁白）。
 * 一颗光点贯穿全片：光盘 → 光环 → 星芒 → 胶囊 / 卡片 → 点阵 → 白闪 → 绳线串胶囊 → 描边框 → 雾团 → 立方体 logo。
 * 画面全部在 scenes.ts（canvas，t 秒的纯函数），招牌动效在 src/library/glowline/。
 * 配乐：python3 audio/episodes/ep53-laoyang-visible.py → public/audio/ep53-laoyang-visible/mix.wav
 */
export const Ep53Visible: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <GlowCanvas f={f} fps={FPS} render={render} />
      <Audio src={staticFile('audio/ep53-laoyang-visible/mix.wav')} />
    </AbsoluteFill>
  );
};
