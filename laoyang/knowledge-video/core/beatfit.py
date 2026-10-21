"""精确测拍：在 beats.py 粗测周期附近做分数周期 + 相位网格搜索（onset flux 插值求和），只用前 N 秒。"""
import sys,subprocess,numpy as np,json
f=sys.argv[1]; N=float(sys.argv[2]) if len(sys.argv)>2 else 90; sr=22050
x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-t',str(N),'-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True).stdout,np.float32)
hop=128;n=1024
fr=np.lib.stride_tricks.sliding_window_view(x,n)[::hop]*np.hanning(n)
S=np.log1p(10*np.abs(np.fft.rfft(fr,axis=1)))
fl=np.r_[0,np.maximum(0,np.diff(S,axis=0)).sum(1)]; fl=(fl-np.convolve(fl,np.ones(64)/64,'same')).clip(0)
fps=sr/hop; T=len(fl)/fps
best=(0,0,0)
for bpm in np.arange(float(sys.argv[3])-3,float(sys.argv[3])+3,0.01):
    p=60/bpm
    for ph in np.arange(0,p,0.005):
        ts=np.arange(ph,T-0.05,p); s=np.interp(ts*fps,np.arange(len(fl)),fl).sum()/len(ts)
        if s>best[0]: best=(s,bpm,ph)
s,bpm,ph=best; p=60/bpm
ts=np.arange(ph,T,p); bi=(ts*fps).astype(int); acc=[fl[bi[k::4]].mean() for k in range(4)]
print(json.dumps({"bpm":round(bpm,3),"period":round(p,5),"t0":round(ph,4),"downbeat":int(np.argmax(acc)),"acc":[round(a,2) for a in acc]}))
