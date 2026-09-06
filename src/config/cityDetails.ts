import {Euler,Quaternion,Vector3} from 'three';
import type {Placement,Vec3} from '../game/types';
import type {LandscapeDetail,LandscapeShape} from './landscape';
import {landscapeClearance,landscapeAssets} from './landscape';
import {cityLots,forest,place,lotPaving} from './districts';
import {infrastructure,roadPlacements} from './infrastructure';
import {inSituationClearing} from './situationSites';
import {terrainHeight} from './terrain';

export interface CityDecoration {id:string;kind:string;tier:1|2;details:LandscapeDetail[];assets:Placement[];footprint?:{x:number;z:number;radius:number}}
export const cityDecorations:CityDecoration[]=[];
let current:CityDecoration={id:'',kind:'',tier:1,details:[],assets:[]};
function group(kind:string,tier:1|2){current={id:`${kind}-${cityDecorations.length}`,kind,tier,details:[],assets:[]};cityDecorations.push(current);}
function part(shape:LandscapeShape,position:Vec3,scale:Vec3,color:string,rotation?:Vec3){current.details.push({shape,position,scale,color,rotation});}
function beam(a:Vec3,b:Vec3,r:number,color:string){
 const va=new Vector3(...a),vb=new Vector3(...b),v=vb.clone().sub(va),e=new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),v.clone().normalize()));
 part('cylinder',va.add(vb).multiplyScalar(.5).toArray() as Vec3,[r,v.length(),r],color,[e.x,e.y,e.z]);
}
function person(x:number,z:number,seed:number,y=.095){
 const color=['#e77b54','#448cb7','#d5b550','#79a786','#eee0c4'][seed%5],skin=['#d3a279','#925f47','#bc825d'][seed%3];
 const size=seed%7===0?.72:1,first=current.details.length;
 part('leaf',[x,.75,z],[.1,.12,.095],skin);
 part('leaf',[x,.82,z-.018],[.105,.06,.09],seed%3?'#524336':'#b58b5a');
 part('box',[x,.5,z],[.19,.28,.15],color);
 for(const side of [-1,1]){
  beam([x+side*.06,.38,z],[x+side*.07,.075,z+side*.065],.032,'#405666');
  part('box',[x+side*.07,.05,z+.025+side*.065],[.075,.06,.13],'#54493e');
  beam([x+side*.12,.6,z],[x+side*.145,.38,z-side*.07],.027,color);
  part('leaf',[x+side*.145,.35,z-side*.07],[.03,.044,.03],skin);
 }
 if(seed%4===0)part('box',[x,.5,z-.12],[.15,.21,.095],'#987853');
 for(const p of current.details.slice(first)){p.position=[x+(p.position[0]-x)*size,p.position[1]*size+y,z+(p.position[2]-z)*size];p.scale=p.scale.map(v=>v*size) as Vec3;}
}
function planter(x:number,y:number,z:number,w=.6){
 part('box',[x,y+.13,z],[w,.26,.3],'#dfd6bf');part('box',[x,y+.266,z],[w-.07,.02,.24],'#6c5e43');
 for(let i=0;i<3;i++){
  part('leaf',[x+(i-1)*w*.29,y+.36,z],[w*.22,.15,.17],i%2?'#77a557':'#48854d');
  part('leaf',[x+(i-1)*w*.29,y+.49,z+.04],[.041,.035,.041],i%2?'#ebba58':'#d29cb4');
 }
}
function bicycle(x:number,z:number,seed:number){
 const rubber='#374b50',metal=['#ca644d','#3d95b3','#e3b752'][seed%3],y=.09;
 for(const side of [-1,1]){
  part('ring',[x+side*.39,y+.23,z],[.22,.22,.22],rubber);
  part('cylinder',[x+side*.39,y+.23,z],[.035,.055,.035],'#c5c9bb',[Math.PI/2,0,0]);
  for(let j=0;j<4;j++){
   const a=j*Math.PI/4;
   beam([x+side*.39-Math.cos(a)*.2,y+.23-Math.sin(a)*.2,z],[x+side*.39+Math.cos(a)*.2,y+.23+Math.sin(a)*.2,z],.008,'#d1d4c5');
  }
 }
 const back:Vec3=[x-.39,y+.23,z],crank:Vec3=[x,y+.21,z],seat:Vec3=[x-.13,y+.57,z],front:Vec3=[x+.39,y+.23,z],handle:Vec3=[x+.27,y+.62,z];
 for(const [a,b] of [[back,seat],[seat,crank],[crank,back],[seat,handle],[crank,handle],[handle,front]])beam(a,b,.02,metal);
 part('box',[x-.13,y+.63,z],[.21,.045,.1],rubber);beam([x+.27,y+.62,z-.14],[x+.27,y+.62,z+.14],.017,rubber);
 part('box',[x+.39,y+.46,z],[.19,.16,.2],'#d0b68a');
 for(const sx of [-1,1])beam([x+sx*.22,.1,z-.24],[x+sx*.22,.54,z-.24],.022,'#6d827b');
 beam([x-.22,.54,z-.24],[x+.22,.54,z-.24],.022,'#6d827b');
}
function safe(x:number,z:number,r:number){
 // Check the whole foundation: a level centre can still hide half a rack in a slope.
 const level=[[0,0],[-r,-r],[-r,r],[r,-r],[r,r]].every(([dx,dz])=>terrainHeight(x+dx,z+dz)<.025);
 return level&&!inSituationClearing(x,z)&&landscapeClearance.free(x,z,r)&&!landscapeClearance.occupied(x,z,r+.1)
  &&![...forest,...landscapeAssets].some(p=>Math.hypot(x-p.position[0],z-p.position[2])<r+.5)
  &&!cityDecorations.some(p=>p.footprint&&Math.hypot(x-p.footprint.x,z-p.footprint.z)<r+p.footprint.radius+.2);
}

