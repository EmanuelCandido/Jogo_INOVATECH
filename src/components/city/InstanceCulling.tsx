import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {instanceVisibility} from '../../game/instanceVisibility';

export function InstanceCulling(){
 const {scene,gl,invalidate}=useThree();
 useLayoutEffect(()=>{
  const previous=scene.onBeforeRender;
  let shadowRecovery=false;
  // Scene callback runs AFTER world transforms and BEFORE WebGLObjects uploads.
  // Object.onBeforeRender is too late to update an instance buffer in this frame.
  scene.onBeforeRender=function(...args){
   previous.apply(this,args);
   const refresh=gl.shadowMap.enabled&&(gl.shadowMap.needsUpdate||gl.shadowMap.autoUpdate);
   // The shadow pass uploads instances with Three's NEXT frame id. Keep the
   // full buffer AND count for one recovery draw, then compact on a fresh id.
   // Compacting immediately would draw a short count from the old full buffer
   // and make visible trees disappear on every animated shadow refresh.
   const preserveCasters=refresh||shadowRecovery;
   const recovering=shadowRecovery&&!refresh;
   shadowRecovery=refresh;
   let compacted=false;
   for(const entry of instanceVisibility){
    const before=entry.updates;
    if(scene.userData.benchmarkDisableCulling||(preserveCasters&&entry.mesh.castShadow))entry.restore();else entry.select(args[2]);
    compacted ||= entry.updates!==before;
   }
   // One complete draw on shadow-refresh frames preserves off-screen casters.
   // Resume camera compaction after the recovery draw, including demand mode.
   if((refresh&&!gl.shadowMap.autoUpdate)||recovering||compacted)invalidate();
  };
  return()=>{scene.onBeforeRender=previous;};
 },[scene,gl,invalidate]);
 return null;
}
