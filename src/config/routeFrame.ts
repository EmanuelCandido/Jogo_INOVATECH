import {lineLength,sampleLine,type Point} from './spatial';

/** Sample a lane in metres, including its local grade. Adding an intersection
 * vertex must not change the position, heading or height of a vehicle. */
export function routeFrame(points:Point[],distance:number,lane:number,height:(p:Point)=>number){
 const total=lineLength(points),d=Math.max(0,Math.min(total,distance));
 const {point:axis,tangent}=sampleLine(points,d);
 const point:Point=[axis[0]+tangent[1]*lane,axis[1]-tangent[0]*lane];
 const start=Math.max(0,d-.5),end=Math.min(total,d+.5);
 const slope=(height(sampleLine(points,end).point)-height(sampleLine(points,start).point))/(end-start||1);
 return {point,tangent,height:height(point),slope,distance:d};
}
