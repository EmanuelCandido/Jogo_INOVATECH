import {flightZoom} from './problemFraming';
import {situationAnchors,worldPoint} from '../config/referenceMap';
import type {Vec3} from './types';

/** Impactus' arrival. Before the first line of a new story he streaks over
 * Eco City, swoops past the camera and lands on the central station square; the camera pans there, swings around him and returns to the
 * map's usual angle for the story. Times are seconds of the cinematic clock,
 * which advances only with drawn frames (like the solution animations), so a
 * slow phone shows every moment instead of skipping the landing. */
export type ArrivalBeat='approach'|'flyby'|'dive'|'landed';
export interface Arrival{sequence:number;clock:{value:number};beat:ArrivalBeat}
/** The square in front of the central station, a few steps out from its
 * entrance (where the first accessibility situation waits). */
const station=situationAnchors.accessibility_01,[entranceX,,entranceZ]=worldPoint(...station.point),stationYaw=station.yaw??0;
export const arrivalSite:Vec3=[entranceX+Math.sin(stationYaw)*4.5,.05,entranceZ+Math.cos(stationYaw)*4.5];
export const arrivalTimes={appear:.4,flyby:1.75,dive:2.75,landed:3.7,end:6.3} as const;
export function arrivalBeatAt(t:number):ArrivalBeat{
 return t>=arrivalTimes.landed?'landed':t>=arrivalTimes.dive?'dive':t>=arrivalTimes.flyby?'flyby':'approach';
}

const clamp01=(v:number)=>Math.min(1,Math.max(0,v));
/** Smootherstep between two times: zero speed and acceleration at both ends. */
export function ease(from:number,to:number,t:number){const x=clamp01((t-from)/(to-from));return x*x*x*(x*(6*x-15)+10);}
const mix=(a:number,b:number,k:number)=>a+(b-a)*k;

/** Zoom at the landing, relative to the zoom that shows the whole valley. */
export const landingZoom=2.8;
const peakYaw=16*Math.PI/180;
export interface ArrivalCameraStart{target:Vec3;offset:Vec3;zoom:number}
export interface ArrivalCameraPose{target:Vec3;position:Vec3;zoom:number}
/** Camera at time t, from the shot that was on screen when the player pressed
 * JOGAR. The eye keeps its distance and height; only the target, the zoom and
 * a small turn around the vertical axis change, and the turn is back to zero
 * at the end, so the story starts at the map's usual angle. */
export function arrivalCamera(t:number,start:ArrivalCameraStart,baseZoom:number):ArrivalCameraPose{
 const {landed,end}=arrivalTimes;
 const pan=ease(.25,3.55,t);
 const target:Vec3=[mix(start.target[0],arrivalSite[0],pan),mix(start.target[1],arrivalSite[1],pan),mix(start.target[2],arrivalSite[2],pan)];
 let zoom=flightZoom(start.zoom,Math.max(start.zoom,baseZoom*landingZoom),ease(.5,landed,t));
 zoom*=1+.1*ease(landed,end,t);
 // The landing shakes the view for a moment, a few pixels at most.
 const shake=t>landed&&t<landed+.45?(1-(t-landed)/.45)**2*6/zoom:0;
 target[0]+=shake*Math.sin(t*71);target[2]+=shake*Math.cos(t*53);
 const yaw=peakYaw*(ease(.4,2.6,t)-ease(2.6,end-.2,t));
 const [x,y,z]=start.offset,c=Math.cos(yaw),s=Math.sin(yaw);
 return {target,position:[target[0]+x*c+z*s,target[1]+y,target[2]-x*s+z*c],zoom};
}

/** Screen pose of Impactus: x,y are his feet in CSS pixels, scale is relative
 * to his landed size, angle leans him into the flight (radians, clockwise),
 * facing is 1 when he faces left and -1 when he faces right like the dialogue
 * portrait, glow turns him into a distant star. */
export interface ArrivalHeroPose{x:number;y:number;scale:number;angle:number;facing:number;glow:number;visible:boolean}
type Key={t:number;x:number;y:number;s:number;face:number};
/** Flight in fractions of the viewport: a star at the top right that grows,
 * a close pass on the left, a climb with a turn and a dive to the landing. */
const flight:Key[]=[
 {t:arrivalTimes.appear,x:1.06,y:.07,s:.1,face:1},
 {t:1.3,x:.82,y:.17,s:.22,face:1},
 {t:arrivalTimes.flyby,x:.6,y:.27,s:.5,face:1},
 {t:2.3,x:.22,y:.44,s:1.3,face:1},
 {t:arrivalTimes.dive,x:.12,y:.36,s:.92,face:-1},
 {t:3.15,x:.26,y:.3,s:.8,face:-1},
];
/** Cubic Hermite through the keys with time-scaled Catmull-Rom tangents. */
function sample(keys:Key[],t:number,field:'x'|'y'|'s'){
 const i=Math.max(0,Math.min(keys.length-2,keys.findLastIndex(k=>k.t<=t)));
 const a=keys[i],b=keys[i+1],h=b.t-a.t,u=clamp01((t-a.t)/h);
 const tangent=(j:number)=>{const p=keys[Math.max(0,j-1)],n=keys[Math.min(keys.length-1,j+1)];return (n[field]-p[field])/(n.t-p.t);};
 const m0=tangent(i)*h,m1=tangent(i+1)*h,u2=u*u,u3=u2*u;
 return (2*u3-3*u2+1)*a[field]+(u3-2*u2+u)*m0+(-2*u3+3*u2)*b[field]+(u3-u2)*m1;
}
export function arrivalHero(t:number,width:number,height:number,site:[number,number]):ArrivalHeroPose{
 const {appear,landed}=arrivalTimes;
 if(t>=landed)return {x:site[0],y:site[1],scale:1,angle:0,facing:-1,glow:0,visible:true};
 // The last key is the landing site's current projection, which settles at
 // the centre as the camera finishes its pan.
 const keys=[...flight,{t:landed,x:site[0]/width,y:site[1]/height,s:1,face:-1}];
 const at=(time:number)=>[sample(keys,time,'x')*width,sample(keys,time,'y')*height] as const;
 const [x,y]=at(t),[px,py]=at(t-1/60);
 const vx=(x-px)*60,vy=(y-py)*60,speed=Math.hypot(vx,vy),unit=Math.min(width,height);
 const scale=Math.max(.05,sample(keys,t,'s'));
 // Turn quickly in the middle of the segment where the facing changes.
 const i=Math.max(0,keys.findLastIndex(k=>k.t<=t)),a=keys[i],b=keys[Math.min(keys.length-1,i+1)];
 const facing=a.face===b.face?a.face:mix(a.face,b.face,ease(.35,.65,(t-a.t)/(b.t-a.t)));
 const lean=speed?vx/speed*Math.min(1,speed/(.9*unit)):0;
 return {x,y,scale,angle:lean*.55,facing,glow:1-ease(.12,.4,scale),visible:t>=appear};
}

/** Landing effects on the ground, in world units around the site. */
export function arrivalShadow(t:number){
 const k=ease(arrivalTimes.dive+.2,arrivalTimes.landed,t);
 return {opacity:.32*k,radius:.35+.65*k};
}
export function arrivalShockwave(t:number,delay=0){
 const age=(t-arrivalTimes.landed-delay)/.8;
 if(age<=0||age>=1)return null;
 return {radius:1+9*(1-(1-age)**3),opacity:.85*(1-age)**1.5};
}
