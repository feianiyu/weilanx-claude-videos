"""《画了 6000 年的龙》配乐 + 音效（58.5 秒，80 BPM，D 小调五声：D F G A C）。
古筝（Karplus-Strong 拨弦 + 按音滑音）、太鼓、低音弦乐铺底、风声。27.0 秒 drop 前 0.7 秒全静。"""
import json, subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile
SR=48000; DUR=60.0; N=int(SR*DUR); rng=np.random.default_rng(11)
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
def noise(d): return rng.standard_normal(int(d*SR))
def fire(d,v=0.2):
    t=tt(d); n=lp(noise(d),1800)*(0.6+0.4*np.sin(2*np.pi*3*t)); cr=np.zeros(len(t))
    for _ in range(int(d*25)):
        i=rng.integers(0,len(t)-600); cr[i:i+600]+=hp(rng.standard_normal(600),2000)*np.exp(-np.arange(600)/80)*rng.random()
    return (n*0.6+cr*0.5)*np.clip(np.minimum(t/0.4,(d-t)/0.6),0,1)*v
def rainn(d,v=0.12,att=1.0):
    t=tt(d); n=hp(lp(noise(d),7000),900); return n*np.clip(np.minimum(t/att,(d-t)/1.0),0,1)*v
def brass(ms,d,v=0.1,cut=900):
    t=tt(d); x=np.zeros(len(t))
    for m in ms:
        ph=np.cumsum(midi(m)*(1+0.002*np.sin(2*np.pi*4.5*t)))/SR; x+=2*(ph%1)-1
    env=np.clip(np.minimum(t/0.3,(d-t)/0.8),0,1); return lp(x/len(ms),cut,3)*env*v
def gong(v=0.6,d=5.0):
    t=tt(d); x=sum(np.sin(2*np.pi*f*t+ rng.random()*6)*np.exp(-t*dc)*a for f,a,dc in [(110,1,0.6),(172,0.6,0.8),(231,0.5,1.0),(318,0.35,1.3),(447,0.25,1.6),(611,0.15,2.0)])
    sw=1+0.02*np.sin(2*np.pi*0.7*t); return x*sw*np.minimum(1,t/0.01)*v
def snip(v=0.4):
    t=tt(0.25); a=hp(rng.standard_normal(len(t)),3000)*np.exp(-t*90); b=np.zeros(len(t)); i=int(0.08*SR); b[i:]=hp(rng.standard_normal(len(t)-i),3500)*np.exp(-np.arange(len(t)-i)/SR*120)
    return (a+b)*v
def cym(v=0.15,d=1.5):
    t=tt(d); return hp(noise(d),5000)*np.exp(-t*3)*v
Eb=[0]
# ── 0–4 钩子：分屏，一记重鼓 + 火与雨同时 ──
add(taiko(1.2,46,2.5),0.0); add(boom(3,0.8),0.0); add(fire(4.0,0.18),0.0,1,-0.6); add(rainn(4.0,0.1,0.3),0.0,1,0.6)
add(strings([D2,A2,D3],4,0.12,700,0.3,1.0),0.0)
add(taiko(0.9,50,1.5),3.0)
# ── 4–12 西方：低沉铜管 + 重鼓 + 火 ──
for i,ch in enumerate([[D2,A2,D3,F3],[38-2,43,48,53],[D2,A2,D3,F3],[37,44,49,52]]):
    add(brass(ch,2.2,0.12,700+150*i),4.0+i*2.0)
for b in range(int(8/0.75)):
    tb=4.0+b*0.75
    if b%4==0: add(taiko(0.9,48,1.4),tb)
    elif b%4==2: add(taiko(0.5,60,0.8),tb)
add(fire(8.0,0.22),4.0,1,-0.3)
for t0 in (7.0,7.4,7.8): add(bell(midi(A5),0.05,1.5),t0,1,0.4)  # 金币
add(gong(0.25,4),9.6)
# ── 12–14.5 火熄 → 雨来 ──
add(hp(lp(noise(1.5),5000),1500)*np.exp(-tt(1.5)*2)*0.35,12.0)   # 嘶的一声
add(rainn(3.0,0.12,1.5),12.0)
add(zheng(D5,3.0,0.32),12.6,1,0.2)
# ── 14.5–26.3 渴：风、单音古筝、慢慢蓄力 ──
add(wind(12,0.1),14.5)
add(strings([D2,A2],12,0.08,400,3,2),14.5)
for t0,m in [(14.8,A4),(16.3,D5),(17.8,C5),(19.3,A4),(20.8,G4),(21.55,A4),(22.3,D5)]: add(zheng(m,3.0,0.3,2 if m==C5 else 0),t0,1,-0.2)
for k in range(30): add(rim(0.03+0.02*rng.random()),18.0+rng.random()*3.5,1,rng.uniform(-0.6,0.6))   # 尘土
for k in range(8): add(rim(0.15),22.6+0.6+k*0.32,1,0)   # 刻字
add(taiko(0.5,52,1.4),21.0); add(taiko(0.55,52,1.4),24.0)
t0=24.0; k=0
while t0<26.25:
    m=[D4,F4,G4,A4,C5,D5,F5,G5,A5][k%9]; add(zheng(m,1.2,0.2+0.15*(t0-24)/2.3),t0,1,-0.5+((k%9)/8)); t0+=0.22-0.13*(t0-24)/2.3; k+=1
