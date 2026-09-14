import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {instanceVisibility} from '../../game/instanceVisibility';

export function InstanceCulling(){
 const {scene,gl,invalidate}=useThree();
 useLayoutEffect(()=>{
  const previous=scene.onBeforeRender;
  // Scene callback runs AFTER world transforms and BEFORE WebGLObjects uploads.
  // Object.onBeforeRender is too late to update an instance buffer in this frame.
  scene.onBeforeRender=function(...args){
   previous.apply(this,args);
   const refresh=gl.shadowMap.enabled&&(gl.shadowMap.needsUpdate||gl.shadowMap.autoUpdate);
   let compacted=false;
   for(const entry of instanceVisibility){
    const before=entry.updates;
    if(scene.userData.benchmarkDisableCulling||(refresh&&entry.mesh.castShadow))entry.restore();else entry.select(args[2]);
    compacted ||= entry.updates!==before;
   }
   // One complete draw on shadow-refresh frames preserves off-screen casters.
   // Return to the compact camera selection on the following demand frame.
   // Three uploads shadow instances after advancing its frame id. On the next
   // draw it can regard that same id as already uploaded, although our compact
   // buffer has just changed. Schedule its upload before demand mode goes idle.
   if((refresh&&!gl.shadowMap.autoUpdate)||compacted)invalidate();
  };
  return()=>{scene.onBeforeRender=previous;};
 },[scene,gl,invalidate]);
 return null;
}
