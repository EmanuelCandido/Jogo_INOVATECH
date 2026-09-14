import { chromium } from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const rear=process.argv.includes('--rear'),future=process.argv.includes('--future');
const low=process.argv.includes('--low'),suffix=low?'-low':rear?'-rear':'';
const out=future?'docs/screenshots/future/models':'docs/screenshots/finish/models';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});
try {
  const requestedGroups=process.argv.slice(2).filter(arg=>!arg.startsWith('--'));
  for(const group of requestedGroups.length?requestedGroups:['buildings','props']){
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    page.on('pageerror',e=>console.error(e));
    await page.goto(`http://127.0.0.1:5173/scripts/model-review.html?group=${group}${rear?'&view=rear':''}${low?'&quality=low':''}`);
    await page.locator('body[data-ready=true]').waitFor({timeout:120000});
    await page.screenshot({path:`${future?'docs/screenshots/future':'docs/screenshots'}/models-${group}${suffix}.png`,fullPage:true});
    const images=await page.locator('figure').evaluateAll(figures=>figures.map(f=>({id:f.dataset.asset,data:f.querySelector('img').src.split(',')[1]})));
    for(const img of images)await writeFile(`${out}/${img.id}${suffix}.png`,Buffer.from(img.data,'base64'));
    console.log(group,await page.locator('figure').count());await page.close();
  }
}finally{await browser.close();}
