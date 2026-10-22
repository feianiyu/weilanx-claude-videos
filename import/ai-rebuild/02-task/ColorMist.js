
/**
 * 彩雾 ColorMist：上万颗彩色粒子聚成的一团烟雾，里面有大块的模糊色雾、细密的粒子簇、被拉长的「碎片」和弧形「卷须」，
 * 还有几张若隐若现的白色光网。整团由 drive(f) 驱动：
 *   low  → 整体呼吸、色雾变亮          mid  → 流动幅度
 *   high → 光网闪烁、白色星点          burst → 瞬间爆炸（沿径向甩出、拖尾、核心闪光、色散）
 *   contract → 瞬间收缩成一个亮核       twist → 张力：内圈快外圈慢地扭转 + 纵向拉伸
 * 一切是帧号 f 的纯函数：粒子形态由 seed 决定，同一个 seed 每次渲染完全一样；换 seed 就是另一团雾。
 * 画面三层：底（可关）→ 半分辨率模糊色雾 → 全分辨率粒子（screen 叠加 + 轻微色散）→ 光网 / 核心光。
 */

                                    
                    
                                       
                                      
                        
                 
                   
                
                    
                       
              
              
           
  

const MIST_PALETTES                              = {
  /** 暖灰底 + 红、品红、钴蓝、青绿、金：最接近「彩色雾团」的经典配色 */
  ruby: {
    bg: ['#1f1a14', '#4e4231', '#857152'],
    shadow: 'rgba(20,14,10,0.75)',
    colors: [
      [255, 40, 70],
      [196, 60, 255],
      [60, 120, 255],
      [40, 210, 185],
      [255, 196, 110],
      [255, 110, 150],
    ],
    weights: [3, 2, 2.4, 1.6, 0.8, 1],
    body: [
      [30, 80, 76],
      [40, 60, 110],
      [90, 30, 60],
    ],
    web: [255, 244, 225],
  },
  /** 老杨魔方深色版：近黑底 + 亮绿、品牌绿、金、一点青蓝 */
  jade: {
    bg: ['#030504', '#07100b', '#0b1a12'],
    shadow: 'rgba(0,0,0,0.85)',
    colors: [
      [43, 224, 138],
      [19, 162, 78],
      [245, 166, 35],
      [60, 200, 230],
      [180, 255, 220],
    ],
    weights: [3, 2, 1.2, 1, 0.8],
    body: [
      [10, 60, 40],
      [20, 50, 60],
      [60, 45, 15],
    ],
    web: [235, 255, 240],
  },
  /** 深夜底 + 橙红、玫红、紫、冰蓝：更冷艳的对比 */
  ember: {
    bg: ['#050308', '#120a1a', '#24142a'],
    shadow: 'rgba(0,0,0,0.8)',
    colors: [
      [255, 90, 40],
      [255, 40, 120],
      [150, 70, 255],
      [90, 200, 255],
      [255, 220, 150],
    ],
    weights: [2.5, 2.5, 2, 1.5, 0.7],
    body: [
      [70, 20, 60],
      [30, 30, 90],
      [90, 30, 20],
    ],
    web: [255, 235, 245],
  },
};

