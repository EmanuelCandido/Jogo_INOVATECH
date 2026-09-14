import {useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useResolvedGraphics} from '../../stores/graphicsStore';
/** Keep demand rendering for still scenes and pause ambient rendering in background tabs. */
export function AmbientFrames(){
 const {animate}=useResolvedGraphics(),invalidate=useThree(s=>s.invalidate);
 useEffect(()=>{
  if(!animate)return;
  const wake=()=>{if(!document.hidden)invalidate();};wake();
  document.addEventListener('visibilitychange',wake);
  return()=>document.removeEventListener('visibilitychange',wake);
 },[animate,invalidate]);
 useFrame(()=>{if(animate&&!document.hidden)invalidate();});
 return null;
}
