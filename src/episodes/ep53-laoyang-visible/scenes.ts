/**
 * ep53 画面：9 个段落，render(t) 是时间 t（秒）的纯函数。
 * 招牌动效都来自 src/library/glowline/，这里只做时间编排（关键帧）。
 */
import {c, clamp, clearFrame, CX, CY, ei2, eio, eo3, eoBack, font, GC, H, kf, kfSmooth, lerp, lin, mixHex, pathUntil, buildTimedPath, rgba, seg, superPoint, W, withCtx, type TimedPt, type Vec} from '../../library/glowline/core';
import {blob, dot, sparkle, wordsLine} from '../../library/glowline/draw';
import {
  blobCluster,
  boldSweep,
  bump,
  capsule,
  cometTrail,
  drawTrack,
  glowDisc,
  gradientCard,
  inflateFlash,
  lensText,
  logoReveal,
  morphPill,
  radialWipe,
  ringStar,
  roundedFrameTrack,
  stringLine,
  topVeil,
  typeOn,
  washBand,
} from '../../library/glowline/effects';
import {HITS, TEXT} from './timeline';

/* ───────── 1 开场：光点升起、光盘、冲刷（0–2.37） ───────── */
const mainDotY = (t: number) => kf(t, [[0, 1880], [0.2, 1350], [0.4, 1130], [0.62, 900], [1.3, 940], [1.57, 1000], [1.64, 1010], [1.7, 650], [1.87, 460], [2.0, 460]], eo3);
function rise(t: number) {
  if (t > HITS.wash) return;
  const g = c();
  const y1 = mainDotY(t);
  // 底部蓝色光丘
  const mound = seg(t, 0.35, 0.75) * (1 - seg(t, 1.45, 1.6));
  withCtx(() => {
    g.globalCompositeOperation = 'lighter';
    g.translate(CX, 2010);
    g.scale(1, 0.5);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 620);
    gr.addColorStop(0, rgba('#2030ff', 0.95 * mound));
    gr.addColorStop(0.6, rgba('#1a28ff', 0.45 * mound));
    gr.addColorStop(1, rgba('#1a28ff', 0));
    g.fillStyle = gr;
    g.fillRect(-620, -620, 1240, 1240);
  });
  // 竖线底部的蓝色锥光
  const cone = seg(t, 0.18, 0.35) * (1 - seg(t, 0.55, 0.75));
  if (cone > 0)
    withCtx(() => {
      g.globalCompositeOperation = 'lighter';
      g.filter = 'blur(6px)';
      const gr = g.createLinearGradient(0, 1920, 0, 1500);
      gr.addColorStop(0, rgba('#3040ff', cone));
      gr.addColorStop(1, rgba('#3040ff', 0));
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(CX - 40, 1920);
      g.lineTo(CX, 1480);
      g.lineTo(CX + 40, 1920);
      g.fill();
    });
  // 光盘：在光点下方生成、向下推进变大；1.22 起整串收拢（像镜头拉远）
  [0.45, 0.9, 1.12, 1.3].forEach((b, i) => {
    const p = seg(t, b, b + 0.85);
    if (p <= 0 || p >= 1) return;
    const zc = kf(t, [[1.22, 1], [1.66, 0.5]], eio);
    const y = y1 + (930 + 1050 * Math.pow(p, 1.1) - 900) * lerp(1, zc, 0.6) + 20;
    const w = (340 + 1250 * p) * (i === 0 ? 1.3 : 1) * zc;
    glowDisc(CX, y, w, seg(p, 0, 0.1) * (1 - seg(p, 0.75, 1)));
  });
  // 竖线 + 缠绕的螺旋线
  withCtx(() => {
    g.strokeStyle = 'rgba(255,255,255,0.75)';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(CX, 1940);
    g.lineTo(CX, y1);
    g.stroke();
    const y2 = Math.min(1900, y1 + 22 + (1 - seg(t, 0, 0.5)) * 160);
    const ph0 = -Math.asin(0.2);
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = 1.6;
    g.beginPath();
    for (let y = y2; y <= 1940; y += 6) {
      const k = Math.min(1, (y - y2) / 170);
      const x = CX + 22 * Math.sin(ph0) * (1 - k) + 115 * k * Math.sin(ph0 + ((y - y2) / 420) * Math.PI - t * 2.2);
      if (y === y2) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    dot(CX - 18, y2, 7, seg(t, 0.12, 0.2));
  });
  dot(CX, y1, 9, seg(t, 0, 0.06));
  wordsLine(t, [{s: TEXT.open, tin: 0.55, tout: 1.5}], CX, 620, 60, {spacing: 6, weight: 400});
}
function wash(t: number) {
  if (t > 1.42 && t < HITS.wash) topVeil(kf(t, [[1.42, 0], [1.6, 640], [HITS.wash, 900]], ei2));
  if (t >= HITS.wash && t <= 1.97) washBand(kf(t, [[HITS.wash, -260], [1.7, 560], [1.735, 830], [1.77, 1080], [1.8, 1260], [1.87, 1560], [1.97, 1960]], eo3));
}
function bridgeDot(t: number) {
  if (t < 1.3 || t > 2.38) return;
  const y = t < 2.0 ? mainDotY(t) : lerp(460, 960, ei2(seg(t, 2.0, 2.37)));
  if (t < HITS.wash)
    withCtx(() => {
      const g = c();
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(CX, y);
      g.lineTo(CX, y + 260 * (1 - seg(t, 1.6, HITS.wash)));
      g.stroke();
    });
  dot(CX, y, 9, 1);
}

