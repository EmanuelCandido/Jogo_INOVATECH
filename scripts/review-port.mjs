import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.argv[2]??'port',out=`docs/screenshots/future/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});

const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/models/')&&!r.ok())errors.push(`${r.status()} ${r.url()}`);});
page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('button',{name:'Continuar →',exact:true}).click({timeout:60000});
 await page.evaluate(async()=>{const {initialProgress}=await import('/src/game/save.ts'),{NarrativeManager}=await import('/src/game/NarrativeManager.ts');let p=initialProgress();while(p.phase==='INTRO')p=NarrativeManager.next(p);p=NarrativeManager.next(NarrativeManager.choose(p,'observe'));p.settings={...p.settings,quality:'LOW',shadows:'SOFT',renderScale:80,reducedMotion:true,ambientAnimation:false};localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:p}));});
 await page.reload();await page.getByRole('button',{name:'Centralizar mapa'}).click({timeout:60000});
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('/@react-three_fiber.js'));const {_roots}=await import(url);window.reviewRoot=[..._roots.values()][0].store.getState();});
 const style=await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
 async function shot(name,x,z,zoom,y=0){await page.evaluate(({x,z,zoom,y})=>{const r=window.reviewRoot;r.camera.position.set(x+110,130+y,z+145);r.camera.lookAt(x,y,z);r.camera.zoom=zoom;r.camera.updateProjectionMatrix();r.camera.updateMatrixWorld();r.gl.shadowMap.needsUpdate=true;r.invalidate();},{x,z,zoom,y});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${out}/${name}.png`,timeout:60000});}
 for(const tier of ['HIGH']){
  await style.evaluate(e=>e.textContent='');await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.getByLabel('Qualidade gráfica').selectOption(tier);await expect(page.locator('canvas')).toHaveAttribute('data-graphics-tier',tier,{timeout:60000});await page.getByRole('button',{name:'Voltar ao jogo'}).click();await page.getByRole('button',{name:'Centralizar mapa'}).click();await style.evaluate(e=>e.textContent='.interface,.region-label,.marker{visibility:hidden!important}');
  await page.waitForLoadState('networkidle');
  await expect.poll(()=>page.evaluate(tier=>{let towers=0,wrong=0;window.reviewRoot.scene.traverse(o=>{const u=o.userData.modelUrl;if(!u)return;if(u.includes('townhouse-'))towers++;if(tier==='HIGH'&&u.endsWith('-low.glb'))wrong++;});return towers>=4&&wrong===0;},tier),{timeout:60000}).toBe(true);
  await shot('harbor',18,-48,34,0);await shot('ship',20,-59,77,1);await shot('materials',25,8.6,94,1.3);
  for(const [name,x,z] of [['northwest',-999,-999],['southwest',-999,999]]){
   const edge=await page.evaluate(async({x,z})=>{const {mapBaseZoom,mapFootprint,clampTarget}=await import('/src/game/mapNavigation.ts');const r=window.reviewRoot,w=r.gl.domElement.clientWidth,h=r.gl.domElement.clientHeight,zoom=mapBaseZoom(w,h)*3.5;return {target:clampTarget(x,z,mapFootprint(zoom,w,h)),zoom};},{x,z});
   await shot(name,...edge.target,edge.zoom);
  }
 }

  
  await writeFile(`${out}/runtime.json`,JSON.stringify({stage,profiles:['HIGH'],renderer:'SwiftShader',errors},null,2));
  if(errors.length)throw Error(errors.join('\n'));console.log('Port and material finishes rendered without WebGL errors.');
}finally{await browser.close();}
