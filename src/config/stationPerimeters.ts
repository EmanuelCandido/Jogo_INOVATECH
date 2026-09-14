import clip from 'polygon-clipping';
import {corridorPolygon} from './streetLayout';
import {railFacilities,placement,facing,distanceToRoute,type MapPoint} from './referenceMap';
import type {Placement} from '../game/types';

export const stationSlabThickness=.28;
export const stationGuardrails:Placement[]=[];
export const stationPassengerFloors=railFacilities.map(s=>{
 const polygon=clip.union([s.footprint],corridorPolygon({id:'concourse',points:s.upperWalk,width:1.5}),corridorPolygon({id:'stairs',points:s.stairsJoin,width:1.5}));
 const openings=[s.upperWalk[0],s.stairsTop];
 for(const poly of polygon)for(const ring of poly)for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const n=Math.max(1,Math.ceil(length/.2));let start=-1;
  const point=(t:number):MapPoint=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const emit=(end:number)=>{
   if(start<0)return;const p=point(start/n),q=point(end/n),d=Math.hypot(q[0]-p[0],q[1]-p[1]);
   const count=Math.max(1,Math.ceil(d));
   for(let j=0;j<count;j++){
    const t=(j+.5)/count,part=placement('prop.stationGuardrail',p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,1,facing(q[0]-p[0],q[1]-p[1]),s.height);
    part.scale=[1,1,d/count];stationGuardrails.push(part);
   }
   start=-1;
  };
  for(let j=0;j<n;j++){
   const p=point((j+.5)/n),open=distanceToRoute(...p,s.route)<1.23||openings.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<.9);
   if(open)emit(j);else if(start<0)start=j;
  }
  emit(n);
 }
 return {name:s.name,height:s.height,polygon};
});
