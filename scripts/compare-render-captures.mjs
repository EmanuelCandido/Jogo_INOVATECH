import sharp from 'sharp';
import {readdir,writeFile} from 'node:fs/promises';

const [before,after]=process.argv.slice(2);
if(![before,after].every(s=>s&&/^[a-z0-9][a-z0-9_-]*$/i.test(s)))throw new Error('Informe os nomes das duas medições');
const root='docs/performance',names=(await readdir(`${root}/${before}`)).filter(n=>n.endsWith('.png')).sort();
if(!names.length)throw new Error('Nenhuma captura de referência');
const results=[];
for(const name of names){
 const [a,b]=await Promise.all([before,after].map(stage=>sharp(`${root}/${stage}/${name}`).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
 if(JSON.stringify(a.info)!==JSON.stringify(b.info))throw new Error(`Dimensões diferentes: ${name}`);
 let sum=0,max=0,changedChannels=0,changedPixels=0;
 for(let i=0;i<a.data.length;i+=4){
  let changed=false;
  for(let c=0;c<4;c++){const delta=Math.abs(a.data[i+c]-b.data[i+c]);sum+=delta;max=Math.max(max,delta);if(delta){changedChannels++;changed=true;}}
  if(changed)changedPixels++;
 }
 results.push({name,width:a.info.width,height:a.info.height,mae:sum/a.data.length,max,changedChannels,changedPixels});
}
await writeFile(`${root}/${after}/image-comparison.json`,JSON.stringify({before,after,results},null,2));
console.log(JSON.stringify(results,null,2));
