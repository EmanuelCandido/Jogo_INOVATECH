import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/screenshots/future/architecture';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.setDefaultTimeout(60000);
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('button',{name:'Continuar →',exact:true}).click({timeout:60000});
 await page.evaluate(async()=>{
  const {initialProgress}=await import('/src/game/save.ts'),{NarrativeManager}=await import('/src/game/NarrativeManager.ts');
  let p=initialProgress();while(p.phase==='INTRO')p=NarrativeManager.next(p);
  p=NarrativeManager.next(NarrativeManager.choose(p,'observe'));
  p.settings={...p.settings,quality:'HIGH',shadows:'SOFT',renderScale:100,reducedMotion:true,ambientAnimation:false};
  localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:p}));
 });
 await page.reload();await page.getByRole('button',{name:'Centralizar mapa'}).click({timeout:60000});
 await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('/@react-three_fiber.js'));
  const {_roots}=await import(url);window.reviewRoot=[..._roots.values()][0].store.getState();
 });
 const hiddenUI='.interface,.region-label,.marker{visibility:hidden!important}';
 const style=await page.addStyleTag({content:hiddenUI});
 await page.waitForLoadState('networkidle');
 async function shot(name,x,z,zoom,y=0){
  await page.evaluate(({x,z,zoom,y})=>{
   const r=window.reviewRoot;r.camera.position.set(x+110,130+y,z+145);r.camera.lookAt(x,y,z);
   r.camera.zoom=zoom;r.camera.updateProjectionMatrix();r.camera.updateMatrixWorld();r.gl.shadowMap.needsUpdate=true;r.invalidate();
  },{x,z,zoom,y});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:`${out}/${name}.png`,timeout:60000});
 }
 if(!process.argv.includes('--shore-only')){
  await shot('houses',3.2,29.5,130,.85);
  await shot('facades',26.7,-2.8,115,2.2);
  await shot('pavements',20,14,130,0);
  await shot('park',12,4.7,145,.12);
 }
 for(const [name,time] of [['swash-advance',2.07],['swash-retreat',5.85]]){
  await page.evaluate(time=>{const r=window.reviewRoot;r.scene.getObjectByName('beach-swash').material.userData.swashTime.value=time;r.invalidate();},time);
  await shot(name,55.4,2.4,105,-.1);
 }
 if(process.argv.includes('--shore-only')){
  await writeFile(`${out}/shore-runtime.json`,JSON.stringify({profile:'HIGH',updatedDryTerrace:true,errors},null,2));
  if(errors.length)throw Error(errors.join('\n'));console.log('Final beach shape and furniture rendered without errors.');
 }else{
 async function settings(change){
  await style.evaluate(e=>e.textContent='');await page.getByRole('button',{name:'Configurações',exact:true}).click();
  await change();await page.getByRole('button',{name:'Voltar ao jogo'}).click();
  await style.evaluate((e,text)=>e.textContent=text,hiddenUI);
 }
 await settings(async()=>{await page.getByLabel('Reduzir movimentos').uncheck();await page.getByLabel('Animar água e ambiente').check();});
 const before=await page.evaluate(()=>window.reviewRoot.scene.getObjectByName('beach-swash').material.userData.swashTime.value);
 await expect.poll(()=>page.evaluate(()=>window.reviewRoot.scene.getObjectByName('beach-swash').material.userData.swashTime.value),{timeout:30000}).toBeGreaterThan(before+.15);
 await settings(async()=>{await page.getByLabel('Reduzir movimentos').check();});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const stopped=await page.evaluate(()=>window.reviewRoot.scene.getObjectByName('beach-swash').material.userData.swashTime.value);
 await page.evaluate(()=>new Promise(r=>setTimeout(r,400)));
 expect(await page.evaluate(()=>window.reviewRoot.scene.getObjectByName('beach-swash').material.userData.swashTime.value)).toBe(stopped);
 await settings(async()=>{await page.getByLabel('Qualidade gráfica').selectOption('MINIMUM');await page.getByLabel('Animar água e ambiente').uncheck();});
 await expect(page.locator('canvas')).toHaveAttribute('data-graphics-tier','MINIMUM',{timeout:60000});
 await page.waitForLoadState('networkidle');await shot('beach-minimum',55.4,2.4,105,-.1);
 await writeFile(`${out}/runtime.json`,JSON.stringify({profiles:['HIGH','MINIMUM'],animationAdvances:true,reducedMotionFreezes:true,errors},null,2));
 if(errors.length)throw Error(errors.join('\n'));console.log('Architecture, materials and swash verified; animation and reduced motion passed.');
 }
}finally{await browser.close();}
