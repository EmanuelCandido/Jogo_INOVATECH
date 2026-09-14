import {describe,it,expect} from 'vitest';
import clip from 'polygon-clipping';
import {buildStreetLayout,multiPolygonArea} from '../src/config/streetLayout';
import {streetLayout,mapRoads,roadViaduct,roadProfiles,roadHeightAt,industrialAprons,referenceTraffic,compositionPoint,placementFootprint,buildingLots,pedestrianNetwork,railFacilities,referenceAssets} from '../src/config/referenceMap';
import {corridorGap,contains,lineLength,polygonGap,segmentDistance} from '../src/config/spatial';
import {dumpSite} from '../src/config/dumpSite';
import {layoutFor} from '../src/assets/modelLayout';

describe('superfícies e circulação reconstruídas',()=>{
 it('une um cruzamento e remove toda calçada que cobriria seu asfalto',()=>{
  const roads=[{id:'a',width:4,points:[[-10,0],[10,0]] as [number,number][]},{id:'b',width:4,points:[[0,-10],[0,10]] as [number,number][]}];
  const layout=buildStreetLayout(roads,{id:'deck',width:4,points:[[30,-10],[30,10]]},[]);
  expect(multiPolygonArea(layout.asphalt)).toBeCloseTo(144,6);
  expect(multiPolygonArea(clip.intersection(layout.asphalt,layout.sidewalks))).toBeLessThan(1e-8);
 });
 it('conserva os dois pisos quando uma estrutura cruza a rua em outro nível',()=>{
  const layout=buildStreetLayout([{id:'rua',width:4,points:[[-10,0],[10,0]]}],{id:'deck',width:4,points:[[0,-10],[0,10]]},[]);
  expect(multiPolygonArea(layout.asphalt)).toBeCloseTo(80,6);
  expect(multiPolygonArea(layout.viaductAsphalt)).toBeCloseTo(80,6);
  expect(multiPolygonArea(clip.intersection(layout.asphalt,layout.viaductAsphalt))).toBeCloseTo(16,6);
 });
 it('recorta os encontros reais do mapa e mantém a rampa da costa ligada ao viaduto',()=>{
  expect(multiPolygonArea(clip.intersection(streetLayout.asphalt,streetLayout.sidewalks))).toBeLessThan(1e-6);
  expect(multiPolygonArea(clip.intersection(streetLayout.viaductAsphalt,streetLayout.viaductSidewalks))).toBeLessThan(1e-6);
  expect(multiPolygonArea(clip.intersection(streetLayout.sidewalks,streetLayout.viaductAsphalt,streetLayout.joinMask))).toBeLessThan(1e-6);
  expect(mapRoads.some(r=>['orla','retorno-orla'].includes(r.id))).toBe(false);
  const r=mapRoads.find(r=>r.id==='acesso-viaduto')!,end=r.points.at(-1)!;
  expect(lineLength(r.points)).toBeGreaterThan(4.5/.08+5);
  expect(roadHeightAt(r,r.points[0])).toBeCloseTo(0,6);
  expect(roadHeightAt(r,end)).toBeCloseTo(roadHeightAt(roadViaduct,end),6);
  expect(roadProfiles.maxGrade).toBe(.08);
 });
 it('apoia as fábricas e os acessos comuns no chão, sem elevadores residenciais',()=>{
  expect(pedestrianNetwork.unreachable).toEqual([]);
  expect(pedestrianNetwork.links.every(l=>!l.lift)).toBe(true);
  expect(referenceAssets.filter(p=>p.asset==='prop.liftShaft')).toHaveLength(railFacilities.length);
  for(const l of buildingLots.filter(l=>l.id.startsWith('industria')))expect(l.placement.position[1],l.id).toBe(0);
 });
 it('reserva carga, vagas e passagens de funcionários nos quatro pátios',()=>{
  expect(industrialAprons).toHaveLength(4);
  const truck=layoutFor('prop.truck')!;
  expect(truck.bounds.max[0]-truck.bounds.min[0]).toBeLessThan(2.16);
  expect(truck.bounds.max[2]-truck.bounds.min[2]).toBeLessThan(4.24);
  for(const a of industrialAprons){
   const vehicle=referenceTraffic.find(p=>p.asset==='prop.truck'&&Math.hypot(...compositionPoint(p.position[0],p.position[2]).map((n,i)=>n-a.bay[i]))<.01)!;
   expect(vehicle,a.id).toBeDefined();
   const footprint=placementFootprint(vehicle);
   expect(footprint.every(p=>contains(p,a.footprint)),a.id+' vaga').toBe(true);
   expect(corridorGap(footprint,a.driveway,3.3),a.id+' manobra').toBeGreaterThan(.2);
   expect(corridorGap(footprint,a.staffPath,1.4),a.id+' funcionários').toBeGreaterThan(.3);
   expect(polygonGap(a.footprint,dumpSite.footprint),a.id+' lixão').toBeGreaterThan(.5);
  }
  const freight=mapRoads.filter(r=>r.usage==='freight');
  for(const p of referenceTraffic){const point=compositionPoint(p.position[0],p.position[2]);if(freight.some(r=>r.points.some((q,i)=>i>0&&segmentDistance(point,r.points[i-1],q)<r.width/2-.1)))expect(p.asset,'via exclusiva').toBe('prop.truck');}
 });
});
