import {expect,it} from 'vitest';
import {improveSurfaceTriangles,tessellateSurface} from '../src/assets/surfaceTriangulation';
import type {Point} from '../src/config/spatial';
const area=([a,b,c]:Point[])=>((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
const quality=(t:Point[])=>Math.abs(area(t))/t.reduce((n,p,i)=>n+(p[0]-t[(i+1)%3][0])**2+(p[1]-t[(i+1)%3][1])**2,0);
const faces=(mesh:ReturnType<typeof improveSurfaceTriangles>)=>Array.from({length:mesh.indices.length/3},(_,i)=>mesh.indices.slice(i*3,i*3+3).map(j=>mesh.points[j]));

it('melhora a diagonal de faces estreitas conservando contorno, área e orientação',()=>{
 const a:Point=[0,0],b:Point=[10,0],c:Point=[10,1],d:Point=[4,2],input=[a,b,c,a,c,d];
 const result=faces(improveSurfaceTriangles(input));
 expect(Math.min(...result.map(quality))).toBeGreaterThan(Math.min(quality([a,b,c]),quality([a,c,d])));
 expect(result.reduce((n,t)=>n+area(t),0)).toBeCloseTo(area([a,b,c])+area([a,c,d]),10);
 expect(result.every(t=>area(t)>0)).toBe(true);
});

it('preserva os limites de uma superfície com um buraco e não duplica faces',()=>{
 const outer:Point[]=[[-2,-2],[2,-2],[2,2],[-2,2]],inner:Point[]=[[-1,-1],[1,-1],[1,1],[-1,1]],input:Point[]=[];
 for(let i=0;i<4;i++){const j=(i+1)%4;input.push(outer[i],outer[j],inner[j],outer[i],inner[j],inner[i]);}
 const result=improveSurfaceTriangles(input),triangles=faces(result);
 expect(triangles.reduce((n,t)=>n+area(t),0)).toBeCloseTo(12,10);
 expect(new Set(Array.from({length:result.indices.length/3},(_,i)=>result.indices.slice(i*3,i*3+3).sort((a,b)=>a-b).join(','))).size).toBe(triangles.length);
 const edges=new Map<string,number>();
 for(let i=0;i<result.indices.length;i+=3){const t=result.indices.slice(i,i+3);for(let j=0;j<3;j++){const key=[t[j],t[(j+1)%3]].sort((a,b)=>a-b).join(',');edges.set(key,(edges.get(key)??0)+1);}}
 expect([...edges.values()].every(n=>n===1||n===2)).toBe(true);
 const boundary=[...edges].filter(([,n])=>n===1).map(([key])=>key.split(',').map(Number).map(i=>result.points[i]));
 expect(boundary).toHaveLength(8);
 for(const ring of [outer,inner])for(let i=0;i<4;i++)expect(boundary.some(e=>e.includes(ring[i])&&e.includes(ring[(i+1)%4]))).toBe(true);
});

it('refina uma rampa curva com arestas compartilhadas e erro vertical limitado',()=>{
 const input:Point[]=[[-4,-2],[4,-2],[4,2],[-4,-2],[4,2],[-4,2]];
 const height=(x:number,z:number)=>.12*Math.sin(x*1.1)*Math.cos(z*.7),mesh=tessellateSurface(input,1.6,height),triangles=faces(mesh),edges=new Map<string,number>();
 expect(triangles.length).toBeLessThan(2000);
 expect(triangles.reduce((n,t)=>n+area(t),0)).toBeCloseTo(32,8);
 for(const t of triangles){
  expect(area(t)).toBeGreaterThan(0);
  for(const weights of [[1/3,1/3,1/3],[.5,.25,.25],[.25,.5,.25],[.25,.25,.5]]){
   const x=t.reduce((n,p,i)=>n+p[0]*weights[i],0),z=t.reduce((n,p,i)=>n+p[1]*weights[i],0),y=t.reduce((n,p,i)=>n+height(...p)*weights[i],0);
   expect(Math.abs(y-height(x,z))).toBeLessThan(.012);
  }
 }
 for(let i=0;i<mesh.indices.length;i+=3){const t=mesh.indices.slice(i,i+3);for(let j=0;j<3;j++){const k=[t[j],t[(j+1)%3]].sort((a,b)=>a-b).join(',');edges.set(k,(edges.get(k)??0)+1);}}
 for(const [key,count] of edges){
  expect(count).toBeLessThanOrEqual(2);
  if(count===1){const [a,b]=key.split(',').map(Number).map(i=>mesh.points[i]);expect(Math.abs(a[0])===4&&a[0]===b[0]||Math.abs(a[1])===2&&a[1]===b[1]).toBe(true);}
 }
});
