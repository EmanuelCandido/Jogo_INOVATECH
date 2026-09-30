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
/** What a change represents decides when and how it moves: problems leave
 * first, then the ground is prepared, equipment is installed, vegetation
 * grows and the information sign closes the sequence. */
export type ChangeRole='actor'|'waste'|'smoke'|'depart'|'clear'|'ground'|'build'|'tree'|'sign'|'arrive';
export interface VisualChange<T extends Item>{before?:T;after?:T;index:number;count:number;role?:ChangeRole;order?:number}
const vehicleAsset=/prop\.car|prop\.bus|truck|excavator/;
export function changeRole(change:VisualChange<Item>):ChangeRole {
 const {before,after}=change,item=after??before!,asset='asset'in item?item.asset:'',shape='shape'in item?item.shape:'';
 if(before&&after)return 'actor';
 if(before){
  if(asset.startsWith('waste.'))return 'waste';
  if(shape==='smoke')return 'smoke';
  return vehicleAsset.test(asset)?'depart':'clear';
 }
 const scale=item.scale??[1,1,1];
 if(asset.startsWith('tree.'))return 'tree';
 if(vehicleAsset.test(asset))return 'arrive';
 if(asset==='prop.information'||(shape==='box'&&Math.max(...scale)<.12&&item.position[1]>.4))return 'sign';
 if(shape==='patch'||(shape==='box'&&scale[1]<.15&&item.position[1]<.3))return 'ground';
 return 'build';
}
// [start, end, stagger spread] as fractions of the resolution clock.
const windows:Record<ChangeRole,readonly [number,number,number]>={
 smoke:[.06,.42,.12],clear:[.10,.38,.12],waste:[.12,.40,.14],depart:[.12,.50,.14],actor:[.22,.66,.12],
 ground:[.30,.56,.18],build:[.44,.72,.16],arrive:[.40,.74,.12],tree:[.56,.80,.12],sign:[.80,.90,.06],
};
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
 changes.forEach((change,index)=>{change.index=index;change.count=changes.length;change.role=changeRole(change);});
 // Authored order inside a role: tactile tiles are laid along the path,
 // railing posts before their rail, trees one after another.
 for(const role of Object.keys(windows)){
  const group=changes.filter(change=>change.role===role);
  group.forEach((change,i)=>{change.order=group.length>1?i/(group.length-1):0;});
 }
 return {stable,changes};
}
export function changeWindow(change:VisualChange<Item>,collection?:Vec3):[number,number] {
 const role=change.role??changeRole(change);
 const [start,end,spread]=role==='waste'&&collection?[.20,.48,.18]:windows[role];
 const stagger=(change.order??0)*spread;
 return [start+stagger,end+stagger];
}
const backOut=(t:number,overshoot=1.70158)=>1+(overshoot+1)*(t-1)**3+overshoot*(t-1)**2;
const easeOut=(t:number)=>1-(1-t)**3;
// Where a removed object leaves and a new one settles, used by the dust and sparkle bursts.
export function changeMoment(change:VisualChange<Item>,collection?:Vec3) {
 const role=change.role??changeRole(change),[start,end]=changeWindow(change,collection);
 const at=role==='build'?.62:role==='tree'?.45:role==='sign'?.3:role==='ground'?.8:.55;
 return {role,time:start+(end-start)*at};
}

/** All transforms are absolute, with exact endpoints; never mutate shared
 * source placements/materials or accumulate scale across repeated frames. */
