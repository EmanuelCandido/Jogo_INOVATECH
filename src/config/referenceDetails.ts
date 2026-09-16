import {sampleLine,lineLength,segmentDistance,corridorGap} from './spatial';
import {Euler,Quaternion,Vector3} from 'three';
import type {LandscapeDetail,LandscapeShape} from './landscape';
import type {Placement,Vec3} from '../game/types';
import {worldPoint,riverU,riverWidth,terrainY,riverSamples,canalSamples,beachLine,monorail,roadViaduct,centralRail,mapRoads,buildingLots,frontYaw,placement,facing,routeHeight,pedestrianNetwork,onReferenceLand,gradedRotation,compositionPoint,placementFootprint,footprintGap,pointInFootprint,distanceToRoute,railFacilities,stationConcourses,type MapPoint,type MapRoute} from './referenceMap';
import {attachmentWorld,layoutFor} from '../assets/modelLayout';
import {routeFrame} from './routeFrame';
import {reserveTraffic} from './trafficReservations';
import {circulationCrossings,referenceTraffic,blocksJunctionMarking} from './referenceMap';
import {atRoadJunction,riverCorridors,roadHeightAt} from './referenceMap';
import {roadGuardrailRuns} from './roadGuardrails';
import preparedRiverside from './riverside-layout.json' with {type:'json'};

