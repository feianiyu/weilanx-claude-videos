// ep52 老杨魔方竖版模板：配乐 + 音效全部纯代码合成，混成一条 mix.wav（无旁白，配乐就是主音轨）。
// BPM 120，一拍 0.5 秒，一小节 2 秒；片长 60 拍 = 30 秒。与 src/episodes/ep52-laoyang-template/timeline.ts 一一对应：
//   KICK 拍号 = timeline 的 KICK_BEATS；重拍 8、40；抽空 6–7、38–39；SFX 表的拍号 = 画面里各元素出现的拍号。
// 和弦：前段 Am F C G 制造紧张，金句段 C G Am 明亮，结尾 F G | C。
// 响度：两遍 loudnorm 到约 −15 LUFS、真峰值 ≤ −3 dBTP（单遍法会偏响）。需要本机有 ffmpeg。
// 运行：node audio/episodes/ep52-laoyang-template.mjs → public/audio/ep52-laoyang-template/mix.wav
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CH, boom, crash, lp1, pad, swell} from '../score.mjs';
import {SR, bass, bell, encodeWav, filterBuf, hat, kick, mixInto, mtof, noise, pluck, reverb, setSeed, snap} from '../synth.mjs';

const EP = 'ep52-laoyang-template';
const BEAT = 0.5;
const TOTAL_BEATS = 60;
const SEC = TOTAL_BEATS * BEAT;
const t = (b) => b * BEAT;
const range = (a, b) => Array.from({length: b - a + 1}, (_, i) => a + i);

/* ---------- 段落表 ---------- */
// 每小节一个和弦（第 13 小节前两拍 F、后两拍 G）
const BARS = ['Am', 'F', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'C', 'G', 'Am', ['F', 'G'], 'C'];
const KICK = [...range(0, 5), ...range(8, 37), ...range(40, 55), 56];
const DROP = (b) => (b >= 6 && b < 8) || (b >= 38 && b < 40);
const GROOVE = (b) => b >= 8 && b < 56 && !DROP(b);
const BRIGHT = (b) => b >= 40;

/** 音效表：[拍, 名字, 音量] —— 和画面元素一一对应 */
const SFX = [
  [0, 'tick', 0.5], [2, 'tick', 0.5], [4, 'tick', 0.55], // 钩子三句
  [8, 'impact', 1], // 重拍 1：粒子标题
  [16, 'whoosh', 0.5], // 01 段落
  [17, 'pop', 0.55], [19, 'pop', 0.55], [21, 'pop', 0.55], // 三个药丸
  [23, 'strike', 0.6], [24, 'strike', 0.6], [25, 'strike', 0.65], // 依次划掉
  [28, 'whoosh', 0.5], // 02 段落
  [29, 'rise', 0.35], // 分叉图画线
  [40, 'impact', 1.05], // 重拍 2：金句
  [42, 'tick', 0.5],
  [44, 'ding', 0.5], // 圈注
  [52, 'sparkle', 0.5], // 署名
];
const RISERS = [8, 40]; // 重拍前 2 秒的上升

/* ---------- 乐器 / 音效 ---------- */
const buf = (sec) => new Float32Array(Math.round(sec * SR));
const env = (x, k) => x.map((v, i) => v * Math.exp((-i / SR) * k));
const FX = {
  tick() {
    const o = buf(0.08);
    for (let i = 0; i < o.length; i++) o[i] = (Math.sin((2 * Math.PI * 2400 * i) / SR) * 0.6 + noise() * 0.3) * Math.exp((-i / SR) * 90);
    return o;
  },
  pop() {
    const o = buf(0.22);
    let ph = 0;
    for (let i = 0; i < o.length; i++) {
      const tt = i / SR;
      ph += (380 + 900 * Math.exp(-tt * 40)) / SR;
      o[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-tt * 22) * Math.min(1, i / 30);
    }
    return o;
  },
  strike() {
    // 一道往下划的「嘶」+ 一点低频
    const o = buf(0.35);
    let y = 0;
    for (let i = 0; i < o.length; i++) {
      const tt = i / SR;
      const cut = 6000 * Math.exp(-tt * 9) + 300;
      y += (1 - Math.exp((-2 * Math.PI * cut) / SR)) * (noise() - y);
      o[i] = y * Math.exp(-tt * 9) * 1.6 + Math.sin(2 * Math.PI * 90 * tt) * Math.exp(-tt * 14) * 0.5;
    }
    return o;
  },
  impact() {
    const b = boom(1.8, 90, 36);
    const c = crash(1.6);
    const k = kick();
    const o = buf(1.8);
    mixInto(o, b, 0, 1);
    mixInto(o, c, 0, 0.35);
    mixInto(o, k, 0, 0.8);
    return o;
  },
  whoosh() {
    const o = buf(0.6);
    let y = 0;
    for (let i = 0; i < o.length; i++) {
      const tt = i / SR;
      const cut = 300 + 5000 * Math.sin(Math.PI * Math.min(1, tt / 0.6));
      y += (1 - Math.exp((-2 * Math.PI * cut) / SR)) * (noise() - y);
      o[i] = y * Math.sin(Math.PI * Math.min(1, tt / 0.6)) ** 2;
    }
    return o;
  },
  rise() {
    const o = buf(1.6);
    let ph = 0;
    for (let i = 0; i < o.length; i++) {
      const tt = i / SR;
      ph += (220 * Math.pow(2, tt / 1.6)) / SR;
      o[i] = Math.sin(2 * Math.PI * ph) * Math.min(1, tt / 0.3) * Math.min(1, (1.6 - tt) / 0.4) * 0.6;
    }
    return o;
  },
  ding() {
    const o = buf(1.4);
    mixInto(o, bell(1568, 1.4), 0, 0.8);
    mixInto(o, bell(2349, 1.0), 0.04, 0.35);
    return o;
  },
  sparkle() {
    const o = buf(1.6);
    [76, 79, 84, 88, 91].forEach((m, i) => mixInto(o, bell(mtof(m), 1.2), i * 0.06, 0.4));
    return o;
  },
};

