import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {clamp01} from '../../library/anim';
import {BottomCube, CornerMark, SignOff} from '../../library/laoyang/brand';
import {DivergeChart} from '../../library/laoyang/charts';
import {Camera, GlowBg, Grain, GridLines, Illustrative, NoteLine, Pill, RichLine, Scribble, SectionTag, ShockRing, SparkTitle} from '../../library/laoyang/stage';
import {vis} from '../../library/laoyang/theme';
import {
  DARK_FROM,
  DARK_FROM2,
  DURATION,
  fbt,
  FREEZE,
  GAMED,
  HIT,
  HIT2,
  HOOK,
  kickPulse,
  QUOTE,
  QUOTE_SOURCE,
  SHOTS,
  TITLE,
  TITLE_EN,
  TITLE_SUB,
} from './timeline';

/**
 * ep52 老杨魔方竖版模板（黑金光影风改造：黑底 + 品牌绿光 + 金）。
 * 结构：钩子三句 → 重拍 1 粒子标题 → 三个考核被划掉 → 分叉图 → 重拍 2 金句 + 圈注 → 低调署名。
 * 换题时：改 timeline.ts 的文案和拍号，改这个文件里各段用到的组件；品牌件（左上角标、底部立方体、署名）不用动。
 */

/** 重拍前最后 FREEZE 帧画面静止 */
const freeze = (f: number) => {
  for (const h of [HIT, HIT2]) if (f >= h - FREEZE && f < h) return h - FREEZE - 1;
  return f;
};
/** 重拍前收暗：0 → 0.7，重拍那一帧立刻亮回 */
const darkness = (f: number) => {
  for (const [a, h] of [
    [DARK_FROM, HIT],
    [DARK_FROM2, HIT2],
  ])
    if (f >= a && f < h) return 0.7 * clamp01((f - a) / (h - a - FREEZE));
  return 0;
};
/** 重拍推镜：重拍瞬间 1，约 8 帧衰减 */
const punch = (f: number) => [HIT, HIT2].reduce((v, h) => (f >= h ? Math.max(v, Math.exp(-(f - h) / 8)) : v), 0);

export const Ep52Laoyang: React.FC = () => {
  const frame = useCurrentFrame();
  const f = freeze(frame);
  const pulse = kickPulse(f);
  const quoteOn = vis(f, SHOTS.quote[0], SHOTS.quote[1]);
  return (
    <AbsoluteFill style={{background: '#070908'}}>
      <GlowBg f={f} pulse={pulse} focus={[50, 44]} gold={quoteOn} />
      <GridLines f={f} opacity={0.05} />

      <Camera pulse={pulse} punch={punch(f)}>
        {/* 钩子 */}
        {HOOK.map(([b, text], i) => (
          <RichLine key={i} f={f} at={fbt(b)} text={text} y={720 + i * 170} size={104} out={DARK_FROM} />
        ))}

        {/* 重拍 1：标题 */}
        <ShockRing f={f} at={HIT} y={860} />
        <SparkTitle f={f} at={HIT} title={TITLE} en={TITLE_EN} sub={TITLE_SUB} y={860} size={138} out={fbt(15.4)} instant />

        {/* 01 怎么被玩坏 */}
        <SectionTag f={f} at={fbt(16)} text="01 · 怎么被玩坏的" out={fbt(27.4)} />
        {GAMED.map(([b, text, strikeB], i) => (
          <Pill key={i} f={f} at={fbt(b)} text={text} y={700 + i * 210} w={840} size={52} state="strike" stateAt={fbt(strikeB)} out={fbt(27.4)} />
        ))}
        <Illustrative f={f} at={fbt(17)} out={fbt(27.4)} x={478} y={1250} />

        {/* 02 数字和效果脱钩 */}
        <SectionTag f={f} at={fbt(28)} text="02 · 数字和效果脱钩" out={DARK_FROM2} />
        <DivergeChart f={f} at={fbt(29)} y={620} h={600} dur={45} out={DARK_FROM2} />
        <Illustrative f={f} at={fbt(29)} out={DARK_FROM2} x={860} y={520} />
        <RichLine f={f} at={fbt(34)} text="数字在涨，【效果】在跌" y={1400} size={76} out={DARK_FROM2} />

        {/* 重拍 2：金句 */}
        <ShockRing f={f} at={HIT2} y={880} color="#F5A623" />
        <RichLine f={f} at={HIT2} text={QUOTE[0]} y={800} size={96} out={fbt(51.4)} />
        <RichLine f={f} at={fbt(42)} text={QUOTE[1]} y={960} size={96} out={fbt(51.4)} />
        <Scribble f={f} at={fbt(44)} cx={870} cy={798} rx={124} ry={82} out={fbt(51.4)} />
        <NoteLine f={f} at={fbt(46)} text={QUOTE_SOURCE} y={1120} size={30} out={fbt(51.4)} />

        {/* 片尾：低调署名 */}
        <SignOff f={f} at={fbt(52)} y={1300} out={DURATION - 14} />
      </Camera>

      {/* 品牌常驻件放在镜头外，不跟着推镜 */}
      <CornerMark f={f} at={0} out={fbt(51.5)} />
      <BottomCube f={f} pulse={pulse} out={fbt(51.5)} />

      <AbsoluteFill style={{background: '#000', opacity: darkness(frame), pointerEvents: 'none'}} />
      <Grain opacity={0.07} />
      <Audio src={staticFile('audio/ep52-laoyang-template/mix.wav')} />
    </AbsoluteFill>
  );
};
