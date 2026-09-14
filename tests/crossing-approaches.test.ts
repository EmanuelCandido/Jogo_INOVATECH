import {expect,it} from 'vitest';
import clip from 'polygon-clipping';
import {crossingApproaches,crossingApproachSurfaces,crossingSidewalks,crossingViaductSidewalks} from '../src/config/crossingApproaches';
import {industrialSidewalks} from '../src/config/industrialPaving';
import {streetLayout} from '../src/config/referenceMap';
import {multiPolygonArea} from '../src/config/streetLayout';

it('preserva a superfície do passeio e recorta os encontros sem invadir asfalto',()=>{
 for(const elevated of [false,true]){
  const original=elevated?streetLayout.viaductSidewalks:industrialSidewalks,base=elevated?crossingViaductSidewalks:crossingSidewalks;
  const pieces=crossingApproachSurfaces.find(c=>c.elevated===elevated)!.polygons,joined=clip.union(base,pieces);
  expect(multiPolygonArea(clip.xor(original,joined))).toBeLessThan(.00001);
  expect(multiPolygonArea(clip.intersection(base,pieces))).toBeLessThan(.00001);
  expect(pieces.reduce((area,p)=>area+multiPolygonArea([p]),0)-multiPolygonArea(clip.union(pieces))).toBeLessThan(.00001);
 }
});

it('encontra o nível do asfalto e retorna gradualmente à calçada',()=>{
 for(const a of crossingApproaches){
  expect(a.polygons.length,a.road).toBeGreaterThan(0);
  const c=a.crossing;
  for(const side of [-1,1]){
   const p:[number,number]=[c.point[0]-c.tangent[1]*side*c.width/2,c.point[1]+c.tangent[0]*side*c.width/2];
   expect(a.offset(...p),a.road).toBeCloseTo(.038,3);
   const outer:[number,number]=[p[0]-c.tangent[1]*side*.675,p[1]+c.tangent[0]*side*.675];
   expect(a.offset(...outer),a.road).toBeCloseTo(.015,3);
  }
 }
});
