import {Quaternion,Euler,Vector3} from 'three';
import {blocksJunctionMarking} from './referenceMap';
import {mapRoads,roadViaduct,nearestRoutePoint,situationAnchors,worldPoint,roadHeightAt,facing,gradedRotation,compositionPoint,distanceToRoute,referenceTraffic,circulationCrossings,placementFootprint,footprintGap,buildingLots} from './referenceMap';
import {lineLength} from './spatial';
import {routeFrame} from './routeFrame';
import {reserveTraffic} from './trafficReservations';
import {viaductTraffic} from './referenceDetails';
import {situationVisuals} from './situationVisuals';
import type {Placement,Vec3} from '../game/types';

const anchor=situationAnchors.pollution_02,road=mapRoads.find(r=>r.id==='avenida-estacao')!;
const closest=nearestRoutePoint(anchor.point,road);
let centre=0,best=Infinity,travel=0;
for(let i=1;i<road.points.length;i++){
 const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
 const t=Math.max(0,Math.min(1,((closest[0]-a[0])*dx+(closest[1]-a[1])*dy)/(length*length||1)));
 const gap=Math.hypot(closest[0]-a[0]-t*dx,closest[1]-a[1]-t*dy);
 if(gap<best){best=gap;centre=travel+t*length;}travel+=length;
}
const origin=new Vector3(...worldPoint(...anchor.point,anchor.y??0));
const inverse=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),-(anchor.yaw??0));
const localPoint=(p:Vec3)=>new Vector3(...p).sub(origin).applyQuaternion(inverse).toArray() as Vec3;
const isVehicle=(p:Placement)=>p.asset.startsWith('prop.car')||p.asset==='prop.bus';
function frame(p:Vec3,vehicle:boolean,offset=0){
 const side=p[2]<0?1:-1;
 const f=routeFrame(road.points,centre+p[0]+offset,side*(vehicle?road.width*.24:road.width/2+1.5),q=>roadHeightAt(road,q));
 return {...f,side,world:worldPoint(...f.point,f.height+p[1]+.04)};
}
function worldAsset(p:Placement,offset=0):Placement{
 const vehicle=isVehicle(p),f=frame(p.position,vehicle,offset);
 return {...p,position:f.world,rotation:vehicle?gradedRotation(facing(...f.tangent)+(f.side<0?Math.PI:0),-Math.atan(f.slope)*f.side):[0,facing(...f.tangent)-Math.PI/2,0]};
}
function localAsset(p:Placement):Placement{
 const q=inverse.clone().multiply(new Quaternion().setFromEuler(new Euler(...p.rotation!))),e=new Euler().setFromQuaternion(q);
 return {...p,position:localPoint(p.position),rotation:[e.x,e.y,e.z]};
}
export function outsideTrafficSituation(p:Placement){
 const uv=compositionPoint(p.position[0],p.position[2]);
 if(distanceToRoute(...uv,road)>road.width/2+1)return true;
 return Math.hypot(uv[0]-closest[0],uv[1]-closest[1])>12;
}
const background=[...referenceTraffic.filter(outsideTrafficSituation),...viaductTraffic];
const overlaps=(a:Placement,b:Placement)=>Math.abs(a.position[1]-b.position[1])<1.5&&footprintGap(placementFootprint(a),placementFootprint(b))<.35;
export const trafficSituation=Object.fromEntries(Object.entries(situationVisuals.pollution_02).map(([key,visual])=>{
 const authored=visual.assets.filter(isVehicle),raw=authored.map(p=>worldAsset(p));
 const cleared=reserveTraffic(raw,p=>{
  const poly=placementFootprint(p);
  return blocksJunctionMarking(p)||background.some(q=>overlaps(p,q))||buildingLots.some(l=>footprintGap(poly,l.footprint)<.3)||circulationCrossings.crossings.some(c=>Math.abs(p.position[1]-roadHeightAt([...mapRoads,roadViaduct].find(r=>r.id===c.road)!,c.point))<1.5&&footprintGap(poly,c.footprint)<.4);
 },(p,offset)=>{
  const source=authored[raw.indexOf(p)],d=centre+source.position[0]+offset;
  return d<2||d>lineLength(road.points)-2?null:worldAsset(source,offset);
 },overlaps,lineLength(road.points));
 let vehicleIndex=0;
 return [key,{
  assets:visual.assets.map(p=>localAsset(isVehicle(p)?cleared[vehicleIndex++]:worldAsset(p))),
  details:visual.details.map(d=>{
   const position=frame(d.position,d.shape==='smoke').world;
   if(d.shape==='smoke'){
    const index=authored.reduce((best,p,i)=>Math.abs(p.position[0]-d.position[0])<Math.abs(authored[best].position[0]-d.position[0])?i:best,0);
    for(let axis=0;axis<3;axis++)position[axis]+=cleared[index].position[axis]-raw[index].position[axis];
   }
   return {...d,position:localPoint(position)};
  }),
 }];
})) as typeof situationVisuals.pollution_02;
