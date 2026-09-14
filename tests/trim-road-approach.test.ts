import {it,expect} from 'vitest';
import {trimRoadApproach,squareRoadApproach} from '../src/config/trimRoadApproach';
it('termina na primeira conexão e elimina a segunda interseção da cauda',()=>{
 expect(trimRoadApproach([[0,0],[5,5],[10,0],[15,5]],[[-2,3],[20,3]])).toEqual([[0,0],[3,3]]);
});
it('preserva uma aproximação que ainda não cruza a via de destino',()=>{
 expect(trimRoadApproach([[0,0],[2,2]],[[-2,3],[20,3]])).toEqual([[0,0],[2,2]]);
});
it('mantém a conexão e aproxima a rua pela normal da via de destino',()=>{
 const result=squareRoadApproach([[-30,-8],[-20,-5],[-10,-2],[0,0]],[[-40,0],[40,0]]);
 expect(result[0]).toEqual([-30,-8]);expect(result.at(-1)).toEqual([0,0]);
 const p=result.at(-2)!;
 expect(Math.abs(p[0]/p[1])).toBeLessThan(.12);
 expect(result.slice(0,-1).every(p=>p[1]<0)).toBe(true);
});
