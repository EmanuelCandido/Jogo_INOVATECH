import {Box3,Vector3,type Frustum} from 'three';
import type {PackedBounds} from './packedBounds';

type Region={box:Box3;start:number;end:number;left?:Region;right?:Region};
/** Spatial index over immutable source bounds. Only the visibility flags change;
 * the caller still emits instances in their original order for identical pixels.
 */
export class SpatialVisibility {
 readonly visible:Uint8Array;
 private readonly order:Uint32Array;
 private readonly root:Region;
 sphereTests=0;regionTests=0;
 constructor(private readonly bounds:PackedBounds){
  this.visible=new Uint8Array(bounds.length);this.order=Uint32Array.from({length:bounds.length},(_,i)=>i);
  const data=bounds.values;
  const build=(start:number,end:number):Region=>{
   const box=new Box3(),point=new Vector3();
   for(let i=start;i<end;i++){
    const offset=this.order[i]*4,x=data[offset],y=data[offset+1],z=data[offset+2],radius=data[offset+3];
    box.expandByPoint(point.set(x,y,z).addScalar(radius));box.expandByPoint(point.set(x,y,z).addScalar(-radius));
   }
   const region:Region={box,start,end};
   if(end-start>24){
    const size=box.getSize(point),axis=size.x>=size.y&&size.x>=size.z?0:size.y>=size.z?1:2;
    this.order.subarray(start,end).sort((a,b)=>data[a*4+axis]-data[b*4+axis]||a-b);
    const middle=(start+end)>>>1;region.left=build(start,middle);region.right=build(middle,end);
   }
   return region;
  };
  this.root=build(0,bounds.length);
 }
 select(frustum:Frustum){
  this.sphereTests=0;this.regionTests=0;this.visible.fill(0);
  const visit=(region:Region)=>{
   this.regionTests++;
   const {min,max}=region.box;let inside=true;
   for(const plane of frustum.planes){
    const n=plane.normal;
    const far=n.x*(n.x>=0?max.x:min.x)+n.y*(n.y>=0?max.y:min.y)+n.z*(n.z>=0?max.z:min.z)+plane.constant;
    // Conservative margins at the region boundary; exact legacy sphere tests
    // handle borderline regions and retain the original inclusion decision.
    if(far< -1e-7)return;
    const near=n.x*(n.x>=0?min.x:max.x)+n.y*(n.y>=0?min.y:max.y)+n.z*(n.z>=0?min.z:max.z)+plane.constant;
    if(near<1e-7)inside=false;
   }
   if(inside){for(let i=region.start;i<region.end;i++)this.visible[this.order[i]]=1;return;}
   if(region.left){visit(region.left);visit(region.right!);return;}
   for(let i=region.start;i<region.end;i++){const id=this.order[i];this.sphereTests++;this.visible[id]=+this.bounds.intersects(frustum,id);}
  };
  if(this.bounds.length)visit(this.root);return this.visible;
 }
}