export function sampleVisualChange(change:VisualChange<Item>,time:number,collection?:Vec3) {
 const {before,after}=change,item=after??before!;
 const position:[number,number,number]=[...item.position];
 const scale:[number,number,number]=[...(item.scale??[1,1,1])];
 const rotation:[number,number,number]=[...(item.rotation??[0,0,0])];
 const asset='asset'in item?item.asset:'';
 const role=change.role??changeRole(change),[start,end]=changeWindow(change,collection);
 const t=resolutionRange(time,start,end),ease=resolutionEase(t);
 if(before&&after){
  for(let axis=0;axis<3;axis++)position[axis]=before.position[axis]+(after.position[axis]-before.position[axis])*ease;
  // Small hops for animals, a gentle roll for the wheelchair and vehicles.
  if(asset==='prop.rabbit')position[1]+=Math.abs(Math.sin(t*Math.PI*5))*.12*(1-t*.4);
  for(let axis=0;axis<3;axis++){
   scale[axis]=(before.scale?.[axis]??1)+((after.scale?.[axis]??1)-(before.scale?.[axis]??1))*ease;
   const from=before.rotation?.[axis]??0,to=after.rotation?.[axis]??0;
   rotation[axis]=from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*ease;
  }
  return {position,scale,rotation,visible:true};
 }
 if(before){
  if(t>=1)return {position,scale,rotation,visible:false};
  let shrink=1-resolutionEase(resolutionRange(t,.45,1));
  if(role==='waste'&&collection){
   for(let axis=0;axis<3;axis++)position[axis]+=(collection[axis]-position[axis])*ease;
   position[1]+=Math.sin(ease*Math.PI)*1.8;rotation[1]+=ease*3;
  }else if(role==='waste'){
   // Lifted out of the water with a small bob before being taken away.
   position[1]+=easeOut(t)*.45+Math.sin(t*Math.PI*3)*.04;rotation[1]+=t*2.4;
  }else if(role==='depart'){
   const drive=t*t*4;
   position[0]+=Math.sin(rotation[1])*drive;position[2]+=Math.cos(rotation[1])*drive;
   shrink=1-resolutionEase(resolutionRange(t,.7,1));
  }else if(role==='smoke'){
   position[1]+=easeOut(t)*1.4;position[0]+=t*.6;
   shrink=(1+.5*t)*(1-resolutionEase(resolutionRange(t,.55,1)));
  }else{
   // Obstacles shake loose, then sink away.
   rotation[2]+=Math.sin(t*Math.PI*7)*.16*(1-resolutionRange(t,0,.45));
   position[1]-=resolutionEase(resolutionRange(t,.35,1))*.25;
   shrink=1-resolutionEase(resolutionRange(t,.3,1));
  }
  for(let axis=0;axis<3;axis++)scale[axis]*=shrink;
  return {position,scale,rotation,visible:true};
 }
 if(t<=0)return {position,scale,rotation,visible:false};
 if(t>=1)return {position,scale,rotation,visible:true};
 if(role==='tree'){
  const grow=backOut(t,1.2);
  scale[0]*=grow;scale[2]*=grow;scale[1]*=grow*(1+Math.sin(t*Math.PI)*.1);
  rotation[2]+=Math.sin(t*Math.PI*3)*.09*(1-t);
 }else if(role==='arrive'){
  const back=(1-easeOut(t))*4;
  position[0]-=Math.sin(rotation[1])*back;position[2]-=Math.cos(rotation[1])*back;
  for(let axis=0;axis<3;axis++)scale[axis]*=resolutionEase(resolutionRange(t,0,.16));
 }else if(role==='sign'){
  const pop=backOut(t,2.2);for(let axis=0;axis<3;axis++)scale[axis]*=pop;
 }else if(role==='ground'){
  // Paving and planted soil spread from their centre and settle flush.
  const spread=backOut(t,1.1);
  scale[0]*=spread;scale[2]*=spread;scale[1]*=resolutionEase(resolutionRange(t,0,.5));
  position[1]-=(1-ease)*.04;
 }else{
  // Equipment is lowered into place and settles with a short squash.
  const landing=.62,u=Math.min(1,t/landing);
  position[1]+=(1-u*u)*1.1;
  const grow=.55+.45*resolutionEase(u);
  const v=resolutionRange(t,landing,1),squash=Math.sin(v*Math.PI*2)*(1-v)*.14;
  scale[0]*=grow*(1+squash*.5);scale[2]*=grow*(1+squash*.5);scale[1]*=grow*(1-squash);
 }
 return {position,scale,rotation,visible:true};
}
