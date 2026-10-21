import asyncio,sys,base64,os
from playwright.async_api import async_playwright
FPS=30
NAME=os.environ.get('CLIP','C'); DUR={'A':14.0,'B':17.5,'C':20.5}[NAME]; FN={'A':'(x,t)=>window.__sihua.renderA(x,t,1)','B':'(x,t)=>window.__sihua.renderB(x,t,1)','C':'(x,t)=>window.__sihua.renderC(x,t)'}[NAME]
async def main():
    mode=sys.argv[1]
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page()
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+os.path.abspath('render.html'))
        await pg.evaluate("""async()=>{await Promise.all([document.fonts.load('600 25px "Noto Serif SC"'),document.fonts.load('900 17px "Noto Sans SC"'),document.fonts.load('400 13px "Noto Serif SC"'),document.fonts.load('600 21px "Noto Serif SC"')]);}""")
        await pg.wait_for_timeout(500)
        if mode=='audio':
            b64=await pg.evaluate("d=>window.__sihua.offline('"+NAME+"',d)",DUR+1.5)
            open('bgm_raw_'+NAME+'.pcm','wb').write(base64.b64decode(b64)); print('audio ok',errs); return
        if mode=='test':
            ts=[float(x) for x in sys.argv[2].split(',')]
        else:
            sh,shs=int(sys.argv[2]),int(sys.argv[3]); os.makedirs('frames_'+NAME,exist_ok=True)
            ts=[f/FPS for f in range(int(DUR*FPS)) if f%shs==sh]
        for t in ts:
            d=await pg.evaluate("""t=>{const c=document.getElementById('out'),x=c.getContext('2d');x.setTransform(2,0,0,2,0,0);("""+FN+""")(x,t);return c.toDataURL('image/jpeg',0.93).split(',')[1];}""",t)
            name=f'test_'+NAME+f'_{t:.1f}.jpg' if mode=='test' else f'frames_'+NAME+f'/f{round(t*FPS):05d}.jpg'
            open(name,'wb').write(base64.b64decode(d))
        print('done',len(ts),errs)
        await b.close()
asyncio.run(main())
