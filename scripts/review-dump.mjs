import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const out='docs/screenshots/circulation-dump';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--enable-gpu','--use-angle=d3d11']});
const page=await browser.newPage({viewport:{width:1400,height:900}}),errors=[],states=[];
page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:5173/?benchmark=1');
 await page.waitForFunction(()=>window.ecoBenchmark);await page.evaluate(()=>window.ecoBenchmark.setup());
 await page.waitForFunction(()=>window.ecoBenchmark.ready());
 const prepare=async()=>{
  await page.evaluate(async()=>{
   const resources=performance.getEntriesByType('resource').map(r=>r.name);
   const {_roots}=await import(resources.find(u=>u.includes('/@react-three_fiber.js')));
   window.dumpRoot=[..._roots.values()][0].store.getState();
   const {worldPoint}=await import('/src/config/referenceMap.ts'),{dumpSite}=await import('/src/config/dumpSite.ts'),p=worldPoint(...dumpSite.centre);
   window.ecoBenchmark.camera(p[0],p[2],30,0);window.ecoBenchmark.refreshShadows();
  });
  await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
 };
 await prepare();
 for(const [value,stage]of [['ACTIVE','initial'],['TEMPORARILY_SOLVED','temporary'],['SOLVED','solved']]){
  await page.evaluate(async value=>{
   const url=performance.getEntriesByType('resource').map(r=>r.name).find(u=>u.includes('/src/stores/gameStore.ts'));
   const {useGame}=await import(url),p=useGame.getState().progress;
   useGame.setState({progress:{...p,problemStates:{...p.problemStates,pollution_01:value}}});
  },value);
  await expect.poll(()=>page.evaluate(()=>window.dumpRoot.scene.getObjectByName('Lixão ambiental')?.userData.stage)).toBe(stage);
  await page.waitForLoadState('networkidle');await page.evaluate(()=>window.ecoBenchmark.refreshShadows());
  await page.waitForTimeout(500);
  const inventory=await page.evaluate(()=>{
   const list=[];window.dumpRoot.scene.traverse(o=>{if(o.isInstancedMesh&&o.parent?.userData.modelUrl)list.push({id:o.uuid,url:o.parent.userData.modelUrl,count:o.count,total:o.userData.sourceInstances,visible:o.visible,parentVisible:o.parent.visible,position:o.matrixWorld.elements.slice(12,15)});});return list;
  });
  await writeFile(`${out}/${stage}-instances.json`,JSON.stringify(inventory,null,2));
  await page.screenshot({path:`${out}/${stage}.png`});states.push(stage);
 }
 // Persist through the real save writer, then reload without resetting setup.
 await page.evaluate(async()=>{
  const resources=performance.getEntriesByType('resource').map(r=>r.name);
  const {useGame}=await import(resources.find(u=>u.includes('/src/stores/gameStore.ts')));
  const {saveProgress,browserSave}=await import('/src/game/save.ts');saveProgress(browserSave,useGame.getState().progress);
 });
 await page.reload();await page.waitForFunction(()=>window.ecoBenchmark?.ready());await prepare();
 await expect.poll(()=>page.evaluate(()=>window.dumpRoot.scene.getObjectByName('Lixão ambiental')?.userData.stage)).toBe('solved');
 await page.screenshot({path:`${out}/solved-reload.png`});
 // Compare an unchanged forest region, not just the CPU instance counts:
 // stale GPU matrices can hide trees while counts and cached shadows survive.
 const crop={left:1180,top:150,width:200,height:650};
 const baseline=await sharp(`${out}/initial.png`).extract(crop).removeAlpha().raw().toBuffer();
 const backgroundChanges=[];
 for(const stage of ['temporary','solved']){
  const actual=await sharp(`${out}/${stage}.png`).extract(crop).removeAlpha().raw().toBuffer();
  let changed=0;
  for(let i=0;i<actual.length;i+=3)if(Math.max(...[0,1,2].map(c=>Math.abs(actual[i+c]-baseline[i+c])))>24)changed++;
  const fraction=changed/(crop.width*crop.height);backgroundChanges.push({stage,fraction});
  expect(fraction,`unchanged forest after ${stage}`).toBeLessThan(.01);
 }
 await writeFile(`${out}/results.json`,JSON.stringify({states,solvedAfterReload:true,backgroundChanges,errors},null,2));
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Dump states and persisted recovery verified.');
}finally{await browser.close();}