/* ───────── 2 光环：分裂、玻璃透镜、旋转变星（2.35–5.1） ───────── */
const ringR = (t: number) => kf(t, [[2.36, 4], [2.5, 290], [2.7, 380], [3.0, 405], [3.9, 470]], eo3);
const shapeState = (t: number) => ({
  e: kf(t, [[3.9, 1], [4.08, 2.2], [4.25, 2.8], [4.5, 2.7], [4.66, 2.4], [4.76, 1.6], [4.9, 1.8], [5.05, 3.0]]),
  S: t < 3.9 ? ringR(t) : kf(t, [[3.9, 470], [4.4, 500], [4.6, 470], [4.75, 330], [4.92, 200], [5.05, 70]]),
  rot: kf(t, [[3.6, 0], [3.9, -0.45], [4.15, 0.15], [4.4, 0], [4.65, -0.4], [4.85, -0.9], [5.05, -1.5]]),
});
function ring(t: number) {
  if (t < 2.35 || t > 5.1) return;
  const g = c();
  const {e, S, rot} = shapeState(t);
  const shapeA = 1 - seg(t, 4.92, 5.05);
  const glowA = t > 2.4 ? kf(t, [[2.4, 0.35], [2.7, 0.55], [3.3, 0.85], [3.9, 1], [4.5, 1], [4.95, 0.9], [5.06, 0]], lin) * shapeA : 0;
  const lineA = t > 2.45 ? shapeA * seg(t, 2.45, 2.7) : 0;
  ringStar({S, e, rot, spin: 0.8 * t + 1.2, glowA, lineA});
  // 文字：玻璃透镜折射 → 从中心化开变清晰 → 随形旋转、运动模糊消失
  if (t < 3.2) {
    if (t > 2.42)
      withCtx(() => {
        g.globalAlpha = seg(t, 2.42, 2.52);
        lensText({text: TEXT.ring, R: Math.max(10, ringR(t) * 0.93), D: kf(t, [[2.4, 1], [2.85, 1], [3.2, 0]], lin), clearR: kf(t, [[2.7, 0], [3.18, 520]], lin)});
      });
  } else if (t < 5.02) {
    const tr = t > 4.45 ? rot : 0;
    const sc = t > 4.55 ? clamp(S / 470, 0.2, 1) : 1;
    const bl = 9 * seg(t, 4.55, 4.9);
    const a = 1 - seg(t, 4.8, 5.0);
    for (let gI = t > 4.5 ? 3 : 0; gI >= 0; gI--)
      withCtx(() => {
        g.translate(CX, CY);
        g.rotate(tr + gI * 0.06);
        g.scale(sc, sc);
        g.globalAlpha = a * (gI ? 0.28 : 1);
        if (bl > 0.3) g.filter = `blur(${bl}px)`;
        g.font = font(300, 66);
        g.letterSpacing = '4px';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = '#fff';
        g.fillText(TEXT.ring, 0, 0);
      });
  }
  // 节点：分裂瞬间带蓝色光团，之后转到 45° 对角上
  const ba = seg(t, 2.37, 2.45) * (1 - seg(t, 2.55, 2.75));
  const phi = kf(t, [[2.36, -1.4], [3.9, 0]], eo3);
  for (let k = 0; k < 4; k++) {
    const [x, y] = superPoint(CX, CY, S, e, rot, (k * Math.PI) / 2 + phi + (Math.PI / 4) * (1 - seg(t, 3.6, 3.95)));
    blob(x, y, 70, GC.blue, 0.9 * ba, 'lighter');
    dot(x, y, 10, shapeA * seg(t, 2.35, 2.38));
  }
}

