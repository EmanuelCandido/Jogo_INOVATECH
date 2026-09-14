import type {Point} from './spatial';

/** Offset perpendicular to the actual polyline. The miter keeps the distance
 * to both incident segments constant, with a bounded join at sharp corners. */
export function offsetPolyline(points:Point[],distance:number):Point[]{
 return points.map((p,i)=>{
  const normal=(a:Point,b:Point):Point=>{const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;return [-dy/length,dx/length];};
  const before=normal(points[Math.max(0,i-1)],p),after=normal(p,points[Math.min(points.length-1,i+1)]);
  if(i===0)return [p[0]+after[0]*distance,p[1]+after[1]*distance];
  if(i===points.length-1)return [p[0]+before[0]*distance,p[1]+before[1]*distance];
  const x=before[0]+after[0],y=before[1]+after[1],length=Math.hypot(x,y)||1,n:Point=[x/length,y/length],miter=distance/Math.max(.5,n[0]*after[0]+n[1]*after[1]);
  return [p[0]+n[0]*miter,p[1]+n[1]*miter];
 });
}
export function buildRiverCorridors(samples:Point[],width:(v:number)=>number){
 return [-1,1].map(side=>{
  const bank=samples.filter(([,v])=>v<=76&&v>=-73).map(([u,v]):Point=>[u+side*width(v)/2,v]);
  return {side,bank,walk:offsetPolyline(bank,side*1.15),cycle:offsetPolyline(bank,side*2.95),furniture:offsetPolyline(bank,side*4.45),walkWidth:1.5,cycleWidth:1.65};
 });
}
