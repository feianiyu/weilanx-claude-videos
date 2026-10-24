import asyncio,base64,os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); await pg.goto('file://'+os.path.abspath('dragon.html')); await pg.wait_for_function('window.__ep')
        await pg.evaluate("async()=>{await document.fonts.load('400 60px \"QingKe\"');await document.fonts.load('700 30px \"Noto Sans SC\"')}")
        d=await pg.evaluate("""()=>{const c=document.getElementById('out'),x=c.getContext('2d');window.__ep.render(x,33.08);
          x.fillStyle='rgba(6,8,16,0.9)';x.fillRect(0,170,1080,240);
          x.textAlign='center';x.textBaseline='middle';x.font='400 132px "QingKe"';x.fillStyle='#f4ead8';x.shadowColor='rgba(255,190,110,0.5)';x.shadowBlur=30;x.fillText('画了 6000 年的龙',540,250);
          x.font='400 70px "QingKe"';x.shadowBlur=14;x.fillText('为什么没有一个人见过？',540,355);
          return c.toDataURL('image/jpeg',0.92).split(',')[1];}""")
        open('龙_封面_v2.jpg','wb').write(base64.b64decode(d)); await b.close()
asyncio.run(main())
