// =====================================================================
// 老杨魔方 · 深度 v8「媒体层」（STANDARD_DEEP_V8.md，2026-11-21）
// v7 解决了「同一张图怎么摆」；v8 往片子里放三样代码画不出来的东西：
//   photo  实景 / 原件图卡：照片、报告原页截图、AI 生成图。慢推、镜头推到某处、钉注（pins）
//   clip   视频镜头卡：素材库视频或 AI 生成的 3–6 秒镜头。build 时用 ffmpeg 抽成逐帧 jpg，按时间取帧（纯函数）
//   play   试玩卡：一个能拖的小模型（滑杆 → 结果），片里由「手」拖给观众看；同一份数据 build 时导出成能玩的 H5 小游戏
//   bleed  任何卡都能写 data.bleed = {媒体}：这张卡在屏上时，媒体铺满整屏当「动态底图」（钩子卡最常用）
// 媒体字段（photo / clip 的 data 里，或 data.bleed 里）：
//   file 本地文件（默认 assets/media/<卡id>.jpg|mp4）  url 素材库原链接（Mac 下载）  gen {prompt, kind:"img|video", dur, ratio} AI 生成（Mac 生成）
//   credit 出处（自动进出处行）  label 角标（AI 生成的自动标「AI 生成」；素材不是事件本身时写「示意」）
//   frame full | wide | tall | doc（原件：纸面、完整显示）  h 盒子高度  kb [起, 止] 慢推倍数  pan [x0,y0,x1,y1] 焦点（0–1）
//   zoom {x, y, z, s, back} 第 s 个 step 镜头推到 (x,y)  pins [{x, y, t, s}] 钉注（跟着画面走）  in 视频从第几秒开始  rate 播放速度
// 纯函数：画面只由 t 决定。图片 / 帧没解码完时 render(t) 返回 Promise，截图前等它（Playwright 的 evaluate 会自动等）。
// =====================================================================
(function(){const st=document.createElement('style');st.textContent=`
.md-w{position:relative;margin-top:22px}
.md-box{position:relative;margin:0 auto;border-radius:18px;overflow:hidden;background:#15130f;box-shadow:0 18px 60px rgba(0,0,0,.55)}
.md-box canvas{position:absolute;left:0;top:0}
.md-box.md-doc{background:#EDE8DE;border-radius:6px;box-shadow:0 24px 70px rgba(0,0,0,.7)}
.md-lab{position:absolute;left:16px;top:16px;font-size:24px;font-weight:900;color:#111;background:rgba(244,241,234,.92);padding:4px 14px;border-radius:999px;letter-spacing:1px;z-index:3}
.md-lab.ai{background:var(--o)}
.md-ph{position:absolute;left:40px;right:40px;top:50%;transform:translateY(-50%);text-align:center;color:#8E8A82;font-size:28px;line-height:1.5;z-index:2}
.md-ph b{display:block;color:#F4F1EA;font-size:34px;margin-bottom:10px}
.md-pin{position:absolute;left:0;top:0;z-index:4;white-space:nowrap}
.md-pin i{position:absolute;left:-15px;top:-15px;width:30px;height:30px;border-radius:50%;border:5px solid var(--o);box-shadow:0 0 0 6px rgba(245,166,35,.25),0 0 22px rgba(245,166,35,.6)}
.md-pin span{position:absolute;left:28px;top:-26px;font-size:32px;font-weight:900;color:#F4F1EA;background:rgba(10,10,10,.86);border-left:6px solid var(--o);padding:6px 16px;border-radius:6px;line-height:1.3}
.md-pin.l span{left:auto;right:28px;border-left:0;border-right:6px solid var(--o)}
.md-cap{font-size:40px;font-weight:900;line-height:1.4;margin-top:26px;text-align:center}
#mdbg{position:absolute;left:0;top:0;width:1080px;height:1920px;pointer-events:none}
.pl-box{position:relative;margin-top:26px;padding:34px 40px 30px;border:2px solid #3E3B36;border-radius:22px;background:rgba(12,11,9,.82)}
.pl-in{position:relative;margin-bottom:34px}
.pl-l{display:flex;justify-content:space-between;align-items:baseline;font-size:36px;font-weight:900}
.pl-l b{color:var(--o);font-size:46px;font-variant-numeric:tabular-nums}
.pl-tr{position:relative;height:14px;border-radius:7px;background:#3E3B36;margin-top:22px}
.pl-fill{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:var(--o)}
.pl-knob{position:absolute;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:#F4F1EA;border:7px solid var(--o);box-shadow:0 4px 18px rgba(0,0,0,.6)}
.pl-mm{display:flex;justify-content:space-between;font-size:24px;color:#8E8A82;margin-top:16px}
.pl-mm i{font-style:normal}
.pl-outs{display:flex;gap:22px;margin-top:6px}
.pl-out{flex:1;border-top:4px solid #3E3B36;padding-top:16px}
.pl-out.hot{border-top-color:var(--o)}
.pl-ol{font-size:28px;color:#8E8A82;font-weight:700}
.pl-ov{font-size:76px;font-weight:900;line-height:1.15;font-variant-numeric:tabular-nums}
.pl-out.hot .pl-ov{color:var(--o)}
.pl-ov .unit{font-size:36px;margin-left:6px}
.pl-ob{height:12px;background:#2A2723;border-radius:6px;margin-top:10px;overflow:hidden}
.pl-obf{height:100%;background:#8E8A82;border-radius:6px}.pl-out.hot .pl-obf{background:var(--o)}
.pl-caps{position:relative;height:104px;margin-top:22px}
.pl-cap{position:absolute;left:0;right:0;top:0;font-size:36px;font-weight:900;line-height:1.4;opacity:0}
.pl-hand{position:absolute;left:0;top:0;width:64px;height:76px;z-index:5;opacity:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.7))}
.pl-cta{margin-top:24px;font-size:34px;font-weight:900;color:#111;background:var(--o);border-radius:999px;padding:12px 30px;display:inline-block}
.pl-cta-i{margin-right:12px}
`;document.head.appendChild(st);})();
const MD_FR={full:[920,700],wide:[920,518],tall:[600,800],doc:[760,860]};
const _mdLab=m=>m.label||(m.gen?'AI 生成':'');
function _mdBox(d,m,id){const fr=MD_FR[m.frame||d.frame||'full']?(m.frame||d.frame||'full'):'full',W=MD_FR[fr][0],H=d.h||MD_FR[fr][1],lab=_mdLab(m);
 return `<div class="md-box md-${fr}" data-mdid="${esc(id)}" style="width:${W}px;height:${H}px"><canvas width="${W}" height="${H}" style="width:${W}px;height:${H}px"></canvas>`+
  (lab?`<span class="md-lab${m.gen&&!m.label?' ai':''}">${esc(lab)}</span>`:'')+
  (m.missing?`<div class="md-ph"><b>${m.kind==='video'?'视频镜头占位':'图片占位'}</b>${esc(m.missing).slice(0,60)}</div>`:'')+
  (d.pins||[]).map(p=>`<div class="md-pin${p.side==='l'?' l':''}"><div class="u" data-s="${p.s==null?0:p.s}"><i></i>${p.t?`<span>${hi(p.t)}</span>`:''}</div></div>`).join('')+`</div>`;}