/* ───────── 3 星芒 →「寻找 结构」→ 胶囊 → 渐变卡片（4.9–9.2） ───────── */
const starState = (t: number) => ({
  pos: kf(t, [[4.9, [540, 960]], [5.4, [545, 925]], [5.6, [595, 700]], [5.8, [612, 560]], [6.0, [610, 487]], [6.4, [605, 470]], [6.56, [560, 760]], [6.68, [540, 960]]]),
  size: kf(t, [[4.95, 70], [5.05, 45], [5.4, 26], [5.6, 34], [5.8, 62], [6.0, 92], [6.3, 80], [6.45, 60], [6.6, 20], [6.9, 22]]),
  flip: kf(t, [[5.0, 0], [5.45, Math.PI], [5.65, Math.PI], [5.95, 2 * Math.PI], [6.15, 2 * Math.PI], [6.45, 3 * Math.PI], [6.75, 4 * Math.PI], [7.2, 5 * Math.PI]]),
  rot: kf(t, [[4.9, -0.8], [5.3, 0]]),
});
function card(t: number) {
  if (t < 4.88 || t > 9.3) return;
  const g = c();
  if (t < 6.7) {
    const s = starState(t);
    sparkle(s.pos[0], s.pos[1], s.size, {rot: s.rot, flip: s.flip, a: seg(t, 4.95, 5.03)});
  }
  wordsLine(t, [{s: TEXT.find[0], tin: 5.45, tout: 6.42, dim: 6.28}, {s: TEXT.find[1], tin: 5.65, tout: 6.5}], CX, 892, 72, {spacing: 4, gap: 0.35, dimColor: '#6b6b78', weight: 400});
  // 胶囊：白 → 淡紫青 → 深蓝到青
  if (t >= 6.52 && t < 7.3) {
    const w = kf(t, [[6.52, 120], [6.62, 580], [6.8, 800]], eo3);
    const h = kf(t, [[6.52, 80], [6.62, 160], [6.8, 210]], eo3);
    morphPill(CX, CY, w, h, 34, [1 - seg(t, 6.88, 7.02), seg(t, 6.88, 7.02) * (1 - seg(t, 7.08, 7.22)), seg(t, 7.08, 7.22)]);
    sparkle(CX, CY, 22, {flip: starState(Math.max(t, 6.68)).flip, onLight: t < 7.05, glow: t < 7.05 ? 0 : 1});
  }
  // 卡片撑开 → 停住 → 倾斜甩出（带残影）
  if (t >= 7.28) {
    const x0 = kf(t, [[7.28, 140], [7.42, -40], [7.8, 14], [8.05, 40]], eo3);
    const x1 = kf(t, [[7.28, 940], [7.42, 1250], [7.8, 1200]], eo3);
    const y0 = kf(t, [[7.28, 855], [7.42, 745], [7.8, 752]], eo3);
    const y1 = kf(t, [[7.28, 1065], [7.42, 1175], [7.8, 1170]], eo3);
    const dx = kf(t, [[8.05, 0], [8.35, 80], [8.6, 190], [8.8, 430], [9.0, 820], [9.15, 1300]], ei2);
    const sk = kf(t, [[8.4, 0], [8.75, -0.05], [9.05, -0.12]], lin);
    for (let gI = t > 8.7 ? 3 : 0; gI >= 0; gI--)
      withCtx(() => {
        g.globalAlpha = gI ? 0.22 : 1;
        g.translate(dx - gI * 50, 0);
        g.transform(1, sk, 0, 1, 0, -sk * 540);
        gradientCard(x0, y0, x1, y1, 36);
        if (gI) return;
        const a1 = eo3(seg(t, 7.52, 7.85)), a2 = eo3(seg(t, 7.62, 7.95));
        g.textBaseline = 'middle';
        g.textAlign = 'left';
        if (a1 > 0)
          withCtx(() => {
            g.globalAlpha = a1;
            if (a1 < 1) g.filter = `blur(${(1 - a1) * 12}px)`;
            g.font = font(300, 104);
            g.letterSpacing = '6px';
            const gr = g.createLinearGradient(360, 0, 600, 0);
            gr.addColorStop(0, mixHex('#e04cff', '#ffffff', seg(t, 7.6, 8.1)));
            gr.addColorStop(1, '#ffffff');
            g.fillStyle = gr;
            g.fillText(TEXT.card.big, 362, 902);
          });
        if (a2 > 0)
          withCtx(() => {
            g.globalAlpha = a2 * 0.9;
            if (a2 < 1) g.filter = `blur(${(1 - a2) * 10}px)`;
            g.font = font(300, 58);
            g.letterSpacing = '4px';
            g.fillStyle = '#b4a8ff';
            g.fillText(TEXT.card.sub, 366, 1022);
          });
      });
    // 卡内线稿星芒 → 被甩出后缩成光点
    if (t < 9.1) {
      const p = kf(t, [[7.35, [540, 960]], [7.5, [430, 960]], [7.8, [300, 960]], [8.0, [240, 960]], [8.4, [200, 955]], [8.6, [255, 945]], [8.8, [270, 806]], [9.05, [282, 808]]], eo3);
      const sz = kf(t, [[7.35, 25], [7.5, 72], [8.0, 56], [8.4, 54], [8.6, 38], [8.8, 22], [9.05, 12]]);
      const fl = kf(t, [[7.35, 0], [7.8, 0.35], [8.4, 0.2], [8.8, Math.PI * 0.4], [9.0, Math.PI]]);
      sparkle(p[0], p[1], sz, {mode: t < 8.55 ? 'line' : 'fill', flip: fl, rot: kf(t, [[8.6, 0], [9.0, 0.8]]), glow: 0.8});
    }
  }
}

