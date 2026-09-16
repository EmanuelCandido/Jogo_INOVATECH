import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const stage=process.argv[2],mobile=process.argv.includes('--mobile'),profiling=process.argv.includes('--profile');
const capturesOnly=process.argv.includes('--captures-only');
if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe um nome de medição válido');
const seconds=Number(process.env.BENCH_SECONDS??4),runs=Number(process.env.BENCH_RUNS??3);
if(!Number.isFinite(seconds)||seconds<=0||!Number.isInteger(runs)||runs<1)throw new Error('Duração ou repetições inválidas');
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const viewport=mobile?{width:390,height:844}:{width:1280,height:800};
const browser=await chromium.launch({headless:true,args:['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]});
const page=await browser.newPage({viewport,deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
page.setDefaultTimeout(120000);
const errors=[],measurements=[],profiles=[],captures=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const h=Math.hypot(110,145);
const views=[['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['industry',79,54,22,3],['beach',53,-43,23,0],['river',-30,13,21,0],['forest-close',-62,52,40,3],['centre-close',10,28,40,1]];
const settle=async()=>{await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(1200);await page.evaluate(()=>window.ecoBenchmark.stop());};
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4175'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark?.profileMaterials);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());await settle();
 const device=await page.evaluate(()=>({renderer:window.ecoBenchmark.renderer,gpuTimer:window.ecoBenchmark.gpuTimer,userAgent:navigator.userAgent,dpr:devicePixelRatio}));
 const baseline=await page.evaluate(()=>window.ecoBenchmark.snapshot());
 await page.evaluate(()=>{window.ecoBenchmark.start(true);window.ecoBenchmark.stop();});
 for(const [name,u,v,zoom,y] of capturesOnly?[]:views){
  await page.evaluate(p=>window.ecoBenchmark.camera(...p),[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);
  await settle();
  for(let run=0;run<runs;run++){
   await page.evaluate(()=>window.ecoBenchmark.start(true));await page.waitForTimeout(seconds*1000);
   const sample=await page.evaluate(()=>window.ecoBenchmark.stop());measurements.push({name,run,...sample});
   expect(sample.maximumGuard).toEqual({valid:true,violations:[]});
   expect(sample.modelUrls).toEqual(baseline.modelUrls);expect(sample.instances).toBe(baseline.instances);
   expect([sample.width,sample.height]).toEqual([baseline.width,baseline.height]);
  }
  if(profiling){const profile=await page.evaluate(()=>window.ecoBenchmark.profileMaterials(3));profiles.push({name,...profile});expect(profile.valid).toBe(true);}
  console.log(JSON.stringify({name,gpuP50:measurements.filter(m=>m.name===name).map(m=>m.gpu?.p50),topMaterials:profiles.at(-1)?.name===name?profiles.at(-1).groups.slice(0,4):undefined}));
 }
 // Changing reducedMotion restarts CameraRig's flight. Finish that transition
 // once, then set every reference camera; never mix it with timing samples.
 await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));await settle();
 await expect(page.getByRole('button',{name:'Centralizar mapa'})).toBeEnabled();
 for(const [name,u,v,zoom,y] of views){
  const position=[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y];
  await page.evaluate(p=>{window.ecoBenchmark.camera(...p);window.ecoBenchmark.freeze();},position);
  await settle();
  const capture=await page.evaluate(()=>({snapshot:window.ecoBenchmark.snapshot(),clocks:window.ecoBenchmark.clocks()}));
  expect(capture.snapshot.camera).toEqual({position:[position[0]+110,y+130,position[1]+145],zoom});
  captures.push({name,...capture});
  await page.screenshot({path:`${out}/${name}.png`});
 }
 const bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 await writeFile(`${out}/results.json`,JSON.stringify({stage,date:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),bundles,device,viewport,mobileEmulation:mobile,headless:true,presentationVerified:false,capturesOnly,seconds,runs,baseline,measurements,profiles,captures,errors},null,2));
 expect(errors).toEqual([]);
}finally{await browser.close();}
