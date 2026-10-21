/**
 * ep52 老杨魔方竖版模板（示例内容：KPI 为什么总被玩坏 · 古德哈特定律）。无旁白，约 30 秒，1080×1920。
 * 配乐由 audio/episodes/ep52-laoyang-template.mjs 纯代码合成（BPM 120，一小节 = 2 秒 = 60 帧，一拍 = 15 帧），
 * 所以拍子网格是精确的，不用实测。改 BPM / 段落时，两边一起改（音频脚本顶部的 SECTIONS 与这里的 SHOTS、KICK 对应）。
 *
 * 段落（拍号）：
 *   0–7   钩子：三句话一拍一个弹出；第 6 拍起收暗、抽掉鼓
 *   8     重拍 1：粒子聚成标题「古德哈特定律」
 *   16–27 01 怎么被玩坏：三个考核药丸依次弹出，再依次被划掉（示意）
 *   28–39 02 数字和效果脱钩：分叉图（示意）；第 38 拍起收暗
 *   40    重拍 2：金句两行砸出，圈注「目标」，下方出处
 *   52–59 片尾：署名组合，低调、短停留
 * 这个文件不 import 任何别的 .ts / .tsx。
 */
export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const BPM = 120;
export const BEAT = 60 / BPM;
export const beatSec = (b: number) => b * BEAT;
export const fr = (sec: number) => Math.round(sec * FPS);
/** 第 b 拍的帧（可以是小数拍，如 23.5） */
export const fbt = (b: number) => fr(beatSec(b));

export const TOTAL_BEATS = 60;
export const DURATION = fbt(TOTAL_BEATS);

export const HIT = fbt(8);
export const HIT2 = fbt(40);
/** 重拍前收暗：约 0.7 秒；最后 3 帧画面静止 */
export const DARK_FROM = HIT - 21;
export const DARK_FROM2 = HIT2 - 21;
export const FREEZE = 3;

export const SHOTS = {
  hook: [0, HIT],
  title: [HIT, fbt(16)],
  gamed: [fbt(16), fbt(28)],
  diverge: [fbt(28), HIT2],
  quote: [HIT2, fbt(52)],
  outro: [fbt(52), DURATION],
} as const;

/** 底鼓所在的拍（与音频脚本一致）：驱动镜头微推、底部 logo 脉动、绿光呼吸 */
export const KICK_BEATS: number[] = [
  ...[0, 1, 2, 3, 4, 5],
  ...Array.from({length: 30}, (_, i) => 8 + i), // 8–37
  ...Array.from({length: 16}, (_, i) => 40 + i), // 40–55
  56,
];
const KICK_FRAMES = KICK_BEATS.map(fbt);
/** 底鼓脉冲 0–1：每下底鼓瞬间到 1，约 5 帧衰减 */
export const kickPulse = (f: number) => {
  let v = 0;
  for (const k of KICK_FRAMES) {
    if (k > f) break;
    v = Math.max(v, Math.exp(-(f - k) / 4.5));
  }
  return v;
};

/** 示例文案：【】绿色宋体强调，〔〕金，〖〗红。每行 ≤ 10 字，手机上 2 秒内读完 */
export const HOOK: [number, string][] = [
  [0, '定了 〔KPI〕'],
  [2, '数字【涨了】'],
  [4, '业务却〖没变好〗？'],
];
export const TITLE = '古德哈特定律';
export const TITLE_EN = "Goodhart's Law";
export const TITLE_SUB = 'KPI 为什么总被玩坏';

/** 被玩坏的三个考核（示意，不是具体公司案例）：[出现拍, 文字, 被划掉的拍] */
export const GAMED: [number, string, number][] = [
  [17, '考核点击量 → 〖刷点击〗', 23],
  [19, '考核工单数 → 〖拆工单〗', 24],
  [21, '考核通话时长 → 〖拖时长〗', 25],
];

export const QUOTE: [string, string] = ['指标一旦成了【目标】', '就不再是好指标'];
/** 出处：通行表述来自人类学家 Marilyn Strathern（1997）对 Goodhart（1975）观点的概括 */
export const QUOTE_SOURCE = '常见表述 · 概括自经济学家古德哈特 1975 年的观点';