/* ───────── 4 点阵：弹跳串点、起伏、长成柱线、镜头上摇（9.0–14.62） ───────── */
const DOTX = [140, 335, 540, 735, 940];
const HOPS: [number, number, number, number][] = [[9.8, 4, 3, 170], [10.0, 3, 2, 125], [10.2, 2, 1, 85], [10.4, 1, 0, -60]];
const ballPos = (t: number): Vec => {
  if (t < 9.8) return kf(t, [[9.05, [282, 808]], [9.2, [430, 545]], [9.4, [648, 400]], [9.6, [770, 470]], [9.8, [940, 960]]], lin) as Vec;
  for (const [t0, a, b, hgt] of HOPS) {
    if (t <= t0 + 0.2) {
      const u = seg(t, t0, t0 + 0.2);
      return [lerp(DOTX[a], DOTX[b], u), 960 - hgt * 4 * u * (1 - u)];
    }
  }
  return [DOTX[0], 960];
};
function dots(t: number) {
  if (t < 9.0 || t > 14.62) return;
  const g = c();
  const camY = kf(t, [[13.0, 0], [13.3, 60], [13.5, 560], [13.6, 1212], [13.9, 1300]], eo3);
  const camX = kf(t, [[13.2, 0], [13.45, -130], [13.65, -200], [13.85, -340], [14.05, -400]], eio);
  if (t < 9.8) {
    const [x, y] = ballPos(t);
    dot(x, y, kf(t, [[9.05, 6], [9.2, 12], [9.6, 8]]), seg(t, 9.02, 9.08));
  }
  if (t > 9.78 && t < 10.72) cometTrail(ballPos, t, {tStart: 9.8, tEnd: 10.6, fade: 1 - seg(t, 10.58, 10.72)});
  const appear = [10.4, 10.2, 10.0, 9.8, 9.78];
  const bob = seg(t, 10.7, 11.0) * (1 - seg(t, 12.55, 12.8));
  const sink = eio(seg(t, 12.6, 13.0));
  const slope = [0, 10, 25, 40, 52];
  const HG = [90, 200, 330, 450, 1900];
  withCtx(() => {
    g.translate(camX, camY);
    for (let i = 0; i < 5; i++) {
      if (t < appear[i]) continue;
      const pop = eoBack(seg(t, appear[i], appear[i] + 0.18));
      const ph = (2 * Math.PI * (t - 10.8)) / 0.65 - i * 0.9;
      const y = 960 + sink * (60 + slope[i]) + 9 * Math.sin(ph) * bob;
      const riseK = i < 4 ? eo3(seg(t, 13.0, 13.35)) : ei2(seg(t, 13.05, 13.55));
      const top = y - HG[i] * riseK;
      let stemBot = lerp(y + 16, y + 240, riseK);
      if (i === 4) stemBot = lerp(stemBot, top, eio(seg(t, 13.85, 14.2)));
      if (t > 10.6)
        withCtx(() => {
          g.strokeStyle = 'rgba(255,255,255,0.62)';
          g.lineWidth = 2;
          g.globalAlpha = seg(t, 10.6, 10.9);
          g.beginPath();
          g.moveTo(DOTX[i], top);
          g.lineTo(DOTX[i], stemBot);
          g.stroke();
        });
      const pulse = (0.5 + 0.5 * Math.sin(ph + Math.PI / 2)) * bob;
      const halo = i === 4 ? kf(t, [[13.85, 0], [14.0, 30], [14.2, 75], [14.4, 90]], lin) : 0;
      if (i === 4 && t > 14.2) continue;
      blob(DOTX[i], top, 32 + halo, '#2a3cff', 0.95 * Math.max(pulse, seg(t, 13.0, 13.2) * 0.7, halo ? 1 : 0), 'lighter');
      dot(DOTX[i], top, 9.5 * pop, 1);
    }
  });
  withCtx(() => {
    g.translate(camX, camY + sink * 90);
    g.globalAlpha = seg(t, 9.78, 10.0) * (1 - seg(t, 13.5, 13.7));
    wordsLine(t, [{s: TEXT.dots, tin: 9.78}], CX + kf(t, [[9.75, 220], [10.1, 0]], eo3), 1200, 64, {spacing: 4, color: mixHex('#4a55ff', '#ffffff', seg(t, 9.95, 10.35)), dur: 0.2, weight: 400});
  });
  // 顶端光点 → 膨胀白闪
  if (t >= 14.2) {
    const cy = kf(t, [[14.2, 480], [14.4, 600], [HITS.flash, 830]], eio);
    const r = kf(t, [[14.2, 12], [14.4, 40], [14.45, 260], [14.5, 600], [14.57, 1500]], ei2);
    inflateFlash(CX, cy, r, 1 - seg(t, 14.42, 14.52));
  }
}

