"""v3 底图调色（按 2026-10-27 用户关键帧的明暗和色彩）：暗部墨绿黑、亮部金橙，天空留层次，楼群沉下去；只缩小不放大，不模糊。
用法：python3 core/grade_bg.py assets/bg_raw.jpg assets/bg.jpg [裁切中心 x 比例，默认 0.5]
选图：原图短边 ≥2000px、主体清晰（不要虚焦 / 运动模糊）；竖版或能裁出 9:16 的横版；构图上半天空、下半主体，主体不压数据区左半边。"""
import sys
from PIL import Image, ImageFilter
import numpy as np
src,dst=sys.argv[1],sys.argv[2];cx=float(sys.argv[3]) if len(sys.argv)>3 else 0.5
im=Image.open(src).convert('RGB');W,H=im.size
if W/H>9/16: w=int(H*9/16);x0=int(min(W-w,max(0,cx*W-w/2)));im=im.crop((x0,0,x0+w,H))
else: h=int(W*16/9);y0=(H-h)//2;im=im.crop((0,y0,W,y0+h))
assert im.size[0]>=1080,'原图太小，会被放大'
im=im.resize((1080,1920),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2,percent=40,threshold=2))
a=np.asarray(im).astype(np.float32)/255
Y=(0.3*a[...,0]+0.59*a[...,1]+0.11*a[...,2])[...,None]
w=np.clip((Y-0.18)/0.6,0,1)**1.2
sh=np.array([0.55,0.75,0.70]);hi=np.array([1.25,0.92,0.52])   # 暗部偏墨绿、亮部偏金橙
tone=sh*(1-w)+hi*w
out=a*0.35+(Y*tone)*0.65
out=np.clip((out-0.45)*1.22+0.45,0,1)**1.35   # 压中间调：天空留金边，整体沉下去
k=np.interp(np.arange(1920),[0,700,1300,1920],[0.85,0.95,0.8,0.65])[:,None,None]
Image.fromarray((np.clip(out*k,0,1)*255).astype(np.uint8)).save(dst,quality=95)
