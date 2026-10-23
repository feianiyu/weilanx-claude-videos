"""墨蚁 · 配乐（40 秒）：古筝式拨弦（加法合成）+ 水滴 + 沙沙爬行声 + 低鼓 + 柔和铺底，D 宫五声。
节点与 ink.js 的 T 对齐：0–1.4 满屏爬行声；1.4–4.2 拉远；4–6.8 一笔写出（上行刮奏）；10 拿走最勤快的（低鼓 + 墨散）；
11.2–14.4 补位（水滴逐个落下）；16.6 轮指；18 清走闲的；18.5–22.5 只剩回声里的水滴；23–29 两笔（左声道越来越闷、越来越稀）；
30 回来；31 印章；36 结尾提问；37.6 署名。两遍 loudnorm 到 −14 LUFS。"""
import json, os, subprocess, sys, tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile
SR=44100; DUR=40.0; N=int(SR*DUR); rng=np.random.default_rng(88)
L=np.zeros(N); R=np.zeros(N)
def tt(d): return np.arange(int(d*SR))/SR
def midi(m): return 440*2**((m-69)/12)
def add(x,t0,g=1.0,pan=0.0):
    i=int(t0*SR)
    if i>=N: return
    x=x[:N-i]; L[i:i+len(x)]+=x*g*np.cos((pan+1)*np.pi/4); R[i:i+len(x)]+=x*g*np.sin((pan+1)*np.pi/4)
def lp(x,f): b,a=signal.butter(2,min(0.99,f/(SR/2)),'low'); return signal.lfilter(b,a,x)
def hp(x,f): b,a=signal.butter(2,min(0.99,f/(SR/2)),'high'); return signal.lfilter(b,a,x)
def bp(x,f0,f1): b,a=signal.butter(2,[f0/(SR/2),min(0.99,f1/(SR/2))],'band'); return signal.lfilter(b,a,x)
PENTA=[50,52,54,57,59,62,64,66,69,71,74,76,78,81,83,86]  # D 宫
def zheng(m,d=2.2,v=0.5,bend=0.0,dull=0.0):
    t=tt(d); f=midi(m)*(1+bend*np.exp(-t*12)*0.03)
    ph=2*np.pi*np.cumsum(f)/SR; x=np.zeros(len(t))
    for h in range(1,9):
        x+=np.sin(ph*h+h*0.7)*np.exp(-t*(1.6+h*(1.1+3*dull)))/(h**(1.1+dull))
    pick=bp(rng.standard_normal(len(t)),1500,6000)*np.exp(-t*120)*0.25*(1-dull)
    return (x*0.5+pick)*np.minimum(1,t/0.003)*v
def drop(f=900,v=0.4):
    t=tt(0.18); fr=f*(1+1.2*np.minimum(t,0.03)/0.03); x=np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*38)
    return x*v
def boom(v=1.0,d=2.6):
    t=tt(d); x=np.sin(2*np.pi*np.cumsum(48+70*np.exp(-t*9))/SR)*np.exp(-t*2.4)
    x+=lp(rng.standard_normal(len(t)),300)*np.exp(-t*14)*0.6
    return np.tanh(x*1.3)*v
def whoosh(d=1.4,v=0.35,down=True):
    n=int(d*SR); z=rng.standard_normal(n); out=np.zeros(n); st=2205
    for i0 in range(0,n,st):
        p=i0/n; fc=(6000*(1-p)+300*p) if down else (300*(1-p)+6000*p)
        out[i0:i0+st]=bp(z[i0:i0+st],fc*0.6,fc*1.4)
    env=np.sin(np.pi*np.linspace(0,1,n))**1.5
    return out*env*v
def pad(ms,d,v=0.12,cut=1800):
    t=tt(d); x=sum(np.sin(2*np.pi*midi(m)*t+i)+0.3*np.sin(2*np.pi*midi(m)*2.003*t) for i,m in enumerate(ms))/len(ms)
    env=np.minimum(1,t/1.2)*np.minimum(1,(d-t)/1.5); return lp(x,cut)*env*v
def step(v=0.4,tick=False):
    t=tt(0.12)
    if tick: return bp(rng.standard_normal(len(t)),2500,8000)*np.exp(-t*90)*v
    return (np.sin(2*np.pi*np.cumsum(110+60*np.exp(-t*40))/SR)*np.exp(-t*30)+bp(rng.standard_normal(len(t)),1500,5000)*np.exp(-t*70)*0.4)*v
def stamp(v=0.8):
    t=tt(0.35); x=bp(rng.standard_normal(len(t)),700,3500)*np.exp(-t*60)+np.sin(2*np.pi*150*t)*np.exp(-t*25)*0.8
    return x*v
# 0–4.2：密密麻麻的爬行声（沙沙）
n=int(4.4*SR); z=bp(rng.standard_normal(n),2000,9000); grains=np.zeros(n)
for _ in range(2600):
    c=int(rng.random()*n); w=int(SR*(0.004+rng.random()*0.01)); a=rng.random()
    grains[c:c+w]+=np.hanning(min(w,n-c))*a
