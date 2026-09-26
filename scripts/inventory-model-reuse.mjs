import {modelIO} from './modelIO.mjs';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const source=process.argv[2]??'spatial-selection-cpu',stage=process.argv[3]??'geometry-reuse-inventory';
if(![source,stage].every(s=>/^[a-z0-9][a-z0-9_-]*$/i.test(s)))throw new Error('Nome inválido');
const reference=JSON.parse(await readFile(`docs/performance/${source}/results.json`,'utf8'));
const io=modelIO(),groups=new Map();let primitives=0,totalBytes=0,skippedMorphs=0;
for(const url of reference.baseline.modelUrls){
 const name=url.split('/').at(-1);if(!/^[\w-]+\.glb$/.test(name))throw new Error('Modelo inválido');
 const doc=await io.read(`public/assets/models/${name}`);
 for(const mesh of doc.getRoot().listMeshes())for(const [index,p] of mesh.listPrimitives().entries()){
  if(p.listTargets().length){skippedMorphs++;continue;}
  const hash=createHash('sha256');hash.update(JSON.stringify({mode:p.getMode()}));let bytes=0;
  for(const semantic of ['INDICES',...p.listSemantics().sort()]){
   const a=semantic==='INDICES'?p.getIndices():p.getAttribute(semantic);if(!a)continue;
   const array=a.getArray(),data=Buffer.from(array.buffer,array.byteOffset,array.byteLength);
   hash.update(JSON.stringify([semantic,a.getType(),a.getComponentType(),a.getNormalized(),data.length]));hash.update(data);bytes+=data.length;
  }
  const key=hash.digest('hex'),entry=groups.get(key)??{hash:key,bytes,uses:[]};
  entry.uses.push({model:name,mesh:mesh.getName(),primitive:index,material:p.getMaterial()?.getName()??null});groups.set(key,entry);primitives++;totalBytes+=bytes;
 }
}
const duplicates=[...groups.values()].filter(g=>g.uses.length>1).map(g=>({...g,potentialSavedBytes:g.bytes*(g.uses.length-1)})).sort((a,b)=>b.potentialSavedBytes-a.potentialSavedBytes);
const out={date:new Date().toISOString(),source,modelCount:reference.baseline.modelUrls.length,primitives,totalBytes,uniqueGeometries:groups.size,skippedMorphs,potentialSavedBytes:duplicates.reduce((sum,g)=>sum+g.potentialSavedBytes,0),duplicates,readOnly:true,scope:'Decoded primitive attribute/index bytes, not total VRAM; source model files unchanged'};
await mkdir(`docs/performance/${stage}`,{recursive:true});await writeFile(`docs/performance/${stage}/results.json`,JSON.stringify(out,null,2));
console.log(JSON.stringify({...out,duplicates:duplicates.slice(0,5)},null,2));
