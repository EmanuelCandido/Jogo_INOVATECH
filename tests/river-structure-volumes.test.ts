import {expect,it} from 'vitest';
import {Box3,Euler,Matrix4,Quaternion,Vector3} from 'three';
import {OBB} from 'three/examples/jsm/math/OBB.js';
import {layoutFor} from '../src/assets/modelLayout';
import {riverCorridors,facing} from '../src/config/referenceMap';
import {roadStructures} from '../src/config/roadStructures';
import {ribbon} from '../src/components/environment/referenceGeometry';

function orientedBox(local:Box3,position:Vector3,rotation:Quaternion,scale=new Vector3(1,1,1)){
 const matrix=new Matrix4().compose(position,rotation,scale);
 const obb=new OBB().fromBox3(local).applyMatrix4(matrix);
 obb.center.copy(local.getCenter(new Vector3()).applyMatrix4(matrix));
 return {obb,box:local.clone().applyMatrix4(matrix)};
}

it('reserva a largura e altura inteiras dos passeios e ciclovias contra todas as peças estruturais',()=>{
 const structures=roadStructures.map(p=>{
  const b=layoutFor(p.asset)!.bounds;
  return {p,...orientedBox(new Box3(new Vector3(...b.min),new Vector3(...b.max)),new Vector3(...p.position),new Quaternion().setFromEuler(new Euler(...(p.rotation??[0,0,0]))),new Vector3(...(p.scale??[1,1,1])))};
 });
 const conflicts=[];
 for(const corridor of riverCorridors)for(const kind of ['cycle','walk'] as const){
  const points=corridor[kind],width=kind==='cycle'?corridor.cycleWidth:corridor.walkWidth,floor=kind==='cycle'?.052:.017;
  const geometry=ribbon(points,width,floor),positions=geometry.getAttribute('position');
  // The cyclist/person geometry stays below 1.60; include 0.30 headroom.
  // Every full segment is checked, not only the centre of a crossing.
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],rotation=new Quaternion().setFromEuler(new Euler(0,facing(b[0]-a[0],b[1]-a[1]),0)),inverse=rotation.clone().invert(),local=new Box3();
   // Include the rendered corner joins, which extend beyond the rectangle
   // centred on the route segment when the bank bends.
   for(let vertex=(i-1)*2;vertex<=i*2+1;vertex++)local.expandByPoint(new Vector3().fromBufferAttribute(positions,vertex).applyQuaternion(inverse));
   local.max.y+=1.9;
   const passage=orientedBox(local,new Vector3(),rotation);
   for(const s of structures)if(passage.box.intersectsBox(s.box)&&passage.obb.intersectsOBB(s.obb))conflicts.push({side:corridor.side,kind,segment:i,structure:s.p.asset,at:s.p.position});
  }
  geometry.dispose();
 }
 expect(conflicts).toEqual([]);
});
