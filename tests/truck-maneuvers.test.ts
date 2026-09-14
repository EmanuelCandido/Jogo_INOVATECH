import {describe,it,expect} from 'vitest';
import {industrialAprons,placement,placementFootprint,frontYaw,facing,buildingLots,onReferenceLand,situationAnchors,worldPoint} from '../src/config/referenceMap';
import {corridorGap,polygonGap} from '../src/config/spatial';
import clip from 'polygon-clipping';
import {industrialPaving,industrialSidewalks} from '../src/config/industrialPaving';
import {multiPolygonArea} from '../src/config/streetLayout';
import {situationVisuals} from '../src/config/situationVisuals';
import {Euler,Vector3} from 'three';
import type {Placement} from '../src/game/types';

describe('manobra de caminhões nas docas',()=>{
 it('permite percorrer a curva inteira sem atingir vagas, funcionários ou fachadas',()=>{
  for(const apron of industrialAprons){
   const parked=placementFootprint(placement('prop.truck',...apron.bay,1,frontYaw));
   expect(apron.maneuver.samples.length).toBeGreaterThan(25);
   for(const sample of apron.maneuver.samples){
    const truck=placement('prop.truck',...sample.point,1,facing(...sample.heading)),poly=placementFootprint(truck);
    for(const p of poly)expect(onReferenceLand(...p),apron.id).toBe(true);
    expect(polygonGap(poly,parked),apron.id+' vaga ocupada').toBeGreaterThan(.15);
    expect(corridorGap(poly,apron.staffPath,1.4),apron.id+' funcionários').toBeGreaterThan(.3);
    for(const lot of buildingLots)expect(polygonGap(poly,lot.footprint),apron.id+' / '+lot.id).toBeGreaterThan(.15);
   }
  }
 });
 it('pavimenta toda a varredura e abre a calçada na entrada das docas',()=>{
  expect(multiPolygonArea(clip.intersection(industrialPaving,industrialSidewalks))).toBeLessThan(1e-7);
  for(const apron of industrialAprons)for(const sample of apron.maneuver.samples){
   const poly=placementFootprint(placement('prop.truck',...sample.point,1,facing(...sample.heading)));
   expect(multiPolygonArea(clip.difference([poly],industrialPaving)),apron.id+' fora do piso').toBeLessThan(1e-7);
  }
 });
 it('mantém as árvores e placas da missão fora da carga e do acesso de funcionários',()=>{
  const anchor=situationAnchors.health_02,origin=worldPoint(...anchor.point,anchor.y??0),yaw=anchor.yaw??0;
  const apron=industrialAprons.find(a=>a.id==='industria-0')!;
  const parked=placementFootprint(placement('prop.truck',...apron.bay,1,frontYaw));
  for(const [state,visual] of Object.entries(situationVisuals.health_02))for(const p of visual.assets){
   const offset=new Vector3(...p.position).applyEuler(new Euler(0,yaw,0));
   const placed:Placement={...p,position:[origin[0]+offset.x,origin[1]+offset.y,origin[2]+offset.z],rotation:[0,yaw+(p.rotation?.[1]??0),0]};
   const poly=placementFootprint(placed),label=state+' / '+p.asset;
   expect(polygonGap(poly,parked),label+' vaga').toBeGreaterThan(.15);
   expect(corridorGap(poly,apron.staffPath,1.4),label+' funcionários').toBeGreaterThan(.3);
   for(const sample of apron.maneuver.samples){
    const truck=placementFootprint(placement('prop.truck',...sample.point,1,facing(...sample.heading)));
    expect(polygonGap(poly,truck),label+' ré').toBeGreaterThan(.15);
   }
  }
 });
});
