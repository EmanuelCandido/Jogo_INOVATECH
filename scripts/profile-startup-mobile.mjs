import {chromium,expect} from '@playwright/test';
import {preview} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {TraceMap,originalPositionFor} from '@jridgewell/trace-mapping';
// Mobile variant of profile-startup-cpu.mjs for SwiftShader sandboxes: 360×800 at DPR 2, touch.
// Build first: npx vite build --outDir .tools/startup-profile --sourcemap
const build=resolve('.tools/startup-profile'),out=process.env.OUT??'docs/performance/startup-cpu-mobile';await mkdir(out,{recursive:true});
const server=await preview({configFile:false,build:{outDir:build},preview:{host:'127.0.0.1',port:4188,strictPort:true}});
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:360,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});page.setDefaultTimeout(180000);
const cdp=await page.context().newCDPSession(page),report={date:new Date().toISOString(),errors:[],profileOverhead:true};
page.on('pageerror',e=>report.errors.push(e.message));
try{
 await page.addInitScript(()=>{
  window.__startupTasks=[];
  new PerformanceObserver(list=>{for(const e of list.getEntries())window.__startupTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask'});
 });
 await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});await cdp.send('Profiler.start');
 await page.goto('http://127.0.0.1:4188/?benchmark=1',{waitUntil:'domcontentloaded'});
 await expect(page.getByRole('button',{name:'JOGAR',exact:true})).toBeEnabled({timeout:180000});
 
 const {profile}=await cdp.send('Profiler.stop');await writeFile(`${out}/first-entry.cpuprofile`,JSON.stringify(profile));
 report.readyMs=await page.evaluate(()=>performance.now());report.longTasks=await page.evaluate(()=>window.__startupTasks);
 report.renderer=await page.evaluate(()=>window.ecoBenchmark?.renderer);
 const nodes=new Map(profile.nodes.map(n=>[n.id,n])),parents=new Map(),self=new Map(),total=new Map(),maps=new Map();
 for(const n of profile.nodes)for(const child of n.children??[])parents.set(child,n.id);
 for(let i=0;i<profile.samples.length;i++){
  const id=profile.samples[i],ms=profile.timeDeltas[i]/1000;self.set(id,(self.get(id)??0)+ms);
  for(let node=id;node;node=parents.get(node))total.set(node,(total.get(node)??0)+ms);
 }
 const rows=[];
 for(const [id,ms]of total){
  const n=nodes.get(id),f=n.callFrame;let source=null;
  if(f.url.includes('/assets/')&&f.lineNumber>=0){
   const file=basename(new URL(f.url).pathname);
   if(!maps.has(file))maps.set(file,new TraceMap(JSON.parse(await readFile(resolve(build,'assets',file+'.map'),'utf8'))));
   source=originalPositionFor(maps.get(file),{line:f.lineNumber+1,column:f.columnNumber});
  }
  rows.push({function:f.functionName,source,selfMs:self.get(id)??0,totalMs:ms});
 }
 report.application=rows.filter(r=>r.source?.source&&!r.source.source.includes('node_modules')).sort((a,b)=>b.totalMs-a.totalMs).slice(0,35);
 report.self=rows.sort((a,b)=>b.selfMs-a.selfMs).slice(0,30);
 report.bundles=[...maps.keys()];console.log(JSON.stringify({readyMs:report.readyMs,renderer:report.renderer,application:report.application.slice(0,15)},null,2));
 expect(report.errors).toEqual([]);
}catch(error){report.failure=String(error);throw error;}
finally{await writeFile(`${out}/results.json`,JSON.stringify(report,null,2));await cdp.detach();await browser.close();await server.httpServer.close();}
