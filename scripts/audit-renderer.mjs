import {chromium,expect} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const gpu=process.argv[2];if(!['intel','rtx'].includes(gpu))throw new Error('Use intel ou rtx');
const headless=process.argv.includes('--headless'),stage=`renderer-audit-${gpu}${headless?'-headless':''}`,out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const report=process.argv.includes('--resume')?JSON.parse(await readFile(`${out}/results.json`,'utf8')):{date:new Date().toISOString(),gpu,headless,viewport:{width:1920,height:1080},dpr:1,presentationVerified:false,manifest:JSON.parse(await readFile('.tools/renderer-audit/manifest.json','utf8')),samples:[],errors:[]};
if(report.failure){await writeFile(`${out}/interrupted.json`,JSON.stringify(report,null,2));delete report.failure;}
const save=()=>writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
for(const variant of ['reference','current']){
 if(report[variant]?.bundles)continue;
 report.samples=report.samples.filter(s=>s.variant!==variant);
 const args=['--enable-gpu','--use-angle=d3d11',...(gpu==='rtx'?['--force-high-performance-gpu']:[])];
 const browser=await chromium.launch({channel:'chrome',headless,args});
 try{
  const page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1});page.setDefaultTimeout(180000);
  page.on('pageerror',e=>report.errors.push(`${variant}: ${e.message}`));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))report.errors.push(`${variant}: ${m.text()}`);});
  await page.goto(`http://127.0.0.1:${variant==='reference'?4181:4182}/?benchmark=1`);
  await page.waitForFunction(()=>!!window.ecoAudit);await page.evaluate(()=>window.ecoAudit.setup());
  await page.getByRole('button',{name:'JOGAR',exact:true}).click();
  await page.getByRole('button',{name:'Centralizar mapa'}).click();await page.waitForFunction(()=>window.ecoAudit.ready());
  const device=await page.evaluate(()=>({renderer:window.ecoAudit.renderer,attributes:window.ecoAudit.attributes,gpuAvailable:window.ecoAudit.gpuAvailable,ua:navigator.userAgent}));
  expect(device.renderer).toMatch(gpu==='rtx'?/NVIDIA.*RTX 3050/:/Intel.*UHD/);
  await page.evaluate(()=>window.ecoAudit.warmup());
  const baseline=await page.evaluate(()=>window.ecoAudit.snapshot());expect(baseline.instances).toBe(34005);expect(baseline.models).toHaveLength(77);expect([baseline.width,baseline.height]).toEqual([2880,1620]);
  report[variant]={device,baseline};await save();console.log(JSON.stringify({ready:variant,device:device.renderer,camera:baseline.camera}));
  for(const view of ['overview','zoomed']){
   await page.getByRole('button',{name:'Centralizar mapa'}).click();
   if(view==='zoomed')for(let i=0;i<3;i++)await page.getByRole('button',{name:'Aproximar mapa'}).click();
   // Warm each available rendering path outside measurements.
   for(const enabled of variant==='current'?[true,false]:[false]){await page.evaluate(enabled=>window.ecoAudit.prepass(enabled),enabled);await page.waitForTimeout(3000);}
   const expectedCamera=await page.evaluate(()=>window.ecoAudit.snapshot().camera);
   for(const instrumented of [false,true])for(let run=0;run<(instrumented?1:2);run++){
    for(const prepass of variant==='reference'?[false]:run%2?[true,false]:[false,true]){
     await page.evaluate(enabled=>window.ecoAudit.prepass(enabled),prepass);await page.waitForTimeout(1500);
     await page.evaluate(gpu=>window.ecoAudit.start(gpu),instrumented);await page.waitForTimeout(instrumented?5000:8000);
     const result=await page.evaluate(()=>window.ecoAudit.stop());
     expect(result.camera).toEqual(expectedCamera);
     expect(result.violations).toEqual([]);expect(result.models).toEqual(baseline.models);expect(result.instances).toBe(baseline.instances);expect([result.width,result.height]).toEqual([baseline.width,baseline.height]);
     report.samples.push({variant,view,run,prepass,...result});await save();
     console.log(JSON.stringify({variant,view,run,prepass,instrumented,fps:result.frame?.fps,p95:result.frame?.p95,cpu:result.cpu?.p50,gpu:result.gpu?.p50,calls:result.calls,triangles:result.triangles}));
    }
   }
  }
  report[variant].bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 }catch(error){report.failure=String(error);await save();throw error;}
 finally{await browser.close();}
}
report.finished=new Date().toISOString();await save();expect(report.errors).toEqual([]);
