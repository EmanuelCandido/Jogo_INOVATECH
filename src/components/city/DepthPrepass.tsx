import {useEffect,useLayoutEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useProgress} from '@react-three/drei';
import {Matrix4} from 'three';
import {depthFrameRenderer} from '../../game/depthPrepass';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {pausePreparation,preparationActivity,preparationPending,preparationRunning} from '../../game/resourcePreparation';
import {useGame} from '../../stores/gameStore';
import {shaderCompilationPending} from '../../game/shaderWarmup';

// Candidate deferred while weak-device GPU work has priority. Ordinary games
// retain the verified Ultra path; calibration requires an explicit audit URL.
const params=new URLSearchParams(location.search);
const calibrationTrial=params.get('benchmark')==='1'&&params.get('renderPathTrial')==='1';

export function DepthPrepass(){
 const {gl,scene,camera,invalidate,size}=useThree(),q=useResolvedGraphics();
 const frame=depthFrameRenderer(gl);
 const previous=useRef({world:new Matrix4(),projection:new Matrix4(),shadowFrames:0,width:0,height:0});
 useLayoutEffect(()=>{
  pausePreparation(gl.domElement,frame,false);frame.automatic=calibrationTrial;frame.selection.reset();frame.enabled=q.tier==='ULTRA'&&(!calibrationTrial||frame.selection.preferred);invalidate();
 },[gl,frame,q.tier,q.renderScale,q.shadowSize,size.width,size.height,invalidate]);
 useEffect(()=>()=>{pausePreparation(gl.domElement,frame,false);frame.dispose();},[gl,frame]);
 // Own only the final render; animation/navigation keep their existing frame order.
 useFrame(()=>{
  if(!calibrationTrial){frame.render(scene,camera);return;}
  const p=previous.current;
  if(p.width!==gl.domElement.width||p.height!==gl.domElement.height){
   p.width=gl.domElement.width;p.height=gl.domElement.height;frame.selection.reset();
  }
  if(frame.automatic&&q.tier==='ULTRA'&&!frame.selection.complete){
   camera.updateMatrixWorld();
   const moved=!p.world.equals(camera.matrixWorld)||!p.projection.equals(camera.projectionMatrix);
   p.world.copy(camera.matrixWorld);p.projection.copy(camera.projectionMatrix);
   if(gl.shadowMap.enabled&&(gl.shadowMap.needsUpdate||gl.shadowMap.autoUpdate))p.shadowFrames=2;
   const phase=useGame.getState().progress.phase;
   const stable=!document.hidden&&!moved&&!p.shadowFrames&&!useProgress.getState().active&&!preparationPending(gl.domElement,'models')&&!preparationActivity(gl.domElement).busy()&&!['FOCUSING','RETURNING'].includes(phase);
   // Pause optional shader preparation during the comparison, but never abandon
   // a compile already in flight or stop visible loading. Resume on interruption.
   pausePreparation(gl.domElement,frame,stable);
   const eligible=stable&&!preparationRunning(gl.domElement)&&!shaderCompilationPending(gl);
   if(p.shadowFrames)p.shadowFrames--;
   frame.enabled=frame.selection.tick(performance.now(),eligible);
   // A scene with ambient animation disabled may use demand rendering. Only
   // request a bounded comparison after optional preparation has completed.
   if(eligible&&!frame.selection.complete)invalidate();
  }else pausePreparation(gl.domElement,frame,false);
  if(frame.selection.complete)pausePreparation(gl.domElement,frame,false);
  frame.render(scene,camera);
 },1);
 return null;
}
