import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {useLoadingSnapshot} from '../../game/useLoadingActive';
import {useProgress} from '@react-three/drei';
import {startShaderWarmup} from '../../game/shaderWarmup';

/** Warm resident off-screen materials during idle time, using parallel compilation. */
export function ShaderWarmup({ready}:{ready:boolean}){
 const {gl,scene,camera,invalidate}=useThree();
 const {active,loaded}=useLoadingSnapshot();
 useEffect(()=>{
  if(!ready||active||!gl.extensions.has('KHR_parallel_shader_compile'))return;
  const job=startShaderWarmup(gl,scene,camera,()=>!document.hidden&&!useProgress.getState().active,invalidate);
  return job.cancel;
 },[gl,scene,camera,invalidate,ready,active,loaded]);
 return null;
}
