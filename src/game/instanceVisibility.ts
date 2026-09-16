import {Camera,DynamicDrawUsage,Frustum,InstancedBufferAttribute,InstancedMesh,Matrix4,Sphere} from 'three';
import {SpatialVisibility} from './spatialVisibility';
import {PackedBounds} from './packedBounds';

/** Preserve writes that Three has not uploaded yet (notably shadow frames). */
function queueRange(attribute:InstancedBufferAttribute,start:number,end:number){
 for(const range of attribute.updateRanges){start=Math.min(start,range.start);end=Math.max(end,range.start+range.count);}
 attribute.clearUpdateRanges();attribute.addUpdateRange(start,end-start);attribute.needsUpdate=true;
}

/** Immutable source data + a compact draw buffer. All instances remain resident.
 * Restore all casters for a shadow refresh; the cached shadow survives camera culling.
 */
export class InstanceVisibility {
 readonly matrices:Float32Array;
 readonly colors:Float32Array|null;
 readonly bounds:PackedBounds;
 private clip=new Matrix4();private previous:Matrix4|null=null;
 private frustum=new Frustum();
 private selection:Int32Array;
 private spatial:SpatialVisibility|null=null;
 // Opt-in diagnostic: fewer sphere tests did not improve full-frame navigation.
 private spatialEnabled=false;
 private forceSelect=false;
 sphereTests=0;regionTests=0;
 updates=0;
 constructor(readonly mesh:InstancedMesh){
  this.matrices=new Float32Array(mesh.instanceMatrix.array);
  this.colors=mesh.instanceColor?new Float32Array(mesh.instanceColor.array):null;
  this.selection=Int32Array.from({length:mesh.count},(_,i)=>i);
  mesh.geometry.computeBoundingSphere();const matrix=new Matrix4(),sphere=new Sphere();
  this.bounds=new PackedBounds(mesh.count);
  for(let i=0;i<mesh.count;i++){matrix.fromArray(this.matrices,i*16);this.bounds.set(i,sphere.copy(mesh.geometry.boundingSphere!).applyMatrix4(matrix));}
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.instanceColor?.setUsage(DynamicDrawUsage);
 }
 setSpatial(enabled:boolean){
  if(enabled&&!this.spatial&&this.bounds.length>=96)this.spatial=new SpatialVisibility(this.bounds);
  if(enabled!==this.spatialEnabled){this.spatialEnabled=enabled;this.forceSelect=true;}
 }
 select(camera:Camera){
  this.clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(this.mesh.matrixWorld);
  if(!this.forceSelect&&this.previous&&this.clip.equals(this.previous))return;
  this.forceSelect=false;
  (this.previous??=new Matrix4()).copy(this.clip);this.frustum.setFromProjectionMatrix(this.clip);
  const matrix=this.mesh.instanceMatrix.array as Float32Array,color=this.mesh.instanceColor?.array as Float32Array|undefined;
  const visible=this.spatialEnabled?this.spatial?.select(this.frustum):null;
  this.sphereTests+=visible?this.spatial!.sphereTests:this.bounds.length;
  this.regionTests+=visible?this.spatial!.regionTests:0;
  let count=0,firstChanged=this.bounds.length,lastChanged=-1;
  for(let i=0;i<this.bounds.length;i++)if(visible?visible[i]:this.bounds.intersects(this.frustum,i)){
   // The camera can move while the ordered visible set remains identical.
   // Retain those slots, including a previously hidden tail when it reappears.
   if(this.selection[count]!==i){
    this.selection[count]=i;firstChanged=Math.min(firstChanged,count);lastChanged=count;
    for(let j=0;j<16;j++)matrix[count*16+j]=this.matrices[i*16+j];
    if(color&&this.colors)for(let j=0;j<3;j++)color[count*3+j]=this.colors[i*3+j];
   }
   count++;
  }
  if(this.mesh.count!==count||lastChanged>=0)this.updates++;
  this.mesh.count=count;
  if(lastChanged>=0){
   queueRange(this.mesh.instanceMatrix,firstChanged*16,(lastChanged+1)*16);
   if(color)queueRange(this.mesh.instanceColor!,firstChanged*3,(lastChanged+1)*3);
  }
 }
 restore(){
  if(!this.previous)return;
  this.previous=null;this.mesh.count=this.bounds.length;
  for(let i=0;i<this.selection.length;i++)this.selection[i]=i;
  (this.mesh.instanceMatrix.array as Float32Array).set(this.matrices);
  if(this.matrices.length)queueRange(this.mesh.instanceMatrix,0,this.matrices.length);
  if(this.colors&&this.mesh.instanceColor){(this.mesh.instanceColor.array as Float32Array).set(this.colors);if(this.colors.length)queueRange(this.mesh.instanceColor,0,this.colors.length);}
 }
}

export const instanceVisibility=new Set<InstanceVisibility>();
export function optimizeInstances(mesh:InstancedMesh,count:number){
 mesh.count=count;mesh.computeBoundingSphere();mesh.updateMatrix();mesh.matrixAutoUpdate=false;
 const visibility=new InstanceVisibility(mesh);
 mesh.userData.sourceInstances=count;instanceVisibility.add(visibility);
 return()=>{instanceVisibility.delete(visibility);};
}
