import {lineLength,sampleLine,segmentDistance,type Point} from './spatial';

/** An approach ends at its first intersection with the destination street.
 * Keeping a tail after that intersection creates a second junction and two
 * almost coincident lanes through the same block. */
export function trimRoadApproach(points:Point[],target:Point[]):Point[]{
 const cross=(a:Point,b:Point)=>a[0]*b[1]-a[1]*b[0];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],u:Point=[b[0]-a[0],b[1]-a[1]];
  const hits:{t:number;point:Point}[]=[];
  for(let j=1;j<target.length;j++){
   const c=target[j-1],d=target[j],v:Point=[d[0]-c[0],d[1]-c[1]],den=cross(u,v);
   if(Math.abs(den)<1e-10)continue;
   const delta:Point=[c[0]-a[0],c[1]-a[1]],t=cross(delta,v)/den,s=cross(delta,u)/den;
   if(t>=-1e-7&&t<=1+1e-7&&s>=-1e-7&&s<=1+1e-7)hits.push({t,point:[a[0]+u[0]*t,a[1]+u[1]*t]});
  }
  if(hits.length){const first=hits.sort((a,b)=>a.t-b.t)[0];return [...points.slice(0,i),first.point];}
 }
 return points;
}

/** Rebuild the last metres as a smooth curve meeting the destination at a
 * right angle. This reserves separate approaches instead of a long narrow Y. */
export function squareRoadApproach(points:Point[],target:Point[],length=20):Point[]{
 const end=points.at(-1)!,startDistance=Math.max(0,lineLength(points)-length),start=sampleLine(points,startDistance);
 let segment=1,gap=Infinity;
 for(let i=1;i<target.length;i++){const d=segmentDistance(end,target[i-1],target[i]);if(d<gap){gap=d;segment=i;}}
 const a=target[segment-1],b=target[segment],size=Math.hypot(b[0]-a[0],b[1]-a[1]),normal:Point=[-(b[1]-a[1])/size,(b[0]-a[0])/size];
 const side=(start.point[0]-end[0])*normal[0]+(start.point[1]-end[1])*normal[1]>=0?1:-1;
 const c1:Point=[start.point[0]+start.tangent[0]*6,start.point[1]+start.tangent[1]*6],c2:Point=[end[0]+normal[0]*side*7,end[1]+normal[1]*side*7];
 const curve=Array.from({length:41},(_,i)=>{const t=i/40,s=1-t;return [0,1].map(k=>s*s*s*start.point[k]+3*s*s*t*c1[k]+3*s*t*t*c2[k]+t*t*t*end[k]) as Point;});
 return [...points.slice(0,start.index),...curve];
}
