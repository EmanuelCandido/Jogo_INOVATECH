import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.argv[2]??'after',software=process.argv.includes('--software');
const seconds=Number(process.env.BENCH_SECONDS??30),runs=Number(process.env.BENCH_RUNS??3);
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:!process.argv.includes('--headed'),args:software?['--use-angle=swiftshader','--enable-webgl']:process.argv.includes('--hardware')?['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]:[]});
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.setDefaultTimeout(90000);
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const h=Math.hypot(110,145);
const views=[['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['industry',79,54,22,3],['beach',53,-43,23,0],['river',-30,13,21,0]].map(([name,u,v,zoom,y])=>[name,145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4173'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark);
 await page.evaluate(ambient=>window.ecoBenchmark.setup(ambient?{reducedMotion:false,ambientAnimation:true}:{}),process.argv.includes('--ambient'));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForLoadState('networkidle');
 await page.waitForFunction(()=>!window.ecoBenchmark.ready||window.ecoBenchmark.ready());
 await expect(page.locator('canvas')).toHaveAttribute('data-graphics-tier','ULTRA');
 await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
 if(process.argv.includes('--batched'))console.log('Batched tree groups:',await page.evaluate(()=>window.ecoBenchmark.experimentBatched()));
 const device=await page.evaluate(()=>({renderer:window.ecoBenchmark.renderer,gpuTimer:window.ecoBenchmark.gpuTimer,multiDraw:window.ecoBenchmark.multiDraw,userAgent:navigator.userAgent,dpr:devicePixelRatio}));
 const measurements=[];
 for(const [name,x,z,zoom,y] of views){
  await page.evaluate(v=>window.ecoBenchmark.camera(...v),[x,z,zoom,y]);
  if(!process.argv.includes('--ambient'))await page.evaluate(()=>window.ecoBenchmark.freeze?.());
  await page.evaluate(()=>{window.ecoBenchmark.start();});await page.waitForTimeout(1200);await page.evaluate(()=>window.ecoBenchmark.stop());
  await page.screenshot({path:`${out}/${name}.png`});
  for(let run=0;run<runs;run++){
   await page.evaluate(()=>window.ecoBenchmark.start());
   await page.waitForTimeout(seconds*1000);
   const result=await page.evaluate(()=>window.ecoBenchmark.stop());measurements.push({name,run,...result});
   console.log(name,run,JSON.stringify({calls:result.calls,triangles:result.triangles,frame:result.frame?.p50,cpu:result.cpu?.p50,gpu:result.gpu?.p50}));
  }
 }
 await writeFile(`${out}/results.json`,JSON.stringify({stage,date:new Date().toISOString(),device,seconds,runs,measurements,errors},null,2));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
