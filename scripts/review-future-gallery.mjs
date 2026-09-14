import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/docs/CIDADE-FUTURISTA.html');
 await expect(page.locator('#count')).toHaveText('33 modelos');
 await page.locator('#scope').selectOption('all');await expect(page.locator('#count')).toHaveText('77 modelos');
 await page.locator('#scope').selectOption('buildings');await expect(page.locator('#count')).toHaveText('18 modelos');
 await page.locator('#scope').selectOption('all');await page.locator('#search').fill('tree.oak');
 await expect(page.locator('#count')).toHaveText('1 modelos');
 await page.locator('#angle').selectOption('-rear');
 const picture=page.locator('article:visible img');
 await expect(picture).toHaveAttribute('src',/tree.oak-rear.png$/);
 await page.locator('article:visible button').click();await expect(page.locator('dialog')).toBeVisible();
 await expect.poll(()=>page.locator('dialog img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 await page.locator('#close').click();await page.locator('#angle').selectOption('-low');
 await expect.poll(()=>picture.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 await page.locator('#search').fill('');await page.locator('#scope').selectOption('polished');await page.locator('#angle').selectOption('');
 await page.locator('.slider').fill('35');
 await expect(page.locator('.comparison')).toHaveAttribute('style',/35%/);
 await page.screenshot({path:'docs/screenshots/future/gallery.png'});
 await page.setViewportSize({width:360,height:800});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
 await writeFile('docs/screenshots/future/gallery-check.json',JSON.stringify({models:77,polished:33,buildings:18,angles:['front','rear','low'],responsive:true,errors},null,2));
 console.log('Galeria validada: filtros, imagens, ampliação, comparação e 360 px.');
}finally{await browser.close();}
