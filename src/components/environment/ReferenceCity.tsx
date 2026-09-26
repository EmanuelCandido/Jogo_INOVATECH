import {outsideTrafficSituation} from '../../config/trafficSituation';
import {junctionPriority} from '../../config/referenceMap';
import {reservoirWaterHeight} from '../../config/reservoir';
import {DumpGroundMaterial} from './DumpGroundMaterial';
import {dumpExitPriority,industrialGatePriority} from '../../config/servicePriority';
import {roadStructures} from '../../config/roadStructures';
import {industrialServiceFloor} from '../../config/industrialPaving';
import {crossingApproachSurfaces,crossingSidewalks,crossingViaductSidewalks} from '../../config/crossingApproaches';
import {circulationCrossings} from '../../config/circulationCrossings';
import {stationGuardrails,stationPassengerFloors,stationSlabThickness} from '../../config/stationPerimeters';
import {dumpSite} from '../../config/dumpSite';
import {situationVisualKey} from '../../game/situationState';
import {SituationScene,CleanupTruck,dumpVisuals,dumpCollectionTarget} from '../city/ResolutionScene';
import {resolutionEase,resolutionRange} from '../../game/resolution';
import type {SituationVisual,VisualKey} from '../../config/situationVisuals';
import {worldPoint,frontYaw,dumpDriveway,roadHeightAt,industrialAprons,streetLayout,atRoadJunction,riverCorridors,stationConcourses} from '../../config/referenceMap';
import {useEffect,useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,Color} from 'three';
import {lineLength} from '../../config/spatial';
import {roadHeightSampler} from '../../config/roadProfiles';
import {surfaceShader} from '../../assets/surfaceFinish';
import {Surface} from '../Asset';
import {AssetBatch} from '../city/AssetBatch';
import {DetailInstances} from './Landscape';
import {ReferenceWater} from './ReferenceWater';
import {Beach} from './Beach';
import {TransportSigns} from './TransportSigns';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {useGame} from '../../stores/gameStore';
import {keepDetail} from '../../config/graphics';
import {pedestrianNetwork,referenceAssets,referenceTrees,referenceTraffic,referenceFurniture,mapRoads,riverSamples,canalSamples,riverWidth,beachLine,reservoirOutline,monorail,centralRail,roadViaduct,buildingLots,mapCurve,routeHeight,roadSurfaceHeight,compositionPoint,distanceToRoute,railFacilities,type MapPoint} from '../../config/referenceMap';
import {referenceDetails,referenceVisitorGroups,referenceLitter,riversideAssets,industrialSmoke,viaductTraffic} from '../../config/referenceDetails';
import {polygon,ribbon,wall,merged,valleyLand,cleanBanks,dirtyBanks} from './referenceGeometry';