env=np.ones(n); tt0=np.arange(n)/SR; env*=np.clip(1-(tt0-1.4)/2.8,0,1)**1.5; env[tt0<1.4]=1
add(z*grains*env*0.5,0.0,1.0,0.0)
add(pad([38,45,50],4.4,0.10,600),0.0)
add(whoosh(2.6,0.18,down=False),1.6,1.0)
# 4–6.8：一笔写出 —— 上行刮奏
for i,m in enumerate(PENTA[2:15]): add(zheng(m,2.0,0.32+0.02*i),4.05+i*0.19,1.0,-0.4+i*0.06)
add(pad([50,57,62,66],6.0,0.11),4.4)
# 7–9.8：蚂蚁走出来集合（细碎的脚步）
for k in range(90): add(step(0.08+0.12*k/90,tick=True),5.8+rng.random()*3.4,1.0,-0.8+rng.random()*1.6)
for k in range(4): add(step(0.22),9.0+k*0.25,1.0,-0.3)   # 列队原地踏步
# 7–9.4：疏朗的旋律
for t0,m in [(7.2,74),(7.75,71),(8.3,69),(8.85,66),(9.2,69)]: add(zheng(m,2.4,0.38,bend=1 if m==69 else 0),t0,1.0,0.2)
add(drop(1200,0.25),8.1,1.0,-0.5)
# 10：拿走最勤快的
add(boom(1.0),10.0); add(zheng(62,3,0.3,bend=2),10.0,1.0)
for k in range(11): add(step(0.5+0.03*k),10.0+k*0.25,1.0,-0.2)   # 最前两排踏步离场
for k in range(6): add(step(0.35),11.0+k*0.25,1.0,0.0)          # 其余各排向前两排
# 11.2–14.4：补位，水滴一颗颗落下
for i in range(16): add(drop(700+i*55,0.28),11.25+i*0.2+rng.random()*0.05,1.0,-0.6+rng.random()*1.2)
add(pad([50,57,62,66,69],5.0,0.11),11.0)
for t0,m in [(14.6,74),(15.2,76),(15.8,78)]: add(zheng(m,2.2,0.36),t0,1.0,0.1)
# 16.6–18：轮指
for i in range(10): add(zheng(69,0.5,0.15+0.02*i),16.6+i*0.13,1.0,0.0)
# 18：清走闲着的
add(boom(0.9),18.0)
for k in range(8): add(step(0.45),18.45+k*0.25,1.0,0.2)        # 最后两排转身离场
# 18.5–22.5：空，只剩回声里的水滴
for i,t0 in enumerate([19.2,20.3,21.4]): add(drop(1500,0.22),t0,1.0,0.3)
add(pad([38,45],4.2,0.08,500),18.6)
# 22.8–28.6：两个方阵入场、原地踏步；左边（全员在岗）的脚步越来越稀
for k in range(int((28.6-22.8)/0.25)):
    t0=22.8+k*0.25; fat=max(0,(t0-24.6)/4)
    if rng.random()>fat: add(step(0.3*(1-0.5*fat)),t0,1.0,-0.8)
    add(step(0.3),t0+0.01,1.0,0.8)
# 23–29：两笔，左声道越来越闷、越来越稀；右边水滴接上
add(zheng(62,2.5,0.4),22.9,1.0,0.0)
seq=[74,71,69,66,69,71,74,76]
for k in range(16):
    t0=23.6+k*0.36; fat=max(0,(t0-25)/4)
    if rng.random()>fat*0.85: add(zheng(seq[k%8],1.8,0.3*(1-0.6*fat),dull=fat),t0,1.0,-0.85)
    add(zheng(seq[(k+3)%8]+12 if k%4==0 else seq[(k+3)%8],1.8,0.28),t0+0.18,1.0,0.85)
for i in range(8): add(drop(900+i*60,0.22),25.6+i*0.42,1.0,0.8)
# 30：回来；31：印章
add(boom(0.8),30.0); add(pad([50,57,62,66,69,74],6.0,0.14,2600),30.0)
add(stamp(0.9),31.0,1.0); add(boom(0.5,1.4),31.0)
for t0,m in [(32.0,74),(32.6,78),(33.2,81),(34.2,78),(34.8,74)]: add(zheng(m,2.4,0.36),t0,1.0,0.15)
# 36–40：结尾提问 + 署名
add(pad([50,57,62,69],4.0,0.12,1500),36.0); add(zheng(62,3.5,0.4,bend=2),36.0,1.0)
for i,m in enumerate([74,78,81,86]): add(zheng(m,2.0,0.25),37.6+i*0.2,1.0,-0.3+0.2*i)
# 回声（三次反馈）
for ch in (L,R):
    src=ch.copy()
    for k,g in [(0.33,0.32),(0.66,0.16),(0.99,0.08)]:
        d=int(k*SR); ch[d:]+=lp(src[:-d],3000)*g
fade=int(1.2*SR)
for ch in (L,R): ch[-fade:]*=np.linspace(1,0,fade)
mix=np.stack([L,R],1); mix=mix/(np.max(np.abs(mix))+1e-9)*0.89
tmp=tempfile.mktemp(suffix='.wav'); wavfile.write(tmp,SR,(mix*32767).astype(np.int16))
m=subprocess.run(['ffmpeg','-hide_banner','-i',tmp,'-af','loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
js=json.loads(m[m.rindex('{'):m.rindex('}')+1])
af=(f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,alimiter=limit=0.84:level=false")
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',tmp,'-af',af,'-ar','44100','-c:a','pcm_s16le','mix_ink.wav'],check=True); os.remove(tmp)
