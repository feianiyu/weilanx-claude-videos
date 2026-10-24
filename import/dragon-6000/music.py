"""《画了 6000 年的龙》配乐 + 音效（58.5 秒，80 BPM，D 小调五声：D F G A C）。
古筝（Karplus-Strong 拨弦 + 按音滑音）、太鼓、低音弦乐铺底、风声。27.0 秒 drop 前 0.7 秒全静。"""
import json, subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile
SR=48000; DUR=58.5; N=int(SR*DUR); rng=np.random.default_rng(11)
L=np.zeros(N); R=np.zeros(N)
def tt(d): return np.arange(int(d*SR))/SR
def midi(m): return 440*2**((m-69)/12)
def add(x,t0,g=1.0,pan=0.0):
    i=int(t0*SR)
    if i>=N or i<0: return
    x=x[:N-i]; L[i:i+len(x)]+=x*g*np.cos((pan+1)*np.pi/4)*1.414; R[i:i+len(x)]+=x*g*np.sin((pan+1)*np.pi/4)*1.414
def lp(x,f,o=2): b,a=signal.butter(o,min(0.99,f/(SR/2)),'low'); return signal.lfilter(b,a,x)
def hp(x,f): b,a=signal.butter(2,f/(SR/2),'high'); return signal.lfilter(b,a,x)
def zheng(m,d=3.0,v=0.5,bend=0.0):
    """古筝拨弦：Karplus-Strong，bend>0 时按音上滑（半音数）"""
    f=midi(m); n=int(d*SR); P=int(SR/f); buf=rng.uniform(-1,1,P)*np.hanning(P)**0.3; out=np.zeros(n)
    # 用相位累加方式读延迟线，便于滑音
    x=np.zeros(n); x[:P]=buf; g=0.4985; aa=np.zeros(P+1); aa[0]=1; aa[P-1]=-g; aa[P]=-g
    out=signal.lfilter([1.0],aa,x)
    if bend:
        t=tt(d); ratio=2**((bend*np.clip((t-0.18)/0.25,0,1))/12); ph=np.cumsum(ratio)/1.0; ph=np.clip(ph,0,n-2); i0=ph.astype(int); fr=ph-i0; out=out[i0]*(1-fr)+out[i0+1]*fr
    t=tt(d); env=np.minimum(1,t/0.002)*np.exp(-t*0.9)
    return lp(out,6000)*env*v
def taiko(v=1.0,f=58,d=1.6):
    t=tt(d); ph=2*np.pi*np.cumsum(f*(1+1.2*np.exp(-t*25)))/SR; body=np.sin(ph)*np.exp(-t*3.2)
    skin=lp(rng.standard_normal(len(t)),900)*np.exp(-t*28)*0.6
    return (body+skin)*v
def rim(v=0.3):
    t=tt(0.15); return hp(rng.standard_normal(len(t)),2500)*np.exp(-t*60)*v
def strings(ms,d,v=0.1,cut=1600,att=1.5,rel=2.0):
    t=tt(d); x=np.zeros(len(t))
    for m in ms:
        for dt in (-0.004,0,0.005):
            ph=np.cumsum(midi(m)*(1+dt)*(1+0.003*np.sin(2*np.pi*5*t)))/SR; x+=2*((ph+rng.random())%1)-1
    x/=len(ms)*3; env=np.clip(np.minimum(t/att,1)*np.minimum((d-t)/rel,1),0,1); return lp(x,cut)*env*v
def wind(d,v=0.06):
    t=tt(d); n=lp(rng.standard_normal(len(t)),500)*(0.6+0.4*np.sin(2*np.pi*0.13*t)); return n*np.clip(np.minimum(t/2,(d-t)/2),0,1)*v
def riser(d,v=0.25):
    t=tt(d); k=t/d; n=rng.standard_normal(len(t)); out=np.zeros(len(t)); seg=int(0.05*SR)
    for i in range(0,len(n),seg): out[i:i+seg]=lp(n[i:i+seg],150*(60**k[min(i,len(k)-1)]))
    return out*k**2.5*v
