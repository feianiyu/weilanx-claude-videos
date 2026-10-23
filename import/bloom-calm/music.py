"""「枯寂 → 繁花」配乐（40 秒）：钢琴（加法合成）+ 弦乐铺底 + 细碎的铃音，D 大调，约 66 BPM 的自由节奏。
0–6 枯寂：低音长音 + 稀疏的单音；6–14 根：钢琴动机慢慢出来；14.5 树液上行：弦乐上扬 + 上行铃音；
18–24 抽枝：琶音逐渐加密、弦乐渐强；24 繁花：整和弦涨起，几百颗细碎铃音（像花一朵朵开）；28–33 旋律；33.5–40 推近：长和弦、慢慢收住，38.4 一个落点。−14 LUFS。"""
import json, os, subprocess, tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile
SR=44100; DUR=40.0; N=int(SR*DUR); rng=np.random.default_rng(7)
L=np.zeros(N); R=np.zeros(N)
def tt(d): return np.arange(int(d*SR))/SR
def midi(m): return 440*2**((m-69)/12)
def add(x,t0,g=1.0,pan=0.0):
    i=int(t0*SR)
    if i>=N or i<0: return
    x=x[:N-i]; L[i:i+len(x)]+=x*g*np.cos((pan+1)*np.pi/4); R[i:i+len(x)]+=x*g*np.sin((pan+1)*np.pi/4)
def lp(x,f): b,a=signal.butter(2,min(0.99,f/(SR/2)),'low'); return signal.lfilter(b,a,x)
def piano(m,d=4.0,v=0.5):
    t=tt(d); f=midi(m); x=np.zeros(len(t))
    for h in range(1,11):
        fh=f*h*np.sqrt(1+0.0004*h*h); x+=np.sin(2*np.pi*fh*t+h)*np.exp(-t*(0.8+h*0.55))*(1/h**1.3)
    hammer=lp(rng.standard_normal(len(t)),3000)*np.exp(-t*80)*0.05
    return (x*0.45+hammer)*np.minimum(1,t/0.004)*v
def strings(ms,d,v=0.12,cut=1800,att=2.0,rel=2.5):
    t=tt(d); x=np.zeros(len(t))
    for m in ms:
        for dt in (-0.004,0,0.005):
            ph=np.cumsum(midi(m)*(1+dt)*(1+0.003*np.sin(2*np.pi*5*t)))/SR; x+=2*((ph+rng.random())%1)-1
    x/=len(ms)*3; env=np.minimum(1,t/att)*np.minimum(1,(d-t)/rel); return lp(x,cut)*np.clip(env,0,1)*v
def bell(f,v=0.15,d=2.5):
    t=tt(d); x=sum(np.sin(2*np.pi*f*k*t)*np.exp(-t*(1.5+k))*a for k,a in [(1,1),(2.76,0.4),(5.4,0.2)]); return x*np.minimum(1,t/0.002)*v
D=[50,57,62,66]; Bm=[47,54,59,62]; G=[43,50,55,59]; A=[45,52,57,61]; PROG=[D,Bm,G,A]
# 0–6 枯寂
add(strings([38,45],7,0.10,500,3,3),0.0)
for t0,m in [(1.2,74),(3.4,69),(5.2,71)]: add(piano(m,5,0.28),t0,1.0,0.2)
# 6–14 根：动机
mot=[(6.2,66),(6.9,69),(7.6,74),(8.9,73),(9.6,71),(10.9,69),(11.6,66),(12.3,69),(13.2,64)]
for t0,m in mot: add(piano(m,4.5,0.32),t0,1.0,-0.1)
for i,ch in enumerate([D,Bm]): add(strings(ch,4.6,0.09,900,2,2),6.0+i*4,1.0)
# 14.5 树液上行
add(strings([50,57,62,66,69],5,0.12,2200,1.5,2),14.0)
for i,m in enumerate([62,66,69,74,78,81,86]): add(bell(midi(m+12),0.08),14.5+i*0.32,1.0,-0.4+i*0.12)
# 18–24 抽枝：琶音加密
t0=18.0; k=0
while t0<24.0:
    ch=PROG[int((t0-18)//1.5)%4]; m=ch[k%4]+12+(12 if k%8>=4 else 0)
    add(piano(m,2.5,0.18+0.12*(t0-18)/6),t0,1.0,-0.3+0.6*((k%4)/3)); step=0.38-0.22*(t0-18)/6; t0+=step; k+=1
add(strings([50,57,62,66],6.2,0.14,3000,4.5,0.6),18.0)
# 24 繁花
for m in [38,50,57,62,66,69,74]: add(piano(m,6,0.3),24.0,1.0)
add(strings([50,57,62,66,69,74],10,0.18,4200,1.0,4),24.0)
for i in range(260):
    tb=24.0+rng.exponential(1.6); 
    if tb>34: continue
    m=[74,78,81,86,90,93][rng.integers(6)]; add(bell(midi(m+12)*(1+rng.normal()*0.002),0.03+0.03*rng.random(),1.6),tb,1.0,rng.uniform(-0.9,0.9))
# 28–33 旋律
mel=[(28.0,78),(28.8,81),(29.6,83),(30.6,81),(31.4,78),(32.2,76),(33.0,74)]
for t0,m in mel: add(piano(m,4,0.34),t0,1.0,0.15)
add(strings(G,4,0.12,3000,1.5,2),28.0); add(strings(A,4,0.12,3000,1.5,2),31.0)
# 33.5–40 推近，收住
add(strings([50,57,62,66,69,74,78],7,0.16,3500,2.0,3.5),33.0)
for t0,m in [(34.0,69),(35.2,74),(36.4,78)]: add(piano(m,5,0.26),t0,1.0,-0.1)
add(piano(62,5,0.32),38.4); add(piano(74,5,0.22),38.4,1.0,0.2); add(bell(midi(98),0.06,3),38.4)
# 混响：几道带低通的回声
for ch in (L,R):
    src=ch.copy()
    for d,g in [(0.13,0.25),(0.29,0.2),(0.47,0.14),(0.71,0.1),(1.03,0.06)]:
        n=int(d*SR); ch[n:]+=lp(src[:-n],2500)*g
fade=int(1.5*SR)
for ch in (L,R): ch[-fade:]*=np.linspace(1,0,fade)
mix=np.stack([L,R],1); mix=mix/(np.max(np.abs(mix))+1e-9)*0.89
tmp=tempfile.mktemp(suffix='.wav'); wavfile.write(tmp,SR,(mix*32767).astype(np.int16))
m=subprocess.run(['ffmpeg','-hide_banner','-i',tmp,'-af','loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
js=json.loads(m[m.rindex('{'):m.rindex('}')+1])
af=(f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,alimiter=limit=0.84:level=false")
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',tmp,'-af',af,'-ar','44100','-c:a','pcm_s16le','music.wav'],check=True); os.remove(tmp)
