import {junctionPriority,worldPoint,dumpDriveway,industrialAprons,streetLayout,atRoadJunction,riverCorridors,mapRoads,riverSamples,canalSamples,riverWidth,beachLine,reservoirOutline,monorail,centralRail,roadViaduct,buildingLots,routeHeight,distanceToRoute,pedestrianNetwork,type MapPoint} from '../../config/referenceMap';
import {reservoirWaterHeight} from '../../config/reservoir';
import {dumpExitPriority,industrialGatePriority} from '../../config/servicePriority';
import {industrialServiceFloor} from '../../config/industrialPaving';
import {crossingApproachSurfaces,crossingSidewalks,crossingViaductSidewalks} from '../../config/crossingApproaches';
import {circulationCrossings} from '../../config/circulationCrossings';
import {stationPassengerFloors,stationSlabThickness} from '../../config/stationPerimeters';
import {dumpSite} from '../../config/dumpSite';
import type {BufferGeometry} from 'three';
import {lineLength} from '../../config/spatial';
import {roadHeightSampler} from '../../config/roadProfiles';
import {polygon,ribbon,wall,merged,valleyLand,cleanBanks,dirtyBanks} from './referenceGeometry';

/** Static city ground: roads, sidewalks, terrain and water surfaces.
 * Depends only on the map configuration. The build precomputes it into
 * public/assets/generated/city-surfaces.bin (see cityGeometry.ts); this
 * function is the source of truth and the fallback when that file is absent.
 */
