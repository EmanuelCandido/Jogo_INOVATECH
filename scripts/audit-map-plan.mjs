// Read-only scene audit: emits evidence; never mutates map data or game assets.
import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
import clip from 'polygon-clipping';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const d=await server.ssrLoadModule('/src/config/referenceDetails.ts');
 const l=await server.ssrLoadModule('/src/assets/modelLayout.ts');
 const s=await server.ssrLoadModule('/src/config/streetLayout.ts');
 const spatial=await server.ssrLoadModule('/src/config/spatial.ts');
 const structures=await server.ssrLoadModule('/src/config/roadStructures.ts');
 const rounded=n=>Math.round(n*1000)/1000;
 const routes=[...m.mapRoads,m.centralRail,m.monorail,m.roadViaduct];
 const result={pedestrianNetwork:{connected:m.pedestrianNetwork.links.length,unreachable:m.pedestrianNetwork.unreachable},routeProfiles:[],entryPaths:[],furnitureInCycle:[],groundStops:[],junctionHeightGaps:[],platforms:[],counts:{buildings:m.buildingLots.length,trees:m.referenceTrees.length,assets:m.referenceAssets.length,details:d.referenceDetails.length,visitorParts:d.referenceVisitors.length}};
 result.cycleCrossings=[];
 for(const c of m.riverCorridors)for(const r of [...m.mapRoads,m.roadViaduct]){
  const areas=clip.intersection(s.corridorPolygon({id:'cycle',points:c.cycle,width:c.cycleWidth}),s.corridorPolygon(r,.675));
  for(const area of areas){const points=area.flat(),min=Math.min(...points.map(p=>m.roadHeightAt(r,p))),max=Math.max(...points.map(p=>m.roadHeightAt(r,p)));
   result.cycleCrossings.push({road:r.id,side:c.side,area:s.multiPolygonArea([area]),minHeight:min,maxHeight:max,points});
  }
 }
 if(process.argv.includes('--crossings')){await writeFile('docs/circulation-crossings.json',JSON.stringify(result.cycleCrossings,null,2));console.log(JSON.stringify(result.cycleCrossings.map(c=>({...c,points:c.points.filter((_,i)=>i%5===0)})),null,2));process.exitCode=0;}
 for(const r of routes){
  let grade=0,buried=0,elevated=0;
  r.points.forEach((p,i)=>{const y=m.routeHeight(r,i);buried=Math.max(buried,m.terrainY(...p)-y);if(y>.2)elevated++;if(i){const q=r.points[i-1];grade=Math.max(grade,Math.abs(y-m.routeHeight(r,i-1))/Math.hypot(p[0]-q[0],p[1]-q[1]));}});
  result.routeProfiles.push({id:r.id,maxGrade:rounded(grade),maxGroundAboveRoad:rounded(buried),elevatedSamples:elevated});
 }
 for(const r of m.mapRoads)for(const i of [0,r.points.length-1]){
  const p=r.points[i];for(const other of m.mapRoads){if(r===other||m.distanceToRoute(...p,other)>.45)continue;
   const j=other.points.reduce((b,q,k)=>Math.hypot(q[0]-p[0],q[1]-p[1])<Math.hypot(other.points[b][0]-p[0],other.points[b][1]-p[1])?k:b,0),gap=Math.abs(m.routeHeight(r,i)-m.routeHeight(other,j));
   if(gap>.08)result.junctionHeightGaps.push({from:r.id,to:other.id,gap:rounded(gap)});
  }
 }
 for(const link of m.pedestrianNetwork.links){
  const obstacles=new Set();let water=false,distance=0;
  const points=[...link.points,link.sidewalk],corridor=s.corridorPolygon({points,width:1.4})[0];
  for(const other of [...m.buildingLots,...m.publicLots,...m.stationAccessLots])if(other.id!==link.id&&spatial.corridorGap(other.footprint,points,1.4)<-.01)obstacles.add(other.id);
  for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j],length=Math.hypot(a[0]-b[0],a[1]-b[1]);distance+=length;const n=Math.max(1,Math.ceil(length/.25));
   for(let i=1;i<=n;i++){const p=[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n];if(!m.onReferenceLand(...p))water=true;for(const other of m.buildingLots)if(other.id!==link.id&&m.pointInFootprint(p,other.footprint))obstacles.add(other.id);}
  }
  for(let i=0;i<corridor.length;i++){const a=corridor[i],b=corridor[(i+1)%corridor.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25));for(let j=0;j<=n;j++)if(!m.onReferenceLand(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n))water=true;}
  const grade=link.lift?0:Math.abs(link.accessHeight-link.height)/(distance||1);
  result.entryPaths.push({id:link.id,distance:rounded(distance),grade:rounded(grade),water,obstacles:[...obstacles],lift:link.lift,omitted:false});
 }
 for(const p of d.riversideAssets.filter(p=>p.asset==='prop.lamp'||p.asset==='prop.bench')){
  const [u,v]=m.compositionPoint(p.position[0],p.position[2]);if(v>=76)continue;
  const gap=Math.min(...m.riverCorridors.map(c=>spatial.corridorGap(m.placementFootprint(p),c.cycle,c.cycleWidth)));
  if(gap<0)result.furnitureInCycle.push({asset:p.asset,u:rounded(u),v:rounded(v),offset:rounded(gap)});
 }
 
 for(const s of m.railFacilities)result.platforms.push({name:s.name,length:s.length,height:rounded(s.height),accessHeight:rounded(s.accessHeight),accessType:"stairs-and-lift"});
 const vi=m.roadViaduct.points[0],road=m.mapRoads.find(r=>r.id==='ligacao-hospital');
 result.viaductJoin={viaduct:m.routeHeight(m.roadViaduct,0),road:m.roadSurfaceHeight(...vi)};
 result.trainLength=5*3.15*1.2+4*.08;
 result.supportConflicts=[];
 result.supportCount=structures.structuralSupports.length;
 for(const support of structures.structuralSupports){
  const {point:uv,bottom,top,footprint}=support;
  for(const r of [...m.mapRoads,m.roadViaduct]){if(r.id===support.road||spatial.corridorGap(footprint,r.points,r.width+1.35)>.01)continue;
   const y=m.roadHeightAt(r,uv);
   if(top>y+.15&&bottom<y+1.6)result.supportConflicts.push({road:r.id,point:uv,bottom,top,roadHeight:y});
  }
  for(const link of m.pedestrianNetwork.links)if(spatial.corridorGap(footprint,[...link.points,link.sidewalk],1.4)<0)result.supportConflicts.push({support:support.road,path:link.id});
 }
 const state=await server.ssrLoadModule('/src/config/situationVisuals.ts');
 const traffic=await server.ssrLoadModule('/src/config/trafficSituation.ts');
 const {dumpScenery}=await server.ssrLoadModule('/src/config/dumpSite.ts');
 const THREE=await import('three');result.situationLotConflicts=[];
 for(const [id,states]of Object.entries(state.situationVisuals))for(const [key,visual]of Object.entries(states)){
  const anchor=m.situationAnchors[id],rotation=new THREE.Euler(0,anchor.yaw??0,0),offset=m.worldPoint(...anchor.point,anchor.y??0);
  const assets=[...(id==='pollution_02'?traffic.trafficSituation[key]:visual).assets,...(id==='pollution_01'?dumpScenery[key]:[])];
  for(const p of assets){
   const local=new THREE.Vector3(...p.position).applyEuler(rotation),world=[local.x+offset[0],local.y+offset[1],local.z+offset[2]];
   const orientation=new THREE.Quaternion().setFromEuler(rotation).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...(p.rotation??[0,0,0]))));
   const e=new THREE.Euler().setFromQuaternion(orientation),poly=m.placementFootprint({...p,position:world,rotation:[e.x,e.y,e.z]});
   for(const lot of m.buildingLots)if(m.footprintGap(poly,lot.footprint)<.001){
    // Only the three reviewed entrance pieces may touch the civic podium.
    // Restrict the complete model to its entrance volume in the mission frame;
    // a moved ramp or an overlap with another building must remain an error.
    const entranceAsset={initial:'access.step',temporary:'access.temporary',solved:'access.ramp'}[key];
    let expectedContact=id==='accessibility_01'&&lot.id==='estacao-central'&&p.asset===entranceAsset;
    if(expectedContact){
     const bounds=l.layoutFor(p.asset).bounds;
     for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]]){
      const q=l.attachmentWorld(p,[x,y,z]);
      expectedContact&&=Math.abs(q[0])<=.95&&q[1]>=0&&q[1]<=.6&&q[2]>=-1.65&&q[2]<=.1;
     }
    }
    result.situationLotConflicts.push({id,state:key,asset:p.asset,lot:lot.id,expectedContact});
   }
  }
 }
 await writeFile('docs/map-audit-evidence.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({counts:result.counts,paths:result.pedestrianNetwork,pathConflicts:result.entryPaths.filter(p=>p.water||p.obstacles.length),furnitureConflicts:result.furnitureInCycle,supportCount:result.supportCount,supportConflicts:result.supportConflicts,junctionHeightGaps:result.junctionHeightGaps,situationLotConflicts:result.situationLotConflicts},null,2));
}finally{await server.close();}
