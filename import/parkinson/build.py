"""把 scene.js + 移植的彩雾 + 能量数据拼成渲染页 ep54.html（render.py 打开它逐帧出图）。
彩雾 drive.js / ColorMist.js 由 src/library/mist 的 .ts / .tsx 去掉类型得到，画法一行未改：
  node -e "const {stripTypeScriptTypes}=require('node:module')..."（见 README）"""
import os
D = os.path.dirname(os.path.abspath(__file__))
r = lambda n: open(os.path.join(D, n), encoding="utf-8").read()
js = r("drive.js") + "\n" + r("ColorMist.js") + "\nwindow.BANDS=" + r("bands.json") + ";\n" + r("scene.js")
open(os.path.join(D, "ep54.html"), "w", encoding="utf-8").write(
    '<!doctype html><html><head><meta charset=utf-8>' + r("fonts.css.html") +
    '</head><body style="margin:0;background:#000"><canvas id="out" width="1080" height="1920"></canvas><script>\n' + js + "\n</script></body></html>")
print("wrote ep54.html")
