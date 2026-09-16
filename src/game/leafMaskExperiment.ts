import {Mesh,MeshStandardMaterial,type Object3D} from 'three';

/** Diagnostic candidate: the caller multiplies the leaf tone by this mask.
 * Derivatives and shape calculations stay before the conditional return.
 * No detail, projection, model, texture or filter is removed.
 */
export function skipEmptyLeafTones(scene:Object3D){
 const materials=new Set<MeshStandardMaterial>();
 scene.traverse(object=>{
  if(!(object instanceof Mesh))return;
  for(const material of Array.isArray(object.material)?object.material:[object.material])
   if(material instanceof MeshStandardMaterial&&material.customProgramCacheKey().startsWith('foliage-painted-v3-'))materials.add(material);
 });
 const restore:Array<()=>void>=[];
 for(const material of materials){
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey;
  material.onBeforeCompile=function(shader,renderer){
   compile.call(this,shader,renderer);
   const before='float midrib=(1.-smoothstep(.008,.018+aa,abs(q.x)))*mask;';
   if(!shader.fragmentShader.includes(before))throw new Error('Leaf tone shader not recognized');
   shader.fragmentShader=shader.fragmentShader.replace(before,`if(mask==0.)return vec2(0.);\n      ${before}`);
  };
  material.customProgramCacheKey=()=>`${key.call(material)}-empty-mask-v1`;material.needsUpdate=true;
  restore.push(()=>{material.onBeforeCompile=compile;material.customProgramCacheKey=key;material.needsUpdate=true;});
 }
 return {materials:materials.size,dispose(){restore.splice(0).forEach(fn=>fn());}};
}
