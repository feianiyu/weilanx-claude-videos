// ep52 老杨魔方竖版模板 v2：配乐 + 音效全部纯代码合成，混成一条 mix.wav（无旁白，配乐就是主音轨）。
// BPM 120，一拍 0.5 秒；片长 70 拍 = 35 秒。与 src/episodes/ep52-laoyang-template/timeline.ts 一一对应：
//   0–12  星云：低沉铺底 + 心跳（0 2 4 6 8 拍）+ 几声玻璃铃；9–11.5 拍上升，11.5–12 拍静音
//   12    重拍 1：重击 + 金色闪光
//   12–24 一个数：只剩一个钢琴音型 + 低音持续；20–23 拍底鼓渐入，22 拍起数字故障声
//   24–44 满编律动（Am F C G Am），28 色带砸下，34「数字疯长」；40 起低通慢慢关上（退潮）
//   44    重拍 2：全部抽空，只留一声极低的闷响；45–59 慢钢琴 + 弦乐铺底（C G Am F）
//   60–70 署名：F G | C，淡出
// 响度：两遍 loudnorm 到约 −15 LUFS、真峰值 ≤ −3 dBTP。需要本机有 ffmpeg。
// 运行：node audio/episodes/ep52-laoyang-template.mjs → public/audio/ep52-laoyang-template/mix.wav
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CH, boom, crash, fall, lp1, pad, swell} from '../score.mjs';
import {SR, bass, bell, encodeWav, filterBuf, hat, kick, mixInto, mtof, noise, pluck, reverb, setSeed, snap} from '../synth.mjs';

const EP = 'ep52-laoyang-template';
const BEAT = 0.5;
const TOTAL_BEATS = 70;
const SEC = TOTAL_BEATS * BEAT;
const t = (b) => b * BEAT;
const range = (a, b) => Array.from({length: b - a + 1}, (_, i) => a + i);

/* ---------- 段落表（与 timeline.ts 一致） ---------- */
const HIT = 12;
const SHATTER = 24;
const BAND = 28;
const BAND_LINES = [30, 32];
const CRAZY = 34;
const GRAY = 40;
const HIT2 = 44;
const LIGHT = 45;
const GOAL = 46;
const SIGN = 60;
const HEART = [0, 2, 4, 6, 8];
const KICK = [20, 21, 22, 23, ...range(24, 43)];
const GROOVE = (b) => b >= SHATTER && b < HIT2;
/** 退潮行变灰的拍：第 40 拍起每 7 帧一行，共 9 行 */
const TIDE = Array.from({length: 9}, (_, i) => GRAY + (i * 7) / 15);

/* ---------- 乐器 / 音效 ---------- */
const buf = (sec) => new Float32Array(Math.round(sec * SR));
/** 简易钢琴：拨弦 + 铃音泛音 + 一点锤击 */
const piano = (m, dur = 2.4, vel = 1) => {
  const o = buf(dur);
  const f0 = mtof(m);
  mixInto(o, pluck(f0, dur, 0.35), 0, 0.7 * vel);
  mixInto(o, bell(f0, dur), 0, 0.35 * vel);
  for (let i = 0; i < 0.01 * SR; i++) o[i] += noise() * 0.15 * vel * (1 - i / (0.01 * SR));
  return lp1(o, 4200);
};
/** 心跳：两下闷响 */
const heart = () => {
  const o = buf(0.6);
  const k = kick();
  mixInto(o, k, 0, 1);
  mixInto(o, k, 0.2, 0.55);
  return lp1(lp1(o, 220), 220);
};
const FX = {
  glass: (m) => {
    const o = buf(2);
    mixInto(o, bell(mtof(m), 2), 0, 0.5);
    mixInto(o, bell(mtof(m + 12), 1.4), 0.01, 0.15);
    return o;
  },
  impact(big = 1) {
    const o = buf(2.4);
    mixInto(o, boom(2.2, 95, 32), 0, 1);
    mixInto(o, crash(2.0), 0, 0.3 * big);
    mixInto(o, kick(), 0, 0.9);
    return o;
  },
  shimmer() {
    const o = buf(2.2);
    [81, 84, 88, 93, 96].forEach((m, i) => mixInto(o, bell(mtof(m), 1.8), i * 0.035, 0.22));
    return o;
  },
  glitch(seed) {
    // 数字故障：一小段被切碎的方波 + 噪声
    const o = buf(0.12);
    for (let i = 0; i < o.length; i++) {
      const tt = i / SR;
      const fq = 600 + ((seed * 977) % 2400);
      o[i] = (Math.sign(Math.sin(2 * Math.PI * fq * tt)) * 0.4 + noise() * 0.4) * (Math.floor(tt * 90) % 2 ? 1 : 0.2) * Math.exp(-tt * 18);
    }
    return filterBuf(o, 'hp', 400);
  },
  shatter() {
    const o = buf(1.2);
    for (let i = 0; i < o.length; i++) {
      const tt = i / SR;
      o[i] = noise() * Math.exp(-tt * 7) * 0.7;
    }
    filterBuf(o, 'hp', 2500);
    [3520, 4186, 5274].forEach((fq, k) => mixInto(o, bell(fq, 0.6), k * 0.02, 0.2));
    return o;
  },
  whoosh(len = 0.5) {
    const o = buf(len);
    let y = 0;
    for (let i = 0; i < o.length; i++) {
      const tt = i / SR;
      const u = tt / len;
      const cut = 300 + 6000 * Math.sin(Math.PI * Math.min(1, u));
      y += (1 - Math.exp((-2 * Math.PI * cut) / SR)) * (noise() - y);
      o[i] = y * Math.sin(Math.PI * Math.min(1, u)) ** 2;
    }
    return o;
  },
  tick() {
    const o = buf(0.05);
    for (let i = 0; i < o.length; i++) o[i] = (Math.sin((2 * Math.PI * 1800 * i) / SR) * 0.5 + noise() * 0.2) * Math.exp((-i / SR) * 120);
    return o;
  },
  sub() {
    const o = boom(2.6, 60, 28);
    return lp1(o, 120);
  },
};