def boom(d=3.0,v=1.0):
    t=tt(d); ph=2*np.pi*np.cumsum(46-12*t/d)/SR; return np.sin(ph)*np.exp(-t*1.1)*np.minimum(1,t/0.005)*v
def bell(f,v=0.1,d=2.0):
    t=tt(d); return sum(np.sin(2*np.pi*f*k*t)*np.exp(-t*(2+k))*a for k,a in [(1,1),(2.76,0.35),(5.4,0.15)])*v
_t,_b,_z,_s=taiko,boom,zheng,strings
taiko=lambda v=1.0,f=58,d=1.6:_t(v*0.5,f,d)
boom=lambda d=3.0,v=1.0:_b(d,v*0.6)
zheng=lambda m,d=3.0,v=0.5,bend=0.0:_z(m,d,v*1.6,bend)
strings=lambda ms,d,v=0.1,cut=1600,att=1.5,rel=2.0:_s(ms,d,v*1.8,cut,att,rel)
D2,A2,D3,F3,G3,A3,C4,D4,F4,G4,A4,C5,D5,F5,G5,A5,C6,D6=38,45,50,53,55,57,60,62,65,67,69,72,74,77,79,81,84,86
BEAT=0.75; BAR=3.0
# ── 0–6 开场：低音、风、云后的龙 ──
add(taiko(0.9,50,2.5),0.0); add(boom(4,0.5),0.0)
add(strings([D2,A2,D3],6.4,0.13,600,1.0,1.5),0.0); add(wind(6.5,0.08),0.0)
for t0,m,b in [(0.6,A4,0),(1.9,D5,0),(3.0,C5,2),(4.6,A4,0)]: add(zheng(m,3.5,0.32,b),t0,1,0.2)
# ── 6–24 三个年代，每段 6 秒；每小节一记低鼓 ──
mot=[(0,D4),(0.75,F4),(1.5,G4),(2.25,A4),(3.0,C5),(3.75,A4),(4.5,G4)]
for sec,(t0,ch) in enumerate([(6.0,[D2,A2,D3,F3]),(12.0,[F3-12,C4-12,F3,A3]),(18.0,[G3-12,D3,G3,A3])]):
    for b in range(2): add(taiko(0.6+0.1*sec,56,1.6),t0+b*BAR); add(rim(0.12),t0+b*BAR+1.5)
    add(strings(ch,6.4,0.10+0.02*sec,900+400*sec,1.2,1.2),t0)
    for dt,m in mot: add(zheng(m+(12 if sec==2 and dt>2 else 0),3.0,0.26,2 if dt==3.0 else 0),t0+0.2+dt,1,-0.2+0.1*sec)
# 蚌壳落下：细碎的「嗒嗒」；绿松石：细铃
for k in range(40): add(rim(0.04+0.03*rng.random()),6.3+rng.random()*2.8,1,rng.uniform(-0.6,0.6))
for k in range(70): add(bell(midi([D6,F5,G5,A5,C6][rng.integers(5)]+12)*(1+rng.normal()*0.003),0.02,1.2),18.8+rng.random()*3.0,1,rng.uniform(-0.8,0.8))
# 玉的扫光
add(bell(midi(A5),0.08,3),14.2,1,0.3)
# ── 24–26.3 蓄力：古筝扫弦越来越密 + 鼓越来越快 + 上升噪声；26.3–27 全静 ──
t0=24.0; k=0
while t0<26.25:
    m=[D4,F4,G4,A4,C5,D5,F5,G5,A5][k%9]; add(zheng(m,1.2,0.2+0.15*(t0-24)/2.3),t0,1,-0.5+((k%9)/8)); t0+=0.22-0.13*(t0-24)/2.3; k+=1
for i,tb in enumerate(np.cumsum([0.75,0.5,0.375,0.25,0.19,0.15,0.12])+23.6):
    if tb<26.25: add(taiko(0.35+0.08*i,62,0.6),tb)
add(riser(2.25,0.35),24.0)
# ── 27 drop：九似拼龙 ──
add(taiko(1.3,48,3.0),27.0); add(boom(3.5,1.1),27.0); add(strings([D2,A2,D3,F3,A3,D4],9,0.17,3200,0.05,2.5),27.0)
for i in range(9):
    tn=27.6+i*0.6; add(zheng([D4,F4,G4,A4,C5,D5,F5,G5,A5][i],2.5,0.42,0),tn,1,-0.6+i*0.15); add(taiko(0.35,72,0.5),tn)
