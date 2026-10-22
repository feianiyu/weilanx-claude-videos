/**
 * 帕金森定律 ·「给你一周做的事，为什么总拖到最后一天？」（彩雾 + 电子乐，无旁白，40 秒）
 * 时间表（单位：秒）。audio.py 顶部的 HITS 与这里一致；scene.js 里用的是同一组数。
 * 120 BPM，一小节 2 秒。
 */
export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const SEC = 40;
export const DURATION = Math.round(SEC * FPS);
export const BPM = 120;

export const HITS = {
  kick: 4.0, // 鼓进
  squeeze: 8.0, // 方框开始收紧
  gap: 9.5, // 抽空，彩雾吸成亮核
  drop: 10.0, // drop 1：炸开
  split: 16.0, // 一团 → 两团（18 → 四团，20 → 八团）
  brk: 24.0, // 数据段：鼓撤
  ships: 25.0, // 六艘军舰沉下去
  officials: 26.5, // 官员点阵开始增长
  build: 30.0, // 再次被框住、收紧
  gap2: 31.5,
  drop2: 32.0, // drop 2：在边界里炸亮
  outro: 38.0,
} as const;

/** 事实（一手来源：C. N. Parkinson, "Parkinson's Law", The Economist, 1955-11-19） */
export const FACTS = {
  firstLine: 'IT is a commonplace observation that work expands so as to fill the time available for its completion.',
  admiraltyOfficials: [2000, 3569] as const, // 1914 → 1928，+78.45%
  ships: 'diminished two-thirds', // 1914 → 1928
} as const;
