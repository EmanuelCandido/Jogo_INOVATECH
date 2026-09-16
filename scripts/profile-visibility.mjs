import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.argv[2];if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe um nome válido');
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});page.setDefaultTimeout(120000);
const errors=[],samples=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4175'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark?.profileVisibility);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();await page.waitForFunction(()=>window.ecoBenchmark.ready());
 await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(2000);await page.evaluate(()=>window.ecoBenchmark.stop());
 const baseline=await page.evaluate(()=>{window.ecoBenchmark.start(true);return window.ecoBenchmark.stop();});expect(baseline.maximumGuard.valid).toBe(true);
 for(const spatial of [false,true])await page.evaluate(spatial=>window.ecoBenchmark.profileVisibility(spatial),spatial);
 for(let run=0;run<4;run++)for(const spatial of run%2?[true,false]:[false,true]){
  const sample=await page.evaluate(spatial=>window.ecoBenchmark.profileVisibility(spatial),spatial);
  samples.push({run,...sample});console.log(JSON.stringify(samples.at(-1)));
 }
 expect(new Set(samples.map(s=>s.countChecksum)).size).toBe(1);
 const device=await page.evaluate(()=>({renderer:window.ecoBenchmark.renderer,dpr:devicePixelRatio}));
 const bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 await writeFile(`${out}/results.json`,JSON.stringify({date:new Date().toISOString(),baseline,device,bundles,samples,errors},null,2));expect(errors).toEqual([]);
}finally{await browser.close();}
