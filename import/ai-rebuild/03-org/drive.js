/**
 * 彩雾的「驱动」：每一帧给出 low / mid / high（配乐三段能量 0–1）和三种动作的强度 burst / contract / twist（0–1）。
 * 雾团组件只认 MistDrive；配乐能量来自 scripts/audio-bands.mjs 生成的 JSON，动作来自按拍号写的事件表。
 * 这个文件不 import 任何 .tsx，可以被测试和 Node 脚本直接加载。
 */
                  
                          
              
                       
              
                          
               
                           
                
                    
                   
                            
                
  

const ZERO            = {low: 0, mid: 0, high: 0, burst: 0, contract: 0, twist: 0};

const clamp01 = (x        ) => Math.max(0, Math.min(1, x));

/** scripts/audio-bands.mjs 输出的格式：每帧 [low, mid, high]，已归一化到 0–1 */
                                                               

/** 取第 f 帧的三段能量（超出范围按 0） */
const bandsAt = (b                   , f        )                           => {
  if (!b) return [0, 0, 0];
  const i = Math.floor(f);
  return b.frames[i] ?? [0, 0, 0];
};

/**
 * 一个动作事件：from 帧起 attack 帧内升到 peak，保持 hold 帧，再 release 帧落回 0。
 * attack 很短（2–4 帧）就是「瞬间」；release 很长就是「慢慢回来」。
 */
                                                                                                                                 

const shape = (t        , ease                   ) => (ease === 'in' ? t * t * t : ease === 'linear' ? t : 1 - Math.pow(1 - t, 3));

/** 事件表在第 f 帧的强度（多个事件取最大） */
const envelope = (events             , f        ) => {
  let v = 0;
  for (const e of events) {
    const {from, attack = 3, hold = 0, release = 30, peak = 1, ease = 'out'} = e;
    if (f < from) continue;
    const t = f - from;
    let x        ;
    if (t < attack) x = shape(clamp01(t / attack), ease);
    else if (t < attack + hold) x = 1;
    else x = 1 - shape(clamp01((t - attack - hold) / Math.max(1, release)), 'out');
    v = Math.max(v, x * peak);
  }
  return clamp01(v);
};

/** 拼一个驱动函数：配乐能量 + 三张事件表 + 可选的整体增益 */
const makeDrive =
  (opts                                                                                                                                                                                     ) =>
  (f        )            => {
    const [l, m, h] = bandsAt(opts.bands, f);
    const g = opts.gain ?? [1, 1, 1];
    const c = opts.curve ?? [1, 1, 1];
    return {
      low: clamp01(Math.pow(l, c[0]) * g[0]),
      mid: clamp01(Math.pow(m, c[1]) * g[1]),
      high: clamp01(Math.pow(h, c[2]) * g[2]),
      burst: envelope(opts.burst ?? [], f),
      contract: envelope(opts.contract ?? [], f),
      twist: envelope(opts.twist ?? [], f),
    };
  };
