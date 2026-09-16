import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const stage=process.argv[2],mobile=process.argv.includes('--mobile'),laps=Number(process.env.BENCH_LAPS??10);
if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage)||!Number.isInteger(laps)||laps<1||laps>30)throw new Error('Etapa ou número de voltas inválido');
const out=`docs/performance/${stage}`,url=process.env.BENCH_URL??'http://127.0.0.1:4175';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]});
const viewport=mobile?{width:390,height:844}:{width:1280,height:800},dpr=mobile?3:1;
let page,cdp;
const report={stage,date:new Date().toISOString(),mobileEmulation:mobile,viewport,dpr,driverCacheControlled:false,presentationVerified:false,laps,measurements:[],memory:[],errors:[]};
const save=()=>writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
try{
 // Obtain a valid save through the game's own narrative logic. The measured
 // page then starts with maximum settings, in a fresh browser context.
 const seed=await browser.newPage();await seed.goto(`${url}/?benchmark=1`);await seed.waitForFunction(()=>!!window.ecoBenchmark);
 const progress=await seed.evaluate(()=>{window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings);return window.ecoBenchmark.reviewState().progress;});await seed.close();
 page=await browser.newPage({viewport,deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile});page.setDefaultTimeout(180000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.addInitScript(progress=>{
  localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:progress}));
  window.__explorationTasks={start:0,end:0,values:[],supported:PerformanceObserver.supportedEntryTypes.includes('longtask')};
  if(window.__explorationTasks.supported)new PerformanceObserver(list=>{
   const state=window.__explorationTasks;if(!state.start)return;
   for(const e of list.getEntries())if(e.startTime>=state.start&&(!state.end||e.startTime<state.end))state.values.push({start:e.startTime,duration:e.duration});
  }).observe({type:'longtask'});
 },progress);
 cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.goto(`${url}/?benchmark=1`);await page.waitForFunction(()=>!!window.ecoBenchmark);
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.shadowInfo().lights.some(l=>l.map&&l.size[0]===4096));
 report.readyMs=await page.evaluate(()=>performance.now());
 report.device=await page.evaluate(()=>({renderer:window.ecoBenchmark.renderer,gpuTimer:window.ecoBenchmark.gpuTimer,userAgent:navigator.userAgent}));
 report.baseline=await page.evaluate(()=>window.ecoBenchmark.snapshot());
 expect(report.baseline.modelUrls).toHaveLength(77);expect(report.baseline.instances).toBe(34005);
 const memory=async(label,collect=false)=>{
  // Heap collection is outside timed navigation, never inside a measured lap.
  const before=await cdp.send('Runtime.getHeapUsage');if(collect)await cdp.send('HeapProfiler.collectGarbage');
  const heap=collect?await cdp.send('Runtime.getHeapUsage'):before;
  const scene=await page.evaluate(()=>({snapshot:window.ecoBenchmark.snapshot(),preparation:window.ecoBenchmark.preparation()}));
  const entry={label,forcedCollection:collect,before,heap,...scene};report.memory.push(entry);await save();
  console.log(JSON.stringify({memory:label,heap,geometries:scene.snapshot.geometries,textures:scene.snapshot.textures,programs:scene.snapshot.programs}));
 };
 await memory('first-interactive');
 const point=()=>page.evaluate(()=>{
  const r=document.querySelector('canvas').getBoundingClientRect();
  for(const fy of [.5,.62,.4,.72])for(const fx of [.5,.4,.65]){
   const x=r.left+r.width*fx,y=r.top+r.height*fy;if(document.elementFromPoint(x,y)?.tagName==='CANVAS')return {x,y,width:r.width,height:r.height,left:r.left,top:r.top};
  }throw new Error('Sem área livre no mapa');
 });
 const runLap=async(name)=>{
  await page.getByRole('button',{name:'Centralizar mapa'}).click();
  const preparationBefore=await page.evaluate(()=>window.ecoBenchmark.preparation());
  await page.evaluate(()=>{window.__explorationTasks={...window.__explorationTasks,start:performance.now(),end:0,values:[]};window.ecoBenchmark.start(true);});
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'Aproximar mapa'}).click();
  for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){
   const p=await point(),end={x:Math.min(p.left+p.width-8,Math.max(p.left+8,p.x+dx*p.width*.24)),y:Math.min(p.top+p.height-8,Math.max(p.top+8,p.y+dy*p.height*.20))};
   if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});else{await page.mouse.move(p.x,p.y);await page.mouse.down();}
   for(let i=1;i<=40;i++){
    const x=p.x+(end.x-p.x)*i/40,y=p.y+(end.y-p.y)*i/40;
    if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y,id:1}]});else await page.mouse.move(x,y);
    await page.waitForTimeout(16);
   }
   if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
  }
  await page.getByRole('button',{name:'Afastar mapa'}).click();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const result=await page.evaluate(()=>{window.__explorationTasks.end=performance.now();return window.ecoBenchmark.stop();});
  expect(result.maximumGuard).toEqual({valid:true,violations:[]});expect(result.modelUrls).toEqual(report.baseline.modelUrls);expect(result.instances).toBe(report.baseline.instances);expect([result.width,result.height]).toEqual([report.baseline.width,report.baseline.height]);
  const tasks=await page.evaluate(()=>({supported:window.__explorationTasks.supported,values:window.__explorationTasks.values}));
  const preparationAfter=await page.evaluate(()=>window.ecoBenchmark.preparation());
  report.measurements.push({name,result,tasks,preparationBefore,preparationAfter});await save();
  console.log(JSON.stringify({name,fps:result.frame?.meanFps,p95:result.frame?.p95,cpu:result.cpu?.p50,gpu:result.gpu?.p50,longTasks:tasks.values.length,longestTask:Math.max(0,...tasks.values.map(v=>v.duration))}));
 };
 await runLap('first-exploration');await memory('after-first');
 await page.waitForFunction(()=>window.ecoBenchmark.ready()&&!window.ecoBenchmark.preparation().jobs.shaders?.pending);
 await runLap('warm-reference');await memory('warm-baseline',true);
 for(let lap=1;lap<=laps;lap++){
  await runLap(`repeat-${lap}`);await memory(`repeat-${lap}`,lap===5||lap===laps);
 }
 report.bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 report.finished=new Date().toISOString();await save();expect(report.errors).toEqual([]);
}catch(error){report.failure=String(error);await save();throw error;}
finally{await cdp?.detach();await browser.close();}
