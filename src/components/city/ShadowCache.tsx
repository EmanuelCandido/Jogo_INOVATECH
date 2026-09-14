import {useEffect,type RefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {DirectionalLight} from 'three';
import {useGame} from '../../stores/gameStore';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {problems} from '../../content/problems';
import {situationVisualKey} from './SituationLayers';

/** The sun and city are static while panning; only scene changes need a new shadow map. */
export function ShadowCache({light}:{light:RefObject<DirectionalLight|null>}){
  const {gl,invalidate}=useThree();
  const states=useGame(s=>problems.map(p=>situationVisualKey(s.progress,p.id)).join(','));
  const {tier,shadowSize}=useResolvedGraphics();
  // A quality change replaces the sun after effects have run. Bootstrap its
  // shadow on the first frame with the new light and renderer both committed.
  useFrame(()=>{
    if(!gl.shadowMap.enabled)return;
    const sun=light.current;if(sun?.castShadow&&!sun.shadow.map)gl.shadowMap.needsUpdate=true;
  },-90);
  useEffect(()=>{
    gl.shadowMap.autoUpdate=false;
    return ()=>{gl.shadowMap.autoUpdate=true;};
  },[gl]);
  useEffect(()=>{
    gl.shadowMap.needsUpdate=true;
    invalidate();
  },[gl,invalidate,states,tier,shadowSize]);
  return null;
}
