import {describe,it,expect} from 'vitest';
import {dumpSite,dumpScenery,dumpManeuver} from '../src/config/dumpSite';
import {facing} from '../src/config/referenceMap';
import {referenceAssets,situationAnchors,placement,placementFootprint,frontYaw,mapRoads,buildingLots,dumpDriveway,onReferenceLand,distanceToRoute} from '../src/config/referenceMap';
import {attachmentWorld} from '../src/assets/modelLayout';
import {contains,corridorGap,polygonGap,sampleLine,lineLength} from '../src/config/spatial';
import {referenceDump} from '../src/config/referenceDetails';
import {situationVisuals} from '../src/config/situationVisuals';
import {NodeIO} from '@gltf-transform/core';
import {serviceTurns} from '../src/config/truckManeuvers';
import {industrialPaving} from '../src/config/industrialPaving';
import {referenceFurniture,dumpTurnPads} from '../src/config/referenceMap';
import {dumpEntryTurns,compositionPoint,roadHeightAt} from '../src/config/referenceMap';
import {roadStructures} from '../src/config/roadStructures';
import {layoutFor} from '../src/assets/modelLayout';
import {convexHull} from '../src/config/spatial';
import {Box3,Vector3} from 'three';
import type {Placement} from '../src/game/types';
import {dumpExitPriority} from '../src/config/servicePriority';