/* ---------- 编曲 ---------- */
setSeed(52);
const N = Math.round((SEC + 1.5) * SR);
const drums = new Float32Array(N);
const synth = new Float32Array(N); // pad + arp，走混响
const low = new Float32Array(N); // bass
const fx = new Float32Array(N);

const chordAt = (b) => {
  const c = BARS[Math.floor(b / 4)];
  return Array.isArray(c) ? c[(b % 4) < 2 ? 0 : 1] : c;
};

// 和弦垫：每小节一个（第 13 小节拆两半）；前奏和抽空段更闷
for (let bar = 0; bar < BARS.length; bar++) {
  const halves = Array.isArray(BARS[bar]) ? BARS[bar] : [BARS[bar]];
  halves.forEach((name, h) => {
    const b0 = bar * 4 + h * (4 / halves.length);
    const dur = (4 / halves.length) * BEAT + 0.4;
    const cut = b0 < 8 ? 700 : BRIGHT(b0) ? 2200 : 1400;
    const isLast = bar === BARS.length - 1;
    const p = pad(CH[name].map((m) => m + 12), isLast ? 3.4 : dur, {atk: b0 < 8 ? 0.8 : 0.08, rel: isLast ? 2.4 : 0.4, cut});
    mixInto(synth, p, t(b0), b0 < 8 ? 0.55 : 0.7);
  });
}
// 琶音：律动段 8 分音符，金句段高八度
for (let b2 = 16; b2 < 112; b2++) {
  const b = b2 / 2;
  if (!GROOVE(b)) continue;
  const notes = CH[chordAt(b)];
  const m = notes[[0, 2, 1, 3, 2, 1, 3, 2][b2 % 8]] + (BRIGHT(b) ? 24 : 12);
  mixInto(synth, pluck(mtof(m), 0.45, BRIGHT(b) ? 0.75 : 0.5), t(b), b < 16 ? 0.16 : 0.24);
}
// 贝斯：律动段反拍 8 分
for (let b2 = 16; b2 < 112; b2++) {
  const b = b2 / 2;
  if (!GROOVE(b) || b2 % 2 === 0) continue;
  mixInto(low, bass(mtof(CH[chordAt(b)][0] - 12), 0.24), t(b), 0.75);
}
// 鼓：底鼓、二四拍拍手、反拍踩镲
for (const b of KICK) mixInto(drums, kick(), t(b), b < 8 ? 0.55 : 0.95);
for (let b = 8; b < 56; b++) if (GROOVE(b) && b % 2 === 1) mixInto(drums, snap(), t(b), 0.45);
for (let b2 = 16; b2 < 112; b2++) if (GROOVE(b2 / 2) && b2 % 2 === 1) mixInto(drums, hat(), t(b2 / 2), 0.22);
// 前奏最后两拍的「吸气」：反向噪声推到重拍
for (const hb of RISERS) mixInto(fx, swell(2.0, {from: 400, to: 9000}), t(hb) - 2.0, 0.28);
for (const [b, name, v] of SFX) mixInto(fx, FX[name](), t(b), v);

// 前奏低通
const intro = Math.round(t(8) * SR);
lp1(lp1(synth.subarray(0, intro), 1200), 1200);

// 边链压缩：底鼓后 pad / arp / bass 让出空间
const duck = new Float32Array(N).fill(1);
for (const b of KICK) {
  const s = Math.round(t(b) * SR);
  for (let i = 0; i < 0.22 * SR && s + i < N; i++) duck[s + i] = Math.min(duck[s + i], 1 - 0.55 * Math.exp((-i / SR) * 14));
}
for (let i = 0; i < N; i++) {
  synth[i] *= duck[i];
  low[i] *= duck[i];
}
const wet = reverb(synth, 0.28, 0.8);
filterBuf(low, 'lp', 900);

const mix = new Float32Array(N);
for (let i = 0; i < N; i++) mix[i] = drums[i] * 0.85 + wet[i] * 0.9 + low[i] * 0.8 + fx[i] * 0.8;
// 结尾 1.2 秒淡出，片长之后静音
for (let i = 0; i < N; i++) {
  const tt = i / SR;
  if (tt > SEC - 1.2) mix[i] *= Math.max(0, (SEC - tt) / 1.2);
}
let peak = 0;
for (const v of mix) peak = Math.max(peak, Math.abs(v));
for (let i = 0; i < N; i++) mix[i] = Math.tanh((mix[i] / peak) * 1.15) * 0.8;

/* ---------- 出片：两遍响度 ---------- */
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'audio', EP);
mkdirSync(dir, {recursive: true});
const raw = join(dir, 'mix_raw.wav');
writeFileSync(raw, encodeWav(mix.subarray(0, Math.round(SEC * SR)), SR));
const target = 'I=-15:TP=-3.4:LRA=11';
// 第一遍：测量（ffmpeg 把 loudnorm 的 JSON 打在 stderr）
const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', `pan=stereo|c0=c0|c1=c0,loudnorm=${target}:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8'});
const m = JSON.parse(r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1));
// 第二遍：带测量值线性处理，转 48k 立体声
const second = `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', `pan=stereo|c0=c0|c1=c0,${second},aresample=48000`, '-c:a', 'pcm_s16le', join(dir, 'mix.wav')]);
console.log(`wrote ${EP}/mix.wav (${SEC}s)；处理前 ${m.input_i} LUFS / ${m.input_tp} dBTP`);
