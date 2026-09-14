import {useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
export const ambientClocks=new Set<{uniform:{value:number};initial:number}>();
/** Equal animation speed at every refresh rate; no jump after pause/background. */
export function useAmbientTime(animate:boolean,initial=0){
 const time=useRef({value:initial}),last=useRef<number|null>(null);
 useEffect(()=>{const clock={uniform:time.current,initial};ambientClocks.add(clock);return()=>{ambientClocks.delete(clock);};},[initial]);
 useEffect(()=>{
  last.current=null;const reset=()=>{last.current=null;};
  document.addEventListener('visibilitychange',reset);return()=>document.removeEventListener('visibilitychange',reset);
 },[animate]);
 useFrame(()=>{
  if(!animate||document.hidden){last.current=null;return;}
  const now=performance.now();if(last.current!==null)time.current.value+=(now-last.current)/1000;last.current=now;
 });
 return time;
}
