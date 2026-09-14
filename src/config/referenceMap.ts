import {CatmullRomCurve3,Vector3,Euler,Quaternion} from 'three';
import type {Placement,Vec3} from '../game/types';
import {layoutFor,attachmentWorld} from '../assets/modelLayout';
import preparedLayout from './reference-layout.json' with {type:'json'};
import {situationVisuals} from './situationVisuals';
import {buildWalkNetwork} from './walkNetwork';
import {dumpSite} from './dumpSite';
import {buildRoadProfiles,heightAlongRoad} from './roadProfiles';
import {industrialSite,industrialGroundWeight,industrialYieldGeometry} from './industrialSite';
import {buildStreetLayout} from './streetLayout';
import {buildRiverCorridors} from './riverCorridors';
import {buildStationFacilities} from './stationFacilities';
import {loadingManeuver,serviceTurns} from './truckManeuvers';
import {convexHull} from './spatial';
import {trimRoadApproach,squareRoadApproach} from './trimRoadApproach';
import {buildJunctionCrossings} from './junctionCrossings';
import {buildJunctionPriority} from './junctionPriority';
import {reserveTraffic} from './trafficReservations';
import {routeFrame} from './routeFrame';
import {groundConnection} from './groundConnection';
import {reservoirOutline,reservoirBankHeight} from './reservoir';
export {reservoirOutline} from './reservoir';
import {contains,segmentDistance,polygonGap,corridorGap,sampleLine,lineLength} from './spatial';

/** Composition coordinates: u goes right in the image, v goes into the valley.
 * They are metres, independent of viewport, camera zoom and graphics quality. */
