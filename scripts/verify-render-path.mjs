import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const gpu=process.argv[2];if(!['intel','rtx'].includes(gpu))throw new Error('Use intel ou rtx');
const quick=process.argv.includes('--quick');
const out=`docs/performance/render-path-${gpu}${quick?'-final':''}`;await mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),gpu,headless:true,presentationVerified:false,viewport:{width:1920,height:1080},samples:[],calibrations:[],images:[],errors:[]};
const save=()=>writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu','--use-angle=d3d11',...(gpu==='rtx'?['--force-high-performance-gpu']:[])]});
const page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1});page.setDefaultTimeout(180000);
page.on('pageerror',e=>{report.errors.push(e.message);console.log('ERROR '+e.message);});
page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader|context lost/i.test(m.text()))report.errors.push(m.text());});
const reset=()=>page.getByRole('button',{name:'Centralizar mapa'}).click();
const view=async name=>{await reset();if(name!=='overview')for(let i=0;i<3;i++)await page.getByRole('button',{name:'Aproximar mapa'}).click();await page.waitForTimeout(1500);};
const mode=async name=>{await page.evaluate(name=>{if(name==='auto')window.ecoBenchmark.automaticDepthPrepass(false);else window.ecoBenchmark.depthPrepass(name==='depth');},name);await page.waitForTimeout(1500);};
const snapshot=()=>page.evaluate(()=>window.ecoBenchmark.snapshot());
const calibration=async fresh=>{
 if(fresh)await page.evaluate(()=>window.ecoBenchmark.automaticDepthPrepass());
 const start=Date.now();
 // Progress output also makes prolonged preparation visible to the operator.
 for(let i=0;i<120;i++){
  const status=await page.evaluate(()=>({path:window.ecoBenchmark.renderPath(),preparation:window.ecoBenchmark.preparation()}));
  if(status.path.stage==='complete'){report.calibrations.push({elapsedMs:Date.now()-start,...status});await save();console.log(JSON.stringify({calibration:status.path,elapsedMs:Date.now()-start}));return status.path;}
  if(i%6===0)console.log(JSON.stringify({waiting:status}));await page.waitForTimeout(2000);
 }
 throw new Error('Calibration did not finish within four minutes');
};
const guard=result=>{
 expect(result.maximumGuard).toEqual({valid:true,violations:[]});expect(result.modelUrls).toEqual(report.baseline.modelUrls);expect(result.instances).toBe(34005);expect([result.width,result.height]).toEqual([2880,1620]);expect(result.gpu).toBeNull();
};
try{
 const started=Date.now();await page.goto('http://127.0.0.1:4183/?benchmark=1&renderPathTrial=1');console.log('page loaded');
 await page.waitForFunction(()=>!!window.ecoBenchmark);console.log('diagnostic ready');
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();console.log('title dismissed');await reset();console.log('map centered');
 for(let i=0;i<90;i++){
  const state=await page.evaluate(()=>({ready:window.ecoBenchmark.ready(),preparation:window.ecoBenchmark.preparation(),path:window.ecoBenchmark.renderPath()}));
  if(state.ready)break;if(i%6===0)console.log(JSON.stringify({loading:state}));
  if(i===89)throw new Error('Optional model preparation did not finish');await page.waitForTimeout(2000);
 }
 report.readyMs=Date.now()-started;
 report.renderer=await page.evaluate(()=>window.ecoBenchmark.renderer);expect(report.renderer).toMatch(gpu==='rtx'?/NVIDIA.*RTX 3050/:/Intel.*UHD/);
 report.baseline=await snapshot();expect(report.baseline.modelUrls).toHaveLength(77);expect([report.baseline.width,report.baseline.height]).toEqual([2880,1620]);console.log(JSON.stringify({renderer:report.renderer,readyMs:report.readyMs}));
 // Natural preparation and automatic selection are allowed to finish first.
 const initial=await calibration(false);report.naturalCompletionMs=Date.now()-started;
 expect(initial.preferred).toBe(gpu==='intel');
 await page.evaluate(()=>window.ecoBenchmark.warmupWhole());
 for(const name of quick?[]:['overview','zoomed']){
  await view(name);const selected=await calibration(true);expect(selected.preferred).toBe(gpu==='intel');
  for(let run=0;run<2;run++)for(const choice of run%2?['auto','single','depth']:['depth','single','auto']){
   await mode(choice);await page.evaluate(()=>window.ecoBenchmark.start(true,false));await page.waitForTimeout(6000);
   const result=await page.evaluate(()=>window.ecoBenchmark.stop());guard(result);report.samples.push({view:name,run,mode:choice,...result});await save();console.log(JSON.stringify({view:name,run,mode:choice,fps:result.frame.meanFps,p95:result.frame.p95}));
  }
 }
 // Real keyboard movement has fixed elapsed duration, no serial pointer driver.
 for(let run=0;run<(quick?0:2);run++)for(const choice of run%2?['auto','depth']:['depth','auto']){
  await view('zoomed');await mode(choice);const before=await snapshot();await page.locator('canvas').focus();
  await page.evaluate(()=>window.ecoBenchmark.start(true,false));await page.keyboard.down('ArrowRight');await page.waitForTimeout(2400);await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(2400);await page.keyboard.up('ArrowLeft');
  const result=await page.evaluate(()=>window.ecoBenchmark.stop());guard(result);expect(result.camera.position).not.toEqual(before.camera.position);
  if(choice==='auto')expect(await page.evaluate(()=>window.ecoBenchmark.renderPath().stage)).toBe('complete');
  report.samples.push({view:'keyboard',run,mode:choice,...result});await save();console.log(JSON.stringify({view:'keyboard',run,mode:choice,fps:result.frame.meanFps,p95:result.frame.p95}));
 }
 // Pointer input uses elapsed time, not a fixed count of awaited CDP events.
 // Measure this in the final smoke/control run as well as the Intel full run.
 for(let run=0;run<2;run++)for(const choice of run%2?['auto','depth']:['depth','auto']){
  await view('zoomed');await mode(choice);
  const point=await page.evaluate(()=>{
   for(const y of [.35,.45,.55])for(const x of [.35,.45,.55]){
    const px=innerWidth*x,py=innerHeight*y;
    if([-75,0,75].every(dx=>[-25,0,25].every(dy=>document.elementFromPoint(px+dx,py+dy)?.tagName==='CANVAS')))return {x:px,y:py};
   }throw new Error('No canvas area available for drag');
  });
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.evaluate(()=>window.ecoBenchmark.start(true,false));
  const start=performance.now();let events=0;
  while(performance.now()-start<6000){const a=Math.min(1,(performance.now()-start)/6000)*Math.PI*2;await page.mouse.move(point.x+Math.sin(a)*65,point.y+Math.cos(a)*20);events++;await page.waitForTimeout(16);}
  await page.mouse.up();const elapsedMs=performance.now()-start,result=await page.evaluate(()=>window.ecoBenchmark.stop());guard(result);
  report.samples.push({view:'drag',run,mode:choice,elapsedMs,events,...result});await save();console.log(JSON.stringify({view:'drag',run,mode:choice,fps:result.frame.meanFps,p95:result.frame.p95,elapsedMs,events}));
 }
 // Interrupt a fresh comparison with a held key and prove that no trial path
 // is selected during the gesture, then allow a clean comparison afterward.
 await view('zoomed');await page.evaluate(()=>window.ecoBenchmark.automaticDepthPrepass());
 await page.waitForFunction(()=>window.ecoBenchmark.renderPath().stage==='sampling');await page.locator('canvas').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(1500);
 report.interrupted=await page.evaluate(()=>({path:window.ecoBenchmark.renderPath(),activity:window.ecoBenchmark.preparation().busy}));
 expect(report.interrupted.activity).toBe(true);expect(report.interrupted.path.stage).toBe('waiting');expect(report.interrupted.path.samples).toEqual([]);expect(report.interrupted.path.enabled).toBe(report.interrupted.path.preferred);
 await page.keyboard.up('ArrowRight');await view('overview');await calibration(false);
 // Exact comparison of the unchanged render paths after freezing only the
 // diagnostic captures, never the animated performance samples above.
 await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));
 for(const name of ['overview','zoomed']){
  await view(name);await page.evaluate(()=>window.ecoBenchmark.freeze());await mode('single');
  const a=await page.locator('canvas').screenshot({path:`${out}/${name}-single.png`});await mode('depth');
  const b=await page.locator('canvas').screenshot({path:`${out}/${name}-depth.png`});
  const aa=await sharp(a).raw().toBuffer(),bb=await sharp(b).raw().toBuffer();expect(aa.length).toBe(bb.length);let changedBytes=0;for(let i=0;i<aa.length;i++)if(aa[i]!==bb[i])changedBytes++;
  report.images.push({view:name,changedBytes});expect(changedBytes).toBe(0);
 }
 // Validate the GPU information with the real context on desktop and narrow UI.
 await page.evaluate(()=>window.ecoBenchmark.settings({showPerformance:true}));await page.getByRole('button',{name:'Configurações',exact:true}).click();
 for(const [name,width,height]of [['desktop',1920,1080],['mobile-layout',390,844]]){
  await page.setViewportSize({width,height});const label=page.getByText(`GPU informada pelo navegador: ${report.renderer}`,{exact:true});await expect(label).toBeVisible();await label.scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.settings').scrollWidth<=document.querySelector('.settings').clientWidth)).toBe(true);
  await page.screenshot({path:`${out}/gpu-${name}.png`});
 }
 report.bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 report.finished=new Date().toISOString();await save();expect(report.errors).toEqual([]);
}catch(error){report.failure=String(error);report.body=await page.locator('body').innerText().catch(()=>'<unavailable>');await save();throw error;}finally{await browser.close();}
