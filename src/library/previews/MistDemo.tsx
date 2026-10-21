import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {ColorMist, MIST_PALETTES} from '../mist/ColorMist';
import {makeDrive, type Bands} from '../mist/drive';
import {MIST_DEMO_BURST, MIST_DEMO_CONTRACT, MIST_DEMO_FRAMES, MIST_DEMO_LABELS, MIST_DEMO_TWIST} from '../mist/demo';
import bands from '../mist/demo-bands.json';

export {MIST_DEMO_FRAMES};

const drive = makeDrive({bands: bands as Bands, burst: MIST_DEMO_BURST, contract: MIST_DEMO_CONTRACT, twist: MIST_DEMO_TWIST, curve: [2.2, 1.4, 1.6], gain: [1.1, 1, 1.2]});

/**
 * 彩雾素材预览（24 秒竖屏）：呼吸 → 律动 → 瞬间收缩 → 瞬间爆炸 → 张力 → 收缩成核 → 终极爆炸。
 * palette 换配色（ruby 暖灰彩雾 / jade 老杨魔方深色 / ember 深夜冷艳），seed 换一团形态。
 */
export const MistDemo: React.FC<{palette?: keyof typeof MIST_PALETTES; seed?: number}> = ({palette = 'ruby', seed = 1}) => {
  const f = useCurrentFrame();
  const label = [...MIST_DEMO_LABELS].reverse().find(([at]) => f >= at)?.[1] ?? '';
  const light = palette === 'ruby';
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ColorMist f={f} drive={drive} palette={palette} seed={seed} y={880} />
      <div style={{position: 'absolute', left: 64, top: 140, fontFamily: `'Inter', 'Helvetica Neue', 'PingFang SC', sans-serif`, fontWeight: 600, fontSize: 28, letterSpacing: '0.3em', color: light ? 'rgba(255,245,230,0.55)' : 'rgba(220,255,235,0.5)'}}>
        {label.toUpperCase()}
      </div>
      <Audio src={staticFile('audio/library-color-mist/mix.wav')} />
    </AbsoluteFill>
  );
};
