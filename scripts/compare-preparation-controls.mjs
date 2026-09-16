import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

// Both older captures used whole-scene warmup. Check their existing variation
// before attributing a difference between separate browser sessions to a change.
const cases=[
 ['leaf-hashes-reuse-images','-original','leaf-cells-images','-original'],
 ['isolated-models-cached','-original','leaf-cells-images','-original'],
 ['leaf-hashes-reuse-images','-original','preparation-images',''],
];
const results=[];
for(const [before,beforeSuffix,after,afterSuffix]of cases){
 const comparisons=[];
 for(const name of ['overview','centre','forest','industry','beach','river','forest-close','centre-close']){
  const a=await sharp(`docs/performance/${before}/${name}${beforeSuffix}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const b=await sharp(`docs/performance/${after}/${name}${afterSuffix}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual(a.info,b.info);let changedPixels=0,max=0;
  for(let i=0;i<a.data.length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(a.data[i+c]-b.data[i+c]);max=Math.max(max,d);changed ||= d!==0;}if(changed)changedPixels++;}
  comparisons.push({name,changedPixels,max});
 }
 results.push({before,after,comparisons});console.log(JSON.stringify(results.at(-1)));
}
await writeFile('docs/performance/preparation-images/control-comparison.json',JSON.stringify({date:new Date().toISOString(),results},null,2));
for(const comparison of results.at(-1).comparisons)assert.equal(comparison.changedPixels,0,comparison.name);
