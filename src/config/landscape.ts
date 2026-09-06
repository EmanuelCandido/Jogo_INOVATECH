import {CatmullRomCurve3,Vector3} from 'three';
import type {Placement,Vec3} from '../game/types';
import {cityLots,forest,place,plantingSpace,lotPaving,privateGardens} from './districts';
import {infrastructure,roadPlacements} from './infrastructure';
import {planting as parkTrees,paths as parkPaths} from './park';
import {terrainHeight} from './terrain';
import {inPublicSpace} from './publicSpaces';

export type LandscapeShape='box'|'leaf'|'cylinder'|'canopy'|'ring'|'smoke'|'patch';
export interface LandscapeDetail {shape:LandscapeShape;position:Vec3;scale:Vec3;color:string;rotation?:Vec3;cluster?:number;category?:'undergrowth'|'flower'}
export interface GardenBed {x:number;z:number;rx:number;rz:number;seed:number;color:string;points:[number,number][]}
export interface GardenSite {name:string;x:number;z:number;radius:number}
export const landscapeDetails:LandscapeDetail[]=[];
export const landscapeAssets:Placement[]=[];
export const gardenBeds:GardenBed[]=[];
export const gardenSites:GardenSite[]=[];
export const gardenWalks:Placement[]=[];
const rand=(n:number)=>{const f=Math.sin(n*127.1+311.7)*43758.5453;return f-Math.floor(f);};
const inBox=(x:number,z:number,p:Placement,r:number)=>Math.abs(x-p.position[0])<p.scale![0]/2+r&&Math.abs(z-p.position[2])<p.scale![2]/2+r;
const pathSamples=parkPaths.flatMap(points=>new CatmullRomCurve3(points.map(([x,z])=>new Vector3(x,0,z)),false,'catmullrom',.2).getPoints(90));
const parkObstacles=[[5.5,2.8,5.7,4.7],[13.5,4.7,5.9,5],[3.6,10.8,4.5,3.7],[17.5,6.5,1.8,3.3],[13.35,-7.45,5,3.3],[5.5,-.2,3.1,1.2],[4,-5.3,3.7,1.7],[13,-6,4.3,1.7],[13,-1.2,3.3,1.4],[12,10.9,4.3,1.2]];
const parkFree=(x:number,z:number,r:number)=>x-r>1.55&&x+r<18.45&&z-r>-9.25&&z+r<12.4
 && !parkObstacles.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+r&&Math.abs(z-cz)<d/2+r)
 && !infrastructure.some(p=>p.asset==='ground.sidewalk'&&inBox(x,z,p,r))
 && !pathSamples.some(p=>Math.hypot(x-p.x,z-p.z)<.34+r);
function free(x:number,z:number,r:number){return !inPublicSpace(x,z,r)&&(plantingSpace(x,z,r)||parkFree(x,z,r))&&!gardenWalks.some(p=>inBox(x,z,p,r));}
function occupied(x:number,z:number,r:number){return gardenSites.some(s=>Math.hypot(x-s.x,z-s.z)<r+s.radius);}
const vegetation=[...forest,...parkTrees.filter(p=>p.asset.startsWith('tree.'))];
function detail(shape:LandscapeShape,position:Vec3,scale:Vec3,color:string,rotation?:Vec3){landscapeDetails.push({shape,position,scale,color,rotation});}
function slab(x:number,z:number,w:number,d:number,color='#d6c7a5',y=.035){detail('box',[x,y,z],[w,.05,d],color);}

