import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrthographicCamera} from 'three';
import {initialProgress} from '../../game/save';
import {NarrativeManager} from '../../game/NarrativeManager';
import {useGame} from '../../stores/gameStore';
import {useProgress} from '@react-three/drei';
import {situationPreloadStatus} from './SituationLayers';
import {depthFrameRenderer} from '../../game/depthPrepass';
import {cancelPreparation} from '../../game/resourcePreparation';

const maximum={quality:'ULTRA',renderScale:150,shadows:'PRESET',ambientAnimation:true,reducedMotion:false,showPerformance:false} as const;
type GPUTimer={GPU_DISJOINT_EXT:number;TIME_ELAPSED_EXT:number};
const metrics=(values:number[])=>{
 const a=values.filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);if(!a.length)return null;
 const mean=a.reduce((s,v)=>s+v,0)/a.length;
 return {frames:a.length,meanMs:mean,fps:1000/mean,p50:a[Math.ceil(a.length*.5)-1],p95:a[Math.ceil(a.length*.95)-1],p99:a[Math.ceil(a.length*.99)-1],over33:a.filter(v=>v>1000/30).length};
};
/** Shared audit entry for BOTH builds. GPU queries are absent unless requested.
 * The surrounding renderer, models, navigation and shaders come from each build.
 */
export default function Audit(){
 const {gl,scene,camera,invalidate}=useThree(),frame=depthFrameRenderer(gl);
 const data=useRef({active:false,gpu:false,last:0,start:0,intervals:[] as number[],cpu:[] as number[],gpuMs:[] as number[],violations:new Set<string>()});
 const context=gl.getContext() as WebGL2RenderingContext;
 const timer=useRef<GPUTimer|null>(null),pending=useRef<WebGLQuery[]>([]);
 useFrame(()=>{data.current.start=performance.now();},-10000);
 useFrame(()=>{
  const d=data.current,now=performance.now(),measuring=d.active&&!document.hidden;
  if(d.active&&document.hidden)d.violations.add('hidden');
  if(measuring){if(d.last)d.intervals.push(now-d.last);d.last=now;}
  let query:WebGLQuery|null=null;
  if(measuring&&d.gpu&&timer.current){
   const ext=timer.current,disjoint=context.getParameter(ext.GPU_DISJOINT_EXT);
   for(let i=pending.current.length-1;i>=0;i--){const q=pending.current[i];if(disjoint||context.getQueryParameter(q,context.QUERY_RESULT_AVAILABLE)){
    if(!disjoint)d.gpuMs.push(context.getQueryParameter(q,context.QUERY_RESULT)/1e6);context.deleteQuery(q);pending.current.splice(i,1);
   }}
   if(pending.current.length<8){query=context.createQuery();if(query)context.beginQuery(ext.TIME_ELAPSED_EXT,query);}
  }
  frame.render(scene,camera);
  if(query){context.endQuery(timer.current!.TIME_ELAPSED_EXT);pending.current.push(query);}
  if(measuring){d.cpu.push(performance.now()-d.start);const settings=useGame.getState().progress.settings;for(const key of Object.keys(maximum) as Array<keyof typeof maximum>)if(settings[key]!==maximum[key])d.violations.add(key);}
 },1);
 useEffect(()=>{
  const extension=context.getExtension('WEBGL_debug_renderer_info');timer.current=context.getExtension('EXT_disjoint_timer_query_webgl2');
  const clear=()=>{pending.current.forEach(q=>context.deleteQuery(q));pending.current.length=0;};
  const api={
   maximum,renderer:context.getParameter(extension?extension.UNMASKED_RENDERER_WEBGL:context.RENDERER),attributes:context.getContextAttributes(),gpuAvailable:!!timer.current,
   setup(){let p=initialProgress();while(p.phase==='INTRO')p=NarrativeManager.next(p);p=NarrativeManager.next(NarrativeManager.choose(p,'observe'));p.settings={...p.settings,...maximum};useGame.setState({progress:p});invalidate();},
   ready(){return !situationPreloadStatus.pending&&!useProgress.getState().active;},
   async warmup(){cancelPreparation(gl.domElement,'shaders');await gl.compileAsync(scene,camera);invalidate();},
   prepass(enabled:boolean){frame.enabled=enabled;invalidate();},
   start(gpu=false){clear();data.current={active:true,gpu,last:0,start:0,intervals:[],cpu:[],gpuMs:[],violations:new Set()};invalidate();},
   stop(){data.current.active=false;const d=data.current;return {...api.snapshot(),frame:metrics(d.intervals),cpu:metrics(d.cpu),gpu:metrics(d.gpuMs),instrumented:d.gpu,violations:[...d.violations]};},
   snapshot(){
    let instances=0;const models=new Set<string>();scene.traverse(o=>{if(o.userData.modelUrl)models.add(o.userData.modelUrl);if('isInstancedMesh'in o)instances+=o.userData.sourceInstances??(o as unknown as {count:number}).count;});
    return {width:gl.domElement.width,height:gl.domElement.height,pixelRatio:gl.getPixelRatio(),settings:useGame.getState().progress.settings,camera:{position:camera.position.toArray(),zoom:(camera as OrthographicCamera).zoom},instances,models:[...models].sort(),calls:gl.info.render.calls,triangles:gl.info.render.triangles,prepass:frame.enabled,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length};
   },
  };
  (window as unknown as {ecoAudit:typeof api}).ecoAudit=api;
  return()=>{clear();frame.dispose();delete(window as unknown as {ecoAudit?:typeof api}).ecoAudit;};
 },[gl,scene,camera,invalidate,context,frame]);
 return null;
}
