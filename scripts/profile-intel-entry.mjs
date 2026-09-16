import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';

const url=process.env.BENCH_URL??'http://127.0.0.1:4185/Jogo_INOVATECH/';
const out='docs/performance/intel-published-entry';await mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),url,viewport:{width:1920,height:1080},dpr:1,presentationVerified:false,physicalPhone:false,driverCacheControlled:false,samples:[],profiles:[],errors:[]};
const save=()=>writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu','--use-angle=d3d11']});
let page,cdp;
async function stopTrace(){
 const finished=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
 await cdp.send('Tracing.end');const {stream}=await finished;const chunks=[];
 while(true){const chunk=await cdp.send('IO.read',{handle:stream});chunks.push(Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8'));if(chunk.eof)break;}
 await cdp.send('IO.close',{handle:stream});const data=Buffer.concat(chunks);
 await writeFile(`${out}/first-entry.trace.json.gz`,gzipSync(data));
 const trace=JSON.parse(data),events=trace.traceEvents,groups=new Map();
 for(const e of events){if(e.ph!=='X'||!e.dur)continue;const key=e.name;
  const group=groups.get(key)??{name:key,count:0,totalMs:0,maxMs:0};group.count++;group.totalMs+=e.dur/1000;group.maxMs=Math.max(group.maxMs,e.dur/1000);groups.set(key,group);
 }
 return {events:events.length,bytes:data.length,nestedDurationsNotAdditive:true,eventsByTotalDuration:[...groups.values()].sort((a,b)=>b.totalMs-a.totalMs).slice(0,30)};
}
const guard=result=>{
 expect(result.maximumGuard).toEqual({valid:true,violations:[]});expect(result.instances).toBe(34005);
 expect(result.modelUrls).toEqual(report.baseline.modelUrls);expect([result.width,result.height]).toEqual([2880,1620]);
};
try{
 const seed=await browser.newPage();await seed.goto(`${url}?benchmark=1`);await seed.waitForFunction(()=>!!window.ecoBenchmark);
 const progress=await seed.evaluate(()=>{window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings);return window.ecoBenchmark.reviewState().progress;});await seed.close();
 page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1});page.setDefaultTimeout(180000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader|context lost/i.test(m.text()))report.errors.push(m.text());});
 await page.addInitScript(progress=>{
  localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:progress}));window.__longTasks=[];
  if(PerformanceObserver.supportedEntryTypes.includes('longtask'))new PerformanceObserver(list=>{for(const e of list.getEntries())window.__longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask'});
 },progress);
 cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp.send('Tracing.start',{categories:'devtools.timeline,v8,blink.user_timing,gpu,cc',transferMode:'ReturnAsStream'});
 await page.goto(`${url}?benchmark=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.ecoBenchmark);
 report.firstCanvasMs=await page.evaluate(()=>performance.now());
 report.renderer=await page.evaluate(()=>window.ecoBenchmark.renderer);expect(report.renderer).toMatch(/Intel.*UHD/);
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());report.modelsPreparedMs=await page.evaluate(()=>performance.now());
 report.firstEntry={tasks:await page.evaluate(()=>window.__longTasks),preparation:await page.evaluate(()=>window.ecoBenchmark.preparation())};
 report.firstEntryTrace=await stopTrace();report.baseline=await page.evaluate(()=>window.ecoBenchmark.snapshot());
 expect(report.baseline.modelUrls).toHaveLength(77);expect(report.baseline.instances).toBe(34005);
 console.log(JSON.stringify({renderer:report.renderer,firstCanvasMs:report.firstCanvasMs,modelsPreparedMs:report.modelsPreparedMs}));await save();
 await page.evaluate(()=>window.ecoBenchmark.warmupWhole());
 const h=Math.hypot(110,145),views=[['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['river',-30,13,21,0],['industry',35,35,20,1],['overview-return',3,20,9.5,0]];
 // Six ten-second segments, real held keyboard input. Region changes themselves
 // are diagnostic camera jumps; this is not certification of displayed frames.
 for(const [name,u,v,zoom,y] of views){
  await page.evaluate(p=>window.ecoBenchmark.camera(...p),[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);
  await page.waitForTimeout(1000);await page.locator('canvas').focus();
  const start=performance.now();await page.evaluate(()=>{window.__longTasks=[];window.ecoBenchmark.start(true,false);});
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(5000);await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(Math.max(0,10000-(performance.now()-start)));await page.keyboard.up('ArrowLeft');
  const result=await page.evaluate(()=>window.ecoBenchmark.stop());guard(result);expect(result.gpu).toBeNull();
  const tasks=await page.evaluate(()=>window.__longTasks);report.samples.push({name,elapsedMs:performance.now()-start,result,tasks});await save();
  console.log(JSON.stringify({name,fps:result.frame?.meanFps,p95:result.frame?.p95,cpu:result.cpu?.p50,longTasks:tasks.length}));
 }
 // Timer queries and per-material profiling are separate from the navigation.
 for(const [name,u,v,zoom,y]of views.slice(0,4)){
  await page.evaluate(p=>window.ecoBenchmark.camera(...p),[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);await page.waitForTimeout(1500);
  await page.evaluate(()=>window.ecoBenchmark.start(true,true));await page.waitForTimeout(5000);
  const diagnostic=await page.evaluate(()=>window.ecoBenchmark.stop());guard(diagnostic);
  const materials=await page.evaluate(()=>window.ecoBenchmark.profileMaterials(3));expect(materials.valid).toBe(true);
  report.profiles.push({name,diagnostic,materials});await save();
  console.log(JSON.stringify({profile:name,gpu:diagnostic.gpu?.p50,top:materials.groups.slice(0,5).map(g=>({name:g.key,ms:g.gpuMsPerFrame}))}));
 }
 report.bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(v=>/\/assets\/.*\.js$/.test(v)));
 report.finished=new Date().toISOString();expect(report.errors).toEqual([]);await save();
}catch(error){report.failure=String(error);await save();throw error;}
finally{await cdp?.detach();await browser.close();}
