import asyncio,base64,os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); pg.set_default_timeout(0)
        await pg.goto('file://'+os.path.abspath('ink2.html'),timeout=0); await pg.wait_for_function('window.__ep')
        await pg.evaluate("""async()=>{await document.fonts.load('900 30px "Noto Sans SC"');await document.fonts.load('400 30px "Noto Serif SC"');await document.fonts.load('600 30px "Noto Serif SC"');}""")
        d=await pg.evaluate("""()=>{const c=document.getElementById('out'),x=c.getContext('2d');window.__ep.render(x,9.85);
          strip(x,840,330,170,920,1); strip(x,840,330,170,920,1); strip(x,840,330,170,920,1); vtext(x,'为什么不开除它们？',925,420,84,'#1e1a15',1);
          strip(x,90,1560,560,170,1); note(x,['蚁窝里，四成工蚁几乎一直闲着。','前六排干活，后四排闲着。'],120,1610,'#3d362e',1,30);
          return c.toDataURL('image/png').split(',')[1];}""")
        open('cover_墨蚁后备军.png','wb').write(base64.b64decode(d)); await b.close()
asyncio.run(main())
