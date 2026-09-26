// Mobile-profile measurement: HIGH quality, shadows, animations, touch viewport.
// Counts triangles/draw calls per view and times loading. SwiftShader frame
// times are relative only; they do not represent a phone GPU.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.argv[2]??'mobile',out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const url=process.env.BENCH_URL??'http://127.0.0.1:4173';
const quality=process.env.QUALITY??'HIGH',seconds=Number(process.env.BENCH_SECONDS??4);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/opt/pw-browsers/chromium',args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:360,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();page.setDefaultTimeout(240000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const t0=Date.now();
await page.goto(`${url}/?benchmark=1`);
await page.waitForFunction(()=>!!window.ecoBenchmark);
const benchReady=Date.now()-t0;
await page.evaluate(q=>window.ecoBenchmark.setup({quality:q,renderScale:100,shadows:'PRESET',reducedMotion:false,ambientAnimation:true}),quality);
await page.waitForFunction(()=>!window.ecoBenchmark.ready||window.ecoBenchmark.ready());
const sceneReady=Date.now()-t0;
await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
const h=Math.hypot(110,145);
const views=[['overview',3,20,4.6,0],['centre',10,28,12,1],['forest',-62,52,11,3],['river',-30,13,10,0]].map(([name,u,v,zoom,y])=>[name,145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);
const results=[];
for(const [name,x,z,zoom,y] of views){
 await page.evaluate(v=>window.ecoBenchmark.playerCamera(v[0],v[1],v[2]),[x,z,zoom]);
 await page.waitForTimeout(1500);
 await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(seconds*1000);
 const r=await page.evaluate(()=>window.ecoBenchmark.stop());
 await page.screenshot({path:`${out}/${name}.png`});
 results.push({name,calls:r.calls,triangles:r.triangles,width:r.width,height:r.height,zoom:r.camera.zoom,frameP50:r.frame?.p50,tier:r.resolvedGraphics.tier});
 console.log(JSON.stringify(results.at(-1)));
}
await writeFile(`${out}/results.json`,JSON.stringify({stage,quality,date:new Date().toISOString(),benchReady,sceneReady,results,errors},null,2));
console.log({benchReady,sceneReady,errors:errors.length});
await browser.close();
