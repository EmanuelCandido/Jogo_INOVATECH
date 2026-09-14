import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({args:['--enable-gpu','--use-angle=d3d11']});
try{
 const page=await browser.newPage({viewport:{width:1672,height:941}});page.setDefaultTimeout(120000);
 await page.goto('http://127.0.0.1:5173/?benchmark=1');
 await page.waitForFunction(()=>window.ecoBenchmark);await page.evaluate(()=>window.ecoBenchmark.setup({shadows:'OFF'}));
 await page.waitForFunction(()=>window.ecoBenchmark.ready());
 const result=await page.evaluate(async()=>{
  const resources=performance.getEntriesByType('resource').map(r=>r.name);
  const {_roots}=await import(resources.find(u=>u.includes('/@react-three_fiber.js')));
  const {Raycaster,Vector3}=await import('/node_modules/.vite/deps/three.js');
  const m=await import('/src/config/referenceMap.ts');
  const root=[..._roots.values()][0].store.getState(),city=root.scene.getObjectByName('Cidade do vale — composição da referência');
  root.scene.updateMatrixWorld(true);
  const surfaces=city.children.filter(o=>o.isMesh&&!o.isInstancedMesh),ray=new Raycaster();
  const failures=[];
  for(const car of m.referenceTraffic){
   const [x,y,z]=car.position;
   ray.set(new Vector3(x,y+1.3,z),new Vector3(0,-1,0));
   const hit=ray.intersectObjects(surfaces,false).find(h=>h.point.y>y+.18&&h.point.y<y+1.25);
   if(hit)failures.push({asset:car.asset,point:m.compositionPoint(x,z),vehicleY:y,surfaceY:hit.point.y,surfaceIndex:surfaces.indexOf(hit.object),color:hit.object.material.color?.getHexString()});
  }
  const p=m.worldPoint(8,42);window.ecoBenchmark.camera(p[0],p[2],36,1);window.ecoBenchmark.start();
  return {failures,surfaces:surfaces.map((o,i)=>({index:i,color:o.material.color?.getHexString(),vertices:o.geometry.attributes.position.count}))};
 });
 await page.waitForTimeout(1200);await page.evaluate(()=>window.ecoBenchmark.stop());
 await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
 await mkdir('docs/screenshots/circulation-station-access',{recursive:true});
 await page.screenshot({path:'docs/screenshots/circulation-station-access/pavement-no-shadows.png'});
 await page.evaluate(async()=>{
  const resources=performance.getEntriesByType('resource').map(r=>r.name),{_roots}=await import(resources.find(u=>u.includes('/@react-three_fiber.js')));
  const root=[..._roots.values()][0].store.getState();root.scene.traverse(o=>{if(/road-(deck-module|retaining-wall)\.glb$/.test(o.userData.modelUrl??''))o.visible=false;});root.invalidate();
 });
 await page.waitForTimeout(400);
 await page.screenshot({path:'docs/screenshots/circulation-station-access/pavement-without-structures.png'});
 await writeFile('docs/pavement-inspection.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}finally{await browser.close();}
