import {corridorGap,lineLength,sampleLine,segmentDistance,type Point} from './spatial';
import type {ProfileRoad,RoadJunction} from './roadProfiles';

interface Road extends ProfileRoad {usage?:'freight';terminal?:string}
export interface Crossing {road:string;node:Point;distance:number;direction:number;point:Point;tangent:Point;width:number;footprint:Point[]}
export function buildJunctionCrossings(roads:Road[],junctions:RoadJunction[],height:(r:Road,p:Point)=>number){
 const crossings:Crossing[]=[],unresolved:{road:string;node:Point;direction:number}[]=[];
 for(const node of junctions)for(const id of node.roads){
  const r=roads.find(r=>r.id===id);if(!r||r.usage||r.terminal)continue;
  let at=0,nearest=Infinity,travel=0;
  for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),gap=segmentDistance(node.point,a,b);
   if(gap<nearest){nearest=gap;const t=Math.max(0,Math.min(1,((node.point[0]-a[0])*(b[0]-a[0])+(node.point[1]-a[1])*(b[1]-a[1]))/(length*length||1)));at=travel+t*length;}travel+=length;
  }
  const total=lineLength(r.points);
  for(const direction of [-1,1]){
   if((direction<0?at:total-at)<2)continue;
   let found=false;
   for(let offset=3;offset<=12;offset+=.5){
    const distance=at+direction*offset;if(distance<1||distance>total-1)break;
    const {point,tangent}=sampleLine(r.points,distance),[dx,dy]=tangent;
    const footprint:Point[]=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[point[0]+dx*a*.65-dy*b*r.width/2,point[1]+dy*a*.65+dx*b*r.width/2]);
    if(roads.some(other=>other!==r&&Math.abs(height(other,point)-height(r,point))<.2&&corridorGap(footprint,other.points,other.width)<.2))continue;
    if(!crossings.some(c=>c.road===id&&Math.abs(c.distance-distance)<2))crossings.push({road:id,node:node.point,distance,direction,point,tangent,width:r.width,footprint});
    found=true;break;
   }
   if(!found)unresolved.push({road:id,node:node.point,direction});
  }
 }
 return {crossings,unresolved};
}