/* ───────── 6 白底：绳线串起三颗胶囊（14.55–22.37） ───────── */
const P1: Vec = [540, 960], P2: Vec = [1170, 180], P3: Vec = [1760, -560];
const PH = 180;
const STRING: TimedPt[] = (() => {
  const pts: TimedPt[] = [
    [15.42, 650, 2080], [15.6, 800, 1690], [15.8, 820, 1520], [16.0, 735, 1460], [16.2, 660, 1455], [16.4, 556, 1422],
    [16.6, 525, 1210], [HITS.ding1, 540, 1045], [17.0, 545, 975], [17.15, 700, 960], [17.3, 860, 955], [17.45, 1000, 860],
    [17.62, 900, 450], [17.8, 800, -50], [17.95, 900, -650], [18.1, 1060, -690], [18.25, 1160, -400], [HITS.ding2, 1170, 95],
    [18.7, 1170, 180], [18.9, 1172, 265], [19.1, 1180, 420], [19.3, 1300, 560], [19.5, 1480, 560], [19.7, 1560, 380],
    [19.9, 1565, 100], [20.1, 1600, -150], [20.3, 1680, -330], [20.45, 1740, -430], [HITS.ding3, 1760, -475], [20.85, 1760, -560],
    [21.15, 1950, -560], [21.3, 2050, -560],
  ];
  for (let k = 1; k <= 16; k++) {
    const x = 2050 + k * 26;
    pts.push([21.3 + k * 0.05, x, -540 + 95 * Math.sin((x - 2050) / 78) * Math.min(1, k / 4)]);
  }
  pts.push([22.4, 2560, -540]);
  return buildTimedPath(pts, 10);
})();
const CAM: [number, Vec][] = [
  [14.5, P1], [17.2, P1], [17.5, [640, 860]], [17.8, [710, 440]], [18.1, [900, 276]], [18.4, [1062, 220]], [18.75, [1170, 185]], [19.35, [1170, 180]],
  [19.6, [1224, 142]], [19.9, [1300, 400]], [20.2, [1544, -80]], [20.5, [1674, -426]], [20.8, [1706, -426]], [21.5, [1720, -440]], [21.75, [1810, -440]],
  [22.0, [2223, -440]], [22.3, [2420, -440]], [22.4, [2460, -440]],
];
function white(t: number) {
  if (t < 14.55 || t > HITS.cut + 0.01) return;
  const g = c();
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  const cr = 1 - seg(t, 14.55, 14.72);
  if (cr > 0) {
    blob(0, 1920, 620, GC.cyan, 0.95 * cr, 'source-over');
    blob(1080, 1920, 520, '#2a8bff', 0.8 * cr, 'source-over');
    blob(1080, 0, 420, '#d43cff', 0.6 * cr, 'source-over');
  }
  const cam = kfSmooth(t, CAM);
  const toS = (p: Vec): Vec => [p[0] - cam[0] + CX, p[1] - cam[1] + CY];
  const seen = pathUntil(STRING, t);
  stringLine(seen, toS);
  const off1 = kf(t, [[17.2, [0, 0]], [17.5, [-170, 90]], [17.9, [-250, 150]]]);
  const [x1, y1] = toS([P1[0] + off1[0], P1[1] + off1[1]]);
  capsule(x1, y1, kf(t, [[HITS.ding1, 0], [16.9, -0.06], [17.15, 0.02], [17.3, 0], [17.5, -0.08], [17.9, -0.12]]), TEXT.pills[0], {
    blobMorph: 1 - eio(seg(t, 14.75, 15.02)),
    textA: eo3(seg(t, 14.85, 15.15)),
    contact: [0, PH / 2],
    contactA: seg(t, 16.74, 16.82) * (1 - seg(t, 16.86, 16.9)),
    flash: seg(t, HITS.ding1, 16.9) * (1 - seg(t, 16.98, 17.35)),
    flashCol: '#a020ff',
    sc: 1 + bump(t, HITS.ding1),
    iconFlip: (t - 15) * 2.4,
  });
  if (t > 17.3) {
    const [x, y] = toS(P2);
    capsule(x, y, kf(t, [[17.6, -0.08], [18.3, -0.02], [HITS.ding2, 0.04], [18.7, 0], [19.4, 0], [19.8, 0.1]]), TEXT.pills[1], {
      contact: [0, -PH / 2],
      contactA: seg(t, 18.38, 18.46) * (1 - seg(t, 18.5, 18.6)),
      flash: seg(t, 18.46, 18.6) * (1 - seg(t, 18.66, 19.0)),
      flashCol: '#1f2dff',
      sc: 1 + bump(t, HITS.ding2),
      iconFlip: (t - 17.3) * 2.4,
    });
  }
  if (t > 19.5) {
    const [x, y] = toS(P3);
    capsule(x, y, kf(t, [[19.9, 0.12], [20.4, 0.03], [HITS.ding3, -0.04], [20.9, 0], [21.6, 0], [22.0, -0.06]]), TEXT.pills[2], {
      contact: [0, PH / 2],
      contactA: seg(t, 20.52, 20.6) * (1 - seg(t, 20.66, 20.76)),
      flash: 0.9 * seg(t, HITS.ding3, 20.74) * (1 - seg(t, 20.8, 21.1)),
      flashCol: '#3fe6cf',
      sc: 1 + bump(t, HITS.ding3),
      iconFlip: (t - 19.5) * 2.4,
    });
  }
  // 绳头（穿过胶囊时藏在胶囊后面）
  if (seen.length && t < HITS.cut) {
    const h = seen[seen.length - 1];
    const [x, y] = toS([h[1], h[2]]);
    const hidden = (t > 16.82 && t < 17.25) || (t > 18.47 && t < 18.88) || (t > 20.62 && t < 21.22);
    if (!hidden) dot(x, y, 9, 1, '#2b2b2b');
  }
  radialWipe(1020, 1560, kf(t, [[22.12, 0], [HITS.cut, 1800]], ei2));
}

