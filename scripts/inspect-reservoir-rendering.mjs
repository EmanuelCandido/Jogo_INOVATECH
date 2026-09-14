import {chromium} from '@playwright/test';
import {OrthographicCamera,Vector3} from 'three';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/screenshots/reservoir-navigation-reproduction';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--enable-gpu','--use-angle=d3d11']});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.setDefaultTimeout(120000);page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
const h=Math.hypot(110,145),world=(u,v,y=0)=>[145/h*u-110/h*v,y,-110/h*u-145/h*v];
const views=[['overview',3,20,9.5],['01-school',-46,-21,39],['02-coast-link',48,-23,25],['05-hospital',30,3,29],['06-station',8,34,30],['07-bridge',-22,-1,30],['08-10-campus-crossing',-41,42,31],['reservoir-bank',-36,96,31]];
try{
 await page.goto('http://127.0.0.1:4174/?benchmark=1');
 await page.waitForFunction(()=>window.ecoBenchmark);
 const build=await page.locator('script[src]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('src')));
 for(const [run,quality] of ['LOW','HIGH','LOW'].entries()){
  await page.evaluate(quality=>window.ecoBenchmark.setup({quality}),quality);
  await page.waitForFunction(()=>window.ecoBenchmark.ready());
  await page.addStyleTag({content:'.interface,.region-label,.marker{visibility:hidden!important}'});
  for(const [name,u,v,zoom] of views){
   const [x,,z]=world(u,v);
   const actual=await page.evaluate(([x,z,zoom])=>{const actual=window.ecoBenchmark.playerCamera(x,z,zoom);window.ecoBenchmark.start();return actual;},[x,z,zoom*390/1672]);
   await page.waitForTimeout(1000);const stats=await page.evaluate(()=>window.ecoBenchmark.stop());
   if(!['07-bridge','08-10-campus-crossing','reservoir-bank'].includes(name))continue;
   const path=`${out}/${run}-${quality}-${name}.png`,buffer=await page.screenshot({path});
   const {data,info}=await sharp(buffer).raw().toBuffer({resolveWithObject:true});
   const camera=new OrthographicCamera(-195,195,422,-422,.1,1000);camera.zoom=actual.zoom;
   camera.position.set(actual.x+110,130,actual.z+145);camera.lookAt(actual.x,0,actual.z);camera.updateProjectionMatrix();camera.updateMatrixWorld();
   const samples=[[-38,100],[-35,103],[-31,102]].flatMap(([u,v])=>{
    const projected=new Vector3(...world(u,v,6.33)).project(camera),x=Math.round((projected.x+1)*195),y=Math.round((1-projected.y)*422);
    if(x<2||x>=info.width-2||y<2||y>=info.height-2)return [];
    const rgb=[0,0,0];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(let c=0;c<3;c++)rgb[c]+=data[((y+dy)*info.width+x+dx)*info.channels+c]/9;
    return [{point:[u,v],pixel:[x,y],rgb,water:rgb[2]>rgb[0]+35&&rgb[1]>rgb[0]+30&&rgb[2]>rgb[1]-30}];
   });
   const result={run,quality,name,actual,samples,settings:stats.settings,path};results.push(result);console.log(JSON.stringify(result));
  }
 }
 await writeFile(`${out}/report.json`,JSON.stringify({build,errors,results},null,2));
 if(errors.length||results.some(r=>r.samples.some(sample=>!sample.water))||results.filter(r=>r.name==='reservoir-bank').some(r=>r.samples.length!==3))process.exitCode=1;
}finally{await browser.close();}