describe('lixão no lugar do depósito fictício',()=>{
 it('sinaliza a preferência da rua na faixa de saída do lixão',()=>{
  expect(dumpExitPriority.priority).toBe('acesso-carga');expect(dumpExitPriority.yielding).toBe(dumpDriveway.id);
  const [tip,a,b]=dumpExitPriority.triangle,heading=sampleLine(dumpDriveway.points,9.4).tangent.map(v=>-v);
  expect((tip[0]-(a[0]+b[0])/2)*heading[0]+(tip[1]-(a[1]+b[1])/2)*heading[1],'vértice voltado para quem chega à preferência').toBeLessThan(0);
  for(const point of [...dumpExitPriority.triangle,...dumpExitPriority.line.flat()]){
   expect(distanceToRoute(...point,dumpDriveway)+dumpExitPriority.width/2).toBeLessThan(dumpDriveway.width/2);
   expect(onReferenceLand(...point)).toBe(true);
  }
 });
 it('reserva o volume do caminhão sob tabuleiros e fora dos apoios durante a conversão',()=>{
  const volume=(p:Placement)=>{
   const bounds=layoutFor(p.asset)!.bounds,box=new Box3(),points: [number,number][]=[];
   for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]]){
    const q=attachmentWorld(p,[x,y,z]);box.expandByPoint(new Vector3(...q));points.push(compositionPoint(q[0],q[2]));
   }
   return {box,poly:convexHull(points)};
  };
  const structures=roadStructures.map(p=>({p,...volume(p)})),road=mapRoads.find(r=>r.id==='acesso-carga')!;
  for(const turn of dumpEntryTurns)for(const sample of turn.samples){
   const truck=volume(placement('prop.truck',...sample.point,1,facing(...sample.heading),roadHeightAt(road,sample.point)+.09));
   const clearance=truck.box.clone();clearance.max.y+=.3;clearance.min.x-=.25;clearance.max.x+=.25;clearance.min.z-=.25;clearance.max.z+=.25;
   for(const structure of structures){
    if(!clearance.intersectsBox(structure.box)||polygonGap(truck.poly,structure.poly)>.25)continue;
    expect(Math.min(clearance.max.y,structure.box.max.y)-Math.max(clearance.min.y,structure.box.min.y),JSON.stringify({asset:structure.p.asset,position:structure.p.position,truck:sample.point})).toBeLessThanOrEqual(0);
   }
  }
 });
 it('mantém os postes fora da área pavimentada de conversão',()=>{
  for(const pole of referenceFurniture)for(const pad of dumpTurnPads)expect(polygonGap(placementFootprint(pole),pad)).toBeGreaterThanOrEqual(.25);
 });
 it('permite conversões entre as faixas da rua e o acesso sem sair do pavimento',()=>{
  const road=mapRoads.find(r=>r.id==='acesso-carga')!;
  for(const turn of serviceTurns(road.points,dumpDriveway.points,road.width))for(const [i,sample] of turn.samples.entries()){
   if(i){const previous=turn.samples[i-1],distance=Math.hypot(sample.point[0]-previous.point[0],sample.point[1]-previous.point[1]),angle=Math.acos(Math.max(-1,Math.min(1,sample.heading[0]*previous.heading[0]+sample.heading[1]*previous.heading[1])));expect(distance/Math.max(angle,1e-9),'raio de conversão').toBeGreaterThanOrEqual(3);}
   const poly=placementFootprint(placement('prop.truck',...sample.point,1,facing(...sample.heading)));
   for(const point of poly){
    expect(distanceToRoute(...point,road)<=road.width/2||industrialPaving.some(p=>contains(point,p[0])&&!p.slice(1).some(h=>contains(point,h))),JSON.stringify({turn:[turn.direction,turn.entering],point})).toBe(true);
    expect(onReferenceLand(...point)).toBe(true);
   }
   for(const lot of buildingLots)expect(polygonGap(poly,lot.footprint),lot.id).toBeGreaterThan(.25);
  }
 });
 it('liga a rua ao giro interno sem quina e mantém o caminhão na faixa de acesso',()=>{
  const length=lineLength(dumpDriveway.points),anchor=placement('waste.pile',...dumpSite.centre,1,frontYaw);
  const source=mapRoads.find(r=>r.id==='acesso-carga')!;
  for(let d=0;d<=length;d+=.15){
   const frame=sampleLine(dumpDriveway.points,d);
   for(const direction of [1,-1]){
    const truck=placement('prop.truck',...frame.point,1,facing(frame.tangent[0]*direction,frame.tangent[1]*direction)),poly=placementFootprint(truck);
    for(const point of poly){
     expect(onReferenceLand(...point)).toBe(true);
     expect(contains(point,dumpSite.footprint)||distanceToRoute(...point,dumpDriveway)<=dumpDriveway.width/2||distanceToRoute(...point,source)<=source.width/2).toBe(true);
    }
    for(const lot of buildingLots)expect(polygonGap(poly,lot.footprint),lot.id).toBeGreaterThan(.25);
    for(const stage of ['initial','temporary','solved'] as const)for(const p of [...dumpScenery[stage],...situationVisuals.pollution_01[stage].assets]){
     const world=attachmentWorld(anchor,p.position),obstacle=placementFootprint({...p,position:world,rotation:[0,frontYaw+(p.rotation?.[1]??0),0]});
     expect(polygonGap(poly,obstacle),`${stage}:${p.asset}`).toBeGreaterThan(.25);
    }
   }
  }
  const gate=dumpDriveway.points.length-2,a=dumpDriveway.points[gate-1],b=dumpDriveway.points[gate];
  expect(Math.abs(Math.atan2(b[1]-a[1],b[0]-a[0]))).toBeLessThan(.02);
 });
 it('permite entrar, manobrar e sair com o caminhão inteiro em todos os estados',()=>{
  expect(dumpManeuver[0].point).toEqual(dumpSite.gate);expect(dumpManeuver.at(-1)!.point).toEqual(dumpSite.gate);
  expect(dumpManeuver[0].heading).toEqual([1,0]);expect(dumpManeuver.at(-1)!.heading).toEqual([-1,0]);
  const anchor=placement('waste.pile',...dumpSite.centre,1,frontYaw);
  for(const key of ['initial','temporary','solved'] as const)for(const p of [...dumpScenery[key],...situationVisuals.pollution_01[key].assets]){
   const world=attachmentWorld(anchor,p.position),poly=placementFootprint({...p,position:world,rotation:[0,frontYaw+(p.rotation?.[1]??0),0]});
   for(const sample of dumpManeuver){const truck=placement('prop.truck',...sample.point,1,facing(...sample.heading));expect(polygonGap(poly,placementFootprint(truck)),`${key}:${p.position}`).toBeGreaterThan(.25);}
  }
  for(const sample of dumpManeuver){
   const poly=placementFootprint(placement('prop.truck',...sample.point,1,facing(...sample.heading)));
   for(const point of poly)expect(onReferenceLand(...point)).toBe(true);
   for(const lot of buildingLots)expect(polygonGap(poly,lot.footprint),lot.id).toBeGreaterThan(.25);
   // The part outside the lot is the reserved entrance, not a shortcut over grass.
   for(const point of poly)expect(contains(point,dumpSite.footprint)||distanceToRoute(...point,dumpDriveway)<dumpDriveway.width/2).toBe(true);
  }
 });
 it('remove os contêineres e o amontoado independente, com uma única âncora da missão',()=>{
  expect(referenceAssets.filter(p=>p.asset.startsWith('prop.container.'))).toEqual([]);
  expect(referenceDump).toEqual([]);
  expect(situationAnchors.pollution_01.point).toEqual(dumpSite.centre);
 });
 it('mantém os modelos de todos os estados dentro do lote reservado',()=>{
  const anchor=placement('waste.pile',...dumpSite.centre,1,frontYaw);
  for(const key of ['initial','temporary','solved'] as const)for(const p of [...dumpScenery[key],...situationVisuals.pollution_01[key].assets]){
   const world=attachmentWorld(anchor,p.position),poly=placementFootprint({...p,position:world,rotation:[0,frontYaw+(p.rotation?.[1]??0),0]});
   for(const point of poly){expect(contains(point,dumpSite.footprint),p.asset).toBe(true);expect(onReferenceLand(...point),p.asset).toBe(true);}
   for(const road of mapRoads)expect(corridorGap(poly,road.points,road.width),road.id).toBeGreaterThan(.3);
   expect(corridorGap(poly,dumpDriveway.points,dumpDriveway.width),p.asset+' no acesso de serviço').toBeGreaterThan(0);
   for(const lot of buildingLots)expect(polygonGap(poly,lot.footprint),lot.id).toBeGreaterThan(.4);
  }
 });
 it('retira resíduos na solução e conserva um acesso de serviço fora dos edifícios',()=>{
  expect(dumpScenery.initial.filter(p=>p.asset==='waste.industrial').length).toBeGreaterThan(8);
  expect(dumpScenery.temporary.filter(p=>p.asset==='waste.partial').length).toBeLessThan(dumpScenery.initial.length);
  expect(dumpScenery.solved.some(p=>['waste.pile','waste.partial','waste.industrial'].includes(p.asset))).toBe(false);
  expect(dumpScenery.solved.some(p=>p.asset.startsWith('tree.'))).toBe(true);
  for(const lot of buildingLots)expect(corridorGap(lot.footprint,dumpDriveway.points,dumpDriveway.width),lot.id).toBeGreaterThanOrEqual(.8);
  expect(distanceToRoute(...dumpDriveway.points[0],mapRoads.find(r=>r.id==='acesso-carga')!)).toBeLessThan(.0001);
 });
 it('exporta o modelo de entulho nas duas variantes usadas pelo jogo',async()=>{
  const io=new NodeIO();
  for(const suffix of ['','-low']){
   const doc=await io.read(`public/assets/models/industrial-waste${suffix}.glb`);
   expect(doc.getRoot().listMeshes().length).toBeGreaterThan(0);
   expect(doc.getRoot().listMaterials().length).toBeLessThanOrEqual(6);
  }
 });
});
