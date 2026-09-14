import type {Crossing} from './junctionCrossings';
import type {ProfileRoad} from './roadProfiles';
import {sampleLine,lineLength,convexHull,polygonGap,type Point} from './spatial';

// The regional viaduct and named avenues carry through traffic. Minor
// streets yield on entry; all approaches keep a retention line before walkers.
const hierarchy=['viaduto-leste','avenida-central','avenida-estacao','rua-do-hospital','ligacao-hospital','acesso-futuro','rua-escola-sul','avenida-botanica','acesso-industrial','bairro-central','bairro-norte','comunidade','bairro-escola','reciclagem','anel-escola','margem-central','acesso-viaduto'];
const rank=(id:string)=>{const i=hierarchy.indexOf(id);return i<0?hierarchy.length:i;};
export function buildJunctionPriority(roads:ProfileRoad[],crossings:Crossing[],height:(road:ProfileRoad,point:Point)=>number){
 return crossings.map(c=>{
  const road=roads.find(r=>r.id===c.road)!;
  const arms=crossings.filter(a=>Math.hypot(a.node[0]-c.node[0],a.node[1]-c.node[1])<.01);
  const primary=[...new Set(arms.map(a=>a.road))].sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b))[0];
  const yielding=arms.length>2&&c.road!==primary;
  // +direction goes away from the crossing. Sample each piece on the road
  // curve instead of extending the crossing tangent across a bend.
  const at=(behind:number,side:number):Point=>{
   const frame=sampleLine(road.points,c.distance+c.direction*behind),heading:Point=[-c.direction*frame.tangent[0],-c.direction*frame.tangent[1]];
   return [frame.point[0]+heading[1]*side,frame.point[1]-heading[0]*side];
  };
  const remaining=c.direction<0?c.distance:lineLength(road.points)-c.distance;
  const middle=c.width/4,half=Math.min(.44,c.width/4-.2);
  const width=.09;
  const neighbours=crossings.filter(other=>Math.abs(height(road,c.point)-height(roads.find(r=>r.id===other.road)!,other.point))<.2);
  // On a bend, a fixed centre distance does not clear the outer corner of a
  // zebra crossing. Reserve complete strokes and check neighbouring crossings
  // as well as the one this approach serves.
  for(const retentionDistance of [1.2,1.35,1.5,1.65,1.8,1.95,2.1,.95,1.05]){
   if(remaining<retentionDistance+(yielding?1.55:.15))continue;
   const lines:Point[][]=[[at(retentionDistance,.17),at(retentionDistance,c.width/2-.17)]];
   if(yielding)lines.push([at(retentionDistance+1.4,middle),at(retentionDistance+.4,middle-half),at(retentionDistance+.4,middle+half),at(retentionDistance+1.4,middle)]);
   const reservations=lines.map(points=>convexHull(points.flatMap(p=>[-1,1].flatMap(x=>[-1,1].map(y=>[p[0]+x*width/2,p[1]+y*width/2] as Point)))));
   if(reservations.some(area=>neighbours.some(other=>polygonGap(area,other.footprint)<.1)))continue;
   return {road:c.road,crossing:c,primary,yielding,lines,width,reservations,retentionDistance};
  }
  throw new Error(`No clear approach marking on ${c.road} at ${c.distance}`);
 });
}
