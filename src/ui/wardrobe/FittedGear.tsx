import {publicAsset} from '../../assets/publicAsset';
import type {CharacterPose} from '../../game/types';
import type {Accessory} from '../../game/wardrobe';
import {headTransform, torsoTransform, triangleTransform} from './fitting';
import {wornArtwork} from './wornArtwork';

const gearSource=(item:Accessory,part:'head'|'straps'|'back')=>publicAsset(`/assets/accessories/fitted/${item.collection}-${part}.webp`);
const repairHead=triangleTransform([[245,111],[469,130],[337,273]],[[244,127],[480,144],[352,291]]);
const repairTorso=triangleTransform([[295,267],[407,271],[347,425]],[[293,293],[409,298],[347,443]]);
const registration=(item:Accessory,part:'head'|'torso')=>item.collection==='repair'?(part==='head'?repairHead:repairTorso):undefined;

export function CrestOcclusion({item,pose}:{item:Accessory;pose:CharacterPose}){
  const cut=wornArtwork[item.collection!].crestOcclusion;
  return cut?<path d={cut} fill="black" transform={headTransform(pose)}/>:null;
}

export function FittedHeadwear({item,pose,uid}:{item:Accessory;pose:CharacterPose;uid:string}){
  const art=wornArtwork[item.collection!];
  return <g data-slot="hat" data-fitting="worn-silhouette" className="wearable-reveal">
    <g transform={headTransform(pose)}><g transform={registration(item,'head')}>
      <defs>
        <filter id={uid+'-brim-shade'} x="-.1" y="-.2" width="1.2" height="1.5"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      {art.headContact&&<path d={art.headContact} fill="none" stroke="#211326" strokeWidth="8" opacity=".32" filter={`url(#${uid}-brim-shade)`}/>}
      <image href={gearSource(item,'head')} width="768" height="768"/>
    </g></g>
  </g>;
}

export function FittedStraps({item,pose}:{item:Accessory;pose:CharacterPose}){
  return <g data-part="backpack-straps" className="wearable-reveal" transform={torsoTransform(pose)}>
    <g transform={registration(item,'torso')}>
      <image href={gearSource(item,'straps')} width="768" height="768"/>
    </g>
  </g>;
}

/** These rear layers were painted in the worn perspective, with the hidden
 * material completed. Moving an arm reveals backpack fabric, never a second arm.
 * Their origin is the torso; head tilt cannot move a backpack off the shoulders.
 */
export function FittedBackpack({item,pose}:{item:Accessory;pose:CharacterPose}){
  return <g data-slot="backpack" data-fitting="worn-side-view" className="wearable-reveal" transform={torsoTransform(pose)}>
    <image href={gearSource(item,'back')} width="768" height="768"/>
  </g>;
}
