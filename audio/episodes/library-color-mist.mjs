// 彩雾预览 library-color-mist 的配乐：纯代码合成，24 秒，BPM 120（拍号与 src/library/mist/demo.ts 一致）。
//   0–12 铺底 + 低频涌动；12–22 律动；22 倒吸气 → 23.5 静音 → 24 重击；24–32 律动（更亮）；
//   32–40 上升；40–44 收紧的鼓点；44 终极重击，散尽。
// 运行：node audio/episodes/library-color-mist.mjs → public/audio/library-color-mist/mix.wav
// 再：node scripts/audio-bands.mjs public/audio/library-color-mist/mix.wav src/library/mist/demo-bands.json
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CH, boom, crash, lp1, pad, swell} from '../score.mjs';
import {SR, bass, bell, encodeWav, filterBuf, hat, kick, mixInto, mtof, noise, pluck, reverb, setSeed, snap} from '../synth.mjs';

const EP = 'library-color-mist';
const BEAT = 0.5;
const SEC = 24;
const t = (b) => b * BEAT;
setSeed(77);
const N = Math.round((SEC + 2) * SR);
const music = new Float32Array(N);
const drums = new Float32Array(N);
const low = new Float32Array(N);
const fx = new Float32Array(N);
const buf = (s) => new Float32Array(Math.round(s * SR));

const GROOVE = (b) => (b >= 12 && b < 22) || (b >= 24 && b < 40);
const KICKS = [];
for (let b = 12; b < 22; b++) KICKS.push(b);
for (let b = 24; b < 40; b++) KICKS.push(b);
for (let b = 40; b < 44; b++) KICKS.push(b, b + 0.5); // 收成核时鼓点加密

// 和弦：Dm Bb F C 循环，每小节一个
const PROG = ['Dm', 'Bb', 'F', 'C'];
for (let bar = 0; bar < 12; bar++) {
  const b0 = bar * 4;
  if (b0 >= 44) break;
  const name = PROG[bar % 4];
  const cut = b0 < 12 ? 900 : b0 >= 32 ? 2600 : 1700;
  mixInto(music, pad(CH[name].map((m) => m + 12), t(4) + 0.4, {atk: b0 < 12 ? 1.2 : 0.06, rel: 0.4, cut}), t(b0), b0 < 12 ? 0.7 : 0.55);
}
// 开头的低频涌动
mixInto(low, pad([38, 45], t(12), {atk: 2, rel: 0.5, cut: 220}), 0, 1.2);
for (const b of [0, 4, 8]) mixInto(low, boom(2.2, 70, 34), t(b), 0.5);
[2, 5.5, 9].forEach((b, i) => mixInto(fx, bell(mtof([86, 81, 89][i]), 2), t(b), 0.25));

for (const b of KICKS) mixInto(drums, kick(), t(b), b >= 40 ? 0.8 : 0.95);
for (let b = 13; b < 40; b += 2) if (GROOVE(b)) mixInto(drums, snap(), t(b), 0.45);
for (let s = 24; s < 80; s++) if (GROOVE(s / 2) && s % 2) mixInto(drums, hat(), t(s / 2), 0.25);
for (let s = 96; s < 160; s++) if (GROOVE(s / 4)) mixInto(drums, hat(s % 4 === 2), t(s / 4), s % 2 ? 0.2 : 0.12);
const chordAt = (b) => CH[PROG[Math.floor(b / 4) % 4]];
for (let s = 24; s < 80; s++) if (GROOVE(s / 2) && s % 2) mixInto(low, bass(mtof(chordAt(s / 2)[0] - 12), 0.22), t(s / 2), 0.8);
for (let s = 96; s < 160; s++) if (GROOVE(s / 4)) mixInto(music, pluck(mtof(chordAt(s / 4)[[0, 2, 1, 3][s % 4]] + 24), 0.3, 0.8), t(s / 4), 0.16);

// 22 拍：倒吸气（反向噪声 + 下滑），23.5 拍起静音
{
  const o = swell(t(23.5) - t(22), {from: 8000, to: 300});
  for (let i = 0; i < o.length; i++) o[i] *= 1 - i / o.length;
  mixInto(fx, o, t(22), 0.5);
  const z = buf(t(23.5) - t(22));
  let ph = 0;
  for (let i = 0; i < z.length; i++) {
    const u = i / z.length;
    ph += (900 * Math.pow(0.15, u)) / SR;
    z[i] = Math.sin(2 * Math.PI * ph) * (1 - u) * 0.5;
  }
  mixInto(fx, z, t(22), 0.6);
}
// 重击
const impact = (gain) => {
  const o = buf(2.6);
  mixInto(o, boom(2.4, 100, 30), 0, 1);
  mixInto(o, crash(2.2), 0, 0.4);
  mixInto(o, kick(), 0, 0.9);
  [84, 88, 91, 96].forEach((m, i) => mixInto(o, bell(mtof(m), 1.6), i * 0.03, 0.18));
  return o;
};
mixInto(fx, impact(1), t(24), 1.1);
mixInto(fx, impact(1), t(44), 1.25);
// 32–40 上升
mixInto(fx, swell(t(40) - t(32), {from: 200, to: 10000}), t(32), 0.35);
{
  const o = buf(t(40) - t(32));
  let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const u = i / o.length;
    ph += (55 * Math.pow(2, u * 4)) / SR;
    o[i] = (Math.sin(2 * Math.PI * ph) + 0.3 * Math.sin(4 * Math.PI * ph)) * u * u * 0.45;
  }
  mixInto(fx, lp1(o, 3000), t(32), 0.6);
}
// 40 拍：吸进去的一声
mixInto(fx, filterBuf(Float32Array.from({length: Math.round(0.4 * SR)}, (_, i) => noise() * (i / (0.4 * SR))), 'bp', 1200, 1), t(40) - 0.4, 0.5);
// 结尾的余韵
mixInto(music, pad(CH.Dm.map((m) => m + 12), t(4) + 1.5, {atk: 0.02, rel: 1.6, cut: 2000}), t(44), 0.5);

// 混音
for (let i = Math.round(t(23.5) * SR); i < Math.round(t(24) * SR); i++) music[i] = drums[i] = low[i] = 0;
const wet = reverb(music, 0.3, 0.82);
filterBuf(low, 'lp', 800);
const mix = new Float32Array(N);
for (let i = 0; i < N; i++) mix[i] = drums[i] * 0.85 + wet[i] * 0.95 + low[i] * 0.8 + fx[i] * 0.8;
for (let i = 0; i < N; i++) {
  const tt = i / SR;
  if (tt > SEC - 1.5) mix[i] *= Math.max(0, (SEC - tt) / 1.5);
}
let peak = 0;
for (const v of mix) peak = Math.max(peak, Math.abs(v));
for (let i = 0; i < N; i++) mix[i] = Math.tanh((mix[i] / peak) * 1.2) * 0.8;

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'audio', EP);
mkdirSync(dir, {recursive: true});
const raw = join(dir, 'mix_raw.wav');
writeFileSync(raw, encodeWav(mix.subarray(0, Math.round(SEC * SR)), SR));
const target = 'I=-15:TP=-3.4:LRA=14';
const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', `pan=stereo|c0=c0|c1=c0,loudnorm=${target}:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8'});
const m = JSON.parse(r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1));
const second = `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', `pan=stereo|c0=c0|c1=c0,${second},aresample=48000`, '-c:a', 'pcm_s16le', join(dir, 'mix.wav')]);
console.log(`wrote ${EP}/mix.wav (${SEC}s)`);
