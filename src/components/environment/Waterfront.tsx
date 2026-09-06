import {Box} from '../Asset';
import {AssetBatch} from '../city/AssetBatch';
import {WaterMaterial} from './WaterMaterial';
import type {Placement} from '../../game/types';
const scenery:Placement[]=[
 {asset:'prop.sailboat',position:[67,-.60,2],rotation:[0,-.5,0]},
 {asset:'prop.sailboat',position:[69,-.60,-10],rotation:[0,.7,0]},
 {asset:'prop.beach',position:[55,-.30,1],rotation:[0,-.3,0]},
 {asset:'prop.beach',position:[57,-.30,-5],rotation:[0,.4,0]},
 {asset:'prop.beach',position:[52.5,-.30,5],rotation:[0,.15,0]},
];
const rise=(z:number)=>.12+Math.sin((z+1.5)/3*Math.PI)*.28;
const bridge:Placement[]=[];
for(let i=0;i<15;i++){
 const z=-1.5+i*3/14,y=rise(z),next=z+3/14,slope=Math.atan2(rise(Math.min(1.5,next))-y,3/14);
 bridge.push({asset:'ground.wood',position:[-1.65,y,z],scale:[.86,.08,.199]});
 if(i<14)for(const side of [-1,1]){
  // Continuous rails and structural stringers follow the curved deck.
  for(const height of [-.08,.60])bridge.push({asset:'ground.wood',position:[-1.65+side*.43,y+height+(rise(next)-y)/2,z+3/28],scale:[.06,height<0?.13:.065,Math.hypot(3/14,rise(next)-y)],rotation:[-slope,0,0]});
  bridge.push({asset:'ground.court',position:[-1.65+side*.43,y+.3,z],scale:[.022,.58,.024]});
 }
 if(i%7===0)for(const side of [-1,1]){
  bridge.push({asset:'ground.wood',position:[-1.65+side*.43,(y+.67)/2-.1,z],scale:[.09,y+.87,.09]});
  bridge.push({asset:'ground.sidewalk',position:[-1.65+side*.43,.025,z],scale:[.19,.05,.22]});
 }
}
export function Waterfront(){return <group>
 <AssetBatch placements={scenery}/>
 <group position={[13.5,0,4.7]}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]} scale={[2.75,2.25,1]} receiveShadow><circleGeometry args={[1,56]}/><meshStandardMaterial color='#ded4b7'/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.04,0]} scale={[2.6,2.1,1]}><circleGeometry args={[1,56]}/><WaterMaterial color='#22b9f0'/></mesh>
  <AssetBatch placements={bridge}/>
  <Box at={[-1.65,.04,-1.95]} size={[1.02,.08,.7]} material='sidewalk.default'/>
  <Box at={[-1.65,.04,1.95]} size={[1.02,.08,.7]} material='sidewalk.default'/>
 </group>
</group>;}
