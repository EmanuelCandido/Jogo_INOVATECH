import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.argv[2];if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe um nome válido');
const out=`docs/performance/${stage}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-gpu',...(process.platform==='win32'?['--use-angle=d3d11']:[])]});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});page.setDefaultTimeout(120000);
const errors=[],profiles=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const settle=async()=>{await page.evaluate(()=>window.ecoBenchmark.start());await page.waitForTimeout(2000);await page.evaluate(()=>window.ecoBenchmark.stop());};
try{
 await page.goto(`${process.env.BENCH_URL??'http://127.0.0.1:4175'}/?benchmark=1`);
 await page.waitForFunction(()=>!!window.ecoBenchmark?.profileMaterials);
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await page.evaluate(()=>window.ecoBenchmark.setup(window.ecoBenchmark.maximumSettings));
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());await settle();
 const baseline=await page.evaluate(()=>{window.ecoBenchmark.start(true);return window.ecoBenchmark.stop();});
 expect(baseline.maximumGuard).toEqual({valid:true,violations:[]});
 const h=Math.hypot(110,145);
 for(const [name,u,v,zoom,y] of [['overview',3,20,9.5,0],['centre',10,28,25,1],['forest',-62,52,22,3],['river',-30,13,21,0]]){
  await page.evaluate(p=>window.ecoBenchmark.camera(...p),[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y]);await settle();
  const profile=await page.evaluate(()=>window.ecoBenchmark.profileMaterials(3));
  expect(profile.valid).toBe(true);expect(profile.depthPrepass).toBe(true);expect(profile.frames).toBe(3);
  expect(profile.groups.some(group=>group.key.includes('depth-prepass-v1-'))).toBe(true);
  profiles.push({name,...profile});
  console.log(JSON.stringify({name,groups:profile.groups.slice(0,10)}));
 }
 const device=await page.evaluate(()=>({renderer:window.ecoBenchmark.renderer,dpr:devicePixelRatio}));
 const bundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)));
 await writeFile(`${out}/results.json`,JSON.stringify({date:new Date().toISOString(),baseline,device,bundles,profiles,errors,includesQueryOverhead:true},null,2));
 expect(errors).toEqual([]);
}finally{await browser.close();}
