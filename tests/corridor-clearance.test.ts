import {describe,it,expect} from 'vitest';
import {corridorGap,type Point} from '../src/config/spatial';

describe('reserva física de equipamentos junto à circulação',()=>{
 const plot:Point[]=[[-2,-1],[2,-1],[2,1],[-2,1]];
 it('detecta uma rua que atravessa o lote entre duas amostras externas',()=>{
  expect(corridorGap(plot,[[-10,0],[10,0]],3)).toBe(-1.5);
 });
 it('considera a largura da rua mesmo com o eixo fora do lote',()=>{
  expect(corridorGap(plot,[[-10,2],[10,2]],3)).toBeCloseTo(-.5);
  expect(corridorGap(plot,[[-10,4],[10,4]],3)).toBeCloseTo(1.5);
 });
 it('inclui contato colinear, cantos e segmentos degenerados',()=>{
  expect(corridorGap(plot,[[-10,1],[10,1]],0)).toBe(0);
  expect(corridorGap(plot,[[3,2],[3,2]],0)).toBeCloseTo(Math.sqrt(2));
  expect(corridorGap(plot,[[0,0],[0,0]],2)).toBe(-1);
 });
});
