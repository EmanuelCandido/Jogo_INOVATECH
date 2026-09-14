import type {Placement} from '../game/types';
import {attachmentWorld,layoutFor} from '../assets/modelLayout';
import {corridorGap,sampleLine,type Point} from './spatial';

interface Route {id:string;points:Point[];width:number;kind?:'road'|'rail'|'walk';usage?:'freight'}
interface Stop {name:string;route:Route;index:number;distance:number}
interface Context {
 roads:Route[];
 land:(u:number,v:number)=>boolean;
 terrain:(u:number,v:number)=>number;
 railHeight:(route:Route,index:number)=>number;
 make:(asset:string,u:number,v:number,size:number,yaw:number,y:number)=>Placement;
 footprint:(placement:Placement)=>Point[];
 composition:(x:number,z:number)=>Point;
 facing:(u:number,v:number)=>number;
}
/** A complete station is reserved before surrounding buildings are placed.
 * Its access always starts on prepared ground; road-deck height cannot leak
 * into the footpaths or be used as a reason to add residential lifts. */
export function buildStationFacilities(stops:Stop[],ctx:Context){
 return stops.map((stop,stationIndex)=>{
  const sampled=sampleLine(stop.route.points,stop.distance),p=sampled.point,t=sampled.tangent;
  const height=ctx.railHeight(stop.route,sampled.index)+.16;
  const sides=[-1,1].map(side=>{
   const n:Point=[-t[1]*side,t[0]*side],centre:Point=[p[0]+n[0]*1.85,p[1]+n[1]*1.85];
   const edge=(offset:number)=>Array.from({length:23},(_,j)=>{const q=sampleLine(stop.route.points,stop.distance-11+j);return [q.point[0]-q.tangent[1]*side*offset,q.point[1]+q.tangent[0]*side*offset] as Point;});
   const footprint=[...edge(1.13),...edge(2.57).reverse()];
   const near=ctx.roads.filter(r=>!r.usage).reduce((d,r)=>Math.min(d,...r.points.map(q=>Math.hypot(q[0]-centre[0],q[1]-centre[1]))),Infinity);
   return {n,centre,side,footprint,near};
  }).sort((a,b)=>a.near-b.near);
  for(const c of sides){
   if(!c.footprint.every(q=>ctx.land(...q)))continue;
   const direction:Point=[-c.side*t[0],-c.side*t[1]],yaw=ctx.facing(...direction);
   const offset=(along:number,out:number):Point=>[c.centre[0]+direction[0]*along+c.n[0]*out,c.centre[1]+direction[1]*along+c.n[1]*out];
   for(const setback of (stationIndex===0?[8,10,6,12]:[3.5,5,7,9,11,13]))for(const along of [0,3,-3,6,-6]){
    const centre=offset(along,setback),stairs=ctx.make('prop.stationStairs',...centre,1,yaw,0);
    stairs.scale=[1,height/5.56,1];
    const lift=offset(along-5.1,setback),liftModel=ctx.make('prop.liftLanding',...lift,1,ctx.facing(...c.n),0);
    const groundFootprints=[ctx.footprint(stairs),ctx.footprint(liftModel)];
    if(groundFootprints.some(poly=>poly.some(q=>!ctx.land(...q)||Math.abs(ctx.terrain(...q))>.05)||ctx.roads.some(r=>corridorGap(poly,r.points,r.width)<.95)))continue;
    const transform=(local:[number,number,number]):Point=>{const q=attachmentWorld(stairs,local);return ctx.composition(q[0],q[2]);};
    const stairsEntry=transform(layoutFor(stairs.asset)!.entry!),stairsTop=transform(layoutFor(stairs.asset)!.platform!);
    const liftEntry:Point=[lift[0]+c.n[0]*1.02,lift[1]+c.n[1]*1.02];
    const liftExit:Point=[lift[0]-c.n[0]*.96,lift[1]-c.n[1]*.96];
    const outerLift=offset(along-5.1,setback-2.6),outerStair:Point=[stairsTop[0]-c.n[0]*1.75,stairsTop[1]-c.n[1]*1.75];
    const platformSample=sampleLine(stop.route.points,stop.distance+(along+4.2)*-c.side);
    const platformJoin:Point=[platformSample.point[0]-platformSample.tangent[1]*c.side*1.85,platformSample.point[1]+platformSample.tangent[0]*c.side*1.85];
    return {...stop,...c,t,length:22,height,accessHeight:0,access:liftEntry,lift,liftEntry,stairs,stairsEntry,stairsTop,groundFootprints,
     upperWalk:[liftExit,outerLift,outerStair,platformJoin] as Point[],stairsJoin:[outerStair,stairsTop] as Point[]};
   }
  }
  throw new Error('Estação sem reserva completa de acesso: '+stop.name);
 });
}
