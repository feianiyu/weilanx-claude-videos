import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {clamp01, rand} from '../../library/anim';
import {BottomCube, CornerMark, SignOff} from '../../library/laoyang/brand';
import {BigNumber, CircleWipe, ConvergeStreaks, FallingDots, KpiGrid, Nebula, NebulaWords, Rule, SlamBand, SlowText} from '../../library/laoyang/contrast';
import {Grain, ShockRing} from '../../library/laoyang/stage';
import {L, LL} from '../../library/laoyang/theme';
import {
  BAND_CRAZY,
  BAND_GRAY,
  BAND_LINES,
  DURATION,
  fbt,
  FREEZE,
  GRID_LABELS,
  HIT,
  HIT2,
  kickPulse,
  NEBULA_TEXT,
  NUMBER,
  QUOTE,
  REALITY_WORDS,
  T,
} from './timeline';

/**
 * ep52 老杨魔方竖版模板 v2：「千头万绪 → 一个数字 → 数字疯长 → 留白」。
 * 疏密：上万光点 → 一个数 → 36 格 → 一个词；快慢：极慢 → 一击 → 慢 → 极快 → 定格 → 极慢；
 * 色彩：低饱和灰绿 → 金 / 黑 → 高饱和绿 → 灰 → 反色米白 + 深绿。
 * 换题时改 timeline.ts 的文案和拍号；这个文件是一套可复用的「对比结构」，各段组件都在 src/library/laoyang/contrast.tsx。
 */

const eo = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const ei = (t: number, p = 2.6) => Math.pow(clamp01(t), p);

/** 重拍 2 前最后 FREEZE 帧画面静止 */
const freeze = (f: number) => (f >= HIT2 - FREEZE && f < HIT2 ? HIT2 - FREEZE - 1 : f);
/** 推镜 + 抖动：重拍瞬间最大，约 8 帧衰减 */
const impacts: [number, number][] = [
  [HIT, 1],
  [T.shatter, 0.6],
  [T.crazy, 0.5],
];
const punch = (f: number) => impacts.reduce((v, [h, a]) => (f >= h ? Math.max(v, a * Math.exp(-(f - h) / 8)) : v), 0);

/** 数字抖动期间跳的数 */
const JUMPS = ['98.7', '98.9', '99.2', '99.6', '100.4', '101.9', '103.5'];

