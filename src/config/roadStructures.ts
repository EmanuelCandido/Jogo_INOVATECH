import {mapRoads,roadViaduct,monorail,centralRail,routeHeight,roadHeightAt,worldPoint,facing,gradedRotation,onReferenceLand,terrainY,riverCorridors,pedestrianNetwork,placementFootprint,buildingLots,stationAccessLots,stationConcourses,type MapPoint,type MapRoute} from './referenceMap';
import {sampleLine,lineLength,corridorGap,polygonGap} from './spatial';
import type {Placement} from '../game/types';
import {attachmentWorld,layoutFor} from '../assets/modelLayout';
import {compositionPoint} from './referenceMap';
import {roadHeightSampler} from './roadProfiles';
import {railFacilities} from './referenceMap';
import {stationSlabThickness} from './stationPerimeters';

export const roadStructures:Placement[]=[],structuralSupports:{road:string;point:MapPoint;bottom:number;top:number;footprint:MapPoint[];parts:Placement[]}[]=[];
export function supportPartsOverlap(a:Placement,b:Placement){
 const height=(p:Placement)=>{const bounds=layoutFor(p.asset)!.bounds;return [p.position[1]+bounds.min[1]*(p.scale?.[1]??1),p.position[1]+bounds.max[1]*(p.scale?.[1]??1)];};
 const ah=height(a),bh=height(b);
 return Math.min(ah[1],bh[1])-Math.max(ah[0],bh[0])>.01&&polygonGap(placementFootprint(a),placementFootprint(b))<.02;
}
const add=(asset:string,p:MapPoint,y:number,scale:[number,number,number],yaw:number,pitch=0)=>{
 const placement:Placement={asset,position:worldPoint(...p,y),scale,rotation:gradedRotation(yaw,pitch)};roadStructures.push(placement);return placement;
};
const pathBlocked=(poly:MapPoint[])=>riverCorridors.some(c=>corridorGap(poly,c.walk,c.walkWidth)<.3||corridorGap(poly,c.cycle,c.cycleWidth)<.4)||pedestrianNetwork.links.some(l=>corridorGap(poly,[...l.points,l.sidewalk],1.4)<.3);
const streetFloor=roadHeightSampler(mapRoads.map(r=>({...r,heights:r.points.map((_,i)=>routeHeight(r,i))})));
export const fittedJunctionDecks:Placement[]=[];

