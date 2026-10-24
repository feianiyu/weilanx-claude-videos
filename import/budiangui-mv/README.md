# 《步天规》纯音乐 MV

竖版 1080×1920、30fps、全长 3 分 59 秒。画面是时间 t 的纯函数（Canvas 2D），段落卡在原曲实测的进入点上，无字幕、无品牌字。

- `mv.js`：全部画面。动效词典（motion-prompt，MIT）用到 #002 #003 #004 #005 #014 #015 #022 #024 #026 #027 #028 #030 #033 #038 #039 #105 #107 #125 #134 #135 #142 #143。
- `sfx.py`：代码合成音效，音高取原曲调性（降 E 大调五声）。
- `mrender.py frames <分片> <分片数>`：逐帧渲染；`test 5,12,...` 抽帧。
- `cover.py`：封面。

不在仓库里：原曲 `song/song.mp3`（作者原创，自用）、片名字体 `ZCOOLQingKeHuangYou-Regular.ttf`（OFL，来自 google/fonts）。
混音：原曲 + 音效（−7 dB）→ alimiter → 两遍 loudnorm 到 −14 LUFS / −1 dBTP。