/* ---------- 编曲 ---------- */
setSeed(52);
const N = Math.round((SEC + 2) * SR);
const drums = new Float32Array(N);
const music = new Float32Array(N); // pad / 钢琴 / 琶音，走混响
const low = new Float32Array(N);
const fx = new Float32Array(N);

// 星云：低沉铺底 Am（慢起），9 拍起慢慢变亮，11.5 拍掐断
{
  const p = pad([33, 45, ...CH.Am.map((m) => m + 12)], t(11.5), {atk: 3, rel: 0.05, cut: 700});
  mixInto(music, p, 0, 0.85);
}
for (const b of HEART) mixInto(drums, heart(), t(b), 0.42);
[1, 3.4, 5.8, 8.2].forEach((b, i) => mixInto(fx, FX.glass([81, 76, 84, 79][i]), t(b), 0.35));
mixInto(fx, swell(t(11.5) - t(9), {from: 300, to: 9000}), t(9), 0.4);
// 上升正弦 + 越来越密的滴答
{
  const o = buf(t(11.5) - t(9));
  let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const tt = i / SR;
    const u = tt / (o.length / SR);
    ph += (110 * Math.pow(2, u * 3)) / SR;
    o[i] = Math.sin(2 * Math.PI * ph) * u * u * 0.5;
  }
  mixInto(fx, o, t(9), 0.5);
  let tt = 0;
  for (let k = 0; tt < t(11.5) - t(9); k++) {
    mixInto(fx, FX.tick(), t(9) + tt, 0.25 + 0.3 * (tt / 1.25));
    tt += 0.22 * Math.pow(0.86, k);
  }
}

// 重拍 1
mixInto(fx, FX.impact(1), t(HIT), 1.1);
mixInto(fx, FX.shimmer(), t(HIT), 0.6);

// 一个数：钢琴音型（每拍一个音）+ 低音持续
const OST = [[69, 76, 72, 76], [65, 72, 69, 72], [69, 76, 72, 76]];
for (let b = 13; b < 24; b++) {
  const bar = Math.min(2, Math.floor((b - 12) / 4));
  mixInto(music, piano(OST[bar][(b - 12) % 4], 1.8, b >= 20 ? 0.75 : 0.9), t(b), 0.55);
}
mixInto(low, pad([33, 40], t(24) - t(12), {atk: 0.6, rel: 0.3, cut: 300}), t(12), 0.45);
for (const [k, b] of [22, 22.5, 23, 23.25, 23.5, 23.75].entries()) mixInto(fx, FX.glitch(k + 3), t(b), 0.45);

// 律动段
for (const b of KICK) mixInto(drums, kick(), t(b), b < 24 ? 0.6 + (b - 20) * 0.08 : 0.95);
for (let b = 25; b < HIT2; b += 2) mixInto(drums, snap(), t(b), 0.5);
for (let s = SHATTER * 4; s < HIT2 * 4; s++) if (s % 2 || s >= BAND * 4) mixInto(drums, hat(s % 4 === 2), t(s / 4), s % 2 ? 0.22 : 0.14);
const chordAt = (b) => ['Am', 'F', 'C', 'G', 'Am'][Math.min(4, Math.floor((b - SHATTER) / 4))];
for (let bar = 0; bar < 5; bar++) {
  const b0 = SHATTER + bar * 4;
  mixInto(music, pad(CH[chordAt(b0)].map((m) => m + 12), t(4) + 0.3, {atk: 0.05, rel: 0.3, cut: 1800}), t(b0), 0.6);
}
for (let s = SHATTER * 4; s < HIT2 * 4; s++) {
  const b = s / 4;
  const notes = CH[chordAt(b)];
  const m = notes[[0, 2, 1, 3][s % 4]] + (b >= BAND ? 24 : 12);
  mixInto(music, pluck(mtof(m), 0.3, 0.8), t(b), b >= BAND ? 0.2 : 0.15);
}
for (let s = SHATTER * 2; s < HIT2 * 2; s++) if (s % 2) mixInto(low, bass(mtof(CH[chordAt(s / 2)][0] - 12), 0.22), t(s / 2), 0.8);

