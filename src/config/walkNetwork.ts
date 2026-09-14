import {contains,segmentDistance,lineLength,type Point} from './spatial';

export interface WalkLot {id:string;entry:Point;footprint:Point[];height:number}
export interface WalkRoad {points:Point[];width:number;heights:number[]}
export interface WalkLink {id:string;points:Point[];height:number;accessHeight:number;sidewalk:Point;lift:boolean}
/** One multi-source flood, shared by every address. Roads are destinations,
 * water and building envelopes are obstacles. Eight neighbours are checked
 * without cutting corners. The grid is authoring data, never a frame task. */
export function buildWalkNetwork(lots:WalkLot[],roads:WalkRoad[],land:(u:number,v:number)=>boolean){
 const step=.8,minX=-120,minY=-85,nx=344,ny=268,total=nx*ny;
 const point=(i:number):Point=>[minX+(i%nx)*step,minY+Math.floor(i/nx)*step];
 const index=(p:Point)=>Math.round((p[1]-minY)/step)*nx+Math.round((p[0]-minX)/step);
 const boxes=lots.map(l=>({l,minX:Math.min(...l.footprint.map(p=>p[0]))-.8,maxX:Math.max(...l.footprint.map(p=>p[0]))+.8,minY:Math.min(...l.footprint.map(p=>p[1]))-.8,maxY:Math.max(...l.footprint.map(p=>p[1]))+.8}));
 const buckets=new Map<string,{a:Point;b:Point;width:number;height:number}[]>();
 for(const r of roads)for(let j=1;j<r.points.length;j++){
  const a=r.points[j-1],b=r.points[j],width=r.width/2,height=Math.min(r.heights[j-1],r.heights[j]);
  for(let x=Math.floor((Math.min(a[0],b[0])-width-3)/5);x<=Math.floor((Math.max(a[0],b[0])+width+3)/5);x++)for(let y=Math.floor((Math.min(a[1],b[1])-width-3)/5);y<=Math.floor((Math.max(a[1],b[1])+width+3)/5);y++){
   const key=x+','+y,list=buckets.get(key)??[];list.push({a,b,width,height});buckets.set(key,list);
  }
 }
 const state=new Int8Array(total),parent=new Int32Array(total).fill(-1),queue:number[]=[],goals=new Map<number,{point:Point;height:number;sidewalk:Point}>();
 for(let i=0;i<total;i++){
  const p=point(i);if(!land(...p))continue;
  if(boxes.some(b=>p[0]>=b.minX&&p[0]<=b.maxX&&p[1]>=b.minY&&p[1]<=b.maxY&&(contains(p,b.l.footprint)||b.l.footprint.some((q,j)=>segmentDistance(p,q,b.l.footprint[(j+1)%4])<.76))))continue;
  const nearby=buckets.get(Math.floor(p[0]/5)+','+Math.floor(p[1]/5))??[];
  if(nearby.some(r=>r.height<2.2&&segmentDistance(p,r.a,r.b)<r.width+.7))continue;
  state[i]=1;
  // Ordinary addresses enter a pavement on prepared ground. A bridge deck is
  // not an entrance destination; station lifts are designed independently.
  const goal=nearby.find(r=>r.height<.025&&segmentDistance(p,r.a,r.b)>r.width+1.6&&segmentDistance(p,r.a,r.b)<r.width+2.5);
  if(goal){
   const dx=goal.b[0]-goal.a[0],dy=goal.b[1]-goal.a[1],t=Math.max(0,Math.min(1,((p[0]-goal.a[0])*dx+(p[1]-goal.a[1])*dy)/(dx*dx+dy*dy||1))),q:Point=[goal.a[0]+dx*t,goal.a[1]+dy*t],d=Math.hypot(p[0]-q[0],p[1]-q[1]);
   const sidewalk:Point=[q[0]+(p[0]-q[0])/d*(goal.width+.4),q[1]+(p[1]-q[1])/d*(goal.width+.4)];
   parent[i]=i;queue.push(i);goals.set(i,{point:p,height:goal.height,sidewalk});
  }
 }
 // Breadth-first gives a reproducible connected tree; cardinal and diagonal
 // edges have the same authoring cost, with diagonal corner cutting forbidden.
 for(let head=0;head<queue.length;head++){
  const i=queue[head],x=i%nx,y=Math.floor(i/nx);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   if(x+dx<0||x+dx>=nx||y+dy<0||y+dy>=ny)continue;
   const j=i+dx+dy*nx;if(!state[j]||parent[j]>=0||dx&&dy&&(!state[i+dx]||!state[i+dy*nx]))continue;
   parent[j]=i;queue.push(j);
  }
 }
 const links:WalkLink[]=[],unreachable:string[]=[];
 for(const l of lots){
  const origin=index(l.entry),candidates:number[]=[];
  for(let dx=-5;dx<=5;dx++)for(let dy=-5;dy<=5;dy++){const i=origin+dx+dy*nx;if(i>=0&&i<total&&parent[i]>=0)candidates.push(i);}
  candidates.sort((a,b)=>Math.hypot(point(a)[0]-l.entry[0],point(a)[1]-l.entry[1])-Math.hypot(point(b)[0]-l.entry[0],point(b)[1]-l.entry[1]));
  const start=candidates.find(i=>{
   const p=point(i),count=Math.ceil(Math.hypot(p[0]-l.entry[0],p[1]-l.entry[1])/.3);
   return Array.from({length:count+1},(_,j)=>[l.entry[0]+(p[0]-l.entry[0])*j/(count||1),l.entry[1]+(p[1]-l.entry[1])*j/(count||1)] as Point).every((q,j)=>land(...q)&&(!j||!contains(q,l.footprint))&&boxes.every(b=>b.l===l||!contains(q,b.l.footprint)&&b.l.footprint.every((a,j)=>segmentDistance(q,a,b.l.footprint[(j+1)%4])>=.72)));
  });
  if(start===undefined){unreachable.push(l.id);continue;}
  const points:Point[]=[l.entry];let i=start;
  while(parent[i]!==i){points.push(point(i));i=parent[i];}const goal=goals.get(i)!;points.push(goal.point);
  // Remove only collinear intermediate samples; do not smooth into obstacles.
  const compact=points.filter((p,i)=>i===0||i===points.length-1||Math.abs((p[0]-points[i-1][0])*(points[i+1][1]-p[1])-(p[1]-points[i-1][1])*(points[i+1][0]-p[0]))>1e-6);
  if(Math.abs(goal.height-l.height)>.08*lineLength(compact)){unreachable.push(l.id);continue;}
  links.push({id:l.id,points:compact,height:l.height,accessHeight:goal.height,sidewalk:goal.sidewalk,lift:false});
 }
 return {links,unreachable};
}
