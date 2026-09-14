import {describe,it,expect} from 'vitest';
import {offsetPolyline} from '../src/config/riverCorridors';
import {riverCorridors,mapRoads,roadViaduct,roadHeightAt,buildingLots} from '../src/config/referenceMap';
import {structuralSupports} from '../src/config/roadStructures';
import {segmentDistance,corridorGap} from '../src/config/spatial';
describe('corredores ribeirinhos e fundações',()=>{
 it('mede o afastamento perpendicular em uma margem diagonal',()=>{
  const bank:[number,number][]=[[0,10],[10,0],[20,-10]],offset=offsetPolyline(bank,2.95);
  expect(segmentDistance(offset[1],bank[0],bank[2])).toBeCloseTo(2.95,7);
  expect(Math.hypot(offset[1][0]-bank[1][0],offset[1][1]-bank[1][1])).toBeCloseTo(2.95,7);
 });
 it('mantém os lotes inteiros fora do passeio e da ciclovia',()=>{
  for(const lot of buildingLots)for(const c of riverCorridors){
   expect(corridorGap(lot.footprint,c.cycle,c.cycleWidth),lot.id+' ciclovia').toBeGreaterThan(.64);
   expect(corridorGap(lot.footprint,c.walk,c.walkWidth),lot.id+' passeio').toBeGreaterThan(.59);
  }
 });
 it('garante passagem por baixo dos tabuleiros nos cruzamentos da ciclovia',()=>{
  for(const c of riverCorridors)for(const r of [...mapRoads,roadViaduct])for(let i=1;i<c.cycle.length;i++){
   const a=c.cycle[i-1],b=c.cycle[i],poly:[number,number][]=[[a[0]-.82,a[1]-.82],[b[0]+.82,b[1]-.82],[b[0]+.82,b[1]+.82],[a[0]-.82,a[1]+.82]];
   if(corridorGap(poly,r.points,r.width+1.35)>0)continue;
   const midpoint:[number,number]=[(a[0]+b[0])/2,(a[1]+b[1])/2];
   // Deck underside is 0.425 below the road floor. A seated cyclist plus
   // bicycle occupies 1.60 m; keep at least 0.30 m of additional space.
   expect(roadHeightAt(r,midpoint)-.425-.052,r.id+' @ '+midpoint).toBeGreaterThan(1.9);
  }
 });
 it('deixa todas as fundações fora da largura útil dos caminhos',()=>{
  expect(structuralSupports.length).toBeGreaterThan(30);
  for(const s of structuralSupports)for(const c of riverCorridors){
   expect(corridorGap(s.footprint,c.cycle,c.cycleWidth),s.road).toBeGreaterThan(.39);
   expect(corridorGap(s.footprint,c.walk,c.walkWidth),s.road).toBeGreaterThan(.29);
  }
 });
});
