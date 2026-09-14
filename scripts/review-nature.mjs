import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.argv[2]??'nature',out=`docs/screenshots/future/${stage}`;await mkdir(out,{recursive:true});
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
 for(const tier of ['MINIMUM','HIGH']){
  await style.evaluate(e=>e.textContent='');await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.getByLabel('Qualidade gráfica').selectOption(tier);await expect(page.locator('canvas')).toHaveAttribute('data-graphics-tier',tier,{timeout:60000});await page.getByRole('button',{name:'Voltar ao jogo'}).click();await page.getByRole('button',{name:'Centralizar mapa'}).click();await style.evaluate(e=>e.textContent='.interface,.region-label,.marker{visibility:hidden!important}');
  await page.waitForLoadState('networkidle');
  await expect.poll(()=>page.evaluate(tier=>{let towers=0,wrong=0;window.reviewRoot.scene.traverse(o=>{const u=o.userData.modelUrl;if(!u)return;if(u.includes('townhouse-'))towers++;if(tier==='HIGH'&&u.endsWith('-low.glb'))wrong++;});return towers>=4&&wrong===0;},tier),{timeout:60000}).toBe(true);
  await shot(`river-${tier}`,-28,-44,36,0);await shot(`coast-${tier}`,58,1,53,0);await shot(`leaves-${tier}`,3,1,125,1);await shot(`roof-${tier}`,-15,8.5,100,2.8);
 }

  
  await writeFile(`${out}/runtime.json`,JSON.stringify({stage,profiles:['MINIMUM','HIGH'],renderer:'SwiftShader',errors},null,2));
  if(errors.length)throw Error(errors.join('\n'));console.log('River, coast and foliage rendered in two profiles without WebGL errors.');
}finally{await browser.close();}
