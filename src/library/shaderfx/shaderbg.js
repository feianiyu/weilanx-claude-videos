/**
 * ShaderBG：把 Paper Shaders（Apache-2.0，paper-design/shaders）的片段着色器
 * 放进我们的逐帧渲染管线。和官方 ShaderMount 不同：不依赖 requestAnimationFrame，
 * 每帧手动给时间，render(t) 是 t 的纯函数——同一个 t 永远出同一帧。
 *
 * 用法：
 *   const bg = new ShaderBG(meshGradientFragmentShader, 1080, 1920);
 *   bg.set({colors:['#..','#..'], distortion:0.8, swirl:0.1, fit:'cover', speed:1});
 *   ctx.drawImage(bg.render(t), 0, 0);
 */
import {vertexShaderSource} from './lib/vertex-shader.js';
import {getShaderColorFromString} from './lib/get-shader-color-from-string.js';
import {getShaderNoiseTexture} from './lib/get-shader-noise-texture.js';
import {ShaderFitOptions, defaultObjectSizing} from './lib/shader-sizing.js';

const NOISE = getShaderNoiseTexture();
export const noiseReady = new Promise(r => { if (NOISE.complete) r(); else NOISE.onload = () => r(); });

export class ShaderBG {
  constructor(frag, w = 1080, h = 1920) {
    this.w = w; this.h = h;
    this.canvas = document.createElement('canvas'); this.canvas.width = w; this.canvas.height = h;
    const gl = this.gl = this.canvas.getContext('webgl2', {premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false});
    if (!gl) throw new Error('webgl2 unavailable');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = this.prog = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vertexShaderSource)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.loc = n => gl.getUniformLocation(p, n);
    this.speed = 1; this.frame = 0;
    this.set({...defaultObjectSizing});
    // 噪声贴图（部分着色器需要）
    if (this.loc('u_noiseTexture')) {
      const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, NOISE);
      gl.uniform1i(this.loc('u_noiseTexture'), 0);
      const ar = this.loc('u_noiseTextureAspectRatio'); if (ar) gl.uniform1f(ar, NOISE.naturalWidth / NOISE.naturalHeight);
    }
  }
  /** 参数名与官方 preset 一致（colors / colorBack / distortion / fit / speed / frame / shape 等） */
  set(params) {
    const gl = this.gl; gl.useProgram(this.prog);
    for (const [k, v] of Object.entries(params)) {
      if (k === 'speed') { this.speed = v; continue; }
      if (k === 'frame') { this.frame = v; continue; }
      if (k === 'name') continue;
      const u = 'u_' + k, L = this.loc(u);
      if (k === 'colors') {
        const arr = v.map(c => getShaderColorFromString(c)).flat();
        gl.uniform4fv(this.loc('u_colors'), new Float32Array(arr)); gl.uniform1f(this.loc('u_colorsCount'), v.length); continue;
      }
      if (!L) continue;
      if (k === 'fit') gl.uniform1f(L, ShaderFitOptions[v] ?? v);
      else if (typeof v === 'string') gl.uniform4fv(L, getShaderColorFromString(v));
      else if (typeof v === 'number') gl.uniform1f(L, v);
    }
  }
  render(t) {
    const gl = this.gl; gl.useProgram(this.prog);
    gl.viewport(0, 0, this.w, this.h);
    gl.uniform2f(this.loc('u_resolution'), this.w, this.h);
    gl.uniform1f(this.loc('u_pixelRatio'), 1);
    gl.uniform1f(this.loc('u_time'), (this.frame + t * 1000 * this.speed) * 0.001);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return this.canvas;
  }
}
