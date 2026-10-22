import asyncio,sys,base64,os
from playwright.async_api import async_playwright
FPS=30
async def main():
    mode=sys.argv[1]
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); pg.set_default_timeout(0)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+os.path.abspath('index.html'),timeout=0)
        await pg.wait_for_function('window.__ep',timeout=120000)
        await pg.evaluate("""async()=>{await Promise.all([document.fonts.load('900 40px "Noto Sans SC"'),document.fonts.load('700 28px "Noto Sans SC"'),document.fonts.load('500 28px "Noto Sans SC"')]);}""")
        DUR=await pg.evaluate('window.__ep.DUR')
        if mode=='audio':
            open('bgm_raw.pcm','wb').write(base64.b64decode(await pg.evaluate('d=>window.__ep.offlineAudio(d)',DUR+1))); print('audio',errs); return
        if mode=='test': ts=[float(x) for x in sys.argv[2].split(',')]
        elif mode=='range': ts=[f/FPS for f in range(int(sys.argv[2]),int(sys.argv[3]))]
        else:
            sh,shs=int(sys.argv[2]),int(sys.argv[3]); os.makedirs('frames',exist_ok=True)
            ts=[f/FPS for f in range(int(DUR*FPS)) if f%shs==sh]
        for t in ts:
            d=await pg.evaluate("""t=>{const c=document.getElementById('out'),x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);window.__ep.render(x,t);return c.toDataURL('image/jpeg',0.93).split(',')[1];}""",t)
            open(f'test_{t:.1f}.jpg' if mode=='test' else f'frames/f{round(t*FPS):05d}.jpg','wb').write(base64.b64decode(d))
        print('done',len(ts),errs); await b.close()
asyncio.run(main())
