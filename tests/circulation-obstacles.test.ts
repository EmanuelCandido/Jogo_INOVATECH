import {describe,it,expect} from 'vitest';
import {riversideAssets} from '../src/config/referenceDetails';
import {riverCorridors,placementFootprint,stationAccessLots,stationConcourses,referenceAssets,mapRoads,roadViaduct,roadHeightAt,referenceTrees,industrialAprons} from '../src/config/referenceMap';
import {structuralSupports} from '../src/config/roadStructures';
import {corridorGap,polygonGap} from '../src/config/spatial';

describe('obstáculos encontrados na revisão de circulação',()=>{
 it('mantém as copas completas fora dos pátios de carga e dos acessos dos funcionários',()=>{
  expect(referenceTrees).toHaveLength(5686);expect(industrialAprons).toHaveLength(4);
  const conflicts=[];
  for(const tree of referenceTrees){
   const poly=placementFootprint(tree);
   for(const apron of industrialAprons)if(polygonGap(poly,apron.footprint)<.299||corridorGap(poly,apron.staffPath,1.4)<.299)conflicts.push({factory:apron.id,tree:tree.position});
  }
  expect(conflicts).toEqual([]);
 });
 it('mantém o volume completo de bancos e postes fora das faixas ribeirinhas',()=>{
  const furniture=riversideAssets.filter(p=>p.asset==='prop.bench'||p.asset==='prop.lamp');
  expect(furniture.length).toBeGreaterThan(20);
  for(const p of furniture)for(const c of riverCorridors){
   const footprint=placementFootprint(p);
   expect(corridorGap(footprint,c.cycle,c.cycleWidth),p.asset+' '+p.position).toBeGreaterThan(.24);
   expect(corridorGap(footprint,c.walk,c.walkWidth),p.asset+' '+p.position).toBeGreaterThan(.19);
  }
 });
 it('não coloca fundações atravessando os pisos de vias vizinhas',()=>{
  for(const support of structuralSupports)for(const road of [...mapRoads,roadViaduct]){
   if(road.id===support.road||corridorGap(support.footprint,road.points,road.width+1.35)>0)continue;
   const y=roadHeightAt(road,support.point);
   expect(support.top>y+.15&&support.bottom<y+1.6,support.road+' / '+road.id).toBe(false);
  }
 });
 it('reserva escadas, elevadores e corredores contra equipamentos de serviço',()=>{
  for(const p of referenceAssets.filter(p=>['prop.turbine','prop.pylon','prop.excavator'].includes(p.asset))){
   const poly=placementFootprint(p);
   for(const lot of stationAccessLots)expect(polygonGap(poly,lot.footprint),p.asset+' / '+lot.id).toBeGreaterThan(.69);
   for(const corridor of stationConcourses)expect(corridorGap(poly,corridor.points,corridor.width),p.asset+' / '+corridor.id).toBeGreaterThan(.69);
  }
 });
});
