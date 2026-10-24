# 《步天规》MV 音效：全部用代码合成，音高取原曲调性（降 E 大调五声：Eb F G Bb C），跟画面事件对齐。
import numpy as np, wave, sys
SR=48000; DUR=238.77; N=int(DUR*SR)
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def put(sig,t0,pan=0.0,amp=1.0):
    i=int(t0*SR); n=min(len(sig),N-i)
    if n<=0 or i<0: return
    gl=np.cos((pan+1)*np.pi/4); gr=np.sin((pan+1)*np.pi/4)
    L[i:i+n]+=sig[:n]*amp*gl*1.414; R[i:i+n]+=sig[:n]*amp*gr*1.414
def tt(d): return np.arange(int(d*SR))/SR
NOTE={'Eb5':622.25,'F5':698.46,'G5':783.99,'Bb5':932.33,'C6':1046.5,'Eb6':1244.5,'F6':1396.9,'G6':1568.0,'Bb6':1864.7,'C7':2093.0,'Eb7':2489.0,'F7':2793.8,'Eb4':311.13,'Bb4':466.16}
def bell(f,d=2.6):
    t=tt(d); s=np.zeros_like(t)
    for m,a,dc in [(1,1,1.0),(2.0,0.32,0.55),(2.76,0.18,0.4),(5.4,0.07,0.2)]: s+=a*np.sin(2*np.pi*f*m*t)*np.exp(-t/(d*0.35*dc))
    return s*np.minimum(1,t/0.004)
def lowpass(x,fc):
    fc=np.broadcast_to(np.asarray(fc,dtype=float),x.shape); a=1-np.exp(-2*np.pi*fc/SR); y=np.zeros_like(x); v=0.0
    for i in range(len(x)): v+=a[i]*(x[i]-v); y[i]=v
    return y
def lp_fast(x,fc): # 固定截止频率，用 FFT
    F=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); F/=np.sqrt(1+(f/fc)**4); return np.fft.irfft(F,len(x))
def bp_fast(x,lo,hi):
    F=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); F[(f<lo)|(f>hi)]*=0.0; return np.fft.irfft(F,len(x))
def whoosh(d,f0=300,f1=3000):
    t=tt(d); n=rng.standard_normal(len(t)); k=t/d; fc=f0*(f1/f0)**np.sin(np.pi*k*0.5)
    # 分段固定截止近似扫频
    out=np.zeros_like(n); seg=int(0.05*SR)
    for i in range(0,len(n),seg):
        out[i:i+seg]=lp_fast(n[max(0,i-seg):i+seg],fc[min(i,len(fc)-1)])[ (i-max(0,i-seg)) : (i-max(0,i-seg))+len(n[i:i+seg]) ]
    return out*np.sin(np.pi*k)**1.5*0.5
def boom(d=2.2,f0=52,f1=36):
    t=tt(d); ph=2*np.pi*np.cumsum(f0+(f1-f0)*t/d)/SR; s=np.sin(ph)*np.exp(-t/0.7)
    nz=lp_fast(rng.standard_normal(len(t)),180)*np.exp(-t/0.12)*0.8
    return (s+nz)*np.minimum(1,t/0.006)
def tick(f=2400,d=0.12):
    t=tt(d); return (np.sin(2*np.pi*f*t)*np.exp(-t/0.025)+bp_fast(rng.standard_normal(len(t)),2000,7000)*np.exp(-t/0.004)*0.6)
def clack():
    t=tt(0.9); s=sum(a*np.sin(2*np.pi*190*m*t)*np.exp(-t/dc) for m,a,dc in [(1,1,0.22),(2.76,0.5,0.12),(5.4,0.3,0.06),(8.9,0.15,0.03)])
    return s*0.6+np.sin(2*np.pi*72*t)*np.exp(-t/0.18)*0.9
def scratch(d):
    t=tt(d); n=bp_fast(rng.standard_normal(len(t)),2500,6500); env=np.minimum(1,t/0.08)*np.minimum(1,(d-t)/0.15)*(0.7+0.3*np.sin(2*np.pi*11*t))
    return n*env*0.35
def shimmer(d,dens=18,notes=('Eb6','F6','G6','Bb6','C7','Eb7','F7'),amp=0.25):
    s=np.zeros(int((d+2.2)*SR))
    for _ in range(int(d*dens)):
        t0=rng.random()*d; b=bell(NOTE[notes[rng.integers(len(notes))]]*(2 if rng.random()<0.3 else 1),1.6)*amp*(0.4+0.6*rng.random()); i=int(t0*SR); s[i:i+len(b)]+=b[:len(s)-i]
    return s