/* ---------------- 确定性随机 ---------------- */
const mkRand = (seed        ) => {
  let s = (Math.abs(Math.floor(seed * 9301 + 49297)) % 2147483646) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/* ---------------- 形态（按 seed 缓存） ---------------- */
                                                                                                        
              
                
            
                          
                   
                   
                     
                      
                                               
                              
                              
                                   
                                                        
  

const cache = new Map               ();

const buildShape = (seed        , nColors        , weights          , density        )        => {
  const key = `${seed}|${nColors}|${density}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = mkRand(seed);
  const gauss = () => (r() + r() + r() + r() - 2) / 2;
  const pickCol = () => {
    const tot = weights.reduce((a, b) => a + b, 0);
    let x = r() * tot;
    for (let i = 0; i < weights.length; i++) if ((x -= weights[i]) <= 0) return i;
    return 0;
  };
  const K = 18;
  const puffs         = Array.from({length: K}, (_, k) => {
    const kind            = k < 11 ? 0 : k < 15 ? 1 : 2; // 11 团块、4 碎片、3 卷须
    const up = kind === 0 ? 0 : -160; // 碎片和卷须多在上半部，像火焰往上窜
    return {
      bx: gauss() * (kind === 0 ? 330 : 440),
      by: gauss() * (kind === 0 ? 420 : 320) + up,
      r: kind === 0 ? 70 + r() * 150 : 90 + r() * 110,
      ph: r() * Math.PI * 2,
      spin: (r() - 0.5) * 0.25,
      col: pickCol(),
      kind,
    };
  });
  const per = puffs.map((p) => Math.round((p.kind === 0 ? 520 + p.r * 5 : 700) * density));
  const n = per.reduce((a, b) => a + b, 0);
  const s        = {
    puffs,
    n,
    pi: new Uint16Array(n),
    lx: new Float32Array(n),
    ly: new Float32Array(n),
    size: new Float32Array(n),
    alpha: new Float32Array(n),
    col: new Uint8Array(n),
    dir: new Float32Array(n),
    speed: new Float32Array(n),
    nodes: new Uint32Array(0),
    edges: [],
  };
  let i = 0;
  puffs.forEach((p, k) => {
    const rot = r() * Math.PI * 2;
    const aspect = 0.45 + r() * 0.55;
    const col2 = pickCol();
    const sweep = (r() < 0.5 ? -1 : 1) * (1.2 + r() * 1.4);
    const a0 = r() * Math.PI * 2;
    for (let j = 0; j < per[k]; j++, i++) {
      let x = 0;
      let y = 0;
      let c = r() < 0.82 ? p.col : col2;
      if (p.kind === 0) {
        // 团块：旋转的高斯椭圆，边缘稀疏
        const u = gauss() * p.r;
        const v = gauss() * p.r * aspect;
        x = u * Math.cos(rot) - v * Math.sin(rot);
        y = u * Math.sin(rot) + v * Math.cos(rot);
      } else if (p.kind === 1) {
        // 碎片：细长的尖片，沿长轴从主色渐变到第二色
        const u = r() * 2 - 1;
        const v = gauss() * p.r * 0.22 * (1 - Math.abs(u) * 0.75);
        const L = p.r * 2.4;
        x = u * L * Math.cos(rot) - v * Math.sin(rot);
        y = u * L * Math.sin(rot) + v * Math.cos(rot);
        c = r() < (u + 1) / 2 ? col2 : p.col;
      } else {
        // 卷须：一段弧，越往末端越细
        const t = Math.pow(r(), 0.8);
        const ang = a0 + t * sweep;
        const R = p.r * 1.6;
        const w = p.r * 0.32 * Math.pow(1 - t, 0.7) + 3;
        x = Math.cos(ang) * R + gauss() * w;
        y = Math.sin(ang) * R + gauss() * w;
        c = r() < t ? col2 : p.col;
      }
      s.pi[i] = k;
      s.lx[i] = x;
      s.ly[i] = y;
      s.size[i] = 1.1 + r() * r() * 3.0;
      s.alpha[i] = 0.25 + r() * 0.65;
      s.col[i] = r() < 0.035 ? 255 : c % nColors;
      s.dir[i] = (r() - 0.5) * 1.2;
      s.speed[i] = Math.pow(r(), 1.6);
    }
  });
  // 光网：挑 4 个团块，每个取 16 个粒子做节点，连到最近的 2–3 个
  const webPuffs = [0, 3, 6, 9].map((k) => k % K);
  const nodes           = [];
  let start = 0;
  const starts = per.map((c) => ((start += c), start - c));
  for (const k of webPuffs) for (let m = 0; m < 26; m++) nodes.push(starts[k] + Math.floor(r() * per[k]));
  s.nodes = Uint32Array.from(nodes);
  const bx = (q        ) => s.puffs[s.pi[q]].bx + s.lx[q];
  const by = (q        ) => s.puffs[s.pi[q]].by + s.ly[q];
  nodes.forEach((a, ia) => {
    const near = nodes
      .map((b, ib) => [ib, Math.hypot(bx(a) - bx(b), by(a) - by(b))]                    )
      .filter(([ib]) => ib !== ia)
      .sort((u, v) => u[1] - v[1])
      .slice(0, 2 + (ia % 2));
    for (const [ib, d] of near) if (ib > ia && d < 260) s.edges.push([ia, ib, r() * Math.PI * 2]);
  });
  cache.set(key, s);
  return s;
};

/* ---------------- 位置 ---------------- */
                                                                        

/** 第 i 颗粒子在某一帧的屏幕坐标 */
const position = (s       , i        , c     , out              ) => place(s.puffs[s.pi[i]], s.lx[i], s.ly[i], s.dir[i], s.speed[i], i, c, out);

/** 团块 p 里局部坐标 (lx0, ly0) 的点在某一帧的屏幕坐标（团块中心就传 0, 0） */
const place = (p      , lx0        , ly0        , dir        , speed        , i        , c     , out              ) => {
  const {t, d} = c;
  // 团块中心缓慢漂移
  const pcx = p.bx + Math.sin(t * 0.35 + p.ph) * 22;
  const pcy = p.by + Math.cos(t * 0.29 + p.ph * 1.3) * 18;
  // 团块自转
  const a = p.spin * t;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  let lx = lx0 * ca - ly0 * sa;
  let ly = lx0 * sa + ly0 * ca;
  // 流动：几层正弦叠成的伪噪声，mid 越大流得越开
  const amp = 8 + 34 * d.mid;
  const gx = pcx + lx;
  const gy = pcy + ly;
  lx += (Math.sin(gy * 0.011 + t * 0.7) + 0.7 * Math.sin((gx + gy) * 0.006 - t * 0.5) + 0.4 * Math.sin(gx * 0.019 + t * 1.3)) * amp;
  ly += (Math.cos(gx * 0.01 - t * 0.6) + 0.7 * Math.cos((gx - gy) * 0.007 + t * 0.45) + 0.4 * Math.cos(gy * 0.017 - t * 1.1)) * amp;
  let x = pcx + lx;
  let y = pcy + ly;
  // 呼吸
  const b = 1 + 0.08 * d.low + 0.025 * Math.sin(t * 0.9);
  x *= b;
  y *= b;
  // 张力：内圈扭得多、外圈扭得少，纵向拉长
  if (d.twist > 0.001) {
    const dist = Math.hypot(x, y);
    const th = d.twist * (2.2 * Math.max(0, 1 - dist / 900) + 0.12);
    const ct = Math.cos(th);
    const st = Math.sin(th);
    const nx = x * ct - y * st;
    const ny = x * st + y * ct;
    x = nx * (1 - 0.2 * d.twist);
    y = ny * (1 + 0.3 * d.twist);
  }
  // 收缩：吸进一个亮核，核里留一点抖动
  if (d.contract > 0.001) {
    const k = 1 - 0.8 * d.contract;
    x = x * k + Math.sin(i * 12.9898 + t * 40) * 7 * d.contract;
    y = y * k + Math.cos(i * 78.233 + t * 37) * 7 * d.contract;
  }
  // 爆炸：沿径向甩出，越外面甩得越远，带一点旋转
  if (d.burst > 0.001) {
    const dist = Math.hypot(x, y) + 1;
    const ang = Math.atan2(y, x) + dir * 0.5 + d.burst * (speed - 0.5) * 0.8;
    const disp = d.burst * (240 + speed * 980) * (0.45 + 0.55 * Math.min(1, dist / 260));
    x += Math.cos(ang) * disp;
    y += Math.sin(ang) * disp;
  }
  out[0] = c.cx + x * c.S;
  out[1] = c.cy + y * c.S;
};

/* ---------------- 组件 ---------------- */

function drawMist(cv, layers, opts) {
  const {f, drive, palette = 'ruby', seed = 1, x = 540, y = 860, scale = 1, density = 1, background = true, fringe = 0.25, w = 1080, h = 1920} = opts;
  const pal = typeof palette === 'string' ? MIST_PALETTES[palette] : palette;
  {

    if (!cv || !layers) return;
    const g = cv.getContext('2d');
    const fg = layers.fog.getContext('2d');
    const pg = layers.dots.getContext('2d');
    if (!g || !fg || !pg) return;
    const s = buildShape(seed, pal.colors.length, pal.weights, density);
    const d = drive(f);
    const d0 = drive(f - 1);
    const cur      = {t: f / 30, d, S: scale, cx: x, cy: y};
    const prev      = {t: (f - 1) / 30, d: d0, S: scale, cx: x, cy: y};
    const motion = Math.abs(d.burst - d0.burst) + Math.abs(d.contract - d0.contract) + Math.abs(d.twist - d0.twist);
    const trails = motion > 0.004;

    /* 底 */
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.filter = 'none';
    g.clearRect(0, 0, w, h);
    if (background && pal.bg) {
      const lg = g.createLinearGradient(0, 0, 0, h);
      lg.addColorStop(0, pal.bg[0]);
      lg.addColorStop(0.5, pal.bg[1]);
      lg.addColorStop(1, pal.bg[2]);
      g.fillStyle = lg;
      g.fillRect(0, 0, w, h);
      // 地面阴影：团块越收缩阴影越小
      const sh = 1 - 0.7 * d.contract;
      const sy = y + 470 * scale;
      const rg = g.createRadialGradient(x, sy, 0, x, sy, 330 * scale * sh);
      rg.addColorStop(0, pal.shadow);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.save();
      g.translate(x, sy);
      g.scale(1, 0.42);
      g.translate(-x, -sy);
      g.fillStyle = rg;
      g.fillRect(0, sy - 400 * scale, w, 800 * scale);
      g.restore();
      // 暗角
      const vg = g.createRadialGradient(w / 2, h * 0.46, h * 0.25, w / 2, h * 0.46, h * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      g.fillStyle = vg;
      g.fillRect(0, 0, w, h);
    }

    /* 色雾：半分辨率画大块径向渐变，再模糊放大 */
    fg.setTransform(1, 0, 0, 1, 0, 0);
    fg.clearRect(0, 0, layers.fog.width, layers.fog.height);
    fg.globalCompositeOperation = 'source-over';
    const tmp = new Float32Array(2);
    const fogA = (0.34 + 0.2 * d.low) * (1 - 0.55 * d.contract) * (1 - 0.6 * d.burst);
    // 身体：几团大的暗色雾
    pal.body.forEach((c, k) => {
      const bx = x + Math.sin(cur.t * 0.2 + k * 2) * 60 * scale;
      const by = y + (60 + k * 70) * scale * (1 - 0.8 * d.contract);
      const R = (430 - k * 50) * scale * (1 - 0.75 * d.contract) * (1 + 0.8 * d.burst);
      const rg = fg.createRadialGradient(bx / 2, by / 2, 0, bx / 2, by / 2, R / 2);
      rg.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.75 * (1 - 0.5 * d.burst) * (1 - 0.6 * d.contract)})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      fg.fillStyle = rg;
      fg.fillRect(0, 0, layers.fog.width, layers.fog.height);
    });
    // 每个团块一团彩色雾，中心跟着团块走
    s.puffs.forEach((p, k) => {
      if (p.kind !== 0) return;
      place(p, 0, 0, 0, 0.3, k, cur, tmp);
      const px = tmp[0];
      const py = tmp[1];
      const c = pal.colors[p.col];
      const R = p.r * 2.1 * scale * (1 + 0.15 * d.low) * (1 - 0.7 * d.contract) * (1 + 1.2 * d.burst);
      const rg = fg.createRadialGradient(px / 2, py / 2, 0, px / 2, py / 2, R / 2);
      rg.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${fogA})`);
      rg.addColorStop(0.55, `rgba(${c[0]},${c[1]},${c[2]},${fogA * 0.35})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      fg.fillStyle = rg;
      fg.fillRect(0, 0, layers.fog.width, layers.fog.height);
    });
    g.globalCompositeOperation = 'source-over';
    g.filter = `blur(${Math.round(14 * scale)}px)`;
    g.drawImage(layers.fog, 0, 0, w, h);
    g.filter = 'none';

    /* 粒子 */
    pg.setTransform(1, 0, 0, 1, 0, 0);
    pg.globalCompositeOperation = 'source-over';
    pg.clearRect(0, 0, w, h);
    pg.globalCompositeOperation = 'source-over';
    const cols = pal.colors.map((c) => `${c[0]},${c[1]},${c[2]}`);
    const white = `${pal.web[0]},${pal.web[1]},${pal.web[2]}`;
    const pp = new Float32Array(2);
    const bright = 0.85 + 0.35 * d.low + 0.5 * d.contract;
    for (let i = 0; i < s.n; i++) {
      position(s, i, cur, tmp);
      const ci = s.col[i];
      const isWhite = ci === 255;
      const tw = isWhite ? 0.4 + 0.6 * Math.abs(Math.sin(cur.t * 3 + i)) * (0.4 + d.high) : 1;
      const a = Math.min(1, s.alpha[i] * bright * tw);
      const rgb = isWhite ? white : cols[ci];
      const sz = s.size[i] * scale * (isWhite ? 1.3 : 1) * (1 + 0.3 * d.burst);
      if (trails) {
        position(s, i, prev, pp);
        // 拖尾越长越暗：总光量跟着粒子数走，不跟着拖尾面积走，爆炸那一帧不会整屏变白
        const len = Math.hypot(tmp[0] - pp[0], tmp[1] - pp[1]);
        const la = a * Math.min(1, 14 / Math.max(1, len)) * 0.85;
        pg.strokeStyle = `rgba(${rgb},${la})`;
        pg.lineWidth = sz;
        pg.beginPath();
        pg.moveTo(pp[0], pp[1]);
        pg.lineTo(tmp[0], tmp[1]);
        pg.stroke();
      } else {
        pg.fillStyle = `rgba(${rgb},${a})`;
        pg.fillRect(tmp[0] - sz / 2, tmp[1] - sz / 2, sz, sz);
      }
    }
    // 粒子层叠上去：一层原样 + 两层色相偏移的错位（色散）
    const fr = fringe + 0.9 * d.burst + 0.3 * d.twist;
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.92;
    g.drawImage(layers.dots, 0, 0);
    g.globalAlpha = 1;
    if (fr > 0.02) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(0.5, 0.22 * fr);
      g.filter = 'hue-rotate(70deg) blur(1px)';
      g.drawImage(layers.dots, 6 * fr * scale, 0);
      g.filter = 'hue-rotate(-70deg) blur(1px)';
      g.drawImage(layers.dots, -6 * fr * scale, 0);
      g.filter = 'none';
      g.globalAlpha = 1;
    }

    /* 光网：白色细线，节点处一颗亮星；high 越大越闪 */
    g.globalCompositeOperation = 'lighter';
    const na = new Float32Array(2);
    const nb = new Float32Array(2);
    for (const [ia, ib, ph] of s.edges) {
      position(s, s.nodes[ia], cur, na);
      position(s, s.nodes[ib], cur, nb);
      const tw = 0.5 + 0.5 * Math.sin(cur.t * 2.4 + ph);
      const a = Math.min(1, (0.3 + 0.7 * d.high * tw + 0.35 * d.contract) * Math.max(0, 1 - 2.5 * d.burst));
      if (a < 0.02) continue;
      if (Math.hypot(na[0] - nb[0], na[1] - nb[1]) > 320 * scale) continue;
      const mx = (na[0] + nb[0]) / 2 + Math.sin(cur.t * 1.7 + ph) * 14 * scale;
      const my = (na[1] + nb[1]) / 2 + Math.cos(cur.t * 1.3 + ph) * 14 * scale;
      g.strokeStyle = `rgba(${white},${a})`;
      g.lineWidth = 1.3 * scale;
      g.shadowColor = `rgba(${white},${a})`;
      g.shadowBlur = 6;
      g.beginPath();
      g.moveTo(na[0], na[1]);
      g.quadraticCurveTo(mx, my, nb[0], nb[1]);
      g.stroke();
    }
    g.shadowBlur = 0;
    for (let k = 0; k < s.nodes.length; k++) {
      position(s, s.nodes[k], cur, na);
      const a = Math.min(1, 0.3 + 0.7 * d.high * (0.5 + 0.5 * Math.sin(cur.t * 4 + k))) * Math.max(0, 1 - 2.5 * d.burst);
      if (a < 0.02) continue;
      g.fillStyle = `rgba(${white},${a})`;
      g.beginPath();
      g.arc(na[0], na[1], (1.4 + 1.6 * d.high) * scale, 0, Math.PI * 2);
      g.fill();
    }

    /* 核心光：收缩时亮核、爆炸瞬间闪一下 */
    const core = Math.max(d.contract * d.contract, d.burst > 0 ? Math.max(0, 1 - (1 - d.burst) * 4) * 0.7 : 0);
    if (core > 0.01) {
      const R = (60 + 260 * d.burst + 80 * d.low) * scale;
      const rg = g.createRadialGradient(x, y, 0, x, y, R);
      rg.addColorStop(0, `rgba(255,255,255,${0.75 * core})`);
      rg.addColorStop(0.25, `rgba(${white},${0.55 * core})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, w, h);
    }
    g.globalCompositeOperation = 'source-over';
  }
}