const _mdCard=d=>head(d)+U(0,_mdBox(d,d.media||{},d._id||''),'md-w')+(d.cap?U(sOf(d.cap,0),hi(d.cap.t||d.cap),'md-cap'):'');
Object.assign(CARD_EXT,{photo:_mdCard,clip:_mdCard,
 // 试玩卡 {eyebrow,title,inputs:[{k,label,min,max,step,unit,v,keys:[{v,s,t}]}],consts:{},outputs:[{label,f,unit,dec,max,hot,bar}],cta:{t,s}}
 play:d=>{const ins=d.inputs||[],outs=d.outputs||[];
  return head(d)+`<div class="pl-box">`+ins.map((x,i)=>`<div class="pl-in" data-i="${i}"><div class="pl-l"><span>${hi(x.label)}</span><b class="pl-val"></b></div>`+
   `<div class="pl-tr"><div class="pl-fill"></div><div class="pl-knob"></div></div><div class="pl-mm"><i>${esc(x.min)}${esc(x.unit||'')}</i><i>${esc(x.max)}${esc(x.unit||'')}</i></div></div>`).join('')+
   `<div class="pl-outs">`+outs.map((o,i)=>`<div class="pl-out${o.hot?' hot':''}" data-o="${i}"><div class="pl-ol">${hi(o.label)}</div><div class="pl-ov"><b></b>${o.unit?`<span class="unit">${esc(o.unit)}</span>`:''}</div>`+
    (o.bar===false?'':`<div class="pl-ob"><div class="pl-obf"></div></div>`)+`</div>`).join('')+`</div>`+
   `<div class="pl-caps">`+ins.flatMap(x=>x.keys||[]).filter(k=>k.t).map(k=>`<div class="pl-cap" data-ks="${k.s}">${hi(k.t)}</div>`).join('')+`</div>`+
   `<svg class="pl-hand" viewBox="0 0 64 76"><path d="M22 4c4 0 7 3 7 7v22l3-1c3-1 6 1 7 3l1 2 3-1c3-1 6 1 7 4l1 2 2-1c3 0 6 2 6 6v12c0 9-7 16-16 16H31c-5 0-9-2-12-6L5 46c-2-3-1-6 2-8 3-2 6-1 8 1l0 0V11c0-4 3-7 7-7z" fill="#F4F1EA" stroke="#111" stroke-width="3" stroke-linejoin="round"/></svg>`+
   `</div>`+(d.cta?U(sOf(d.cta,0),`<span class="pl-cta-i">▶</span>${hi(d.cta.t||d.cta)}`,'pl-cta'):'');}});

