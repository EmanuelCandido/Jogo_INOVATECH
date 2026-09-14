import {describe,it,expect} from 'vitest';
import {attachmentWorld,layoutFor} from '../src/assets/modelLayout';
import {railFacilities,stationAccessLots,stationConcourses,mapRoads,pedestrianNetwork,referenceAssets,onReferenceLand,terrainY,buildingLots} from '../src/config/referenceMap';
import {contains,corridorGap,polygonGap} from '../src/config/spatial';
import {structuralSupports,supportPartsOverlap} from '../src/config/roadStructures';

describe('estações com circulação integrada',()=>{
 it('sustenta cada plataforma com fundações fora dos acessos térreos',()=>{
  for(let i=0;i<railFacilities.length;i++){
   const supports=structuralSupports.filter(p=>p.road==='platform-'+i);
   expect(supports.length,railFacilities[i].name).toBeGreaterThanOrEqual(2);
   for(const support of supports)for(const path of pedestrianNetwork.links)expect(corridorGap(support.footprint,[...path.points,path.sidewalk],1.4),path.id).toBeGreaterThanOrEqual(.299);
  }
 });
 it('não sobrepõe fundações, pilares ou travessas das plataformas aos apoios vizinhos',()=>{
  for(const p of structuralSupports.filter(s=>s.road.startsWith('platform-')))for(const q of structuralSupports){
   if(p===q)continue;
   for(const a of p.parts)for(const b of q.parts)expect(supportPartsOverlap(a,b),`${p.road}/${q.road}: ${a.asset}/${b.asset}`).toBe(false);
  }
 });
 it('mantém os componentes dos apoios das plataformas fora dos edifícios e acessos',()=>{
  for(const s of structuralSupports.filter(s=>s.road.startsWith('platform-')))for(const part of s.parts)for(const lot of [...buildingLots,...stationAccessLots])expect(supportPartsOverlap(part,lot.placement),`${s.road}/${part.asset}/${lot.id}`).toBe(false);
 });
 it('conecta a praça central aos dois acessos verticais sem atravessar lotes',()=>{
  const hall=pedestrianNetwork.links.find(l=>l.id==='estacao-central')!;
  for(const kind of ['escada','elevador']){
   const path=pedestrianNetwork.links.find(l=>l.id==='praca-estacao-'+kind)!,target=pedestrianNetwork.links.find(l=>l.id==='estacao-0-'+kind)!;
   expect(path.points[0]).toEqual(hall.points.at(-1));expect(path.points.at(-1)).toEqual(target.points.at(-1));
   expect(path.height).toBe(0);expect(path.lift).toBe(false);
   for(const b of [...buildingLots,...stationAccessLots])expect(corridorGap(b.footprint,path.points,1.4),b.id).toBeGreaterThanOrEqual(.019);
  }
 });
 it('reserva escadas e elevadores completos sobre terreno preparado',()=>{
  expect(stationAccessLots).toHaveLength(6);
  for(const s of stationAccessLots){
   expect(pedestrianNetwork.links.some(l=>l.id===s.id),s.id).toBe(true);
   for(const p of s.footprint){expect(onReferenceLand(...p),s.id).toBe(true);expect(Math.abs(terrainY(...p)),s.id).toBeLessThan(.051);}
   for(const r of mapRoads)expect(corridorGap(s.footprint,r.points,r.width),s.id+' / '+r.id).toBeGreaterThan(.94);
   for(const b of buildingLots)expect(polygonGap(s.footprint,b.footprint),s.id+' / '+b.id).toBeGreaterThan(.94);
  }
 });
 it('liga o patamar real de cada escada à plataforma e mantém o trilho desobstruído',()=>{
  for(const s of railFacilities){
   const top=attachmentWorld(s.stairs,layoutFor('prop.stationStairs')!.platform!);
   expect(top[1]).toBeCloseTo(s.height,6);
   expect(contains(s.upperWalk.at(-1)!,s.footprint),s.name).toBe(true);
   expect(s.stairsJoin.at(-1)).toEqual(s.stairsTop);
   expect(s.accessHeight,s.name).toBe(0);
  }
  expect(referenceAssets.filter(p=>p.asset==='prop.stationStairs')).toHaveLength(3);
  expect(referenceAssets.filter(p=>p.asset==='prop.platformCanopy')).toHaveLength(21);
  expect(referenceAssets.some(p=>p.asset==='prop.stationCanopy')).toBe(false);
  for(const r of stationConcourses)for(const b of buildingLots)expect(corridorGap(b.footprint,r.points,r.width),r.id+' / '+b.id).toBeGreaterThan(.39);
 });
});
