import {mapRoads,roadViaduct,roadHeightAt,routeHeight,pedestrianNetwork,distanceToRoute,type MapPoint} from './referenceMap';
import {roadHeightSampler} from './roadProfiles';
import {segmentDistance} from './spatial';

const roads=[...mapRoads,roadViaduct];
const ground=roadHeightSampler(mapRoads.map(r=>({...r,heights:r.points.map((_,i)=>routeHeight(r,i))})));
const upper=roadHeightSampler([{...roadViaduct,heights:roadViaduct.points.map((_,i)=>routeHeight(roadViaduct,i))}]);
export interface GuardrailRun {road:string;side:number;points:MapPoint[];heights:number[]}
export const roadGuardrailRuns:GuardrailRun[]=[];

for(const road of roads)for(const side of [-1,1]){
 const edge=road.width/2+.61,floor=road===roadViaduct?upper:ground;
 const points=road.points.map((p,i):MapPoint=>{
  const a=road.points[Math.max(0,i-1)],b=road.points[Math.min(road.points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
  return [p[0]+dy/length*edge*side,p[1]-dx/length*edge*side];
 });
 const clear=(p:MapPoint)=>{
  const y=floor(...p);
  if(y<.3)return false;
  // Test the actual edge, not just the road centre at one end of the beam.
  // A connected ramp may differ by several centimetres across the junction.
  if(roads.some(other=>other!==road&&Math.abs(roadHeightAt(other,p)-y)<1.3&&distanceToRoute(...p,other)<other.width/2+.8))return false;
  if(pedestrianNetwork.links.some(link=>Math.abs(link.accessHeight-y)<.5&&[...link.points,link.sidewalk].some((q,i,all)=>i>0&&segmentDistance(p,all[i-1],q)<.95)))return false;
  return true;
 };
 let run:MapPoint[]=[];
 const flush=()=>{
  if(run.length>1){
   const heights=run.map(p=>floor(...p)),keep=new Set([0,run.length-1]),stack=[[0,run.length-1]];
   // Fine sampling locates openings; straight stretches still use one beam.
   // Retain bends in both the plan and the vertical profile within 1 cm.
   while(stack.length){
    const [a,b]=stack.pop()!,dx=run[b][0]-run[a][0],dz=run[b][1]-run[a][1],dy=heights[b]-heights[a],length=dx*dx+dy*dy+dz*dz;
    let error=.01*.01,at=-1;
    for(let i=a+1;i<b;i++){
     const px=run[i][0]-run[a][0],pz=run[i][1]-run[a][1],py=heights[i]-heights[a],t=Math.max(0,Math.min(1,(px*dx+py*dy+pz*dz)/(length||1))),distance=(px-t*dx)**2+(py-t*dy)**2+(pz-t*dz)**2;
     if(distance>error){error=distance;at=i;}
    }
    if(at!==-1){keep.add(at);stack.push([a,at],[at,b]);}
   }
   const indices=[...keep].sort((a,b)=>a-b);
   roadGuardrailRuns.push({road:road.id,side,points:indices.map(i=>run[i]),heights:indices.map(i=>heights[i])});
  }run=[];
 };
 const boundary=(a:MapPoint,b:MapPoint,valid:boolean):MapPoint=>{
  let left=a,right=b;for(let j=0;j<10;j++){const p:MapPoint=[(left[0]+right[0])/2,(left[1]+right[1])/2];if(clear(p)===valid)left=p;else right=p;}return valid?left:right;
 };
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25));
  let previous=a,wasClear=clear(a);
  for(let j=1;j<=steps;j++){
   const p:MapPoint=[a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps],isClear=clear(p);
   if(wasClear&&!run.length)run.push(previous);
   if(wasClear&&isClear)run.push(p);
   else if(wasClear){run.push(boundary(previous,p,true));flush();}
   else if(isClear)run.push(boundary(previous,p,false),p);
   previous=p;wasClear=isClear;
  }
 }flush();
}
