import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';

const mobile=process.argv.includes('--mobile'),capturesOnly=process.argv.includes('--captures-only'),sameSession=process.argv.includes('--same-session'),stage=process.argv[2];
if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe um nome válido');
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]});
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:800},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
page.setDefaultTimeout(180000);
const errors=[],gestures=[],comparisons=[];let cdp,wholeControl,incrementalControl;
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const preparation=()=>page.evaluate(()=>window.ecoBenchmark.preparation());
const settle=async()=>{await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(1500);await page.evaluate(()=>window.ecoBenchmark.stop());};
const point=()=>page.evaluate(()=>{
 const r=document.querySelector('canvas').getBoundingClientRect();
 for(const fy of [.6,.5,.7,.4])for(const fx of [.4,.5,.65]){
  const x=r.left+r.width*fx,y=r.top+r.height*fy;
  if([-55,0,55].every(dx=>document.elementFromPoint(x+dx,y)?.tagName==='CANVAS'))return {x,y};
 }
 throw new Error('Sem área de mapa para o gesto');
});
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4175'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark?.restartWarmup);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());await settle();
 const before=await page.evaluate(()=>{window.ecoBenchmark.start(true);return window.ecoBenchmark.stop();});
 expect(before.maximumGuard).toEqual({valid:true,violations:[]});
 let completed;
 if(!capturesOnly){
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Aproximar mapa'}).click();await settle();
 if(mobile)cdp=await page.context().newCDPSession(page);
 for(const name of mobile?['drag','pinch']:['drag','held-key']){
  const roots=await page.evaluate(()=>window.ecoBenchmark.restartWarmup());expect(roots).toBeGreaterThan(100);
  const p=await point();
  if(name==='held-key'){await page.locator('canvas').focus();await page.keyboard.down('ArrowRight');}
  else if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:name==='pinch'?[{x:p.x-25,y:p.y,id:1},{x:p.x+25,y:p.y,id:2}]:[{...p,id:1}]});
  else {await page.mouse.move(p.x,p.y);await page.mouse.down();}
  const start=await preparation();expect(start.busy).toBe(true);expect(start.jobs.shaders.pending).toBe(true);
  await page.evaluate(()=>window.ecoBenchmark.start(true));
  // Keep the gesture held longer than idle timeouts, then move it. A stationary
  // finger or OS key-repeat gap must not be mistaken for permission to prepare.
  await page.waitForTimeout(1800);
  if(name!=='held-key')for(let i=1;i<=12;i++){
   if(name==='pinch')await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x-25-i,y:p.y,id:1},{x:p.x+25+i,y:p.y,id:2}]});
   else if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+i*2,y:p.y-i,id:1}]});
   else await page.mouse.move(p.x+i*2,p.y-i);
   await page.waitForTimeout(16);
  }
  const held=await preparation();expect(held.busy).toBe(true);expect(held.jobs.shaders.pending).toBe(true);expect(held.jobs.shaders.started).toBe(start.jobs.shaders.started);
  const measured=await page.evaluate(()=>window.ecoBenchmark.stop());expect(measured.maximumGuard).toEqual({valid:true,violations:[]});
  if(name==='held-key')await page.keyboard.up('ArrowRight');else if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
  await page.waitForFunction(count=>window.ecoBenchmark.preparation().jobs.shaders.started>count,held.jobs.shaders.started);
  const resumed=await preparation();expect(resumed.jobs.shaders.errors).toBe(0);
  gestures.push({name,roots,start,held,resumed,maximumGuard:measured.maximumGuard});console.log(JSON.stringify({name,startsWhileHeld:held.jobs.shaders.started-start.jobs.shaders.started,resumed:resumed.jobs.shaders.started}));
 }
 // Let the complete queue drain once, to detect a stuck gate or repeated queue.
 await page.waitForFunction(()=>!window.ecoBenchmark.preparation().jobs.shaders.pending);
 completed=await preparation();expect(completed.jobs.shaders.cancelled).toBe(false);expect(completed.jobs.shaders.errors).toBe(0);
 }
 const after=await page.evaluate(()=>{window.ecoBenchmark.start(true);return window.ecoBenchmark.stop();});
 expect(after.maximumGuard).toEqual({valid:true,violations:[]});expect(after.modelUrls).toEqual(before.modelUrls);expect(after.instances).toBe(before.instances);expect([after.width,after.height]).toEqual([before.width,before.height]);
 console.log(JSON.stringify({completed:completed?.jobs.shaders,models:after.modelUrls.length,instances:after.instances}));
 if(!mobile){
  await page.evaluate(()=>window.ecoBenchmark.settings({ambientAnimation:false,reducedMotion:true}));await settle();
  // Match the reference's completed camera transition, mouse hover and focus.
  // Leaving the canvas focused adds a full-viewport focus ring to screenshots.
  await page.getByRole('button',{name:'Centralizar mapa'}).click();await settle();
  if(sameSession)wholeControl=await page.evaluate(()=>window.ecoBenchmark.warmupWhole());
  const h=Math.hypot(110,145);
  for(const pass of sameSession?['original','incremental']:['cross-session']){
   if(pass==='incremental'){
    const started=Date.now();await page.evaluate(()=>window.ecoBenchmark.restartWarmup());
    await page.waitForFunction(()=>!window.ecoBenchmark.preparation().jobs.shaders.pending);
    incrementalControl={elapsedMs:Date.now()-started,...await preparation()};expect(incrementalControl.jobs.shaders.errors).toBe(0);
   }
  for(const [name,u,v,zoom,y]of [['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['industry',79,54,22,3],['beach',53,-43,23,0],['river',-30,13,21,0],['forest-close',-62,52,40,3],['centre-close',10,28,40,1]]){
   await page.evaluate(p=>{window.ecoBenchmark.camera(...p);window.ecoBenchmark.freeze();},[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);await settle();
   const png=await page.screenshot({path:`${out}/${name}${pass==='original'?'-original':''}.png`,animations:'disabled'});
   if(pass==='original')continue;
   const a=await sharp(`${sameSession?out:'docs/performance/leaf-cells-images'}/${name}-original.png`).ensureAlpha().raw().toBuffer(),b=await sharp(png).ensureAlpha().raw().toBuffer();expect(b.length).toBe(a.length);
   let changedPixels=0,max=0;for(let i=0;i<a.length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(a[i+c]-b[i+c]);max=Math.max(max,d);changed ||= d!==0;}if(changed)changedPixels++;}
   comparisons.push({name,pass,changedPixels,max});console.log(JSON.stringify(comparisons.at(-1)));
  }
  }
 }
 const bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 await writeFile(`${out}/results.json`,JSON.stringify({date:new Date().toISOString(),mobileEmulation:mobile,capturesOnly,sameSession,renderer:await page.evaluate(()=>window.ecoBenchmark.renderer),before,after,gestures,completed,wholeControl,incrementalControl,comparisons,bundles,errors},null,2));
 expect(errors).toEqual([]);for(const comparison of comparisons)expect(comparison.changedPixels,comparison.name).toBe(0);
}finally{await cdp?.detach();await browser.close();}
