import type {MistEvent} from './drive';

/**
 * 彩雾预览作品 library-color-mist 的时间表（24 秒，BPM 120，一拍 15 帧）。
 * 配乐 audio/episodes/library-color-mist.mjs 按同样的拍号合成；能量 JSON 用 scripts/audio-bands.mjs 从成品配乐里提取。
 *   0–12  呼吸：只有铺底和低频涌动，雾团慢慢呼吸、流动
 *   12–22 律动：底鼓每拍一下，雾团跟着鼓点一胀一缩，踩镲让光网闪
 *   22    瞬间收缩：3 帧吸成一个亮核，憋住近 2 拍（配乐倒吸气、最后半拍静音）
 *   24    瞬间爆炸：甩满全屏，拖尾 + 色散，慢慢重新聚回来
 *   32–40 张力：越拧越紧、越拉越长（上升音）
 *   40    再次收缩成核，核跟着鼓点跳 4 拍
 *   44    终极爆炸，散尽淡出
 * 这个文件只 import 类型。
 */
export const MIST_DEMO_FPS = 30;
export const MIST_DEMO_FRAMES = 48 * 15;
export const mb = (beat: number) => Math.round(beat * 15);

export const MIST_DEMO_BURST: MistEvent[] = [
  {from: mb(24), attack: 3, hold: 6, release: 90},
  {from: mb(44), attack: 3, hold: 10, release: 110},
];
export const MIST_DEMO_CONTRACT: MistEvent[] = [
  {from: mb(22), attack: 3, hold: mb(2) - 6, release: 3},
  {from: mb(40), attack: 5, hold: mb(4) - 8, release: 3},
];
export const MIST_DEMO_TWIST: MistEvent[] = [{from: mb(32), attack: mb(8), hold: 0, release: 4, ease: 'in'}];

/** 段落名（预览左上角的小字） */
export const MIST_DEMO_LABELS: [number, string][] = [
  [0, '呼吸 · breathe'],
  [mb(12), '律动 · pulse'],
  [mb(22), '瞬间收缩 · implode'],
  [mb(24), '瞬间爆炸 · burst'],
  [mb(32), '张力 · twist'],
  [mb(40), '收缩成核 · core'],
  [mb(44), '终极爆炸 · finale'],
];
