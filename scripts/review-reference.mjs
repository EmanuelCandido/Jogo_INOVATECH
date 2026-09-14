import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const outputArg=process.argv.indexOf('--out');
const out=outputArg>=0?process.argv[outputArg+1]:'docs/screenshots/river-city';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--enable-gpu','--use-angle=d3d11']});
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const width=Number(option('--width','1672')),height=Number(option('--height','941')),quality=option('--quality','ULTRA');
const baseURL=option('--url','http://127.0.0.1:5173');
const angle=option('--angle','isometric'),offset={isometric:[110,130,145],top:[0,220,.001],lateral:[110,36,145]}[angle];
if(!offset||process.argv.includes('--player-camera')&&angle!=='isometric')throw new Error('Inspection angles cannot be used as player-camera evidence');
if(!['MINIMUM','LOW','MEDIUM','HIGH','ULTRA'].includes(quality)||width<320||height<320)throw new Error('Invalid review viewport or quality');
const page=await browser.newPage({viewport:{width,height}}),errors=[];
page.setDefaultTimeout(120000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error(m.text());}});
try{
 await page.goto(`${baseURL.replace(/\/$/,'')}/?benchmark=1`);
 const buildScripts=await page.locator('script[src]').evaluateAll(scripts=>scripts.map(script=>script.getAttribute('src')));
 await page.waitForFunction(()=>window.ecoBenchmark);
 await page.evaluate(quality=>window.ecoBenchmark.setup({quality}),quality);
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await page.waitForFunction(()=>window.ecoBenchmark.ready());
 console.log('shadows',await page.evaluate(()=>window.ecoBenchmark.shadowInfo()));
 await page.evaluate(()=>window.ecoBenchmark.refreshShadows());
 await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
 const h=Math.hypot(110,145),views=process.argv.includes('--circulation')?
  [['overview',3,20,9.5,0],['01-school',-46,-21,39,0],['02-coast-link',48,-23,25,0],['03-dump',97,53,31,0],['04-factories',72,59,29,0],['05-hospital',30,3,29,0],['06-station',8,34,30,1],['07-bridge',-22,-1,30,0],['08-10-campus-crossing',-41,42,31,1],['09-11-west-rail',-67,55,23,3]]:
  process.argv.includes('--overview')?[['overview',3,20,9.5,0]]:[['overview',3,20,9.5,0],['river',-30,13,21,0],['future',-62,52,22,3],['station',10,28,25,1],['industry',79,54,22,3],['coast',53,-43,23,0]];
 const selectedArg=process.argv.indexOf('--views'),selected=selectedArg>=0?new Set(process.argv[selectedArg+1].split(',')):null;
 if(process.argv.includes('--circulation'))views.push(['04-industrial-yard',107,84,24,0],['04-gate-priority',89,80,65,0],['06-platform-supports',1,58,60,3],['reservoir-bank',-36,96,31,4],['02-viaduct-junction',97,-12,24,0],['03-dump-relocated',99,42,29,0]);
 if(process.argv.includes('--circulation'))views.push(['junction-station-bend',-14,20,70,0],['junction-school-bend',-62,-22,65,0],['junction-school-north',-77,4,65,0]);
 if(process.argv.includes('--circulation'))views.push(['structure-bearing-junction',12,-13,75,1]);
 const fit=process.argv.includes('--fit-sector')?Math.min(width/1672,height/941):1;
 const playerCamera=process.argv.includes('--player-camera'),appliedViews=[];
 const activeViews=views.filter(([name])=>!selected||selected.has(name)).map(([name,u,v,zoom,y])=>[name,u,v,zoom*fit,y]);
 for(const [name,u,v,zoom,y]of activeViews){
  const actual=await page.evaluate(([x,z,zoom,y,player,offset])=>{const result=player?window.ecoBenchmark.playerCamera(x,z,zoom):(window.ecoBenchmark.camera(x,z,zoom,y,offset),{x,z,zoom,y,offset});window.ecoBenchmark.start();return result;},[145/h*u-110/h*v,-110/h*u-145/h*v,zoom,y,playerCamera,offset]);
  appliedViews.push({name,...actual});
  await page.waitForTimeout(1000);const stats=await page.evaluate(()=>window.ecoBenchmark.stop());
  await page.screenshot({path:`${out}/${name}.png`});console.log(name,JSON.stringify({calls:stats.calls,triangles:stats.triangles,frame:stats.frame,renderer:await page.evaluate(()=>window.ecoBenchmark.renderer)}));
 }
 await writeFile(`${out}/errors.json`,JSON.stringify(errors,null,2));
 await writeFile(`${out}/configuration.json`,JSON.stringify({baseURL,buildScripts,width,height,quality,fitSector:fit!==1,playerCamera,angle},null,2));
 await writeFile(`${out}/applied-views.json`,JSON.stringify(appliedViews,null,2));
 await writeFile(`${out}/views.json`,JSON.stringify(activeViews.map(([name,u,v,zoom,y])=>({name,u,v,zoom,y})),null,2));
 if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}