export const referenceDetails:LandscapeDetail[]=[],referenceVisitors:LandscapeDetail[]=[],referenceLitter:LandscapeDetail[]=[],referenceDump:LandscapeDetail[]=[],riversideAssets:Placement[]=[];
export const referenceVisitorGroups:LandscapeDetail[][]=[];
function detail(shape:LandscapeShape,u:number,v:number,y:number,scale:Vec3,color:string,rotation?:Vec3){referenceDetails.push({shape,position:worldPoint(u,v,y),scale,color,rotation});}
export function detailBeam(target:LandscapeDetail[],a:Vec3,b:Vec3,r:number,color:string){
 const start=new Vector3(...a),end=new Vector3(...b),delta=end.clone().sub(start),q=new Quaternion().setFromUnitVectors(new Vector3(0,1,0),delta.clone().normalize()),e=new Euler().setFromQuaternion(q);
 target.push({shape:'cylinder',position:start.add(end).multiplyScalar(.5).toArray(),scale:[r,delta.length(),r],color,rotation:[e.x,e.y,e.z]});
}
function person(u:number,v:number,seed:number,y=.08){
 const start=referenceVisitors.length;
 const p=(shape:LandscapeShape,x:number,z:number,h:number,scale:Vec3,color:string)=>referenceVisitors.push({shape,position:worldPoint(u+x,v+z,y+h),scale,color});
 const skin=['#bc8a5c','#e3b98a','#80573d'][seed%3],shirt=['#e6b13e','#397fa3','#df7755','#eee9cd','#679468'][seed%5];
 p('leaf',0,0,.94,[.12,.15,.12],skin);p('leaf',0,.015,1.04,[.125,.085,.12],'#564633');
 p('box',0,0,.65,[.26,.36,.19],shirt);
 for(const side of [-1,1]){p('box',side*.071,side*.025,.27,[.075,.40,.09],'#425d6c');p('box',side*.071,-.06+side*.025,.07,[.095,.10,.19],'#425158');p('box',side*.17,0,.6,[.075,.36,.08],skin);}
 const group=referenceVisitors.slice(start);referenceVisitorGroups.push(group);return group;
}
function bike(u:number,v:number,seed:number){
 const start=referenceDetails.length;
 for(const du of [-.34,.34])detail('ring',u+du,v,.26,[.24,.24,.24],'#5e686b',[0,frontYaw,0]);
 const a=worldPoint(u-.34,v,.26),b=worldPoint(u+.34,v,.26),c=worldPoint(u,v,.66);
 for(const [x,y]of [[a,b],[a,c],[b,c]])detailBeam(referenceDetails,x,y,.026,seed%2?'#e7ac40':'#46a4a0');
 detailBeam(referenceDetails,c,worldPoint(u+.17,v,.85),.025,'#4a646c');
 // A moving bicycle and its rider share a quality decision. Keeping the
 // bicycle in static scenery made reduced profiles display riderless bikes.
 const group=person(u,v,seed,.40),parts=referenceDetails.splice(start);
 group.push(...parts);referenceVisitors.push(...parts);
}
for(let i=5;i<riverCorridors[0].bank.length-8;i+=5){
 const v=riverCorridors[0].bank[i][1],u=riverU(v);
 if(v< -66)continue;
 for(const c of riverCorridors){
  const [fx,fv]=c.furniture[i],cycle=c.cycle[i],walk=c.walk[i];
  if([...mapRoads,roadViaduct].some(r=>distanceToRoute(...cycle,r)<r.width/2+2&&roadHeightAt(r,cycle)<2.3))continue;
  riversideAssets.push(placement('prop.lamp',fx,fv,.82,frontYaw));
  if(i%3===0){riversideAssets.push(placement('prop.bench',fx,fv+.8,.84,facing(-c.side,0)));person(...walk,i);}
  else if(i%3===1)bike(...cycle,i);
  if(i%2===1)riversideAssets.push(placement(i%4===1?'tree.blossom':'tree.oak',fx+c.side*.95,fv,.84,(i*.63)%6.28));
  for(let j=0;j<3;j++)detail('leaf',fx+c.side*.7+j*.24,fv+.6,.23,[.28,.22,.29],['#75aa49','#548f48','#91b957'][j]);
 }
 if(i%4===1){
  const yaw=frontYaw+.17,uu=u+Math.sin(i)*2,start=referenceDetails.length;
  detail('leaf',uu,v,-.27,[.34,.17,1.05],i%2?'#f9b84b':'#e47749',[0,yaw,0]);
  const group=person(uu,v,i,-.08);detailBeam(referenceDetails,worldPoint(uu-.7,v,-.02),worldPoint(uu+.7,v,.24),.025,'#dbccab');
  const parts=referenceDetails.splice(start);group.push(...parts);referenceVisitors.push(...parts);
 }
}
// The viaduct and monorail use the same sampled centreline for deck, piers and trains.
for(const r of [monorail,centralRail]){
 for(let i=0;i<r.points.length;i++){
  const a=r.points[Math.max(0,i-1)],p=r.points[i],b=r.points[Math.min(r.points.length-1,i+1)],du=b[0]-a[0],dv=b[1]-a[1],l=Math.hypot(du,dv)||1,y=routeHeight(r,i);
  if(r.kind==='road'&&r!==roadViaduct&&y<.3)continue;
  const junction=r.kind==='road'&&atRoadJunction(r,p);
  const openPlatform=(side:number)=>r.kind==='rail'&&railFacilities.some(s=>s.route.id===r.id&&s.side===-side&&Math.abs(lineLength(r.points.slice(0,i+1))-s.distance)<11.5);
  const edge=r.width/2+(r.kind==='rail'?-.06:.61);
  if(i%2===0&&!junction)for(const side of [-1,1]){
   if(openPlatform(side))continue;
   const u=p[0]+dv/l*edge*side,v=p[1]-du/l*edge*side;
   detail('cylinder',u,v,y+.40,[.025,.7,.025],'#beced0');
  }
  if(i&&!junction&&(r!==centralRail||y>.5))for(const side of [-1,1]){
   if(openPlatform(side))continue;
   detailBeam(referenceDetails,worldPoint(a[0]+dv/l*edge*side,a[1]-du/l*edge*side,routeHeight(r,i-1)+.73),worldPoint(p[0]+dv/l*edge*side,p[1]-du/l*edge*side,y+.73),.03,'#e8e8d7');
  }
 }
}
// Road barriers stop at the real side-road and pedestrian openings. Each
// surviving run has end posts, so removing a junction never leaves a beam
// hanging across the carriageway or without a terminal support.
for(const run of roadGuardrailRuns){
 const total=lineLength(run.points),posts=Math.max(1,Math.ceil(total/1.5));
 for(let i=1;i<run.points.length;i++)detailBeam(referenceDetails,worldPoint(...run.points[i-1],run.heights[i-1]+.73),worldPoint(...run.points[i],run.heights[i]+.73),.03,'#e8e8d7');
 for(let i=0;i<=posts;i++){
  const sample=sampleLine(run.points,total*i/posts),a=run.points[sample.index-1],b=run.points[sample.index],t=Math.hypot(sample.point[0]-a[0],sample.point[1]-a[1])/(Math.hypot(b[0]-a[0],b[1]-a[1])||1),y=run.heights[sample.index-1]+t*(run.heights[sample.index]-run.heights[sample.index-1]);
  detail('cylinder',...sample.point,y+.375,[.025,.715,.025],'#beced0');
 }
}
// Planted entrances, paved front courts and groups of people give each lot a use.
for(const s of railFacilities){
 for(const side of [-1,1])detailBeam(referenceDetails,worldPoint(s.centre[0]+s.t[0]*1.16*side,s.centre[1]+s.t[1]*1.16*side,s.height),worldPoint(s.centre[0]+s.t[0]*1.16*side,s.centre[1]+s.t[1]*1.16*side,s.height+2.38),.026,'#496c74');
 for(let j=-2;j<=2;j++)person(s.centre[0]+s.t[0]*j*.7,s.centre[1]+s.t[1]*j*.7,j+3,s.height);
 const a=worldPoint(s.centre[0]-s.t[0]*2.5-s.n[0]*.60,s.centre[1]-s.t[1]*2.5-s.n[1]*.60,s.height+.015),b=worldPoint(s.centre[0]+s.t[0]*2.5-s.n[0]*.60,s.centre[1]+s.t[1]*2.5-s.n[1]*.60,s.height+.015);
 detailBeam(referenceDetails,a,b,.045,'#e1bc4c');

}
// Only the industrial terminus ends here; the west joint is a through route.
for(const index of [centralRail.points.length-1]){
 const p=centralRail.points[index],a=centralRail.points[index-1],du=p[0]-a[0],dv=p[1]-a[1],l=Math.hypot(du,dv),nx=-dv/l,ny=du/l,y=routeHeight(centralRail,index);
 for(const side of [-1,1])detailBeam(referenceDetails,worldPoint(p[0]+nx*.55*side,p[1]+ny*.55*side,y),worldPoint(p[0]+nx*.55*side,p[1]+ny*.55*side,y+.55),.075,'#53646b');
 detailBeam(referenceDetails,worldPoint(p[0]-nx*.78,p[1]-ny*.78,y+.55),worldPoint(p[0]+nx*.78,p[1]+ny*.78,y+.55),.11,'#d26f54');
 for(const side of [-1,1])detail('box',p[0]+nx*.48*side,p[1]+ny*.48*side,y+.7,[.12,.16,.12],'#f2dfb8');
}
for(const [i,l]of buildingLots.entries()){
 if(l.id.startsWith('industria')||l.id.includes('comunidade'))continue;
 const link=pedestrianNetwork.links.find(p=>p.id===l.id)!;
 const total=lineLength(link.points)||1,sample=sampleLine(link.points,Math.min(1.8,total));
 const height=link.height+(link.lift?0:(link.accessHeight-link.height)*Math.min(1,1.8/total));
 person(...sample.point,i,height+.08);
 if(i%3===0){const next=sampleLine(link.points,Math.min(2.6,total));person(...next.point,i+1,height+.08);}
 for(const side of [-1,1]){
  const w=attachmentWorld(l.placement,[side*1.1,0,layoutFor(l.placement.asset)!.bounds.max[2]+.55]),[u,v]=compositionPoint(w[0],w[2]),yaw=l.placement.rotation?.[1]??0;
  if(!onReferenceLand(u,v)||mapRoads.some(r=>distanceToRoute(u,v,r)<r.width/2+.7)||buildingLots.some(other=>other!==l&&pointInFootprint([u,v],other.footprint)))continue;
  if(pedestrianNetwork.links.some(link=>link.points.some((p,j)=>j>0&&segmentDistance([u,v],link.points[j-1],p)<1.2)))continue;
  const y=l.placement.position[1];
  detail('box',u,v,y+.15,[.85,.25,.65],'#e8e4d2',[0,yaw,0]);
  detail('leaf',u,v,y+.4,[.40,.23,.28],'#619e4f');
  for(let f=0;f<3;f++)detail('leaf',u-.21+f*.19,v-.1,y+.59,[.067,.063,.067],i%2?'#e5b354':'#e29bb8');
 }
}
const litterStart=referenceDetails.length;
for(let i=4;i<canalSamples.length;i+=3){
 const [u,v]=canalSamples[i];
 if(v>69)continue;
 // River litter has a defined material and silhouette, rather than white blocks.
 for(let j=0;j<2;j++){
  detail('box',u+Math.sin(i*2+j)*3.5,v+Math.cos(i*3+j),-.43,[.24,.12,.17],['#c6b08a','#dcaa42','#e3ddd1','#56a5ab'][i%4],[.1,i*.7,.1]);
  detail('cylinder',u+Math.sin(i*1.7+j)*2.9,v+.5,-.42,[.072,.3,.072],'#d6dad0',[Math.PI/2,.7,0]);
 }
}
referenceLitter.push(...referenceDetails.splice(litterStart));
// A proper rocky headland supports the lighthouse and breaks the shore naturally.
for(let i=0;i<78;i++){
 const a=i*2.399,r=Math.sqrt(i/78)*7,u=78+Math.cos(a)*r,v=-37+Math.sin(a)*r*.55;
 riversideAssets.push(placement('prop.rock',u,v,.62+(i%5)*.16,i*.41,-.2+Math.max(0,1-r/7)*1.4));
}
// Boulder revetments follow each actual bank; they also soften the reservoir
// transition and the industrial outfall instead of hiding missing terrain.
for(const [i,[u,v]]of canalSamples.entries()){
 if(v>82||v< -33||i%2)continue;
 for(const side of [-1,1])if(side<0||v>18){riversideAssets.push(placement('prop.rock',u+side*4.55,v,.65+(i%3)*.12,i*.73,-.16));}
}
for(let i=0;i<30;i++){
 const v=70+i*.5,u=riverU(v),side=i%2?1:-1;
 riversideAssets.push(placement('prop.rock',u+side*(riverWidth(v)/2+.5),v,.64+(i%4)*.14,i,-.13));
}
for(let i=0;i<18;i++){
 const u=-42+(i%9)*1.5,v=81.8-Math.floor(i/9)*.6;
 detail('leaf',u,v,-.37,[.60,.09,.37],'#c9efdf');
}
for(let i=0;i<beachLine.length;i+=4){const [u,v]=beachLine[i];if(i%3===0){riversideAssets.push(placement('tree.palm',u,v+3.2,1.1,i));person(u,v-1.1,i);} }
// Dump contents now use the authored waste models and all mission states.
// Dead trees and fractured paving are deliberately limited to the neglected block.
for(const [u,v]of [[34,-12],[38,-27],[47,-24],[46,-13],[25,-28]]){
 detailBeam(referenceDetails,worldPoint(u,v,0),worldPoint(u+.25,v,3.7),.12,'#8c7351');
 for(let j=0;j<4;j++){const a=j*2;detailBeam(referenceDetails,worldPoint(u+.17,v,1.5+j*.45),worldPoint(u+Math.cos(a)*1.5,v+Math.sin(a)*1.1,3.0+j*.35),.055,'#8c7351');}
}
for(let i=0;i<35;i++){
 const u=22+(i%7)*4,v=-11-Math.floor(i/7)*4.6;
 detailBeam(referenceDetails,worldPoint(u,v,.055),worldPoint(u+1.0,v+.6,.055),.032,'#605f59');
 detailBeam(referenceDetails,worldPoint(u+1,v+.6,.055),worldPoint(u+1.3,v+.1,.055),.025,'#605f59');
}
export function industrialSmoke(clean=false):LandscapeDetail[]{
 const result:LandscapeDetail[]=[];
 for(const l of buildingLots.filter(l=>l.id.startsWith('industria'))){
  const scale=l.placement.scale![0];
  for(const x of [-2,1.2])for(let i=0;i<(clean?2:11);i++){
   const r=.65+i*.19;
   const origin=attachmentWorld(l.placement,[x,8.3,-.8]);
   result.push({shape:'smoke',position:[origin[0]+i*.31+Math.sin(i*1.7)*.16,origin[1]+i*.52,origin[2]-i*.12],scale:[r,r*.92,r*.82],color:clean?'#d3e0d9':i<2?'#77776c':'#838983'});
  }
 }
 return result;
}
// Extra vehicles are placed on the elevated deck, not on the ground below it.
function viaductVehicle(i:number,distance:number){
 const side=i%2?1:-1,frame=routeFrame(roadViaduct.points,distance,.95*side,p=>roadHeightAt(roadViaduct,p)),[du,dv]=frame.tangent;
 const car=placement(i%5===0?'prop.truck':['prop.car.coral','prop.car.gold','prop.car.blue','prop.bus'][i%4],...frame.point,.86,facing(du*side,dv*side),frame.height+.08);
 car.rotation=gradedRotation(facing(du*side,dv*side),-Math.atan(frame.slope)*side);return car;
}
const rawViaductTraffic=Array.from({length:Math.floor((lineLength(roadViaduct.points)-12)/8)+1},(_,i)=>viaductVehicle(i,6+i*8));
const vehicleOverlap=(a:Placement,b:Placement)=>Math.abs(a.position[1]-b.position[1])<1.5&&footprintGap(placementFootprint(a),placementFootprint(b))<.35;
export const viaductTraffic=reserveTraffic(rawViaductTraffic,p=>{
 const poly=placementFootprint(p);
 return blocksJunctionMarking(p)||referenceTraffic.some(other=>vehicleOverlap(p,other))||circulationCrossings.crossings.some(c=>Math.abs(p.position[1]-roadHeightAt([...mapRoads,roadViaduct].find(r=>r.id===c.road)!,c.point))<1.5&&footprintGap(poly,c.footprint)<.4);
},(p,offset)=>{
 const i=rawViaductTraffic.indexOf(p),distance=6+i*8+offset;
 return distance<3||distance>lineLength(roadViaduct.points)-3?null:viaductVehicle(i,distance);
},vehicleOverlap,lineLength(roadViaduct.points));
// The route's stations retain shelters, timetable signage and waiting passengers.
for(const r of mapRoads.filter((r,i)=>!r.usage&&!r.terminal&&r.id!=='acesso-viaduto'&&i%3===0)){
 const frame=routeFrame(r.points,Math.min(24,lineLength(r.points)/2),r.width/2+1,p=>roadHeightAt(r,p)),[du,dv]=frame.tangent,[u,v]=frame.point;
 if(frame.height>.025||atRoadJunction(r,frame.point))continue;
 riversideAssets.push(placement('prop.shelter',u,v,1,facing(du,dv)-Math.PI/2,0));for(let j=0;j<3;j++)person(u+j*.5,v-.4,j,.08);
}
// Exclude generated furniture whose complete footprint would obstruct a street
// or sit inside a building. Landmark entrances keep their own authored fittings.
// A centre on the furnishing strip is insufficient at a tight river bend:
// move the complete bench/lamp envelope into a free pocket on dry land.
// Authoring/builds retain the original search. Browsers reuse its exact result;
// a diagnostic control can still measure the original in the same build.
const query=typeof location==='undefined'?null:new URLSearchParams(location.search);
const runtimeRiverside=query?.get('benchmark')==='1'&&query.get('runtimeRiverside')==='1';
export let riversidePreparation:Array<{sourceIndex:number;position:Vec3}>=[];
if(!import.meta.env.SSR&&!runtimeRiverside){
 const source=riversideAssets.slice();
 const prepared=preparedRiverside as unknown as typeof riversidePreparation;
 // Keep rotations/scales from this engine; only reuse the costly placement
 // search. Math.atan2 may round differently between Node and a browser.
 riversideAssets.splice(0,riversideAssets.length,...prepared.map(p=>({...source[p.sourceIndex],position:p.position})));
}else{
const sourceIndices=new Map(riversideAssets.map((p,i)=>[p,i]));
for(let i=0;i<riversideAssets.length;i++){
 const original=riversideAssets[i],tree=original.asset.startsWith('tree.');if(!tree&&!['prop.bench','prop.lamp'].includes(original.asset))continue;
 const [u,v]=compositionPoint(original.position[0],original.position[2]);
 const safe=(p:Placement)=>{
  const poly=placementFootprint(p);
  return poly.every(q=>onReferenceLand(...q))&&
   riverCorridors.every(c=>corridorGap(poly,c.cycle,c.cycleWidth)>.25&&corridorGap(poly,c.walk,c.walkWidth)>.2)&&
   [...mapRoads,...(tree?[roadViaduct,monorail,centralRail]:[])].every(r=>corridorGap(poly,r.points,r.width+1.35)>.2)&&
   buildingLots.every(l=>footprintGap(poly,l.footprint)>.3)&&
   pedestrianNetwork.links.every(l=>corridorGap(poly,[...l.points,l.sidewalk],1.4)>.2);
 };
 if(safe(original))continue;
 let moved=false;
 for(let distance=.5;distance<=(tree?50:16)&&!moved;distance+=.5)for(let a=0;a<16&&!moved;a++){
  const angle=a*Math.PI/8,x=u+Math.cos(angle)*distance,z=v+Math.sin(angle)*distance,p={...original,position:worldPoint(x,z,tree?terrainY(x,z):original.position[1])};
  if(safe(p)){riversideAssets[i]=p;sourceIndices.set(p,i);moved=true;}
 }
 if(!moved)throw new Error('Mobiliário ribeirinho sem espaço: '+original.asset+' @ '+u+','+v);
}
for(let i=riversideAssets.length-1;i>=0;i--){
 const p=riversideAssets[i];if(p.asset==='prop.rock')continue;
 const b=layoutFor(p.asset)?.bounds;if(!b)continue;
 const radius=Math.max(b.max[0]-b.min[0],b.max[2]-b.min[2])*(p.scale?.[0]??1)*.35;
 const poly=placementFootprint(p),uv=compositionPoint(p.position[0],p.position[2]);
 const inside=buildingLots.some(l=>footprintGap(poly,l.footprint)<.2)||mapRoads.some(r=>distanceToRoute(...uv,r)<r.width/2+radius&&Math.abs(p.position[1]-routeHeight(r,r.points.reduce((best,q,i)=>Math.hypot(q[0]-uv[0],q[1]-uv[1])<Math.hypot(r.points[best][0]-uv[0],r.points[best][1]-uv[1])?i:best,0)))<1.5)||buildingLots.some(l=>pointInFootprint(uv,l.footprint));
 if(inside)riversideAssets.splice(i,1);
}
riversidePreparation=riversideAssets.map(p=>({sourceIndex:sourceIndices.get(p)!,position:p.position}));
}

