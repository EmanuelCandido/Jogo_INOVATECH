import {BatchedMesh,Matrix4,MeshStandardMaterial,type BufferAttribute,type Object3D,type Scene} from 'three';
import {instanceVisibility,type InstanceVisibility} from './instanceVisibility';

// These diagnostic batches are immutable until disposal. Keep the camera's
// selection for both depth/color passes and static frames; shadow cameras must
// rebuild it and the following camera pass must recover its own selection.
function cacheSelection(batch:BatchedMesh){
 const prepare=batch.onBeforeRender,projection=new Matrix4(),view=new Matrix4(),world=new Matrix4();
 let valid=false,coordinateSystem=0,reversed=false;
 batch.onBeforeRender=function(...args){
  const camera=args[2];
  if('isArrayCamera' in camera){valid=false;return prepare.apply(this,args);}
  if(valid&&coordinateSystem===camera.coordinateSystem&&reversed===camera.reversedDepth&&projection.equals(camera.projectionMatrix)&&view.equals(camera.matrixWorldInverse)&&world.equals(this.matrixWorld))return;
  prepare.apply(this,args);
  projection.copy(camera.projectionMatrix);view.copy(camera.matrixWorldInverse);world.copy(this.matrixWorld);
  coordinateSystem=camera.coordinateSystem;reversed=camera.reversedDepth;valid=true;
 };
}

/** Diagnostic only. Retain source meshes/resources for exact restoration. */
export function batchIsolatedModels(scene:Scene){
 const identity=new Matrix4(),groups=new Map<string,InstanceVisibility[]>();
 scene.updateMatrixWorld(true);
 for(const entry of instanceVisibility){
  const mesh=entry.mesh,material=mesh.material;
  if(entry.bounds.length!==1||!mesh.visible||mesh.layers.mask!==1||!mesh.parent?.userData.modelUrl||!mesh.matrixWorld.equals(identity)||mesh.instanceColor||Array.isArray(material)||!(material instanceof MeshStandardMaterial)||material.transparent||Object.keys(mesh.geometry.morphAttributes).length||mesh.geometry.drawRange.start!==0||Number.isFinite(mesh.geometry.drawRange.count))continue;
  let hiddenAncestor=false;for(let parent:Object3D|null=mesh.parent;parent;parent=parent.parent)hiddenAncestor ||= !parent.visible||parent.renderOrder!==0;
  if(hiddenAncestor)continue;
  const attributes=Object.entries(mesh.geometry.attributes);
  const schema=attributes.sort(([a],[b])=>a.localeCompare(b)).map(([name,a])=>[name,a.itemSize,a.normalized,(a as BufferAttribute).array.constructor.name]);
  const key=JSON.stringify([material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,!!mesh.geometry.index,schema]);
  const group=groups.get(key)??[];group.push(entry);groups.set(key,group);
 }
 const restore:Array<()=>void>=[];let sourceDraws=0,batchDraws=0;
 try{
  for(const entries of groups.values()){
   if(entries.length<4)continue;
   const first=entries[0].mesh;
   const vertices=entries.reduce((sum,e)=>sum+e.mesh.geometry.attributes.position.count,0);
   const indices=entries.reduce((sum,e)=>sum+(e.mesh.geometry.index?.count??0),0);
   const batch=new BatchedMesh(entries.length,vertices,indices,first.material as MeshStandardMaterial);
   batch.name='diagnostic-isolated-models';batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;batch.matrixAutoUpdate=false;
   const hidden:InstanceVisibility[]=[];
   restore.push(()=>{batch.removeFromParent();batch.dispose();for(const e of hidden){e.mesh.visible=true;instanceVisibility.add(e);}});
   const matrix=new Matrix4();
   for(const entry of entries){
    const geometry=batch.addGeometry(entry.mesh.geometry),id=batch.addInstance(geometry);
    batch.setMatrixAt(id,matrix.fromArray(entry.matrices));
   }
   cacheSelection(batch);
   scene.add(batch);
   for(const entry of entries){entry.mesh.visible=false;instanceVisibility.delete(entry);hidden.push(entry);}
   sourceDraws+=entries.length;batchDraws++;
  }
 }catch(error){restore.reverse().forEach(fn=>fn());throw error;}
 return {sourceDraws,batchDraws,dispose:()=>{restore.splice(0).reverse().forEach(fn=>fn());}};
}
