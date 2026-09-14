import clip,{type MultiPolygon} from 'polygon-clipping';
import {circulationCrossings,mapRoads,roadViaduct,type MapPoint} from './referenceMap';
import {industrialSidewalks} from './industrialPaving';
import {streetLayout} from './referenceMap';

/** Continuous sidewalk transitions at the actual road edge. The asphalt is
 * 0.023 m above the current pavement, so the approach rises gently to meet it. */
export const crossingApproaches=circulationCrossings.crossings.map(c=>{
 const road=[...mapRoads,roadViaduct].find(r=>r.id===c.road)!;
 const at=(along:number,across:number):MapPoint=>[c.point[0]+c.tangent[0]*along-c.tangent[1]*across,c.point[1]+c.tangent[1]*along+c.tangent[0]*across];
 const mask:MultiPolygon=[[[at(-1.15,-c.width/2-.8),at(1.15,-c.width/2-.8),at(1.15,c.width/2+.8),at(-1.15,c.width/2+.8)]]];
 const elevated=road===roadViaduct;
 const polygons=clip.intersection(elevated?streetLayout.viaductSidewalks:industrialSidewalks,mask);
 const offset=(u:number,v:number)=>{
  const across=Math.abs(-(u-c.point[0])*c.tangent[1]+(v-c.point[1])*c.tangent[0]);
  const edgeDistance=Math.max(0,across-road.width/2);
  const along=Math.abs((u-c.point[0])*c.tangent[0]+(v-c.point[1])*c.tangent[1]);
  const shoulder=Math.max(0,Math.min(1,(1.15-along)/.5));
  return .015+.023*Math.max(0,1-edgeDistance/.675)*shoulder;
 };
 return {road:road.id,crossing:c,elevated,polygons,offset};
});
const masks=(elevated:boolean)=>crossingApproaches.filter(c=>c.elevated===elevated).flatMap(c=>c.polygons);
export const crossingApproachSurfaces=[false,true].map(elevated=>({elevated,polygons:clip.union(masks(elevated)),offset:(u:number,v:number)=>Math.max(.015,...crossingApproaches.filter(a=>a.elevated===elevated).map(a=>a.offset(u,v)))}));
export const crossingSidewalks=clip.difference(industrialSidewalks,masks(false));
export const crossingViaductSidewalks=clip.difference(streetLayout.viaductSidewalks,masks(true));