export const Ep52Laoyang: React.FC = () => {
  const frame = useCurrentFrame();
  const f = freeze(frame);
  const pulse = kickPulse(f);
  const p = punch(f);
  const shakeX = p > 0.05 ? (rand(Math.floor(f) + 11) - 0.5) * 24 * p : 0;
  const shakeY = p > 0.05 ? (rand(Math.floor(f) + 13) - 0.5) * 18 * p : 0;

  const contract = f < HIT ? ei((f - T.contract) / (HIT - T.contract - 1)) : 1;
  const jitter = f >= T.jitter && f < T.shatter ? clamp01((f - T.jitter) / (T.shatter - T.jitter)) : 0;
  const jumpIdx = jitter > 0 ? Math.min(JUMPS.length - 1, Math.floor((f - T.jitter) / 4)) : 0;
  const numGlow = f >= HIT && f < T.shatter + 6 ? 1 - clamp01((f - T.shatter) / 6) : 0;

  return (
    <AbsoluteFill style={{background: '#050706'}}>
      {/* ---------- 暗场：星云 → 数字 → 格子 ---------- */}
      <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px) scale(${1 + 0.008 * pulse + 0.05 * p})`, transformOrigin: '50% 48%'}}>
        {/* 01 星云：极密、极慢、低饱和 */}
        {f < HIT && <Nebula f={f} contract={contract} target={[110, 820, 760, 250]} />}
        {f < HIT && <NebulaWords f={f} words={REALITY_WORDS} at={fbt(1)} every={6} contract={contract} />}
        <SlowText f={f} at={fbt(1)} text={NEBULA_TEXT.label} y={1470} size={22} color="#5f7068" kind="latin" spacing={0.4} out={T.contract} />
        <SlowText f={f} at={fbt(2)} text={NEBULA_TEXT.a} y={1510} size={64} color="#e6ece9" dur={26} out={T.contract} />
        <SlowText f={f} at={fbt(4)} text={NEBULA_TEXT.b} y={1600} size={64} color="#8fb3a3" kind="serif" dur={30} out={T.contract} />

        {/* 02 一个数：极疏、金、黑 */}
        {numGlow > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 26% at 40% 52%, rgba(245,166,35,${0.22 * numGlow}) 0%, rgba(0,0,0,0) 70%)`}} />}
        <ConvergeStreaks f={f} at={HIT} out={T.shatter - 4} />
        <ShockRing f={f} at={HIT} x={450} y={950} color={L.gold} max={1100} />
        <SlowText f={f} at={fbt(13)} text={NUMBER.label} y={700} size={24} color="#a07a30" kind="medium" spacing={0.4} dur={14} out={T.shatter - 8} />
        <Rule f={f} at={fbt(13)} y={744} w={120} color={L.gold} dur={12} out={T.shatter - 8} />
        <BigNumber f={f} at={HIT} value={JUMPS[jumpIdx]} jitter={jitter} out={T.shatter} />
        <SlowText f={f} at={fbt(15)} text={NUMBER.line} y={1290} size={40} color={L.gray} kind="medium" dur={30} out={T.shatter - 8} />

        {/* 03 数字疯长：极密、极快、高饱和 */}
        <KpiGrid f={f} at={T.shatter} end={HIT2} labels={GRID_LABELS} grayAt={T.gray} rowStep={7} pulse={pulse} freezeFrom={HIT2 - FREEZE - 1} />
        <ShockRing f={f} at={T.shatter} x={450} y={950} color={L.green} max={1000} />
        <SlamBand
          f={f}
          at={T.band}
          lines={[
            [T.bandLines[0], BAND_LINES[0], 86],
            [T.bandLines[1], BAND_LINES[1], 86],
            [T.bandLines[2], BAND_LINES[2], 86],
            [T.crazy, BAND_CRAZY, 150],
            [T.gray, BAND_GRAY, 124],
          ]}
          grayAt={T.gray}
        />
      </AbsoluteFill>
      <CornerMark f={f} at={0} />
      <BottomCube f={f} pulse={pulse} at={0} out={T.shatter - 6} />

      {/* ---------- 04 反色留白：米白从「目标」处扩出 ---------- */}
      <CircleWipe f={frame} at={T.wipe} dur={T.wipeDur} x={472} y={920}>
        <AbsoluteFill style={{background: LL.bg}} />
        <FallingDots f={frame} at={HIT2} out={T.lightOut} />
        <SlowText f={frame} at={T.lightA} text={QUOTE.a} y={620} size={56} color={LL.ink} dur={24} out={T.lightOut} />
        <SlowText f={frame} at={T.goal} text={QUOTE.goal} x={72} y={690} size={400} color={LL.green} kind="serif" spacing={-0.015} dur={T.goalDur} out={T.lightOut} />
        <Rule f={frame} at={T.rule} y={1190} accent={LL.greenBrand} dur={24} out={T.lightOut} />
        <SlowText f={frame} at={T.lightB} text={QUOTE.b} y={1240} size={56} color={LL.ink} dur={24} out={T.lightOut} />
        <SlowText f={frame} at={T.source} text={QUOTE.source} y={1340} size={26} color={LL.gray} kind="serif" spacing={0.1} dur={20} out={T.lightOut} />
        <CornerMark f={frame} at={HIT2} tone="light" out={T.sign - 8} />
        <BottomCube f={frame} at={T.lightA} out={T.sign - 8} tone="light" />
        {/* 05 署名（浅底版） */}
        <SignOff f={frame} at={T.sign} y={1290} out={DURATION - 14} tone="light" />
      </CircleWipe>

      <Grain opacity={frame >= HIT2 ? 0.05 * eo((frame - HIT2) / 18) + 0.03 : 0.07} />
      <Audio src={staticFile('audio/ep52-laoyang-template/mix.wav')} />
    </AbsoluteFill>
  );
};
