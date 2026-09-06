import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('docs/screenshots',{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});
try{
 const page=await browser.newPage({viewport:{width:1672,height:941}}),errors=[];
 // This review hides the HTML interface and uses only local 3D assets. Keep its
 // captures reproducible offline without depending on the optional web font.
 await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 await page.getByRole('button',{name:'Vamos conhecer a cidade'}).click();
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.addStyleTag({content:'.interface,.region-label,.marker {visibility:hidden!important} canvas{outline:none!important}'});
 const length=Math.hypot(110,145),elevation=130/Math.hypot(length,130);
 for(const view of [{name:'landscape-yards',x:13,z:31,steps:4},{name:'landscape-commons',x:-7.5,z:-36,steps:4},{name:'landscape-park',x:10,z:2,steps:3}]){
  await page.locator('canvas').focus();await page.keyboard.press('Home');
  await expect(page.getByLabel('Zoom do mapa')).toHaveText('100%');
  const dx=view.x-13.7,dz=view.z+9.1;
  const px=(dx*145/length-dz*110/length)*18.2,py=(dx*110/length+dz*145/length)*elevation*18.2;
  await page.mouse.move(836,470.5);await page.mouse.down();await page.mouse.move(836-px,470.5-py,{steps:5});await page.mouse.up();
  for(let i=0;i<view.steps;i++)await page.keyboard.press('+');
  await expect(page.getByLabel('Zoom do mapa')).toHaveText(`${Math.round(1.25**view.steps*100)}%`);
  await page.screenshot({path:`docs/screenshots/${view.name}.png`});
 }
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('Quintais, jardins do norte e parque: capturas com zoom, sem erros de console.');
}finally{await browser.close();}
