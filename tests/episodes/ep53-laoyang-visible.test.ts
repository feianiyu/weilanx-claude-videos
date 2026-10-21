import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {buildTimedPath, kf, kfSmooth, pathUntil, superPoint} from '../../src/library/glowline/core';
import {makeTrack, roundedFrameTrack} from '../../src/library/glowline/effects';
import {DURATION, FPS, HITS, SEC, SHOTS, TEXT} from '../../src/episodes/ep53-laoyang-visible/timeline';

const len = (s: string) => Array.from(s.replace(/\s/g, '')).length;

describe('ep53 老杨魔方 · 让知识可见（光点开场）', () => {
  it('片长 32.9 秒、30fps', () => {
    expect(FPS).toBe(30);
    expect(DURATION).toBe(987);
    expect(DURATION / FPS).toBeCloseTo(SEC, 5);
  });
  it('镜头段落首尾相接、覆盖全片', () => {
    const s = Object.values(SHOTS);
    expect(s[0][0]).toBe(0);
    for (let i = 1; i < s.length; i++) expect(s[i][0]).toBe(s[i - 1][1]);
    expect(s[s.length - 1][1]).toBe(SEC);
  });
  it('三次低频重击正好是三个切换点：青光冲刷、白闪、硬切黑底', () => {
    expect(HITS.wash).toBe(SHOTS.wash[0]);
    expect(HITS.flash).toBe(SHOTS.white[0]);
    expect(HITS.cut).toBe(SHOTS.frame[0]);
  });
  it('绳线碰三颗胶囊的叮声按顺序、落在白底段内', () => {
    const d = [HITS.ding1, HITS.ding2, HITS.ding3];
    d.forEach((x) => expect(x > SHOTS.white[0] && x < SHOTS.white[1]).toBe(true));
    expect(d[0] < d[1] && d[1] < d[2]).toBe(true);
  });
  it('配乐脚本的 HITS 与 timeline 一致', () => {
    const py = readFileSync(join(process.cwd(), 'audio/episodes/ep53-laoyang-visible.py'), 'utf8');
    const m = py.match(/^HITS = (\{.*\})$/m);
    expect(m).not.toBeNull();
    expect(JSON.parse((m as RegExpMatchArray)[1])).toEqual(HITS);
  });
  it('文案：每屏 ≤ 7 字，胶囊 3 颗', () => {
    [TEXT.open, TEXT.ring, TEXT.dots, TEXT.frame, TEXT.card.big, TEXT.card.sub, ...TEXT.pills, TEXT.line1.join(''), TEXT.line2.join('')].forEach((s) => expect(len(s)).toBeLessThanOrEqual(7));
    expect(TEXT.pills).toHaveLength(3);
  });
});

describe('glowline 工具', () => {
  it('kf：端点取首尾值、中点按缓动插值', () => {
    const k: [number, number][] = [[0, 0], [1, 10]];
    expect(kf(-1, k)).toBe(0);
    expect(kf(2, k)).toBe(10);
    expect(kf(0.5, k, (u) => u)).toBe(5);
  });
  it('kfSmooth：经过每个关键点，相邻同点时原地停住', () => {
    const K: [number, [number, number]][] = [[0, [0, 0]], [1, [0, 0]], [2, [10, 5]], [3, [20, 0]]];
    expect(kfSmooth(0.5, K)).toEqual([0, 0]);
    const p = kfSmooth(2, K);
    expect(p[0]).toBeCloseTo(10);
    expect(p[1]).toBeCloseTo(5);
  });
  it('超椭圆：e=1 是圆，e=2.7 的四个角仍在半径上', () => {
    const [x, y] = superPoint(0, 0, 100, 1, 0, Math.PI / 4);
    expect(Math.hypot(x, y)).toBeCloseTo(100);
    const [x2, y2] = superPoint(0, 0, 100, 2.7, 0, 0);
    expect(x2).toBeCloseTo(100);
    expect(y2).toBeCloseTo(0);
  });
  it('带时间的路径：pathUntil 的线头精确落在 t 上', () => {
    const P = buildTimedPath([[0, 0, 0], [1, 100, 0], [2, 100, 100]], 8);
    const seen = pathUntil(P, 1.5);
    expect(seen[seen.length - 1][0]).toBeCloseTo(1.5);
    expect(pathUntil(P, -1)).toHaveLength(0);
  });
  it('描边轨迹：弧长单调递增，圆角框总长与本期关键帧一致', () => {
    const tr = makeTrack([[0, 0], [3, 4], [3, 10]]);
    expect(tr.L).toBeCloseTo(11);
    const f = roundedFrameTrack();
    for (let i = 1; i < f.pts.length; i++) expect(f.pts[i][0]).toBeGreaterThanOrEqual(f.pts[i - 1][0]);
    expect(f.L).toBeGreaterThan(1602);
    expect(f.L).toBeLessThan(2300);
  });
});
