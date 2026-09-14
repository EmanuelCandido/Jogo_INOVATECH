import {sampleLine,lineLength,type Point} from './spatial';

/** Shared by the painted markings and their vegetation visibility reserve. */
export function industrialYieldGeometry(road:{id:string;points:Point[];width:number}){
 const frame=sampleLine(road.points,lineLength(road.points)-6),heading=frame.tangent;
 const right:Point=[heading[1],-heading[0]],centre:Point=[frame.point[0]+right[0]*road.width*.24,frame.point[1]+right[1]*road.width*.24];
 const point=(forward:number,side:number):Point=>[centre[0]+heading[0]*forward+right[0]*side,centre[1]+heading[1]*forward+right[1]*side];
 return {yielding:road.id,priority:['ponte-industrial','patio-industrial'],centre,heading,
  triangle:[point(-.5,0),point(.45,-.44),point(.45,.44),point(-.5,0)],
  line:[[-.74,-.38],[-.18,.18],[.38,.74]].map(([a,b])=>[point(1.25,a),point(1.25,b)]),width:.085};
}

/** Ground prepared for four factories, truck circulation and the separate
 * environmental dump. The model scale is unchanged; the district grows east. */
export const industrialSite={
 footprint:[[76,28],[126,28],[136,49],[135,105],[85,107],[77,92],[79,74],[72,55]] as Point[],
 gate:[93,84] as Point,
 factories:[{point:[96,98] as Point,scale:1.6},{point:[115,98] as Point,scale:1.55},{point:[96,75] as Point,scale:1.4},{point:[115,75] as Point,scale:1.35}],
};

/** The plateau is a land preparation mask, not a floating building foundation.
 * A wide feather returns smoothly to the surrounding mountain. */
export function industrialGroundWeight(u:number,v:number){
 const outside=Math.max(78-u,u-135,30-v,v-106,0);
 const t=Math.min(1,outside/14);return 1-t*t*(3-2*t);
}