export type MapPoint=[number,number];
const h=Math.hypot(110,145);
export const mapBasis={rx:145/h,rz:-110/h,dx:-110/h,dz:-145/h};
export function worldPoint(u:number,v:number,y=0):Vec3{return [mapBasis.rx*u+mapBasis.dx*v,y,mapBasis.rz*u+mapBasis.dz*v];}
export function compositionPoint(x:number,z:number):MapPoint{return [x*mapBasis.rx+z*mapBasis.rz,x*mapBasis.dx+z*mapBasis.dz];}
/** Project an asset envelope along the fixed player-camera direction. */
export function placementViewFootprint(p:Placement){
 const bounds=layoutFor(p.asset)!.bounds,points:MapPoint[]=[];
 for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]]){
  const world=attachmentWorld(p,[x,y,z]),uv=compositionPoint(world[0],world[2]);points.push([uv[0],uv[1]+world[1]*h/130]);
 }
 return convexHull(points);
}
export const frontYaw=Math.atan2(-mapBasis.dx,-mapBasis.dz);
/** Ground landmarks traced from the supplied 1672 × 941 top-down reference. */
export function blueprint(x:number,y:number,height=0):MapPoint{return [(x-836)/9.5+3,20-(y-470.5+height*9.5*.8135)/(9.5*.5815)];}
export function facing(du:number,dv:number){const [x,,z]=worldPoint(du,dv);return Math.atan2(x,z);}
export function mapCurve(points:MapPoint[],steps=160):MapPoint[]{
 const curve=new CatmullRomCurve3(points.map(([u,v])=>new Vector3(u,0,v)),false,'centripetal');
 return curve.getPoints(steps).map(p=>[p.x,p.z]);
}
export function riverU(v:number){
 const knots:MapPoint[]=[[-110,38],[-65,24],[-44,12],[-24,-1],[-4,-13],[15,-30],[32,-43],[46,-47],[57,-28],[68,-29],[84,-36],[110,-36],[160,-35]];
 let i=knots.findIndex(p=>p[0]>=v);if(i<0)i=knots.length-1;else if(i===0)i=1;const [a,b]=[knots[i-1],knots[i]];const t=Math.max(0,Math.min(1,(v-a[0])/(b[0]-a[0]))),s=t*t*(3-2*t);
 return a[1]+(b[1]-a[1])*s;
}
export const riverWidth=(v:number)=>{const t=Math.max(0,Math.min(1,(v-80)/8));return 8.2+Math.max(0,20-v)*.035+21.8*t*t*(3-2*t);};
export function canalU(v:number){
 const knots:MapPoint[]=[[-100,102],[-40,84],[-20,74],[0,67],[23,57],[41,37],[58,42],[85,67],[160,78]];
 let i=knots.findIndex(p=>p[0]>=v);if(i<0)i=knots.length-1;else if(i===0)i=1;const a=knots[i-1],b=knots[i],t=Math.max(0,Math.min(1,(v-a[0])/(b[0]-a[0]))),s=t*t*(3-2*t);return a[1]+(b[1]-a[1])*s;
}
export const riverSamples=Array.from({length:330},(_,i)=>{const v=84-i*224/329;return [riverU(v),v] as MapPoint;});
export const riverCorridors=buildRiverCorridors(riverSamples,riverWidth);
export const canalSamples=Array.from({length:180},(_,i)=>{const v=160-i*248/179;return [canalU(v),v] as MapPoint;});
export const shoreLine:MapPoint[]=[[riverU(-70)+riverWidth(-70)/2,-70],[30,-59],[36,-48],[44,-43],[53,-41],[63,-41],[72,-39],[canalU(-34)-4.5,-34]];
export const beachLine=mapCurve([[27,-55],[35,-48],[44,-43.5],[52,-42],[60,-42],[66,-40.5]],100);
const riverBank=(side:number,top:number,bottom:number)=>Array.from({length:180},(_,i)=>{const v=top+(bottom-top)*i/179;return [riverU(v)+side*riverWidth(v)/2,v] as MapPoint;});
const canalBank=(side:number,top:number,bottom:number)=>Array.from({length:130},(_,i)=>{const v=top+(bottom-top)*i/129;return [canalU(v)+side*4.5,v] as MapPoint;});
export const landOutlines:MapPoint[][]=[
 [[-185,160],...riverBank(-1,160,-140),[-55,-154],[-100,-159],[-185,-162]],
 [...riverBank(1,160,-140),[riverU(-140)+riverWidth(-140)/2+3,-140],[38,-107],[36,-84],...shoreLine.slice(1),...canalBank(-1,-34,160)],
 [...canalBank(1,160,18),[88,11],[116,6],[146,36],[168,105],[185,160]],
];
function naturalTerrainY(u:number,v:number){
 const t=Math.max(0,Math.min(1,(v-84)/22));
 const ridge=(a:number,b:number,s:number,height:number)=>height*Math.exp(-((u-a)**2+(v-b)**2)/(s*s));
 const mountain=t*(ridge(-78,94,22,20)+ridge(-6,107,27,24)+ridge(41,109,27,21)+ridge(97,107,28,27)+3.5);
 if(u>-57&&u<-16&&v>73&&v<116){const ramp=Math.min(1,(v-73)/11),cross=Math.max(0,Math.min(1,(20.5-Math.abs(u+36.5))/5));return Math.max(mountain,6.65*ramp*ramp*(3-2*ramp)*cross);}
 return mountain;
}
export interface MapRoute {id:string;points:MapPoint[];width:number;elevation?:number;kind?:'road'|'rail'|'walk';terminal?:'beach-services';usage?:'freight'}
const route=(id:string,points:MapPoint[],width=3.6,elevation=0,kind:MapRoute['kind']='road'):MapRoute=>({id,points:mapCurve(points,100),width,elevation,kind});
const tracedRoute=(id:string,points:MapPoint[],width=3.6,elevation=0,kind:MapRoute['kind']='road')=>route(id,points.map(([x,y])=>blueprint(x,y,elevation)),width,elevation,kind);
export const mapRoads:MapRoute[]=[
 route('avenida-central',[[-14,67],[-12,61],[-4,54],[7,50],[24,49]],3.6),
 route('avenida-estacao',[[-20,25],[-14,20],[-2,23],[9,24],[32,9],[51,-11]],3.6),
 route('bairro-central',[[-7,56],[-7,43],[-5,25],[-5,12],[-3,5],[4,-3],[15.5,-17]],3.3),
 tracedRoute('rua-do-hospital',[[1001,321],[979,404],[969,472],[909,557],[861,611]],3.4),
 route('ligacao-hospital',[[24,49],[26,37],[26,27],[21.31578947368421,16.651807936279027]],3.3),
 route('margem-central',[[-20,25],[-18,18],[-12,12],[-5,12]],3.1),
 route('bairro-norte',[[-14,67],[-8,73],[7,74],[20,71],[25,61]],3.3),
 tracedRoute('bairro-escola',[[12,619],[104,540],[191,533],[294,572],[345,611],[267,678],[168,721]],3.3),
 route('avenida-botanica',[[-105,38],[-91,20],[-75,6],[-62,-4],[-56.8,-17.6],[-58.6,-26.5],[-54.5,-34.4]],3.2),
 route('rua-escola-sul',[[-67.3,-25.3],[-55,-34.4],[-41.3,-38.9],[-32,-29],[-20,-22],[-4,-17],[14,-10],[27,-7],[43,-4]],3.3),
 tracedRoute('reciclagem',[[168,721],[147,785],[199,855],[364,920],[428,887],[437,849],[415,796]],3.5),
 tracedRoute('anel-escola',[[267,678],[330,629],[390,584],[438,602],[489,655],[534,693]],3),
 route('acesso-futuro',[[-105,38],[-80,38],[-60,39],[-45,42],[-25,47],[7,50]],3.2),
 tracedRoute('comunidade',[[909,557],[1019,578],[1135,571],[1240,612],[1303,675],[1214,730],[1091,740],[955,675]],3.3),
 route('acesso-industrial',[[24,49],[25,61],[33,73],[41,84]],3.8),
 {...route('ponte-industrial',[[41,84],[57,84],[76,84],industrialSite.gate],3.8),usage:'freight'},
 {...route('patio-industrial',[industrialSite.gate,[113,84],[128,76],[128,54],[123,34],[110,21],[94,21]],3.8),usage:'freight'},
 {...route('acesso-carga',[[94,21],[80,27],[76,43],[80,61],[86,75],industrialSite.gate],3.8),usage:'freight'},
 {...route('acesso-docas',[[80,64],[100,64],[128,64]],3.8),usage:'freight'},
 route('acesso-viaduto',[[35,-29],[49,-31],[65,-29],[85,-25],[98,-15],[105,-8]],3.5),
 {...route('acesso-praia',[[35,-29],[38,-36],[45,-38],[57,-37]],3),terminal:'beach-services'},
];
// Junctions are shared coordinates, not nearby spline endpoints. Local streets
// form a connected network; only the regional access continues out of town.
export function nearestRoutePoint(p:MapPoint,r:MapRoute):MapPoint{
 let best:MapPoint=r.points[0],distance=Infinity;
 for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],du=b[0]-a[0],dv=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*du+(p[1]-a[1])*dv)/(du*du+dv*dv||1)));
  const q:MapPoint=[a[0]+du*t,a[1]+dv*t],d=Math.hypot(p[0]-q[0],p[1]-q[1]);if(d<distance){best=q;distance=d;}
 }return best;
}
const endpointLinks:[string,number,string][]=[['bairro-central',0,'avenida-central'],['rua-do-hospital',0,'avenida-central'],['rua-do-hospital',-1,'bairro-central'],['ligacao-hospital',0,'avenida-central'],['ligacao-hospital',-1,'avenida-estacao'],['bairro-norte',-1,'acesso-industrial'],['bairro-escola',0,'avenida-botanica'],['avenida-botanica',0,'acesso-futuro'],['acesso-futuro',-1,'avenida-central'],['acesso-carga',0,'patio-industrial'],['acesso-carga',-1,'patio-industrial'],['acesso-viaduto',0,'comunidade'],['acesso-praia',0,'comunidade']];
endpointLinks.push(['avenida-estacao',-1,'comunidade'],['acesso-docas',0,'acesso-carga'],['acesso-docas',-1,'patio-industrial']);
endpointLinks.push(['avenida-estacao',0,'margem-central'],['margem-central',-1,'bairro-central'],['rua-escola-sul',0,'bairro-escola'],['rua-escola-sul',-1,'comunidade'],['avenida-botanica',-1,'rua-escola-sul'],['reciclagem',-1,'rua-escola-sul'],['anel-escola',-1,'rua-escola-sul'],['comunidade',0,'rua-do-hospital'],['comunidade',-1,'bairro-central']);
for(const [id,end,target]of endpointLinks){
 const r=mapRoads.find(r=>r.id===id)!,other=mapRoads.find(r=>r.id===target)!,index=end===0?0:r.points.length-1,q=id==='avenida-botanica'&&end===0?other.points[0]:id==='rua-do-hospital'&&end===0?other.points.at(-1)!:nearestRoutePoint(r.points[index],other);
 // Blend the last metres into the exact node without a sharp final kink.
 const delta:MapPoint=[q[0]-r.points[index][0],q[1]-r.points[index][1]];
 for(let j=0;j<12;j++){const i=end===0?j:index-j,t=(1-j/12)**2;r.points[i]=[r.points[i][0]+delta[0]*t,r.points[i][1]+delta[1]*t];}
}
// Approach the botanical avenue from inside the school district and stop at
// its first real connection. Endpoint snapping left a tiny return behind that
// crossing, creating a second junction and overlapping zebra stripes.
const schoolStreet=mapRoads.find(r=>r.id==='bairro-escola')!;
const schoolApproachEnd=sampleLine(schoolStreet.points,20);
const schoolApproach=[...schoolStreet.points.slice(0,schoolApproachEnd.index),schoolApproachEnd.point];
schoolStreet.points=[...trimRoadApproach(schoolApproach.reverse(),mapRoads.find(r=>r.id==='avenida-botanica')!.points).reverse(),...schoolStreet.points.slice(schoolApproachEnd.index)];
// The station avenue joins the community at its first intersection, rather
// than crossing it and following an overlapping tail to a second junction.
const stationAvenue=mapRoads.find(r=>r.id==='avenida-estacao')!;
stationAvenue.points=trimRoadApproach(stationAvenue.points,mapRoads.find(r=>r.id==='comunidade')!.points);
stationAvenue.points=squareRoadApproach(stationAvenue.points,mapRoads.find(r=>r.id==='comunidade')!.points);
// The destination is curved: the new approach may meet an earlier portion.
// End there rather than continuing across the community block.
stationAvenue.points=trimRoadApproach(stationAvenue.points,mapRoads.find(r=>r.id==='comunidade')!.points);
// The school connector shared a reversed stretch with the school street,
// producing three tiny crossings around the same corner. Keep only its own
// approach up to the first connection when coming from the south-east.
const schoolConnector=mapRoads.find(r=>r.id==='anel-escola')!;
schoolConnector.points=trimRoadApproach([...schoolConnector.points].reverse(),mapRoads.find(r=>r.id==='bairro-escola')!.points).reverse();
export const roadViaduct=route('viaduto-leste',[[31,35],[48,31],[70,23],[92,9],[105,-8],[139,-36],[180,-44]],4.3,4.5);
roadViaduct.points[0]=nearestRoutePoint(roadViaduct.points[0],mapRoads.find(r=>r.id==='ligacao-hospital')!);
const coastRamp=mapRoads.find(r=>r.id==='acesso-viaduto')!;
// Insert the exact shared T junction; a nearby spline sample is not a connection.
const viaductJoin=nearestRoutePoint([105,-8],roadViaduct);
coastRamp.points[coastRamp.points.length-1]=viaductJoin;
const viaductJoinIndex=roadViaduct.points.findIndex((p,i)=>i>0&&segmentDistance(viaductJoin,roadViaduct.points[i-1],p)<1e-6);
roadViaduct.points.splice(viaductJoinIndex,0,viaductJoin);
const dumpEntry=nearestRoutePoint(dumpSite.gate,mapRoads.find(r=>r.id==='acesso-carga')!);
// Blend the service approach into the eastbound internal route instead of
// joining two straight ribbons at a sharp corner at the gate.
const dumpControl:MapPoint=[dumpSite.gate[0]-4,dumpSite.gate[1]];
const dumpApproach=Array.from({length:65},(_,i)=>{
 const t=i/64,s=1-t;
 return [s*s*dumpEntry[0]+2*s*t*dumpControl[0]+t*t*dumpSite.gate[0],s*s*dumpEntry[1]+2*s*t*dumpControl[1]+t*t*dumpSite.gate[1]] as MapPoint;
});
export const dumpDriveway:MapRoute={id:'acesso-lixao',kind:'road',width:3.5,points:[...dumpApproach,dumpSite.turning]};
const savedTurnHandles=import.meta.env?.SSR?undefined:(preparedLayout as unknown as {dumpTurnHandles?:MapPoint[]}).dumpTurnHandles;
export const dumpEntryTurns=serviceTurns(mapRoads.find(r=>r.id==='acesso-carga')!.points,dumpDriveway.points,3.8,savedTurnHandles);
export const dumpTurnHandles=dumpEntryTurns.map(turn=>turn.handles);
export const dumpTurnPads=dumpEntryTurns.map(turn=>convexHull(turn.samples.flatMap(sample=>{
 const truck=placement('prop.truck',...sample.point,1,facing(...sample.heading));
 const bounds=layoutFor(truck.asset)!.bounds;
 return [bounds.min[0]-.3,bounds.max[0]+.3].flatMap(x=>[bounds.min[2]-.3,bounds.max[2]+.3].map(z=>{
  const p=attachmentWorld(truck,[x,0,z]);return compositionPoint(p[0],p[2]);
 }));
})));
export const roadTerminals=mapRoads.filter(r=>r.terminal).map(r=>({road:r.id,point:r.points.at(-1)!,radius:2.7,destination:r.terminal}));
export const roadProfiles=buildRoadProfiles(mapRoads,(r,[u,v])=>{
 if(r.id==='acesso-viaduto')return Math.hypot(u-viaductJoin[0],v-viaductJoin[1])<5?4.5:0;
 if(r.id==='ponte-industrial')return Math.abs(u-canalU(v))<4.5+r.width/2+.6?1.3:0;
 if(r.id==='acesso-futuro'&&u>-56&&u< -30)return 2.8;
 // Only the two declared river bridges receive this constraint. A street
 // following the bank stays on the prepared ground beside the cycle corridor.
 if(['acesso-futuro','rua-escola-sul'].includes(r.id)&&Math.abs(u-riverU(v))<riverWidth(v)/2+4.2)return 2.8;
 return 0;
},.08);
export function roadHeightAt(r:MapRoute,p:MapPoint){return heightAlongRoad(r,roadProfiles.heights.get(r.id)??r.points.map((_,i)=>routeHeight(r,i)),p).height;}
/** Query a road surface only inside its paved corridor. There is no radial
 * height field raising adjacent plots, parallel streets or cycle paths. */
