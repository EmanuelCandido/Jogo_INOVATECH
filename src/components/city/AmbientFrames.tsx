import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {useResolvedGraphics} from '../../stores/graphicsStore';
/** Keep demand rendering for still scenes and pause ambient rendering in background tabs. */
export function AmbientFrames(){
 const {animate}=useResolvedGraphics(),invalidate=useThree(s=>s.invalidate);
 useEffect(()=>{
  if(!animate)return;
  const timer=setInterval(()=>{if(!document.hidden)invalidate();},1000/30);
  return()=>clearInterval(timer);
 },[animate,invalidate]);
 return null;
}
