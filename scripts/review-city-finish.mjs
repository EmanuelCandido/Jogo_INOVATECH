import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/screenshots/finish';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});
page.on('response',r=>{if(r.url().includes('/assets/models/')&&!r.ok())errors.push(`${r.status()} ${r.url()}`);});
try{
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('button',{name:'Continuar →',exact:true}).click({timeout:45000});
 await page.evaluate(async()=>{
  const {initialProgress}=await import('/src/game/save.ts'),{NarrativeManager}=await import('/src/game/NarrativeManager.ts');
  let p=initialProgress();while(p.phase==='INTRO')p=NarrativeManager.next(p);
  p=NarrativeManager.next(NarrativeManager.choose(p,'observe'));
  p.settings={...p.settings,quality:'LOW',reducedMotion:true,ambientAnimation:false};
  localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:p}));
 });
 await page.reload();await page.getByRole('button',{name:'Centralizar mapa'}).click({timeout:45000});
 await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('/@react-three_fiber.js'));
  const {_roots}=await import(url);window.reviewRoot=[..._roots.values()][0].store.getState();
 });
 const snapshot=()=>page.evaluate(()=>{
  const result={};window.reviewRoot.scene.traverse(group=>{
   if(!/^(accessibility|health|nature|security|pollution)_\d+$/.test(group.name))return;
   const batches=[];group.traverse(o=>{if(o.isInstancedMesh&&o.name.startsWith('details-'))batches.push({name:o.name,count:o.count,matrices:Array.from(o.instanceMatrix.array),colors:o.instanceColor?Array.from(o.instanceColor.array):null});});result[group.name]=batches;
  });return result;
 });
 const baseline=await snapshot();
 await page.getByRole('button',{name:'Configurações',exact:true}).click();
 const results=[];
 for(const tier of ['HIGH','LOW','ULTRA','MINIMUM','HIGH']){
  await page.getByLabel('Qualidade gráfica').selectOption(tier);
  await expect(page.locator('canvas')).toHaveAttribute('data-graphics-tier',tier,{timeout:45000});
  await expect.poll(snapshot,{timeout:30000}).toEqual(baseline);
  results.push({tier,situationTransformsAndColorsPreserved:true});
 }
 await page.getByRole('button',{name:'Voltar ao jogo'}).click();
 await page.addStyleTag({content:'.interface,.region-label,.marker {visibility:hidden!important}'});
 async function shot(name,x,z,zoom=45,y=0){
  await page.evaluate(({x,z,zoom,y})=>{
   const r=window.reviewRoot;r.camera.position.set(x+95,y+105,z+120);r.camera.lookAt(x,y,z);r.camera.zoom=zoom;r.camera.updateProjectionMatrix();r.camera.updateMatrixWorld();r.gl.shadowMap.needsUpdate=true;r.invalidate();
  },{x,z,zoom,y});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`${out}/${name}.png`,animations:'disabled',timeout:60000});
 }
 await shot('city',6,-9,12);
 await shot('sports',-17.5,-20,67);
 await shot('tunnel',-35.1,-16.8,70);
 await shot('pier',58.5,-2.5,75);
 await shot('park',11,-.9,54);
 await shot('harbor',18,-46,33);
 const sites=await page.evaluate(async()=>{const {problems}=await import('/src/content/problems.ts');return problems.map(p=>({id:p.id,position:p.worldPosition}));});
 for(const p of sites){
  if(!p.position)continue;
  await shot(p.id,p.position[0],p.position[2],p.id==='pollution_02'?60:95,.5);
 }
 const reviewedStates=['initial'];
 for(const state of ['SOLVED','TEMPORARILY_SOLVED']){
  await page.evaluate(async state=>{
   // Vite may have attached an HMR timestamp. Import the module already used by
   // the app so the fixture updates its live store, rather than a second store.
   const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('/src/stores/gameStore.ts'));
   const {useGame}=await import(url),s=useGame.getState().progress;
   useGame.setState({progress:{...s,problemStates:Object.fromEntries(Object.keys(s.problemStates).map(id=>[id,state]))}});
  },state);
  const visualState=state==='SOLVED'?'solved':'temporary';
  await expect.poll(()=>page.evaluate(()=>{
   const states=[];window.reviewRoot.scene.traverse(o=>{if(o.userData.problem)states.push(o.userData.visualState);});return states;
  }),{timeout:30000}).toEqual(sites.map(()=>visualState));
  for(const p of sites){
   if(visualState==='temporary'&&!['nature_02','accessibility_01'].includes(p.id))continue;
   await shot(`${p.id}-${visualState}`,p.position[0],p.position[2],p.id==='pollution_02'?60:95,.5);
  }
  reviewedStates.push(visualState);
 }
 await writeFile(`${out}/runtime-check.json`,JSON.stringify({qualitySwitches:results,situationGroups:Object.keys(baseline),reviewedStates,errors},null,2));
 await page.goto('http://127.0.0.1:5173/docs/REVISAO-MODELOS.html');
 await expect(page.locator('article')).toHaveCount(67);
 await page.locator('article img').evaluateAll(images=>images.forEach(img=>img.loading='eager'));
 await expect.poll(()=>page.locator('article img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),{timeout:30000}).toBe(true);
 await page.getByLabel('Ângulo').selectOption('-rear');
 await expect.poll(()=>page.locator('article img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),{timeout:30000}).toBe(true);
 await page.getByLabel('Buscar modelo').fill('pier');
 await expect(page.locator('article:visible')).toHaveCount(1);
 await page.getByRole('button',{name:'Ampliar Píer',exact:true}).click();
 await expect(page.locator('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Fechar imagem ampliada'}).click();
 await page.getByLabel('Buscar modelo').fill('');
 await page.getByLabel('Ângulo').selectOption('');
 await page.screenshot({path:`${out}/gallery.png`,animations:'disabled'});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Rendered city views; all situation transforms and colours survived five quality switches.');
}finally{await browser.close();}
