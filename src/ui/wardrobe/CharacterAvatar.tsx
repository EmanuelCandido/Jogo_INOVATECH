import { useId } from 'react';
import { characters } from '../../content/characters';
import type { CharacterPose } from '../../game/types';
import { accessoryById, type Outfit } from '../../game/wardrobe';
import { Motif } from './AccessoryArt';
import { BackpackLayer, BackpackStraps, HatLayer, JacketLayer, wearablePoses } from './WearableLayers';
import {CrestOcclusion} from './FittedGear';
import {headTransform,torsoTransform} from './fitting';
import {bodySilhouettes as foreground} from './bodySilhouettes';
function channel(hex: string, index: number) { return parseInt(hex.slice(1+index*2,3+index*2),16)/255; }
export function CharacterAvatar({ outfit, pose = 'character_intro', src, onError, label = 'Robô companheiro da jornada' }: { outfit: Outfit; pose?: CharacterPose; src?: string; onError?: () => void; label?: string }) {
  const uid=useId().replaceAll(':','');
  const source=src ?? characters.companion.poses[pose];
  const cape=accessoryById[outfit.cape], jacket=outfit.jacket?accessoryById[outfit.jacket]:null, hat=outfit.hat?accessoryById[outfit.hat]:null;
  const pack=Boolean(cape.collection);
  const headwear=Boolean(hat?.collection);
  const composed=pack||headwear;
  return <div className="character-avatar" data-cape={outfit.cape} data-jacket={outfit.jacket??'none'} data-hat={outfit.hat??'none'}>
    <img className={'character-base'+(composed?' is-composited':'')} src={source} alt={label} width="768" height="768" onError={onError} decoding="sync"/>
    <svg className="character-garments" viewBox="0 0 768 768" width="768" height="768" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <mask id={`${uid}-cape`} maskUnits="userSpaceOnUse" x="0" y="0" width="768" height="768" style={{maskType:'luminance'}}><path d="M0 282H768V648H0Z" fill="white"/><ellipse cx="384" cy="155" rx="205" ry="150" fill="black"/><path d={foreground[pose]} fill="black" stroke="black" strokeWidth="3" strokeLinejoin="round"/></mask>
        <filter id={`${uid}-dye`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent=".65" offset="0"/><feFuncG type="gamma" amplitude="1" exponent=".65" offset="0"/><feFuncB type="gamma" amplitude="1" exponent=".65" offset="0"/></feComponentTransfer>
          <feComponentTransfer result="dyed">
            <feFuncR type="table" tableValues={`0 ${channel(cape.color,0)} ${channel(cape.light,0)} 1`}/>
            <feFuncG type="table" tableValues={`0 ${channel(cape.color,1)} ${channel(cape.light,1)} 1`}/>
            <feFuncB type="table" tableValues={`0 ${channel(cape.color,2)} ${channel(cape.light,2)} 1`}/>
          </feComponentTransfer>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 -6 6 0 -.7" result="clothAlpha"/>
          <feComposite in="dyed" in2="clothAlpha" operator="in"/>
        </filter>
        <mask id={`${uid}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="768" height="768" style={{maskType:'luminance'}}>
          {pack?<><path d={foreground[pose]} fill="white"/><path d="M185 0H560V274Q416 332 274 306L185 245Z" fill="white" transform={headTransform(pose)}/></>:<rect width="768" height="768" fill="white"/>}
          {headwear&&hat&&<CrestOcclusion item={hat} pose={pose}/>}
        </mask>
        <clipPath id={uid+'-front-hands'}><path d={wearablePoses[pose].front}/></clipPath>
        <clipPath id={uid+'-front-footprint'}><path d="M255 288H447V449H255Z" transform={torsoTransform(pose)}/></clipPath>
      </defs>
      {pack&&<BackpackLayer item={cape} pose={pose}/>}
      {composed&&<image data-part="body" href={source} width="768" height="768" mask={`url(#${uid}-body)`}/>}
      {!pack&&cape.style!==0 && <g className="wearable-reveal" key={cape.id} mask={`url(#${uid}-cape)`}>
        <image href={source} width="768" height="768" preserveAspectRatio="xMidYMid meet" filter={`url(#${uid}-dye)`}/>
        <g opacity=".7"><Motif style={cape.style} color={cape.trim} x={580} y={509} size={22}/>{cape.style===2&&<><Motif style={0} color={cape.trim} x={622} y={530} size={9}/><Motif style={0} color={cape.trim} x={543} y={540} size={7}/></>}</g>
      </g>}
      {jacket && <JacketLayer key={jacket.id} item={jacket} pose={pose} source={source} uid={uid}/>}
      {pack&&<BackpackStraps item={cape} pose={pose}/>}
      {pack&&<g clipPath={`url(#${uid}-front-footprint)`}><image href={source} width="768" height="768" clipPath={`url(#${uid}-front-hands)`}/></g>}
      {hat && <HatLayer key={hat.id} item={hat} pose={pose} uid={uid}/>}
    </svg>
  </div>;
}
