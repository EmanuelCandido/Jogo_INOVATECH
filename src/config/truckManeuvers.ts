import type {Point} from './spatial';
import {sampleLine,segmentDistance} from './spatial';

/** Four low-speed movements at a service T junction. Use actual lane
 * tangents at both ends; no instantaneous rotation at the junction centre. */
export function serviceTurns(road:Point[],driveway:Point[],roadWidth:number,preparedHandles?:Point[]){
 let along=0,join=0,best=Infinity;
 for(let i=1;i<road.length;i++){
  const a=road[i-1],b=road[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const gap=segmentDistance(driveway[0],a,b);
  if(gap<best){best=gap;join=along+Math.max(0,Math.min(length,((driveway[0][0]-a[0])*(b[0]-a[0])+(driveway[0][1]-a[1])*(b[1]-a[1]))/(length||1)));}
  along+=length;
 }
 const lane=(points:Point[],distance:number,direction:number,offset:number)=>{
  const s=sampleLine(points,distance),heading:Point=[s.tangent[0]*direction,s.tangent[1]*direction];
  return {point:[s.point[0]+heading[1]*offset,s.point[1]-heading[0]*offset] as Point,heading};
 };
 let turnIndex=0;
 return [1,-1].flatMap(direction=>[true,false].map(entering=>{
  const saved=preparedHandles?.[turnIndex++];
  const street=lane(road,join+(entering?-1:1)*direction*14,direction,roadWidth*.24);
  const access=lane(driveway,8,entering?1:-1,.7);
  const a=entering?street:access,b=entering?access:street;
  // Choose independent tangent lengths by measured curvature. The access
  // meets a curved road, so a symmetric quarter-circle approximation is not
  // sufficient for both left and right turns.
  let radius=-Infinity,c:Point=a.point,d:Point=b.point,handles:Point=[0,0];
  for(let ha=saved?.[0]??1;ha<=(saved?.[0]??12);ha+=.5)for(let hb=saved?.[1]??1;hb<=(saved?.[1]??12);hb+=.5){
   const ca:Point=[a.point[0]+a.heading[0]*ha,a.point[1]+a.heading[1]*ha],cb:Point=[b.point[0]-b.heading[0]*hb,b.point[1]-b.heading[1]*hb];
   let minimum=Infinity;
   for(let i=0;i<=120;i++){
    const t=i/120,s=1-t;
    const velocity=a.point.map((v,k)=>3*s*s*(ca[k]-v)+6*s*t*(cb[k]-ca[k])+3*t*t*(b.point[k]-cb[k]));
    const acceleration=a.point.map((v,k)=>6*s*(cb[k]-2*ca[k]+v)+6*t*(b.point[k]-2*cb[k]+ca[k]));
    const speed=Math.hypot(...velocity),cross=Math.abs(velocity[0]*acceleration[1]-velocity[1]*acceleration[0]);
    minimum=Math.min(minimum,speed<1e-6?0:speed**3/Math.max(cross,1e-12));
   }
   if(minimum>radius){radius=minimum;c=ca;d=cb;handles=[ha,hb];}
  }
  if(radius<3.05)throw new Error(`Conversão de serviço sem raio suficiente: ${direction}/${entering}: ${radius}`);
  const samples=Array.from({length:121},(_,i)=>{
   const t=i/120,s=1-t;
   const point=a.point.map((v,k)=>s*s*s*v+3*s*s*t*c[k]+3*s*t*t*d[k]+t*t*t*b.point[k]) as Point;
   const tangent=a.point.map((v,k)=>3*s*s*(c[k]-v)+6*s*t*(d[k]-c[k])+3*t*t*(b.point[k]-d[k])) as Point;
   const length=Math.hypot(...tangent);
   return {point,heading:tangent.map(v=>v/length) as Point};
  });
  return {direction,entering,radius,handles,samples};
 }));
}

/** A rigid delivery truck backs from the service lane into a north-facing
 * loading apron. The quarter-circle has a 3 m centreline radius; front/rear
 * overhang is checked separately with the exported vehicle envelope. */
export function loadingManeuver(loading:Point,axis:Point){
 const radius=3,centre:Point=[loading[0]-radius,axis[1]+.9+radius];
 const samples=Array.from({length:25},(_,i)=>{
  const angle=-Math.PI/2+i*Math.PI/48;
  return {point:[centre[0]+Math.cos(angle)*radius,centre[1]+Math.sin(angle)*radius] as Point,
   // The vehicle faces opposite the direction of its reverse movement.
   heading:[Math.sin(angle),-Math.cos(angle)] as Point};
 });
 const end:Point=[loading[0],loading[1]-1.9],start=samples.at(-1)!.point;
 if(end[1]<start[1])throw new Error('Pátio sem profundidade para manobra da doca');
 const steps=Math.max(1,Math.ceil((end[1]-start[1])/.25));
 for(let i=1;i<=steps;i++)samples.push({point:[end[0],start[1]+(end[1]-start[1])*i/steps],heading:[0,-1]});
 return {radius,samples,entry:samples[0].point,docked:end};
}