export function roadSurfaceHeight(u:number,v:number){
 let distance=Infinity,height=0;
 for(const r of mapRoads){const sample=heightAlongRoad(r,roadProfiles.heights.get(r.id)!,[u,v]);if(sample.distance<=r.width/2+.68&&sample.distance<distance){distance=sample.distance;height=sample.height;}}
 return height;
}
const viaductStartHeight=roadSurfaceHeight(...roadViaduct.points[0]);
const viaductDistances=roadViaduct.points.map((p,i)=>i===0?0:Math.hypot(p[0]-roadViaduct.points[i-1][0],p[1]-roadViaduct.points[i-1][1]));
for(let i=1;i<viaductDistances.length;i++)viaductDistances[i]+=viaductDistances[i-1];
export function routeHeight(r:MapRoute,index:number){
 index=Math.max(0,Math.min(r.points.length-1,index));
 if(r.id==='viaduto-leste')return Math.min(4.5,viaductStartHeight+Math.max(0,viaductDistances[index]-6)*.08);
 if(r.kind==='rail')return 5.4;
 return roadProfiles.heights.get(r.id)?.[index]??r.elevation??0;
}
const crossingRoads=[...mapRoads,roadViaduct];
export const circulationCrossings=buildJunctionCrossings(crossingRoads,[...roadProfiles.junctions,
 {point:roadViaduct.points[0],roads:[roadViaduct.id,'ligacao-hospital'],height:roadHeightAt(roadViaduct,roadViaduct.points[0])},
 {point:viaductJoin,roads:[roadViaduct.id,coastRamp.id],height:roadHeightAt(roadViaduct,viaductJoin)},
],(r,p)=>roadHeightAt(crossingRoads.find(other=>other.id===r.id)!,p));
export const junctionPriority=buildJunctionPriority(crossingRoads,circulationCrossings.crossings,(r,p)=>roadHeightAt(crossingRoads.find(road=>road.id===r.id)!,p));
export function blocksJunctionMarking(p:Placement){
 const poly=placementFootprint(p);
 return junctionPriority.some(mark=>Math.abs(p.position[1]-roadHeightAt(crossingRoads.find(r=>r.id===mark.road)!,mark.crossing.point))<1.5&&mark.reservations.some(area=>polygonGap(poly,area)<.2));
}
/** Excavated road corridors blend back into the mountain with earth batters. */
const terrainRoadBounds=mapRoads.map(r=>{
 const margin=r.width/2+.8+18;
 return {r,minU:Math.min(...r.points.map(p=>p[0]))-margin,maxU:Math.max(...r.points.map(p=>p[0]))+margin,minV:Math.min(...r.points.map(p=>p[1]))-margin,maxV:Math.max(...r.points.map(p=>p[1]))+margin};
});
export function terrainY(u:number,v:number){
 let y=reservoirBankHeight(u,v,naturalTerrainY(u,v))*(1-industrialGroundWeight(u,v));if(v<73)return y;
 for(const b of terrainRoadBounds){
  if(u<b.minU||u>b.maxU||v<b.minV||v>b.maxV)continue;
  const r=b.r,p=nearestRoutePoint([u,v],r),d=Math.hypot(u-p[0],v-p[1]),edge=r.width/2+.8;
  if(d<edge+18)y=Math.min(y,roadHeightAt(r,p)-.025+Math.max(0,d-edge)*.65);
 }return y;
}
export function gradedRotation(yaw:number,pitch:number):Vec3{
 const q=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),yaw).multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),pitch)),e=new Euler().setFromQuaternion(q);return [e.x,e.y,e.z];
}
export const centralRail=tracedRoute('linha-central',[[440,241],[659,252],[837,267],[1004,285],[1105,272],[1115,211]],2.1,.28,'rail');
// The campus is on the regional railway, not an isolated circular attraction.
// Its western continuation is beyond the camera's entire permitted footprint.
const railJoin=centralRail.points[0],railDirection=sampleLine(centralRail.points,0).tangent;
const westArc=mapCurve([[-175,61],[-137,61],[-108,62],[-93,67],[-82,77],[-66,80],[-54,74]],190);
const approachStart=westArc.at(-1)!,approachPrevious=westArc.at(-2)!,approachLength=Math.hypot(approachStart[0]-approachPrevious[0],approachStart[1]-approachPrevious[1]);
const approachControl:MapPoint=[approachStart[0]+(approachStart[0]-approachPrevious[0])*6/approachLength,approachStart[1]+(approachStart[1]-approachPrevious[1])*6/approachLength];
const approachEnd:MapPoint=[railJoin[0]-railDirection[0]*3,railJoin[1]-railDirection[1]*3];
const approachControlEnd:MapPoint=[railJoin[0]-railDirection[0]*9,railJoin[1]-railDirection[1]*9];
// Cubic approach with matching entry and exit tangents. Snapping the last
// samples of a spline to a line would introduce a kink before the joint.
const railApproach=Array.from({length:60},(_,i)=>{
 const t=(i+1)/60,s=1-t;
 return [0,1].map(k=>s*s*s*approachStart[k]+3*s*s*t*approachControl[k]+3*s*t*t*approachControlEnd[k]+t*t*t*approachEnd[k]) as MapPoint;
});
export const monorail:MapRoute={id:'ferrovia-oeste',kind:'rail',width:centralRail.width,elevation:5.4,points:[...westArc,...railApproach,...[1,2,3].map(d=>[approachEnd[0]+railDirection[0]*d,approachEnd[1]+railDirection[1]*d] as MapPoint)]};
monorail.points[monorail.points.length-1]=railJoin;
export const regionalRailPoints=[...monorail.points,...centralRail.points.slice(1)];
const stopNear=(name:string,route:MapRoute,target:MapPoint)=>{
 const index=route.points.reduce((best,p,i)=>Math.hypot(p[0]-target[0],p[1]-target[1])<Math.hypot(route.points[best][0]-target[0],route.points[best][1]-target[1])?i:best,0);
 return {name,route,index,distance:Math.max(11,Math.min(lineLength(route.points)-11,lineLength(route.points.slice(0,index+1))))};
};
export const railStops=[stopNear('Estação Central',centralRail,blueprint(875,273)),stopNear('Distrito Industrial',centralRail,centralRail.points.at(-1)!)];
export const railFacilities=buildStationFacilities([...railStops,stopNear('Campus do Futuro',monorail,[-67,80])],{
 roads:mapRoads,land:onReferenceLand,terrain:terrainY,railHeight:routeHeight,
 make:placement,footprint:placementFootprint,composition:compositionPoint,facing,
});
export const stationConcourses:MapRoute[]=railFacilities.flatMap((s,i)=>[
 {id:'acesso-plataforma-'+i,kind:'walk',points:s.upperWalk,width:1.5,elevation:s.height},
 {id:'escada-plataforma-'+i,kind:'walk',points:s.stairsJoin,width:1.5,elevation:s.height},
]);
function bridgeAt(v:number){
 const u=riverU(v),slope=(riverU(v+.15)-riverU(v-.15))/.3,n=Math.hypot(1,slope),du=1/n,dv=-slope/n;
 const end=(side:number):MapPoint=>{
  const cycle=riverCorridors.find(c=>c.side===side)!.cycle;let best=Infinity,point:MapPoint=[u+du*side*20,v+dv*side*20];
  for(let i=1;i<cycle.length;i++){
   const a=cycle[i-1],b=cycle[i],dx=b[0]-a[0],dy=b[1]-a[1],det=du*side*dy-dv*side*dx;if(Math.abs(det)<1e-9)continue;
   const x=a[0]-u,y=a[1]-v,t=(x*dy-y*dx)/det,s=(x*dv*side-y*du*side)/det;
   if(t>0&&t<best&&s>=0&&s<=1){best=t;point=[u+du*side*t,v+dv*side*t];}
  }return point;
 };
 const left=end(-1),right=end(1),point:MapPoint=[(left[0]+right[0])/2,(left[1]+right[1])/2];
 return {v,left,right,point,width:Math.hypot(right[0]-left[0],right[1]-left[1]),yaw:facing(right[0]-left[0],right[1]-left[1])-Math.PI/2};
}
export const bridges=[30,1,-23].map(preferred=>{
 for(let offset=0;offset<=14;offset++)for(const side of [-1,1]){
  const b=bridgeAt(preferred+offset*side);
  const safe=Array.from({length:25},(_,i)=>[b.left[0]+(b.right[0]-b.left[0])*i/24,b.left[1]+(b.right[1]-b.left[1])*i/24] as MapPoint).every(p=>mapRoads.every(r=>distanceToRoute(...p,r)>r.width/2+2.4));
  if(safe)return b;
 }throw new Error('Passarela sem faixa livre de tráfego: '+preferred);
});
// Authoring and tests compute the layout; the browser consumes the validated snapshot.
const prepared=import.meta.env?.SSR?null:preparedLayout as unknown as {referenceAssets:Placement[];referenceTrees:Placement[];referenceTraffic:Placement[];referenceFurniture:Placement[];buildingLots:BuildingLot[];pedestrianNetwork:ReturnType<typeof buildWalkNetwork>;streetLayout:ReturnType<typeof buildStreetLayout>};
export const streetLayout=prepared?.streetLayout??buildStreetLayout(mapRoads,roadViaduct,[roadViaduct.points[0],viaductJoin],roadTerminals);
export function atRoadJunction(r:MapRoute,p:MapPoint){
 return [...mapRoads,roadViaduct].some(other=>other!==r&&distanceToRoute(...p,other)<other.width/2+1.15&&Math.abs(roadHeightAt(r,p)-roadHeightAt(other,p))<.12);
}
export const referenceAssets:Placement[]=prepared?.referenceAssets??[],referenceTrees:Placement[]=prepared?.referenceTrees??[],referenceTraffic:Placement[]=prepared?.referenceTraffic??[],referenceFurniture:Placement[]=prepared?.referenceFurniture??[];
export const districts:Record<string,MapPoint>={futuro:[-64,54],estacao:[5,29],hospital:[37,13],escola:[-57,-20],reciclagem:[-66,-48],industria:[80,57],desmatamento:[38,73],comunidade:[28,-18],praia:[49,-43]};
export interface BuildingLot {id:string;u:number;v:number;radius:number;placement:Placement;footprint:MapPoint[]}
export const buildingLots:BuildingLot[]=prepared?.buildingLots??[];
export function placement(asset:string,u:number,v:number,size=1,yaw=0,y=0):Placement{return {asset,position:worldPoint(u,v,y),scale:[size,size,size],rotation:[0,yaw,0]};}
function add(asset:string,u:number,v:number,size=1,yaw=0,y=0){const p=placement(asset,u,v,size,yaw,y);referenceAssets.push(p);return p;}
export const pointInFootprint=contains;
const pointSegment=segmentDistance;
export const footprintGap=polygonGap;
export function placementFootprint(p:Placement):MapPoint[]{const b=layoutFor(p.asset)!.bounds;return [[b.min[0],b.min[2]],[b.max[0],b.min[2]],[b.max[0],b.max[2]],[b.min[0],b.max[2]]].map(([x,z])=>{const w=attachmentWorld(p,[x,0,z]);return compositionPoint(w[0],w[2]);});}
// Reserve outdoor equipment before populating the neighbouring buildings.
// These are circulation destinations and obstacles, just like enclosed lots.
export const publicLots=[
 {id:'quadra-escolar',placement:placement('prop.football',-46.75,-22.75,1.7,frontYaw)},
 {id:'playground-escolar',placement:placement('prop.playground',...blueprint(464,701),1.45,0)},
].map(l=>({...l,footprint:placementFootprint(l.placement)}));
export const stationAccessLots=railFacilities.flatMap((s,i)=>[
 {id:'estacao-'+i+'-escada',placement:s.stairs,footprint:s.groundFootprints[0],entry:s.stairsEntry,height:0},
 {id:'estacao-'+i+'-elevador',placement:placement('prop.liftLanding',...s.lift,1,facing(...s.n)),footprint:s.groundFootprints[1],entry:s.liftEntry,height:0},
]);
function situationFootprints(id:string,anchor:Placement){
 return Object.values(situationVisuals[id]).flatMap(state=>state.assets).filter(p=>layoutFor(p.asset)).map(p=>{
  const w=attachmentWorld({...anchor,scale:[1,1,1]},p.position);
  return placementFootprint({...p,position:w,rotation:[0,(anchor.rotation?.[1]??0)+(p.rotation?.[1]??0),0]});
 });
}
const natureReservation=situationFootprints('nature_02',placement('prop.information',22,-17,1,frontYaw));
// Keep the small inner pocket between the hospital, central and school-road
// approaches planted. Its exits are enclosed by ramps and adjacent buildings;
// filling the first free footprint here merely transfers an unreachable address.
export const rampInfillReservation:MapPoint[]=[[8,-4],[13,1],[23,-1],[22,-9],[11,-11]];
const missionReservations:MapPoint[][]=[...natureReservation,...situationFootprints('nature_01',placement('prop.information',17,80,1)),...publicLots.map(l=>l.footprint),dumpSite.footprint,rampInfillReservation];
function siteFree(p:Placement,id:string){
 const poly=placementFootprint(p);
 // A search for room must not silently move an ordinary address onto the
 // unprepared mountain. The complete foundation needs level, walkable land.
 if(Math.abs(p.position[1])>.04||poly.some(q=>Math.abs(terrainY(...q)-p.position[1])>.08))return false;
 if(corridorGap(poly,dumpDriveway.points,dumpDriveway.width)<.8)return false;
 if(dumpTurnPads.some(pad=>polygonGap(poly,pad)<.8))return false;
 if(publicLots.some(l=>footprintGap(poly,l.footprint)<1.4))return false;
 if(missionReservations.some(reserve=>footprintGap(poly,reserve)<.8))return false;
 if(riverCorridors.some(c=>corridorGap(poly,c.walk,c.walkWidth)<.6||corridorGap(poly,c.cycle,c.cycleWidth)<.65))return false;
 if(poly.some((a,i)=>{const b=poly[(i+1)%4],n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.5);return Array.from({length:n+1},(_,j)=>[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n] as MapPoint).some(q=>!onReferenceLand(...q));}))return false;
 const bounds=layoutFor(p.asset)!.bounds,front=attachmentWorld(p,[0,0,bounds.max[2]+.7]),entry=compositionPoint(front[0],front[2]);
 if(!onReferenceLand(...entry)||mapRoads.some(r=>distanceToRoute(...entry,r)<r.width/2+.8))return false;
 if(buildingLots.some(l=>footprintGap(poly,l.footprint)<1.65))return false;
 if(railFacilities.some(s=>footprintGap(poly,s.footprint)<.4))return false;
 if(stationAccessLots.some(s=>footprintGap(poly,s.footprint)<.95))return false;
 if(stationConcourses.some(s=>corridorGap(poly,s.points,s.width)<.4))return false;
 for(const road of [...mapRoads,roadViaduct])if(corridorGap(poly,road.points,road.width)<.85)return false;
 if(roadTerminals.some(t=>poly.some(p=>Math.hypot(p[0]-t.point[0],p[1]-t.point[1])<t.radius+1.2)))return false;
 // These functional plots keep their playing area and train clearance.
 const reservations=[[464,701,3.7],[322,337,3.7],[856,400,3.4]].map(([x,y,r])=>{const [u,v]=blueprint(x,y);return {u,v,r};});
 if(reservations.some(q=>poly.some(p=>Math.hypot(p[0]-q.u,p[1]-q.v)<q.r)))return false;
 if(!id.startsWith('estacao'))for(const q of centralRail.points){if(pointInFootprint(q,poly)||poly.some((p,i)=>pointSegment(q,p,poly[(i+1)%4])<1.3))return false;}
 for(const q of monorail.points){if(pointInFootprint(q,poly)||poly.some((p,i)=>pointSegment(q,p,poly[(i+1)%4])<1.1))return false;}
 return true;
}
function building(id:string,asset:string,u:number,v:number,size=1,yaw=0,radius=3){
 const target:MapPoint=[u,v];let p=placement(asset,u,v,size,yaw,terrainY(u,v)),found=siteFree(p,id);
 for(let r=.65;!found&&r<=30;r+=.65)for(let i=0;i<32&&!found;i++){
  const a=i*Math.PI/16,nu=target[0]+Math.cos(a)*r,nv=target[1]+Math.sin(a)*r;
  const candidate=placement(asset,nu,nv,size,yaw,terrainY(nu,nv));
  if(siteFree(candidate,id)){p=candidate;u=nu;v=nv;found=true;}
 }
 // A filled block must never win over a safe road or river. An unplaceable
 // secondary address can be reported by the layout audit and deliberately moved.
 if(!found)throw Object.assign(new Error('Sem terreno livre para '+id),{layoutState:{buildingLots,mapRoads,roadViaduct,riverSamples,riverU,riverWidth,canalU,canalSamples,monorail,centralRail,roadProfiles,routeHeight,pedestrianNetwork:{unreachable:[id]}}});
 if(id==='industria-0')missionReservations.push(...situationFootprints('health_02',p));
 referenceAssets.push(p);buildingLots.push({id,u,v,radius:Math.max(radius,size*1.8),placement:p,footprint:placementFootprint(p)});return p;
}
if(!prepared){
building('observatorio','building.observatory',-63,64,1.42,frontYaw,3);
building('centro-do-futuro','building.ecodome',-62,46,1.55,frontYaw,5.3);
building('campus-circular','building.ecodome',-78,49,1.04,frontYaw,3.7);
building('torre-energia','building.office',-49,60,1.42,-.15,2.9);
building('torre-jardins','building.cream',-76,63,1.5,0,2.8);
building('laboratorio-circular','building.ecodome',-49,61,.96,.1,3.7);
building('laboratorio-energia','building.terracotta',-72,50,1.5,.1,2.9);
function tracedBuilding(id:string,asset:string,x:number,y:number,size:number,yaw=0,radius=3){const [u,v]=blueprint(x,y);return building(id,asset,u,v,size,yaw,radius);}
tracedBuilding('estacao-central','building.centralStation',866,367,1.52,frontYaw-.24,6.6);
for(const s of railFacilities){
 for(let d=-9;d<=9;d+=3){const sample=sampleLine(s.route.points,s.distance+d),t=sample.tangent;
  add('prop.platformCanopy',sample.point[0]-t[1]*s.side*1.85,sample.point[1]+t[0]*s.side*1.85,1,facing(t[0]*-s.side,t[1]*-s.side)-Math.PI/2,s.height);
 }
}
tracedBuilding('hospital','building.hospital',1168,476,3.0,frontYaw-.25,8.1);
tracedBuilding('escola','building.solarSchool',415,640,1.4,0,5.8);
tracedBuilding('reciclagem','building.recycling',249,817,1.7,0,7.5);
tracedBuilding('estufa-botanica','building.greenhouse',201,438,2.0,0,4.5);
tracedBuilding('estacao-solar','building.station',1025,413,1.0,0,3.6);
tracedBuilding('comunidade-a-recuperar','building.ruined',1030,667,1.5,frontYaw-.25,4.4);
tracedBuilding('comunidade-vizinha','building.ruined',956,575,1.4,0,3.9);
tracedBuilding('posto-da-orla','building.fishMarket',1315,763,1.45,frontYaw-.2,4.3);
tracedBuilding('cafe-da-praia','building.cafe',1104,756,1.4,0,2.8);
industrialSite.factories.forEach(({point,scale},i)=>building('industria-'+i,'building.industrial',...point,scale,frontYaw,5.5));
// Individual, street-facing lots. Deliberate gaps belong to planted courtyards.
const houses:MapPoint[]=[[64,573],[151,583],[244,539],[291,593],[207,641],[120,653],[273,725],[353,606],[372,749],[654,390],[716,405],[778,397],[780,250],[834,261],[892,276],[953,273],[1015,284],[1066,296],[1126,305],[800,594],[865,650],[919,681],[1225,687],[73,263],[306,282],[348,232],[312,159],[758,178]];
const towers:[number,number,number?][]=[[500,390,2],[575,452,2.1],[651,486,1.9],[716,519,1.8],[705,245,2.1],[1026,289,1.75],[906,574,1.8],[838,565,1.8],[967,622,1.8],[548,730,1.8],[761,260,1.75]];
towers.forEach(([x,y,s=1.8],i)=>{
 // These infill towers face grounded streets outside the river-bridge ramp
 // block. The former eighth site was enclosed by raised approaches and had
 // no continuous ground route to the public pavement.
 const point=i===6?[30,6] as MapPoint:i===7?[43,-18] as MapPoint:i===8?[44,39] as MapPoint:blueprint(x,y);
 building('torre-'+i,['building.sage','building.cream','building.office','building.pink','building.terracotta'][i%5],...point,s,(i%2)*.10,3.3);
});
const northHomes:Record<number,MapPoint>={10:[-9,79],11:[4,80],12:[17,79],13:[-4,65],14:[-85,-8],15:[18,61],16:[3,56],17:[14,54]};
houses.forEach(([x,y],i)=>{
 const point=northHomes[i]??blueprint(x,y);
 building('casa-'+i,['building.house.cottage','building.house.terrace','building.house.cottage','building.house.cream'][i%4],...point,1.66+(i%3)*.035,(i%3-1)*.12,3.1);
});
for(const l of publicLots){
 for(const r of mapRoads)if(corridorGap(l.footprint,r.points,r.width)<.85)throw new Error('Equipamento público invade corredor: '+l.id+' / '+r.id);
 referenceAssets.push(l.placement);
}
add('prop.court',...blueprint(322,337),1.1,frontYaw);add('prop.fountain',...blueprint(171,326),1.7);
add('prop.dam',-36,84,1,frontYaw,-.55);
for(const b of bridges){const p=add('prop.archedBridge',...b.point,1,b.yaw,-.13);p.scale=[b.width/12,1.15,1.04];}
add('prop.lighthouse',78,-37,1.25,frontYaw,1.1);
add('prop.pier',52,-49,1.3,frontYaw+Math.PI/2,-.02);
for(const [u,v,yaw]of [[43,-60,.3],[64,-55,2],[77,-51,-.6],[60,-68,1.1]])add('prop.sailboat',u,v,1.5,yaw,-.5);
for(const index of [15,35,60,82]){const [u,v]=beachLine[index];if(Math.abs(u-52)>3)add('prop.beach',u,v+1.2,.95,frontYaw+.2);}
for(const [u,v]of [[-85,63],[-73,73],[-89,87],[32,87],[42,89],[46,82]])add('prop.turbine',u,v,1.7,frontYaw,terrainY(u,v));
for(let i=0;i<12;i++)add('prop.solarRack',31+(i%3)*3.8,72+Math.floor(i/3)*3.0,1,frontYaw,terrainY(31+(i%3)*3.8,72+Math.floor(i/3)*3.0));
for(let i=0;i<3;i++)add('prop.pylon',58+i*4,51+i*7,.88,frontYaw,terrainY(58+i*4,51+i*7));
for(const [u,v]of [[9,76],[24,78]])add('prop.excavator',u,v,1.1,frontYaw-.8,terrainY(u,v));
for(let i=0;i<24;i++){const u=3+(i%6)*4.6,v=74+Math.floor(i/6)*4.3;add('prop.stump',u,v,1.5,0,terrainY(u,v));}
// The eastern lot is a dump. Its scenery belongs to pollution_01 and is
// rendered by mission state; no static container yard remains here.
// Service assets use the same road/land checks as the architecture. In
// particular, the long excavator arm and power crossarms need real clearance.
for(const [i,p]of referenceAssets.entries()){
 if(!['prop.excavator','prop.pylon','prop.turbine'].includes(p.asset))continue;
 const [u,v]=compositionPoint(p.position[0],p.position[2]);
 const safe=(candidate:Placement)=>{
  const poly=placementFootprint(candidate);
  if(poly.some(([x,z])=>!onReferenceLand(x,z)))return false;
  if(buildingLots.some(l=>footprintGap(poly,l.footprint)<.5))return false;
  if(stationAccessLots.some(l=>footprintGap(poly,l.footprint)<.7))return false;
  if(stationConcourses.some(r=>corridorGap(poly,r.points,r.width)<.7))return false;
  if(p.asset==='prop.turbine'&&[monorail,centralRail].some(r=>corridorGap(poly,r.points,r.width)<.6))return false;
  for(const road of mapRoads)for(const q of road.points)if(pointInFootprint(q,poly)||poly.some((p,j)=>pointSegment(q,p,poly[(j+1)%4])<road.width/2+.2))return false;
  return true;
 };
 if(safe(p))continue;
 let done=false;for(let r=1;r<=12&&!done;r++)for(let a=0;a<24&&!done;a++){
  const x=u+Math.cos(a*Math.PI/12)*r,z=v+Math.sin(a*Math.PI/12)*r,candidate={...p,position:worldPoint(x,z,terrainY(x,z))};
  if(safe(candidate)){referenceAssets[i]=candidate;done=true;}
 }
 if(!done)throw new Error('Equipamento sem área de serviço: '+p.asset);
}

}
export function distanceToRoute(u:number,v:number,r:MapRoute){let min=Infinity;for(let i=1;i<r.points.length;i++){const [ax,ay]=r.points[i-1],[bx,by]=r.points[i],dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((u-ax)*dx+(v-ay)*dy)/(dx*dx+dy*dy)));min=Math.min(min,Math.hypot(u-ax-t*dx,v-ay-t*dy));}return min;}
export function onReferenceLand(u:number,v:number){
 if(v< -140||u< -120||u>145)return false;
 if(Math.abs(u-riverU(v))<riverWidth(v)/2+.4||Math.abs(u-canalU(v))<4.9)return false;
 if(contains([u,v],reservoirOutline))return false;
 return landOutlines.some(poly=>contains([u,v],poly));
}

