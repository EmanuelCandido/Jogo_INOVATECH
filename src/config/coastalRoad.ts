import {CatmullRomCurve3,Vector3} from 'three';
import type {Placement} from '../game/types';
export const coastRoadCurve=new CatmullRomCurve3([[50,-22],[55,-21],[56,-17],[53,-8],[50,-1],[46,8],[42,15],[38,23],[35,26]].map(([x,z])=>new Vector3(x,.045,z)),false,'catmullrom',.2);
export const coastRoadSamples=coastRoadCurve.getSpacedPoints(220);
export function coastRoadX(z:number){
 const index=coastRoadSamples.findIndex(p=>p.z>=z);
 if(index<=0)return coastRoadSamples[Math.max(0,index)].x;
 const a=coastRoadSamples[index-1],b=coastRoadSamples[index];
 return a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z);
}
// Conservative short bounds are used to cut old sidewalks and reserve tree clearance.
export const coastRoadBounds:Placement[]=coastRoadSamples.slice(0,-1).map((p,i)=>{
 const q=coastRoadSamples[i+1],t=q.clone().sub(p).normalize(),mid=p.clone().add(q).multiplyScalar(.5);
 return {asset:'ground.asphalt',position:[mid.x,.015,mid.z],scale:[Math.abs(q.x-p.x)+Math.abs(t.z)*2,.05,Math.abs(q.z-p.z)+Math.abs(t.x)*2]};
});
export function nearCoastRoad(x:number,z:number,clearance=1){return coastRoadSamples.some(p=>Math.hypot(x-p.x,z-p.z)<clearance);}
