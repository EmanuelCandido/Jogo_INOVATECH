import {segmentDistance,type Point} from './spatial';

export const reservoirWaterHeight=6.33;
// The two ends meet the straight dam. Only the natural shore is rounded;
// quadratic fillets keep the inlet's outline and its tangents continuous.
const corners:Point[]=[[-42,84],[-42,94],[-48,99],[-44,109],[-33,111],[-24,105],[-26,98],[-30,92],[-30,84]];
export const reservoirShore:Point[]=[corners[0]];
for(let i=1;i<corners.length-1;i++){
 const a=corners[i-1],b=corners[i],c=corners[i+1],before=Math.hypot(a[0]-b[0],a[1]-b[1]),after=Math.hypot(c[0]-b[0],c[1]-b[1]),radius=Math.min(3.4,before*.4,after*.4);
 const start:Point=[b[0]+(a[0]-b[0])*radius/before,b[1]+(a[1]-b[1])*radius/before];
 const end:Point=[b[0]+(c[0]-b[0])*radius/after,b[1]+(c[1]-b[1])*radius/after];
 reservoirShore.push(start);
 for(let j=1;j<=12;j++){const t=j/12,s=1-t;reservoirShore.push([s*s*start[0]+2*s*t*b[0]+t*t*end[0],s*s*start[1]+2*s*t*b[1]+t*t*end[1]]);}
}
reservoirShore.push(corners.at(-1)!);
export const reservoirOutline=reservoirShore;

/** Blend the lake bank down to the actual waterline. The dam abutments retain
 * their prepared elevation; the natural rim has no open vertical gap. */
export function reservoirBankHeight(u:number,v:number,ground:number){
 if(u< -53||u> -19||v<84||v>116)return ground;
 let distance=Infinity;const point:Point=[u,v];
 for(let i=1;i<reservoirShore.length;i++)distance=Math.min(distance,segmentDistance(point,reservoirShore[i-1],reservoirShore[i]));
 if(distance>=3.5)return ground;
 const t=Math.min(1,distance/3.5),bank=t*t*(3-2*t),dam=Math.min(1,Math.max(0,(v-84)/2)),blend=(1-bank)*dam*dam*(3-2*dam);
 return ground+(reservoirWaterHeight-ground)*blend;
}