def riser(d):
    t=tt(d); k=t/d; n=rng.standard_normal(len(t)); out=np.zeros_like(n); seg=int(0.05*SR)
    for i in range(0,len(n),seg):
        out[i:i+seg]=lp_fast(n[i:i+seg+1],200*(40**k[i]))[:len(n[i:i+seg])]
    return out*k**2.2*0.7
def glass(d=2.4):
    s=np.zeros(int((d+1)*SR))
    for _ in range(90):
        t0=(rng.random()**2)*d; f=3000+rng.random()*5000; tq=tt(0.35); b=np.sin(2*np.pi*f*tq)*np.exp(-tq/0.06)*(1-t0/d)
        i=int(t0*SR); s[i:i+len(b)]+=b
    nz=bp_fast(rng.standard_normal(int(0.6*SR)),3000,12000)*np.exp(-tt(0.6)/0.1); s[:len(nz)]+=nz*0.8
    return s*0.35
def pan(): return rng.uniform(-0.6,0.6)

eIO=lambda x: 4*x**3 if x<.5 else 1-(-2*x+2)**3/2
# ── 前奏 ──
put(shimmer(1.6,10,amp=0.18),6.59,0)
put(whoosh(2.9,200,1800),8.4,0,0.5)
for i,n in enumerate(['Eb6','F6','G6','Bb6','C7','Eb7','F7']): put(bell(NOTE[n]),13.24+i*0.11,-0.5+i/6,0.16)
put(scratch(1.55),14.22,-0.2,0.5); put(scratch(1.55),16.1,0.1,0.45)
put(bell(NOTE['Bb6'],3.5),17.65,-0.2,0.2); put(bell(NOTE['Eb7'],3.5),17.68,0.2,0.12)
put(boom(),18.95,0,0.5); put(shimmer(1.2,12,amp=0.15),18.95)
# ── 1 星轨 ──
put(whoosh(3.7,150,1200),21.9,0,0.4)
# ── 2 规 ──
for t0,d,n in [(37.19,1.6,'Eb6'),(41.04,1.56,'G6'),(43.4,1.8,'Bb6')]:
    put(scratch(d),t0,0,0.55); put(bell(NOTE[n],3),t0+d,0,0.14)
for j in range(28):
    put(tick(2600+(j%3)*300),45.9+j*0.22,-0.7+1.4*j/27,0.12)
    put(bell(NOTE[['Bb6','C7','Eb7','G6'][j%4]],1.4),46.2+j*0.22,-0.7+1.4*j/27,0.05)
put(scratch(2.1),51.92,0,0.35)
for t0 in (56.69,60.71): put(boom(1.8,60,45),t0,0,0.25); put(bell(NOTE['Eb5'],3),t0,0,0.1)
# ── 3 式盘 ──
put(whoosh(1.0,120,900),67.44,0,0.5); put(clack(),68.44,0,0.55); put(boom(1.5),68.44,0,0.3)
for i in range(28): put(tick(2000),72.4+i*0.03+0.3,-0.6+1.2*i/27,0.05)
for i in range(12): put(tick(1700),73.3+i*0.03+0.3,0,0.06)
for i in range(10): put(tick(1500),73.9+i*0.03+0.3,0,0.06)
put(whoosh(1.0,150,1500),75.03,0,0.45); put(clack(),76.03,0,0.55)
put(scratch(1.54),78.86,0,0.45)
for i in range(7): put(bell(NOTE[['Eb6','F6','G6','Bb6','C7','Eb7','F7'][i]],1.8),78.86+i*0.2,-0.4+i*0.13,0.08)
for s in [83.59,86.4,91.13,93.0,94.4,95.4,96.05]:
    for k in range(4): put(tick(1300+k*80,0.08),s+k*0.06,0,0.18)
    put(clack(),s+0.25,0,0.18)
