import {publicAsset} from '../../assets/publicAsset';
import type {ArrivalPoseId} from '../../game/arrival';

/** Where his feet and his chest sit in the 768 px portrait box, as fractions
 * of its size. The dialogue poses stand with their feet at heroFeet. */
export const heroFeet={x:.5,y:.93},heroChest={x:.478,y:.474};

/** The arrival drawings share the 1254 px square of the dialogue poses but
 * not their framing. Each one is scaled so the helmet keeps its size and
 * placed so the body does not jump when one drawing hands over to the next:
 * the flying ones by the chest, the ones that touch the ground by the feet
 * (the fall lands on its boots). anchor is that point in the drawing,
 * as fractions of its square. */
interface PoseArt{src:string;scale:number;anchor:[number,number];on:'chest'|'feet'}
const art=(file:string)=>publicAsset('/assets/portraits/robot/arrival/'+file+'.webp');
export const arrivalPoses:Record<ArrivalPoseId,PoseArt>={
 flight:{src:art('voo'),scale:.945,anchor:[.3947,.6396],on:'chest'},
 turn:{src:art('virada'),scale:1.06,anchor:[.4785,.4785],on:'chest'},
 fall:{src:art('descida'),scale:1.21,anchor:[.496,.957],on:'feet'},
 impact:{src:art('pouso'),scale:.83,anchor:[.5144,.8788],on:'feet'},
 rise:{src:art('levantando'),scale:.78,anchor:[.5622,.8915],on:'feet'},
 landed:{src:publicAsset('/assets/portraits/robot/pose-4.webp'),scale:1,anchor:[heroFeet.x,heroFeet.y],on:'feet'},
};

/** CSS box of a drawing inside the portrait box, in percent. */
export function poseBox({scale,anchor,on}:PoseArt){
 const to=on==='chest'?heroChest:heroFeet,percent=(v:number)=>`${(v*100).toFixed(3)}%`;
 return {left:percent(to.x-scale*anchor[0]),top:percent(to.y-scale*anchor[1]),width:percent(scale),height:percent(scale)};
}

/** Fetches and decodes the drawings ahead of the arrival. */
let loading:Promise<void>|null=null;
export function preloadArrivalPoses(){
 if(typeof Image==='undefined')return Promise.resolve();
 return loading??=Promise.all(Object.values(arrivalPoses).map(({src})=>{
  const image=new Image();image.decoding='async';image.src=src;
  return image.decode().catch(()=>{});
 })).then(()=>{});
}