const platformRoutes:MapRoute[]=railFacilities.map((s,i)=>({id:'platform-'+i,kind:'walk',width:1.44,elevation:s.height,points:s.footprint.slice(0,23).map((p,j)=>{const q=s.footprint[s.footprint.length-1-j];return [(p[0]+q[0])/2,(p[1]+q[1])/2];})}));
for(const r of [...mapRoads,roadViaduct,monorail,centralRail,...stationConcourses,...platformRoutes]){
 const fullWidth=r.width+(r.kind==='rail'?.12:r.kind==='walk'?0:1.35);
 const deckAdjustments=new Map<number,number>();
 for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dy=b[1]-a[1],distance=Math.hypot(dx,dy),p:MapPoint=[(a[0]+b[0])/2,(a[1]+b[1])/2],y=(routeHeight(r,i-1)+routeHeight(r,i))/2;
  // Platforms already have a joined floor with a visible slab edge.
  if(r.id.startsWith('platform-')||y<.14||distance<1e-5)continue;
  const yaw=facing(dx,dy),pitch=-Math.atan2(routeHeight(r,i)-routeHeight(r,i-1),distance);
  const deck=add('prop.roadDeck',p,y-.015,[fullWidth,1,distance+.018],yaw,pitch);
  // A junction owns one shared pavement, but each structural module follows
  // its approach's plane. Seat the entire concrete top below that pavement;
  // matching only the centre lets the opposite corners cut through asphalt.
  if(r.kind==='road'&&r!==roadViaduct&&mapRoads.some(other=>other!==r&&corridorGap(placementFootprint(deck),other.points,other.width+1.35)<.2)){
   let lower=0;
   for(let x=-.5;x<=.5;x+=.125)for(let z=-.5;z<=.5;z+=.125){
    const point=attachmentWorld(deck,[x,0,z]),uv=compositionPoint(point[0],point[2]);
    lower=Math.max(lower,point[1]-(streetFloor(...uv)-.08));
   }
   deck.position[1]-=lower;fittedJunctionDecks.push(deck);
  }
  deckAdjustments.set(i,deck.position[1]-(y-.015));
  // Low approaches bear on continuous retaining walls and prepared fill.
  // Leave genuine lower corridors open rather than closing them with a wall.
  if(r.kind==='rail'||r.kind==='walk'||!onReferenceLand(...p)||y>2.35)continue;
  const probe:MapPoint[]=[[p[0]-fullWidth/2,p[1]-1],[p[0]+fullWidth/2,p[1]-1],[p[0]+fullWidth/2,p[1]+1],[p[0]-fullWidth/2,p[1]+1]];
  if(pathBlocked(probe))continue;
  for(const side of [-1,1]){
   const q:MapPoint=[p[0]-dy/distance*(fullWidth/2-.14)*side,p[1]+dx/distance*(fullWidth/2-.14)*side],base=terrainY(...q)-.025,height=y-base-.08;
   if(height>.12){
    const candidate:Placement={asset:'prop.roadRetaining',position:worldPoint(...q,base),scale:[1,height,distance+.025],rotation:[0,yaw,0]},poly=placementFootprint(candidate);
    // A roadside wall must stop at a connecting street, not close its mouth.
    if(!mapRoads.some(other=>other!==r&&Math.abs(roadHeightAt(other,q)-y)<1&&corridorGap(poly,other.points,other.width+1.35)<.2))roadStructures.push(candidate);
   }
  }
 }
 // Piers are spaced in metres. Search near the nominal support station so
 // that its entire footing, not just its centre, avoids lower circulation.
 for(let distance=6;distance<lineLength(r.points)-2;distance+=8){
  const nominal=sampleLine(r.points,distance),height=roadHeightAt(r,nominal.point);
  if(height<1.4)continue;
  let placed=false;
  for(const lateral of (r.id.startsWith('platform-')?[0,-2,2,-3,3,-4,4,-5,5]:[0])){
  for(const offset of (r.id.startsWith('platform-')?[0,-1,1,-2,2,-3,3,-4,4,-5,5]:[0,-1,1,-2,2,-3,3])){
   const sample=sampleLine(r.points,Math.max(0,distance+offset)),axis=sample.point,p:MapPoint=[axis[0]-sample.tangent[1]*lateral,axis[1]+sample.tangent[0]*lateral],y=roadHeightAt(r,axis),base=onReferenceLand(...p)?terrainY(...p): -1.2,yaw=facing(...sample.tangent);
   if(y-base<1.3)continue;
   const footing:Placement={asset:'prop.roadFooting',position:worldPoint(...p,base-.20),scale:[1,1,1],rotation:[0,yaw,0]},poly=placementFootprint(footing);
   if(structuralSupports.some(s=>s.road===r.id&&Math.hypot(p[0]-s.point[0],p[1]-s.point[1])<4))continue;
   if(pathBlocked(poly)||[...buildingLots,...stationAccessLots].some(l=>polygonGap(poly,l.footprint)<.4))continue;
   if([...mapRoads,roadViaduct].some(other=>other!==r&&roadHeightAt(other,p)<y-.15&&corridorGap(poly,other.points,other.width+1.35)<.4))continue;
   const capCentre:MapPoint=[(p[0]+axis[0])/2,(p[1]+axis[1])/2];
   const capBounds=layoutFor('prop.roadCap')!.bounds;
   // A passenger slab is thinner than the girders under the track. Seat its
   // bearing against the actual slab underside, then extend the shaft to the
   // cap bottom. Reusing the road offset left a visible 0.14 m air gap here.
   // Junction deck modules can be lowered to follow the shared pavement.
   // Their supports must follow that installed height as well; otherwise
   // the bearings and shaft penetrate the lowered girders.
   const capY=r.id.startsWith('platform-')?y-stationSlabThickness-capBounds.max[1]:y-.47+(deckAdjustments.get(sample.index)??0);
   const pier:Placement={asset:'prop.roadPier',position:worldPoint(...p,base+.12),scale:[1,capY+capBounds.min[1]+.01-(base+.12),1],rotation:[0,yaw,0]};
   const cap:Placement={asset:'prop.roadCap',position:worldPoint(...capCentre,capY),scale:[fullWidth-.32+Math.abs(lateral),1,1],rotation:[0,yaw,0]};
   const parts=[footing,pier,cap];
   if(r.id.startsWith('platform-')&&structuralSupports.some(s=>s.parts.some(a=>parts.some(b=>supportPartsOverlap(a,b)))))continue;
   roadStructures.push(...parts);
   structuralSupports.push({road:r.id,point:p,bottom:base,top:y,footprint:poly,parts});placed=true;break;
  }
  if(placed)break;
  }
 }
}