for s in (86.4,91.13,95.4): put(shimmer(0.8,20,amp=0.14),s,0)
put(riser(2.3),93.8,0,0.5)
put(boom(2.8,48,32),96.8,0,1.0); put(shimmer(1.5,30,amp=0.2),96.8); put(whoosh(1.2,400,6000),96.8,0,0.5)
# ── 4 穿越：风声随速度 ──
def warpV(t):
    s4=96.8; FLY=[103.0,105.6,109.09,111.92,116.63]
    if t<s4: return 0
    sm=lambda x:x*x*(3-2*x); P=lambda t,a,b:min(1,max(0,(t-a)/(b-a)))
    v=1.7*np.exp(-(t-s4)/0.9)+0.6*sm(P(t,s4,97.6))
    for o in FLY:
        if t>o-0.2: v+=0.45*np.exp(-(t-o)/0.7)*P(t,o-0.2,o)
    return v*(1-sm(P(t,117.6,120.8)))
d=121.2-96.8; t=tt(d); env=np.array([warpV(96.8+x) for x in t[::480]]); env=np.interp(t,t[::480],env)
wind=lp_fast(rng.standard_normal(len(t)),900)+0.4*bp_fast(rng.standard_normal(len(t)),1500,5000)
put(wind*env*0.22,96.8,0)
for o,p in [(109.09,-0.5),(111.92,0.5),(116.63,-0.3)]: put(whoosh(1.8,300,4000),o-1.0,p,0.4); put(bell(NOTE['Bb5'],2.5),o,p,0.1)
# ── 5 一年：斗柄到东南西北各响一声 ──
import math
def inv(q):
    lo,hi=0.0,1.0
    for _ in range(40):
        m=(lo+hi)/2
        if eIO(m)<q: lo=m
        else: hi=m
    return 122.0+lo*(146.8-122.0)
put(bell(NOTE['Eb6'],3),122.0,0.5,0.12)
for q,n,p in [(0.25,'G6',0),(0.5,'Bb6',-0.5),(0.75,'C7',0),(0.999,'Eb7',0.5)]: put(bell(NOTE[n],3.2),inv(q),p,0.14)
# ── 6 汇聚 ──
grains=np.sort(np.concatenate([rng.uniform(151.4,153.4,40),rng.uniform(153,155.8,60),rng.uniform(155.3,158.2,80),rng.uniform(157.4,161.4,90),rng.uniform(159.4,162.2,60)]))
for g in grains: put(bell(NOTE[['Eb7','F7','G6','Bb6','C7'][rng.integers(5)]]*(1+(rng.random()<0.3)),0.9),g,pan(),0.03)
put(riser(3.0),159.6,0,0.45)
put(boom(2.6,50,34),162.59,0,0.85); put(shimmer(1.6,26,amp=0.18),162.59)
# ── 7 高潮 ──
for t0,n in [(174.06,'Eb5'),(175.37,'G5'),(177.82,'Bb5'),(180.64,'C6'),(185.33,'Eb6')]: put(scratch(1.4),t0,pan(),0.3); put(bell(NOTE[n],3.5),t0+1.4,0,0.12)
put(shimmer(1.8,16,amp=0.14),177.82)
import json
r2=np.random.default_rng(31)  # 与画面里的流星同一套时间（rng(31) 只用来近似，不追求逐一对应）
for t0 in list(np.linspace(181,205,9)): put(whoosh(0.7,800,5000),t0,pan(),0.12)
put(boom(2.2,52,38),192.85,0,0.6); put(shimmer(2.0,30,amp=0.18),192.85)
put(boom(1.4,60,45),174.06,0,0.3)
# ── 8 碎裂 ──
put(glass(),208.34,0,0.9); put(boom(1.8,56,40),208.34,0,0.4)
# ── 9 归海 ──
put(scratch(1.8),221.6,0,0.35)
for i,n in enumerate(['Eb6','F6','G6','Bb6','C7','Eb7','F7']): put(bell(NOTE[n],2.2),221.6+i*0.26,-0.5+i/6,0.07)
put(whoosh(1.8,200,1500),223.6,0,0.15)
# ── 10 尾声 ──
put(whoosh(5.2,120,900),228.4,0,0.35); put(shimmer(1.9,10,amp=0.14),230.0)
put(bell(NOTE['Eb6'],5),233.35,-0.2,0.16); put(bell(NOTE['Bb6'],5),233.38,0.2,0.1); put(boom(2.5,46,34),233.35,0,0.35)
x=np.stack([L,R],1); pk=np.abs(x).max(); x=x/pk*10**(-6/20)
with wave.open('sfx.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype(np.int16).tobytes())
print('peak',pk)
