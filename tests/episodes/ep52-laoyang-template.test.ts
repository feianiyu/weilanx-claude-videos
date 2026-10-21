import {describe, expect, it} from 'vitest';
import {CUBE_PATHS} from '../../src/library/laoyang/brand';
import {BAND_CRAZY, BAND_GRAY, BAND_LINES, BPM, DURATION, fbt, FPS, GRID_LABELS, HIT, HIT2, KICK_BEATS, kickPulse, NUMBER, QUOTE, SHOTS, T} from '../../src/episodes/ep52-laoyang-template/timeline';

const len = (s: string) => Array.from(s.replace(/\s/g, '')).length;

describe('ep52 老杨魔方竖版模板 v2', () => {
  it('网格：BPM 120，一拍 15 帧；片长 35 秒', () => {
    expect(BPM).toBe(120);
    expect(fbt(1)).toBe(15);
    expect(DURATION / FPS).toBe(35);
  });
  it('两个重拍、裂格、色带都落在小节线上', () => {
    [HIT, HIT2, T.shatter, T.band].forEach((f) => expect(f % 60).toBe(0));
  });
  it('重拍 2 前后：底鼓在 44 拍前结束（抽空），擦除在署名前完成', () => {
    expect(Math.max(...KICK_BEATS)).toBeLessThan(44);
    expect(T.wipe + T.wipeDur).toBeLessThan(T.lightA + 1);
    expect(T.goal + T.goalDur).toBeLessThan(T.lightOut);
  });
  it('镜头段落首尾相接、覆盖全片', () => {
    const s = Object.values(SHOTS);
    expect(s[0][0]).toBe(0);
    for (let i = 1; i < s.length; i++) expect(s[i][0]).toBe(s[i - 1][1]);
    expect(s[s.length - 1][1]).toBe(DURATION);
  });
  it('文案：手机上 2 秒读完（每行 ≤ 12 字），9 行格子标签', () => {
    [...BAND_LINES, BAND_CRAZY, BAND_GRAY, NUMBER.line, QUOTE.a, QUOTE.b].forEach((s) => expect(len(s)).toBeLessThanOrEqual(12));
    expect(GRID_LABELS).toHaveLength(9);
  });
  it('鼓点脉冲：律动段的底鼓上为 1', () => {
    expect(kickPulse(fbt(24))).toBeCloseTo(1);
    expect(kickPulse(fbt(24) + 10)).toBeLessThan(0.15);
  });
  it('立方体 logo 按看板是 6 段断开的笔画', () => {
    expect(CUBE_PATHS).toHaveLength(6);
  });
});
