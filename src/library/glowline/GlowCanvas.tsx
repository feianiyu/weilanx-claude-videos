import React from 'react';
import {CanvasLayer} from '../laoyang/contrast';
import {bindCtx} from './core';
import './fonts';

/**
 * 把一个 `render(t)`（t 为秒）挂进 Remotion：每帧清空画布 → bindCtx → render(f / fps)。
 * render 里直接调用 glowline 的绘制函数即可。
 */
export const GlowCanvas: React.FC<{f: number; fps?: number; render: (t: number) => void; w?: number; h?: number}> = ({f, fps = 30, render, w = 1080, h = 1920}) => (
  <CanvasLayer
    f={f}
    w={w}
    h={h}
    draw={(g) => {
      bindCtx(g);
      render(f / fps);
    }}
  />
);
