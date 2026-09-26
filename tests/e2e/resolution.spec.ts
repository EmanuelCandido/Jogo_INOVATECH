import {test,expect} from '@playwright/test';
import {open,overview} from '../helpers';
import {questions} from '../../src/content/questions';
import sharp from 'sharp';

test('recolhe o lixo antes do resultado e preserva a escolha ao recarregar',async({page},info)=>{
 test.setTimeout(120000);
 const s=overview();s.coins=1500;s.problemStates.pollution_01='AVAILABLE';
 const progress=open(s,'pollution_01');progress.settings={...progress.settings,quality:'HIGH',ambientAnimation:false,reducedMotion:false};
 await page.addInitScript(value=>{if(!sessionStorage.getItem('resolution-seeded')){localStorage.setItem('ecoquest.save.v1',value);sessionStorage.setItem('resolution-seeded','true');}},JSON.stringify({version:1,data:progress}));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');
 const choice=page.locator('[data-choice-id="'+questions.waste.alternatives.find(a=>a.effectiveness==='COMPLETE')!.id+'"]');
 await expect(choice).toBeEnabled({timeout:60000});
 // Let the initial framing settle before observing the transformation.
 await page.waitForTimeout(1600);
 await choice.click();
 await expect(page.locator('.resolution-status')).toBeVisible();
 await expect(page.locator('.narrative-stage')).toHaveCount(0);
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data);
 expect((await saved()).problemStates.pollution_01).toBe('SOLVED');
 await page.waitForTimeout(1700);
 const before=await page.locator('canvas').screenshot({path:info.outputPath('recolhimento.png')});
 await page.waitForTimeout(1900);
 await expect(page.locator('.narrative-stage')).toHaveCount(0);
 const during=await page.locator('canvas').screenshot({path:info.outputPath('recuperacao.png')});
 await page.waitForTimeout(800);
 const later=await page.locator('canvas').screenshot();
 // Shadow refreshes must not draw a compact count from the old full instance
 // buffer. This unchanged foreground used to blink out during collection.
 const {width=1,height=1}=await sharp(before).metadata(),mobile=page.viewportSize()!.width<1000;
 const region={left:Math.round(width*(mobile ? .03 : .10)),top:Math.round(height*(mobile ? .285 : .10)),width:Math.round(width*(mobile ? .30 : .20)),height:Math.round(height*(mobile ? .08 : .12))};
 const patch=async(bytes:Uint8Array)=>sharp(bytes).extract(region).resize(100,70).removeAlpha().raw().toBuffer();
 const patches=await Promise.all([before,during,later].map(patch));
 for(const current of patches.slice(1)){
  let missing=0;for(let i=0;i<current.length;i+=3)if(Math.max(...[0,1,2].map(c=>Math.abs(current[i+c]-patches[0][i+c])))>32)missing++;
  expect(missing/(current.length/3),'vegetação estável entre atualizações de sombra').toBeLessThan(.055);
 }
 const pixels=async(b:Uint8Array)=>sharp(b).resize(240,240,{fit:'fill'}).removeAlpha().raw().toBuffer();
 const a=await pixels(before),b=await pixels(during);
 let changed=0;for(let i=0;i<a.length;i+=3)if(Math.max(...[0,1,2].map(c=>Math.abs(a[i+c]-b[i+c])))>18)changed++;
 expect(changed/(a.length/3)).toBeGreaterThan(.003);
 await expect(page.getByRole('region',{name:'Resultado da decisão'})).toBeVisible({timeout:20000});
 await expect(page.locator('.resolution-status')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('resultado.png')});
 const applied=await saved();expect(applied.decisions).toHaveLength(1);
 await page.reload();
 await expect(page.getByRole('region',{name:'Resultado da decisão'})).toBeVisible({timeout:60000});
 await expect(page.locator('.resolution-status')).toHaveCount(0);
 expect((await saved()).coins).toBe(applied.coins);expect((await saved()).decisions).toHaveLength(1);
 expect(errors).toEqual([]);
});

test('permite pular a transformação e voltar sem desfazer a decisão',async({page})=>{
 test.setTimeout(90000);
 const s=overview();s.coins=1500;
 const progress=open(s);progress.settings={...progress.settings,quality:'LOW',reducedMotion:false};
 await page.addInitScript(value=>localStorage.setItem('ecoquest.save.v1',value),JSON.stringify({version:1,data:progress}));
 await page.goto('./');const choice=page.locator('.alternative').first();await expect(choice).toBeEnabled({timeout:60000});
 await choice.click();await expect(page.locator('.narrative-stage')).toHaveCount(0);
 await page.getByRole('button',{name:'Ver resultado',exact:true}).click();
 await expect(page.getByRole('region',{name:'Resultado da decisão'})).toBeVisible();
 await page.getByRole('button',{name:'Voltar ao mapa',exact:true}).click();
 await expect(page.getByRole('button',{name:'Loja',exact:true})).toBeVisible({timeout:10000});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data);
 expect(saved.problemStates.accessibility_01).toBe('SOLVED');expect(saved.decisions).toHaveLength(1);
});
