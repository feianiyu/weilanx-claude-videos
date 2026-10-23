import asyncio,base64,os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); pg.set_default_timeout(0)
        await pg.goto('file://'+os.path.abspath('bloom.html'),timeout=0); await pg.wait_for_function('window.__ep')
        await pg.evaluate("""async()=>{await document.fonts.load('900 30px "Noto Sans SC"');await document.fonts.load('400 30px "Noto Serif SC"');}""")
        d=await pg.evaluate("""()=>{const c=document.getElementById('out'),x=c.getContext('2d');window.__ep.render(x,27.6);
          const g=x.createLinearGradient(0,240,0,560); g.addColorStop(0,'rgba(5,4,6,0.85)'); g.addColorStop(1,'rgba(5,4,6,0)'); x.fillStyle=g; x.fillRect(0,240,1080,320);
          x.save(); x.fillStyle='#efe4da'; x.font='400 66px "Noto Serif SC"'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('看起来最像枯萎的季节',540,330); x.font='400 40px "Noto Serif SC"'; x.fillStyle='rgba(239,228,218,0.8)'; x.fillText('它一刻也没有停止生长',540,420); x.restore();
          return c.toDataURL('image/png').split(',')[1];}""")
        open('cover_枯寂与繁花.png','wb').write(base64.b64decode(d)); await b.close()
asyncio.run(main())
