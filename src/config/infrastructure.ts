import type {Placement,Vec3} from '../game/types';
import {coastRoadBounds,coastRoadX} from './coastalRoad';
import {pierAccess,seatingPaving,sportsAccess} from './publicSpaces';
export const box=(asset:string,position:Vec3,scale:Vec3):Placement=>({asset,position,scale});
export const roadXs=[-40,-30,-20,-10,0,10,20,30,40,50,60];
export const roadZs=[-42,-32,-22,-11,2,14,26,38];
export const roadWidth=2,walkWidth=.48,walkOffset=1.24;
export interface Street {axis:'x'|'z';at:number;from:number;to:number}
export const streets:Street[]=[
  ...[[-42,-20,36],[-32,-30,40],[-22,-40,-20],[-22,-10,54],[-11,-40,coastRoadX(-11)],[2,-30,0],[2,20,coastRoadX(2)],[14,-20,coastRoadX(14)],[26,-10,coastRoadX(26)],[38,0,30]].map(([at,from,to])=>({axis:'x' as const,at,from,to})),
  ...[[-40,-22,-11],[-30,-32,2],[-20,-42,14],[-10,-32,26],[0,-32,38],[10,-32,-11],[10,14,38],[20,-32,38],[30,-32,26],[40,-22,14],[50,-22,-1],[-20,-55,-48.9]].map(([at,from,to])=>({axis:'z' as const,at,from,to})),
];
export const straightRoadPlacements:Placement[]=streets.map(s=>s.axis==='x'?box('ground.asphalt',[(s.from+s.to)/2,.015,s.at],[s.to-s.from+2,.05,roadWidth]):box('ground.asphalt',[s.at,.015,(s.from+s.to)/2],[roadWidth,.05,s.to-s.from+2]));
export const roadPlacements=[...straightRoadPlacements,...coastRoadBounds];
export const infrastructure:Placement[]=[...straightRoadPlacements];
const pavement=(x:number,z:number,w:number,d:number)=>box('ground.sidewalk',[x,.045,z],[w,.09,d]);
function subtract(intervals:[number,number][],a:number,b:number):[number,number][]{
  return intervals.flatMap(([lo,hi])=>b<=lo||a>=hi?[[lo,hi] as [number,number]]:[...(a>lo?[[lo,a] as [number,number]]:[]),...(b<hi?[[b,hi] as [number,number]]:[])]);
}
// Cut every sidewalk against the complete road network, including T junctions.
for(const s of streets){
  for(const side of [-1,1]){
    const fixed=s.at+side*walkOffset;
    let sections:[number,number][]=[[s.from-1,s.to+1]];
    for(const r of roadPlacements){
      const [x,,z]=r.position,[w,,d]=r.scale!;
      const across=s.axis==='x'?z:x,half=s.axis==='x'?d/2:w/2;
      if(Math.abs(fixed-across)<half+walkWidth/2-.001)sections=subtract(sections,s.axis==='x'?x-w/2:z-d/2,s.axis==='x'?x+w/2:z+d/2);
    }
    for(const [a,b] of sections)if(b-a>.05)infrastructure.push(s.axis==='x'?pavement((a+b)/2,fixed,b-a,walkWidth):pavement(fixed,(a+b)/2,walkWidth,b-a));
  }
  for(const end of [s.from-1.24,s.to+1.24]){
    const cap=s.axis==='x'?pavement(end,s.at,.48,2.96):pavement(s.at,end,2.96,.48);
    if(roadPlacements.every(r=>Math.abs(cap.position[0]-r.position[0])>=(cap.scale![0]+r.scale![0])/2-.001||Math.abs(cap.position[2]-r.position[2])>=(cap.scale![2]+r.scale![2])/2-.001))infrastructure.push(cap);
  }
  const intersections=streets.filter(t=>t.axis!==s.axis&&t.at>=s.from&&t.at<=s.to&&s.at>=t.from&&s.at<=t.to).map(t=>t.at);
  for(let p=s.from+1;p<s.to-1;p+=1.7){
    if(intersections.some(c=>Math.abs(p-c)<2.5))continue;
    infrastructure.push(s.axis==='x'?box('road.crossing',[p,.048,s.at],[.7,.012,.05]):box('road.crossing',[s.at,.048,p],[.05,.012,.7]));
  }
  for(const c of intersections)for(const side of [-1,1]){
    const p=c+side*1.8;if(p<s.from||p>s.to)continue;
    for(let i=-3;i<=3;i++)infrastructure.push(s.axis==='x'?box('road.crossing',[p,.05,s.at+i*.24],[.5,.015,.13]):box('road.crossing',[s.at+i*.24,.05,p],[.13,.015,.5]));
  }
}
infrastructure.push({asset:'prop.bridge',position:[-20,-.313,-45.3],scale:[1.55,1,1.25],rotation:[0,Math.PI/2,0]});
// Connected park walks, commercial forecourts and the seafront pier.
infrastructure.push(pavement(9.1,1.7,.75,20),pavement(10,7.6,16.9,.75),pavement(17.6,1.7,.75,20));
infrastructure.push(pavement(5.5,6.6,5.4,.7),pavement(5.5,-1.2,.7,3.3));
infrastructure.push(pavement(4.8,19.7,7.2,.65),pavement(8,19.5,.65,7.6));
infrastructure.push(pavement(14,-49,31.8,11.8),pavement(32,-46,5.9,5.9));
infrastructure.push(pavement(59,-16.5,2.5,2.5),...pierAccess,...seatingPaving,...sportsAccess);
