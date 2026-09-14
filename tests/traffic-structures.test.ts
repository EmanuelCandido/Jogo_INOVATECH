import {describe,it,expect} from 'vitest';
import {Box3,Euler,Matrix4,Quaternion,Vector3} from 'three';
import {OBB} from 'three/examples/jsm/math/OBB.js';
import {attachmentWorld,layoutFor} from '../src/assets/modelLayout';
import {referenceTraffic,referenceTrees,situationAnchors,worldPoint} from '../src/config/referenceMap';
import {trafficSituation} from '../src/config/trafficSituation';
import {viaductTraffic,riversideAssets} from '../src/config/referenceDetails';
import {roadStructures} from '../src/config/roadStructures';
import type {Placement} from '../src/game/types';

function volume(p:Placement){
 const bounds=layoutFor(p.asset)!.bounds;
 const local=new Box3(new Vector3(...bounds.min),new Vector3(...bounds.max));
 const matrix=new Matrix4().compose(new Vector3(...p.position),new Quaternion().setFromEuler(new Euler(...(p.rotation??[0,0,0]))),new Vector3(...(p.scale??[1,1,1])));
 const obb=new OBB().fromBox3(local).applyMatrix4(matrix),box=new Box3();
 // OBB.applyMatrix4 translates its centre but does not rotate/scale an
 // off-origin centre. Exported assets often have their origin at the floor.
 obb.center.copy(local.getCenter(new Vector3()).applyMatrix4(matrix));
 for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]])box.expandByPoint(new Vector3(...attachmentWorld(p,[x,y,z])));
 return {obb,box};
}
describe('volumes de tráfego e estruturas',()=>{
 it('não deixa copas atravessarem tabuleiros elevados',()=>{
  const decks=roadStructures.filter(p=>p.asset==='prop.roadDeck'&&p.position[1]>.4).map(p=>({p,...volume(p)}));
  const conflicts=[];
  for(const tree of [...referenceTrees,...riversideAssets.filter(p=>p.asset.startsWith('tree.'))]){
   const t=volume(tree);
   for(const deck of decks)if(t.box.intersectsBox(deck.box)&&t.obb.intersectsOBB(deck.obb))conflicts.push({tree:tree.asset,at:tree.position,deck:deck.p.position});
  }
  expect(referenceTrees).toHaveLength(5686);
  expect(conflicts).toEqual([]);
 });
 it('mantém os veículos fora de tabuleiros, vigas e fundações, incluindo peças inclinadas',()=>{
  const structures=roadStructures.map(p=>({p,...volume(p)})),conflicts=[];
  const anchor=situationAnchors.pollution_02,origin=new Vector3(...worldPoint(...anchor.point,anchor.y??0)),orientation=new Quaternion().setFromEuler(new Euler(0,anchor.yaw??0,0));
  const missionVehicles=Object.values(trafficSituation).flatMap(state=>state.assets.filter(p=>p.asset.startsWith('prop.car')||p.asset==='prop.bus').map(p=>{
   const position=new Vector3(...p.position).applyQuaternion(orientation).add(origin).toArray() as [number,number,number];
   const rotation=new Euler().setFromQuaternion(orientation.clone().multiply(new Quaternion().setFromEuler(new Euler(...(p.rotation??[0,0,0])))));
   return {...p,position,rotation:[rotation.x,rotation.y,rotation.z] as [number,number,number]};
  }));
  for(const vehicle of [...referenceTraffic,...viaductTraffic,...missionVehicles]){
   const v=volume(vehicle);
   for(const s of structures)if(v.box.intersectsBox(s.box)&&v.obb.intersectsOBB(s.obb))conflicts.push({vehicle:vehicle.asset,at:vehicle.position,structure:s.p.asset,structureAt:s.p.position});
  }
  expect(conflicts).toEqual([]);
 });
});
