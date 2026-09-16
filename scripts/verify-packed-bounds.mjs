import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';

const stage=process.argv[2];if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe um nome válido');
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});page.setDefaultTimeout(180000);
const errors=[],samples=[],comparisons=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const settle=async()=>{await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(1500);await page.evaluate(()=>window.ecoBenchmark.stop());};
const toggle=async enabled=>{
 const result=await page.evaluate(enabled=>window.ecoBenchmark.referenceBounds(enabled),enabled);
 if(enabled)expect(result.spheres).toBe(34005);await settle();
};
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4175'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark?.referenceBounds);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();await page.waitForFunction(()=>window.ecoBenchmark.ready());await settle();
 const baseline=await page.evaluate(()=>{window.ecoBenchmark.start(true);return window.ecoBenchmark.stop();});expect(baseline.maximumGuard.valid).toBe(true);
 // Interleave and reverse CPU-only controls after JIT warmup. Rendering is not
 // part of this profile; the separate exploration script measures navigation.
 for(const reference of [true,false]){await toggle(reference);await page.evaluate(()=>window.ecoBenchmark.profileVisibility(false));}
 for(let run=0;run<6;run++)for(const reference of run%2?[false,true]:[true,false]){
  await toggle(reference);const result=await page.evaluate(()=>window.ecoBenchmark.profileVisibility(false));
  samples.push({run,reference,...result});console.log(JSON.stringify(samples.at(-1)));
 }
 expect(new Set(samples.map(s=>s.countChecksum)).size).toBe(1);
 await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));await settle();
 await page.getByRole('button',{name:'Centralizar mapa'}).click();await settle();
 const h=Math.hypot(110,145);
 for(const [name,u,v,zoom,y]of [['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['industry',79,54,22,3],['beach',53,-43,23,0],['river',-30,13,21,0],['forest-close',-62,52,40,3],['centre-close',10,28,40,1]]){
  await page.evaluate(p=>{window.ecoBenchmark.camera(...p);window.ecoBenchmark.freeze();},[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);
  let original;
  for(const mode of ['reference','packed','shadow-refresh','control']){
   await toggle(mode==='reference'||mode==='control');
   if(mode==='shadow-refresh'){await page.evaluate(()=>window.ecoBenchmark.refreshShadows());await settle();}
   const png=await page.screenshot({path:`${out}/${name}-${mode}.png`,animations:'disabled'}),raw=await sharp(png).ensureAlpha().raw().toBuffer();
   if(mode==='reference'){original=raw;continue;}
   expect(raw.length).toBe(original.length);let changedPixels=0,max=0;
   for(let i=0;i<raw.length;i+=4){let changed=false;for(let c=0;c<4;c++){const delta=Math.abs(raw[i+c]-original[i+c]);max=Math.max(max,delta);changed ||= delta!==0;}if(changed)changedPixels++;}
   comparisons.push({name,mode,changedPixels,max});console.log(JSON.stringify(comparisons.at(-1)));
  }
 }
 await toggle(false);
 const after=await page.evaluate(()=>window.ecoBenchmark.snapshot());expect(after.modelUrls).toEqual(baseline.modelUrls);expect(after.instances).toBe(baseline.instances);expect([after.width,after.height]).toEqual([baseline.width,baseline.height]);
 const bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 await writeFile(`${out}/results.json`,JSON.stringify({date:new Date().toISOString(),renderer:await page.evaluate(()=>window.ecoBenchmark.renderer),baseline,after,samples,comparisons,bundles,errors},null,2));
 expect(errors).toEqual([]);for(const result of comparisons)expect(result.changedPixels,`${result.name}: ${result.mode}`).toBe(0);
}finally{await browser.close();}
