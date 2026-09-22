import {describe,it,expect} from 'vitest';
import {NodeIO} from '@gltf-transform/core';
import {assetRegistry} from '../src/assets/registry';
import {modelUrl,attachmentWorld} from '../src/assets/modelLayout';
import {buildingLots,referenceAssets,referenceTrees,referenceTraffic,mapRoads,roadViaduct,roadTerminals,placementFootprint,pointInFootprint,footprintGap,onReferenceLand,bridges,riverU,riverWidth,situationAnchors,worldPoint,compositionPoint,distanceToRoute,centralRail,monorail,railStops,railFacilities,routeHeight,riverCorridors,roadHeightAt} from '../src/config/referenceMap';
import {riversideAssets,viaductTraffic,industrialSmoke} from '../src/config/referenceDetails';
import {mapBaseZoom,mapFootprint,clampTarget,valleyLimits} from '../src/game/mapNavigation';
import {circulationCrossings} from '../src/config/circulationCrossings';
import {trafficSituation,outsideTrafficSituation} from '../src/config/trafficSituation';
import {situationVisuals} from '../src/config/situationVisuals';
import {blocksJunctionMarking} from '../src/config/referenceMap';
import {corridorGap} from '../src/config/spatial';
import {Quaternion,Euler} from 'three';
import type {Placement,Vec3} from '../src/game/types';
describe('cidade da referência — implantação real',()=>{
 it('mantém painéis solares e tocos inteiros fora das pistas',()=>{
  const props=referenceAssets.filter(p=>p.asset==='prop.solarRack'||p.asset==='prop.stump');
  expect(props.filter(p=>p.asset==='prop.solarRack')).toHaveLength(12);
  expect(props.filter(p=>p.asset==='prop.stump')).toHaveLength(24);
  for(const p of props){
   const poly=placementFootprint(p);
   for(const road of [...mapRoads,roadViaduct])expect(corridorGap(poly,road.points,road.width),`${p.asset} / ${road.id}`).toBeGreaterThanOrEqual(.54);
  }
 });
 it('preserva os veículos da missão em todos os estados e libera as faixas',()=>{
  const a=situationAnchors.pollution_02,anchor:Placement={asset:'',position:worldPoint(...a.point,a.y??0),rotation:[0,a.yaw??0,0]};
  for(const key of ['initial','temporary','solved'] as const){
   const vehicles=trafficSituation[key].assets.filter(p=>p.asset.startsWith('prop.car')||p.asset==='prop.bus').map(p=>{
    const q=new Quaternion().setFromEuler(new Euler(...anchor.rotation!)).multiply(new Quaternion().setFromEuler(new Euler(...p.rotation!))),e=new Euler().setFromQuaternion(q);
    return {...p,position:attachmentWorld(anchor,p.position),rotation:[e.x,e.y,e.z] as Vec3};
   });
   expect(vehicles.map(p=>p.asset)).toEqual(situationVisuals.pollution_02[key].assets.filter(p=>p.asset.startsWith('prop.car')||p.asset==='prop.bus').map(p=>p.asset));
   for(const [i,p] of vehicles.entries()){
    expect(blocksJunctionMarking(p),`${key}:${i}: sinalização ocupada`).toBe(false);
    for(const c of circulationCrossings.crossings){
     const r=[...mapRoads,roadViaduct].find(r=>r.id===c.road)!;
     if(Math.abs(p.position[1]-roadHeightAt(r,c.point))<1.5)expect(footprintGap(placementFootprint(p),c.footprint),`${key}:${i}:${c.road}`).toBeGreaterThanOrEqual(.399);
    }
    for(const q of [...vehicles.slice(i+1),...referenceTraffic.filter(outsideTrafficSituation),...viaductTraffic])if(Math.abs(p.position[1]-q.position[1])<1.5)expect(footprintGap(placementFootprint(p),placementFootprint(q)),`${key}:${i}`).toBeGreaterThanOrEqual(.349);
   }
  }
 });
 it('mantém os veículos comuns fora da área completa das faixas',()=>{
  const conflicts:string[]=[];
  for(const [i,p] of referenceTraffic.entries())for(const c of circulationCrossings.crossings){
   const road=[...mapRoads,roadViaduct].find(r=>r.id===c.road)!;
   if(Math.abs(p.position[1]-roadHeightAt(road,c.point))<1.5&&footprintGap(placementFootprint(p),c.footprint)<.399)conflicts.push(`${i}:${c.road}`);
  }
  expect(conflicts).toEqual([]);
 });
 it('acomoda travessias em todos os braços viários auditados',()=>{
  expect(circulationCrossings.unresolved).toEqual([]);
  expect(circulationCrossings.crossings.length).toBeGreaterThan(70);
 });
 it('assenta os veículos do viaduto no piso da própria posição',()=>{
  expect(viaductTraffic.length).toBeGreaterThanOrEqual(19);
  for(const p of viaductTraffic){
   const uv=compositionPoint(p.position[0],p.position[2]);
   expect(p.position[1]-.08).toBeCloseTo(roadHeightAt(roadViaduct,uv),6);
   expect(distanceToRoute(...uv,roadViaduct)).toBeCloseTo(.95,3);
  }
 });
 it('libera faixas e veículos comuns para o tráfego complementar do viaduto',()=>{
  for(const [i,p] of viaductTraffic.entries()){
   const poly=placementFootprint(p);
   for(const c of circulationCrossings.crossings){
    const r=[...mapRoads,roadViaduct].find(r=>r.id===c.road)!;
    if(Math.abs(p.position[1]-roadHeightAt(r,c.point))<1.5)expect(footprintGap(poly,c.footprint),`${i}:${c.road}`).toBeGreaterThanOrEqual(.399);
   }
   for(const q of [...referenceTraffic,...viaductTraffic.slice(i+1)])if(Math.abs(p.position[1]-q.position[1])<1.5)expect(footprintGap(poly,placementFootprint(q))).toBeGreaterThanOrEqual(.349);
  }
 });
 it('conecta as ruas à rede ou a um destino local com retorno',()=>{
  for(const r of mapRoads)for(const p of [r.points[0],r.points.at(-1)!]){
   if(r.terminal&&p===r.points.at(-1)){const terminal=roadTerminals.find(t=>t.road===r.id)!;expect(terminal.destination).toBe('beach-services');expect(terminal.radius).toBeGreaterThan(2.5);continue;}
   const gap=Math.min(...[...mapRoads,roadViaduct].filter(other=>other!==r).map(other=>distanceToRoute(...p,other)));
   expect.soft(gap,r.id+' '+p.join(',')).toBeLessThan(.45);
  }
  const reached=new Set([mapRoads[0]]);let changed=true;
  while(changed){changed=false;for(const r of mapRoads)if(!reached.has(r)&&[...reached].some(other=>r.points.some(p=>distanceToRoute(...p,other)<.45))){reached.add(r);changed=true;}}
  expect(reached.size,'a rede deve formar um único conjunto conectado').toBe(mapRoads.length);
 });
 it('dá terminais aos trilhos e separa as travessias das margens',()=>{
  expect(railStops.map(s=>s.name)).toEqual(['Estação Central','Distrito Industrial']);
  for(const s of railFacilities){
   // Elevated platforms may extend over a water crossing; public lift access
   // must remain on dry land and the deck must retain full vertical clearance.
   expect(onReferenceLand(...s.lift),'acesso '+s.name).toBe(true);
   for(const p of s.footprint)if(!onReferenceLand(...p))expect(s.height).toBeGreaterThan(4.5);
   for(const lot of buildingLots)expect(footprintGap(s.footprint,lot.footprint),s.name+' / '+lot.id).toBeGreaterThan(.39);
  }
  expect(monorail.points.at(-1)).toEqual(centralRail.points[0]);
  expect(monorail.points[0][0]).toBeLessThan(valleyLimits.minU-30);
  for(const r of [...mapRoads,centralRail])for(const [i,[u,v]]of r.points.entries()){
   if(Math.abs(u-riverU(v))<riverWidth(v)/2)expect(routeHeight(r,i),r.id).toBeGreaterThanOrEqual(2.3);
  }
 });
 it('não mistura o leito ferroviário com pistas de automóveis',()=>{
  for(const rail of [centralRail,monorail])for(const [i,p]of rail.points.entries())for(const road of mapRoads){
   if(distanceToRoute(...p,road)>(rail.width+road.width)/2+.15)continue;
   const j=road.points.reduce((best,q,index)=>Math.hypot(q[0]-p[0],q[1]-p[1])<Math.hypot(road.points[best][0]-p[0],road.points[best][1]-p[1])?index:best,0);
   expect.soft(Math.abs(routeHeight(rail,i)-routeHeight(road,j)),rail.id+' / '+road.id+' @ '+i).toBeGreaterThan(2);
  }
 });
 it('entrega todos os modelos e variantes sem referências ausentes',async()=>{
  const urls=new Set<string>();
  for(const p of [...referenceAssets,...referenceTrees,...referenceTraffic,...riversideAssets,...viaductTraffic]){
   const a=assetRegistry[p.asset];expect(a,p.asset).toBeDefined();if(a.kind==='glb'){urls.add(a.url);urls.add(modelUrl(a,'LOW'));}
   expect([...p.position,...p.scale??[]].every(Number.isFinite)).toBe(true);
  }
  const io=new NodeIO();for(const url of urls)expect((await io.read('public'+url)).getRoot().listMeshes().length,url).toBeGreaterThan(0);
 });
 it('mantém os edifícios fora dos canais, das vias e uns dos outros',()=>{
  for(const [i,l]of buildingLots.entries()){
   for(const [u,v]of l.footprint)expect(onReferenceLand(u,v),l.id+' na água').toBe(true);
   for(const road of mapRoads)for(const p of road.points)expect(pointInFootprint(p,l.footprint),l.id+' sobre '+road.id).toBe(false);
   for(const other of buildingLots.slice(i+1))expect(footprintGap(l.footprint,other.footprint),l.id+' / '+other.id).toBeGreaterThan(.4);
  }
 });
 it('apoia as duas extremidades de cada ponte nas ciclovias das margens',()=>{
  for(const b of bridges)for(const [side,point]of [[-1,b.left],[1,b.right]] as const){const c=riverCorridors.find(c=>c.side===side)!;expect(distanceToRoute(...point,{id:'cycle',points:c.cycle,width:c.cycleWidth})).toBeLessThan(.001);}
  for(const b of bridges)for(let i=0;i<=24;i++)for(const road of mapRoads){
   const u=b.left[0]+(b.right[0]-b.left[0])*i/24,v=b.left[1]+(b.right[1]-b.left[1])*i/24;
   expect(distanceToRoute(u,v,road),'passarela / '+road.id).toBeGreaterThan(road.width/2+1.6);
  }
 });
 it('mantém a projeção e os limites em telas altas e largas',()=>{
  for(const [w,h]of [[1672,941],[412,839],[360,640],[2560,1080]])for(const z of [1,2,3.5]){
   const extent=mapFootprint(mapBaseZoom(w,h)*z,w,h);
   for(const direction of [-999,999]){
    const p=clampTarget(direction,-direction,extent),[u,v]=compositionPoint(...p);
    expect(u-extent.u).toBeGreaterThanOrEqual(valleyLimits.minU-.001);expect(u+extent.u).toBeLessThanOrEqual(valleyLimits.maxU+.001);
    expect(v-extent.v).toBeGreaterThanOrEqual(valleyLimits.minV-.001);expect(v+extent.v).toBeLessThanOrEqual(valleyLimits.maxV+.001);
   }
  }
 });
 it('ancora as situações de acesso nos prédios atuais',()=>{
  for(const [id,building]of [['accessibility_01','estacao-central'],['accessibility_02','hospital']]){
   const lot=buildingLots.find(l=>l.id===building)!,a=situationAnchors[id];expect(Math.hypot(a.point[0]-lot.u,a.point[1]-lot.v)).toBeLessThan(12);
   expect(worldPoint(...a.point).every(Number.isFinite)).toBe(true);
  }
 });
 it('mantém equipamentos de serviço fora das pistas e a fumaça nas chaminés',()=>{
  for(const p of referenceAssets.filter(p=>['prop.excavator','prop.pylon'].includes(p.asset))){const poly=placementFootprint(p);for(const r of mapRoads)for(const q of r.points)expect(pointInFootprint(q,poly),p.asset+' / '+r.id).toBe(false);}
  const plumes=industrialSmoke();let index=0;
  for(const l of buildingLots.filter(l=>l.id.startsWith('industria')))for(const x of [-2,1.2]){
   expect(plumes[index].position).toEqual(attachmentWorld(l.placement,[x,8.3,-.8]));index+=11;
  }
 });
});
