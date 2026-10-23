import asyncio,base64,os,sys
from playwright.async_api import async_playwright
FPS=30
async def main():
    mode=sys.argv[1]
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); pg.set_default_timeout(0); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+os.path.abspath('ink2.html'),timeout=0); await pg.wait_for_function('window.__ep')
        await pg.evaluate("""async()=>{await document.fonts.load('900 30px "Noto Sans SC"');await document.fonts.load('400 30px "Noto Serif SC"');await document.fonts.load('600 30px "Noto Serif SC"');}""")
        DUR=await pg.evaluate('window.__ep.DUR')
        if mode=='test': ts=[float(x) for x in sys.argv[2].split(',')]
        else:
            sh,shs=int(sys.argv[2]),int(sys.argv[3]); os.makedirs('iframes',exist_ok=True); upto=float(os.environ.get('UPTO',DUR))
            ts=[f/FPS for f in range(int(upto*FPS)) if f%shs==sh]
        for t in ts:
            d=await pg.evaluate("""t=>{const c=document.getElementById('out'),x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;window.__ep.render(x,t);return c.toDataURL('image/jpeg',0.93).split(',')[1];}""",t)
            open(f'ink_{t:.1f}.jpg' if mode=='test' else f'iframes/f{round(t*FPS):05d}.jpg','wb').write(base64.b64decode(d))
        print('done',len(ts),errs); await b.close()
asyncio.run(main())
