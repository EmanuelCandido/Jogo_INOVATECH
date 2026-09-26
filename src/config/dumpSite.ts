import type {Placement} from '../game/types';
import type {Point} from './spatial';

/** One environmental lot shared by the mission and the background scene.
 * Coordinates of the scenery below are local to the mission's Y-up frame. */
export const dumpSite={
 centre:[99,42] as Point,
 footprint:[[90,30],[111,30],[113,51],[107,57],[92,55],[88,45]] as Point[],
 gate:[90,33] as Point,
 turning:[95,33] as Point,
};
export type DumpStage='initial'|'temporary'|'solved';
// Rear hopper of the truck parked at composition (99,33), in the lot's local frame.
export const dumpCollectionTarget:[number,number,number]=[-1.4,1.1,9];
// A single truck enters eastbound, turns around the disposal area and returns
// westbound through the same gate. Tangents agree at the circular joins.
export const dumpManeuver:{point:Point;heading:Point}[]=[];
for(let i=0;i<=36;i++)dumpManeuver.push({point:[90+i*.25,33],heading:[1,0]});
for(let i=1;i<=72;i++){const a=-Math.PI/2+i*Math.PI*1.5/72;dumpManeuver.push({point:[99+3*Math.cos(a),36+3*Math.sin(a)],heading:[-Math.sin(a),Math.cos(a)]});}
for(let i=1;i<=24;i++){const a=-i*Math.PI/48;dumpManeuver.push({point:[93+3*Math.cos(a),36+3*Math.sin(a)],heading:[Math.sin(a),-Math.cos(a)]});}
for(let i=1;i<=12;i++)dumpManeuver.push({point:[93-i*.25,33],heading:[-1,0]});
const pileSites=[[-6,-6,1.7],[-2,-7,2],[3,-6,1.8],[7,-4,1.6],[-5,-2,2.1],[0,-2,2.5],[5,0,2.2],[-5,3,1.8],[7,2,2.1],[8,6,1.5],[-6,1,1.5],[8,8,1.8]];
export const dumpScenery:Record<DumpStage,Placement[]>={initial:[],temporary:[],solved:[]};
for(const [i,[x,z,size]]of pileSites.entries()){
 const p:Placement={asset:i%3?'waste.industrial':'waste.pile',position:[x,.16,z],scale:[size,size,size],rotation:[0,i*2.399,0]};
 dumpScenery.initial.push(p);
 // Intervention removes most of the waste; remaining piles are contained.
 if(i%3===0)dumpScenery.temporary.push({...p,asset:'waste.partial',scale:[size*.72,size*.72,size*.72]});
 dumpScenery.solved.push({asset:i%3?'tree.oak':'tree.blossom',position:[x,.03,z],scale:[.85,.85,.85],rotation:[0,i,0]});
}
// Irregular clusters at the back of the lot, rather than rows of identical
// miniature piles. Keep the service approach in the south-west clear.
const rubbleSites=[[-6.4,-10.2],[-5.2,-8.7],[-3.7,-10.4],[-2.5,-8.9],[-.8,-10.7],[.4,-9.5],[2.3,-10.1],[3.5,-8.8],[5.1,-10.3],[6.4,-8.7],[-6.8,-6.8],[-3.7,-6.5],[.9,-7.5],[4.1,-6.9],[6.8,-6.2]];
for(let i=0;i<15;i++){
 const [x,z]=rubbleSites[i],size=1.15+(i%4)*.23;
 dumpScenery.initial.push({asset:'waste.industrial',position:[x,.05,z],scale:[size,size*.75,size],rotation:[0,i*1.72,0]});
}
dumpScenery.temporary.push({asset:'waste.bin',position:[-7,.06,6],scale:[1,1,1],rotation:[0,0,0]});
dumpScenery.solved.push({asset:'waste.bin',position:[-7,.06,6],scale:[1,1,1],rotation:[0,0,0]});
