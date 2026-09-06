import type {Placement,Vec3} from '../game/types';
import type {LandscapeDetail,LandscapeShape} from './landscape';
export type VisualKey='initial'|'temporary'|'solved';
export interface SituationVisual {assets:Placement[];details:LandscapeDetail[]}
export const situationVisuals:Record<string,Record<VisualKey,SituationVisual>>={};
const ids=['pollution_01','pollution_02','security_01','security_02','nature_01','nature_02','health_01','health_02','accessibility_02','accessibility_01'];
function build(id:string,state:VisualKey):SituationVisual{
 const assets:Placement[]=[],details:LandscapeDetail[]=[],full=state==='solved',partial=state==='temporary';
 const p=(asset:string,position:Vec3,scale:Vec3=[1,1,1],rotation?:Vec3)=>assets.push({asset,position,scale,rotation});
 const d=(shape:LandscapeShape,position:Vec3,scale:Vec3,color:string,rotation?:Vec3)=>details.push({shape,position,scale,color,rotation});
 const box=(position:Vec3,scale:Vec3,color:string)=>d('box',position,scale,color);
 const tree=(x:number,z:number,size=.7)=>p('tree.oak',[x,.03,z],[size,size,size]);
 const sign=(x:number,z:number,color:string)=>{p('prop.information',[x,.02,z]);box([x,.58,z+.038],[.10,.09,.025],color);};
 const smoke=(x:number,y:number,z:number,count:number)=>{for(let i=0;i<count;i++)d('smoke',[x+i*.18,y+i*.25,z],[.22+i*.065,.2+i*.06,.21+i*.06],'#77776e');};
 const animal=(x:number,z:number)=>{
  p('prop.rabbit',[x,.035,z],[1,1,1],[0,x*.3,0]);
 };
 const cone=(x:number,z:number)=>{box([x,.08,z],[.3,.06,.3],'#526369');d('canopy',[x,.32,z],[.13,.48,.13],'#df8950');d('cylinder',[x,.30,z],[.079,.08,.079],'#f7f1df');};
 const railing=(x:number,z:number,length:number)=>{for(const dx of [-length/2,length/2])d('cylinder',[x+dx,.47,z],[.025,.8,.025],'#607b79');box([x,.85,z],[length,.055,.055],'#607b79');};
 if(id==='pollution_01'){
  p(full?'waste.bin':partial?'waste.partial':'waste.pile',[0,.1,0],[.85,.85,.85]);
  if(full){p('waste.bin',[0,.1,1],[.7,.7,.7]);sign(-.8,-.5,'#4f9874');}else{animal(.55,-.65);if(partial)sign(-.6,.5,'#d9ab58');}
 }
 if(id==='pollution_02'){
  // This horizontal road already exists. Its background traffic is filtered by City.
  for(let i=0;i<(full?2:7);i++)p(i%2?'prop.car.gold':'prop.car.coral',[-7+i*2,.05,-.43],[.86,.86,.86],[0,Math.PI/2,0]);
  for(let i=0;i<(full?3:1);i++)p('prop.bus',[-6+i*5,.05,.43],[.86,.86,.86],[0,-Math.PI/2,0]);
  if(!full)for(let i=0;i<3;i++)smoke(-7+i*4,.4,-.6,2);
  p('prop.shelter',[2,.075,1.57],[1,1,1],[0,Math.PI,0]);
  sign(3.7,1.35,partial?'#d6b960':'#548aba');
 }
 if(id==='security_01'){
  p('prop.wildlife',[-2.3,.02,0]);
  animal(full?-2.1:-.45,full?1:.1);animal(full?-2.8:.35,full?1.7:-1);
  if(full){railing(-2.1,2.2,2.2);sign(-3.6,1.8,'#5b9c70');p('prop.truck',[-.1,.05,-2.3],[.7,.7,.7]);}
  else {cone(-.7,1.5);sign(-1.25,-1.8,'#d9a34c');if(partial)box([-.5,.14,.9],[.45,.14,.35],'#a88c54');}
 }
 if(id==='security_02'){
  // A roadside assistance point, next to the existing shops.
  box([0,.07,0],[2.7,.1,.65],'#ded6c0');
  p('prop.lamp',[-1,.1,0],[.8,.8,.8]);
  if(full){p('prop.assistance',[.6,.10,0]);p('prop.car.blue',[-.8,.06,1.05],[.86,.86,.86],[0,Math.PI/2,0]);box([-.8,.97,1.05],[.42,.13,.2],'#56b5dc');}
  else if(partial){d('cylinder',[.7,1.1,0],[.035,2.1,.035],'#748a8a');box([.65,2.05,.13],[.32,.17,.17],'#e8e7d7');}
  else {box([.6,.14,0],[.45,.2,.36],'#8a9085');cone(1.1,-.1);}
 }
 if(id==='nature_01'){
  d('patch',[-.3,.006,-.3],[2.9,1,2.5],full?'#80b670':'#bea37a');
  if(full){for(const [x,z] of [[-2,-1],[-1,1.5],[1.3,-1.5],[2,1.3],[.2,.2]])tree(x,z,.7);animal(-.7,.1);animal(1,1);railing(0,2.5,5.8);sign(-2.5,2,'#5a976c');}
  else{for(const [x,z]of [[-2,-1],[1,1],[.5,-1.4]])p('prop.stump',[x,.02,z]);animal(-1.5,.7);if(partial){animal(.8,.3);animal(2,-.5);}
   for(const[x,z]of[[-1,-1.5],[.5,.4]]){d('cylinder',[x,.10,z],[.10,.72,.10],'#886847',[0,0,Math.PI/2]);d('leaf',[x+.33,.16,z],[.16,.075,.10],'#b59664');}
   sign(1.5,-1.7,'#c8bda4');}
 }
 if(id==='nature_02'){
  box([0,.012,-1],[5.7,.03,4.7],full?'#abc787':'#c8b59a');
  for(const x of [-1.7,0,1.7])p('prop.heatpump',[x,.02,-2.1]);
  if(partial){
   // A timer and one inactive unit communicate the reduced operating hours.
   box([0,.43,-1.82],[.47,.46,.015],'#75878c');
   box([0,.86,-2.1],[.08,.24,.08],'#62787b');
   d('cylinder',[0,1.0,-2.1],[.16,.04,.16],'#f2ead8',[Math.PI/2,0,0]);
   box([0,1.045,-2.067],[.018,.10,.015],'#4b656b');box([.05,1.0,-2.067],[.10,.018,.015],'#4b656b');
  }
  if(full){for(const[x,z]of[[-2,.2],[0,.5],[2,.2]])tree(x,z,.86);for(const x of [-1,1]){box([x,.65,-1.1],[1.1,.07,.75],'#337a9d');box([x,.32,-1.1],[.07,.65,.07],'#688789');}}
  else {p('prop.thermometer',[1.9,.04,-.5]);
   for(const x of [-1.8,.1]){box([x,.15,-.5],[.63,.29,.44],'#c8aa7b');d('patch',[x,.305,-.5],[.26,1,.17],'#816944');
    d('cylinder',[x,.53,-.5],[.02,.43,.02],'#9d8750');for(const side of [-1,1])d('leaf',[x+side*.1,.56,-.5],[.13,.06,.055],'#b9a363',[0,0,side*.5]);}
   sign(2.3,.6,'#cc9958');}
 }
 if(id==='health_01'){
  // The water patch follows the actual river in SituationLayers, not a new channel.
  for(let i=0;i<(full?0:partial?2:5);i++)p('waste.partial',[-2+i,-.59,0],[.35,.35,.35]);
  p('prop.outfall',[1,-.02,1.75],[1,1,1],[0,Math.PI,0]);
  if(full){p('prop.treatment',[1,.02,2.2]);sign(-.4,2,'#558d87');}
  else {box([1,-.37,.76],[.27,.045,.73],'#778566');d('patch',[1,-.607,.41],[.34,1,.42],'#79865e');}
 }
 if(id==='health_02'){
  // Top of the existing factory stacks. No duplicate building or light source.
  for(const x of [-1.3,1.3])smoke(x,4.5,-.65,full?1:5);
  if(full){box([0,.14,4.45],[3,.2,.4],'#5b9690');sign(-2.3,3.8,'#64947a');}
  if(partial||full)for(const x of [-3.4,3.4])tree(x,3.7,.6);
  if(!full){box([2.1,.08,3.9],[1,.12,.65],'#8e7660');smoke(2.1,.35,3.9,3);}
 }
 if(id==='accessibility_02'){
  // Continuous L-shaped tactile route on the hospital sidewalk and entrance path.
  if(full){for(let x=-3.4;x<=.05;x+=.23)box([x,.12,-.35],[.22,.035,.25],'#e5b74c');for(let z=-.35;z>=-2.9;z-=.23)box([0,.18,z],[.3,.045,.22],'#e5b74c');}
  else if(partial){railing(-1.8,-.05,1.8);railing(.5,-1.6,.7);}
  else{cone(-.8,-.35);box([-2.2,.35,-.38],[.43,.6,.4],'#8a9c91');}
  // A cane and a small person make the orientation problem visible.
  d('leaf',[-3.1,.9,-.25],[.12,.14,.12],'#bd906c');box([-3.1,.59,-.25],[.22,.35,.18],'#8165a2');
  for(const x of [-3.17,-3.03])box([x,.25,-.25],[.065,.35,.08],'#526b79');d('cylinder',[-2.86,.39,-.13],[.012,.65,.012],'#f0ecd8',[0,0,.2]);
 }
 if(id==='accessibility_01'){
  // The civic hall's podium is about .3 high; the path joins the existing entrance.
  box([0,.11,-.22],[2.1,.14,2.2],'#e0d7c3');
  p(full?'access.ramp':partial?'access.temporary':'access.step',[0,full||partial?.16:.26,full||partial?-.75:-1.1],[.7,full||partial?.42:.65,1]);
  // On the approach path, clear of the existing bench beside the entrance.
  p('prop.wheelchair',[0,.10,1.15],[1,1,1],[0,Math.PI,0]);
 }
 return {assets,details};
}
for(const id of ids)situationVisuals[id]={initial:build(id,'initial'),temporary:build(id,'temporary'),solved:build(id,'solved')};
