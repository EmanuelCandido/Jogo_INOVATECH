import type { CameraShot, Placement, Vec3 } from "../game/types";
import {mapTarget,mapEye,referenceFrame} from './referenceFrame';
export const characterPlacement = {
  arrival: [7.1, 0.12, 5.9] as Vec3,
  problemOffset: [1.5, 0.12, 0.4] as Vec3,
  problemOffsets: { pollution_01: [0.55,0.12,0.9] } as Record<string,Vec3>,
};
// Mission plaza only. The street and terrain network lives in infrastructure.
const plaza: Placement[] = [
  {asset:"ground.sidewalk",position:[0,.17,.1],scale:[5.4,.34,4.4]},
  {asset:"ground.grass",position:[0,.36,-.4],scale:[2.3,.06,2.3]},
  {asset:"prop.fountain",position:[0,.34,-.5],scale:[1.35,1.35,1.35]},
  {asset:"prop.bench",position:[-1.8,.34,0],rotation:[0,Math.PI,0]},
  {asset:"prop.bench",position:[1.8,.34,0]},
  // A proper connection from the mission entrance to the avenue sidewalk.
  {asset:"ground.sidewalk",position:[0,.07,2.95],scale:[5.4,.14,.4]},
];
export const environment:Placement[]=[...plaza.map(p=>({...p,position:[p.position[0]+5.5,p.position[1],p.position[2]+2.8] as Vec3})),{asset:'ground.sidewalk',position:[17.5,.035,6.5],scale:[1.4,.07,3]}];
// Orthographic size is set by zoom. Keep the eye far enough back that tall
// phone viewports cannot cross the ocean's near clipping plane.
export const overview: CameraShot = {position:mapEye,target:mapTarget,zoom:referenceFrame.zoom,duration:1.5};
export const regions = {plaza:{...overview,target:[5.5,0,3.5] as Vec3},garden:{...overview,target:[17,0,6.5] as Vec3}};
