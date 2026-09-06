import type {Placement,Vec3} from '../game/types';
import {box,streets,roadPlacements,walkOffset,infrastructure} from './infrastructure';
import {onLand,woodlandRegion,terrainHeight,riverCenter} from './terrain';
import {railCurve,railSamples} from './railway';
import {seating,inPublicSpace} from './publicSpaces';
export const place=(asset:string,position:Vec3,scale:Vec3=[1,1,1],rotation:Vec3=[0,0,0]):Placement=>({asset,position,scale,rotation});
export interface CityLot {building:Placement;width:number;depth:number;streetZ:number}
export const cityLots:CityLot[]=[];
function lot(asset:string,x:number,z:number,streetZ:number,scale:number,width:number,depth:number,height=1){
 cityLots.push({building:place(asset,[x,.09,z],[scale,scale*height,scale],[0,streetZ>z?0:Math.PI,0]),width,depth,streetZ});
}
// Reference anchors: school upper-left, hospital below it, civic hall between them and downtown.
lot('building.school',-25,-14.5,-11,1.18,7.7,4.8);
cityLots.at(-1)!.building.scale=[1.58,.93,1.18];
lot('building.hospital',-15,8.5,14,1.2,7.7,7.3);
cityLots.at(-1)!.building.scale=[1.48,1.2,1.2];
lot('building.civic',-6.8,-5,2,1.1,4.4,5.4);
// A diagonal band of varied midrises leads from the station to the coast.
const colours=['building.sage','building.cream','building.terracotta','building.pink'];
for(const [i,[x,z,front]] of [[-6.8,-26,-22],[-3.4,-26,-22],[3.1,-26,-22],[6.8,-26,-22],[13,-26,-22],[-4.3,-16,-11],[3.1,-15.8,-11],[6.8,-15.8,-11],[13.1,-15.8,-11],[16.8,-15.8,-11],[23.2,-16,-11],[26.7,-16,-11],[23.2,-2.8,2],[26.7,-2.8,2],[33.2,-26,-22],[36.7,-26,-22],[33.2,-15.8,-11],[36.7,-15.8,-11],[43.3,-26,-22],[46.7,-26,-22]].entries()){
 lot(colours[(i*3+Math.floor(i/4))%4],x,z,front,1.18,3.34,5.1,1.03+(i%4)*.09);
 cityLots.at(-1)!.building.scale![2]=1.08;
}
lot('building.office',17,-26,-22,1.03,3.1,4.7,1.25);
lot('building.pink',33.2,-2.8,2,1.18,3.34,5.1,1.08);
lot('building.sage',36.7,-2.8,2,1.18,3.34,5.1,1.24);
lot('building.cafe',25,8.6,14,.99,4.1,4.6);
lot('building.cafe',35,8.6,14,.93,4,4.5);
lot('building.fuel',44,-3.5,2,1.04,5.9,5.3);
// The industrial zone occupies the far bank of the urban skyline, beside the cranes.
lot('building.factory',4,-48,-42,1.06,6.1,5.9,.94);
lot('building.factory',14,-48,-42,.94,5.5,5.8,.88);
lot('building.factory',25,-47,-42,.92,5.3,5.5,.82);
for(const x of [4.5,14.5,25])lot('building.warehouse',x,-37,-32,.92,7,5,.9);
lot('building.greenhouse',-5,22.6,26,.86,4,3.6);
// Houses follow the left edge and sweep across the foreground, as in the reference.
const homes:[number,number,number][]=[];
for(const x of [-36.5,-33.3])homes.push([x,-5,-11]);
for(const x of [-26.7,-23.3])for(const z of [-5,7.5])homes.push([x,z,z<0?-11:2]);
for(const x of [-16.7,-13.3])homes.push([x,-4.7,2]);
for(const x of [-16.7,-13.3,-6.7,-3.3])homes.push([x,18.1,14]);
for(const x of [-6.7,-3.3])homes.push([x,8.1,14]);
for(const x of [3.2,6.8,13.2,16.8])homes.push([x,21.8,26]);
for(const x of [13.2,16.8,23.2,26.8])homes.push([x,18.1,14]);
for(const x of [23.2,26.8])homes.push([x,22.4,26]);
for(const x of [3.2,6.8,13.2,16.8,23.2,26.8])for(const z of [29.5,34.5])homes.push([x,z,z<32?26:38]);
for(const x of [33.3,36.7])for(const z of [18.1,22.4])if(x<36||z<20)homes.push([x,z,z<20?14:26]);
homes.push([53.3,-25.8,-22],[52.6,-16.5,-11]);
for(const [i,[x,z,front]] of homes.entries())lot(i%3?'building.house.cream':'building.house.coral',x,z,front,.92,2.85,3.1);
export const districtBuildings=cityLots.map(l=>l.building);
export const lotPaving:Placement[]=cityLots.flatMap(({building:b,width,depth,streetZ})=>{
 const [x,,z]=b.position,sidewalk=streetZ-Math.sign(streetZ-z)*walkOffset;
 return [box('ground.sidewalk',[x,.035,z],[width,.1,depth]),box('ground.sidewalk',[x,.15,(z+sidewalk)/2],[.68,.035,Math.abs(z-sidewalk)+.05])];
});
export const districtProps:Placement[]=[
 place('prop.court',[-15,-.01,-16.3],[1.15,1.15,1.15]),
 place('prop.court',[45,0,-17.2],[1.4,1.4,1.4]),
 place('prop.playground',[3.6,.08,10.8],[.95,.95,.95],[0,Math.PI,0]),
 place('prop.playground',[4.1,.08,18.8],[1,1,1]),
 place('prop.crane',[23,.09,-54],[1.2,1.2,1.2]),
 place('prop.crane',[32,.09,-48],[1.15,1.15,1.15]),
 place('prop.ship',[20,-.6,-59],[1.45,1.2,1.45],[0,Math.PI/2,0]),
 place('prop.lighthouse',[59,.14,-16.5],[1.15,1.15,1.15]),
 ...[[3,-33.8],[15,-33.8],[24,-33.8],[4,-44.1],[14,-44.1],[31,-40]].map(([x,z],i)=>place('prop.truck',[x,.09,z],[.8,.8,.8],[0,i%2?Math.PI/2:0,0])),
 ...[8.5,11.5,14.5].map(distance=>{const t=distance/railCurve.getLength(),p=railCurve.getPointAt(t),v=railCurve.getTangentAt(t);return place('prop.train',[p.x,.17,p.z],[.8,.8,.8],[0,Math.atan2(v.x,v.z),0]);}),
 ...[[4,-52],[14,-52],[18,-52],[28,-44],[31,-44],[34,-44]].map(([x,z],i)=>place(i%2?'prop.container.red':'prop.container.blue',[x,.1,z],[.82,.82,.82],[0,Math.PI/2,0])),
 ...[[14,-52],[18,-52],[31,-44]].map(([x,z])=>place('prop.container.blue',[x,.99,z],[.82,.82,.82],[0,Math.PI/2,0])),
 ...[[4,-54],[8,-54],[12,-54],[16,-54],[18,-45],[20,-45],[32,-46.5]].map(([x,z],i)=>place(i%2?'prop.container.red':'prop.container.blue',[x,.1,z],[.7,.7,.7],[0,Math.PI/2,0])),
];
for(const [j,s] of streets.entries()){
 if(s.to-s.from<7)continue;
 for(let p=s.from+3,i=0;p<s.to-2;p+=3.7,i++){
  const [x,z]=s.axis==='x'?[p,s.at+(i%2?.43:-.43)]:[s.at+(i%2?.43:-.43),p];
  if(streets.some(t=>t.axis!==s.axis&&Math.abs(t.at-p)<2.3&&s.at>=t.from&&s.at<=t.to))continue;
  districtProps.push(place(i%8===3?'prop.bus':['prop.car.blue','prop.car.white','prop.car.coral','prop.car.gold'][(i+j)%4],[x,.045,z],[.86,.86,.86],[0,s.axis==='x'?(i%2?Math.PI/2:-Math.PI/2):(i%2?0:Math.PI),0]));
 }
 for(let p=s.from+3;p<s.to-1;p+=5.8){
  const [x,z]=s.axis==='x'?[p,s.at+walkOffset]:[s.at+walkOffset,p];
  if(roadPlacements.some(r=>Math.abs(x-r.position[0])<r.scale![0]/2+.05&&Math.abs(z-r.position[2])<r.scale![2]/2+.05))continue;
  districtProps.push(place('prop.lamp',[x,.09,z],[.8,.8,.8]));
 }
}
districtProps.push(...seating);
export const forest:Placement[]=[];
// Reserve compact back gardens before the forest pass; a canopy must not occupy a table.
export const privateGardens=cityLots.flatMap((l,i)=>{
 if(!l.building.asset.startsWith('building.house'))return [];
 const [x,,z]=l.building.position,back=-Math.sign(l.streetZ-z);
 return [{x,z:z+back*(l.depth/2+.99),houseZ:z,seed:i}];
});
const furnitureReservations=[...privateGardens,...[25,35].flatMap(x=>[-1,1].map(side=>({x:x+side*1.22,z:11.75})))];
// Sports surfaces, public parking, the mission garden and residential pools.
const clearings=[[10,1.8,17.2,21.2],[-15,-23,7.5,5.9],[-15,-16.3,5.4,4.2],[45,-17.2,6.5,5.4],[3.6,10.8,4,3.4],[4.1,18.8,4.2,3.4],[-15,4,5.2,1.6],[-25,-19.4,5.2,1.6],[35,3.9,5.2,1.6],[-24.9,11,1.5,1.8],[23.2,32.1,1.5,1.8],[5.5,2.8,5.4,4.4],[13.5,4.7,5.5,4.5],[17.5,6.5,1.4,3]];
export function plantingSpace(x:number,z:number,r:number){
 return !inPublicSpace(x,z,r)&&onLand(x-r,z-r)&&onLand(x+r,z+r)&&Math.abs(z-riverCenter(x))>r+1.4
  &&!roadPlacements.some(p=>Math.abs(x-p.position[0])<p.scale![0]/2+r&&Math.abs(z-p.position[2])<p.scale![2]/2+r)
  &&!cityLots.some(l=>Math.abs(x-l.building.position[0])<l.width/2+r&&Math.abs(z-l.building.position[2])<l.depth/2+r)
  &&!clearings.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+r&&Math.abs(z-cz)<d/2+r)
  &&!infrastructure.some(p=>p.asset==='ground.sidewalk'&&Math.abs(x-p.position[0])<p.scale![0]/2+r&&Math.abs(z-p.position[2])<p.scale![2]/2+r)
  &&!lotPaving.some(p=>Math.abs(x-p.position[0])<p.scale![0]/2+r&&Math.abs(z-p.position[2])<p.scale![2]/2+r)
  &&!railSamples.some(p=>Math.hypot(x-p.x,z-p.z)<r+1.1);
}
function forestSpace(x:number,z:number,r:number){return plantingSpace(x,z,r)&&!furnitureReservations.some(p=>Math.hypot(x-p.x,z-p.z)<r+.72);}
// Infill vegetation breaks up empty setbacks, using compact crowns instead of oversized trees.
for(let iz=0;iz<26;iz++)for(let ix=0;ix<34;ix++){
 const x=-28+ix*2.5+Math.sin(iz+ix)*.25,z=-29+iz*2.5+Math.cos(ix)*.2;
 if(!forestSpace(x,z,.72)||forest.some(p=>Math.hypot(x-p.position[0],z-p.position[2])<1.7))continue;
 if(x>51&&z<-9)continue; // Keep the lighthouse approach open.
 forest.push(place((ix+iz)%3?'tree.oak':'tree.maple',[x,.02,z],[.61,.65,.61],[0,ix,0]));
 if((ix+iz)%2)forest.push(place('tree.thicket',[x+.4,.02,z+.3],[.32,.28,.32]));
}
const woodland=['tree.oak','tree.maple','tree.oak','tree.fir','tree.birch'];
for(let iz=0;iz<90;iz++)for(let ix=0;ix<73;ix++){
 const x=-86+ix*1.9+(iz%2)*.8+Math.sin(iz*5+ix)*.21,z=-88+iz*1.9+Math.cos(ix*7)*.21;
 if(!woodlandRegion(x,z)||!onLand(x,z)||Math.abs(z-riverCenter(x))<2.6)continue;
 if(!forestSpace(x,z,1.2))continue;
 const size=.92+(ix+iz)%4*.075;
 forest.push(place(woodland[(ix*3+iz)%5],[x,terrainHeight(x,z),z],[size,size*(.9+(iz%3)*.1),size],[0,(ix+iz)*2.4,0]));
}
// Small mixed groves occupy the back gardens without blocking their street entrances.
for(const [x,z] of [[-36.5,-23.4],[-34.6,-24.8],[-33,-27],[-37,-26.5],[-35.2,-28.1]]){
 if(!forestSpace(x,z,.62))continue;
 forest.push(place('tree.oak',[x,terrainHeight(x,z),z],[.8,.82,.8],[0,x,0]));
}
for(const [i,l] of cityLots.entries()){
 if(l.building.asset==='building.factory')continue;
 const [x,,z]=l.building.position,back=-Math.sign(l.streetZ-z);
 for(const dx of [-1.1,1.1]){
  const tx=x+dx,tz=z+back*(l.depth/2+1.05);
  if(!forestSpace(tx,tz,.7))continue;
  forest.push(place(i%3?'tree.oak':'tree.maple',[tx,.02,tz],[.64,.66+(i%3)*.08,.64],[0,i+dx,0]));
  forest.push(place('tree.thicket',[tx+.47,.02,tz+.4],[.34,.3,.34],[0,i,0]));
 }
}
// Mature street trees sit in the gaps between buildings, not on the carriageway.
for(const [i,l] of cityLots.entries()){
 const [x,,z]=l.building.position,side=Math.sign(l.streetZ-z);
 const tx=x-l.width/2+.18,tz=z+side*(l.depth/2+.35);
 if(!forestSpace(tx,tz,.2))continue;
 forest.push(place(i%4?'tree.default':'tree.birch',[tx,.07,tz],[.57,.64,.57]));
}
for(const [i,[x,z]] of [[2.1,4.2],[2,10.5],[4.3,4],[15,3.9],[18,4],[18,11.4],[12.3,11.6],[7.7,11.5],[2,16.5],[1.7,23],[7.6,22.5],[7.9,16.4],[-18,5],[-12,4],[-18,11],[-12,11],[-28,-18],[-21.8,-18],[-18.2,-28],[-11.8,-28],[53,-25],[56,-24],[53,-14.5],[61,-4],[62,-10],[60,5],[57,8],[53,15],[48,16],[42,18]].entries()){
 if(!forestSpace(x,z,.3))continue;
 forest.push(place(i%3?'tree.oak':'tree.birch',[x,.03,z],[.72,.76,.72],[0,i,0]));
 forest.push(place('tree.thicket',[x+.6,.03,z+.6],[.35,.31,.35]));
}
export const regionLabels=[
 {name:'CENTRO',position:[13,6,-16] as Vec3},{name:'SAÚDE',position:[-15,5,8.5] as Vec3},
 {name:'ESCOLA',position:[-25,4,-14.5] as Vec3},{name:'PARQUE DO ENCONTRO',position:[11,.5,10] as Vec3},
 {name:'PORTO',position:[16,5,-48] as Vec3},
];




