import {useEffect,useState} from 'react';
import {characters} from '../../content/characters';
import type {CharacterPose} from '../../game/types';
export function CharacterStage({characterId,pose}:{characterId:string;pose:CharacterPose}){
 const character=characters[characterId],src=character.poses[pose];
 const [failed,setFailed]=useState(false);
 const [displayed,setDisplayed]=useState({pose,src});
 useEffect(()=>{
  let active=true;const image=new Image();image.src=src;
  image.decode().then(()=>{if(active){setDisplayed({pose,src});setFailed(false);}}).catch(()=>{if(active&&displayed.src===src)setFailed(true);});
  return()=>{active=false;};
 },[src,pose]);
 useEffect(()=>{
  // Browser cache shares the five small WebPs between all dialogue states.
  const timer=setTimeout(()=>Object.values(character.poses).forEach(url=>{const img=new Image();img.src=url;}),1500);
  return()=>clearTimeout(timer);
 },[character]);
 return <div className="character-stage robot-stage" aria-label={'Personagem: '+character.name} data-pose={displayed.pose}>
  {!failed?<img src={displayed.src} alt="Robô companheiro da jornada" width="768" height="768" decoding="sync" onError={()=>setFailed(true)}/>:<div className="character-fallback">Companheiro</div>}
  <div className="character-signature"><span>OBSERVANDO COM VOCÊ</span><b>{character.name}</b></div>
 </div>;
}