// Uneven silhouettes and a soft green edge tie each planted island to the lawn.
function bed(x:number,z:number,rx:number,rz:number,seed:number,color='#658f43'){
 const points:[number,number][]=Array.from({length:24},(_,i)=>{
  const a=i/24*Math.PI*2,f=.88+.08*Math.sin(a*3+seed)+.04*Math.cos(a*5-seed);
  return [x+Math.cos(a)*rx*f,z+Math.sin(a)*rz*f];
 });
 if(!free(x,z,.03)||points.some(([px,pz])=>!free(px,pz,.04)))return false;
 gardenBeds.push({x,z,rx,rz,seed,color,points});return true;
}
function shrub(x:number,z:number,size:number,seed:number,flowers=false){
 if(!free(x,z,size*.55)||occupied(x,z,size*.55))return;
 const cluster=Math.round((x+100)*197+(z+100)*97),first=landscapeDetails.length;
 const y=terrainHeight(x,z),green=['#4d8f4b','#73a74f','#397d49','#8cb34e'][Math.floor(rand(seed)*4)];
 // Several overlapping lobes make low plants read as shrubs, not miniature trees.
 for(let i=0;i<3;i++){
  const a=i*2.4+seed,r=size*.22;
  detail('leaf',[x+Math.cos(a)*r,y+.11+size*.22,z+Math.sin(a)*r],[size*.42,size*(.32+rand(seed+i)*.16),size*.4],green,[0,a,0]);
 }
 for(const p of landscapeDetails.slice(first)){p.cluster=cluster;p.category='undergrowth';}
 const flowerStart=landscapeDetails.length;
 if(flowers)for(let i=0;i<5;i++){
  const a=i*2.4+seed,r=Math.sqrt(rand(seed+i+9))*size*.42;
  detail('leaf',[x+Math.cos(a)*r,y+.15+size*.5,z+Math.sin(a)*r],[.062,.04,.062],seed%3<1?'#e3bd5e':seed%3<2?'#c0a1d2':'#f0dec1');
 }
 for(const p of landscapeDetails.slice(flowerStart)){p.cluster=cluster;p.category='flower';}
}
function tree(x:number,z:number,seed:number,size=.68){
 if(!free(x,z,size*.9)||occupied(x,z,size*.8)||vegetation.some(p=>Math.hypot(x-p.position[0],z-p.position[2])<size*1.25))return;
 const p=place(seed%4===0?'tree.birch':seed%3===0?'tree.maple':'tree.oak',[x,terrainHeight(x,z),z],[size,size*(.96+rand(seed)*.24),size],[0,seed*1.73,0]);
 vegetation.push(p);landscapeAssets.push(p);
}
function picnic(x:number,z:number,seed:number){
 const wood=seed%2?'#c39262':'#a77b53',iron='#4e6760';
 for(let i=0;i<5;i++)detail('box',[x,.55,z+(i-2)*.105],[1.15,.055,.094],wood);
 for(const side of [-1,1]){
  for(const dx of [-.4,.4])detail('box',[x+dx,.265,z+side*.14],[.065,.57,.07],iron,[side*.22,0,0]);
  for(const offset of [-.057,.057])detail('box',[x,.31,z+side*.48+offset],[1.25,.055,.1],wood);
  for(const dx of [-.43,.43])detail('box',[x+dx,.14,z+side*.48],[.06,.3,.06],iron);
 }
 detail('box',[x,.18,z],[1.05,.06,1.08],iron);
}
function parasol(x:number,z:number,seed:number){
 detail('cylinder',[x,.035,z],[.12,.07,.12],'#a6a99c');
 detail('cylinder',[x,.65,z],[.025,1.28,.025],'#e2d6b9');
 detail('canopy',[x,1.35,z],[.65,.23,.65],seed%2?'#ee8661':'#f0cc67',[0,seed,0]);
 detail('leaf',[x,1.49,z],[.035,.045,.035],'#eae1c9');
}
function vegetableBed(x:number,z:number,seed:number){
 const w=1.28,d=.66;
 detail('box',[x,.11,z],[w,.19,d],'#9e805a');
 detail('box',[x,.212,z],[w-.12,.025,d-.12],'#715944');
 for(const sx of [-1,1])detail('box',[x+sx*(w/2-.025),.2,z],[.065,.12,d+.03],'#bf9d6d');
 for(const sz of [-1,1])detail('box',[x,.2,z+sz*(d/2-.025)],[w,.12,.065],'#bf9d6d');
 for(let row=0;row<2;row++)for(let col=0;col<5;col++){
  const px=x-.46+col*.23,pz=z-.14+row*.28;
  detail('leaf',[px,.29,pz],[.09,.095,.09],row?'#83ac51':'#4f914a');
  if((col+seed)%3===0)detail('leaf',[px+.035,.34,pz],[.035,.035,.035],'#d77b54');
 }
}
function furnitureSite(name:string,x:number,z:number,kind:'picnic'|'vegetables'|'terrace',seed:number,size=1){
 const r=(kind==='vegetables'?.88:.95)*size;
 if(!free(x,z,r)||occupied(x,z,r+.25)||vegetation.some(p=>Math.hypot(x-p.position[0],z-p.position[2])<.65+r*.6))return false;
 gardenSites.push({name,x,z,radius:r});
 const first=landscapeDetails.length;
 if(kind==='vegetables'){
  slab(x,z,1.7,1.6,'#b6a47b');vegetableBed(x,z-.4,seed);vegetableBed(x,z+.4,seed+1);
 }else{
  slab(x,z,1.85,1.75,kind==='terrace'?'#d8c8a8':'#cabc99');picnic(x,z,seed);
  if(kind==='terrace')parasol(x+.15,z,seed);
 }
 for(const p of landscapeDetails.slice(first)){
  p.position=[x+(p.position[0]-x)*size,p.position[1]*size,z+(p.position[2]-z)*size];
  p.scale=p.scale.map(v=>v*size) as Vec3;
 }
 return true;
}

