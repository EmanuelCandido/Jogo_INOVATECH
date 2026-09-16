import {chromium,expect} from '@playwright/test';
import {preview} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const out='docs/performance/riverside-prepared-intel';await mkdir(out,{recursive:true});
const server=await preview({configFile:false,build:{outDir:'.tools/riverside-validation'},preview:{host:'127.0.0.1',port:4188,strictPort:true}});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu','--use-angle=d3d11']});
const url='http://127.0.0.1:4188/',expected=JSON.parse(await readFile('src/config/riverside-layout.json','utf8'));
const report={date:new Date().toISOString(),viewport:{width:1920,height:1080},dpr:1,presentationVerified:false,driverCacheControlled:false,samples:[],comparisons:[],errors:[]};
const save=()=>writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
const settle=async page=>{await page.evaluate(()=>window.ecoBenchmark.start(false,false));await page.waitForTimeout(1500);await page.evaluate(()=>window.ecoBenchmark.stop());};
const references=new Map();
let referencePlacements;
try{
 const seed=await browser.newPage();await seed.goto(`${url}?benchmark=1`);await seed.waitForFunction(()=>!!window.ecoBenchmark);
 const progress=await seed.evaluate(()=>{window.ecoBenchmark.settings(window.ecoBenchmark.maximumSettings);return window.ecoBenchmark.reviewState().progress;});await seed.close();
 for(let run=0;run<4;run++)for(const cached of run%2?[true,false]:[false,true]){
  const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1});
  const page=await context.newPage();page.setDefaultTimeout(180000);
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader|context lost/i.test(m.text()))report.errors.push(m.text());});
  await page.addInitScript(progress=>{
   localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:progress}));window.__startupTasks=[];
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.__startupTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask'});
  },progress);
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  try{
   await page.goto(`${url}?benchmark=1${cached?'':'&runtimeRiverside=1'}`,{waitUntil:'domcontentloaded'});
   await expect(page.getByRole('button',{name:'JOGAR',exact:true})).toBeEnabled({timeout:180000});
   const startup=await page.evaluate(()=>({interactiveMs:performance.now(),tasks:window.__startupTasks}));
   expect(await page.evaluate(()=>window.ecoBenchmark.renderer)).toMatch(/Intel.*UHD/);
   const placements=await page.evaluate(()=>window.ecoBenchmark.riversidePlacements());
   expect(placements.length).toBe(expected.length);
   expect(placements.map(p=>p.position)).toEqual(expected.map(p=>p.position));
   referencePlacements??=placements;expect(placements).toEqual(referencePlacements);
   const placementHash=createHash('sha256').update(JSON.stringify(placements)).digest('hex');
   await page.getByRole('button',{name:'JOGAR',exact:true}).click();
   await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
   await page.getByRole('button',{name:'Centralizar mapa'}).click();await page.waitForFunction(()=>window.ecoBenchmark.ready());await settle(page);
   const baseline=await page.evaluate(()=>window.ecoBenchmark.snapshot());
   expect(baseline.instances).toBe(34005);expect(baseline.modelUrls).toHaveLength(77);expect([baseline.width,baseline.height]).toEqual([2880,1620]);
   await page.locator('canvas').focus();await page.evaluate(()=>window.ecoBenchmark.start(true,false));
   await page.keyboard.down('ArrowRight');await page.waitForTimeout(3000);await page.keyboard.up('ArrowRight');
   await page.keyboard.down('ArrowLeft');await page.waitForTimeout(3000);await page.keyboard.up('ArrowLeft');
   const navigation=await page.evaluate(()=>window.ecoBenchmark.stop());expect(navigation.maximumGuard).toEqual({valid:true,violations:[]});expect(navigation.gpu).toBeNull();
   report.samples.push({run,cached,startup,navigation,placements:expected.length,placementHash,identicalPlacementData:true});await save();
   console.log(JSON.stringify({run,cached,interactiveMs:startup.interactiveMs,totalLongTasksMs:startup.tasks.reduce((a,t)=>a+t.duration,0),fps:navigation.frame?.meanFps}));
   if(run<2){
    await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));await settle(page);
    const h=Math.hypot(110,145);
    for(const [name,u,v,zoom,y]of [['overview',3,20,9.5,0],['riverside',-30,13,21,0],['forest',-62,52,22,3],['beach',53,-43,23,0]]){
     await page.evaluate(p=>{window.ecoBenchmark.camera(...p);window.ecoBenchmark.freeze();},[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);await settle(page);
     const bytes=await sharp(await page.screenshot({path:`${out}/${name}-${cached?'cached':'runtime'}-${run}.png`,animations:'disabled'})).ensureAlpha().raw().toBuffer();
     if(!cached&&run===0){references.set(name,bytes);continue;}
     const original=references.get(name);let changedPixels=0,max=0;
     for(let i=0;i<bytes.length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(bytes[i+c]-original[i+c]);changed ||= d!==0;max=Math.max(max,d);}if(changed)changedPixels++;}
     report.comparisons.push({name,run,cached,changedPixels,max});await save();console.log(JSON.stringify(report.comparisons.at(-1)));
    }
   }
  }finally{await cdp.detach();await context.close();}
 }
 report.finished=new Date().toISOString();expect(report.errors).toEqual([]);expect(report.comparisons.every(c=>c.changedPixels===0)).toBe(true);await save();
}catch(error){report.failure=String(error);await save();throw error;}
finally{await browser.close();await server.httpServer.close();}
