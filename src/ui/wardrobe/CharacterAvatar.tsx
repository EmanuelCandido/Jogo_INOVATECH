import { useId } from 'react';
import { characters } from '../../content/characters';
import type { CharacterPose } from '../../game/types';
import { accessoryById, type Outfit } from '../../game/wardrobe';
import { BackpackLayer, BackpackStraps, HatLayer, JacketLayer, wearablePoses } from './WearableLayers';
import {CrestOcclusion} from './FittedGear';
import {headTransform,torsoTransform} from './fitting';
import {bodySilhouettes as foreground} from './bodySilhouettes';
import {ClassicCape,ClassicCrestOcclusion} from './ClassicGear';
export function CharacterAvatar({ outfit, pose = 'character_intro', src, onError, label = 'Robô companheiro da jornada' }: { outfit: Outfit; pose?: CharacterPose; src?: string; onError?: () => void; label?: string }) {
  const uid=useId().replaceAll(':','');
  const source=src ?? characters.companion.poses[pose];
  const cape=accessoryById[outfit.cape], jacket=outfit.jacket?accessoryById[outfit.jacket]:null, hat=outfit.hat?accessoryById[outfit.hat]:null;
  const pack=Boolean(cape.collection);
  return <div className="character-avatar" data-cape={outfit.cape} data-jacket={outfit.jacket??'none'} data-hat={outfit.hat??'none'}>
    <img className="character-base is-composited" src={source} alt={label} width="768" height="768" onError={onError} decoding="sync"/>
    <svg className="character-garments" viewBox="0 0 768 768" width="768" height="768" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <mask id={`${uid}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="768" height="768" style={{maskType:'luminance'}}>
          <path d={foreground[pose]} fill="white"/><path d="M185 0H560V274Q416 332 274 306L185 245Z" fill="white" transform={headTransform(pose)}/>
          {hat&&(hat.collection?<CrestOcclusion item={hat} pose={pose}/>:<ClassicCrestOcclusion item={hat} pose={pose}/>)}
        </mask>
        <clipPath id={uid+'-front-hands'}><path d={wearablePoses[pose].front}/></clipPath>
        <clipPath id={uid+'-front-footprint'}><path d="M255 288H447V449H255Z" transform={torsoTransform(pose)}/></clipPath>
      </defs>
      {pack?<BackpackLayer key={cape.id} item={cape} pose={pose}/>:<ClassicCape key={cape.id} item={cape} pose={pose}/>}
      <image data-part="body" href={source} width="768" height="768" mask={`url(#${uid}-body)`}/>
      {jacket && <JacketLayer key={jacket.id} item={jacket} pose={pose} source={source} uid={uid}/>}
      {pack&&<BackpackStraps item={cape} pose={pose}/>}
      {pack&&<g clipPath={`url(#${uid}-front-footprint)`}><image href={source} width="768" height="768" clipPath={`url(#${uid}-front-hands)`}/></g>}
      {hat && <HatLayer key={hat.id} item={hat} pose={pose} uid={uid}/>}
    </svg>
  </div>;
}
