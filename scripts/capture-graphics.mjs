import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('docs/screenshots',{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});
try{
 const page=await browser.newPage({viewport:{width:1672,height:941}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 await page.getByRole('button',{name:'Vamos conhecer a cidade'}).click();
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 for(const tier of ['MINIMUM','ULTRA']){
  await page.getByRole('button',{name:'Configurações',exact:true}).click();
  await page.getByLabel('Qualidade gráfica').selectOption(tier);
  await page.getByLabel('Animar água e ambiente').uncheck();
  await expect(page.locator('canvas')).toHaveAttribute('data-graphics-tier',tier);
  await page.screenshot({path:`docs/screenshots/graphics-menu-${tier.toLowerCase()}.png`});
  await page.getByRole('button',{name:'Voltar ao jogo'}).click();
  // Capture after a user navigation command forces an updated scene draw.
  await page.getByRole('button',{name:'Centralizar mapa'}).click();
  const style=await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}canvas{outline:none!important}'});
  await page.screenshot({path:`docs/screenshots/graphics-${tier.toLowerCase()}.png`});
  if(tier==='ULTRA'){
   await page.locator('canvas').focus();
   for(let i=0;i<3;i++)await page.keyboard.press('+');
   await expect(page.getByLabel('Zoom do mapa')).toHaveText('195%');
   await page.screenshot({path:'docs/screenshots/graphics-ultra-detail.png'});
  }
  await style.evaluate(el=>el.remove());
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Muito baixa e Ultra: captura e troca de qualidade sem erros de WebGL.');
}finally{await browser.close();}
