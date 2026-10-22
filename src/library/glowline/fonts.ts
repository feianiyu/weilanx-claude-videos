import {continueRender, delayRender, staticFile} from 'remotion';
import '../laoyang/theme'; // 同时注册 LY Sans 500 / 900、LY Serif 等老杨魔方字体

/**
 * 光点开场用的细体：思源黑体（Noto Sans CJK SC）Light 300 / Regular 400，GB2312 常用字子集，SIL OFL。
 * 与 laoyang/theme.ts 的 LY Sans 同一个字族名，canvas 里写 `300 66px 'LY Sans'` 即可。
 */
const FACES: [string, string][] = [
  ['fonts/laoyang/LYSans-Light.woff', '300'],
  ['fonts/laoyang/LYSans-Regular.woff', '400'],
];
let loaded: Promise<void> | null = null;
export const loadGlowFonts = (): Promise<void> => {
  if (loaded) return loaded;
  loaded = Promise.all(
    FACES.map(([file, weight]) =>
      new FontFace('LY Sans', `url(${staticFile(file)})`, {weight}).load().then((f) => {
        document.fonts.add(f);
      }),
    ),
  )
    .then(() => document.fonts.ready)
    .then(() => undefined)
    .catch((err) => console.error(err));
  return loaded;
};
if (typeof document !== 'undefined') {
  const handle = delayRender('load glowline fonts');
  loadGlowFonts().finally(() => continueRender(handle));
}
