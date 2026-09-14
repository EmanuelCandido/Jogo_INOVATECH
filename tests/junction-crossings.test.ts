import {describe,it,expect} from 'vitest';
import {buildJunctionCrossings} from '../src/config/junctionCrossings';
import type {ProfileRoad} from '../src/config/roadProfiles';

describe('travessias nos braços do cruzamento',()=>{
 const horizontal:ProfileRoad={id:'a',width:4,points:[[-20,0],[0,0],[20,0]]};
 it('marca os quatro braços, inclusive os internos ao traçado',()=>{
  const vertical:ProfileRoad={id:'b',width:4,points:[[0,-20],[0,0],[0,20]]};
  const result=buildJunctionCrossings([horizontal,vertical],[{point:[0,0],roads:['a','b'],height:0}],()=>0);
  expect(result.unresolved).toEqual([]);expect(result.crossings).toHaveLength(4);
  expect(result.crossings.filter(c=>c.road==='a')).toHaveLength(2);
 });
 it('não inventa um braço além do fim de uma rua em T',()=>{
  const vertical:ProfileRoad={id:'b',width:4,points:[[0,-20],[0,0]]};
  const result=buildJunctionCrossings([horizontal,vertical],[{point:[0,0],roads:['a','b'],height:0}],()=>0);
  expect(result.unresolved).toEqual([]);expect(result.crossings).toHaveLength(3);
 });
});
