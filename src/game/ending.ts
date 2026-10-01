import {Vector3} from 'three';
import {problems} from '../content/problems';
import {endingDialogue,endingTour} from '../content/ending';
import {overview} from '../config/world';
import {clampTarget,mapBaseZoom,mapFootprint} from './mapNavigation';
import type {CameraShot,Progress,Vec3} from './types';

/** Presentation of the ending. Only `progress.endingSeen` is saved: a reload
 * before the closing screen plays the ending again from the start. */
export type EndingStep='opening'|'tour'|'dialogue'|'closing';
export interface Ending {step:EndingStep;beat:number;line:number;replay:boolean;sequence:number}
/** Tour beats in milliseconds (a hop to the place plus time to read its
 * caption) and camera flights in seconds. The last beat is the finale. */
export const endingTiming={place:2600,flight:1.3,finale:5600,finaleFlight:2.4,finalePan:4};
export const finaleBeat=endingTour.length;
export const ENDING_WIDE='ending:wide';

export function cityTransformed(progress:Progress){
 return problems.every(p=>progress.problemStates[p.id]==='SOLVED');
}
/** The ending starts once, back on the map after the last complete solution. */
export function endingDue(progress:Progress){
 return progress.phase==='OVERVIEW'&&!progress.endingSeen&&cityTransformed(progress);
}
export function beginEnding(replay:boolean,sequence:number):Ending{
 return {step:'opening',beat:0,line:0,replay,sequence};
}
export function nextEnding(ending:Ending):Ending{
 if(ending.step==='opening')return {...ending,step:'tour',beat:0};
 if(ending.step==='tour')return ending.beat<finaleBeat?{...ending,beat:ending.beat+1}:{...ending,step:'dialogue',line:0};
 if(ending.step==='dialogue')return ending.line<endingDialogue.length-1?{...ending,line:ending.line+1}:{...ending,step:'closing'};
 return ending;
}
/** Skipping the tour goes to the conversation; skipping it, to the closing screen. */
export function skipEnding(ending:Ending):Ending{
 return ending.step==='opening'||ending.step==='tour'?{...ending,step:'dialogue',line:0}:{...ending,step:'closing'};
}
/** Camera shot of the ending: each place during the tour, then the whole city. */
export function endingShot(ending:Ending|null):string|null{
 if(!ending||ending.step==='opening')return null;
 if(ending.step==='tour'&&ending.beat<finaleBeat)return endingTour[ending.beat].problemId;
 return ENDING_WIDE;
}
/** Places already visited keep their check balloon; after the tour, all of them. */
export function endingVisited(ending:Ending|null,problemId:string){
 if(!ending||ending.step==='opening')return false;
 if(ending.step!=='tour')return true;
 return endingTour.findIndex(stop=>stop.problemId===problemId)<=ending.beat;
}
export function endingStats(progress:Progress){
 const first=new Map<string,string>();
 for(const d of progress.decisions)if(!first.has(d.problemId))first.set(d.problemId,d.effectiveness);
 return {
  places:problems.filter(p=>progress.problemStates[p.id]==='SOLVED').length,
  total:problems.length,
  decisions:progress.decisions.length,
  firstTry:[...first.values()].filter(v=>v==='COMPLETE').length,
 };
}
/** The whole city with every place's balloon in view, above the finale
 * banner: the map's usual view crops the outer places on most screens. A
 * screen too narrow for the whole city at a readable zoom gets two shots: the
 * camera lands on one end and pans slowly to the other (or, without motion,
 * one shot of the middle). */
export function endingWideShots(width:number,height:number,still=false):CameraShot[]{
 const offset=new Vector3(...overview.position).sub(new Vector3(...overview.target));
 const forward=offset.clone().negate().normalize();
 const right=new Vector3().crossVectors(forward,new Vector3(0,1,0)).normalize();
 const up=new Vector3().crossVectors(right,forward);
 let left=Infinity,rightmost=-Infinity,bottom=Infinity,top=-Infinity;
 for(const p of problems){
  const point=new Vector3(...p.markerPosition),a=point.dot(right),b=point.dot(up);
  left=Math.min(left,a);rightmost=Math.max(rightmost,a);bottom=Math.min(bottom,b);top=Math.max(top,b);
 }
 // Pixels kept clear: the skip button above, the banner below, balloon size around.
 const margin={side:width<700?44:96,top:height<500?50:70,bottom:height<500?110:230};
 const fit=Math.min((width-2*margin.side)/(rightmost-left),(height-margin.top-margin.bottom)/(top-bottom));
 // Never wider than the map itself: past the valley the terrain ends.
 const zoom=Math.max(fit,mapBaseZoom(width,height));
 const along=(bottom+top)/2+(margin.top-margin.bottom)/2/zoom;
 const shot=(across:number,duration:number):CameraShot=>{
  // The ground point that projects to that centre (right is horizontal).
  const target=right.clone().multiplyScalar(across).addScaledVector(up,along);
  target.addScaledVector(forward,-target.y/forward.y);
  const [x,z]=clampTarget(target.x,target.z,mapFootprint(zoom,width,height));
  target.set(x,0,z);
  const position=target.clone().addScaledVector(forward,-offset.length());
  return {position:position.toArray() as Vec3,target:target.toArray() as Vec3,zoom,duration};
 };
 const reach=(width/2-margin.side)/zoom;
 if(still||rightmost-left<=2*reach+1e-6)return [shot((left+rightmost)/2,endingTiming.finaleFlight)];
 return [shot(left+reach,endingTiming.finaleFlight),shot(rightmost-reach,endingTiming.finalePan)];
}