// ---------- 取图 / 取帧：没解码完就挂起，render(t) 返回 Promise ----------
const _MDI=new Map();let _MDP=[];
function _mdImg(url){let e=_MDI.get(url);if(!e){const img=new Image();e={img,ok:false};e.p=new Promise(r=>{img.onload=()=>{e.ok=true;r();};img.onerror=()=>{console.error('媒体加载失败：'+url);r();};});img.src=url;_MDI.set(url,e);
  if(_MDI.size>90){for(const [u,x] of _MDI){if(x.ok&&u!==url){_MDI.delete(u);if(_MDI.size<=60)break;}}}}
 return e;}
function _mdSrcAt(m,lt){if(m.kind==='video'&&m.n){const f=Math.max(0,Math.min(m.n-1,Math.floor(lt*30+1e-6)));return m.dir+'/'+String(f+1).padStart(4,'0')+'.jpg';}return m.src;}
// 画一帧：view = {s:缩放, cx, cy}；图像点 (cx,cy) 尽量放到盒子中心，cover 时不露边
// ---------- 老杨魔方专属 2.8 秒电影级 WebGL2 光线步进 3D 魔方片头（brand: "cube" | "cube_gold" | "cube_cyan"）----------
// 真 PBR 倒角黑曜石金属块 + 熔金炽热核心裂缝 + 翡翠冷光轮廓切边 + 真实环境光遮蔽(AO) + 撞击镜头震动/色散
let _GLC=null,_GL=null,_GLP=null,_GLU=null;
function _initBrandGL(){
 if(_GL)return true;
 _GLC=document.createElement('canvas');_GLC.width=720;_GLC.height=1280;
 const gl=_GLC.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl)return false;
 const vs=`#version 300 es
  in vec2 a_p; out vec2 v_uv;
  void main(){ v_uv=a_p*0.5+0.5; gl_Position=vec4(a_p,0.0,1.0); }`;
 const fs=`#version 300 es
  precision highp float;
  in vec2 v_uv; out vec4 fragColor;
  uniform float u_t, u_dur, u_mode;
  uniform vec2 u_res;

  float cl(float x){ return clamp(x,0.0,1.0); }
  float eo3(float x){ float a=1.0-cl(x); return 1.0-a*a*a; }
  float bo3(float x){ float u=cl(x)-1.0; return 1.0+2.3*u*u*u+1.3*u*u; }
  mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

  float hash13(vec3 p){
    p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z);
  }
  float noise(vec3 p){
    vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash13(i+vec3(0,0,0)),hash13(i+vec3(1,0,0)),f.x),
          mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),
          mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);
  }

  float sdRoundBox(vec3 p, vec3 b, float r){
    vec3 q=abs(p)-b;
    return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r;
  }

  // 全局动画状态（每像素一致，纯函数）
  float g_explode, g_pulse, g_outP, g_twAxis, g_twAng;
  mat2 g_rx, g_ry, g_rz;

  // 返回 vec2(距离, 材质ID: 0=黑曜石装甲, 1=熔金发光核心, 2=翡翠/金能量镶嵌)
  vec2 map(vec3 p){
    p.xz*=g_ry; p.yz*=g_rx; p.xy*=g_rz;

    // 内部炽热熔金核心球（块缝隙间透出炙热光芒，增加张力与冲突感）
    float coreR=0.52+0.12*g_pulse+0.18*g_outP;
    float dCore=length(p)-coreR - 0.04*noise(p*5.0+u_t*2.4);

    // 3x3x3 魔方：先对当前拧动层做局部旋转
    vec3 q=p;
    float sp=0.72+g_explode;
    if(g_twAxis>-0.5){
      float halfGap=sp*0.5;
      if(g_twAxis<0.5 && q.x>halfGap*0.85) q.yz*=rot(g_twAng);
      else if(g_twAxis>0.5 && g_twAxis<1.5 && q.y>halfGap*0.85) q.xz*=rot(g_twAng);
      else if(g_twAxis>1.5 && q.z>halfGap*0.85) q.xy*=rot(g_twAng);
    }

    // 3x3x3 重复晶格（限制在 [-1,1]^3）
    vec3 id=clamp(round(q/sp), -1.0, 1.0);
    vec3 lp=q - id*sp;

    // 重型精密倒角方块 + 面内凹装甲槽（消除单薄纸片感）
    float box=sdRoundBox(lp, vec3(0.285), 0.042);
    // 每面中心微凹槽，形成立体金属边框
    vec3 ap=abs(lp);
    float groove=min(min(max(ap.x-0.21,max(ap.y-0.21,-(ap.z-0.312))),
                         max(ap.y-0.21,max(ap.z-0.21,-(ap.x-0.312)))),
                         max(ap.z-0.21,max(ap.x-0.21,-(ap.y-0.312))));
    float cubie=max(box, -groove*0.35);

    // 掏空最中心块让熔金核可见
    if(dot(id,id)<0.1) cubie=10.0;

    float h=hash13(id+vec3(4.2,7.1,2.9));
    float matId=(h>0.74)?2.0:((h<0.24)?3.0:0.0); // 2=熔金徽章块, 3=翡翠徽章块, 0=重型黑曜石金属

    if(dCore<cubie) return vec2(dCore, 1.0);
    return vec2(cubie, matId);
  }

  vec3 calcNormal(vec3 p){
    vec2 e=vec2(0.0025,-0.0025);
    return normalize(e.xyy*map(p+e.xyy).x + e.yyx*map(p+e.yyx).x + e.yxy*map(p+e.yxy).x + e.xxx*map(p+e.xxx).x);
  }

  float calcAO(vec3 pos, vec3 nor){
    float occ=0.0, sca=1.0;
    for(int i=0;i<5;i++){
      float h=0.03+0.13*float(i)/4.0;
      float d=map(pos+h*nor).x;
      occ+=(h-d)*sca; sca*=0.72;
    }
    return clamp(1.0-2.6*occ, 0.05, 1.0);
  }

  vec3 aces(vec3 x){
    return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);
  }

  vec3 renderScene(vec2 uv){
    vec2 p=(uv-vec2(0.54,0.48))*vec2(u_res.x/u_res.y, 1.0);

    // 0.45s 撞击瞬间微震镜头（增强张力）
    float sh=exp(-max(0.0,u_t-0.45)*18.0)*step(0.45,u_t);
    p+=vec2(sin(u_t*140.0),cos(u_t*175.0))*0.014*sh;

    // 摄像机：拉远到完整展示 3x3x3 装甲魔方全貌，锁死瞬间猛推近增强冲击张力
    float camZ=7.55 - 0.85*g_pulse + 1.8*g_outP*g_outP;
    vec3 ro=vec3(0.0, 0.12, camZ);
    vec3 rd=normalize(vec3(p, -1.72));

    // 冷暖双极冲突配色：炽热熔金橙 vs 锐利冷翡翠（或青）
    vec3 colWarm=vec3(1.0, 0.48, 0.06);
    vec3 colHot =vec3(1.0, 0.82, 0.28);
    vec3 colCold=(u_mode>1.5)?vec3(0.20, 0.88, 0.95):((u_mode>0.5)?vec3(1.0, 0.78, 0.35):vec3(0.08, 0.95, 0.52));

    // 背景深渊 + 戏剧性双色氛围光柱
    vec3 bg=vec3(0.018, 0.016, 0.014);
    float rDist=length(p);
    bg+=colWarm*exp(-rDist*2.6)*(0.18+0.26*g_pulse);
    bg+=colCold*exp(-length(p-vec2(0.22,0.16))*3.2)*(0.14+0.12*g_pulse);

    // 0.45s 锁死双层能量冲击波环
    float st0=u_t-0.45;
    if(st0>0.0 && st0<0.75){
      float q1=cl(st0/0.58), rad1=0.14+0.72*eo3(q1);
      float ring1=exp(-abs(rDist-rad1)*42.0)*(1.0-q1);
      float q2=cl((st0-0.08)/0.58), rad2=0.12+0.68*eo3(q2);
      float ring2=exp(-abs(rDist-rad2)*52.0)*(1.0-q2)*step(0.08,st0);
      bg+=colHot*ring1*1.4 + colCold*ring2*1.1;
    }

    // 光线步进（64 步）
    float t=0.0, glow=0.0, hitMat=-1.0;
    for(int i=0;i<64;i++){
      vec3 pos=ro+rd*t;
      vec2 res=map(pos);
      // 累积内部熔金缝隙辉光（体积光感）
      if(res.y==1.0) glow+=0.028/(0.05+res.x*res.x*14.0);
      else glow+=0.004/(0.08+res.x*res.x*30.0);
      if(res.x<0.0022){ hitMat=res.y; break; }
      t+=res.x*0.82;
      if(t>10.0) break;
    }

    vec3 col=bg;
    if(hitMat>=0.0){
      vec3 pos=ro+rd*t;
      vec3 nor=calcNormal(pos);
      // 3D 拉丝金属微法线扰动（彻底告别塑料平滑感）
      vec3 rp=pos; rp.xz*=g_ry; rp.yz*=g_rx; rp.xy*=g_rz;
      float brush=noise(rp*vec3(48.0, 6.0, 48.0))*0.06;
      nor=normalize(nor + vec3(brush, brush*0.5, -brush));

      float ao=calcAO(pos, nor);
      vec3 V=-rd;
      float fre=pow(1.0-max(dot(nor,V),0.0), 3.2);

      // 强烈冷暖冲突三点布光
      vec3 L1=normalize(vec3(-0.78, -0.45, 0.55)); // 左下炽热熔金主光
      vec3 L2=normalize(vec3( 0.82,  0.65, 0.35)); // 右上冷冽翡翠轮廓光
      vec3 L3=normalize(vec3( 0.0,   0.25, 0.95)); // 正面金属高光补光

      float dif1=max(dot(nor,L1),0.0);
      float dif2=max(dot(nor,L2),0.0);
      float spec1=pow(max(dot(reflect(-L1,nor),V),0.0), 36.0);
      float spec2=pow(max(dot(reflect(-L2,nor),V),0.0), 48.0);
      float spec3=pow(max(dot(reflect(-L3,nor),V),0.0), 22.0);

      if(hitMat==1.0){
        // 内部熔金能量核心
        float n=noise(rp*6.5 - u_t*3.0);
        col=mix(colWarm, colHot, n)*(2.2+1.4*g_pulse);
      }else{
        // 基础材质：重型拉丝黑曜石 / 熔金装甲 / 翡翠装甲
        vec3 base=vec3(0.035, 0.034, 0.038);
        float metal=0.92;
        if(hitMat==2.0){ base=vec3(0.32, 0.16, 0.03); metal=1.0; }
        else if(hitMat==3.0){ base=vec3(0.02, 0.22, 0.12); metal=0.95; }

        col = base*(0.22 + 1.35*dif1*colWarm + 1.05*dif2*colCold)*ao;
        // 锐利金属镜面反射
        col += (spec1*colHot*1.55 + spec2*colCold*1.45 + spec3*vec3(1.0,0.94,0.86)*0.55)*metal*ao;
        // 强边缘菲涅尔冷暖冲突轮廓光
        vec3 rimCol=mix(colWarm, colCold, smoothstep(-0.3, 0.5, nor.x+nor.y));
        col += rimCol*fre*(1.25+0.65*g_pulse)*ao;
        // 深缝隙里反射出来的内部熔金次表面辉光
        float crack=smoothstep(0.95, 0.35, length(rp));
        col += colWarm*crack*(0.55+0.45*g_pulse)*(1.0-ao*0.55);
      }
      // 距离雾融合
      col=mix(bg, col, exp(-0.025*t*t));
    }

    // 叠加体积熔金辉光 + 变形电影横光斑
    col += mix(colWarm, colHot, 0.4)*glow*(0.42+0.35*g_pulse);
    float flare=exp(-abs(p.y)*36.0)*exp(-abs(p.x)*2.4)*(0.35+0.85*g_pulse)*step(0.38,u_t);
    col += mix(colHot, colCold, 0.25)*flare;

    return col;
  }

  void main(){
    float outP=cl((u_t-(u_dur-0.75))/0.75);
    float envA=1.0-eo3(outP);
    if(envA<=0.002){ fragColor=vec4(0.0); return; }

    // 节奏脉冲：0.45s 锁死重击 + 0.62 / 1.02 / 1.42s 三连快拧
    float pulse=0.0;
    float b[4]=float[4](0.45, 0.62, 1.02, 1.42);
    for(int i=0;i<4;i++){
      float dt=u_t-b[i];
      if(dt>=0.0 && dt<0.36) pulse=max(pulse, exp(-dt*(i==0?9.0:13.0))*(i==0?1.2:0.75));
    }
    g_pulse=pulse; g_outP=outP;

    float introP=eo3(u_t/0.46);
    g_explode=0.05 + 0.95*(1.0-introP) + 0.06*pulse + 1.45*outP*outP;
    g_ry=rot(0.62 + u_t*0.78 + 0.35*introP + 1.6*outP*outP);
    g_rx=rot(0.52 + 0.14*sin(u_t*1.9));
    g_rz=rot(-0.18 + 0.08*cos(u_t*1.5));

    // 三拍紧凑机械快拧
    g_twAxis=-1.0; g_twAng=0.0;
    if(u_t>=0.60 && u_t<0.92){ g_twAxis=0.0; g_twAng=bo3((u_t-0.60)/0.32)*1.5708; }
    else if(u_t>=1.00 && u_t<1.32){ g_twAxis=1.0; g_twAng=bo3((u_t-1.00)/0.32)*1.5708; }
    else if(u_t>=1.40 && u_t<1.72){ g_twAxis=2.0; g_twAng=bo3((u_t-1.40)/0.32)*1.5708; }

    // 撞击瞬间 RGB 色散撕裂（大片冲突感）
    float ca=(0.002 + 0.011*pulse + 0.008*outP);
    vec2 dir=(v_uv-vec2(0.54,0.48));
    vec3 col;
    if(ca>0.004){
      col.r=renderScene(v_uv + dir*ca).r;
      col.g=renderScene(v_uv).g;
      col.b=renderScene(v_uv - dir*ca).b;
    }else{
      col=renderScene(v_uv);
    }

    // 电影级 ACES 色调映射 + Gamma + 细腻暗角
    col=aces(col*1.12);
    col=pow(col, vec3(0.92));
    float vig=1.0-0.38*dot(v_uv-0.5, v_uv-0.5)*2.2;
    col*=vig;
    fragColor=vec4(col, envA);
  }`;

 const mk=(tp,src)=>{const s=gl.createShader(tp);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error('brandGL',gl.getShaderInfoLog(s));return null;}return s;};
 const s1=mk(gl.VERTEX_SHADER,vs),s2=mk(gl.FRAGMENT_SHADER,fs);if(!s1||!s2)return false;
 const pr=gl.createProgram();gl.attachShader(pr,s1);gl.attachShader(pr,s2);gl.linkProgram(pr);
 if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){console.error('brandGL link',gl.getProgramInfoLog(pr));return false;}
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const loc=gl.getAttribLocation(pr,'a_p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 _GL=gl;_GLP=pr;_GLU={t:gl.getUniformLocation(pr,'u_t'),dur:gl.getUniformLocation(pr,'u_dur'),mode:gl.getUniformLocation(pr,'u_mode'),res:gl.getUniformLocation(pr,'u_res')};
 return true;
}
function _drawBrandCube(X,W,H,t,m){
 const DUR=m.dur==null?2.8:m.dur;
 if(t>DUR+0.05)return;
 if(_initBrandGL()){
  const gl=_GL,mode=m.brand==='cube_cyan'?2:(m.brand==='cube_gold'?1:0);
  gl.viewport(0,0,_GLC.width,_GLC.height);gl.useProgram(_GLP);
  gl.uniform1f(_GLU.t,t);gl.uniform1f(_GLU.dur,DUR);gl.uniform1f(_GLU.mode,mode);gl.uniform2f(_GLU.res,_GLC.width,_GLC.height);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  X.drawImage(_GLC,0,0,W,H);
 }
}
function _mdDraw(cv,m,lt,tAbs,view,pins){const X=cv.getContext('2d'),W=cv.width,H=cv.height;
 if(m.brand){_drawBrandCube(X,W,H,tAbs,m);return null;}
 if(m.missing||!m.src&&!m.n){const g=X.createLinearGradient(0,0,W,H);g.addColorStop(0,'#211d17');g.addColorStop(1,'#0f0e0c');X.fillStyle=g;X.fillRect(0,0,W,H);
  const p=((tAbs*0.35)%1.6)-0.3,bx=p*(W+H);X.save();X.globalAlpha=0.10;X.fillStyle='#F5A623';X.beginPath();X.moveTo(bx,0);X.lineTo(bx+140,0);X.lineTo(bx+140-H,H);X.lineTo(bx-H,H);X.fill();X.restore();
  X.strokeStyle='rgba(245,166,35,.45)';X.setLineDash([16,12]);X.lineWidth=4;X.strokeRect(2,2,W-4,H-4);X.setLineDash([]);
  (pins||[]).forEach(p=>{p.el.style.transform=`translate(${(p.x*W).toFixed(1)}px,${(p.y*H).toFixed(1)}px)`;});return null;}
 const url=_mdSrcAt(m,lt),e=_mdImg(url);
 const paint=()=>{const iw=m.iw||e.img.naturalWidth,ih=m.ih||e.img.naturalHeight;if(!iw||!ih)return;
  const base=m.fit==='contain'?Math.min(W/iw,H/ih):Math.max(W/iw,H/ih),s=base*view.s,dw=iw*s,dh=ih*s;
  const ox=dw<=W?(W-dw)/2:Math.min(0,Math.max(W-dw,W/2-view.cx*dw)),oy=dh<=H?(H-dh)/2:Math.min(0,Math.max(H-dh,H/2-view.cy*dh));
  if(m.fit==='contain'){X.fillStyle='#EDE8DE';X.fillRect(0,0,W,H);}
  X.save();if(m.look!=='raw')X.filter=m.fit==='contain'?'none':'saturate(.82) contrast(1.04)';X.drawImage(e.img,ox,oy,dw,dh);X.restore();
  if(m.fit!=='contain'){const v=X.createLinearGradient(0,H*0.62,0,H);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');X.fillStyle=v;X.fillRect(0,0,W,H);}
  (pins||[]).forEach(p=>{p.el.style.transform=`translate(${(ox+p.x*dw).toFixed(1)}px,${(oy+p.y*dh).toFixed(1)}px)`;});};
 if(e.ok)paint();else _MDP.push(e.p.then(paint));
 return e;}
function _mdView(c,m,d,t){const T=c.t1-c.t0,u=cl((t-c.t0)/Math.max(0.5,T)),kb=m.kb||d.kb||(m.kind==='video'?[1.0,1.03]:[1.0,1.07]),pan=m.pan||d.pan||[0.5,0.5,0.5,0.5];
 let s=kb[0]+(kb[1]-kb[0])*u,cx=pan[0]+(pan[2]-pan[0])*u,cy=pan[1]+(pan[3]-pan[1])*u;const z=d.zoom;
 if(z){const q=io(cl((t-tau(c,z.s==null?1:z.s))/1.0))*(z.back!=null?1-io(cl((t-tau(c,z.back))/0.8)):1);s*=1+((z.z||1.8)-1)*q;cx+=(z.x-cx)*q;cy+=(z.y-cy)*q;}
 return {s,cx,cy};}
// 整屏动态底图层（data.bleed）
let _MDBG=null;
function _mdBg(){if(!_MDBG){_MDBG=document.createElement('canvas');_MDBG.id='mdbg';_MDBG.width=1080;_MDBG.height=1920;document.getElementById('bgs').after(_MDBG);}return _MDBG;}
// ---------- 试玩卡：按时间算滑杆的值、手的位置 ----------
function _plInit(k){const d=k.c.data||{},el=k.el,box=el.querySelector('.pl-box');if(!box)return null;
 const rel=(e)=>{let x=0,y=0;while(e&&e!==box){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent;}return [x,y];};
 const names=[...(d.inputs||[]).map(x=>x.k),...Object.keys(d.consts||{})],cv=Object.values(d.consts||{});
 const P={box,hand:box.querySelector('.pl-hand'),ins:(d.inputs||[]).map((x,i)=>{const row=box.querySelector(`.pl-in[data-i="${i}"]`),tr=row.querySelector('.pl-tr'),[tx,ty]=rel(tr);
   return {x,row,val:row.querySelector('.pl-val'),fill:row.querySelector('.pl-fill'),knob:row.querySelector('.pl-knob'),tx,ty:ty+7,tw:tr.offsetWidth,dec:(String(x.step||1).split('.')[1]||'').length};}),
  outs:(d.outputs||[]).map((o,i)=>{const e=box.querySelector(`.pl-out[data-o="${i}"]`);let fn;try{fn=new Function(...names,'return ('+o.f+');');}catch(err){console.error('试玩卡公式写错：'+o.f);fn=()=>0;}
   return {o,b:e.querySelector('.pl-ov b'),bar:e.querySelector('.pl-obf'),fn};}),
  caps:[...box.querySelectorAll('.pl-cap')].map(e=>({e,s:+e.dataset.ks})),cv};
 const keys=[];P.ins.forEach((p,i)=>(p.x.keys||[]).forEach(kk=>keys.push({i,v:kk.v,s:kk.s})));P.keys=keys.sort((a,b)=>tau(k.c,a.s)-tau(k.c,b.s));return P;}
function _plFrame(k,t){const P=k._pl||(k._pl=_plInit(k));if(!P)return;const c=k.c,MV=0.35,DR=0.9;
 const vals=P.ins.map(p=>{let v=p.x.v;(p.x.keys||[]).forEach(kk=>{const T=tau(c,kk.s)+MV;v=v+(kk.v-v)*io(cl((t-T)/DR));});return v;});
 const kx=(i,v)=>{const p=P.ins[i];return [p.tx+p.tw*cl((v-p.x.min)/(p.x.max-p.x.min)),p.ty];};
 P.ins.forEach((p,i)=>{const f=cl((vals[i]-p.x.min)/(p.x.max-p.x.min));p.fill.style.width=(f*100).toFixed(2)+'%';p.knob.style.left=(f*100).toFixed(2)+'%';
  p.val.textContent=vals[i].toFixed(p.dec)+(p.x.unit||'');});
 P.outs.forEach(o=>{let v=0;try{v=+o.fn(...vals,...P.cv);}catch(e){}const dec=o.o.dec==null?1:o.o.dec;o.b.textContent=isFinite(v)?v.toFixed(dec):'—';
  if(o.bar)o.bar.style.width=(100*cl(v/(o.o.max||1))).toFixed(2)+'%';});
 // 手：第一个 key 前不出现；每个 key 先花 0.35s 移到滑块，再跟着滑块拖 0.9s
 let a=-1;P.keys.forEach((kk,j)=>{if(t>=tau(c,kk.s))a=j;});
 if(a<0){P.hand.style.opacity=0;}else{const K=P.keys[a],T=tau(c,K.s),i=K.i;
  const startV=P.keys.slice(0,a).filter(x=>x.i===i).reduce((v,x)=>x.v,P.ins[i].x.v);
  const to=kx(i,t<T+MV?startV:vals[i]);let from=a?kx(P.keys[a-1].i,P.keys[a-1].v):[to[0]+120,to[1]+170];
  const q=eo(cl((t-T)/MV)),x=from[0]+(to[0]-from[0])*q,y=from[1]+(to[1]-from[1])*q,press=t>=T+MV&&t<T+MV+DR?0.9:1;
  P.hand.style.opacity=(a?1:eo(cl((t-T)/0.3))).toFixed(3);P.hand.style.transform=`translate(${(x-22).toFixed(1)}px,${(y-4).toFixed(1)}px) scale(${press})`;}
 let cur=null;P.caps.forEach(cp=>{if(t>=tau(c,cp.s)+MV+DR*0.6)cur=cp;});
 P.caps.forEach(cp=>{cp.e.style.opacity=cp===cur?eo(cl((t-tau(c,cp.s)-MV-DR*0.6)/0.4)).toFixed(3):0;});}
// ---------- 每帧（renderCards 末尾调用）----------
function MEDIA_ALL(t,K){let bg=null;if(_MDBG)_MDBG.getContext('2d').clearRect(0,0,1080,1920);
 K.forEach(k=>{const c=k.c,d=c.data||{};const on=t>=c.t0-0.01&&t<=c.t1+0.01;
  if(c.type==='play'&&on)_plFrame(k,t);
  if(d.media&&on){if(!k._md)k._md={cv:k.el.querySelector('.md-box canvas'),pins:[...k.el.querySelectorAll('.md-pin')].map((el,i)=>({el,x:d.pins[i].x,y:d.pins[i].y}))};
   if(k._md.cv)_mdDraw(k._md.cv,d.media,Math.max(0,t-c.t0),t,_mdView(c,d.media,d,t),k._md.pins);}
  // 整屏底图：brand 程序化片头按 dur（默认 2.8s）精准退场；普通视频/图片按卡片时间 + hold 淡出
  const isBr=d.bleed&&d.bleed.brand,brDur=isBr?(d.bleed.dur==null?2.8:d.bleed.dur):0;
  const hold=d.bleed?(d.bleed.hold==null?0.9:d.bleed.hold):0;
  const onB=d.bleed&&(isBr?(t>=c.t0-0.01&&t<=c.t0+brDur+0.05):(t>=c.t0-0.01&&(c.last||t<=c.t1+hold+0.5)));
  if(onB){const a=isBr?1:((c.first?1:eo(cl((t-c.t0)/0.4)))*(c.last?1:1-cl((t-(c.t1+hold))/0.5)));if(a>0){bg=bg||_mdBg();const X=bg.getContext('2d');
   const off=document.createElement('canvas');off.width=1080;off.height=1920;   // 先画到离屏，再按卡片透明度叠上去（两张 bleed 交叉淡化时不打架）
   const m=d.bleed;
   const blit=()=>{X.save();X.globalAlpha=a*(m.dim==null?(m.brand?0.98:0.8):m.dim);X.filter=(m.look==='raw'||m.brand)?'none':'saturate(.7) brightness(.62)';X.drawImage(off,0,0);X.restore();};   // 整屏底图压暗、降饱和，和 v3 底图观感一致；brand 程序化片头直出原色
   const n0=_MDP.length,e=_mdDraw(off,m,Math.max(0,t-c.t0),t,_mdView(c,m,{},t),null);
   if(e&&!e.ok&&_MDP.length>n0)_MDP[_MDP.length-1]=_MDP[_MDP.length-1].then(blit);else blit();}}});}
function MEDIA_WAIT(){if(!_MDP.length)return undefined;const p=Promise.all(_MDP);_MDP=[];return p;}