function createSurfaces(){
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
// This alias keeps geometry construction independent of React render state.
import {terrainY as importHeight} from '../../config/referenceMap';
const forestObjects=referenceAssets.filter(p=>p.asset==='prop.stump'||(p.asset==='prop.excavator'&&compositionPoint(p.position[0],p.position[2])[0]<40&&compositionPoint(p.position[0],p.position[2])[1]>65));
const permanentAssets=referenceAssets.filter(p=>!forestObjects.includes(p));
const forestInitial:SituationVisual={assets:forestObjects,details:[]};
const forestVisuals:Record<VisualKey,SituationVisual>={initial:forestInitial,temporary:forestInitial,solved:{assets:forestObjects.filter(p=>p.asset==='prop.stump').map(p=>({...p,asset:'tree.oak',scale:[1,1,1]})),details:[]}};
const smokeInitial:SituationVisual={assets:[],details:industrialSmoke()};
const smokeVisuals:Record<VisualKey,SituationVisual>={initial:smokeInitial,temporary:smokeInitial,solved:{assets:[],details:industrialSmoke(true)}};
const litterInitial:SituationVisual={assets:[],details:referenceLitter};
const litterVisuals:Record<VisualKey,SituationVisual>={initial:litterInitial,temporary:litterInitial,solved:{assets:[],details:[]}};
export function ReferenceCity(){
 const q=useResolvedGraphics(),surfaces=useMemo(createSurfaces,[]);
 const cleanRiver=useGame(s=>s.progress.problemStates.health_01==='SOLVED');
 const regrown=useGame(s=>s.progress.problemStates.nature_01==='SOLVED'),dumpStage=useGame(s=>situationVisualKey(s.progress,'pollution_01'));
 const forestResolution=useGame(s=>s.resolution?.problemId==='nature_01'?s.resolution:null);
 const originalLandColors=useMemo(()=>new Float32Array(surfaces.land.getAttribute('color').array),[surfaces]);
 const recoveredLandColors=useMemo(()=>{const positions=surfaces.land.getAttribute('position'),recovered=new Float32Array(originalLandColors);
  for(let i=0;i<positions.count;i++){const [u,v]=compositionPoint(positions.getX(i),positions.getZ(i)),clearing=((u-17)/19)**2+((v-80)/11)**2;
   const c=new Color().fromArray(originalLandColors,i*3);c.lerp(new Color('#92bd66'),Math.max(0,Math.min(1,(1.08-clearing)*5)));c.toArray(recovered,i*3);
  }return recovered;
 },[surfaces,originalLandColors]);
 const applyLand=(amount:number)=>{const colors=surfaces.land.getAttribute('color');for(let i=0;i<originalLandColors.length;i++)colors.array[i]=originalLandColors[i]+(recoveredLandColors[i]-originalLandColors[i])*amount;colors.needsUpdate=true;};
 useEffect(()=>{applyLand(forestResolution?0:regrown?1:0);},[regrown,forestResolution,surfaces,recoveredLandColors]);
 useFrame(()=>{if(forestResolution)applyLand(forestResolution.to==='solved'?resolutionEase(resolutionRange(forestResolution.clock.value,.4,.88)):0);});
 const trees=useMemo(()=>referenceTrees.filter((_,i)=>keepDetail(i,q.forestDensity)),[q.forestDensity]);
 const traffic=useMemo(()=>[...referenceTraffic.filter(outsideTrafficSituation),...viaductTraffic].filter((_,i)=>keepDetail(i,q.traffic)),[q.traffic]);
 const visitors=useMemo(()=>referenceVisitorGroups.filter((_,i)=>keepDetail(i,q.visitors)).flat(),[q.visitors]);
 const furnishing=useMemo(()=>[...referenceFurniture,...riversideAssets],[]);
 useEffect(()=>()=>{for(const [key,g]of Object.entries(surfaces))if(key!=='beach')g.dispose();},[surfaces]);
 return <group name='Cidade do vale — composição da referência'>
  <mesh geometry={surfaces.land} receiveShadow><meshStandardMaterial vertexColors roughness={1} side={2} onBeforeCompile={surfaceShader('grass')} customProgramCacheKey={()=>'valley-land'}/></mesh>
  <mesh geometry={surfaces.sea} receiveShadow><ReferenceWater/></mesh>
  <mesh geometry={surfaces.river} receiveShadow><ReferenceWater channel/></mesh>
  <mesh geometry={surfaces.canal} receiveShadow><ReferenceWater channel polluted={!cleanRiver} mouth={-27}/></mesh>
  <mesh geometry={surfaces.reservoir} receiveShadow><ReferenceWater/></mesh>
  <mesh geometry={surfaces.falls}><ReferenceWater fall/></mesh>
  <Beach surface={surfaces.beach}/>
  <mesh geometry={surfaces.ruined} receiveShadow><Surface id='asphalt.damaged'/></mesh>
  <mesh geometry={surfaces.yard} receiveShadow><DumpGroundMaterial stage={dumpStage}/></mesh>
  <mesh geometry={surfaces.dumpAccess} receiveShadow><Surface id='asphalt.default'/></mesh>
  <mesh geometry={surfaces.service} receiveShadow><meshStandardMaterial color='#a2a599' roughness={1} side={2} onBeforeCompile={surfaceShader('concrete')}/></mesh>
  <mesh geometry={surfaces.safety} receiveShadow><meshStandardMaterial color='#ebc55b' roughness={1} side={2}/></mesh>
  <group name='Lixão ambiental' userData={{stage:dumpStage}} position={worldPoint(...dumpSite.centre)} rotation={[0,frontYaw,0]}><SituationScene problemId="pollution_01" states={dumpVisuals} collection={dumpCollectionTarget}/></group>
  <CleanupTruck/>
  <mesh geometry={surfaces.walks} receiveShadow><Surface id='sidewalk.default'/></mesh>
  <mesh geometry={surfaces.sidewalks} receiveShadow><Surface id='sidewalk.default'/></mesh>
  <mesh geometry={surfaces.roads} receiveShadow><Surface id='asphalt.default'/></mesh>
  <mesh geometry={surfaces.paths} receiveShadow><Surface id='sidewalk.default'/></mesh>
  <mesh geometry={surfaces.cycles} receiveShadow><meshStandardMaterial color='#d78065' roughness={.95} side={2} onBeforeCompile={surfaceShader('asphalt')}/></mesh>
  <mesh geometry={surfaces.marks} receiveShadow><meshStandardMaterial color='#fff2d7' roughness={.92} side={2}/></mesh>
  <mesh geometry={surfaces.edging} castShadow receiveShadow><meshStandardMaterial color='#d6d7be' side={2} onBeforeCompile={surfaceShader('concrete')}/></mesh>
  <mesh geometry={surfaces.railDeck} castShadow receiveShadow><Surface id='sidewalk.default'/></mesh>
  <mesh geometry={surfaces.railMetal} receiveShadow><meshStandardMaterial color='#65808a' metalness={.5} roughness={.4} side={2}/></mesh>
  <AssetBatch placements={permanentAssets}/><SituationScene problemId="nature_01" states={forestVisuals}/><AssetBatch placements={traffic}/>
  <AssetBatch placements={roadStructures}/>
  <AssetBatch placements={stationGuardrails}/>
  <TransportSigns/>
  <AssetBatch placements={furnishing}/><AssetBatch placements={trees} castShadow={q.shadows}/>
  <DetailInstances details={referenceDetails}/><DetailInstances details={visitors}/><SituationScene problemId="health_02" states={smokeVisuals}/>
  <SituationScene problemId="health_01" states={litterVisuals}/>
 </group>;
}