export const industrialAprons=buildingLots.filter(l=>l.id.startsWith('industria-')).map(l=>{
 const model=layoutFor(l.placement.asset)!,load=attachmentWorld(l.placement,[0,0,model.bounds.max[2]]),door=attachmentWorld(l.placement,[model.entry![0],0,model.bounds.max[2]]);
 const loading=compositionPoint(load[0],load[2]),staff=compositionPoint(door[0],door[2]);
 const road=mapRoads.find(r=>r.id===(l.v>90?'patio-industrial':'acesso-docas'))!,axis=nearestRoutePoint(loading,road),outer=axis[1]+road.width/2+.68;
 const min=Math.min(...l.footprint.map(p=>p[0])),max=Math.max(...l.footprint.map(p=>p[0]));
 const footprint:MapPoint[]=[[min,loading[1]],[max,loading[1]],[max,outer-.25],[min,outer-.25]];
 const bay:MapPoint=[loading[0]-3.7,loading[1]-2.8];
 const maneuver=loadingManeuver(loading,axis);
 const swept= maneuver.samples.map(s=>{
  const truck=placement('prop.truck',...s.point,1,facing(...s.heading));
  const bounds=layoutFor('prop.truck')!.bounds;
  // Reserve a 25 cm margin around the full vehicle, including its overhang.
  truck.scale=[1+.5/(bounds.max[0]-bounds.min[0]),1,1+.5/(bounds.max[2]-bounds.min[2])];
  return placementFootprint(truck);
 });
 return {id:l.id,loading,staff,axis,footprint,bay,road:road.id,driveway:[loading,axis] as MapPoint[],staffPath:[staff,[staff[0],outer]] as MapPoint[],maneuver,swept};
});

