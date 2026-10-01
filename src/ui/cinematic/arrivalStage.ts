import {arrivalPoseIds,arrivalTimes,type ArrivalHeroPose,type ArrivalPoseId} from '../../game/arrival';
import {heroChest,heroFeet} from './arrivalPoses';

/** DOM side of the arrival. The 3D timeline (ArrivalScene) paints once per
 * drawn frame, right after it moves the camera, so Impactus stays glued to the
 * city. His transform is written directly: no React render per frame. */
export const arrivalStage={hero:null as HTMLElement|null,turn:null as HTMLElement|null,pose:null as HTMLElement|null,trail:null as HTMLCanvasElement|null,size:0,
 layers:{} as Partial<Record<ArrivalPoseId,HTMLElement>>,
 /** The drawings are decoded; the timeline waits for them a little. */
 ready:false};
type TrailPoint={x:number;y:number;width:number;t:number};
type Spark={x:number;y:number;vx:number;vy:number;t:number;size:number;color:string};
const trail:TrailPoint[]=[],sparks:Spark[]=[];
const trailLife=.42,sparkLife=.65,sparkColors=['#ffe187','#d9c2ff','#ffffff','#b98cff'];
let lastSpark=0;
export function resetArrivalStage(){trail.length=0;sparks.length=0;lastSpark=0;}

/** Box transform that puts his feet at x,y (with the element's
 * transform-origin at its top left corner). The scale pivots at the feet, so
 * he lands exactly on the spot; the angle turns him around his chest, which
 * the facing mirrors. */
export function heroTransform(x:number,y:number,scale:number,angle:number,size:number,facing=1){
 const cx=(.5+(heroChest.x-.5)*facing)*size,cy=heroChest.y*size,fx=heroFeet.x*size,fy=heroFeet.y*size,px=(v:number)=>v.toFixed(2)+'px';
 return `translate3d(${px(x)},${px(y)},0) scale(${scale.toFixed(4)}) translate(${px(cx-fx)},${px(cy-fy)}) rotate(${angle.toFixed(4)}rad) translate(${px(-cx)},${px(-cy)})`;
}
/** His chest on the screen, where the trail flies from. */
export function heroChestAt(pose:ArrivalHeroPose,size:number){
 return {x:pose.x+((heroChest.x-.5)*pose.facing+.5-heroFeet.x)*size*pose.scale,y:pose.y+(heroChest.y-heroFeet.y)*size*pose.scale};
}

export function paintArrival(t:number,pose:ArrivalHeroPose){
 const {hero,turn,size,layers}=arrivalStage;
 if(!hero||!turn||!size)return;
 hero.style.transform=heroTransform(pose.x,pose.y,pose.scale,pose.angle,size,pose.facing);
 hero.style.opacity=pose.visible?'1':'0';
 turn.style.transform=`scaleX(${pose.facing.toFixed(3)})`;
 for(const id of arrivalPoseIds){const layer=layers[id];if(layer)layer.style.opacity=pose.poses[id].toFixed(3);}
 if(arrivalStage.pose)arrivalStage.pose.style.transform=`translateY(${(-pose.lift*100).toFixed(2)}%) scale(${(1-(pose.stretch-1)*.6).toFixed(4)},${pose.stretch.toFixed(4)})`;
 drawTrail(t,pose,size);
}

/** A comet tail behind him, a few sparks and, while he is far, a star glint. */
function drawTrail(t:number,pose:ArrivalHeroPose,size:number){
 const canvas=arrivalStage.trail,context=canvas?.getContext('2d');
 if(!canvas||!context)return;
 const ratio=Math.min(window.devicePixelRatio||1,1.5),width=canvas.clientWidth,height=canvas.clientHeight;
 if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
 context.setTransform(ratio,0,0,ratio,0,0);
 context.clearRect(0,0,width,height);
 const flying=pose.visible&&t<arrivalTimes.landed;
 // His chest, where the cape flies from.
 const {x:cx,y:cy}=heroChestAt(pose,size);
 if(flying&&(!trail.length||t>trail.at(-1)!.t)){
  trail.push({x:cx,y:cy,width:Math.max(3,size*pose.scale*.2),t});
  if(t-lastSpark>.045){
   lastSpark=t;
   const angle=t*37%(Math.PI*2);
   sparks.push({x:cx,y:cy,vx:Math.cos(angle)*40,vy:Math.sin(angle)*30-20,t,size:2+pose.scale*3,color:sparkColors[Math.floor(t*29)%sparkColors.length]});
  }
 }
 while(trail.length&&t-trail[0].t>trailLife)trail.shift();
 while(sparks.length&&t-sparks[0].t>sparkLife)sparks.shift();
 context.globalCompositeOperation='lighter';
 context.lineCap='round';
 for(const [color,share] of [['167,112,255',1],['255,236,180',.38]] as const){
  for(let i=1;i<trail.length;i++){
   const a=trail[i-1],b=trail[i],k=1-(t-b.t)/trailLife;
   context.strokeStyle=`rgba(${color},${(share===1?.5:.8)*k})`;
   context.lineWidth=b.width*share*k;
   context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.stroke();
  }
 }
 for(const s of sparks){
  const age=(t-s.t)/sparkLife,x=s.x+s.vx*age,y=s.y+s.vy*age+50*age*age,r=s.size*(1-age);
  context.fillStyle=s.color;context.globalAlpha=1-age;
  context.beginPath();context.moveTo(x,y-r*2);context.lineTo(x+r*.5,y);context.lineTo(x,y+r*2);context.lineTo(x-r*.5,y);context.closePath();context.fill();
  context.beginPath();context.moveTo(x-r*2,y);context.lineTo(x,y+r*.5);context.lineTo(x+r*2,y);context.lineTo(x,y-r*.5);context.closePath();context.fill();
 }
 context.globalAlpha=1;
 if(pose.visible&&pose.glow>0){
  // Far away he is a twinkling star; the glint fades as he grows.
  const radius=26*pose.glow*(1+.18*Math.sin(t*19)),glow=context.createRadialGradient(cx,cy,0,cx,cy,radius);
  glow.addColorStop(0,`rgba(255,255,255,${pose.glow})`);glow.addColorStop(.35,`rgba(214,190,255,${.7*pose.glow})`);glow.addColorStop(1,'rgba(150,90,255,0)');
  context.fillStyle=glow;context.beginPath();context.arc(cx,cy,radius,0,Math.PI*2);context.fill();
  context.strokeStyle=`rgba(255,255,255,${.8*pose.glow})`;context.lineWidth=1.5;
  const flare=radius*1.9;
  context.beginPath();context.moveTo(cx-flare,cy);context.lineTo(cx+flare,cy);context.moveTo(cx,cy-flare*.7);context.lineTo(cx,cy+flare*.7);context.stroke();
 }
 context.globalCompositeOperation='source-over';
}
