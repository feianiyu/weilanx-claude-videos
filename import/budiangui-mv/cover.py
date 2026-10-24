import asyncio,base64,os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); await pg.goto('file://'+os.path.abspath('mv.html')); await pg.wait_for_function('window.__ep')
        await pg.evaluate("async()=>{await document.fonts.load('400 60px \"QingKe\"')}")
        d=await pg.evaluate("""()=>{const c=document.getElementById('out'),x=c.getContext('2d');window.__ep.render(x,193.2);
          x.fillStyle='rgba(2,4,10,0.35)';x.fillRect(0,0,1080,1920);
          x.font='400 230px "QingKe"';x.textAlign='center';x.fillStyle='#f4ead8';x.shadowColor='rgba(255,200,120,0.5)';x.shadowBlur=40;x.fillText('步天规',540,1660);
          x.shadowBlur=0;x.strokeStyle='rgba(255,214,150,0.9)';x.lineWidth=3;x.beginPath();x.moveTo(140,1720);x.lineTo(940,1720);x.stroke();
          return c.toDataURL('image/jpeg',0.92).split(',')[1];}""")
        open('步天规_封面.jpg','wb').write(base64.b64decode(d)); await b.close()
asyncio.run(main())