export function createSurfaces(){
 const sidewalks:BufferGeometry[]=[],roads:BufferGeometry[]=[],marks:BufferGeometry[]=[],paths:BufferGeometry[]=[];
 const roadFloor=roadHeightSampler(mapRoads.map(r=>({...r,heights:r.points.map((_,i)=>routeHeight(r,i))})));
 const viaductFloor=roadHeightSampler([{...roadViaduct,heights:roadViaduct.points.map((_,i)=>routeHeight(roadViaduct,i))}]);
 const floorFor=(road:string)=>road===roadViaduct.id?viaductFloor:roadFloor;
 marks.push(ribbon(dumpExitPriority.triangle,dumpExitPriority.width,.061),...dumpExitPriority.line.map(line=>ribbon(line,dumpExitPriority.width,.061)));
 for(const line of [industrialGatePriority.triangle,...industrialGatePriority.line])marks.push(ribbon(line,industrialGatePriority.width,i=>industrialGatePriority.height(line[i])));
 for(const mark of junctionPriority)for(const line of mark.lines)marks.push(ribbon(line,mark.width,i=>floorFor(mark.road)(...line[i])+.058));
 for(const p of streetLayout.asphalt)roads.push(polygon(p[0],(u,v)=>roadFloor(u,v)+.038,false,p.slice(1),1.6));
 for(const p of crossingSidewalks)sidewalks.push(polygon(p[0],(u,v)=>roadFloor(u,v)+.015,false,p.slice(1),1.6));
 for(const p of streetLayout.viaductAsphalt)roads.push(polygon(p[0],(u,v)=>viaductFloor(u,v)+.038,false,p.slice(1),1.6));
 for(const p of crossingViaductSidewalks)sidewalks.push(polygon(p[0],(u,v)=>viaductFloor(u,v)+.015,false,p.slice(1),1.6));
 for(const approach of crossingApproachSurfaces)for(const p of approach.polygons)sidewalks.push(polygon(p[0],(u,v)=>(approach.elevated?viaductFloor:roadFloor)(u,v)+approach.offset(u,v),false,p.slice(1),.35));
 for(const r of [...mapRoads,roadViaduct]){
  let distance=0,last=-10;
  for(let i=1;i<r.points.length-1;i++){
   const a=r.points[i-1],b=r.points[i];distance+=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(distance-last>2.5&&!atRoadJunction(r,b)){marks.push(ribbon([a,b,r.points[i+1]],.055,j=>floorFor(r.id)(...r.points[i-1+j])+.05));last=distance;}
  }
 }
 // Include through-road arms at every real node, not only route endpoints.
 for(const c of circulationCrossings.crossings){
  const [du,dv]=c.tangent,r=[...mapRoads,roadViaduct].find(r=>r.id===c.road)!;
  const count=Math.max(3,Math.floor((c.width-.3)/.4)),spacing=(c.width-.4)/count;
  for(let i=0;i<count;i++){
   const offset=(i-(count-1)/2)*spacing,u=c.point[0]-dv*offset,v=c.point[1]+du*offset;
   const ends:MapPoint[]=[[u-du*.60,v-dv*.60],[u+du*.60,v+dv*.60]];
   marks.push(ribbon(ends,.20,k=>floorFor(r.id)(...ends[k])+.056));
  }
 }
 const cycles:BufferGeometry[]=[],walks:BufferGeometry[]=[],edging:BufferGeometry[]=[];
 for(const corridor of riverCorridors){
  const {side,cycle:points}=corridor;
  // At grade the asphalt owns the crossing. Under a bridge the cycle corridor
  // remains continuous, with real vertical separation from its deck.
  const blocked=(p:MapPoint)=>mapRoads.some(r=>{
   if(distanceToRoute(...p,r)>r.width/2+.8)return false;
   const i=r.points.reduce((best,q,j)=>Math.hypot(q[0]-p[0],q[1]-p[1])<Math.hypot(r.points[best][0]-p[0],r.points[best][1]-p[1])?j:best,0);
   return routeHeight(r,i)<1.7;
  });
  cycles.push(ribbon(points,corridor.cycleWidth,.052));
  walks.push(ribbon(corridor.walk,corridor.walkWidth,.017));
  const bank=cleanBanks[(side+1)/2].filter(([,v])=>v<80);edging.push(wall(bank,.18,-.64));edging.push(ribbon(bank,.34,.18));
  for(let i=2;i<points.length-2;i+=4)if(!blocked(points[i])&&!blocked(points[i+1]))marks.push(ribbon(points.slice(i,i+2),.045,.058));
 }
 for(const bank of dirtyBanks){edging.push(wall(bank,.35,-.9));edging.push(ribbon(bank,.5,.35));}
 for(const l of buildingLots){
  sidewalks.push(polygon(l.footprint,l.placement.position[1]+.012));
 }
 const service:BufferGeometry[]=[],safety:BufferGeometry[]=[];
 for(const p of industrialServiceFloor)service.push(polygon(p[0],.021,false,p.slice(1)));
 for(const a of industrialAprons){
  paths.push(ribbon(a.staffPath,1.4,.045));
  const [u,v]=a.bay;
  for(const side of [-1,1])marks.push(ribbon([[u+side*1.08,v-2.12],[u+side*1.08,v+2.12]],.06,.035));
  marks.push(ribbon([[u-1.08,v+2.12],[u+1.08,v+2.12]],.06,.035));
  for(const side of [-1,1])safety.push(ribbon(a.driveway.map(p=>[p[0]+side*1.68,p[1]]),.055,.035));
  // The same reverse curve is used by the full-vehicle clearance audit.
  const reverse=a.maneuver.samples.map(s=>s.point);
  for(let i=0;i<reverse.length-1;i+=4)safety.push(ribbon(reverse.slice(i,Math.min(i+3,reverse.length)),.055,.062));
  marks.push(ribbon([[a.loading[0]-1,a.loading[1]-.35],[a.loading[0]+1,a.loading[1]-.35]],.09,.063));
 }
 for(const link of pedestrianNetwork.links){
  // Industrial staff use the dedicated door-to-sidewalk corridor above.
  if(industrialAprons.some(a=>a.id===link.id))continue;
  const total=lineLength(link.points)||1,distances=link.points.map((_,i)=>lineLength(link.points.slice(0,i+1)));
  paths.push(ribbon(link.points,1.4,i=>link.height+.026+(link.lift?0:(link.accessHeight-link.height)*distances[i]/total)));
  if(lineLength([link.points.at(-1)!,link.sidewalk])>.001)paths.push(ribbon([link.points.at(-1)!,link.sidewalk],1.4,link.accessHeight+.026));
 }
 const railDeck=merged([monorail,centralRail].map(r=>ribbon(r.points,r.width,i=>routeHeight(r,i)-.02)));
 const railMetal=merged([monorail,centralRail].flatMap(r=>[-.46,.46].map(offset=>ribbon(r.points,.055,i=>routeHeight(r,i)+.08,offset))));
 // The walking floor and its guardrail share one contour, including bends and
 // branch joins. Separate ribbons used to leave mismatched edges at corners.
 for(const s of stationPassengerFloors)for(const p of s.polygon){
  paths.push(polygon(p[0],s.height,false,p.slice(1)));
  for(const ring of p)edging.push(wall(ring,s.height,s.height-stationSlabThickness));
 }
 const falls=merged([-5.5,-3.3,-1.1,1.1,3.3,5.5].map(x=>wall([[-36+x-.84,82.36],[-36+x+.84,82.36]],6.30,-.58)));
 return {land:valleyLand(),sidewalks:merged(sidewalks),roads:merged(roads),marks:merged(marks),paths:merged(paths),cycles:merged(cycles),walks:merged(walks),edging:merged(edging),railDeck,railMetal,falls,service:merged(service),safety:merged(safety),
  sea:polygon([[-215,-185],[225,-185],[225,94],[-215,94]],-.60),river:ribbon(riverSamples,(_,v)=>riverWidth(v),-.58,0,0,true),canal:ribbon(canalSamples,9,-.57,0,0,true),reservoir:polygon(reservoirOutline,reservoirWaterHeight),
  beach:ribbon([...beachLine].reverse(),(u,v)=>{const a=beachLine[0],b=beachLine.at(-1)!,d=Math.min(Math.hypot(u-a[0],v-a[1]),Math.hypot(u-b[0],v-b[1]));const t=Math.min(1,d/4);return .03+4.97*t*t*(3-2*t);},.06,1.4,-.67),
  yard:polygon(dumpSite.footprint,.021),
  dumpAccess:ribbon(dumpDriveway.points,dumpDriveway.width,.048),
  ruined:polygon([[18,-10],[45,-7],[54,-16],[47,-31],[29,-33],[21,-24]],.006),
 };
}
export type CitySurfaces=ReturnType<typeof createSurfaces>;
