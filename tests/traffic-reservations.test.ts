import {expect,it} from 'vitest';
import {reserveTraffic} from '../src/config/trafficReservations';

it('relocates obstructing vehicles without reducing population or creating collisions',()=>{
 const source=[{id:'bus',x:0},{id:'car',x:3},{id:'truck',x:.5}];
 const result=reserveTraffic(source,p=>Math.abs(p.x)<1,(p,d)=>({...p,x:p.x+d}),(a,b)=>Math.abs(a.x-b.x)<1,20);
 expect(result.map(p=>p.id)).toEqual(source.map(p=>p.id));
 expect(result.every(p=>Math.abs(p.x)>=1)).toBe(true);
 expect(result[1]).toBe(source[1]);
 for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++)expect(Math.abs(result[i].x-result[j].x)).toBeGreaterThanOrEqual(1);
});

it('reports insufficient route space instead of silently deleting vehicles',()=>{
 expect(()=>reserveTraffic([0],()=>true,()=>null,()=>false,2)).toThrow('No free position');
});

it('separates vehicles already too close even when neither occupies a crossing',()=>{
 const result=reserveTraffic([0,.5],()=>false,(p,d)=>p+d,(a,b)=>Math.abs(a-b)<1,10);
 expect(result).toHaveLength(2);
 expect(Math.abs(result[0]-result[1])).toBeGreaterThanOrEqual(1);
});

it('moves a chain of neighbours on their own routes to make room for a reserved marking',()=>{
 const source=[{id:'a',x:0},{id:'b',x:4},{id:'c',x:2}];
 const routes:Record<string,number[]>={a:[0,4],b:[4,6],c:[0,2]};
 const result=reserveTraffic(source,p=>p.x===2,(p,d)=>routes[p.id].includes(p.x+d)?{...p,x:p.x+d}:null,(a,b)=>Math.abs(a.x-b.x)<1,8);
 expect(result.map(p=>p.x)).toEqual([4,6,0]);
 expect(result.map(p=>p.id)).toEqual(source.map(p=>p.id));
 expect(source.map(p=>p.x)).toEqual([0,4,2]);
});

it('rolls back an impossible relocation without mutating the authored placements',()=>{
 const source=[{id:'a',x:0},{id:'b',x:2}];
 expect(()=>reserveTraffic(source,p=>p.x===2,(p,d)=>p.x+d===0?{...p,x:0}:null,(a,b)=>a.x===b.x,3)).toThrow('No free position');
 expect(source).toEqual([{id:'a',x:0},{id:'b',x:2}]);
});

it('accepts a valid candidate whose value is zero',()=>{
 expect(reserveTraffic([1],p=>p!==0,(p,d)=>p+d,(a,b)=>a===b,2)).toEqual([0]);
});