// People stand on the existing sidewalk geometry. The two levels add complete
// groups, rather than leaving limbs or parts of a bicycle behind at lower quality.
for(const [i,p] of infrastructure.entries()){
 const [w,,d]=p.scale??[1,1,1];
 if(p.asset!=='ground.sidewalk'||Math.min(w,d)>1||Math.max(w,d)<5.2)continue;
 const alongX=w>d,length=Math.max(w,d);
 for(let j=0;j<Math.floor(length/4.4);j++){
  const offset=-length/2+2+j*4.4,x=p.position[0]+(alongX?offset:0),z=p.position[2]+(alongX?0:offset);
  if(x>40&&z<-31)continue;
  group('moradores',(i+j)%3===0?1:2);person(x,z,i+j);
 }
}

// Small furniture clusters occupy the outside of pavements, with a short paved
// connection. Their full footprints are checked against roads and building lots.
for(const [i,p] of infrastructure.entries()){
 const [w,,d]=p.scale??[1,1,1];
 if(p.asset!=='ground.sidewalk'||Math.min(w,d)>.8||Math.max(w,d)<7)continue;
 const alongX=w>d;
 for(const side of [-1,1])for(const offset of [-2.1,0,2.1]){
  const x=p.position[0]+(alongX?offset:side*1.06),z=p.position[2]+(alongX?side*1.06:offset);
  if(!safe(x,z,.67))continue;
  group(i%3?'bicicletário':'jardineira',i%2?1:2);current.footprint={x,z,radius:.67};
  part('box',[x,.045,z],[1.3,.09,.95],'#dcd3bd');
  part('box',[x-(alongX?0:side*.66),.045,z-(alongX?side*.66:0)],alongX?[.4,.09,.5]:[.5,.09,.4],'#dcd3bd');
  if(i%3)bicycle(x,z,i);
  else{
   planter(x+.27,.095,z,.58);
   part('cylinder',[x-.38,.36,z],[.14,.53,.14],'#548975');
   part('cylinder',[x-.38,.65,z],[.16,.065,.16],'#d2c6aa');
   part('box',[x-.38,.59,z+.14],[.16,.095,.015],'#304e49');
  }
 }
}

