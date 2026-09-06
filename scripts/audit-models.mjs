import {NodeIO} from '@gltf-transform/core';
import {readdir,writeFile,stat} from 'node:fs/promises';
const io=new NodeIO(),report=[];
for(const name of (await readdir('public/assets/models')).filter(x=>x.endsWith('.glb'))){
  const file=`public/assets/models/${name}`,doc=await io.read(file);
  let vertices=0,triangles=0,primitives=0;
  for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
    const position=p.getAttribute('POSITION'),normal=p.getAttribute('NORMAL'),ao=p.getAttribute('COLOR_0');
    if(!position||!normal||!ao)throw new Error(`${name}: missing position, normal or baked shading`);
    if(normal.getCount()!==position.getCount()||ao.getCount()!==position.getCount())throw new Error(`${name}: mismatched attributes`);
    if(!position.getArray().every(Number.isFinite))throw new Error(`${name}: nonfinite vertices`);
    if(p.getIndices() && !p.getIndices().getArray().every(i=>i<position.getCount()))throw new Error(`${name}: invalid index`);
    vertices+=position.getCount();triangles+=(p.getIndices()?.getCount()??position.getCount())/3;primitives++;
  }
  report.push({name,bytes:(await stat(file)).size,vertices,triangles,primitives,bakedOcclusion:true});
}
await writeFile('assets-source/model-audit.json',JSON.stringify(report,null,2));
console.log({models:report.length,bytes:report.reduce((s,x)=>s+x.bytes,0),triangles:report.reduce((s,x)=>s+x.triangles,0),allHaveBakedOcclusion:true});
