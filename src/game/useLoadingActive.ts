import {useEffect,useState} from 'react';
import {useProgress} from '@react-three/drei';

/** Three's loading manager can fire synchronously while useGLTF suspends a
 * render. Deliver that notification after React's current render completes. */
export function useLoadingSnapshot(){
 const read=()=>{const {active,loaded}=useProgress.getState();return {active,loaded};};
 const [snapshot,setSnapshot]=useState(read);
 useEffect(()=>{
  let live=true,queued=false;
  const update=()=>{
   if(queued)return;queued=true;
   queueMicrotask(()=>{queued=false;if(live){const next=read();setSnapshot(old=>old.active===next.active&&old.loaded===next.loaded?old:next);}});
  };
  const unsubscribe=useProgress.subscribe(update);update();
  return ()=>{live=false;unsubscribe();};
 },[]);
 return snapshot;
}
export function useLoadingActive(){return useLoadingSnapshot().active;}
