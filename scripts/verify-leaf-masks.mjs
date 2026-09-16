import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const out='docs/performance/leaf-empty-mask-intel';await mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),viewport:{width:1920,height:1080},presentationVerified:false,comparisons:[],samples:[],errors:[]};
const save=()=>writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu','--use-angle=d3d11']});
const page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1});page.setDefaultTimeout(180000);
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader|context lost/i.test(m.text()))report.errors.push(m.text());});
const settle=async()=>{await page.evaluate(()=>window.ecoBenchmark.start(false,false));await page.waitForTimeout(1600);await page.evaluate(()=>window.ecoBenchmark.stop());};
const toggle=async enabled=>{const r=await page.evaluate(enabled=>window.ecoBenchmark.leafEmptyMasks(enabled),enabled);if(enabled)expect(r.materials).toBeGreaterThan(0);await settle();};
const h=Math.hypot(110,145),views=[['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['industry',79,54,22,3],['beach',53,-43,23,0],['river',-30,13,21,0],['forest-close',-62,52,40,3],['centre-close',10,28,40,1]];
const view=async([,u,v,zoom,y])=>{await page.evaluate(p=>{window.ecoBenchmark.camera(...p);window.ecoBenchmark.freeze();},[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);};
try{
 await page.goto('http://127.0.0.1:4186/?benchmark=1');await page.waitForFunction(()=>!!window.ecoBenchmark?.leafEmptyMasks);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();await page.waitForFunction(()=>window.ecoBenchmark.ready());
 report.renderer=await page.evaluate(()=>window.ecoBenchmark.renderer);expect(report.renderer).toMatch(/Intel.*UHD/);
 await page.evaluate(()=>window.ecoBenchmark.warmupWhole());await settle();
 report.baseline=await page.evaluate(()=>window.ecoBenchmark.snapshot());expect(report.baseline.instances).toBe(34005);expect(report.baseline.modelUrls).toHaveLength(77);
 await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));
 for(const camera of views){
  await view(camera);let original;
  for(const mode of ['original','candidate','shadow-refresh','restored']){
   await toggle(mode==='candidate'||mode==='shadow-refresh');
   if(mode==='shadow-refresh'){await page.evaluate(()=>window.ecoBenchmark.refreshShadows());await settle();}
   const raw=await sharp(await page.screenshot({path:`${out}/${camera[0]}-${mode}.png`,animations:'disabled'})).ensureAlpha().raw().toBuffer();
   if(mode==='original'){original=raw;continue;}
   let changedPixels=0,max=0;for(let i=0;i<raw.length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(raw[i+c]-original[i+c]);changed ||= d!==0;max=Math.max(max,d);}if(changed)changedPixels++;}
   report.comparisons.push({view:camera[0],mode,changedPixels,max});await save();console.log(JSON.stringify(report.comparisons.at(-1)));
  }
 }
 if(report.comparisons.some(c=>c.changedPixels!==0))throw new Error('Visual equivalence failed; candidate stays disabled');
 await page.evaluate(()=>window.ecoBenchmark.settings(window.ecoBenchmark.maximumSettings));
 for(const camera of [views[0],views[2]]){
  // Four pairs, reversed order each time. No GPU queries in FPS samples.
  for(let run=0;run<4;run++)for(const enabled of run%2?[true,false]:[false,true]){
   await view(camera);await toggle(enabled);await page.locator('canvas').focus();
   await page.evaluate(()=>window.ecoBenchmark.start(true,false));await page.keyboard.down('ArrowRight');await page.waitForTimeout(3000);
   await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(3000);await page.keyboard.up('ArrowLeft');
   const result=await page.evaluate(()=>window.ecoBenchmark.stop());expect(result.maximumGuard).toEqual({valid:true,violations:[]});expect(result.gpu).toBeNull();
   expect(result.instances).toBe(34005);expect(result.modelUrls).toEqual(report.baseline.modelUrls);expect([result.width,result.height]).toEqual([2880,1620]);
   report.samples.push({view:camera[0],run,enabled,...result});await save();console.log(JSON.stringify({view:camera[0],run,enabled,fps:result.frame?.meanFps,p95:result.frame?.p95}));
  }
 }
 report.finished=new Date().toISOString();report.bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(v=>/\/assets\/.*\.js$/.test(v)));expect(report.errors).toEqual([]);await save();
}catch(error){report.failure=String(error);await save();throw error;}
finally{await browser.close();}