export const pedestrianNetwork=prepared?.pedestrianNetwork??buildWalkNetwork([...buildingLots,...publicLots].map(l=>{
 const layout=layoutFor(l.placement.asset)!;
 // Continue the entrance axis beyond the model's own paved apron. A door
 // recessed behind that apron is not a valid starting cell for the flood.
 const w=attachmentWorld(l.placement,[layout.entry?.[0]??0,0,Math.max(layout.entry?.[2]??layout.bounds.max[2],layout.bounds.max[2])]);
 return {id:l.id,entry:compositionPoint(w[0],w[2]),footprint:l.footprint,height:l.placement.position[1]};
}).concat(stationAccessLots),mapRoads.map(r=>({points:r.points,width:r.width,heights:r.points.map((_,i)=>routeHeight(r,i))})),onReferenceLand);
if(!prepared){
 const hall=pedestrianNetwork.links.find(l=>l.id==='estacao-central')!;
 const obstacles=[...buildingLots,...publicLots,...stationAccessLots].map(l=>l.footprint);
 const usable=(p:MapPoint)=>onReferenceLand(...p)&&Math.abs(terrainY(...p))<.05&&mapRoads.every(r=>roadHeightAt(r,p)>=2.2||distanceToRoute(...p,r)>=r.width/2+.15);
 for(const kind of ['escada','elevador']){
  const target=pedestrianNetwork.links.find(l=>l.id==='estacao-0-'+kind)!;
  const end=target.points.at(-1)!,points=groundConnection(hall.points.at(-1)!,end,obstacles,usable);
  pedestrianNetwork.links.push({id:'praca-estacao-'+kind,points,height:0,accessHeight:0,sidewalk:end,lift:false});
 }
}
export function liftAssets(point:MapPoint,bottom:number,top:number,yaw:number):Placement[]{
 const lower=Math.min(bottom,top),upper=Math.max(bottom,top),shaft=placement('prop.liftShaft',...point,1,yaw,lower);
 shaft.scale=[1,upper-lower,1];return [shaft,placement('prop.liftLanding',...point,1,yaw,lower),placement('prop.liftLanding',...point,1,yaw,upper)];
}
if(!prepared)for(const s of railFacilities)referenceAssets.push(s.stairs,...liftAssets(s.lift,0,s.height,facing(...s.n)));
if(!prepared){
 referenceAssets.push(placement('prop.industrialGate',...industrialSite.gate,1,frontYaw+Math.PI/2));
 for(const apron of industrialAprons)referenceTraffic.push(placement('prop.truck',...apron.bay,1,frontYaw,.08));
}
// Seeded spacing and a shared clearance rule keep roots off paths and buildings.
let seed=5173;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const clearings=[{u:17,v:80,ru:19,rv:10},{u:36,v:78,ru:9,rv:9},{u:81,v:36,ru:12,rv:8},{u:97,v:53,ru:15,rv:17},{u:-47.5,v:-22.5,ru:8,rv:6},{u:-36,v:-21.5,ru:5,rv:5},{u:-51,v:44,ru:6,rv:4},{u:33,v:-19,ru:10,rv:9}];
if(!prepared){
for(let v=-78;v<124;v+=1.8)for(let u=-124;u<125;u+=1.85){
 const x=u+(random()-.5)*1.1,z=v+(random()-.5)*1.1;
 if(riverCorridors.some(c=>distanceToRoute(x,z,{id:'river-path',points:c.cycle,width:c.cycleWidth})<2.15||distanceToRoute(x,z,{id:'river-walk',points:c.walk,width:c.walkWidth})<1.95))continue;
 if(Math.hypot(x-industrialSite.gate[0],z-industrialSite.gate[1])<6)continue;
 if(distanceToRoute(x,z,dumpDriveway)<dumpDriveway.width/2+1.6)continue;
 if(dumpTurnPads.some(pad=>contains([x,z],pad)||pad.some((p,i)=>segmentDistance([x,z],p,pad[(i+1)%pad.length])<2)))continue;
 if(industrialAprons.some(a=>contains([x,z],a.footprint)||corridorGap([[x-1,z-1],[x+1,z-1],[x+1,z+1],[x-1,z+1]],a.driveway,3.5)<.3))continue;
 if(pedestrianNetwork.links.some(link=>link.points.some((p,i)=>i>0&&segmentDistance([x,z],link.points[i-1],p)<1.65)))continue;
 if(!onReferenceLand(x,z)||clearings.some(c=>((x-c.u)/c.ru)**2+((z-c.v)/c.rv)**2<1))continue;
 if(missionReservations.some(poly=>contains([x,z],poly)||poly.some((p,i)=>segmentDistance([x,z],p,poly[(i+1)%poly.length])<1)))continue;
 if(buildingLots.some(l=>Math.hypot(x-l.u,z-l.v)<l.radius+1.05||pointInFootprint([x,z],l.footprint)))continue;
 if(stationAccessLots.some(s=>s.footprint.some(p=>Math.hypot(x-p[0],z-p[1])<2)||pointInFootprint([x,z],s.footprint)))continue;
 if(referenceAssets.some(p=>!p.asset.startsWith('tree.')&&Math.hypot(p.position[0]-worldPoint(x,z)[0],p.position[2]-worldPoint(x,z)[2])<2.1))continue;
 if(mapRoads.some(r=>distanceToRoute(x,z,r)<r.width/2+1.55))continue;
 if(distanceToRoute(x,z,centralRail)<2.5||distanceToRoute(x,z,monorail)<1.6||distanceToRoute(x,z,roadViaduct)<3.7)continue;
 const riverside=Math.abs(x-riverU(z))<riverWidth(z)/2+4.4;
 if(riverside||Math.abs(x-canalU(z))<7)continue;
 const urban=x>-82&&x<62&&z<61;
 if(urban&&random()>.53)continue;
 if(x>64&&z<79&&random()>.15)continue;
 const species=z>65?['tree.fir','tree.oak','tree.fir','tree.oak','tree.thicket']:['tree.oak','tree.maple','tree.birch','tree.default','tree.blossom','tree.thicket'];
 const size=(urban?.87:1.22)+random()*.28;
 referenceTrees.push(placement(species[Math.floor(random()*species.length)],x,z,size,random()*6.28,terrainY(x,z)));
}
// Redistribute trees displaced by new circulation instead of reducing the
// authored forest population. This runs only during layout generation.
for(let i=0;referenceTrees.length<5686&&i<40000;i++){
 const u=-117+random()*257,v=-76+random()*188;
 if(riverCorridors.some(c=>distanceToRoute(u,v,{id:'river-path',points:c.cycle,width:c.cycleWidth})<2.15||distanceToRoute(u,v,{id:'river-walk',points:c.walk,width:c.walkWidth})<1.95))continue;
 if(Math.hypot(u-industrialSite.gate[0],v-industrialSite.gate[1])<6)continue;
 if(distanceToRoute(u,v,dumpDriveway)<dumpDriveway.width/2+1.6)continue;
 if(dumpTurnPads.some(pad=>contains([u,v],pad)||pad.some((p,i)=>segmentDistance([u,v],p,pad[(i+1)%pad.length])<2)))continue;
 if(industrialAprons.some(a=>contains([u,v],a.footprint)||corridorGap([[u-1,v-1],[u+1,v-1],[u+1,v+1],[u-1,v+1]],a.driveway,3.5)<.3))continue;
 if(!onReferenceLand(u,v)||clearings.some(c=>((u-c.u)/c.ru)**2+((v-c.v)/c.rv)**2<1.1))continue;
 if(Math.abs(u-riverU(v))<riverWidth(v)/2+5||Math.abs(u-canalU(v))<7)continue;
 if(mapRoads.some(r=>distanceToRoute(u,v,r)<r.width/2+1.7)||[centralRail,monorail,roadViaduct].some(r=>distanceToRoute(u,v,r)<r.width/2+1.5))continue;
 if(buildingLots.some(l=>pointInFootprint([u,v],l.footprint)||l.footprint.some((p,j)=>segmentDistance([u,v],p,l.footprint[(j+1)%4])<1.3)))continue;
 if(missionReservations.some(poly=>contains([u,v],poly)))continue;
 if(stationAccessLots.some(s=>s.footprint.some(p=>Math.hypot(u-p[0],v-p[1])<2)||pointInFootprint([u,v],s.footprint)))continue;
 if(pedestrianNetwork.links.some(link=>link.points.some((p,j)=>j>0&&segmentDistance([u,v],link.points[j-1],p)<1.6)))continue;
 const world=worldPoint(u,v,terrainY(u,v));
 if(referenceTrees.some(p=>Math.hypot(p.position[0]-world[0],p.position[2]-world[2])<1.5)||referenceAssets.some(p=>Math.hypot(p.position[0]-world[0],p.position[2]-world[2])<2.2))continue;
 referenceTrees.push(placement(i%3?'tree.oak':'tree.fir',u,v,1.06+random()*.2,random()*6.28,world[1]));
}
// Trunk-centre reservations are insufficient beside an elevated deck: wide
// crowns can emerge through the asphalt. Move affected trees, preserving each
// species and scale, instead of cutting foliage or reducing the population.
const elevatedRoutes=[...mapRoads.filter(r=>r.points.some((_,i)=>routeHeight(r,i)>.4)),roadViaduct,monorail,centralRail];
const gateRoad=mapRoads.find(r=>r.id==='acesso-carga')!,gateMark=industrialYieldGeometry(gateRoad);
const gateView=convexHull([...gateMark.triangle,...gateMark.line.flat()].map(([u,v]):MapPoint=>[u,v+(roadHeightAt(gateRoad,[u,v])+.061)*h/130]));
const apronTreeBounds=industrialAprons.map(apron=>({apron,minU:Math.min(...[...apron.footprint,...apron.staffPath].map(p=>p[0]))-.7,maxU:Math.max(...[...apron.footprint,...apron.staffPath].map(p=>p[0]))+.7,minV:Math.min(...[...apron.footprint,...apron.staffPath].map(p=>p[1]))-.7,maxV:Math.max(...[...apron.footprint,...apron.staffPath].map(p=>p[1]))+.7}));
const crownConflict=(tree:Placement)=>{
 const [u,v]=compositionPoint(tree.position[0],tree.position[2]),bounds=layoutFor(tree.asset)!.bounds,scale=tree.scale??[1,1,1];
 // An unobstructed road surface can still be unreadable behind a foreground
 // crown. Reserve the marking in projection, retaining all relocated trees.
 if(Math.abs(u-gateMark.centre[0])<12&&Math.abs(v-gateMark.centre[1])<25&&polygonGap(placementViewFootprint(tree),gateView)<.35)return true;
 const radius=Math.hypot(Math.max(Math.abs(bounds.min[0]),Math.abs(bounds.max[0]))*scale[0],Math.max(Math.abs(bounds.min[2]),Math.abs(bounds.max[2]))*scale[2]);
 let poly:MapPoint[]|undefined;
 // The initial planting checks the trunk position. Reserve the entire crown
 // at loading aprons too, including trees later moved away from bridge decks.
 // Staff access is kept outside the truck manoeuvre and clear of vegetation.
 if(apronTreeBounds.some(({apron,minU,maxU,minV,maxV})=>u+radius>=minU&&u-radius<=maxU&&v+radius>=minV&&v-radius<=maxV&&(polygonGap(poly??=placementFootprint(tree),apron.footprint)<.3||corridorGap(poly,apron.staffPath,1.4)<.3)))return true;
 return elevatedRoutes.some(r=>{
  if(distanceToRoute(u,v,r)>r.width/2+.8+radius)return false;
  const height=roadHeightAt(r,[u,v]);
  if(tree.position[1]+bounds.max[1]*scale[1]<height-.8||tree.position[1]+bounds.min[1]*scale[1]>height+.3)return false;
  return corridorGap(poly??=placementFootprint(tree),r.points,r.width+1.35)<.3;
 });
};
for(let i=0;i<referenceTrees.length;i++){
 const tree=referenceTrees[i];if(!crownConflict(tree))continue;
 const [u,v]=compositionPoint(tree.position[0],tree.position[2]);let found=false;
 for(let radius=2;radius<=100&&!found;radius+=2)for(let angle=0;angle<24&&!found;angle++){
  const x=u+Math.cos(angle*Math.PI/12)*radius,z=v+Math.sin(angle*Math.PI/12)*radius;
  if(!onReferenceLand(x,z))continue;
  const candidate={...tree,position:worldPoint(x,z,terrainY(x,z))},poly=placementFootprint(candidate);
  if(crownConflict(candidate)||[...mapRoads,dumpDriveway].some(r=>corridorGap(poly,r.points,r.width+1.35)<.3))continue;
  if([...buildingLots,...publicLots,...stationAccessLots].some(l=>polygonGap(poly,l.footprint)<.4)||missionReservations.some(p=>polygonGap(poly,p)<.4)||dumpTurnPads.some(p=>polygonGap(poly,p)<.3))continue;
  if(pedestrianNetwork.links.some(l=>corridorGap(poly,[...l.points,l.sidewalk],1.4)<.3)||riverCorridors.some(c=>corridorGap(poly,c.cycle,c.cycleWidth)<.4||corridorGap(poly,c.walk,c.walkWidth)<.3))continue;
  if(poly.some(p=>!onReferenceLand(...p))||referenceTrees.some((p,j)=>j!==i&&Math.hypot(p.position[0]-candidate.position[0],p.position[2]-candidate.position[2])<1.8))continue;
  referenceTrees[i]=candidate;found=true;
 }
 if(!found)throw new Error('Árvore sem posição livre fora dos corredores: '+tree.asset+' '+u+','+v);
}
const trafficSources=new Map<Placement,{road:MapRoute;distance:number;side:number}>();
for(const r of mapRoads){
 let travelled=0,last=0;
 for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],du=b[0]-a[0],dv=b[1]-a[1],length=Math.hypot(du,dv);travelled+=length;
  if(travelled-last<4.2+random()*2)continue;last=travelled;
  const side=random()>.5?1:-1,u=b[0]+dv/length*r.width*.23*side,v=b[1]-du/length*r.width*.23*side;
  const asset=r.usage==='freight'?'prop.truck':!r.terminal&&random()>.89?'prop.bus':['prop.car.gold','prop.car.blue','prop.car.coral','prop.car.white'][Math.floor(random()*4)];
  if(bridges.some(b=>Math.min(Math.hypot(u-b.left[0],v-b.left[1]),Math.hypot(u-b.right[0],v-b.right[1]))<2.8))continue;
  const car=placement(asset,u,v,asset==='prop.bus'?.84:.93,facing(du*side,dv*side),routeHeight(r,i)+.09);
  car.rotation=gradedRotation(facing(du*side,dv*side),-Math.atan2(routeHeight(r,i)-routeHeight(r,i-1),length)*side);
  const carFootprint=placementFootprint(car);
  if(!r.usage&&mapRoads.some(other=>other.usage==='freight'&&Math.abs(roadHeightAt(other,[u,v])-car.position[1])<1.5&&corridorGap(carFootprint,other.points,other.width)<.3))continue;
  if(!referenceTraffic.some(p=>Math.abs(p.position[1]-car.position[1])<1.5&&footprintGap(placementFootprint(p),carFootprint)<.35)){
   referenceTraffic.push(car);trafficSources.set(car,{road:r,distance:travelled,side});
  }
  if(i%2===0){
   const lu=b[0]+dv/length*(r.width/2+.65),lv=b[1]-du/length*(r.width/2+.65);
   let lamp=placement('prop.lamp',lu,lv,.85,frontYaw,routeHeight(r,i)+.05);
   if(dumpTurnPads.some(pad=>polygonGap(placementFootprint(lamp),pad)<.25)){
    let found=false;
    for(let shift=2;shift<=30&&!found;shift+=2)for(const sign of [1,-1]){
     const distance=travelled+shift*sign;if(distance<0||distance>lineLength(r.points))continue;
     const frame=sampleLine(r.points,distance),[tx,tv]=frame.tangent,point:MapPoint=[frame.point[0]+tv*(r.width/2+.65),frame.point[1]-tx*(r.width/2+.65)];
     const candidate=placement('prop.lamp',...point,.85,frontYaw,roadHeightAt(r,point)+.05),poly=placementFootprint(candidate);
     if(!onReferenceLand(...point)||dumpTurnPads.some(pad=>polygonGap(poly,pad)<.25)||buildingLots.some(l=>polygonGap(poly,l.footprint)<.25)||referenceFurniture.some(p=>polygonGap(poly,placementFootprint(p))<.6))continue;
     lamp=candidate;found=true;break;
    }
    if(!found)throw new Error('Poste sem espaço fora da entrada do lixão');
   }
   referenceFurniture.push(lamp);
  }
 }
}
const clearTraffic=reserveTraffic(referenceTraffic,p=>{
 const poly=placementFootprint(p);
 const gateBlocked=Math.abs(p.position[1]-roadHeightAt(gateRoad,gateMark.centre))<1.5&&[gateMark.triangle,...gateMark.line].some(line=>corridorGap(poly,line,gateMark.width)<.15);
 return gateBlocked||blocksJunctionMarking(p)||circulationCrossings.crossings.some(c=>Math.abs(p.position[1]-roadHeightAt(crossingRoads.find(r=>r.id===c.road)!,c.point))<1.5&&footprintGap(poly,c.footprint)<.4);
},(p,offset)=>{
 const source=trafficSources.get(p);if(!source)return null;
 const {road:r,distance,side}=source,d=distance+offset,total=lineLength(r.points);
 if(d<2||d>total-2)return null;
 const frame=routeFrame(r.points,d,r.width*.23*side,q=>roadHeightAt(r,q));
 const next={...p,position:worldPoint(...frame.point,frame.height+.09),rotation:gradedRotation(facing(...frame.tangent)+(side<0?Math.PI:0),-Math.atan(frame.slope)*side)};
 const poly=placementFootprint(next);
 if(buildingLots.some(l=>footprintGap(poly,l.footprint)<.3)||publicLots.some(l=>footprintGap(poly,l.footprint)<.3))return null;
 if(!r.usage&&mapRoads.some(other=>other.usage==='freight'&&Math.abs(roadHeightAt(other,frame.point)-next.position[1])<1.5&&corridorGap(poly,other.points,other.width)<.3))return null;
 return next;
},(a,b)=>Math.abs(a.position[1]-b.position[1])<1.5&&footprintGap(placementFootprint(a),placementFootprint(b))<.35,300);
referenceTraffic.splice(0,referenceTraffic.length,...clearTraffic);
// Both compositions occupy the same connected route, sampled by distance.
for(const start of [lineLength(monorail.points)-49,lineLength(monorail.points)+30]){
 const r:MapRoute={id:'regional-train',kind:'rail',width:2.1,points:regionalRailPoints};
 const lengths=[0];for(let i=1;i<r.points.length;i++)lengths.push(lengths[i-1]+Math.hypot(r.points[i][0]-r.points[i-1][0],r.points[i][1]-r.points[i-1][1]));
 const sample=(distance:number)=>{let i=lengths.findIndex(l=>l>=distance);i=Math.max(1,i);const a=r.points[i-1],b=r.points[i],t=(distance-lengths[i-1])/(lengths[i]-lengths[i-1]);return {u:a[0]+(b[0]-a[0])*t,v:a[1]+(b[1]-a[1])*t,y:routeHeight(r,i-1)*(1-t)+routeHeight(r,i)*t,yaw:facing(b[0]-a[0],b[1]-a[1])};};
 const size=1.2;
 for(let i=0;i<5;i++){const p=sample(start+i*(3.15*size+.08));add(i===4?'prop.trainCab':'prop.train',p.u,p.v,size,p.yaw,p.y+.18);}
}
}
function siteAt(id:string,entrance=false){const lot=buildingLots.find(l=>l.id===id)!,p=lot.placement,b=layoutFor(p.asset)!;const local:Vec3=entrance?[0,0,b.bounds.max[2]+.6]:[0,0,0],w=attachmentWorld(p,local);return {point:compositionPoint(w[0],w[2]),yaw:p.rotation?.[1],y:p.position[1]};}
export const situationAnchors:Record<string,{point:MapPoint;yaw?:number;y?:number}>={
 pollution_01:{point:dumpSite.centre,yaw:frontYaw},pollution_02:{point:blueprint(810,444),yaw:frontYaw},
 security_01:{point:[-88,36]},security_02:{point:[50,-19],yaw:frontYaw},
 nature_01:{point:[17,80],y:terrainY(17,80)},nature_02:{point:[22,-17],yaw:frontYaw},
 health_01:{point:[canalU(31)+2.75,31],yaw:facing(1,0)},health_02:siteAt('industria-0'),
 accessibility_01:siteAt('estacao-central',true),accessibility_02:siteAt('hospital',true),
};