mixInto(fx, FX.impact(0.6), t(SHATTER), 0.8);
mixInto(fx, FX.shatter(), t(SHATTER), 0.6);
mixInto(fx, FX.whoosh(0.4), t(BAND) - 0.15, 0.5);
mixInto(fx, kick(), t(BAND), 0.6);
for (const b of BAND_LINES) mixInto(fx, FX.whoosh(0.25), t(b) - 0.05, 0.35);
mixInto(fx, FX.impact(0.5), t(CRAZY), 0.8);
mixInto(fx, fall(1.4, 700, 90), t(GRAY), 0.45);
for (const b of TIDE) mixInto(fx, FX.tick(), t(b), 0.3);

// 退潮：40 拍起低通从 8k 关到 300
{
  const a = Math.round(t(GRAY) * SR), z = Math.round(t(HIT2) * SR);
  for (const bus of [music, drums, low]) {
    let y = 0;
    for (let i = a; i < z; i++) {
      const u = (i - a) / (z - a);
      const cut = 8000 * Math.pow(300 / 8000, u);
      y += (1 - Math.exp((-2 * Math.PI * cut) / SR)) * (bus[i] - y);
      bus[i] = y;
    }
  }
}
// 重拍 2：44 拍起全部抽空
{
  const z = Math.round(t(HIT2) * SR);
  for (const bus of [music, drums, low]) for (let i = z; i < Math.round(t(LIGHT) * SR); i++) bus[i] = 0;
}
mixInto(fx, FX.sub(), t(HIT2), 0.55);

// 留白：慢钢琴 + 弦乐铺底
const SLOW = [
  [45, 'C', [48, 55, 64]],
  [49, 'G', [43, 50, 62]],
  [53, 'Am', [45, 52, 60]],
  [57, 'F', [41, 48, 57]],
];
for (const [b0, name, notes] of SLOW) {
  mixInto(music, pad(CH[name].map((m) => m + 12), t(4) + 0.8, {atk: 1.2, rel: 0.8, cut: 1600}), t(b0), 0.6);
  notes.forEach((m, i) => mixInto(music, piano(m, 3, 0.8), t(b0 + i * 1.33), 0.7));
}
mixInto(music, piano(60, 4, 1), t(GOAL), 0.6); // 「目标」浮现
// 署名：F G | C
[
  [SIGN, 'F', 2],
  [SIGN + 2, 'G', 2],
  [SIGN + 4, 'C', 6],
].forEach(([b, name, len]) => mixInto(music, pad(CH[name].map((m) => m + 12), t(len) + 0.6, {atk: 0.3, rel: 0.6, cut: 1800}), t(b), 0.5));
[65, 67, 72, 76, 79, 84].forEach((m, i) => mixInto(music, piano(m, 2.4, 0.6), t(SIGN + 4 + i * 0.5), 0.35));
mixInto(fx, FX.shimmer(), t(SIGN), 0.3);

/* ---------- 混音 ---------- */
// 边链：底鼓后让出空间
const duck = new Float32Array(N).fill(1);
for (const b of KICK) {
  const s = Math.round(t(b) * SR);
  for (let i = 0; i < 0.22 * SR && s + i < N; i++) duck[s + i] = Math.min(duck[s + i], 1 - 0.5 * Math.exp((-i / SR) * 14));
}
for (let i = 0; i < N; i++) {
  music[i] *= duck[i];
  low[i] *= duck[i];
}
const wet = reverb(music, 0.32, 0.82);
filterBuf(low, 'lp', 900);
const mix = new Float32Array(N);
for (let i = 0; i < N; i++) mix[i] = drums[i] * 0.85 + wet[i] * 0.95 + low[i] * 0.8 + fx[i] * 0.8;
for (let i = 0; i < N; i++) {
  const tt = i / SR;
  if (tt > SEC - 1.4) mix[i] *= Math.max(0, (SEC - tt) / 1.4);
}
let peak = 0;
for (const v of mix) peak = Math.max(peak, Math.abs(v));
for (let i = 0; i < N; i++) mix[i] = Math.tanh((mix[i] / peak) * 1.2) * 0.8;

/* ---------- 出片：两遍响度 ---------- */
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'audio', EP);
mkdirSync(dir, {recursive: true});
const raw = join(dir, 'mix_raw.wav');
writeFileSync(raw, encodeWav(mix.subarray(0, Math.round(SEC * SR)), SR));
const target = 'I=-15:TP=-3.4:LRA=14';
// 第一遍：测量（ffmpeg 把 loudnorm 的 JSON 打在 stderr）
const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', `pan=stereo|c0=c0|c1=c0,loudnorm=${target}:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8'});
const m = JSON.parse(r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1));
// 第二遍：带测量值线性处理，转 48k 立体声
const second = `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', `pan=stereo|c0=c0|c1=c0,${second},aresample=48000`, '-c:a', 'pcm_s16le', join(dir, 'mix.wav')]);
console.log(`wrote ${EP}/mix.wav (${SEC}s)；处理前 ${m.input_i} LUFS / ${m.input_tp} dBTP`);