/* ───────── 7 黑底：画出圆角框、打出「融会贯通」（22.37–25.5） ───────── */
const FRAME = roundedFrameTrack();
function frame(t: number) {
  if (t < HITS.cut + 0.01 || t > 25.5) return;
  const g = c();
  blob(0, 0, 640, GC.blue, 0.75 * (1 - seg(t, 22.38, 22.75)), 'lighter');
  const L = FRAME.L;
  const s = kf(t, [[22.35, 0], [22.72, 450 / L], [22.9, 616 / L], [23.2, 1241 / L], [23.34, 1602 / L], [23.65, 1]], lin) * L;
  const tx = kf(t, [[23.9, 0], [24.7, 18], [25.0, 90], [25.3, -460]], eio);
  const sk = kf(t, [[24.7, 0], [25.0, -0.1], [25.3, -0.3]], ei2);
  const sx = kf(t, [[24.9, 1], [25.3, 0.45]], ei2);
  const sc = kf(t, [[23.9, 1], [24.7, 1.025]], lin);
  const bl = kf(t, [[24.85, 0], [25.25, 12]], lin);
  const ga = 1 - seg(t, 25.08, 25.32);
  for (let gI = t > 24.95 ? 3 : 0; gI >= 0; gI--)
    withCtx(() => {
      const ghost = gI ? 0.25 : 1;
      g.translate(CX + tx - gI * 40, CY);
      g.transform(sx * sc, sk, 0, sc, 0, 0);
      g.translate(-CX, -CY);
      if (bl > 0.3) g.filter = `blur(${bl}px)`;
      drawTrack(FRAME, s, {fadeR: kf(t, [[23.35, 0], [24.0, 1]], lin), glowBlur: 12 + bl, tint: seg(t, 23.3, 23.8), head: t < 23.62, alpha: ga * ghost});
      g.globalAlpha = ga * ghost;
      typeOn(TEXT.frame, CX, 972, 66, t, 23.45, {blur: bl});
    });
}

