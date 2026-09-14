import {Camera,DynamicDrawUsage,Frustum,InstancedMesh,Matrix4,Sphere} from 'three';

/** Immutable source data + a compact draw buffer. All instances remain resident.
 * Restore all casters for a shadow refresh; the cached shadow survives camera culling.
 */
export class InstanceVisibility {
 readonly matrices:Float32Array;
 readonly colors:Float32Array|null;
 readonly bounds:Sphere[]=[];
 private clip=new Matrix4();private previous:Matrix4|null=null;
 private frustum=new Frustum();
 updates=0;
 constructor(readonly mesh:InstancedMesh){
  this.matrices=new Float32Array(mesh.instanceMatrix.array);
  this.colors=mesh.instanceColor?new Float32Array(mesh.instanceColor.array):null;
  mesh.geometry.computeBoundingSphere();const matrix=new Matrix4();
  for(let i=0;i<mesh.count;i++){matrix.fromArray(this.matrices,i*16);this.bounds.push(mesh.geometry.boundingSphere!.clone().applyMatrix4(matrix));}
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.instanceColor?.setUsage(DynamicDrawUsage);
 }
 select(camera:Camera){
  this.clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(this.mesh.matrixWorld);
  if(this.previous&&this.clip.equals(this.previous))return;
  (this.previous??=new Matrix4()).copy(this.clip);this.frustum.setFromProjectionMatrix(this.clip);
  const matrix=this.mesh.instanceMatrix.array as Float32Array,color=this.mesh.instanceColor?.array as Float32Array|undefined;
  let count=0;
  for(let i=0;i<this.bounds.length;i++)if(this.frustum.intersectsSphere(this.bounds[i])){
   for(let j=0;j<16;j++)matrix[count*16+j]=this.matrices[i*16+j];
   if(color&&this.colors)for(let j=0;j<3;j++)color[count*3+j]=this.colors[i*3+j];
   count++;
  }
  this.mesh.count=count;this.updates++;
  if(count){
   this.mesh.instanceMatrix.clearUpdateRanges();this.mesh.instanceMatrix.addUpdateRange(0,count*16);this.mesh.instanceMatrix.needsUpdate=true;
   if(color){this.mesh.instanceColor!.clearUpdateRanges();this.mesh.instanceColor!.addUpdateRange(0,count*3);this.mesh.instanceColor!.needsUpdate=true;}
  }
 }
 restore(){
  if(!this.previous)return;
  this.previous=null;this.mesh.count=this.bounds.length;
  (this.mesh.instanceMatrix.array as Float32Array).set(this.matrices);
  this.mesh.instanceMatrix.clearUpdateRanges();this.mesh.instanceMatrix.needsUpdate=true;
  if(this.colors&&this.mesh.instanceColor){(this.mesh.instanceColor.array as Float32Array).set(this.colors);this.mesh.instanceColor.clearUpdateRanges();this.mesh.instanceColor.needsUpdate=true;}
 }
}

export const instanceVisibility=new Set<InstanceVisibility>();
export function optimizeInstances(mesh:InstancedMesh,count:number){
 mesh.count=count;mesh.computeBoundingSphere();mesh.updateMatrix();mesh.matrixAutoUpdate=false;
 const visibility=new InstanceVisibility(mesh);
 mesh.userData.sourceInstances=count;instanceVisibility.add(visibility);
 return()=>{instanceVisibility.delete(visibility);};
}
