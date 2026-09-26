import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {create} from 'zustand';
import {useGame} from '../../stores/gameStore';

export interface LiveFrames {fps:number;worstMs:number;triangles:number;calls:number;width:number;height:number}
/** Rendered frames over the last second, for the on-screen readout. Frames
 * are drawn on demand, so a still camera without animation reads low. */
export const useLiveFrames=create<{live:LiveFrames|null}>(()=>({live:null}));
export function LiveFrameRate(){
 const show=useGame(s=>s.progress.settings.showPerformance);
 const gl=useThree(s=>s.gl);
 const sample=useRef({start:0,last:0,frames:0,worst:0});
 useFrame(()=>{
  if(!show)return;
  const w=sample.current,now=performance.now();
  if(!w.start){w.start=now;w.last=now;return;}
  w.frames++;w.worst=Math.max(w.worst,now-w.last);w.last=now;
  if(now-w.start>=1000){
   const {calls,triangles}=gl.info.render;
   useLiveFrames.setState({live:{fps:Math.round(w.frames*1000/(now-w.start)),worstMs:Math.round(w.worst),triangles,calls,width:gl.domElement.width,height:gl.domElement.height}});
   w.start=now;w.frames=0;w.worst=0;
  }
 },-100);
 return null;
}
