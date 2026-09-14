import clip,{type MultiPolygon,type Polygon} from 'polygon-clipping';
import type {Point} from './spatial';
import type {ProfileRoad} from './roadProfiles';

export function corridorPolygon(road:ProfileRoad,extra=0):Polygon{
 const edges=[-1,1].map(side=>road.points.map(([u,v],i):Point=>{
  const a=road.points[Math.max(0,i-1)],b=road.points[Math.min(road.points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,d=(road.width/2+extra)*side;
  // Shared junctions can differ by a few floating-point ulps after segment
  // intersection. A micrometre grid prevents zero-length boolean edges.
  return [Math.round((u-dy/length*d)*1e6)/1e6,Math.round((v+dx/length*d)*1e6)/1e6];
 }));return [[...edges[0],...edges[1].reverse()]];
}
export const circlePolygon=(point:Point,radius:number):Polygon=>[Array.from({length:40},(_,i)=>[point[0]+Math.cos(i*Math.PI/20)*radius,point[1]+Math.sin(i*Math.PI/20)*radius])];
const union=(polys:Polygon[])=>polys.length?clip.union(polys[0],...polys.slice(1)):[];

/** Same-level network surfaces are boolean polygons prepared once in the
 * authoring snapshot. The viaduct joins that network at its two declared
 * junctions only; its other crossings retain independent upper/lower floors. */
export function buildStreetLayout(roads:ProfileRoad[],viaduct:ProfileRoad,joins:Point[],terminals:{point:Point;radius:number}[]=[]){
 const asphalt=union([...roads.map(r=>corridorPolygon(r)),...terminals.map(t=>circlePolygon(t.point,t.radius))]);
 const outer=union([...roads.map(r=>corridorPolygon(r,.675)),...terminals.map(t=>circlePolygon(t.point,t.radius+.675))]);
 const elevated=corridorPolygon(viaduct),elevatedOuter=corridorPolygon(viaduct,.675),joinMask=union(joins.map(p=>circlePolygon(p,6)));
 const joinAsphalt=clip.intersection(elevated,joinMask),groundAtJoins=clip.intersection(asphalt,joinMask);
 return {
  asphalt,
  sidewalks:clip.difference(outer,asphalt,joinAsphalt),
  viaductAsphalt:clip.difference(elevated,groundAtJoins),
  viaductSidewalks:clip.difference(elevatedOuter,elevated,groundAtJoins),
  joinMask,
 };
}

export function multiPolygonArea(polygons:MultiPolygon){
 const ringArea=(ring:Point[])=>Math.abs(ring.reduce((n,p,i)=>{const q=ring[(i+1)%ring.length];return n+p[0]*q[1]-q[0]*p[1];},0))/2;
 return polygons.reduce((n,p)=>n+ringArea(p[0])-p.slice(1).reduce((sum,r)=>sum+ringArea(r),0),0);
}
