# 配乐：八音盒 + 钢琴 + 弦乐铺底（F 大调，72 BPM，温柔的吉卜力式）；雨声；音效；配音
import numpy as np, subprocess, json
from scipy import signal
from scipy.io import wavfile
SR=48000; DUR=37.5; N=int(SR*DUR); rng=np.random.default_rng(5)
L=np.zeros(N); R=np.zeros(N)
def tt(d): return np.arange(int(d*SR))/SR
def add(x,t0,g=1.0,pan=0.0):
    i=int(t0*SR); x=x[:max(0,N-i)]; L[i:i+len(x)]+=x*g*np.cos((pan+1)*np.pi/4)*1.414; R[i:i+len(x)]+=x*g*np.sin((pan+1)*np.pi/4)*1.414
def lp(x,f,o=2): b,a=signal.butter(o,min(0.99,f/(SR/2)),'low'); return signal.lfilter(b,a,x)
def hp(x,f): b,a=signal.butter(2,f/(SR/2),'high'); return signal.lfilter(b,a,x)
def m2f(m): return 440*2**((m-69)/12)
def mbox(m,v=0.12,d=2.5):
    t=tt(d); f=m2f(m); return sum(np.sin(2*np.pi*f*k*t)*np.exp(-t*(2.2+k*1.5))*a for k,a in [(1,1),(2.0,0.3),(3.01,0.12),(4.2,0.05)])*np.minimum(1,t/0.003)*v
def piano(m,v=0.2,d=3.0):
    t=tt(d); f=m2f(m); x=sum(np.sin(2*np.pi*f*h*np.sqrt(1+0.0004*h*h)*t+h)*np.exp(-t*(0.9+h*0.5))/h**1.2 for h in range(1,9)); return x*np.minimum(1,t/0.004)*v*0.5
def pad(ms,d,v=0.08,cut=1200,att=1.5,rel=1.5):
    t=tt(d); x=np.zeros(len(t))
    for m in ms:
        for dt in (-0.004,0,0.005): ph=np.cumsum(m2f(m)*(1+dt)*(1+0.002*np.sin(2*np.pi*5*t)))/SR; x+=2*((ph+rng.random())%1)-1
    env=np.clip(np.minimum(t/att,(d-t)/rel),0,1); return lp(x/len(ms)/3,cut)*env*v
def noise(d): return rng.standard_normal(int(d*SR))
F3,A3,C4,F4,G4,A4,Bb4,C5,D5,E5,F5,G5,A5,C6=53,57,60,65,67,69,70,72,74,76,77,79,81,84
Dm=[50,57,62,65]; Bb=[46,53,58,62]; Fm=[41,53,57,60]; C=[48,55,60,64]; Am=[45,52,57,60]
B=60/72
# ── 雨夜（0–14.4）：雨声 + 八音盒，下行的小调 ──
rain=hp(lp(noise(15),6000),700)*0.05; rain*=np.clip(np.minimum(tt(15)/1.0,(15-tt(15))/1.5),0,1); add(rain,0.0)
for i,ch in enumerate([Dm,Bb,Fm,C,Dm,Bb,Am,C]): add(pad(ch,B*4+0.5,0.05,900),i*B*4*0.5+0.2*0) if False else None
for i,ch in enumerate([Dm,Bb,F3 and [41,53,57,60],C,Dm,Bb,[45,52,57,60]]):
    t0=0.2+i*2.0
    if t0<14.4: add(pad(ch,2.6,0.05,900,0.8,1.0),t0)
mel=[A5,F5,D5,F5,E5,C5,A4,C5,D5,A4,F4,A4,G4,E5,C5]
for i,m in enumerate(mel):
    t0=0.5+i*0.95
    if t0<14.2 and not (3.3<t0<3.9) and not (6.3<t0<7.6): add(mbox(m,0.10),t0,1,0.3*np.sin(i))
# ── 脑内（14.4–19.6）：空灵，高音钢琴琶音 ──
for i,m in enumerate([F5,A5,C6,A5,G5,E5,C5,E5,F5,A5]): add(piano(m+12,0.08,3),14.6+i*0.5,1,-0.3+0.06*i)
add(pad([53,60,65,69,72],5.5,0.06,2500,1.5,1.5),14.3)
# ── 键盘（19.6–26.6）：轻快起来，拨弦节奏 ──
for b in range(int(7/(B/2))):
    t0=19.6+b*B/2
    if 22.4<=t0<23.8: continue
    add(piano([F3,C4,A3,C4][b%4]+12,0.12,1.0),t0,1,-0.2)
for t0,m in [(19.9,C5),(20.6,F5),(21.3,A5),(22.0,G5)]: add(mbox(m,0.08),t0,1,0.3)
# ── 天亮（26.6–37.5）：大调，弦乐展开 ──
for i,ch in enumerate([[41,53,57,60,65],[46,53,58,62],[48,55,60,64],[41,53,57,65,69]]): add(pad(ch,3.2,0.08,2600,1.2,1.4),26.6+i*2.7)
for i,m in enumerate([C5,F5,A5,G5,F5,E5,F5,A5,C6,A5,G5,F5]):
    t0=27.0+i*0.75
    if t0<36: add(piano(m,0.16,3),t0,1,0.15)
