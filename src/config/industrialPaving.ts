import clip,{type Polygon} from 'polygon-clipping';
import {industrialAprons,streetLayout,dumpTurnPads,dumpDriveway} from './referenceMap';
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
patches.push(...dumpTurnPads.map(p=>[p] as Polygon),corridorPolygon(dumpDriveway));
export const industrialPaving=clip.union(patches[0],...patches.slice(1));
export const industrialSidewalks=clip.difference(streetLayout.sidewalks,industrialPaving);
export const industrialServiceFloor=clip.difference(industrialPaving,streetLayout.asphalt);
