import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.argv[2]??'final',out=`docs/screenshots/future/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});
const focused=stage==='cars-station';
const page=await browser.newPage({viewport:focused?{width:1280,height:800}:{width:1672,height:941}}),errors=[],measurements=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/models/')&&!r.ok())errors.push(`${r.status()} ${r.url()}`);});
page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('button',{name:'Continuar →',exact:true}).click({timeout:60000});
 await page.evaluate(async()=>{const {initialProgress}=await import('/src/game/save.ts'),{NarrativeManager}=await import('/src/game/NarrativeManager.ts');let p=initialProgress();while(p.phase==='INTRO')p=NarrativeManager.next(p);p=NarrativeManager.next(NarrativeManager.choose(p,'observe'));p.settings={...p.settings,quality:'LOW',reducedMotion:true,ambientAnimation:false};localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:p}));});
 await page.reload();await page.getByRole('button',{name:'Centralizar mapa'}).click({timeout:60000});
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('/@react-three_fiber.js'));const {_roots}=await import(url);window.reviewRoot=[..._roots.values()][0].store.getState();});
 const style=await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
 async function shot(name,x,z,zoom,y=0){await page.evaluate(({x,z,zoom,y})=>{const r=window.reviewRoot;r.camera.position.set(x+110,130+y,z+145);r.camera.lookAt(x,y,z);r.camera.zoom=zoom;r.camera.updateProjectionMatrix();r.camera.updateMatrixWorld();r.gl.shadowMap.needsUpdate=true;r.invalidate();},{x,z,zoom,y});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${out}/${name}.png`,timeout:60000});}
 for(const tier of focused?['MEDIUM']:['MINIMUM','HIGH']){
  await style.evaluate(e=>e.textContent='');await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.getByLabel('Qualidade gráfica').selectOption(tier);await expect(page.locator('canvas')).toHaveAttribute('data-graphics-tier',tier,{timeout:60000});await page.getByRole('button',{name:'Voltar ao jogo'}).click();await page.getByRole('button',{name:'Centralizar mapa'}).click();await style.evaluate(e=>e.textContent='.interface,.region-label,.marker{visibility:hidden!important}');
  await page.waitForLoadState('networkidle');
  await expect.poll(()=>page.evaluate(tier=>{let towers=0,wrong=0;window.reviewRoot.scene.traverse(o=>{const u=o.userData.modelUrl;if(!u)return;if(u.includes('townhouse-'))towers++;if(tier==='HIGH'&&u.endsWith('-low.glb'))wrong++;});return towers>=4&&wrong===0;},tier),{timeout:60000}).toBe(true);
  if(focused)continue;
  await shot(`city-${tier}`,13.7,-9.1,18.2);
  measurements.push(await page.evaluate(async tier=>{const r=window.reviewRoot,values=[];for(let i=0;i<24;i++){const t=performance.now();r.camera.position.x+=.006;r.camera.updateMatrixWorld();r.gl.render(r.scene,r.camera);r.gl.getContext().finish();values.push(performance.now()-t);}values.sort((a,b)=>a-b);return {tier,medianRenderMs:values[12],p95RenderMs:values[22],calls:r.gl.info.render.calls,triangles:r.gl.info.render.triangles,geometries:r.gl.info.memory.geometries,modelBytes:performance.getEntriesByType('resource').filter(e=>e.name.includes('/assets/models/')).reduce((s,e)=>s+e.encodedBodySize,0)};},tier));
 }
 if(focused){
  await shot('station',-15,-36,63,2.4);await shot('cars',25,2,88,.3);
  await writeFile(`${out}/runtime.json`,JSON.stringify({stage,profile:'MEDIUM (complete models)',errors},null,2));
  if(errors.length)throw Error(errors.join('\n'));console.log('Station and cars rendered without WebGL errors.');
 }else{
 for(const [name,x,z,zoom] of [['city-complete',5,-18,14.8],['pilot',3,-17,65],['hospital',-15,8.5,64],['school',-25,-18,65],['civic',-6.8,-4,72],['homes',14,29,60],['harbor',17,-46,38],['station',-15,-36,52],['railway',-39,-35,45],['park',11,0,50],['coast',54,-3,62]])await shot(name,x,z,zoom);
 await shot('mountain',-65,-29,21,9);
 await shot('mountain-tunnel',-50,-34,64);
 await shot('foliage',3,1,110);
 await writeFile(`${out}/runtime.json`,JSON.stringify({stage,renderer:'Chromium SwiftShader (software)',measurements,errors},null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(measurements));
 }
}finally{await browser.close();}
