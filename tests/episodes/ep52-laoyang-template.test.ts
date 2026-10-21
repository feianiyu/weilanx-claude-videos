import {describe, expect, it} from 'vitest';
import {CUBE_PATHS} from '../../src/library/laoyang/brand';
import {plain} from '../../src/library/laoyang/stage';
import {
  BPM,
  DARK_FROM,
  DARK_FROM2,
  DURATION,
  fbt,
  FPS,
  GAMED,
  HIT,
  HIT2,
  HOOK,
  KICK_BEATS,
  kickPulse,
  QUOTE,
  SHOTS,
} from '../../src/episodes/ep52-laoyang-template/timeline';

describe('ep52 老杨魔方竖版模板', () => {
  it('网格：BPM 120，一拍正好 15 帧；片长 30 秒', () => {
    expect(BPM).toBe(120);
    expect(fbt(1)).toBe(15);
    expect(DURATION / FPS).toBe(30);
  });
  it('两个重拍落在小节线上，重拍前留出收暗时间，且这两拍前一拍没有底鼓（抽空）', () => {
    expect(HIT % 60).toBe(0);
    expect(HIT2 % 60).toBe(0);
    expect(HIT - DARK_FROM).toBeGreaterThanOrEqual(15);
    expect(HIT2 - DARK_FROM2).toBeGreaterThanOrEqual(15);
    expect(KICK_BEATS).not.toContain(7);
    expect(KICK_BEATS).not.toContain(39);
    expect(KICK_BEATS).toContain(8);
    expect(KICK_BEATS).toContain(40);
  });
  it('镜头段落首尾相接、覆盖全片', () => {
    const s = Object.values(SHOTS);
    expect(s[0][0]).toBe(0);
    for (let i = 1; i < s.length; i++) expect(s[i][0]).toBe(s[i - 1][1]);
    expect(s[s.length - 1][1]).toBe(DURATION);
  });
  it('文案：每行 ≤ 12 字（手机上 2 秒读完），按拍递增', () => {
    [...HOOK.map(([, t]) => t), ...GAMED.map(([, t]) => t), ...QUOTE].forEach((t) => expect(Array.from(plain(t).replace(/\s/g, '')).length).toBeLessThanOrEqual(12));
    for (let i = 1; i < HOOK.length; i++) expect(HOOK[i][0]).toBeGreaterThan(HOOK[i - 1][0]);
    GAMED.forEach(([at, , strike]) => expect(strike).toBeGreaterThan(at));
  });
  it('底鼓脉冲在鼓点上为 1，之间衰减', () => {
    expect(kickPulse(fbt(8))).toBeCloseTo(1);
    expect(kickPulse(fbt(8) + 10)).toBeLessThan(0.15);
  });
  it('立方体 logo 按看板是 6 段断开的笔画（倒 V、两竖、V、Y 两臂、Y 竖笔）', () => {
    expect(CUBE_PATHS).toHaveLength(6);
  });
});
