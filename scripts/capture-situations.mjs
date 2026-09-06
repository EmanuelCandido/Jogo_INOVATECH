import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('docs/screenshots',{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});
await page.goto('http://localhost:5173');
await page.getByRole('button',{name:'Continuar →',exact:true}).click({timeout:45000});
for(const id of ['accessibility_01','health_01']){
 await page.evaluate(async id=>{
  const {initialProgress}=await import('/src/game/save.ts');
  const {NarrativeManager}=await import('/src/game/NarrativeManager.ts');
  const {ProblemManager}=await import('/src/game/ProblemManager.ts');
  let progress=initialProgress();while(progress.phase==='INTRO')progress=NarrativeManager.next(progress);
  progress=NarrativeManager.next(NarrativeManager.choose(progress,'observe'));
  progress.settings={...progress.settings,quality:'HIGH',reducedMotion:true,ambientAnimation:false};
  // Isolated visual fixtures; the full campaign is exercised separately by loop.spec.ts.
  for(const key of Object.keys(progress.problemStates))progress.problemStates[key]='AVAILABLE';
  localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:ProblemManager.select(progress,id)}));
 },id);
 await page.reload();
 try{await page.getByRole('button',{name:'Entender a situação'}).click({timeout:45000});}
 catch(error){console.log(await page.locator('body').innerText(),errors);await page.screenshot({path:'docs/screenshots/current-capture-error.png'});await browser.close();throw error;}
 await page.screenshot({path:`docs/screenshots/current-${id}-initial.png`,animations:'disabled'});
 await page.getByRole('button',{name:'Pensar nas soluções'}).click();
 await page.locator('.alternative').first().waitFor();
 await page.locator(`[data-choice-id="${id==='accessibility_01'?'ramp':'sanitation'}"]`).click();
 await page.getByRole('button',{name:'Voltar à cidade'}).waitFor();
 await page.locator('.robot-stage[data-pose="character_success"]').waitFor();
 await page.waitForLoadState('networkidle');
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 if(id==='accessibility_01')await page.waitForFunction(async()=>{
  const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('/@react-three_fiber.js'));
  const {_roots}=await import(url);const root=[..._roots.values()][0].store.getState();let found=false;
  root.scene.getObjectByName('accessibility_01').traverse(o=>{if(o.isInstancedMesh&&o.geometry.type==='BufferGeometry')found=true;});return found;
 },{},{timeout:30000});
 await page.screenshot({path:`docs/screenshots/current-${id}-solved.png`,animations:'disabled'});
}
await page.goto('http://localhost:5173/assets/portraits/robot/index.html');
await page.waitForFunction(()=>document.querySelectorAll('img').length===5&&[...document.images].every(i=>i.complete&&i.naturalWidth>0));
await page.screenshot({path:'docs/screenshots/robot-gallery.png',fullPage:true});
await browser.close();
await writeFile('docs/screenshots/current-visual-check.json',JSON.stringify({profiles:['HIGH'],errors},null,2));
if(errors.length)throw Error(errors.join('\n'));
console.log('Four situation views and five SVGs rendered successfully; no WebGL or page errors.');
