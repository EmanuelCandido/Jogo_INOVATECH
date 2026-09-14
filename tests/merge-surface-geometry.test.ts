import {describe,it,expect} from 'vitest';
import {BufferGeometry,Float32BufferAttribute,PlaneGeometry} from 'three';
import {mergeSurfaceGeometry} from '../src/assets/mergeSurfaceGeometry';

describe('união das superfícies sem expandir vértices',()=>{
 it('preserva exatamente os atributos e a ordem dos triângulos com entradas mistas',()=>{
  const indexed=new PlaneGeometry(3,2,5,4),flat=new PlaneGeometry(1,1).toNonIndexed();
  flat.translate(4,2,1);
  // Coincident positions must not erase a UV seam or a hard shading edge.
  flat.getAttribute('uv').setXY(3,.1234567,.7654321);
  flat.getAttribute('normal').setXYZ(3,0,1,0);
  const original=[indexed.toNonIndexed(),flat.clone()];
  const vertexCount=indexed.getAttribute('position').count+flat.getAttribute('position').count;
  const result=mergeSurfaceGeometry([indexed,flat]);
  expect(result.getAttribute('position').count).toBe(vertexCount);
  expect(vertexCount).toBeLessThan(result.index!.count);
  const expanded=result.toNonIndexed();
  for(const name of ['position','normal','uv']){
   const expected=original.flatMap(g=>Array.from(g.getAttribute(name).array));
   expect(Array.from(expanded.getAttribute(name).array),name).toEqual(expected);
  }
  result.dispose();expanded.dispose();original.forEach(g=>g.dispose());
 });
 it('mantém índices acima de 65535 sem truncar vértices',()=>{
  const geometry=new BufferGeometry(),count=65538;
  geometry.setAttribute('position',new Float32BufferAttribute(new Float32Array(count*3),3));
  const result=mergeSurfaceGeometry([geometry]);
  expect(result.index!.array).toBeInstanceOf(Uint32Array);
  expect(result.index!.count).toBe(count);
  expect(result.index!.getX(count-1)).toBe(count-1);
  result.dispose();
 });
});
