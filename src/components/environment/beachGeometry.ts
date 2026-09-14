import {BufferGeometry,Float32BufferAttribute,Vector3} from 'three';
import {coastline} from '../../config/terrain';

export const beachRows=coastline.filter(p=>p.z>-8&&p.z<11);
export const beachColumns=16;
// Keep the furniture terrace level; only the seaward third slopes below the sea.
export function beachHeight(u:number){return -.31-.58*Math.pow(Math.max(0,(u-.64)/.36),1.4);}
export function beachGeometry(){
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
 let distance=0;
 beachRows.forEach((p,i)=>{
  if(i)distance+=p.distanceTo(beachRows[i-1]);
  const t=beachRows[Math.min(i+1,beachRows.length-1)].clone().sub(beachRows[Math.max(0,i-1)]).normalize();
  const out=new Vector3(t.z,0,-t.x),width=4.3*Math.pow(Math.sin(i/(beachRows.length-1)*Math.PI),.6);
  for(let j=0;j<=beachColumns;j++){
   const u=j/beachColumns,q=p.clone().addScaledVector(out,width*u);
   positions.push(q.x,beachHeight(u),q.z);uvs.push(distance,u);
   if(i&&j){const k=i*(beachColumns+1)+j,n=beachColumns+1;indices.push(k-n-1,k-1,k-n,k-n,k-1,k);}
  }
 });
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