# 鼓点律动（27–36）：每拍一记，小节头重
for b in range(int((36-27)/BEAT)):
    tb=27.0+b*BEAT
    if b%4==0 and b>0: add(taiko(0.8,52,1.4),tb)
    elif b%2==1: add(rim(0.15),tb)
add(strings([F3-12,C4-12,F3,A3,C4],3.2,0.12,2500,0.4,1.2),33.0)
for t0,m in [(33.2,A5),(33.95,G5),(34.7,F5),(35.45,D5)]: add(zheng(m,2.5,0.3),t0,1,0.3)
# ── 36–42 能细能巨 / 能幽能明 ──
add(strings([D4,A4,D5],2.0,0.06,5000,0.3,1.5),36.1)                    # 缩成细线：高、细
for t0,m in [(36.3,D6),(36.8,C6),(37.3,A5)]: add(zheng(m,1.8,0.18),t0,1,0.4)
add(boom(2.0,0.9),38.0); add(strings([D2,A2],1.8,0.16,400,0.4,0.8),38.0)   # 巨大：低、厚
add(taiko(1.0,44,2.0),38.0)
add(wind(1.0,0.05),39.6)                                                 # 消失：只剩风
add(taiko(1.1,50,2.0),40.6); add(bell(midi(D6),0.15,3),40.6); add(strings([D3,A3,D4,F4],1.6,0.12,3000,0.05,1.0),40.6)
# ── 42–48 乾卦：四步，一步高一层 ──
for i,(t0,m) in enumerate([(42.1,D3),(43.6,G3),(45.1,A3),(46.6,D4)]):
    add(taiko(0.7+0.1*i,52+i*4,1.6),t0); add(zheng(m+12,2.5,0.38,2 if i==3 else 0),t0,1,0); add(strings([m-12,m-5,m],1.6,0.09,1500+700*i,0.2,0.6),t0)
    for b in (0.75,): add(rim(0.12),t0+b)
add(riser(1.4,0.2),46.6)
# ── 48–58.5 收：盘成一个 C，回到开头的玉龙 ──
for t0,ch in [(48.2,[D2,A2,D3,F3,A3]),(51.2,[F3-12,48,F3,A3,C4]),(54.2,[D2,A2,D3,G3,A3,64])]:
    add(strings(ch,3.6 if t0<54 else 4.6,0.12,2000,0.8,1.6),t0)
mel=[(48.4,A4),(49.15,C5),(49.9,D5),(51.4,F5),(52.15,D5),(52.9,C5),(54.2,D5)]
for t0,m in mel: add(zheng(m,3.0,0.34,2 if m==C5 else 0),t0,1,0.1)
add(taiko(0.6,50,2.0),48.2); add(taiko(0.5,50,2.0),51.2); add(taiko(0.7,46,3.0),54.2); add(bell(midi(A5),0.08,4),54.9)
add(wind(4.5,0.06),54.0)
x=np.stack([L,R],1)
# 简单混响：几条衰减的延迟
rv=np.zeros_like(x)
for dly,g in [(0.037,0.32),(0.061,0.27),(0.089,0.22),(0.131,0.18),(0.197,0.12),(0.27,0.08)]:
    n=int(dly*SR); rv[n:]+=x[:-n][:, ::-1 if dly>0.1 else 1]*g
x=x+lp(rv.T,4000).T*0.6
fo=np.clip((DUR-np.arange(N)/SR)/1.2,0,1); x*=fo[:,None]
x/=np.abs(x).max()*1.12
wavfile.write('music_pre.wav',SR,(x*32767).astype(np.int16))
j=subprocess.run(['ffmpeg','-i','music_pre.wav','-af','loudnorm=I=-14:TP=-1:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
d=json.loads(j[j.rfind('{'):j.rfind('}')+1])
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','music_pre.wav','-af',f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true",'-ar','48000','music.wav'])
print('ok',d['input_i'])
