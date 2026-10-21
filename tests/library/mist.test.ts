import {describe, expect, it} from 'vitest';
import {envelope, makeDrive, type Bands} from '../../src/library/mist/drive';
import {MIST_DEMO_BURST, MIST_DEMO_CONTRACT, MIST_DEMO_FRAMES, mb} from '../../src/library/mist/demo';
import bands from '../../src/library/mist/demo-bands.json';

describe('彩雾驱动', () => {
  it('事件包络：attack 内升到 peak、hold 保持、release 落回 0', () => {
    const ev = [{from: 10, attack: 4, hold: 6, release: 10}];
    expect(envelope(ev, 9)).toBe(0);
    expect(envelope(ev, 14)).toBeCloseTo(1);
    expect(envelope(ev, 19)).toBeCloseTo(1);
    expect(envelope(ev, 30)).toBeCloseTo(0);
  });
  it('预览配乐能量覆盖整片，值都在 0–1', () => {
    const b = bands as Bands;
    expect(b.frames.length).toBeGreaterThanOrEqual(MIST_DEMO_FRAMES);
    b.frames.forEach((fr) => fr.forEach((v) => expect(v).toBeGreaterThanOrEqual(0)));
    b.frames.forEach((fr) => fr.forEach((v) => expect(v).toBeLessThanOrEqual(1)));
  });
  it('预览：收缩在爆炸前憋住，爆炸那一帧收缩已经放开', () => {
    const d = makeDrive({bands: bands as Bands, burst: MIST_DEMO_BURST, contract: MIST_DEMO_CONTRACT});
    expect(d(mb(23)).contract).toBeCloseTo(1);
    expect(d(mb(24) + 3).burst).toBeCloseTo(1);
    expect(d(mb(24) + 3).contract).toBeLessThan(0.05);
  });
});
