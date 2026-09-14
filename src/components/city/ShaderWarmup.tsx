import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {useLoadingSnapshot} from '../../game/useLoadingActive';

/** Warm resident off-screen materials during idle time, using parallel compilation. */
export function ShaderWarmup({ready}:{ready:boolean}){
 const {gl,scene,camera,invalidate}=useThree();
 const {active,loaded}=useLoadingSnapshot();
 useEffect(()=>{
  if(!ready||active||!gl.extensions.has('KHR_parallel_shader_compile'))return;
  let stopped=false,idle:number|undefined;
  const timer=setTimeout(()=>{
   const warm=()=>{if(!stopped)void gl.compileAsync(scene,camera).then(()=>{if(!stopped)invalidate();}).catch(()=>{/* Normal rendering retains its usual shader/error handling. */});};
   if('requestIdleCallback' in window)idle=window.requestIdleCallback(warm,{timeout:1000});else warm();
  },600);
  return()=>{stopped=true;clearTimeout(timer);if(idle!==undefined)window.cancelIdleCallback(idle);};
 },[gl,scene,camera,invalidate,ready,active,loaded]);
 return null;
}
