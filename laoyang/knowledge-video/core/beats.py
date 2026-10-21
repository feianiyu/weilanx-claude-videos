import sys,subprocess,numpy as np,json
f=sys.argv[1]; sr=22050
raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True).stdout
x=np.frombuffer(raw,np.float32)
hop=512;n=2048
fr=np.lib.stride_tricks.sliding_window_view(x,n)[::hop]*np.hanning(n)
S=np.abs(np.fft.rfft(fr,axis=1))
S=np.log1p(10*S)
flux=np.maximum(0,np.diff(S,axis=0)).sum(1); flux=np.r_[0,flux]
flux=(flux-np.convolve(flux,np.ones(16)/16,'same')).clip(0)
fps=sr/hop
# tempo via autocorr 60-180bpm
ac=np.correlate(flux,flux,'full')[len(flux)-1:]
lags=np.arange(len(ac)); bpm=60*fps/np.maximum(lags,1)
m=(bpm>60)&(bpm<180)
w=ac*np.exp(-0.5*(np.log2(bpm/110)/1.0)**2)
L=lags[m][np.argmax(w[m])]; tempo=60*fps/L
# phase
best=None
for ph in range(int(L)):
    idx=np.arange(ph,len(flux),L).astype(int); s=flux[idx].sum()
    if best is None or s>best[0]: best=(s,ph)
period=60/tempo; t0=best[1]/fps
beats=np.arange(t0,len(x)/sr,period)
# downbeat: which of 4 phases has more flux
bi=(beats*fps).astype(int); bi=bi[bi<len(flux)]
acc=[flux[bi[k::4]].mean() for k in range(4)]; db=int(np.argmax(acc))
rms=np.sqrt(np.convolve(x**2,np.ones(sr)/sr,'same'))[::sr]
print(f"{f}\n tempo {tempo:.1f} bpm period {period:.3f}s first beat {t0:.3f} downbeat phase {db} acc {np.round(acc,2)}")
print(' rms per s:',' '.join(f"{20*np.log10(r+1e-6):.0f}" for r in rms))
json.dump({'tempo':tempo,'period':period,'beats':beats.tolist(),'downbeat_phase':db,'rms_db':[float(20*np.log10(r+1e-6)) for r in rms]},open(sys.argv[2] if len(sys.argv)>2 else '/tmp/beats.json','w'))
