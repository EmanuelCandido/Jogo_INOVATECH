import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Matrix4} from 'three';
import {useGraphicsRuntime} from '../../stores/graphicsStore';
import {cameraInvalidate,staticFrameEnabled,staticFrameFullMoves} from '../../game/staticFrame';

const params=new URLSearchParams(location.search);
// Benchmarks lock the resolution unless the route opts into this behaviour.
const enabled=params.get('benchmark')!=='1'||params.get('motionResolution')==='1';
/** Linear scale while the camera moves: 0.7 renders about half the pixels. */
export const motionScale=.7;
const settleMs=160;

/** Renders fewer pixels only while the camera is moving. The first frame after
 * the camera stops is drawn again at the full resolution, so every still image
 * keeps its complete sharpness. Most of the GPU cost (foliage, water, depth)
 * is per pixel, which is what limits weak phones and integrated graphics. */
export function MotionResolution(){
 const {camera,setDpr,invalidate}=useThree();
 const base=useGraphicsRuntime(s=>s.pixelRatio);
 const state=useRef({moving:false,last:0,world:new Matrix4(),projection:new Matrix4(),primed:false});
 useEffect(()=>{
  const s=state.current;s.moving=false;s.primed=false;
  // Canvas owns the base value through its prop; restore it when leaving.
  return()=>{if(s.moving){s.moving=false;setDpr(base);}};
 },[base,setDpr]);
 useFrame(()=>{
  if(!enabled)return;
  const s=state.current,now=performance.now();
  camera.updateMatrixWorld();
  const moved=s.primed&&(!s.world.equals(camera.matrixWorld)||!s.projection.equals(camera.projectionMatrix));
  s.world.copy(camera.matrixWorld);s.projection.copy(camera.projectionMatrix);s.primed=true;
  if(moved){
   s.last=now;
   // Map drags and zooms move the kept image instead (staticFrame); only
   // camera flights that redraw the whole city use fewer pixels. One complete
   // frame or two are not enough to tell: the end of the previous gesture,
   // a change in the city or a shadow refresh can land on a drag.
   if(!s.moving&&(!staticFrameEnabled||staticFrameFullMoves()>=3)){s.moving=true;setDpr(base*motionScale);}
  }else if(s.moving&&now-s.last>=settleMs){
   s.moving=false;setDpr(base);invalidate();
  }
  // Demand rendering: keep ticking until the camera has settled, then draw
  // one sharp frame at the full resolution. Ticking changes nothing in the
  // city, so it does not force complete frames by itself.
  if(s.moving)cameraInvalidate(invalidate);
 },-95);
 return null;
}
