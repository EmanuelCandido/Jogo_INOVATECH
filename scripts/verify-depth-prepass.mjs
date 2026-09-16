import {chromium,expect} from '@playwright/test';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';

const mobile=process.argv.includes('--mobile'),stage=process.argv[2];
const spatial=process.argv.includes('--spatial');
const depthOrder=process.argv.includes('--depth-order');
const frontFaces=process.argv.includes('--front-faces');
const isolatedModels=process.argv.includes('--isolated-models');
const leafCells=process.argv.includes('--leaf-cells'),leafHashes=leafCells||process.argv.includes('--leaf-hashes');
const capturesOnly=process.argv.includes('--captures-only'),timingsOnly=process.argv.includes('--timings-only');
if(capturesOnly&&timingsOnly)throw new Error('Escolha capturas ou tempos');
if([spatial,depthOrder,frontFaces,isolatedModels,leafHashes].filter(Boolean).length>1)throw new Error('Compare uma alteração por vez');
if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe um nome válido');
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]});
const viewport=mobile?{width:390,height:844}:{width:1280,height:800};
const page=await browser.newPage({viewport,deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
page.setDefaultTimeout(120000);
const errors=[],comparisons=[],samples=[],changes=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const h=Math.hypot(110,145),views=[['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['industry',79,54,22,3],['beach',53,-43,23,0],['river',-30,13,21,0],['forest-close',-62,52,40,3],['centre-close',10,28,40,1]];
const settle=async()=>{await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(1500);await page.evaluate(()=>window.ecoBenchmark.stop());};
const position=async([,u,v,zoom,y])=>page.evaluate(p=>{window.ecoBenchmark.camera(...p);window.ecoBenchmark.freeze();},[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);
const toggle=async enabled=>{
 const result=await page.evaluate(({enabled,spatial,depthOrder,frontFaces,isolatedModels,leafHashes,leafCells})=>{
  if(spatial)window.ecoBenchmark.spatialVisibility(enabled);
  else if(depthOrder)window.ecoBenchmark.depthOrder(enabled);
  else if(frontFaces)window.ecoBenchmark.depthFrontFaces(enabled);
  else if(isolatedModels)return window.ecoBenchmark.isolatedModels(enabled);
  else if(leafHashes)return window.ecoBenchmark.leafHashes(enabled,leafCells);
  else window.ecoBenchmark.depthPrepass(enabled);
 },{enabled,spatial,depthOrder,frontFaces,isolatedModels,leafHashes,leafCells});
 if(isolatedModels){
  changes.push({enabled,...result});
  if(enabled){console.log(JSON.stringify({change:'isolated-models',...result}));expect(result.batchDraws,'O experimento precisa alterar pelo menos um lote').toBeGreaterThan(0);}
 }
 if(leafHashes){changes.push({enabled,...result});if(enabled){console.log(JSON.stringify({change:leafCells?'leaf-cells':'leaf-hashes',...result}));expect(result.materials).toBeGreaterThan(0);}}
 return result;
};
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4175'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark?.depthPrepass);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());await settle();
 if(spatial||depthOrder||frontFaces||isolatedModels||leafHashes)await page.evaluate(()=>window.ecoBenchmark.depthPrepass(true));
 await toggle(false);await settle();
 const baseline=await page.evaluate(()=>{window.ecoBenchmark.start(true);return window.ecoBenchmark.stop();});
 expect(baseline.maximumGuard).toEqual({valid:true,violations:[]});
 const device=await page.evaluate(()=>({renderer:window.ecoBenchmark.renderer,dpr:devicePixelRatio}));
 // Paired runs with reversed order, including both passes in the outer GPU timer.
 if(!capturesOnly)for(const view of views.slice(0,3)){
  await position(view);
  for(let run=0;run<2;run++)for(const enabled of run?[true,false]:[false,true]){
   await toggle(enabled);await settle();expect(errors).toEqual([]);
   await page.evaluate(()=>window.ecoBenchmark.start(true));await page.waitForTimeout(6000);
   const result=await page.evaluate(()=>window.ecoBenchmark.stop());
   expect(result.maximumGuard).toEqual({valid:true,violations:[]});
   expect(result.modelUrls).toEqual(baseline.modelUrls);expect(result.instances).toBe(baseline.instances);
   expect([result.width,result.height]).toEqual([baseline.width,baseline.height]);
   samples.push({name:view[0],enabled,run,result});
   console.log(JSON.stringify({name:view[0],enabled,run,gpu:result.gpu?.p50??null,cpu:result.cpu?.p50??null,calls:result.calls}));
  }
 }
 if(!timingsOnly){
 await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));await settle();
 await expect(page.getByRole('button',{name:'Centralizar mapa'})).toBeEnabled();
 for(const view of views){
  await position(view);let original;
  for(const mode of ['original',spatial?'spatial':depthOrder?'depth-order':frontFaces?'front-faces':isolatedModels?'isolated-models':leafHashes?(leafCells?'leaf-cells':'leaf-hashes'):'depth','shadow-refresh','control']){
   await toggle(mode!=='original'&&mode!=='control');
   if(mode==='shadow-refresh')await page.evaluate(()=>window.ecoBenchmark.refreshShadows());await settle();
   const snapshot=await page.evaluate(()=>({camera:window.ecoBenchmark.snapshot().camera,clocks:window.ecoBenchmark.clocks()}));
   const png=await page.screenshot({path:`${out}/${view[0]}-${mode}.png`,animations:'disabled'});
   const raw=await sharp(png).ensureAlpha().raw().toBuffer();
   if(mode==='original'){original=raw;continue;}
   let sum=0,max=0,changedPixels=0;
   for(let i=0;i<raw.length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(raw[i+c]-original[i+c]);sum+=d;max=Math.max(max,d);changed ||= d!==0;}if(changed)changedPixels++;}
   const comparison={name:view[0],mode,mae:sum/raw.length,max,changedPixels,...snapshot};comparisons.push(comparison);console.log(JSON.stringify(comparison));
  }
 }
 }
 await toggle(false);
 const bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 await writeFile(`${out}/results.json`,JSON.stringify({date:new Date().toISOString(),device,viewport,mobileEmulation:mobile,experiment:spatial?'spatial-visibility':depthOrder?'depth-order':frontFaces?'depth-front-faces':isolatedModels?'isolated-models':leafHashes?(leafCells?'leaf-cells':'leaf-hashes'):'depth-prepass',capturesOnly,timingsOnly,baseline,bundles,samples,comparisons,changes,errors},null,2));
 expect(errors).toEqual([]);
}finally{await browser.close();}
