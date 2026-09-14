import {segmentDistance,type Point} from './spatial';

export interface ProfileRoad {id:string;points:Point[];width:number}
export interface RoadJunction {point:Point;roads:string[];height:number}
const cross=(a:Point,b:Point)=>a[0]*b[1]-a[1]*b[0];

/** A connected road network, in physical distance. Height travels along its
 * edges, never across the surrounding land or an unrelated nearby road.
 * The input polylines are split at their actual same-level intersections. */
export function buildRoadProfiles(roads:ProfileRoad[],requiredHeight:(road:ProfileRoad,p:Point)=>number,maxGrade=.08){
 const cuts=roads.map(r=>r.points.map((p,i)=>({at:i,p})));
 for(let a=0;a<roads.length;a++)for(let b=a+1;b<roads.length;b++){
  const ra=roads[a],rb=roads[b];
  for(let i=1;i<ra.points.length;i++)for(let j=1;j<rb.points.length;j++){
   const p=ra.points[i-1],q=rb.points[j-1],pa=ra.points[i],qb=rb.points[j];
   if(Math.max(p[0],pa[0])+1e-7<Math.min(q[0],qb[0])||Math.max(q[0],qb[0])+1e-7<Math.min(p[0],pa[0])||Math.max(p[1],pa[1])+1e-7<Math.min(q[1],qb[1])||Math.max(q[1],qb[1])+1e-7<Math.min(p[1],pa[1]))continue;
   const u:Point=[pa[0]-p[0],pa[1]-p[1]],v:Point=[qb[0]-q[0],qb[1]-q[1]],delta:Point=[q[0]-p[0],q[1]-p[1]],det=cross(u,v);
   if(Math.abs(det)<1e-10)continue;
   const t=cross(delta,v)/det,s=cross(delta,u)/det;
   if(t< -1e-7||t>1+1e-7||s< -1e-7||s>1+1e-7)continue;
   const point:Point=[p[0]+u[0]*Math.max(0,Math.min(1,t)),p[1]+u[1]*Math.max(0,Math.min(1,t))];
   cuts[a].push({at:i-1+t,p:point});cuts[b].push({at:j-1+s,p:point});
  }
 }
 const nodes:{point:Point;roads:Set<string>;height:number;edges:{node:number;distance:number}[]}[]=[],lookup=new Map<string,number>();
 const nodeFor=(p:Point,id:string)=>{
  const key=p.map(n=>Math.round(n*1e6)).join(',');let i=lookup.get(key);
  if(i===undefined){i=nodes.length;lookup.set(key,i);nodes.push({point:p,roads:new Set(),height:0,edges:[]});}
  nodes[i].roads.add(id);return i;
 };
 const routes=roads.map((r,index)=>{
  const points=cuts[index].sort((a,b)=>a.at-b.at).filter((e,i,all)=>!i||Math.abs(e.at-all[i-1].at)>1e-7).map(e=>e.p);
  r.points=points;const ids=points.map(p=>nodeFor(p,r.id));
  for(let i=1;i<ids.length;i++){
   const a=ids[i-1],b=ids[i],distance=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
   if(a===b)continue;
   nodes[a].edges.push({node:b,distance});nodes[b].edges.push({node:a,distance});
  }
  ids.forEach((id,i)=>{nodes[id].height=Math.max(nodes[id].height,requiredHeight(r,points[i]));});
  return {r,ids};
 });
 // The surface occupies the full street width, including merge tapers before
 // centreline intersections. Constrain heights across that shared pavement
 // as well as along the centreline; otherwise two shallow approaches can
 // create a steep transverse ridge where their shoulders already overlap.
 // Disjoint parallel corridors have no such edge and retain their own level.
 for(let a=0;a<routes.length;a++)for(let b=a+1;b<routes.length;b++){
  const ra=routes[a],rb=routes[b],reach=(ra.r.width+rb.r.width)/2+1.35;
  for(const ia of ra.ids){
   const pa=nodes[ia].point;
   for(const ib of rb.ids){
    if(ia===ib)continue;
    const pb=nodes[ib].point;
    if(Math.abs(pa[0]-pb[0])>reach||Math.abs(pa[1]-pb[1])>reach)continue;
    const distance=Math.hypot(pa[0]-pb[0],pa[1]-pb[1]);if(distance>=reach)continue;
    // Physical distances obey the triangle inequality: changing corridors
    // cannot shorten a ramp below its actual run. Constrain every overlapping
    // pair, since the nearest sample alone misses oblique cross-sections.
    nodes[ia].edges.push({node:ib,distance});nodes[ib].edges.push({node:ia,distance});
   }
  }
 }
 // Max heap: the highest remaining constraint wins. Each relaxation is a
 // longitudinal ramp of at most maxGrade, including branches at a junction.
 const heap:{id:number;height:number}[]=[];
 const push=(id:number,height:number)=>{
  let i=heap.length;heap.push({id,height});while(i){const parent=(i-1)>>1;if(heap[parent].height>=height)break;heap[i]=heap[parent];i=parent;}heap[i]={id,height};
 };
 const pop=()=>{
  const first=heap[0],last=heap.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].height>heap[child].height)child++;if(heap[child].height<=last.height)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;
 };
 nodes.forEach((n,i)=>{if(n.height>0)push(i,n.height);});
 while(heap.length){
  const {id,height}=pop();if(height<nodes[id].height-1e-8)continue;
  for(const edge of nodes[id].edges){const next=Math.max(0,height-edge.distance*maxGrade);if(next>nodes[edge.node].height+1e-8){nodes[edge.node].height=next;push(edge.node,next);}}
 }
 const heights=new Map(routes.map(({r,ids})=>[r.id,ids.map(i=>nodes[i].height)]));
 const junctions:RoadJunction[]=nodes.filter(n=>n.roads.size>1).map(n=>({point:n.point,roads:[...n.roads],height:n.height}));
 return {heights,junctions,maxGrade};
}