// Back gardens are designed before the planting pass so tables and plots stay usable.
for(const {x,z,houseZ,seed:i} of privateGardens){
 if(furnitureSite(`quintal ${i}`,x,z,i%3===0?'vegetables':i%3===1?'picnic':'terrace',i,.72)){
  const side=Math.sign(houseZ-z);
  slab(x,z+side*.83,.43,.36,'#d6c7a5');
 }
}
for(const [i,l] of cityLots.entries()){
 const [x,,z]=l.building.position,back=-Math.sign(l.streetZ-z);
 if(!l.building.asset.startsWith('building.house'))continue;
 // Low, staggered side beds preserve the existing front path down the middle.
 const front=z-back*(l.depth/2+.55);
 for(const side of [-1,1]){
  const px=x+side*.91;
  if(bed(px,front,.53,.74,i+side,'#779d4b')){
   shrub(px,front,.48,i+side,true);shrub(px+.13,front+.32,.27,i+4,true);
  }
 }
}

// Neighbourhood gardens occupy the previously empty northern blocks and courtyard.
const commons=[{name:'pomar da escola',x:-14,z:-36.7,w:8.3,d:6.3,front:-32},
 {name:'jardim da estação',x:-5,z:-36.7,w:7,d:6.3,front:-32},
 {name:'pátio do centro',x:25,z:-27,w:6.7,d:6.5,front:-22}];
for(const [i,c] of commons.entries()){
 // Paths meet the actual street pavement; gates and planting flank the approach.
 const end=c.front-1.24;
 const path=place('ground.sidewalk',[c.x,.052,(c.z+end)/2],[.72,.055,end-c.z]);
 if(![...roadPlacements,...lotPaving].some(p=>Math.abs(path.position[0]-p.position[0])<(path.scale![0]+p.scale![0])/2-.01&&Math.abs(path.position[2]-p.position[2])<(path.scale![2]+p.scale![2])/2-.01))gardenWalks.push(path);
 for(const side of [-1,1]){
  furnitureSite(`${c.name}: descanso`,c.x+side*1.65,c.z+.9,'picnic',i+side+10);
  if(i<2)furnitureSite(`${c.name}: horta`,c.x+side*1.7,c.z-1.35,'vegetables',i+side+12);
  for(let j=0;j<4;j++){
   const tx=c.x+side*(c.w/2-.8)+Math.sin(j*3+i)*.18,tz=c.z-c.d/2+.65+j*1.5;
   tree(tx,tz,31+i*9+j+side,.72+(j%2)*.13);
  }
 }
}

