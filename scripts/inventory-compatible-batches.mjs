import {modelIO} from './modelIO.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';

const source=process.argv[2]??'depth-order-desktop',stage=process.argv[3]??'compatible-batches-inventory';
if(![source,stage].every(s=>/^[a-z0-9][a-z0-9_-]*$/i.test(s)))throw new Error('Nome inválido');
const reference=JSON.parse(await readFile(`docs/performance/${source}/results.json`,'utf8'));
const io=modelIO(),models=[];let primitives=0,eligible=0;
for(const url of reference.baseline.modelUrls){
 const name=url.split('/').at(-1);if(!/^[\w-]+\.glb$/.test(name))throw new Error('Modelo inválido');
 const doc=await io.read(`public/assets/models/${name}`),root=doc.getRoot(),groups=new Map();
 const materials=root.listMaterials();
 for(const node of root.listNodes()){
  const mesh=node.getMesh();if(!mesh)continue;
  for(const [index,p] of mesh.listPrimitives().entries()){
   primitives++;const material=p.getMaterial();
   if(root.listAnimations().length||node.getSkin()||p.listTargets().length||p.getMode()!==4||!material||material.getAlphaMode()!=='OPAQUE')continue;
   eligible++;
   // No transform baking: candidates must use exactly the same local-to-model
   // matrix, material object and attribute representation. A later renderer
   // experiment would still need to validate culling, order and images.
   const attributes=p.listSemantics().sort().map(semantic=>{
    const a=p.getAttribute(semantic);return [semantic,a.getType(),a.getComponentType(),a.getNormalized()];
   });
   const key=JSON.stringify([materials.indexOf(material),node.getWorldMatrix(),attributes,!!p.getIndices()]);
   const group=groups.get(key)??{material:material.getName(),matrix:node.getWorldMatrix(),attributes,uses:[],triangles:0};
   const triangles=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3;
   group.uses.push({node:node.getName(),mesh:mesh.getName(),primitive:index,triangles});group.triangles+=triangles;groups.set(key,group);
  }
 }
 const candidates=[...groups.values()].filter(group=>group.uses.length>1).map(group=>({...group,potentialDrawReduction:group.uses.length-1}));
 if(candidates.length)models.push({model:name,potentialDrawReduction:candidates.reduce((n,g)=>n+g.potentialDrawReduction,0),candidates});
}
models.sort((a,b)=>b.potentialDrawReduction-a.potentialDrawReduction);
const result={date:new Date().toISOString(),source,modelCount:reference.baseline.modelUrls.length,primitives,eligible,potentialDrawReduction:models.reduce((n,m)=>n+m.potentialDrawReduction,0),models,readOnly:true,scope:'Same-model opaque primitives with identical transforms and materials. Potential draw reduction per complete asset-batch pass, not measured frame cost; no geometry or source model changed.'};
await mkdir(`docs/performance/${stage}`,{recursive:true});await writeFile(`docs/performance/${stage}/results.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,models:models.map(({model,potentialDrawReduction,candidates})=>({model,potentialDrawReduction,groups:candidates.length}))},null,2));