add(riser(2.25,0.35),24.0)
# ── 27 drop：雷、暴雨、龙上天 ──
add(taiko(1.4,44,3.0),27.0); add(boom(4,1.2),27.0); add(cym(0.25,2.5),27.0)
add(rainn(9.0,0.16,0.2),27.0)
add(strings([D2,A2,D3,F3,A3,D4,F4],9,0.17,3500,0.05,2.0),27.0)
for b in range(12):
    tb=27.0+b*0.75
    add(taiko(0.75 if b%4==0 else 0.4,50 if b%4==0 else 64,1.2),tb)
for t0 in (30.0,33.0): add(boom(2.5,0.7),t0); add(cym(0.15,1.5),t0)
mel=[(28.5,A5),(29.25,G5),(30.0,A5),(31.5,D6),(32.25,C6),(33.0,A5),(34.5,G5),(35.25,F5)]
for t0,m in mel: add(zheng(m,2.8,0.36),t0,1,0.2)
# ── 36–46 皇权：铜锣、棘轮、剪刀 ──
add(gong(0.7,6),36.2); add(taiko(1.0,46,2.0),36.2)
add(brass([D2,A2,D3,F3],10,0.1,600),36.0)
for b in range(13):
    tb=36.2+b*0.75
    add(rim(0.12),tb)
add(taiko(0.7,52,1.4),38.6); add(gong(0.3,4),38.6)
for i in range(5): add(bell(midi([D5,F5,G5,A5,C6][i]),0.08,2),41.3+i*0.25,1,-0.5+i*0.25)
add(snip(0.5),43.6); add(bell(midi(D4),0.06,2),44.0)
add(taiko(0.6,56,1.2),44.3)
# ── 46–54 舞龙：快的锣鼓点 ──
for b in range(int(8/0.375)):
    tb=46.0+b*0.375
    add(taiko(0.55 if b%4==0 else 0.3,56 if b%4==0 else 70,0.7),tb,1,-0.2 if b%2 else 0.2)
    if b%4==2: add(cym(0.07,0.6),tb)
add(strings([D3,A3,D4,F4],8,0.11,2500,0.5,1.5),46.0)
for t0,m in [(46.3,D5),(47.05,F5),(47.8,G5),(49.3,A5),(50.05,G5),(50.8,F5),(52.3,D5)]: add(zheng(m,2.6,0.32),t0,1,0.15)
# ── 54–60 并置、收 ──
add(taiko(0.9,46,3.0),54.0); add(fire(5.0,0.12),54.0,1,-0.7); add(rainn(5.5,0.08,1.0),54.0,1,0.7)
add(strings([D2,A2,D3,F3,A3],6,0.12,1800,0.8,2.0),54.0)
for t0,m in [(54.3,A4),(55.0,D5),(56.2,C5),(56.95,A4),(57.7,D5)]: add(zheng(m,3.0,0.32,2 if m==C5 else 0),t0,1,0.1)
add(bell(midi(D6),0.07,3.5),57.7)
x=np.stack([L,R],1)
# 简单混响：几条衰减的延迟
rv=np.zeros_like(x)
for dly,g in [(0.037,0.32),(0.061,0.27),(0.089,0.22),(0.131,0.18),(0.197,0.12),(0.27,0.08)]:
    n=int(dly*SR); rv[n:]+=x[:-n][:, ::-1 if dly>0.1 else 1]*g
x=x+lp(rv.T,4000).T*0.6
fo=np.clip((DUR-np.arange(N)/SR)/1.2,0,1); x*=fo[:,None]
x/=np.abs(x).max()*1.12
wavfile.write('music2_pre.wav',SR,(x*32767).astype(np.int16))
j=subprocess.run(['ffmpeg','-i','music2_pre.wav','-af','loudnorm=I=-14:TP=-1:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
d=json.loads(j[j.rfind('{'):j.rfind('}')+1])
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','music2_pre.wav','-af',f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true",'-ar','48000','music2.wav'])
print('ok',d['input_i'])