/* ───────── 8 雾团：「让知识可见 / 让思想有形」（25.3–30.6） ───────── */
function mist(t: number) {
  if (t < 25.3 || t > 30.6) return;
  blobCluster(t, {
    center: kf(t, [[25.4, [510, 920]], [25.65, [430, 905]], [26.05, [610, 905]], [26.55, [440, 1025]], [27.1, [640, 1025]], [27.8, [640, 975]], [28.25, [590, 960]], [28.7, [540, 960]], [29.4, [540, 960]]]) as Vec,
    spread: kf(t, [[25.4, 25], [26.0, 60], [27.5, 72], [28.2, 140], [28.7, 115], [29.2, 55], [29.5, 120], [29.75, 230], [30.1, 380]]),
    A: kf(t, [[25.3, 0], [25.7, 1], [29.65, 1], [29.9, 0.25], [30.1, 0]], lin),
    grow: kf(t, [[25.3, 0.35], [25.8, 1], [29.45, 1], [30.0, 1.6]]),
    t0: 25.3,
    inAt: [25.0, 25.62, 25.74, 25.86],
  });
  wordsLine(t, [{s: TEXT.line1[0], tin: 25.58, tout: 28.32}, {s: TEXT.line1[1], tin: 25.98, tout: 28.2}], CX, 895, 76, {spacing: 6, gap: 0.1});
  wordsLine(t, [{s: TEXT.line2[0], tin: 26.52, tout: 28.1}, {s: TEXT.line2[1], tin: 27.02, tout: 28.0}], CX, 1030, 76, {spacing: 6, gap: 0.1});
}

/* ───────── 9 落版 + 底部常驻小字 ───────── */
function logo(t: number) {
  logoReveal(t, 29.42);
  if (t < 29.9) return;
  withCtx(() => {
    const g = c();
    g.globalAlpha = eo3(seg(t, 29.95, 30.3));
    g.font = font(400, 38);
    g.letterSpacing = '8px';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(246,247,245,0.62)';
    g.fillText(TEXT.follow, CX + 4, 1112);
  });
}
function caption(t: number) {
  if (t < 14.62) return;
  boldSweep(TEXT.caption, CX, 1676, 42, t, 14.9, {color: t >= HITS.cut + 0.01 ? '#f4f4f6' : '#121214', alpha: seg(t, 14.62, 15.0)});
}

export function render(t: number) {
  clearFrame('#000');
  rise(t);
  wash(t);
  bridgeDot(t);
  ring(t);
  card(t);
  dots(t);
  white(t);
  frame(t);
  mist(t);
  logo(t);
  caption(t);
}

