import type {Frustum,Sphere} from 'three';

/** Four doubles per source sphere, without a Sphere/Vector3 pair per instance.
 * Float64 retains the original transformed bounds, including tangent edges.
 */
export class PackedBounds {
 readonly values:Float64Array;
 constructor(readonly length:number){this.values=new Float64Array(length*4);}
 set(index:number,sphere:Sphere){
  const offset=index*4,{center,radius}=sphere,data=this.values;
  data[offset]=center.x;data[offset+1]=center.y;data[offset+2]=center.z;data[offset+3]=radius;
 }
 intersects(frustum:Frustum,index:number){
  const offset=index*4,data=this.values,x=data[offset],y=data[offset+1],z=data[offset+2],negativeRadius=-data[offset+3];
  // Same operation order and strict comparison as Three's intersectsSphere /
  // Plane.distanceToPoint. No rounding, epsilon or approximate plane test.
  for(let i=0;i<6;i++){
   const plane=frustum.planes[i],n=plane.normal;
   if(n.x*x+n.y*y+n.z*z+plane.constant<negativeRadius)return false;
  }
  return true;
 }
}
