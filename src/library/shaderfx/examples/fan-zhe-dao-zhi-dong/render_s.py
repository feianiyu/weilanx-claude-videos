import asyncio,sys,base64,os
from playwright.async_api import async_playwright
FPS=30
async def main():
    mode=sys.argv[1]
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']); pg=await b.new_page(); pg.set_default_timeout(0)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('http://localhost:8766/src/library/shaderfx/examples/fan-zhe-dao-zhi-dong/sample.html',timeout=0)
        await pg.wait_for_function('window.__ep',timeout=120000)
        await pg.evaluate("""async()=>{await Promise.all([document.fonts.load('900 40px "Noto Sans SC"'),document.fonts.load('500 28px "Noto Sans SC"')]);}""")
        DUR=await pg.evaluate('window.__ep.DUR')
        if mode=='test': ts=[float(x) for x in sys.argv[2].split(',')]
        elif mode=='range': ts=[f/FPS for f in range(int(sys.argv[2]),int(sys.argv[3]))]
        elif mode=='list': os.makedirs('sframes',exist_ok=True); ts=[int(x)/FPS for x in open(sys.argv[2]).read().split(',')]
        else:
            sh,shs=int(sys.argv[2]),int(sys.argv[3]); os.makedirs('sframes',exist_ok=True)
            ts=[f/FPS for f in range(int(DUR*FPS)) if f%shs==sh]
        for t in ts:
            d=await pg.evaluate("""t=>{const c=document.getElementById('out'),x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);window.__ep.render(x,t);return c.toDataURL('image/jpeg',0.93).split(',')[1];}""",t)
            open(f'stest_{t:.2f}.jpg' if mode in ('test','range') and False else f'stest_{t:.2f}.jpg' if mode=='test' else f'sframes/f{round(t*FPS):05d}.jpg','wb').write(base64.b64decode(d))
        print('done',len(ts),errs[:5]); await b.close()
asyncio.run(main())
