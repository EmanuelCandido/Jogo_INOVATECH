import {chromium,expect} from '@playwright/test';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';

const mobile=process.argv.includes('--mobile'),stage=process.argv[2];
if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe um nome válido');
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]});
const viewport=mobile?{width:390,height:844}:{width:1280,height:800};
const page=await browser.newPage({viewport,deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
page.setDefaultTimeout(120000);
const errors=[],comparisons=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const h=Math.hypot(110,145),views=[['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['industry',79,54,22,3],['beach',53,-43,23,0],['river',-30,13,21,0],['forest-close',-62,52,40,3],['centre-close',10,28,40,1]];
const settle=async()=>{await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(1200);await page.evaluate(()=>window.ecoBenchmark.stop());};
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4175'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark?.backgroundOrder);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());await settle();
 const baseline=await page.evaluate(()=>{window.ecoBenchmark.start(true);return window.ecoBenchmark.stop();});
 expect(baseline.maximumGuard).toEqual({valid:true,violations:[]});
 const device=await page.evaluate(()=>({renderer:window.ecoBenchmark.renderer,dpr:devicePixelRatio}));
 await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));await settle();
 for(const [name,u,v,zoom,y] of views){
  await page.evaluate(p=>{window.ecoBenchmark.camera(...p);window.ecoBenchmark.freeze();},[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);
  let original;
  for(const mode of ['original','late','late-strict']){
   await page.evaluate(mode=>window.ecoBenchmark.backgroundOrder(mode),mode);await settle();
   const png=await page.screenshot({path:`${out}/${name}-${mode}.png`,animations:'disabled'});
   const raw=await sharp(png).ensureAlpha().raw().toBuffer();
   if(mode==='original'){original=raw;continue;}
   let sum=0,max=0,changedPixels=0;
   for(let i=0;i<raw.length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(raw[i+c]-original[i+c]);sum+=d;max=Math.max(max,d);changed ||= d!==0;}if(changed)changedPixels++;}
   const comparison={name,mode,mae:sum/raw.length,max,changedPixels};comparisons.push(comparison);console.log(JSON.stringify(comparison));
  }
 }
 await page.evaluate(()=>window.ecoBenchmark.backgroundOrder('original'));
 const bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 await writeFile(`${out}/results.json`,JSON.stringify({date:new Date().toISOString(),device,viewport,mobileEmulation:mobile,baseline,bundles,comparisons,errors},null,2));
 expect(errors).toEqual([]);
}finally{await browser.close();}
