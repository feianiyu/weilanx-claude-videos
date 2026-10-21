import type React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {clamp01} from '../anim';

/**
 * 老杨魔方 · 竖版知识动画（由黑金光影风改造）。
 * 近黑底 + 一团团缓慢呼吸的品牌绿光，粗黑体大字一拍一个弹出；强调词用绿色宋体，数字 / 副标 / 短横线用金。
 * 品牌以「老杨魔方」标准看板为准：深底用亮绿立方体 logo，浅底用深绿。
 * 全部按 1080×1920 竖屏、30fps 设计；抖音安全区：主要内容放在 x 100–960、y 250–1560。
 */
export const L = {
  bg: '#070908', // 深色版底
  bgLift: '#0c120e', // 稍亮的底（卡片）
  green: '#2BE08A', // 亮绿：深底 logo、光晕、强调词
  greenBrand: '#13A24E', // 品牌绿：实心块、浅底文字
  greenDeep: '#0B5A2E', // 浅底用的深绿 logo
  glow: 'rgba(43,224,138,', // 拼透明度用
  gold: '#F5A623', // 副标、短横线、数字
  goldSoft: 'rgba(245,166,35,0.55)',
  ink: '#F6F7F5', // 正文白
  inkDim: 'rgba(246,247,245,0.62)',
  inkFaint: 'rgba(246,247,245,0.28)',
  gray: '#8C938E',
  red: '#FF6B5A', // 只给「被玩坏 / 划掉」用，克制使用
};

/** 安全区（像素） */
export const SAFE = {left: 100, right: 960, top: 250, bottom: 1560};

/** 浅底（反色段）色板：按看板，浅底用深绿 logo */
export const LL = {
  bg: '#F2F1EC', // 米白
  ink: '#121412', // 墨黑
  green: '#0B5A2E', // 深绿：logo、大字
  greenBrand: '#13A24E', // 品牌绿：短线
  gray: '#8C938E',
  hair: '#C9CCC8', // 细线
};

/**
 * 字体随仓库带上（public/fonts/laoyang/，SIL OFL）：思源黑体 / Noto Sans SC 的 Black 与 Medium、Noto Serif SC Bold、Inter。
 * 中文是 GB2312 一二级常用字的子集（约 7000 字 + 常用标点和 → ↑ ↓），文案里出现生僻字会回落到系统字体。
 */
const FACES: [string, string, string][] = [
  ['LY Sans', 'fonts/laoyang/LYSans-Black.woff', '900'],
  ['LY Sans', 'fonts/laoyang/LYSans-Medium.woff', '500'],
  ['LY Serif', 'fonts/laoyang/LYSerif-Bold.woff', '700'],
  ['LY Num', 'fonts/laoyang/InterDisplay-ExtraBold.woff', '800'],
  ['LY Latin', 'fonts/laoyang/Inter-SemiBold.woff', '600'],
];
if (typeof document !== 'undefined') {
  const handle = delayRender('load laoyang fonts');
  Promise.all(
    FACES.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, {weight});
      return face.load().then((loaded) => document.fonts.add(loaded));
    }),
  )
    .catch((err) => console.error(err))
    .finally(() => continueRender(handle));
}

export const LF = {
  sans: `'LY Sans', 'Noto Sans CJK SC', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif`,
  serif: `'LY Serif', 'Noto Serif CJK SC', 'Noto Serif SC', 'Songti SC', 'STSong', serif`,
  num: `'LY Num', 'Inter Display', 'Inter', 'Helvetica Neue', Arial, sans-serif`,
  latin: `'LY Latin', 'Inter', 'Helvetica Neue', Arial, sans-serif`,
};

/** 发光字：同色多层外发光 */
export const glow = (color: string = L.ink, r = 18, strength = 1): React.CSSProperties => ({
  color,
  textShadow: `0 0 ${r * 0.3}px ${color}${hex2(0.55 * strength)}, 0 0 ${r}px ${color}${hex2(0.45 * strength)}, 0 3px 16px rgba(0,0,0,0.9)`,
});
const hex2 = (a: number) => Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

const eo3 = (t: number) => 1 - Math.pow(1 - t, 3);
/** 回弹缓出：弹出时略微过冲 */
export const eb = (t: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * 弹出（P）：缩放 0.6→1 带过冲 + 模糊收清 + 上移 30px；out 起 10 帧淡出上飘。
 * 返回直接可 spread 进 style 的属性和可见度 v。
 */
export const pop = (f: number, at: number, dur = 10, out?: number, outDur = 10) => {
  const p = clamp01((f - at) / dur);
  const o = out === undefined ? 0 : clamp01((f - out) / outDur);
  const v = p * (1 - o);
  const s = 0.6 + 0.4 * eb(p) + 0.04 * o;
  const y = (1 - eo3(p)) * 30 - eo3(o) * 40;
  const blur = (1 - p) * 14 + o * 10;
  return {
    v,
    style: {
      opacity: Math.min(1, p * 1.6) * (1 - o),
      transform: `translateY(${y}px) scale(${s})`,
      filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
    } as React.CSSProperties,
  };
};

/** 模糊柔入（慢一点的出现，用于背景性文字） */
export const soft = (f: number, at: number, dur = 16, out?: number, outDur = 12) => {
  const i = eo3(clamp01((f - at) / dur));
  const o = out === undefined ? 1 : 1 - clamp01((f - out) / outDur);
  const v = i * o;
  return {v, style: {opacity: v, filter: v >= 0.99 ? undefined : `blur(${(1 - v) * 10}px)`} as React.CSSProperties};
};

/** 线条画出进度 */
export const drawP = (f: number, at: number, dur = 12) => eo3(clamp01((f - at) / dur));

/** 场的可见度：a 起淡入、b 前淡出 */
export const vis = (f: number, a: number, b: number, fin = 8, fout = 8) => clamp01((f - a) / fin) * (1 - clamp01((f - (b - fout)) / fout));
