import {describe,it,expect} from 'vitest';
import {routeFrame} from '../src/config/routeFrame';
import type {Point} from '../src/config/spatial';

describe('implantação por distância física no traçado',()=>{
 it('preserva posição e inclinação quando novos nós subdividem a rampa',()=>{
  const simple:Point[]=[[0,0],[20,0],[20,20]],split:Point[]=[[0,0],[3,0],[7,0],[20,0],[20,2],[20,11],[20,20]];
  const height=([x,y]:Point)=>(x+y)*.08;
  for(const d of [1,6,13,21,29,38]){
   const a=routeFrame(simple,d,.95,height),b=routeFrame(split,d,.95,height);
   expect(b.point).toEqual(a.point);expect(b.height).toBeCloseTo(a.height,10);
   expect(b.tangent).toEqual(a.tangent);expect(b.slope).toBeCloseTo(a.slope,10);
   expect(b.slope).toBeCloseTo(.08,10);
  }
 });
});