// Small café terraces turn leftover frontage into furnished, connected spaces.
for(const [i,x] of [25,35].entries())for(const side of [-1,1]){
 const tx=x+side*1.22,z=11.75;
 if(furnitureSite(`esplanada ${x}`,tx,z,'terrace',i+1,.72))gardenWalks.push(place('ground.sidewalk',[(tx+x)/2,.07,z],[Math.abs(tx-x)+.2,.035,.52]));
}

for(const [i,x] of [-8.15,-5.45].entries()){
 if(furnitureSite('jardim da prefeitura',x,-.93,'picnic',i,.65))gardenWalks.push(place('ground.sidewalk',[(x-6.8)/2,.057,-.93],[Math.abs(x+6.8)+.15,.035,.44]));
}

// Give furnished gardens planted edges too: one small shade tree, a low flowering
// border, and an open side facing the house instead of a ring of identical trees.
for(const [i,s] of gardenSites.entries()){
 if(!s.name.startsWith('quintal'))continue;
 const side=i%2?1:-1,tx=s.x+side*1.24,tz=s.z+.08;
 tree(tx,tz,i+140,.53+(i%3)*.045);
 for(const dx of [-1.04,1.04]){
  bed(s.x+dx,s.z,.43,.78,i+dx,'#759b46');
  shrub(s.x+dx,s.z+.23,.39,i+3,true);
  shrub(s.x+dx,s.z-.28,.29,i+7,true);
 }
}

// A sequence of irregular low beds, rather than an evenly spaced grid of objects.
for(const [i,p] of vegetation.entries()){
 const [x,,z]=p.position;
 if(x<-38||x>58||z<-41||z>37||p.asset==='tree.thicket')continue;
 const size=p.scale?.[0]??.7,rx=.9+size*.55,rz=.7+rand(i)*.65;
 if(!bed(x,z,rx,rz,i))continue;
 for(let j=0;j<5;j++){
  const a=j*2.399+i,r=.46+rand(i*8+j)*.35;
  shrub(x+Math.cos(a)*rx*r,z+Math.sin(a)*rz*r,.32+rand(i+j)*.23,i+j,(i+j)%3===0);
 }
}

// Fill smaller residual parcels with mixed vegetation, with a different rhythm per block.
for(let z=-39;z<36;z+=1.45)for(let x=-28;x<55;x+=1.5){
 const seed=Math.round((x+30)*73+(z+42)*179),px=x+(rand(seed)-.5)*.8,pz=z+(rand(seed+1)-.5)*.8;
 if(!free(px,pz,.52)||occupied(px,pz,1.05)||gardenWalks.some(p=>inBox(px,pz,p,.65)))continue;
 if(gardenBeds.some(b=>Math.hypot((px-b.x)/b.rx,(pz-b.z)/b.rz)<1.3))continue;
 // Adjacent lawn remains visible; not every residual square gets the same feature.
 if(rand(seed+6)>.57)continue;
 const rx=.65+rand(seed+2)*.6,rz=.55+rand(seed+3)*.55;
 if(!bed(px,pz,rx,rz,seed,'#749d4d'))continue;
 if(rand(seed+7)>.45)tree(px+.12,pz-.12,seed,.54+rand(seed+4)*.28);
 for(let j=0;j<4;j++){
  const a=seed+j*2.4;
  shrub(px+Math.cos(a)*rx*.45,pz+Math.sin(a)*rz*.4,.3+rand(seed+j)*.21,seed+j,j===0);
 }
}

// Thin planting ribbons soften warehouse setbacks without blocking loading bays.
for(const x of [1.1,7.9,11.1,17.9,21.6,28.4])for(const z of [-35.4,-39.8]){
 bed(x,z,.36,.62,x+z);shrub(x,z,.44,x+z);
}

// Explicit clearance is shared by furniture, planting and the regression checks.
export const landscapeClearance={free,occupied};