export function heightAlongRoad(road:ProfileRoad,heights:readonly number[],p:Point){
 let distance=Infinity,height=0;
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1))),d=Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);
  if(d<distance){distance=d;height=heights[i-1]*(1-t)+heights[i]*t;}
 }
 return {distance,height};
}

/** Spatial index for triangulating road floors. A vertex only searches the
 * nearby road segments, instead of scanning the entire city for each face. */
export function roadHeightSampler(roads:(ProfileRoad&{heights:number[]})[],cellSize=8){
 const blendMargin=2;
 const cells=new Map<string,{a:Point;b:Point;ha:number;hb:number;road:string;radius:number;length:number}[]>();
 for(const r of roads)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],padding=r.width/2+.675+blendMargin,segment={a,b,ha:r.heights[i-1],hb:r.heights[i],road:r.id,radius:r.width/2+.675,length:Math.hypot(b[0]-a[0],b[1]-a[1])};
  for(let x=Math.floor((Math.min(a[0],b[0])-padding)/cellSize);x<=Math.floor((Math.max(a[0],b[0])+padding)/cellSize);x++)for(let y=Math.floor((Math.min(a[1],b[1])-padding)/cellSize);y<=Math.floor((Math.max(a[1],b[1])+padding)/cellSize);y++){
   const key=x+','+y,bucket=cells.get(key)??[];bucket.push(segment);cells.set(key,bucket);
  }
 }
 // Only streets whose pavement actually joins may share a transition. The
 // blending kernel extends beyond the asphalt so its weights never all vanish
 // at an outer junction corner. Otherwise the floor has a direction-dependent
 // height at that corner, even with perfectly consistent centreline profiles.
 // Two metres leave room for the taper; its squared weight has zero derivative
 // at the cutoff so an approaching third street cannot crease the existing floor.
 const neighbours=new Set<string>(),pair=(a:string,b:string)=>a<b?a+'|'+b:b+'|'+a;
 for(const bucket of cells.values())for(let i=0;i<bucket.length;i++)for(let j=i+1;j<bucket.length;j++){
  const a=bucket[i],b=bucket[j],id=pair(a.road,b.road);if(a.road===b.road||neighbours.has(id))continue;
  const radius=a.radius+b.radius;
  if(Math.max(a.a[0],a.b[0])+radius<Math.min(b.a[0],b.b[0])||Math.max(b.a[0],b.b[0])+radius<Math.min(a.a[0],a.b[0])||Math.max(a.a[1],a.b[1])+radius<Math.min(b.a[1],b.b[1])||Math.max(b.a[1],b.b[1])+radius<Math.min(a.a[1],a.b[1]))continue;
  const u:Point=[a.b[0]-a.a[0],a.b[1]-a.a[1]],v:Point=[b.b[0]-b.a[0],b.b[1]-b.a[1]],delta:Point=[b.a[0]-a.a[0],b.a[1]-a.a[1]],det=cross(u,v),t=cross(delta,v)/det,s=cross(delta,u)/det;
  if(Math.abs(det)>1e-12&&t>=0&&t<=1&&s>=0&&s<=1||Math.min(segmentDistance(a.a,b.a,b.b),segmentDistance(a.b,b.a,b.b),segmentDistance(b.a,a.a,a.b),segmentDistance(b.b,a.a,a.b))<radius)neighbours.add(id);
 }
 const cache=new Map<string,number>();
 return (u:number,v:number)=>{
  const key=u+','+v,cached=cache.get(key);if(cached!==undefined)return cached;
  let best=Infinity,height=0;
  const nearest=new Map<string,{distance:number;height:number;radius:number;weighted:number;weight:number}>();
  for(const {a,b,ha,hb,road,radius,length} of cells.get(Math.floor(u/cellSize)+','+Math.floor(v/cellSize))??[]){
   const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((u-a[0])*dx+(v-a[1])*dy)/(dx*dx+dy*dy||1))),d=(u-a[0]-dx*t)**2+(v-a[1]-dy*t)**2;
   const h=ha+(hb-ha)*t;
   if(d<best){best=d;height=h;}
   if(d<(radius+blendMargin)**2){
    const fade=1-Math.sqrt(d)/(radius+blendMargin),w=length*fade*fade/Math.max(1e-12,d);
    const sample=nearest.get(road)??{distance:Infinity,height:h,radius,weighted:0,weight:0};
    sample.distance=Math.min(sample.distance,d);sample.weighted+=h*w;sample.weight+=w;nearest.set(road,sample);
   }
  }
  // Inside a bend, two segments of the same street can be equally close with
  // different projected heights. Interpolate those projections too; choosing
  // just one creates the same bisector step as two intersecting streets.
  // Length weighting prevents inserted junction nodes from biasing the floor.
  for(const sample of nearest.values())if(sample.weight>0)sample.height=sample.weighted/sample.weight;
  // Two intersecting approaches share one floor. Switching to the nearest
  // centreline at their bisector produced a vertical step across the asphalt.
  // Blend connected streets, preserving each centreline with inverse distance.
  // Weights fade beyond the pavement, keeping its outer corners continuous.
  // Elevated networks are sampled separately, so they cannot pull a street up.
  const containing=[...nearest].filter(([,sample])=>sample.distance<=sample.radius**2);
  if(containing.length){
   const eligible=[...nearest].filter(([road])=>containing.some(([other])=>road===other||neighbours.has(pair(road,other))));
   let weighted=0,weight=0;
   for(const [,sample] of eligible){
    const fade=Math.max(0,1-Math.sqrt(sample.distance)/(sample.radius+blendMargin)),w=fade*fade/Math.max(1e-12,Math.sqrt(sample.distance));
    weighted+=sample.height*w;weight+=w;
   }
   if(weight>0)height=weighted/weight;
  }
  cache.set(key,height);return height;
 };
}
