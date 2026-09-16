import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const stage=process.argv[2]??'navigation',mobile=process.argv.includes('--mobile');
const depthPrepass=process.argv.includes('--depth-prepass');
const linearVisibility=process.argv.includes('--linear-visibility');
const compareVisibility=process.argv.includes('--compare-visibility');
const frontFaces=process.argv.includes('--front-faces'),compareFrontFaces=process.argv.includes('--compare-front-faces');
const compareBounds=process.argv.includes('--compare-bounds');
const timedInput=process.argv.includes('--timed-input');
if(compareFrontFaces&&(!depthPrepass||compareVisibility))throw new Error('Compare faces com profundidade ligada e seleção fixa');
if(compareBounds&&(!depthPrepass||!linearVisibility||compareVisibility||compareFrontFaces))throw new Error('Compare limites com profundidade ligada e seleção linear fixa');
if(!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Nome de medição inválido');
const width=Number(process.env.BENCH_WIDTH??(mobile?390:1280));
const height=Number(process.env.BENCH_HEIGHT??(mobile?844:800));
const dpr=Number(process.env.BENCH_DPR??(mobile?3:1)),runs=Number(process.env.BENCH_RUNS??3);
const warmupMs=Number(process.env.BENCH_WARMUP_MS??0);
const dragDurationMs=Number(process.env.BENCH_DRAG_MS??6000);
if(![width,height,dpr,runs].every(n=>Number.isFinite(n)&&n>0)||!Number.isInteger(runs))throw new Error('Dimensões ou repetições inválidas');
if(!Number.isFinite(warmupMs)||warmupMs<0||warmupMs>60000)throw new Error('Aquecimento deve ficar entre 0 e 60000 ms');
if(!Number.isFinite(dragDurationMs)||dragDurationMs<1000||dragDurationMs>60000)throw new Error('Duração do arrasto deve ficar entre 1000 e 60000 ms');
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:!process.argv.includes('--headed'),args:process.argv.includes('--hardware')?['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]:[]});
const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile});
page.setDefaultTimeout(120000);
const errors=[],measurements=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const cdp=mobile||compareBounds?await page.context().newCDPSession(page):null;
const gesture=async(steps,durationMs,move)=>{
 const started=performance.now();let events=0;
 if(timedInput){
  for(;;){const fraction=Math.min(1,(performance.now()-started)/durationMs);await move(fraction);events++;if(fraction===1)break;await page.waitForTimeout(16);}
 }else for(let i=1;i<=steps;i++){await move(i/steps);events++;await page.waitForTimeout(16);}
 return {timedInput,events,requestedDurationMs:timedInput?durationMs:null,elapsedMs:performance.now()-started};
};
const point=()=>page.evaluate(()=>{
 const r=document.querySelector('canvas').getBoundingClientRect();
 for(const fy of [.62,.5,.72,.4])for(const fx of [.35,.5,.65]){
  const x=r.left+r.width*fx,y=r.top+r.height*fy;
  if([-70,0,70].every(dx=>document.elementFromPoint(x+dx,y)?.tagName==='CANVAS'))return {x,y};
 }
 throw new Error('Sem área livre no canvas para o percurso');
});
const settle=async()=>{await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(1200);await page.evaluate(()=>window.ecoBenchmark.stop());};
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4173'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark?.maximumSettings);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());
 await expect(page.locator('canvas')).toHaveAttribute('data-graphics-tier','ULTRA');
 await expect(page.locator('canvas')).toHaveAttribute('data-graphics-shadows','4096');
 await settle();
 await page.evaluate(enabled=>window.ecoBenchmark.depthPrepass?.(enabled),depthPrepass);await settle();
 await page.evaluate(enabled=>window.ecoBenchmark.depthFrontFaces?.(enabled),frontFaces);await settle();
 await page.evaluate(enabled=>window.ecoBenchmark.spatialVisibility?.(enabled),!linearVisibility);await settle();
 if(compareBounds)await page.waitForFunction(()=>!window.ecoBenchmark.preparation().jobs.shaders?.pending);
 if(warmupMs){await page.evaluate(()=>window.ecoBenchmark.start(true));await page.waitForTimeout(warmupMs);const warmup=await page.evaluate(()=>window.ecoBenchmark.stop());expect(warmup.maximumGuard).toEqual({valid:true,violations:[]});}
 const device=await page.evaluate(()=>({renderer:window.ecoBenchmark.renderer,gpuTimer:window.ecoBenchmark.gpuTimer,multiDraw:window.ecoBenchmark.multiDraw,userAgent:navigator.userAgent,dpr:devicePixelRatio}));
 const baseline=await page.evaluate(()=>window.ecoBenchmark.snapshot());
 for(let run=0;run<runs;run++){
  const referenceBounds=compareBounds&&(run%4===1||run%4===2);
  if(compareBounds){const result=await page.evaluate(enabled=>window.ecoBenchmark.referenceBounds(enabled),referenceBounds);if(referenceBounds)expect(result.spheres).toBe(baseline.instances);}
  const depthFrontFaces=compareFrontFaces?(run%4===1||run%4===2):frontFaces;
  if(compareFrontFaces)await page.evaluate(enabled=>window.ecoBenchmark.depthFrontFaces(enabled),depthFrontFaces);
  const spatialVisibility=compareVisibility?(run%4===1||run%4===2):!linearVisibility;
  if(compareVisibility)await page.evaluate(enabled=>window.ecoBenchmark.spatialVisibility(enabled),spatialVisibility);
  await page.getByRole('button',{name:'Centralizar mapa'}).click();
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'Aproximar mapa'}).click();
  await settle();
  if(compareBounds){await cdp.send('HeapProfiler.collectGarbage');await settle();}
  const p=await point();
  await page.evaluate(()=>window.ecoBenchmark.start(true));
  if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});
  else {await page.mouse.move(p.x,p.y);await page.mouse.down();}
  // Same input path for both renderer versions. Pace real browser events; do
  // not hide the HUD or teleport the camera in the measured movement segment.
  const dragInput=await gesture(120,dragDurationMs,fraction=>{
   const a=fraction*Math.PI*2,x=p.x+Math.sin(a)*65,y=p.y+(1-Math.cos(a))*-18;
   return mobile?cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y,id:1}]}):page.mouse.move(x,y);
  });
  if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  else await page.mouse.up();
  const drag=await page.evaluate(()=>window.ecoBenchmark.stop());
  measurements.push({name:'drag',run,spatialVisibility,depthFrontFaces,referenceBounds,inputTiming:dragInput,...drag});
  await page.evaluate(()=>window.ecoBenchmark.start(true));
  let pinchInput;
  if(mobile){
   const p=await point();
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x-25,y:p.y,id:1},{x:p.x+25,y:p.y,id:2}]});
   pinchInput=await gesture(80,4000,fraction=>{
    const spread=25+Math.sin(fraction*Math.PI)*35;
    return cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x-spread,y:p.y,id:1},{x:p.x+spread,y:p.y,id:2}]});
   });
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{
   await page.locator('canvas').focus();
   for(const key of ['ArrowRight','ArrowLeft']){
    await page.keyboard.down(key);await page.waitForTimeout(1200);await page.keyboard.up(key);
   }
  }
  const input=await page.evaluate(()=>window.ecoBenchmark.stop());
  measurements.push({name:mobile?'pinch':'held-key',run,spatialVisibility,depthFrontFaces,referenceBounds,inputTiming:pinchInput,...input});
  for(const result of [drag,input]){
   expect(result.maximumGuard).toEqual({valid:true,violations:[]});
   expect(result.instances).toBe(baseline.instances);
   expect(result.modelUrls).toEqual(baseline.modelUrls);
   expect([result.width,result.height]).toEqual([baseline.width,baseline.height]);
  }
  console.log(JSON.stringify({run,spatialVisibility,depthFrontFaces,referenceBounds,renderer:device.renderer,drag:{meanFps:drag.frame?.meanFps,p95:drag.frame?.p95,gpuP50:drag.gpu?.p50,uploadBytes:drag.bufferUploadBytes},input:{meanFps:input.frame?.meanFps,p95:input.frame?.p95,uploadBytes:input.bufferUploadBytes}}));
 }
 // These fixed captures compare image fidelity, separately from the animated
 // maximum-quality timing samples above.
 await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));
 // Changing reducedMotion restarts CameraRig. Finish that flight before setting
 // the first reference camera, just as in the material benchmark.
 await settle();
 const h=Math.hypot(110,145);
 for(const [name,u,v,zoom,y] of [['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['river',-30,13,21,0]]){
  await page.evaluate(p=>{window.ecoBenchmark.camera(...p);window.ecoBenchmark.freeze();},[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);
  await settle();await page.screenshot({path:`${out}/${name}.png`,animations:'disabled'});
 }
 const bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 await writeFile(`${out}/results.json`,JSON.stringify({stage,date:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--short','--','src','scripts','package.json'],{encoding:'utf8'}),bundles,device,viewport:{width,height,dpr},mobileEmulation:mobile,depthPrepass,linearVisibility,compareVisibility,compareBounds,timedInput,dragDurationMs,collectionBetweenRuns:compareBounds,frontFaces,compareFrontFaces,warmupMs,headless:!process.argv.includes('--headed'),presentationVerified:false,runs,baseline,measurements,errors},null,2));
 expect(errors).toEqual([]);
}finally{await cdp?.detach();await browser.close();}
