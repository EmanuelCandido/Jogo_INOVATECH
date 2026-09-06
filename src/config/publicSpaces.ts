import type {Placement,Vec3} from '../game/types';

const slab=(position:Vec3,scale:Vec3):Placement=>({asset:'ground.sidewalk',position,scale});
export interface SeatSite {id:string;x:number;z:number;target:[number,number];scale:number}
// The Blender bench faces local -X. Each seat has a real destination and a paved
// recess, instead of receiving an arbitrary rotation in a decoration loop.
export const seatSites:SeatSite[]=[
 {id:'orla',x:53.8,z:-5.2,target:[55.2,-5.2],scale:.86},
 {id:'parque-oeste',x:2.03,z:4.8,target:[1.24,4.8],scale:.86},
 {id:'parque-sul',x:14.4,z:11.95,target:[14.4,12.76],scale:.86},
 {id:'parque-leste',x:18.15,z:8.6,target:[17.6,8.6],scale:.82},
 {id:'jardim-sul',x:8.6,z:17,target:[8,17],scale:.82},
 {id:'caminho-norte',x:4.4,z:-4.35,target:[4.4,-3.6],scale:.82},
 {id:'sombra-norte',x:7.05,z:-3.48,target:[7.05,-4.4],scale:.82},
 {id:'canteiro-central',x:11.85,z:-4.55,target:[11.85,-3.8],scale:.82},
 {id:'lago-sul',x:14.4,z:8.85,target:[14.4,9.8],scale:.82},
];
export function benchFacing(site:SeatSite):Placement{
 const [tx,tz]=site.target;
 return {asset:'prop.bench',position:[site.x,.09,site.z],scale:[site.scale,site.scale,site.scale],rotation:[0,Math.atan2(tz-site.z,site.x-tx),0]};
}
export const seating=seatSites.map(benchFacing);
export const seatingPaving:Placement[]=seatSites.flatMap(s=>{
 const [tx,tz]=s.target,dx=tx-s.x,dz=tz-s.z,alongX=Math.abs(dx)>Math.abs(dz);
 return [slab([s.x,.045,s.z],alongX?[.72,.09,1.5]:[1.5,.09,.72]),
  slab([(s.x+tx)/2,.042,(s.z+tz)/2],alongX?[Math.abs(dx)+.12,.084,.57]:[.57,.084,Math.abs(dz)+.12])];
});
export const sportsAccess:Placement[]=[
 // Football gate opens onto a forecourt. The west connector joins the campus sidewalk.
 slab([-15,.045,-19.65],[1.35,.09,.9]),
 slab([-16.78,.045,-19.45],[4.05,.09,.62]),
 // Basketball gates are centred on their south sides and have continuous walkways.
 slab([-15,.045,-13.53],[.88,.09,2.67]),
 slab([45,.045,-13.82],[1.0,.09,3.24]),
];
export const pierAccess:Placement[]=[
 slab([53.70,.045,-3],[2.76,.09,1.06]),
 {asset:'prop.pier',position:[60,0,-3],scale:[1,1,1]},
];
export const publicSpaceReservations=[
 ...seatSites.map(s=>({x:s.x,z:s.z,w:1.65,d:1.65})),
 ...[...sportsAccess,...pierAccess.filter(p=>p.scale)].map(p=>({x:p.position[0],z:p.position[2],w:p.scale![0],d:p.scale![2]})),
];
export function inPublicSpace(x:number,z:number,r=0){return publicSpaceReservations.some(p=>Math.abs(x-p.x)<p.w/2+r&&Math.abs(z-p.z)<p.d/2+r);}
export function pierShoreOpening(x:number,z:number){return x>51&&x<59&&Math.abs(z+3)<1.2;}
