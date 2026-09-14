import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {BatchedMesh,Matrix4,OrthographicCamera} from 'three';
import {instanceVisibility} from '../../game/instanceVisibility';
import {situationPreloadStatus} from './SituationLayers';
import {useProgress} from '@react-three/drei';
import {ambientClocks} from '../../game/useAmbientTime';
import {frameMetrics} from '../../game/frameMetrics';
import {initialProgress} from '../../game/save';
import {NarrativeManager} from '../../game/NarrativeManager';
import {useGame} from '../../stores/gameStore';
import type {GameSettings} from '../../game/types';
import {mapBaseZoom,mapFootprint,clampTarget,clampZoom} from '../../game/mapNavigation';

/** Opt-in diagnostic bridge. Not loaded in ordinary games. No synchronous GPU waits. */
export default function Benchmark(){
 const {gl,scene,camera,invalidate}=useThree();
 const state=useRef({active:false,last:0,frames:[] as number[],cpu:[] as number[],gpu:[] as number[]});
 useFrame(()=>{if(state.current.active&&!document.hidden)invalidate();},-100);
 useEffect(()=>{
  const context=gl.getContext() as WebGL2RenderingContext;
  const timer=context.getExtension('EXT_disjoint_timer_query_webgl2');
  const rendererExt=context.getExtension('WEBGL_debug_renderer_info');
  const pending:WebGLQuery[]=[];
  const original=gl.render;
  let undoBatch:()=>void=()=>{};
  gl.render=function(s,c){
   const data=state.current,measuring=data.active&&!document.hidden;
   const now=performance.now();
   if(measuring&&data.last)data.frames.push(now-data.last);
   if(measuring)data.last=now;
   if(timer){
    const disjoint=context.getParameter(timer.GPU_DISJOINT_EXT);
    for(let i=pending.length-1;i>=0;i--){
     if(disjoint||context.getQueryParameter(pending[i],context.QUERY_RESULT_AVAILABLE)){
      if(!disjoint&&measuring)data.gpu.push(context.getQueryParameter(pending[i],context.QUERY_RESULT)/1e6);
      context.deleteQuery(pending[i]);pending.splice(i,1);
     }
    }
   }
   const query=measuring&&timer&&pending.length<4?context.createQuery():null;
   if(query)context.beginQuery(timer!.TIME_ELAPSED_EXT,query);
   const start=performance.now();original.call(this,s,c);
   if(measuring)data.cpu.push(performance.now()-start);
   if(query){context.endQuery(timer!.TIME_ELAPSED_EXT);pending.push(query);}
  };
  const api={
   renderer:rendererExt?context.getParameter(rendererExt.UNMASKED_RENDERER_WEBGL):context.getParameter(context.RENDERER),
   gpuTimer:!!timer,multiDraw:!!context.getExtension('WEBGL_multi_draw'),
   ready(){return !situationPreloadStatus.pending&&!useProgress.getState().active;},
   setup(settings:Partial<GameSettings>={}){
    let p=initialProgress();while(p.phase==='INTRO')p=NarrativeManager.next(p);
    p=NarrativeManager.next(NarrativeManager.choose(p,'observe'));
    p.settings={...p.settings,quality:'ULTRA',shadows:'PRESET',renderScale:100,reducedMotion:true,ambientAnimation:false,...settings};
    useGame.setState({progress:p});invalidate();
   },
   settings(patch:Partial<GameSettings>){useGame.getState().graphics(patch);},
   camera(x:number,z:number,zoom:number,y=0,offset:readonly [number,number,number]=[110,130,145]){camera.position.set(x+offset[0],y+offset[1],z+offset[2]);camera.lookAt(x,y,z);(camera as OrthographicCamera).zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();invalidate();},
   reviewState(){
    const situations:Array<{id:string;visualState:string}>=[];
    scene.traverse(o=>{if(o.userData.problem)situations.push({id:o.userData.problem,visualState:o.userData.visualState});});
    return {progress:useGame.getState().progress,situations,dumpStage:scene.getObjectByName('Lixão ambiental')?.userData.stage};
   },
   playerCamera(x:number,z:number,requestedZoom:number){
    const cam=camera as OrthographicCamera,w=cam.right-cam.left,h=cam.top-cam.bottom,base=mapBaseZoom(w,h),zoom=base*clampZoom(requestedZoom/base);
    const target=clampTarget(x,z,mapFootprint(zoom,w,h));
    api.camera(target[0],target[1],zoom,0);
    return {x:target[0],z:target[1],zoom,width:w,height:h,y:0};
   },
   start(){pending.forEach(q=>context.deleteQuery(q));pending.length=0;state.current={active:true,last:0,frames:[],cpu:[],gpu:[]};invalidate();},
   stop(){state.current.active=false;return {...api.snapshot(),frame:frameMetrics(state.current.frames),cpu:frameMetrics(state.current.cpu),gpu:frameMetrics(state.current.gpu)};},
   snapshot(){
    let meshes=0,instances=0;const materials=new Set();scene.traverse(o=>{if('isMesh' in o){meshes++;const m=(o as unknown as {material:unknown}).material;for(const material of Array.isArray(m)?m:[m])materials.add(material);}if('isInstancedMesh' in o)instances+=o.userData.sourceInstances??(o as unknown as {count:number}).count;});
    const sourceBytes=[...instanceVisibility].reduce((sum,e)=>sum+e.matrices.byteLength+(e.colors?.byteLength??0),0);
    return {calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length,meshes,instances,materials:materials.size,sourceBytes,width:gl.domElement.width,height:gl.domElement.height,settings:useGame.getState().progress.settings};
   },
   draw(){invalidate();},
   shadowInfo(){const lights:unknown[]=[];scene.traverse(o=>{if('isDirectionalLight' in o){const l=o as unknown as import('three').DirectionalLight;lights.push({cast:l.castShadow,size:l.shadow.mapSize.toArray(),camera:[l.shadow.camera.near,l.shadow.camera.far,l.shadow.camera.left,l.shadow.camera.right],map:!!l.shadow.map});}});return {enabled:gl.shadowMap.enabled,type:gl.shadowMap.type,lights};},
   refreshShadows(){gl.shadowMap.needsUpdate=true;invalidate();},
   culling(enabled:boolean){scene.userData.benchmarkDisableCulling=!enabled;invalidate();},
   freeze(){for(const clock of ambientClocks)clock.uniform.value=clock.initial;invalidate();},
   clocks(){return [...ambientClocks].map(clock=>clock.uniform.value);},
   buffers(){return [...instanceVisibility].map(e=>({id:e.mesh.uuid,version:e.mesh.instanceMatrix.version,updates:e.updates,count:e.bounds.length}));},
   experimentBatched(){
    undoBatch();const remove:Array<()=>void>=[];
    for(const entry of instanceVisibility){
     const mesh=entry.mesh;
     if(!/\/(tree[^/]*|pine)\.glb$/.test(mesh.parent?.userData.modelUrl??'')||Array.isArray(mesh.material))continue;
     const batch=new BatchedMesh(entry.bounds.length,mesh.geometry.attributes.position.count,mesh.geometry.index?.count??0,mesh.material);
     const geometryId=batch.addGeometry(mesh.geometry),matrix=new Matrix4();batch.sortObjects=false;
     for(let i=0;i<entry.bounds.length;i++)batch.setMatrixAt(batch.addInstance(geometryId),matrix.fromArray(entry.matrices,i*16));
     batch.castShadow=mesh.castShadow;batch.receiveShadow=mesh.receiveShadow;batch.matrix.copy(mesh.matrix);batch.matrixAutoUpdate=false;
     mesh.parent!.add(batch);mesh.visible=false;
     remove.push(()=>{batch.removeFromParent();batch.dispose();mesh.visible=true;});
    }
    undoBatch=()=>{remove.forEach(fn=>fn());};gl.shadowMap.needsUpdate=true;invalidate();return remove.length;
   },
  };
  (window as unknown as {ecoBenchmark:typeof api}).ecoBenchmark=api;
  return()=>{undoBatch();gl.render=original;pending.forEach(q=>context.deleteQuery(q));delete (window as unknown as {ecoBenchmark?:typeof api}).ecoBenchmark;};
 },[gl,scene,camera,invalidate]);
 return null;
}
