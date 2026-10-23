# motion-prompt（第三方，MIT 许可）

来源：https://github.com/showheyohtaki/motion-prompt （Copyright (c) 2026 Shohei Ohtaki，见同目录 LICENSE）。

一本「动效词典」：168 个视觉名词（动效、镜头、转场、光影……），每个都有精确的时长 / 缓动参数和纯 Canvas 2D 代码（时间的纯函数，和本仓库的管线同一种做法）。

- 工作流 skill 在 `.claude/skills/motion-prompt/`；这里是它的离线数据（`api/v1`），沙箱里不用联网：
  ```bash
  export MOTION_PROMPT_BASE=$PWD/vendor/motion-prompt/api/v1
  node .claude/skills/motion-prompt/scripts/motion-prompt.mjs search 文字 登場
  node .claude/skills/motion-prompt/scripts/motion-prompt.mjs get 33 26 4
  ```
- 中文名词表（视频相关的 96 个）：`vendor/motion-prompt/名词表_中文.md`
- 移植代码时保留每段开头的 `// Motion Prompt #ID · MIT License …` 那一行（MIT 要求的署名）。
