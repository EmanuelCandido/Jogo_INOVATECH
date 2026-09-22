import {useEffect,useState} from 'react';
import {characters} from '../../content/characters';
import type {CharacterPose} from '../../game/types';
import {useGame} from '../../stores/gameStore';
import {CharacterAvatar} from '../wardrobe/CharacterAvatar';
export function CharacterStage({characterId,pose}:{characterId:string;pose:CharacterPose}){
 const character=characters[characterId],src=character.poses[pose];
 const outfit=useGame(state=>state.progress.wardrobe.equipped);
 const [displayed,setDisplayed]=useState({pose,src});
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let active=true;
  const image=new Image();
  image.src=src;
  // Keep the previous decoded image visible until the requested pose is ready.
  // Ignore late completions when the player has already advanced again.
  image.decode().then(()=>{
   if(active){setDisplayed({pose,src});setFailed(false);}
  }).catch(()=>{
   if(active&&displayed.src===src)setFailed(true);
  });
  return()=>{active=false;};
 },[src,pose]);
 useEffect(()=>{
  Object.values(character.poses).forEach(url=>{const image=new Image();image.src=url;});
 },[character]);
 return <div className="character-stage robot-stage" aria-label={'Personagem: '+character.name} data-pose={displayed.pose}>
  {!failed?<CharacterAvatar src={displayed.src} pose={displayed.pose} outfit={outfit} onError={()=>setFailed(true)}/>:<div className="character-fallback">{character.name}</div>}
 </div>;
}
