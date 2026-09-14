import {chromium,expect} from '@playwright/test';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/performance/verification';await mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const settle=()=>page.evaluate(async()=>{window.ecoBenchmark.start();for(let i=0;i<4;i++)await new Promise(requestAnimationFrame);return window.ecoBenchmark.stop();});
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4173'}/?benchmark=1`);await page.waitForFunction(()=>!!window.ecoBenchmark);
 await page.evaluate(()=>window.ecoBenchmark.setup());await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());
 await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
 await settle();await page.evaluate(()=>window.ecoBenchmark.freeze());
 const comparisons=[];
 for(const [name,x,z,zoom,y] of [['centre',26.7,-2.8,80,2],['forest',-39,11,43,0],['edge',-18,10,66,1],['port',18,-48,34,0],['beach',55.4,2.4,80,0]]){
  await page.evaluate(v=>window.ecoBenchmark.camera(...v),[x,z,zoom,y]);await page.evaluate(()=>window.ecoBenchmark.culling(true));const compact=await settle();
  const a=await page.screenshot({path:`${out}/${name}-culled.png`});
  await page.evaluate(()=>window.ecoBenchmark.culling(false));const full=await settle();
  const b=await page.screenshot({path:`${out}/${name}-full.png`});
  const ap=await sharp(a).removeAlpha().raw().toBuffer(),bp=await sharp(b).removeAlpha().raw().toBuffer();let sum=0,max=0,above=0;
  for(let i=0;i<ap.length;i++){const d=Math.abs(ap[i]-bp[i]);sum+=d;max=Math.max(max,d);if(d>8)above++;}
  const comparison={name,mae:sum/ap.length,max,channelsAbove8:above,compactTriangles:compact.triangles,fullTriangles:full.triangles,instances:compact.instances};comparisons.push(comparison);console.log(comparison);
  expect(sum/ap.length).toBeLessThan(.03);expect(above/ap.length).toBeLessThan(.0005);expect(compact.instances).toBe(full.instances);
 }
 await page.evaluate(()=>window.ecoBenchmark.culling(true));await settle();
 const before=await page.evaluate(()=>window.ecoBenchmark.buffers());
 await page.evaluate(()=>window.ecoBenchmark.settings({showPerformance:true}));await settle();
 const after=await page.evaluate(()=>window.ecoBenchmark.buffers());expect(after).toEqual(before);
 await page.evaluate(()=>window.ecoBenchmark.settings({showPerformance:false,reducedMotion:false,ambientAnimation:true}));
 await settle();const moving=await page.evaluate(()=>window.ecoBenchmark.clocks());await settle();
 expect((await page.evaluate(()=>window.ecoBenchmark.clocks()))[0]).toBeGreaterThan(moving[0]);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 const paused=await page.evaluate(()=>window.ecoBenchmark.clocks());await page.waitForTimeout(700);
 expect(await page.evaluate(()=>window.ecoBenchmark.clocks())).toEqual(paused);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await settle();const resumed=await page.evaluate(()=>window.ecoBenchmark.clocks());expect(resumed[0]).toBeGreaterThanOrEqual(paused[0]);
 await page.evaluate(()=>window.ecoBenchmark.settings({reducedMotion:true,ambientAnimation:false}));await settle();
 const stopped=await page.evaluate(()=>window.ecoBenchmark.clocks());await page.waitForTimeout(400);expect(await page.evaluate(()=>window.ecoBenchmark.clocks())).toEqual(stopped);
 expect(errors).toEqual([]);
 await writeFile(`${out}/results.json`,JSON.stringify({comparisons,staticBuffersUnchanged:true,animationMoves:true,backgroundPauses:true,motionSettingPauses:true,errors},null,2));
}finally{await browser.close();}
