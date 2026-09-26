// Screenshots of the same frozen views with every model complete (?lod=0)
// and with screen-space detail, in the mobile profile. Then compares pixels.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const out=`docs/performance/${process.argv[2]??'lod-compare'}`;await mkdir(out,{recursive:true});
const url=process.env.BENCH_URL??'http://127.0.0.1:4173',quality=process.env.QUALITY??'HIGH';
const h=Math.hypot(110,145);
const views=[['overview',3,20,1],['centre',10,28,1.7],['forest',-62,52,1.5],['close',10,28,3.5]].map(([name,u,v,zoom])=>[name,145/h*u-110/h*v,-110/h*u-145/h*v,zoom]);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const report={quality,variants:{}};
for(const [variant,query] of [['full','&lod=0'],['lod','']]){
 const context=await browser.newContext({viewport:{width:360,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const page=await context.newPage();page.setDefaultTimeout(300000);
 await page.goto(`${url}/?benchmark=1${query}`);await page.waitForFunction(()=>!!window.ecoBenchmark);
 await page.evaluate(q=>window.ecoBenchmark.setup({quality:q,renderScale:100,shadows:'PRESET',reducedMotion:true,ambientAnimation:false}),quality);
 await page.waitForFunction(()=>!window.ecoBenchmark.ready||window.ecoBenchmark.ready());
 await page.addStyleTag({content:'.interface,.region-label,.marker,.hud,.game-ui{visibility:hidden!important}'});
 const rows={};
 for(const [name,x,z,zoom] of views){
  const cam=await page.evaluate(v=>{const c=window.ecoBenchmark.playerCamera(v[0],v[1],1);return window.ecoBenchmark.playerCamera(v[0],v[1],c.zoom*v[2]);},[x,z,zoom]);
  await page.evaluate(()=>window.ecoBenchmark.freeze());await page.waitForTimeout(2500);
  await page.evaluate(()=>window.ecoBenchmark.draw());await page.waitForTimeout(800);
  await page.screenshot({path:`${out}/${variant}-${name}.png`});
  const snap=await page.evaluate(()=>{const s=window.ecoBenchmark.snapshot();return {calls:s.calls,triangles:s.triangles,pixelRatio:s.pixelRatio};});
  rows[name]={...snap,zoom:cam.zoom,top:variant==='lod'&&name==='overview'?await page.evaluate(()=>window.ecoBenchmark.triangleBreakdown(20)):undefined};
  console.log(variant,name,JSON.stringify({...snap,zoom:cam.zoom}));
 }
 report.variants[variant]=rows;await context.close();
}
await browser.close();
report.diff={};
for(const [name] of views){report.diff[name]=JSON.parse(execFileSync('node',['scripts/compare-images.mjs',`${out}/full-${name}.png`,`${out}/lod-${name}.png`,'24',`${out}/diff-${name}.png`]).toString());console.log(name,JSON.stringify(report.diff[name]));}
await writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
