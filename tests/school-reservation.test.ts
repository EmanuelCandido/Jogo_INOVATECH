import {describe,it,expect} from 'vitest';
import {modelIO} from './modelIO';
import {publicLots,mapRoads,buildingLots,pedestrianNetwork,onReferenceLand} from '../src/config/referenceMap';
import {corridorGap,polygonGap} from '../src/config/spatial';

describe('quarteirão escolar reconstruído',()=>{
 it('reserva o campo inteiro, incluindo alambrados, fora das pistas e dos edifícios',()=>{
  const lot=publicLots.find(l=>l.id==='quadra-escolar')!;
  expect(lot).toBeDefined();
  for(const p of lot.footprint)expect(onReferenceLand(...p)).toBe(true);
  for(const r of mapRoads)expect(corridorGap(lot.footprint,r.points,r.width),r.id).toBeGreaterThanOrEqual(.85);
  for(const b of buildingLots)expect(polygonGap(lot.footprint,b.footprint),b.id).toBeGreaterThanOrEqual(1.4);
  const link=pedestrianNetwork.links.find(l=>l.id===lot.id);
  expect(link).toBeDefined();expect(link!.lift).toBe(false);
 });
 it('mantém marcação branca e grama própria nas duas variantes exportadas',async()=>{
  const io=modelIO();
  for(const suffix of ['','-low']){
   const doc=await io.read(`public/assets/models/football-field${suffix}.glb`);
   const materials=doc.getRoot().listMaterials();
   expect(materials.some(m=>m.getName()==='eco.fieldturf')).toBe(true);
   expect(materials.some(m=>m.getName()==='eco.lawn')).toBe(false);
   const white=materials.find(m=>m.getName()==='eco.fieldmark')!;
   expect(white).toBeDefined();expect(white.getBaseColorFactor()).toEqual([1,1,1,1]);
   const markings=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).filter(p=>p.getMaterial()===white);
   expect(markings.length).toBeGreaterThan(0);
  }
 });
});
