// Compiled-app visual/save audit. A fresh browser context owns every fixture;
// the user's open game and storage are never read or modified.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const baseURL=option('--url','http://127.0.0.1:4174'),out=option('--out','docs/screenshots/circulation-state-review');
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},plugins:[{
 name:'review-prepared-population',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/config/referenceMap.ts'))return code.replaceAll('import.meta.env?.SSR','false');},
}]});
let sites;
try{const {problems}=await server.ssrLoadModule('/src/content/problems.ts');sites=problems.map(({id,camera})=>({id,camera}));}finally{await server.close();}
const browser=await chromium.launch({args:['--enable-gpu','--use-angle=d3d11']});
const results=[];
try{
 for(const [screen,width,height]of [['desktop',1672,941],['mobile',390,844]])for(const quality of ['HIGH','LOW']){
  const name=`${screen}-${quality.toLowerCase()}`,directory=`${out}/${name}`;await mkdir(directory,{recursive:true});
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.url().includes('/assets/models/')&&!r.ok())errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(`${baseURL}/?benchmark=1`);await page.waitForFunction(()=>window.ecoBenchmark);
  await page.evaluate(quality=>window.ecoBenchmark.setup({quality}),quality);
  await page.waitForFunction(()=>window.ecoBenchmark.ready());
  const initial=await page.evaluate(()=>window.ecoBenchmark.reviewState().progress);
  const buildScripts=await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));
  const states=[];
  for(const [stage,value]of [['initial','AVAILABLE'],['temporary','TEMPORARILY_SOLVED'],['solved','SOLVED']]){
   const progress={...initial,phase:'OVERVIEW',selectedProblem:null,problemStates:Object.fromEntries(sites.map(p=>[p.id,value]))};
   await page.evaluate(progress=>localStorage.setItem('ecoquest.save.v1',JSON.stringify({version:1,data:progress})),progress);
   await page.reload();await page.waitForFunction(()=>window.ecoBenchmark?.ready());
   // Commit with the real game's save writer, then validate another load.
   await page.evaluate(()=>window.ecoBenchmark.settings({showPerformance:false}));
   await page.reload();await page.waitForFunction(()=>window.ecoBenchmark?.ready());
   await expect.poll(async()=>await page.evaluate(()=>window.ecoBenchmark.reviewState().situations.map(s=>s.visualState))).toEqual(sites.map(()=>stage));
   const actual=await page.evaluate(()=>window.ecoBenchmark.reviewState());
   expect(actual.progress.problemStates).toEqual(progress.problemStates);expect(actual.dumpStage).toBe(stage);
   expect(actual.progress.settings.quality).toBe(quality);
   await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
   const views=[];
   for(const site of sites){
    const c=site.camera,fit=width<=650?Math.min(width/500,height/270,1):Math.min(width/1100,height/760,1.25);
    const [x,y,z]=c.target,offset=c.position.map((n,i)=>n-c.target[i]),zoom=c.zoom*fit;
    await page.evaluate(({x,y,z,zoom,offset})=>{window.ecoBenchmark.camera(x,z,zoom,y,offset);window.ecoBenchmark.refreshShadows();window.ecoBenchmark.start();},{x,y,z,zoom,offset});
    await page.waitForTimeout(500);await page.evaluate(()=>window.ecoBenchmark.stop());
    await page.screenshot({path:`${directory}/${site.id}-${stage}.png`});views.push({id:site.id,target:c.target,offset,zoom});
   }
   states.push({stage,restored:true,dumpStage:actual.dumpStage,situations:actual.situations,views});console.log(name,stage,'10 mission cameras and saved state verified');
  }
  const result={name,width,height,quality,baseURL,buildScripts,fixture:'All ten states loaded, committed by graphics(), reloaded; gameplay decisions tested separately by E2E',states,errors};
  await writeFile(`${directory}/report.json`,JSON.stringify(result,null,2));results.push(result);await context.close();
  if(errors.length)throw new Error(errors.join('\n'));
 }
 await mkdir(out,{recursive:true});await writeFile(`${out}/report.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