// Roof heights follow the Blender source's recessed slab, not the tallest vent.
const floorCount:Record<string,number>={'building.sage':5,'building.terracotta':5,'building.cream':4,'building.pink':4};
for(const [i,l] of cityLots.entries()){
 const b=l.building,floors=floorCount[b.asset];if(!floors&&b.asset!=='building.office')continue;
 const [x,,z]=b.position,[sx,sy,sz]=b.scale!,roof=b.asset==='building.office'?5.61:.4825+floors*.77,y=b.position[1]+roof*sy;
 group('jardim na cobertura',1);
 planter(x+.64*sx,y,z+.68*sz,.7*sx);
 group('painéis solares',2);
 for(const dx of [-.3,.27]){
  part('box',[x+dx*sx,y+.135,z+.11*sz],[.49*sx,.045,.48*sz],'#367c9d',[-.16,0,0]);
  for(const dz of [-.12,.12])part('box',[x+dx*sx,y+.165,z+.11*sz+dz*sz],[.49*sx,.008,.012],'#aed6da',[-.16,0,0]);
  part('box',[x+dx*sx,y+.17,z+.11*sz],[.014,.01,.48*sz],'#aed6da',[-.16,0,0]);
  for(const side of [-1,1])part('box',[x+(dx+side*.18)*sx,y+.063,z+.11*sz],[.028,.12,.38*sz],'#a9b5ad');
 }
 if(i%2===0){
  group('terraço superior',2);
  for(let j=0;j<6;j++)part('box',[x+.5*sx,y+.018,z+(.24+j*.08)*sz],[.81*sx,.03,.069*sz],'#bc9a71');
  part('box',[x+.53*sx,y+.2,z+.4*sz],[.47*sx,.07,.21*sz],'#d3b487');
  for(const side of [-1,1])part('box',[x+(.53+side*.16)*sx,y+.1,z+.4*sz],[.05,.18,.16*sz],'#6c8473');
 }
}

for(const [x,z] of [[-15,4],[-25,-19.4],[35,3.9]])for(let i=0;i<5;i++){
 group('carros estacionados',i%2?1:2);
 current.assets.push(place(['prop.car.white','prop.car.blue','prop.car.gold'][i%3],[x-1.65+i*.82,.06,z],[.67,.67,.67],[0,i%2?0:Math.PI,0]));
}
function forklift(x:number,z:number){
 part('box',[x,.31,z],[.68,.4,1.04],'#e0ad36');part('box',[x,.62,z+.28],[.58,.25,.35],'#f4c252');
 for(const side of [-1,1])for(const dz of [-.32,.32])part('cylinder',[x+side*.34,.19,z+dz],[.16,.12,.16],'#3b4e50',[0,0,Math.PI/2]);
 for(const side of [-1,1]){
  part('box',[x+side*.28,.86,z],[.045,1.05,.04],'#4e5c60');
  part('box',[x+side*.23,.9,z-.49],[.055,1.55,.065],'#5b6c70');
  part('box',[x+side*.2,.13,z-.84],[.075,.055,.76],'#798983');
 }
 part('box',[x,1.41,z],[.67,.055,.77],'#edb942');
 part('box',[x,.53,z+.07],[.33,.1,.31],'#425356');part('box',[x,.7,z+.19],[.33,.28,.08],'#425356');
 part('ring',[x,.81,z-.13],[.12,.12,.12],'#374c50',[.6,0,0]);
}
for(const [i,[x,z]] of [[9,-46],[19,-46.5],[30,-51]].entries()){
 if(cityLots.some(l=>Math.abs(x-l.building.position[0])<l.width/2+.75&&Math.abs(z-l.building.position[2])<l.depth/2+1.1))continue;
 group('equipamento portuário',i?2:1);forklift(x,z);
 group('paletes e carga',2);
 for(let j=0;j<4;j++){
  const px=x-.95,pz=z+j*.36;
  part('box',[px,.12,pz],[.64,.08,.32],'#b39265');
  for(const dx of [-.2,.2])part('box',[px+dx,.055,pz],[.065,.09,.32],'#97774d');
  part('box',[px,.37,pz],[.54,.44,.27],j%2?'#c99b63':'#8eab9a');
  part('box',[px,.6,pz],[.07,.015,.28],'#eee1b6');
 }
}

export function detailFootprintClear(x:number,z:number,r:number){return ![...roadPlacements,...lotPaving].some(p=>Math.abs(x-p.position[0])<p.scale![0]/2+r&&Math.abs(z-p.position[2])<p.scale![2]/2+r);}
