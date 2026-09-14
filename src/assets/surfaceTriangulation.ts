import type {Point} from '../config/spatial';

/** Improve internal diagonals without moving the outline or filling holes.
 * Ear clipping followed by bisection retains very thin triangles along long
 * curved street boundaries. Lifting those triangles to a height field makes
 * their faces almost vertical even when the street itself has a mild slope. */
export function improveSurfaceTriangles(input:Point[]){
 const points:Point[]=[],lookup=new Map<string,number>();
 const ids=input.map(p=>{const key=p.map(n=>Math.round(n*1e7)).join(',');let id=lookup.get(key);if(id===undefined){id=points.length;lookup.set(key,id);points.push(p);}return id;});
 const triangles:number[][]=[];
 const orient=(a:number,b:number,c:number)=>(points[b][0]-points[a][0])*(points[c][1]-points[a][1])-(points[b][1]-points[a][1])*(points[c][0]-points[a][0]);
 for(let i=0;i<ids.length;i+=3){const t=ids.slice(i,i+3);if(new Set(t).size===3&&Math.abs(orient(...t as [number,number,number]))>1e-12)triangles.push(orient(...t as [number,number,number])>0?t:[t[0],t[2],t[1]]);}
 const edge=(a:number,b:number)=>a<b?a+','+b:b+','+a;
 const edges=new Map<string,Set<number>>(),queue:string[]=[],queued=new Set<string>();
 const schedule=(key:string)=>{if(!queued.has(key)){queued.add(key);queue.push(key);}};
 const attach=(id:number)=>{const t=triangles[id];for(let i=0;i<3;i++){const key=edge(t[i],t[(i+1)%3]),set=edges.get(key)??new Set();set.add(id);edges.set(key,set);if(set.size===2)schedule(key);}};
 const detach=(id:number)=>{const t=triangles[id];for(let i=0;i<3;i++){const key=edge(t[i],t[(i+1)%3]),set=edges.get(key)!;set.delete(id);if(!set.size)edges.delete(key);}};
 triangles.forEach((_,i)=>attach(i));
 for(let cursor=0;cursor<queue.length;cursor++){
  const key=queue[cursor];queued.delete(key);const adjacent=edges.get(key);if(adjacent?.size!==2)continue;
  const [left,right]=[...adjacent];let [a,b]=key.split(',').map(Number);
  const c=triangles[left].find(v=>v!==a&&v!==b)!,d=triangles[right].find(v=>v!==a&&v!==b)!;
  if(c===d||orient(c,d,a)*orient(c,d,b)>=-1e-14)continue;
  if(orient(a,b,c)<0)[a,b]=[b,a];
  const [x,y]=points[d],ax=points[a][0]-x,ay=points[a][1]-y,bx=points[b][0]-x,by=points[b][1]-y,cx=points[c][0]-x,cy=points[c][1]-y;
  const det=(ax*ax+ay*ay)*(bx*cy-by*cx)-(bx*bx+by*by)*(ax*cy-ay*cx)+(cx*cx+cy*cy)*(ax*by-ay*bx);
  const scale=Math.max(ax*ax+ay*ay,bx*bx+by*by,cx*cx+cy*cy);
  if(det<=1e-10*scale*scale)continue;
  detach(left);detach(right);
  triangles[left]=[c,d,b];triangles[right]=[d,c,a];attach(left);attach(right);
 }
 return {points,indices:triangles.flat()};
}

/** Subdivide shared edges once and reuse their midpoint on both faces.
 * Refining independent triangles leaves T-junctions: after lifting, a midpoint
 * no longer lies on its neighbour's straight edge, opening a slit in the floor. */
export function tessellateSurface(input:Point[],maxEdge:number|((a:Point,b:Point)=>number),height?:(u:number,v:number)=>number){
 let mesh=improveSurfaceTriangles(input);
 const key=(a:number,b:number)=>a<b?a+','+b:b+','+a;
 for(let pass=0;pass<16;pass++){
  const {points,indices}=mesh,split=new Map<string,number>(),heights=height?points.map(p=>height(...p)):null;
  const mark=(a:number,b:number)=>{const id=key(a,b);if(!split.has(id)){split.set(id,points.length);points.push([(points[a][0]+points[b][0])/2,(points[a][1]+points[b][1])/2]);}};
  for(let i=0;i<indices.length;i+=3){
   const ids=indices.slice(i,i+3),p=ids.map(id=>points[id]);
   const errors=heights?[0,1,2].map(j=>{
    const weights=[.25,.25,.25];weights[j]=.5;
    const point:Point=[0,1].map(k=>p.reduce((n,q,l)=>n+q[k]*weights[l],0)) as Point;
    return Math.abs(height!(...point)-ids.reduce((n,id,l)=>n+heights[id]*weights[l],0));
   }):[];
   const curved=errors.some(e=>e>.004);
   for(let j=0;j<3;j++){
    const a=ids[j],b=ids[(j+1)%3],length=Math.hypot(points[b][0]-points[a][0],points[b][1]-points[a][1]),limit=typeof maxEdge==='number'?maxEdge:maxEdge(points[a],points[b]);
    const midpointError=heights?Math.abs(height!((points[a][0]+points[b][0])/2,(points[a][1]+points[b][1])/2)-(heights[a]+heights[b])/2):0;
    if(length>limit*1.001||length>.06&&(curved||midpointError>.004))mark(a,b);
   }
  }
  if(!split.size)return mesh;
  const next:Point[]=[];
  const add=(a:number,b:number,c:number)=>next.push(points[a],points[b],points[c]);
  for(let i=0;i<indices.length;i+=3){
   const ids=indices.slice(i,i+3),mid=ids.map((a,j)=>split.get(key(a,ids[(j+1)%3]))),count=mid.filter(n=>n!==undefined).length;
   if(!count){add(ids[0],ids[1],ids[2]);continue;}
   if(count===3){const [a,b,c]=ids,[ab,bc,ca]=mid as number[];add(a,ab,ca);add(ab,b,bc);add(ca,bc,c);add(ab,bc,ca);continue;}
   if(count===1){const j=mid.findIndex(n=>n!==undefined),a=ids[j],b=ids[(j+1)%3],c=ids[(j+2)%3],ab=mid[j]!;add(a,ab,c);add(ab,b,c);continue;}
   const j=mid.findIndex(n=>n===undefined),a=ids[j],b=ids[(j+1)%3],c=ids[(j+2)%3],bc=mid[(j+1)%3]!,ca=mid[(j+2)%3]!;
   add(c,ca,bc);add(a,b,ca);add(b,bc,ca);
  }
  mesh=improveSurfaceTriangles(next);
 }
 return mesh;
}
