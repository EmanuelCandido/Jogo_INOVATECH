import {it,expect} from 'vitest';
import {stationGuardrails,stationPassengerFloors} from '../src/config/stationPerimeters';
import {railFacilities,compositionPoint,distanceToRoute} from '../src/config/referenceMap';
import {segmentDistance} from '../src/config/spatial';
it('assenta os guarda-corpos no contorno conjunto e libera embarque e acessos',()=>{
 expect(stationGuardrails.length).toBeGreaterThan(60);
 for(const rail of stationGuardrails){
  const p=compositionPoint(rail.position[0],rail.position[2]);
  const floor=stationPassengerFloors.reduce((best,f)=>{
   const gap=Math.min(...f.polygon.flatMap(poly=>poly.flatMap(ring=>ring.slice(1).map((q,i)=>segmentDistance(p,ring[i],q)))));
   return gap<best.gap?{gap,f}:best;
  },{gap:Infinity,f:stationPassengerFloors[0]});
  expect(floor.gap).toBeLessThan(1e-5);
  const s=railFacilities.find(s=>s.name===floor.f.name)!;
  expect(distanceToRoute(...p,s.route)).toBeGreaterThan(1.22);
  for(const entry of [s.upperWalk[0],s.stairsTop])expect(Math.hypot(p[0]-entry[0],p[1]-entry[1])).toBeGreaterThan(.79);
 }
});
