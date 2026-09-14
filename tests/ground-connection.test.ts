import {expect,it} from 'vitest';
import {groundConnection} from '../src/config/groundConnection';
import {corridorGap,type Point} from '../src/config/spatial';

it('connects entrances around the full building without cutting corners',()=>{
 const obstacle:Point[]=[[-2,-2],[2,-2],[2,2],[-2,2]];
 const path=groundConnection([-5,0],[5,0],[obstacle],()=>true);
 expect(path[0]).toEqual([-5,0]);expect(path.at(-1)).toEqual([5,0]);
 expect(path.length).toBeGreaterThan(2);
 expect(corridorGap(obstacle,path,1.4)).toBeGreaterThanOrEqual(.019);
});

it('refuses a connection across an impassable strip',()=>{
 expect(()=>groundConnection([-3,0],[3,0],[],p=>Math.abs(p[0])>1)).toThrow('No continuous ground connection');
});
