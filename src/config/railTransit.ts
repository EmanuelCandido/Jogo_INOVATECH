import type {Placement,Vec3} from '../game/types';
import type {LandscapeDetail} from './landscape';
import {railCurve,railDeckTop,stationPosition} from './railway';
import {roadPlacements,infrastructure} from './infrastructure';
import {terrainHeight} from './terrain';

export const railStructure:LandscapeDetail[]=[];
export const railSupports:Placement[]=[];
export const railAssets:Placement[]=[{asset:'building.station',position:stationPosition}];
const length=railCurve.getLength();
const box=(position:Vec3,scale:Vec3,color:string,rotation?:Vec3)=>railStructure.push({shape:'box',position,scale,color,rotation});
for(let d=0;d<length;d+=.42){
 const t=Math.min(1,(d+.21)/length),p=railCurve.getPointAt(t),v=railCurve.getTangentAt(t),rotation:Vec3=[0,Math.atan2(v.x,v.z),0];
 box([p.x,railDeckTop-.15,p.z],[1.6,.30,.46],'#e5ece5',rotation);
 for(const side of [-1,1]){
  box([p.x+v.z*.33*side,railDeckTop+.055,p.z-v.x*.33*side],[.045,.05,.46],'#77929c',rotation);
  // The station platform edges replace viaduct parapets beside the doors.
  if(p.x<-18.5)box([p.x+v.z*.77*side,railDeckTop+.16,p.z-v.x*.77*side],[.075,.32,.46],'#f4f6ee',rotation);
 }
 if(Math.round(d/.42)%2===0)box([p.x,railDeckTop+.018,p.z],[1.05,.035,.09],'#a2b9b9',rotation);
}
// Choose actual dry ground between streets; never place a support on a sidewalk.
for(let d=4;d<length-8;d+=.4){
 const p=railCurve.getPointAt(d/length);
 if(railSupports.some(s=>Math.hypot(p.x-s.position[0],p.z-s.position[2])<6.2))continue;
 if([...roadPlacements,...infrastructure.filter(s=>s.asset==='ground.sidewalk')].some(s=>Math.abs(p.x-s.position[0])<s.scale![0]/2+.75&&Math.abs(p.z-s.position[2])<s.scale![2]/2+.75))continue;
 const ground=terrainHeight(p.x,p.z);if(ground>.1)continue;
 railSupports.push({asset:'ground.sidewalk',position:[p.x,.07,p.z],scale:[1.1,.14,1.05]});
 box([p.x,1.99,p.z],[.32,3.84,.38],'#f4f6ee');
 box([p.x,3.85,p.z],[.5,.15,1.38],'#c5d9d6');
}
railAssets.push(...railSupports);
// South lift opens onto the campus pavement; north lift joins the east sidewalk.
railAssets.push(
 {asset:'ground.sidewalk',position:[-12.4,.06,-33.48],scale:[.88,.12,.55]},
 {asset:'ground.sidewalk',position:[-11.86,.06,-38.25],scale:[1.4,.12,.64]},
 {asset:'prop.charger',position:[-17.6,.12,-34.05],scale:[.7,.7,.7]},
);
// Terminal buffer and two complete driver-ended train sets, all quality tiers.
box([-11.65,railDeckTop+.36,-36],[.13,.55,.85],'#edb759');
for(const offset of [10,29])for(let i=0;i<3;i++){
 const t=(offset+i*2.83)/length,p=railCurve.getPointAt(t),v=railCurve.getTangentAt(t);
 railAssets.push({asset:i===1?'prop.train':'prop.trainCab',position:[p.x,railDeckTop+.035,p.z],scale:[.9,.9,.9],rotation:[0,Math.atan2(v.x,v.z)+(i===0?Math.PI:0),0]});
}
