# CREDITS · 规划院转型 V2.2（在 V2.1 基础上，回到 V2 大架构）

## 画面
- 底图（全片只用这一张，与 V2 相同）：Pexels 照片 12692135「Birds Eye View of Skyscrapers in a City」（成都城市俯瞰），作者 Chao Deng，https://www.pexels.com/photo/birds-eye-view-of-skyscrapers-in-a-city-12692135/ ，Pexels License（可免费商用）。w=2160&h=3840&fit=crop 竖屏原生裁切，未放大。调色 grade_soft.py C 档（0.5 0.04 0.32 0.10 0.8 1.13,1.0,0.84）+ kfF 遮罩 + 底板；直接沿用 plan01/assets/bg/bg.jpg（V2 成片同一文件）。
- 中间区动画：自写 canvas 2D / HTML / CSS（线框大楼、刻度尺计数器、订单水位、三层抽象边界、下坠折线与冲击环、证书点阵烟散、雷达、文本粒子流、智能体节点、漂移证书、判断结构图、二选一卡、logo 描线；烟雾、粒子消散、光扫、故障切片转场）。无第三方动画代码，无地图数据（c1 边界为抽象多边形，卡面注「边界为层级示意」）。
- 字体：Noto Sans SC（SIL OFL 1.1）。

## 声音
- 配音：Microsoft Edge TTS zh-CN-YunyangNeural，rate +25%，句间 0.3s，章节间 0.6s（拍点吸附）。tts 里「本行/投行/行业」写作「本航/投航/航业」，保证读 háng（字幕不变）；faster-whisper small 抽查 v03/v09/v10 均识别为「本行」「行业」「投行」。
- BGM：Mixkit《Driving Ambition》by Ahjay Stelino（id 32；Film Score / Uplifting / Hopeful / Brass，有鼓组和主旋律，约 38.5s 起进入高潮段），https://mixkit.co/free-stock-music/tag/drums/ ，音频 https://assets.mixkit.co/music/32/32.mp3 ，Mixkit Stock Music Free License（https://mixkit.co/license/#musicFree ：可用于社交媒体视频，不可用于电视/广播、不可单独再分发）。测拍 100.0 BPM（拍长 0.6s，首拍 0.125s）；从曲中 15.125s 起播，使 v09「我的判断」正好落在曲子 67.325s 的乐句线（第二段高潮）上；v09 前一拍 BGM 静音（收一拍）。1.5s 淡入、2.5s 淡出，比人声低 7.0 dB（实测）。
- 音效：20 次，全部来自 Mixkit Sound Effects Free License（https://mixkit.co/license/#sfxFree ：可商用、无需署名；不可单独再分发），文件 https://assets.mixkit.co/active_storage/sfx/<id>/<id>-preview.mp3 ：
  - #1492 Cinematic whoosh fast transition（开场、v09 两条出路线）
  - #3049 Quest game heavy stomp（大楼长成落地）
  - #759 Glass break with hammer thud（2000万 · 线框分拆）
  - #1490 Fast whoosh transition（v02「某专家」卡片入场）
  - #2299 Short bass hit（老本行见底）
  - #2182 Wood hard hit（省/市/县三层落地 ×3、v08「转让」标签）
  - #3057 Apocalyptic stomp impact（「已交货」印章落下）
  - #1143 Cinematic whoosh deep impact（−33.82% 下坠触底）
  - #2802 Smoke bomb（90 家证书烟散）
  - #2951 Digital glitch break（换工具）
  - #3218 Positive tech alert（锁定 8 个地块）
  - #2350 Magic sparkle whoosh（13 万份文本化成粒子流）
  - #2303 Futuristic bass hit（智能体节点点亮）
  - #2908 Movie trailer epic impact（收一拍后「我的判断」落下）
  - #2903 Movie whoosh impact presentation（VS）
  - #790 Cinematic trailer riser（logo 收尾）
  每个音效按自身冲击点（峰值时刻）对齐画面动作；电平按「50ms 峰值窗 = 人声 RMS + lvl dB」设定（lvl −5 ~ −15 dB，见 lines.json 的 sfxlib）。
- 总线：compressor(-22dB, 2.5:1) → 增益 → limiter 0.89，迭代到 −14 LUFS。
- 源码包不含 Mixkit 原始音频（许可不允许随源文件再分发），用 core/fetch_assets.py 重新下载。

## 事实
见 FACTS.md（F2 90 家、F3 总规批复、F4 −33.82%、F6 厦门 10 分钟 8 地块、F7 广州 13 万份、F8 专家发言 40 亿 / 2000 万）。v08 为作者亲历观察（卡面注「作者观察 · 示意」）。c0「≈ 总投资的 0.5%」为 2000 万 ÷ 40 亿的算术结果。c2 折线以 2022 年为基准，只有 −33.82% 是实数（卡面已注）。