for t0,m in [(32.1,F5),(32.5,A5),(32.9,C6),(36.8,F5)]: add(mbox(m+12,0.06),t0,1,0)
# 鸟叫（天亮）
for k in range(6):
    t0=28.5+k*1.3+rng.random()*0.4; t=tt(0.18); f=3200+800*np.sin(2*np.pi*18*t); add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*12)*0.05,t0,1,rng.uniform(-0.8,0.8))
# ── 音效 ──
def tone(f0,f1,d,dec=6):
    t=tt(d); ph=2*np.pi*np.cumsum(np.linspace(f0,f1,len(t)))/SR; return np.sin(ph)*np.exp(-t*dec)*np.minimum(1,t/0.003)
def boing(p=1.0,v=0.4): t=tt(0.45); f=(180+90*np.sin(2*np.pi*11*t)*np.exp(-t*6))*p; return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7)*v
def thud(v=0.4): return lp(tone(140,50,0.3,12)+noise(0.3)*np.exp(-tt(0.3)*40)*0.3,600)*v
def click(v=0.3): t=tt(0.05); return hp(noise(0.05),1500)*np.exp(-t*100)*v
def zap(v=0.5): t=tt(0.6); return hp(noise(0.6),2500)*(rng.random(len(t))<0.1)*np.exp(-t*5)*v
def whoosh(d=0.5,v=0.4): t=tt(d); return lp(noise(d),3000)*np.sin(np.pi*t/d)**2*v
add(zap(0.5),3.4); add(tone(500,80,0.5,3)*0.25,3.4); add(boing(1.3,0.4),3.45); add(thud(0.35),3.95)
add(zap(0.7),6.75); add(zap(0.5),6.95); add(tone(700,60,0.8,2.5)*0.3,6.75)
add(tone(1400,1400,0.25,10)*0.2,9.0); add(tone(1870,1870,0.3,8)*0.2,9.12)   # 消息提示
t=tt(1.2); add(np.sin(2*np.pi*np.cumsum(220-120*t/1.2)/SR)*np.exp(-t*1.5)*0.15,9.8)  # 泄气
add(whoosh(0.6,0.5),13.8); add(tone(300,1600,0.6,1)*0.1,13.8)          # 穿进屏幕
add(tone(900,900,1.5,2)*0.08,16.0)
add(whoosh(0.6,0.3),19.4)
hops=[19.9+i*0.46 for i in range(5)]
for i,h in enumerate(hops): add(boing(1.0+0.08*i,0.32),h); add(click(0.4),h+0.42); 
add(tone(220,110,0.6,3)*0.3,22.4); add(boing(0.6,0.3),22.45)            # 报错
t=tt(0.7); add(lp(noise(0.7),2500)*(t/0.7)**2*0.25,23.15)     # 蓄力
add(boing(1.5,0.4),23.85); add(thud(0.5),24.6); add(click(0.6),24.6)
for i,m in enumerate([C5,E5,G5,C6]): add(mbox(m+12,0.12,2),24.62+i*0.08)
add(whoosh(0.5,0.5),26.35)
add(boing(1.2,0.25),29.2); add(thud(0.2),29.7)
add(click(0.5),32.4); add(click(0.5),32.55)
x=np.stack([L,R],1)
# 配音：48k 单声道，略加一点房间感
for i,(t0,_) in enumerate([(0.4,1),(3.6,2),(9.3,3),(15.0,4),(20.0,5),(24.75,6),(27.4,7),(32.3,8)]):
    sr,v=wavfile.read(f'../tts/vo/l{i+1}.wav'); v=v.astype(float)/32768
    rv=np.zeros(len(v)+int(0.3*SR)); rv[:len(v)]+=v
    for dly,g in [(0.03,0.15),(0.07,0.1),(0.13,0.06)]: n=int(dly*SR); rv[n:n+len(v)]+=v*g
    i0=int(t0*SR); n=min(len(rv),N-i0); x[i0:i0+n,0]+=rv[:n]*2.2; x[i0:i0+n,1]+=rv[:n]*2.2
# 配音时音乐让一让
env=np.ones(N)
for t0,d in [(0.4,2.76),(3.6,5.59),(9.3,4.48),(15.0,3.85),(20.0,3.45),(24.75,1.37),(27.4,3.83),(32.3,4.56)]:
    a,b=int(t0*SR),int((t0+d)*SR); env[a:b]=0.55
env=np.convolve(env,np.ones(4800)/4800,'same')
x=np.stack([L*env,R*env],1)+(x-np.stack([L,R],1))
fo=np.clip((DUR-np.arange(N)/SR)/0.6,0,1); x*=fo[:,None]; x/=np.abs(x).max()*1.12
wavfile.write('xh2_pre.wav',SR,(x*32767).astype(np.int16))
j=subprocess.run(['ffmpeg','-i','xh2_pre.wav','-af','loudnorm=I=-14:TP=-1:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
d=json.loads(j[j.rfind('{'):j.rfind('}')+1])
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','xh2_pre.wav','-af',f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true",'-ar','48000','xh2.wav'])
print('ok')
