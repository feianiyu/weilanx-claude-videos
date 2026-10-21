// 把一段配乐拆成逐帧的三段能量，给彩雾（src/library/mist）这类「跟着音乐动」的组件用。
// 用法：node scripts/audio-bands.mjs <配乐.wav> <输出.json> [fps=30]
//   低频 < 150 Hz（底鼓、贝斯）、中频 200–2000 Hz（和弦、铺底）、高频 > 5 kHz（踩镲、铃音）
//   每段：逐帧 RMS → 按 98 分位归一到 0–1 → 0.7 次方压一下动态 → 起音立即、释放约 4 帧的包络
// 只支持 16-bit PCM wav（多声道会混成单声道）。输出 {fps, frames: [[low, mid, high], ...]}。
import {readFileSync, writeFileSync} from 'node:fs';
import {readWavMono} from '../audio/bgm.mjs';

const [, , input, output, fpsArg] = process.argv;
if (!input || !output) {
  console.error('用法：node scripts/audio-bands.mjs <配乐.wav> <输出.json> [fps=30]');
  process.exit(1);
}
const fps = Number(fpsArg ?? 30);
const {samples, sr} = readWavMono(readFileSync(input));

const onePole = (cut) => {
  const a = 1 - Math.exp((-2 * Math.PI * cut) / sr);
  let y = 0;
  return (x) => (y += a * (x - y));
};
const lp150 = onePole(150);
const lp150b = onePole(150);
const lp200 = onePole(200);
const lp2000 = onePole(2000);
const lp5000 = onePole(5000);

const hop = sr / fps;
const nFrames = Math.ceil(samples.length / hop);
const acc = [new Float64Array(nFrames), new Float64Array(nFrames), new Float64Array(nFrames)];
const cnt = new Float64Array(nFrames);
for (let i = 0; i < samples.length; i++) {
  const x = samples[i];
  const lo = lp150b(lp150(x));
  const mid = lp2000(x) - lp200(x);
  const hi = x - lp5000(x);
  const k = Math.floor(i / hop);
  acc[0][k] += lo * lo;
  acc[1][k] += mid * mid;
  acc[2][k] += hi * hi;
  cnt[k]++;
}
const bands = acc.map((a) => {
  const rms = Array.from(a, (v, k) => Math.sqrt(v / Math.max(1, cnt[k])));
  const sorted = [...rms].sort((p, q) => p - q);
  const ref = sorted[Math.floor(sorted.length * 0.98)] || 1;
  let env = 0;
  return rms.map((v) => {
    const x = Math.pow(Math.min(1, v / ref), 0.7);
    env = x > env ? x : env * 0.78 + x * 0.22;
    return Math.round(env * 1000) / 1000;
  });
});
const frames = Array.from({length: nFrames}, (_, k) => [bands[0][k], bands[1][k], bands[2][k]]);
writeFileSync(output, JSON.stringify({fps, frames}));
console.log(`wrote ${output}: ${nFrames} 帧（${(nFrames / fps).toFixed(2)} 秒）`);
