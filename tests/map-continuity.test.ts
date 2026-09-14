import {describe,it,expect} from 'vitest';
import prepared from '../src/config/reference-layout.json' with {type:'json'};
import {contains,polygonGap,segmentDistance,lineLength} from '../src/config/spatial';
import {publicLots,stationAccessLots} from '../src/config/referenceMap';
import {dumpTurnHandles,dumpEntryTurns,dumpDriveway} from '../src/config/referenceMap';
import {serviceTurns} from '../src/config/truckManeuvers';
import {referenceTrees,referenceAssets,referenceTraffic,mapRoads,roadViaduct,centralRail,monorail,roadSurfaceHeight,routeHeight,terrainY,pedestrianNetwork,buildingLots,onReferenceLand,railFacilities,riverU,canalU,riverWidth,pointInFootprint} from '../src/config/referenceMap';
describe('continuidade espacial do vale',()=>{
 it('entrega ao navegador a mesma implantação validada na autoria',()=>{
  expect(referenceTrees).toHaveLength(5686);
  const same=(saved:unknown[],actual:unknown[],name:string)=>{
   expect(saved.length,name+' contagem').toBe(actual.length);
   const mismatch=actual.findIndex((p,i)=>JSON.stringify(saved[i])!==JSON.stringify(p));
   expect(mismatch,name+' primeira entrada divergente do snapshot').toBe(-1);
  };
  same(prepared.referenceTrees,referenceTrees,'árvores');
  same(prepared.referenceAssets,referenceAssets,'modelos');
  // JSON normalizes IEEE -0 to 0; both represent the same Euler rotation.
  same(prepared.referenceTraffic,referenceTraffic,'tráfego');
  same(prepared.dumpTurnHandles,dumpTurnHandles,'tangentes de manobra');
  const road=mapRoads.find(r=>r.id==='acesso-carga')!;
  expect(serviceTurns(road.points,dumpDriveway.points,road.width,prepared.dumpTurnHandles as [number,number][])).toEqual(dumpEntryTurns);
  expect(JSON.stringify(prepared.pedestrianNetwork)===JSON.stringify(pedestrianNetwork),'snapshot de pedestres').toBe(true);
 });
 it('detecta arestas cruzadas mesmo sem nenhum vértice dentro',()=>{
  const a:[number,number][]=[[-3,-.5],[3,-.5],[3,.5],[-3,.5]],b:[number,number][]=[[-.5,-3],[.5,-3],[.5,3],[-.5,3]];
  expect(a.some(p=>contains(p,b))).toBe(false);expect(polygonGap(a,b)).toBe(0);
  expect(segmentDistance([3,4],[0,0],[0,0])).toBe(5);
 });
 it('mantém perfis suaves, pistas fora do relevo e encontro sem degrau',()=>{
  for(const r of [...mapRoads,roadViaduct,centralRail,monorail])for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   expect(Math.abs(routeHeight(r,i)-routeHeight(r,i-1))/(length||1),r.id).toBeLessThanOrEqual(r.kind==='rail'?.04001:.10001);
   expect(terrainY(...b)-routeHeight(r,i),r.id).toBeLessThanOrEqual(.02);
  }
  expect(routeHeight(roadViaduct,0)).toBeCloseTo(roadSurfaceHeight(...roadViaduct.points[0]),7);
 });
 it('conecta todos os endereços sem atalhos por água ou outros edifícios',()=>{
  expect(pedestrianNetwork.unreachable).toEqual([]);
  expect(pedestrianNetwork.links.map(l=>l.id).sort()).toEqual([...buildingLots,...publicLots,...stationAccessLots].map(l=>l.id).concat('praca-estacao-escada','praca-estacao-elevador').sort());
  for(const link of pedestrianNetwork.links){
   expect(link.lift?0:Math.abs(link.accessHeight-link.height)/lineLength(link.points),link.id).toBeLessThanOrEqual(.08001);
   for(let i=1;i<link.points.length;i++){
    const a=link.points[i-1],b=link.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.3);
    for(let j=1;j<=n;j++){const p:[number,number]=[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n];
     expect(onReferenceLand(...p),link.id).toBe(true);
     expect(buildingLots.some(l=>l.id!==link.id&&pointInFootprint(p,l.footprint)),link.id).toBe(false);
    }
   }
  }
 });
 it('dimensiona as plataformas para a composição completa',()=>{
  for(const s of railFacilities){expect(s.length,s.name).toBeGreaterThanOrEqual(21.99);expect(s.height).toBeGreaterThan(s.accessHeight);}
 });
 it('mantém clamps e largura contínua no reservatório',()=>{
  expect(riverU(200)).toBe(riverU(160));expect(canalU(200)).toBe(canalU(160));
  for(const v of [80,81,84,88])expect(Math.abs(riverWidth(v+.001)-riverWidth(v-.001))).toBeLessThan(.02);
 });
});
