import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {useProgress} from '@react-three/drei';
import {useGame} from '../../stores/gameStore';
import {useResolvedGraphics} from '../../stores/graphicsStore';

/** The sun and city are static while panning; only scene changes need a new shadow map. */
export function ShadowCache(){
  const {gl,invalidate}=useThree();
  const active=useProgress(s=>s.active),loaded=useProgress(s=>s.loaded);
  const states=useGame(s=>s.progress.problemStates);
  const selected=useGame(s=>s.progress.selectedProblem);
  const {tier,shadowSize}=useResolvedGraphics();
  useEffect(()=>{
    gl.shadowMap.autoUpdate=false;
    return ()=>{gl.shadowMap.autoUpdate=true;};
  },[gl]);
  useEffect(()=>{
    gl.shadowMap.needsUpdate=true;
    invalidate();
  },[gl,invalidate,active,loaded,states,selected,tier,shadowSize]);
  return null;
}
