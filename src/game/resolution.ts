import type {Placement,Progress,Vec3} from './types';
import type {LandscapeDetail} from '../config/landscape';
import type {VisualKey} from '../config/situationVisuals';
import {situationVisualKey} from './situationState';

/** Presentation only. The decision is saved immediately; reloading never
 * replays a collection, charges twice or saves an intermediate landscape. */
export interface Resolution {
 problemId:string;
 sequence:number;
 from:VisualKey;
 to:VisualKey;
 duration:number;
 clock:{value:number};
}
export function createResolution(before:Progress,after:Progress,reduced=false):Resolution|null {
 const decision=after.decisions.at(-1);
 if(reduced||after===before||after.decisions.length!==before.decisions.length+1||!decision||decision.effectiveness==='NONE')return null;
 const from=situationVisualKey(before,decision.problemId),to=situationVisualKey(after,decision.problemId);
 if(from===to)return null;
 return {problemId:decision.problemId,sequence:decision.turn,from,to,duration:decision.problemId==='pollution_01'?6.8:5.2,clock:{value:0}};
}
export const resolutionRange=(t:number,start:number,end:number)=>Math.max(0,Math.min(1,(t-start)/(end-start)));
export const resolutionEase=(t:number)=>t*t*(3-2*t);

type Item=Placement|LandscapeDetail;
export const visualItemKey=(item:Item)=>JSON.stringify(['asset'in item?item.asset:item.shape,'color'in item?item.color:null,item.position,item.scale??[1,1,1],item.rotation??[0,0,0]]);
export interface VisualChange<T extends Item>{before?:T;after?:T;index:number;count:number}
/** Exact matches stay batched and motionless. Match moving actors separately
 * so the same animal walks to safety instead of vanishing and being replaced. */
export function planVisualChanges<T extends Item>(before:T[],after:T[]) {
 const remaining=[...after],stable:T[]=[],removed:T[]=[];
 for(const item of before){
  const index=remaining.findIndex(other=>visualItemKey(other)===visualItemKey(item));
  if(index<0)removed.push(item);else {stable.push(item);remaining.splice(index,1);}
 }
 const changes:VisualChange<T>[]=[];
 for(const item of removed){
  const actor='asset'in item&&/rabbit|wheelchair|prop\.car|prop\.bus/.test(item.asset);
  let match=-1,best=Infinity;
  if(actor)remaining.forEach((other,i)=>{
   if(!('asset'in other)||other.asset!==item.asset)return;
   const distance=Math.hypot(...item.position.map((v,j)=>v-other.position[j]));
   if(distance<best){best=distance;match=i;}
  });
  changes.push({before:item,after:match<0?undefined:remaining.splice(match,1)[0],index:0,count:0});
 }
 for(const item of remaining)changes.push({after:item,index:0,count:0});
 changes.forEach((change,index)=>{change.index=index;change.count=changes.length;});
 return {stable,changes};
}

/** All transforms are absolute, with exact endpoints; never mutate shared
 * source placements/materials or accumulate scale across repeated frames. */
export function sampleVisualChange(change:VisualChange<Item>,time:number,collection?:Vec3) {
 const {before,after,index,count}=change,item=after??before!;
 const position:[number,number,number]=[...item.position];
 const scale:[number,number,number]=[...(item.scale??[1,1,1])];
 const rotation:[number,number,number]=[...(item.rotation??[0,0,0])];
 const stagger=count>1?index/(count-1)*.18:0;
 const asset='asset'in item?item.asset:'';
 let visible=true;
 if(before&&after){
  const t=resolutionEase(resolutionRange(time,.22+stagger,.77+stagger));
  for(let axis=0;axis<3;axis++)position[axis]=before.position[axis]+(after.position[axis]-before.position[axis])*t;
  if(asset==='prop.rabbit')position[1]+=Math.abs(Math.sin(t*Math.PI*4))*.10;
  for(let axis=0;axis<3;axis++){
   scale[axis]=(before.scale?.[axis]??1)+((after.scale?.[axis]??1)-(before.scale?.[axis]??1))*t;
   const start=before.rotation?.[axis]??0,end=after.rotation?.[axis]??0;
   rotation[axis]=start+Math.atan2(Math.sin(end-start),Math.cos(end-start))*t;
  }
 }else if(before){
  const waste=asset.startsWith('waste.');
  const collecting=waste&&collection;
  const t=resolutionEase(resolutionRange(time,(collecting ? .20 : .12)+stagger,(collecting ? .48 : .46)+stagger));
  if(waste&&collection){
   for(let axis=0;axis<3;axis++)position[axis]+=(collection[axis]-position[axis])*t;
   position[1]+=Math.sin(t*Math.PI)*1.8;
  }else if(/prop\.car|prop\.bus|truck|excavator/.test(asset)){
   position[0]+=Math.sin(rotation[1])*t*2.2;position[2]+=Math.cos(rotation[1])*t*2.2;
  }else if('shape'in item&&item.shape==='smoke'){
   position[1]+=t*1.2;position[0]+=t*.5;
  }else position[1]-=t*.15;
  const shrink=1-resolutionEase(resolutionRange(t,waste ? .45 : .15,1));
  for(let axis=0;axis<3;axis++)scale[axis]*=shrink;
  visible=t<1;
 }else{
  const t=resolutionRange(time,.43+stagger,.79+stagger),ease=resolutionEase(t);
  visible=t>0;
  if(asset.startsWith('tree.')){
   scale[0]*=ease;scale[2]*=ease;scale[1]*=ease+Math.sin(t*Math.PI)*.08;
  }else if(/prop\.car|prop\.bus|truck/.test(asset)){
   position[0]-=Math.sin(rotation[1])*(1-ease)*2.2;position[2]-=Math.cos(rotation[1])*(1-ease)*2.2;
   for(let axis=0;axis<3;axis++)scale[axis]*=resolutionEase(resolutionRange(t,0,.16));
  }else{
   // Install foundations, paving and equipment in a staggered sequence.
   const thin=item.scale&&item.scale[1]<.15;
   position[1]+=(1-ease)*(thin ? .10 : .42);
   scale[1]*=ease;scale[0]*=.85+.15*ease;scale[2]*=.85+.15*ease;
  }
 }
 return {position,scale,rotation,visible};
}
