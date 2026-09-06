import {overview} from '../helpers';
import {test,expect} from '@playwright/test';
import {initialProgress} from '../../src/game/save';
import {NarrativeManager} from '../../src/game/NarrativeManager';

test('troca qualidade em tempo real, preserva partida e restaura preferências',async({page},testInfo)=>{
 test.setTimeout(240000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader|context lost/i.test(m.text()))errors.push(m.text());});
 const progress=overview();
 // Current narrative content with missing optional graphics preferences uses defaults.
 const saved={...progress,settings:{quality:'LOW',reducedMotion:true}};
 await page.addInitScript(value=>{if(!localStorage.getItem('ecoquest.save.v1'))localStorage.setItem('ecoquest.save.v1',value);},JSON.stringify({version:1,data:saved}));
 await page.goto('/');
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 const canvas=page.locator('canvas');
 await expect(canvas).toHaveAttribute('data-graphics-tier','LOW');
 await canvas.evaluate(c=>c.setAttribute('data-original-canvas','true'));
 await page.getByRole('button',{name:'Configurações',exact:true}).click();
 const quality=page.getByLabel('Qualidade gráfica');
 await expect(page.getByLabel('Escala de resolução')).toHaveValue('100');
 for(const tier of ['MINIMUM','MEDIUM','HIGH','ULTRA','LOW']){
  await quality.selectOption(tier);
  await expect(canvas).toHaveAttribute('data-graphics-tier',tier,{timeout:30000});
  await expect(canvas).toHaveAttribute('data-original-canvas','true');
  await expect(page.getByRole('region',{name:'Configurações'})).toBeVisible();
 }
 // LOW uses one rendered pixel per CSS pixel at 100%; wait for the drawing
 // buffer as well as the label before measuring (Canvas commits asynchronously).
 await expect.poll(()=>canvas.evaluate(c=>Math.abs((c as HTMLCanvasElement).width-c.clientWidth)),{timeout:30000}).toBeLessThanOrEqual(1);
 const before=await canvas.evaluate(c=>(c as HTMLCanvasElement).width);
 const range=page.getByLabel('Escala de resolução');
 await range.focus();await page.keyboard.press('Home');
 await expect(range).toHaveValue('60');
 await expect.poll(()=>canvas.evaluate(c=>(c as HTMLCanvasElement).width),{timeout:30000}).toBeLessThan(before*.7);
 await page.getByRole('combobox',{name:'Sombras',exact:true}).selectOption('DETAILED');
 await expect(canvas).toHaveAttribute('data-graphics-shadows','2048');
 await page.getByRole('combobox',{name:'Sombras',exact:true}).selectOption('OFF');
 await expect(canvas).toHaveAttribute('data-graphics-shadows','0');
 await page.getByLabel('Animar água e ambiente').uncheck();
 await page.getByLabel('Mostrar desempenho').check();
 await expect(page.getByLabel('Desempenho gráfico')).toBeVisible();
 // Other preferences must not reset the drawing buffer to native resolution.
 await expect.poll(()=>canvas.evaluate(c=>(c as HTMLCanvasElement).width),{timeout:30000}).toBeLessThan(before*.7);
 await page.screenshot({path:`docs/screenshots/graphics-settings-${testInfo.project.name}.png`});
 await page.getByRole('button',{name:'Voltar ao jogo'}).click();
 await page.getByRole('button',{name:'Aproximar mapa'}).click();
 await expect(page.getByLabel('Zoom do mapa')).toHaveText('125%');
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data);
 expect(persisted.coins).toBe(saved.coins);expect(persisted.decisions).toEqual(saved.decisions);expect(persisted.problemStates).toEqual(saved.problemStates);
 expect(persisted.settings).toMatchObject({quality:'LOW',renderScale:60,shadows:'OFF',ambientAnimation:false,showPerformance:true});
 await page.reload();
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.getByRole('button',{name:'Configurações',exact:true}).click();
 await expect(quality).toHaveValue('LOW');await expect(range).toHaveValue('60');
 await expect(page.getByRole('combobox',{name:'Sombras',exact:true})).toHaveValue('OFF');
 await expect(page.getByLabel('Animar água e ambiente')).not.toBeChecked();
 // SwiftShader can occupy the browser while uploading models after reload;
 // allow the same preparation budget as tier changes, then check real pixels.
 await expect.poll(()=>canvas.evaluate(c=>(c as HTMLCanvasElement).width),{timeout:30000}).toBeLessThan(before*.7);
 await quality.selectOption('AUTO');
 await expect(canvas).toHaveAttribute('data-graphics-tier','MINIMUM',{timeout:30000});
 await expect.poll(()=>page.getByRole('button',{name:'Reavaliar dispositivo'}).isEnabled(),{timeout:60000}).toBe(true);
 await expect(page.getByLabel('Desempenho gráfico')).toContainText(/\d+ FPS medidos/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
