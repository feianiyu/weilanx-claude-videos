/**
 * ep52 老杨魔方竖版模板 v2 · 「疏密 / 快慢 / 色彩」三组对比（示例内容：KPI 为什么总被玩坏 · 古德哈特定律）。
 * 无旁白，35 秒，1080×1920。配乐 audio/episodes/ep52-laoyang-template.mjs 纯代码合成：BPM 120，一拍 = 15 帧，一小节 = 60 帧。
 *
 * 段落（拍号）                         疏密   快慢   色彩
 *   0–12  星云：真实的经营，千头万绪       极密   极慢   低饱和灰绿
 *   9–12  星云加速收缩，最后半拍静音
 *   12    重拍 1：撞成一个数字 98.7%        极疏   一击   金
 *   12–22 只看这一个数                      极疏   慢     金 / 黑
 *   22–24 数字抖动、跳位（鼓进）
 *   24–44 裂成 36 格，数字疯长；28 起横切绿带  极密   极快   高饱和绿
 *   40–44 绿带变灰「可业务呢？」，灰色从底部退潮吞掉格子
 *   44    重拍 2：定格，米白从「目标」处圆形扩散铺满（擦除，不闪白），配乐抽空
 *   45–59 指标一旦成了 / 目标 / 就不再是好指标   留白   极慢   反色米白 + 深绿
 *   60–70 署名组合（浅底版）
 * 这个文件不 import 任何别的 .ts / .tsx；改拍号时音频脚本顶部的表一起改。
 */
export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const BPM = 120;
export const BEAT = 60 / BPM;
export const beatSec = (b: number) => b * BEAT;
export const fr = (sec: number) => Math.round(sec * FPS);
/** 第 b 拍的帧（可以是小数拍） */
export const fbt = (b: number) => fr(beatSec(b));

export const TOTAL_BEATS = 70;
export const DURATION = fbt(TOTAL_BEATS);

export const HIT = fbt(12);
export const HIT2 = fbt(44);
export const FREEZE = 3;

/** 关键时刻（帧） */
export const T = {
  contract: fbt(9), // 星云开始收缩
  jitter: fbt(22), // 数字开始抖
  shatter: fbt(24), // 裂成格子
  band: fbt(28), // 横切绿带
  bandLines: [fbt(28), fbt(30), fbt(32)],
  crazy: fbt(34), // 「数字疯长」
  gray: fbt(40), // 绿带变灰 + 退潮
  wipe: HIT2, // 米白圆形擦除
  wipeDur: 23,
  lightA: fbt(45.5), // 指标一旦成了
  goal: fbt(46), // 目标（慢慢浮现 2 秒）
  goalDur: 60,
  rule: fbt(49),
  lightB: fbt(50), // 就不再是好指标
  source: fbt(52),
  lightOut: fbt(59),
  sign: fbt(60),
};

export const SHOTS = {
  nebula: [0, HIT],
  number: [HIT, T.shatter],
  grid: [T.shatter, HIT2],
  light: [HIT2, T.sign],
  outro: [T.sign, DURATION],
} as const;

/** 心跳（星云段，轻）与底鼓（律动段）所在的拍 —— 与音频脚本一致 */
export const HEART_BEATS = [0, 2, 4, 6, 8];
export const KICK_BEATS: number[] = [20, 21, 22, 23, ...Array.from({length: 20}, (_, i) => 24 + i)];
const PULSES: [number, number][] = [...HEART_BEATS.map((b) => [fbt(b), 0.45] as [number, number]), ...KICK_BEATS.map((b) => [fbt(b), 1] as [number, number])].sort((a, b) => a[0] - b[0]);
/** 鼓点脉冲 0–1：心跳弱、底鼓强，约 5 帧衰减 */
export const kickPulse = (f: number) => {
  let v = 0;
  for (const [k, a] of PULSES) {
    if (k > f) break;
    v = Math.max(v, a * Math.exp(-(f - k) / 4.5));
  }
  return v;
};

/* ---------------- 文案 ---------------- */
/** 星云里漂着的经营要素 */
export const REALITY_WORDS = ['客户', '订单', '回款', '口碑', '员工', '交付', '复购', '库存', '流程', '信任', '渠道', '质量', '现金流', '士气', '售后', '供应商'];
export const NEBULA_TEXT = {label: '01 / REALITY', a: '真实的经营', b: '千头万绪'};
export const NUMBER = {value: 98.7, label: 'KPI · 达成率', line: '于是，我们只看这一个数'};
/** 横切绿带里依次闪过的三条（示意，不是具体公司案例），最后砸「数字疯长」 */
export const BAND_LINES = ['考核点击 → 刷点击', '考核工单 → 拆工单', '考核时长 → 拖时长'];
export const BAND_CRAZY = '数字疯长';
export const BAND_GRAY = '可业务呢？';
/** 格子行标签（9 行） */
export const GRID_LABELS = ['点击', '工单', '时长', '线索', '评分', '转化', '拜访', '覆盖', '产量'];
export const QUOTE = {a: '指标一旦成了', goal: '目标', b: '就不再是好指标', source: '—— 古德哈特定律（通行表述）'};
