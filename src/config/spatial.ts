/** Shared geometry predicates. Metres in the authoring plane. */
export type Point=[number,number];
export function convexHull(points:Point[]):Point[]{
 const sorted=points.map(([x,y])=>[Math.round(x*1e5)/1e5,Math.round(y*1e5)/1e5] as Point).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a:Point,b:Point,c:Point)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const half=(input:Point[])=>{const out:Point[]=[];for(const p of input){while(out.length>1&&cross(out.at(-2)!,out.at(-1)!,p)<=0)out.pop();out.push(p);}return out.slice(0,-1);};
 return [...half(sorted),...half([...sorted].reverse())];
}
export function segmentDistance(p:Point,a:Point,b:Point){
 const x=b[0]-a[0],y=b[1]-a[1],d=x*x+y*y,t=d?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/d)):0;
 return Math.hypot(p[0]-a[0]-x*t,p[1]-a[1]-y*t);
}
// Cheap lower bounds skip Math.hypot where it cannot change a result. The
// margins are far above floating-point rounding, so every return value stays
// bit-identical to the plain computation.
const near=1e-6;
function outsideBox(p:Point,a:Point,b:Point,margin:number){
 return p[0]<Math.min(a[0],b[0])-margin||p[0]>Math.max(a[0],b[0])+margin||p[1]<Math.min(a[1],b[1])-margin||p[1]>Math.max(a[1],b[1])+margin;
}
export function contains(p:Point,poly:Point[]){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
 const a=poly[i],b=poly[j];if(!outsideBox(p,a,b,near)&&segmentDistance(p,a,b)<1e-7)return true;
 if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;}
export function segmentsCross(a:Point,b:Point,c:Point,d:Point){
 const cross=(p:Point,q:Point,r:Point)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 const ab=cross(a,b,c),ad=cross(a,b,d),ca=cross(c,d,a),cb=cross(c,d,b);
 return ab*ad<0&&ca*cb<0;
}
/** Distance a candidate pair cannot beat: gap between p and the box of ab. */
function boxDistance(p:Point,a:Point,b:Point){
 const dx=Math.max(0,Math.min(a[0],b[0])-p[0],p[0]-Math.max(a[0],b[0])),dy=Math.max(0,Math.min(a[1],b[1])-p[1],p[1]-Math.max(a[1],b[1]));
 return Math.hypot(dx,dy);
}
const beats=(lower:number,best:number)=>lower<=best*(1+1e-9)+near;
function pointsToEdges(points:Point[],poly:Point[],best:number){
 for(const p of points)for(let i=0;i<poly.length;i++){
  const q=poly[i],r=poly[(i+1)%poly.length];
  if(beats(boxDistance(p,q,r),best))best=Math.min(best,segmentDistance(p,q,r));
 }
 return best;
}
export function polygonGap(a:Point[],b:Point[]){
 if(a.some(p=>contains(p,b))||b.some(p=>contains(p,a))||a.some((p,i)=>b.some((q,j)=>segmentsCross(p,a[(i+1)%a.length],q,b[(j+1)%b.length]))))return 0;
 return pointsToEdges(b,a,pointsToEdges(a,b,Infinity));
}
/** Signed clearance from a complete plot to a swept centreline. A negative
 * value means that some part of the corridor occupies the plot. Collinear
 * contact and intersections between samples are included. */
export function corridorGap(poly:Point[],points:Point[],width:number){
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const [x,y] of poly){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 // No segment farther than this from the plot's box can touch it or lower the gap.
 const lower=(a:Point,b:Point)=>Math.hypot(Math.max(0,minX-Math.max(a[0],b[0]),Math.min(a[0],b[0])-maxX),Math.max(0,minY-Math.max(a[1],b[1]),Math.min(a[1],b[1])-maxY));
 let gap=Infinity,first=1,firstLower=Infinity;
 for(let i=1;i<points.length;i++){const l=lower(points[i-1],points[i]);if(l<firstLower){firstLower=l;first=i;}}
 // The nearest segment first, so the others can usually be skipped. The
 // minimum, and any contact, do not depend on the order.
 for(let k=0;k<points.length-1;k++){
  const i=k===0?first:k<first?k:k+1;
  const a=points[i-1],b=points[i];
  if(k&&!beats(lower(a,b),gap))continue;
  if(contains(a,poly)||contains(b,poly))return -width/2;
  for(let j=0;j<poly.length;j++){
   const c=poly[j],d=poly[(j+1)%poly.length];
   if(segmentsCross(a,b,c,d))return -width/2;
   gap=Math.min(gap,segmentDistance(a,c,d),segmentDistance(b,c,d),segmentDistance(c,a,b),segmentDistance(d,a,b));
  }
 }
 return gap-width/2;
}
export function sampleLine(points:Point[],distance:number){
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(distance<=length||i===points.length-1){const t=Math.max(0,Math.min(1,distance/(length||1)));return {point:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t] as Point,tangent:[(b[0]-a[0])/(length||1),(b[1]-a[1])/(length||1)] as Point,index:i};}distance-=length;}
 return {point:points[0],tangent:[1,0] as Point,index:0};
}
export const lineLength=(points:Point[])=>points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
