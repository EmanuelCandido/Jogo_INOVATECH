import {publicAsset} from '../../assets/publicAsset';
import type {CharacterPose} from '../../game/types';
import type {Accessory} from '../../game/wardrobe';
import {classicHats} from './classicArtwork';
import {headTransform,torsoTransform} from './fitting';

export const classicSource=(id:string)=>publicAsset('/assets/accessories/classic-v2/'+id+'.webp');

export function ClassicCrestOcclusion({item,pose}:{item:Accessory;pose:CharacterPose}){
  const art=classicHats[item.id];
  return art.occlusion?<g transform={headTransform(pose)}><path d={art.occlusion} fill="black" transform={art.registration}/></g>:null;
}

export function ClassicHat({item,pose,uid}:{item:Accessory;pose:CharacterPose;uid:string}){
  const art=classicHats[item.id];
  return <g data-slot="hat" data-fitting="worn-silhouette" className="wearable-reveal" transform={headTransform(pose)}>
    <g transform={art.registration}>
      <defs><filter id={uid+'-classic-contact'} x="-.1" y="-.2" width="1.2" height="1.5"><feGaussianBlur stdDeviation="1.4"/></filter></defs>
      {art.contact&&<path d={art.contact} fill="none" stroke="#231526" strokeWidth="5" opacity=".24" filter={'url(#'+uid+'-classic-contact)'}/>}
      <image href={classicSource(item.id)} width="768" height="768"/>
    </g>
  </g>;
}

export function ClassicCape({item,pose}:{item:Accessory;pose:CharacterPose}){
  return <g data-slot="cape" data-fitting="complete-rear-cloth" className="wearable-reveal" transform={torsoTransform(pose)}>
    <image href={classicSource(item.id)} width="768" height="768"/>
  </g>;
}
