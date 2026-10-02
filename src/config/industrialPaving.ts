import clip,{type Polygon} from 'polygon-clipping';
import {industrialAprons,streetLayout,dumpEntryTurns,dumpDriveway,placement,facing,compositionPoint} from './referenceMap';
import {attachmentWorld,layoutFor} from '../assets/modelLayout';
import {dumpSite} from './dumpSite';
import {corridorPolygon} from './streetLayout';

/** One paved envelope for the apron, driveway and the complete turning truck.
 * Remove the same envelope from the sidewalk so no paving band closes a dock. */
// A convex turning pad avoids hundreds of nearly collinear rectangle edges in
// the boolean operation and leaves usable pavement inside the reverse curve.
function hull(points:[number,number][]){
 const sorted=points.map(([x,y])=>[Math.round(x*1e5)/1e5,Math.round(y*1e5)/1e5] as [number,number]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a:[number,number],b:[number,number],c:[number,number])=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const half=(input:typeof sorted)=>{const out:typeof sorted=[];for(const p of input){while(out.length>1&&cross(out.at(-2)!,out.at(-1)!,p)<=0)out.pop();out.push(p);}return out.slice(0,-1);};
 return [...half(sorted),...half([...sorted].reverse())];
}
const patches:Polygon[]=industrialAprons.flatMap(a=>[
 [a.footprint],corridorPolygon({id:a.id,width:3.3,points:a.driveway}),
 [hull(a.swept.flat())],
]);
// The dump access is an ordinary street up to the yard: asphalt with a
// sidewalk on both sides. Its mouth flares exactly as far as a turning truck
// sweeps (instead of separate concrete pads), and the sidewalk follows it.
// Consecutive truck positions are hulled in pairs so the kerb is a smooth curve.
function truckSweep(margin:number):Polygon[]{
 const bounds=layoutFor('prop.truck')!.bounds;
 return dumpEntryTurns.flatMap(turn=>{
  const rects=turn.samples.map(sample=>{
   const truck=placement('prop.truck',...sample.point,1,facing(...sample.heading));
   return [[bounds.min[0]-margin,bounds.min[2]-margin],[bounds.max[0]+margin,bounds.min[2]-margin],[bounds.max[0]+margin,bounds.max[2]+margin],[bounds.min[0]-margin,bounds.max[2]+margin]].map(([x,z]):[number,number]=>{const p=attachmentWorld(truck,[x,0,z]);return compositionPoint(p[0],p[2]);});
  });
  return rects.slice(1).map((r,i)=>[hull([...rects[i],...r])] as Polygon);
 });
}
const yard:Polygon=[dumpSite.footprint];
// The asphalt runs a little past the yard edge onto the solid dirt; the
// sidewalks stop at the edge.
const gateApron:Polygon=[[[dumpSite.gate[0]-3,dumpSite.gate[1]-2.5],[dumpSite.gate[0]+1.2,dumpSite.gate[1]-2.5],[dumpSite.gate[0]+1.2,dumpSite.gate[1]+2.5],[dumpSite.gate[0]-3,dumpSite.gate[1]+2.5]]];
const dumpPaving=clip.union(corridorPolygon(dumpDriveway),...truckSweep(.3));
export const dumpStreet=clip.difference(dumpPaving,clip.difference(yard,gateApron),streetLayout.asphalt);
const dumpSidewalks=clip.difference(clip.union(corridorPolygon(dumpDriveway,.675),...truckSweep(.3+.675)),yard,dumpPaving,streetLayout.asphalt);
export const industrialPaving=clip.union(patches[0],...patches.slice(1),dumpPaving);
export const industrialSidewalks=clip.difference(clip.union(streetLayout.sidewalks,dumpSidewalks),industrialPaving);
export const industrialServiceFloor=clip.difference(industrialPaving,streetLayout.asphalt,dumpPaving);
