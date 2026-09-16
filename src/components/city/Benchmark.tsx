import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {BatchedMesh,Matrix4,OrthographicCamera,Mesh,LessDepth} from 'three';
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
import {maximumGraphicsSettings,resolveGraphics} from '../../config/graphics';
import {useGraphicsRuntime} from '../../stores/graphicsStore';
import {profileMaterials} from '../../game/materialProfile';
import {depthFrameRenderer} from '../../game/depthPrepass';
import {batchIsolatedModels} from '../../game/modelBatchExperiment';
import {cacheLeafHashes} from '../../game/leafHashExperiment';
import {skipEmptyLeafTones} from '../../game/leafMaskExperiment';
import {riversideAssets} from '../../config/referenceDetails';
import {preparationActivity,preparationSnapshot} from '../../game/resourcePreparation';
import {startShaderWarmup,warmupRoots,wholeShaderWarmup} from '../../game/shaderWarmup';

/** Opt-in diagnostic bridge. Not loaded in ordinary games. No synchronous GPU waits. */
export default function Benchmark(){
 const {gl,scene,camera,invalidate}=useThree();
 const state=useRef({active:false,gpuEnabled:true,last:0,frames:[] as number[],cpu:[] as number[],gpu:[] as number[]});
 useFrame(()=>{if(state.current.active&&!document.hidden)invalidate();},-100);
 useEffect(()=>{
  const context=gl.getContext() as WebGL2RenderingContext;
  const timer=context.getExtension('EXT_disjoint_timer_query_webgl2');
  const rendererExt=context.getExtension('WEBGL_debug_renderer_info');
  const pending:WebGLQuery[]=[];
  const frameRenderer=depthFrameRenderer(gl),original=frameRenderer.render;
  let locked: {settings:GameSettings;width:number;height:number;pixelRatio:number}|null=null;
  const violations=new Set<string>();
  let uploads=0,uploadBytes=0;
  let selectionStart={sphereTests:0,regionTests:0};
  const originalUpload=context.bufferSubData;
  // Only instrument the diagnostic route. This counts submitted buffer bytes,
  // not resident VRAM or time spent transferring data to the GPU.
  context.bufferSubData=function(this:WebGL2RenderingContext,...args:unknown[]){
   if(state.current.active){
    const source=args[2] as ArrayBufferView&{BYTES_PER_ELEMENT?:number};
    const bytes=source.BYTES_PER_ELEMENT??1,offset=Number(args[3]??0),length=Number(args[4]??0);
    uploads++;uploadBytes+=length?length*bytes:source.byteLength-offset*bytes;
   }
   return Reflect.apply(originalUpload,this,args);
  } as typeof context.bufferSubData;
  let undoBatch:()=>void=()=>{};
  let undoIsolatedBatch:()=>void=()=>{};
  let undoLeafHash:()=>void=()=>{};
  let undoLeafMask:()=>void=()=>{};
  let undoWarmup:()=>void=()=>{};
  let undoBackgroundOrder:()=>void=()=>{};
  let undoReferenceBounds:()=>void=()=>{};
  let profiling=false;
  frameRenderer.render=function(s,c){
   const data=state.current,measuring=data.active&&!document.hidden;
   if(data.active&&locked){
    if(document.hidden)violations.add('Aba oculta durante a amostra');
    if(gl.domElement.width!==locked.width||gl.domElement.height!==locked.height||gl.getPixelRatio()!==locked.pixelRatio)violations.add('Resolução alterada durante a amostra');
    const settings=useGame.getState().progress.settings;
    for(const key of Object.keys(maximumGraphicsSettings) as Array<keyof typeof maximumGraphicsSettings>)if(settings[key]!==locked.settings[key])violations.add(`Configuração alterada: ${key}`);
    if(!gl.shadowMap.enabled||scene.userData.benchmarkDisableCulling)violations.add('Configuração de renderização alterada');
   }
   const now=performance.now();
   if(measuring&&data.last)data.frames.push(now-data.last);
   if(measuring)data.last=now;
   if(timer&&data.gpuEnabled&&(measuring||pending.length)){
    const disjoint=context.getParameter(timer.GPU_DISJOINT_EXT);
    for(let i=pending.length-1;i>=0;i--){
     if(disjoint||context.getQueryParameter(pending[i],context.QUERY_RESULT_AVAILABLE)){
      if(!disjoint&&measuring)data.gpu.push(context.getQueryParameter(pending[i],context.QUERY_RESULT)/1e6);
      context.deleteQuery(pending[i]);pending.splice(i,1);
     }
    }
   }
   const query=measuring&&data.gpuEnabled&&timer&&pending.length<4?context.createQuery():null;
   if(query)context.beginQuery(timer!.TIME_ELAPSED_EXT,query);
   const start=performance.now();
   original.call(this,s,c);
   if(measuring)data.cpu.push(performance.now()-start);
   if(query){context.endQuery(timer!.TIME_ELAPSED_EXT);pending.push(query);}
  };
  const cameraState=()=>({position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom});
  const api={
   cameraState,
   maximumSettings:maximumGraphicsSettings,
   renderer:rendererExt?context.getParameter(rendererExt.UNMASKED_RENDERER_WEBGL):context.getParameter(context.RENDERER),
   gpuTimer:!!timer,multiDraw:!!context.getExtension('WEBGL_multi_draw'),
   ready(){return !situationPreloadStatus.pending&&!useProgress.getState().active;},
   riversidePlacements(){return riversideAssets;},
   preparation(){return {busy:preparationActivity(gl.domElement).busy(),loading:useProgress.getState().active,jobs:preparationSnapshot(gl.domElement)};},
   restartWarmup(){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de reiniciar a preparação');
    undoWarmup();const count=warmupRoots(scene).length;
    const job=startShaderWarmup(gl,scene,camera,()=>!document.hidden&&!useProgress.getState().active,invalidate);undoWarmup=job.cancel;return count;
   },
   async warmupWhole(){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes do controle de preparação');
    profiling=true;try{return await wholeShaderWarmup(gl,scene,camera);}finally{profiling=false;invalidate();}
   },
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
   start(maximum=false,gpuEnabled=true){
    if(profiling)throw new Error('Aguarde o perfil de materiais');
    locked=null;violations.clear();uploads=0;uploadBytes=0;
    selectionStart=api.visibilityStats();
    if(maximum){
     const snapshot=api.snapshot(),settings=useGame.getState().progress.settings;
     for(const key of Object.keys(maximumGraphicsSettings) as Array<keyof typeof maximumGraphicsSettings>)if(settings[key]!==maximumGraphicsSettings[key])throw new Error(`Benchmark exige máximo: ${key}`);
     if(!gl.shadowMap.enabled||scene.userData.benchmarkDisableCulling||snapshot.modelUrls.some(url=>url.endsWith('-low.glb')))throw new Error('Benchmark exige sombras, modelos completos e visibilidade normal');
     const shadows=api.shadowInfo();
     if(!shadows.lights.some(item=>{const light=item as {cast:boolean;size:number[];map:boolean};return light.cast&&light.map&&light.size[0]===4096&&light.size[1]===4096;}))throw new Error('Sombras Ultra ainda não estão prontas');
     locked={settings:{...settings},width:snapshot.width,height:snapshot.height,pixelRatio:gl.getPixelRatio()};
    }
    pending.forEach(q=>context.deleteQuery(q));pending.length=0;state.current={active:true,gpuEnabled,last:0,frames:[],cpu:[],gpu:[]};invalidate();
   },
   stop(){state.current.active=false;const checks=api.visibilityStats();const result={...api.snapshot(),frame:frameMetrics(state.current.frames),cpu:frameMetrics(state.current.cpu),gpu:frameMetrics(state.current.gpu),bufferUploads:uploads,bufferUploadBytes:uploadBytes,visibilityChecks:{sphereTests:checks.sphereTests-selectionStart.sphereTests,regionTests:checks.regionTests-selectionStart.regionTests},maximumGuard:locked?{valid:violations.size===0,violations:[...violations]}:null,presentationVerified:false};locked=null;return result;},
   snapshot(){
    let meshes=0,instances=0;const materials=new Set();scene.traverse(o=>{if('isMesh' in o){meshes++;const m=(o as unknown as {material:unknown}).material;for(const material of Array.isArray(m)?m:[m])materials.add(material);}if('isInstancedMesh' in o)instances+=o.userData.sourceInstances??(o as unknown as {count:number}).count;});
    const sourceBytes=[...instanceVisibility].reduce((sum,e)=>sum+e.matrices.byteLength+(e.colors?.byteLength??0),0);
    const modelUrls=new Set<string>();scene.traverse(o=>{if(o.userData.modelUrl)modelUrls.add(o.userData.modelUrl);});
    const settings=useGame.getState().progress.settings;
    return {calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length,meshes,instances,materials:materials.size,sourceBytes,width:gl.domElement.width,height:gl.domElement.height,pixelRatio:gl.getPixelRatio(),settings,resolvedGraphics:resolveGraphics(settings,useGraphicsRuntime.getState().automatic),modelUrls:[...modelUrls].sort(),camera:{position:camera.position.toArray(),zoom:(camera as OrthographicCamera).zoom}};
   },
   draw(){invalidate();},
   renderPath(){return {...frameRenderer.selection.snapshot(),enabled:frameRenderer.enabled,automatic:frameRenderer.automatic};},
   automaticDepthPrepass(recalibrate=true){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de calibrar');
    frameRenderer.automatic=true;if(recalibrate)frameRenderer.selection.reset();frameRenderer.enabled=frameRenderer.selection.preferred;invalidate();
   },
   shadowInfo(){const lights:unknown[]=[];scene.traverse(o=>{if('isDirectionalLight' in o){const l=o as unknown as import('three').DirectionalLight;lights.push({cast:l.castShadow,size:l.shadow.mapSize.toArray(),camera:[l.shadow.camera.near,l.shadow.camera.far,l.shadow.camera.left,l.shadow.camera.right],map:!!l.shadow.map});}});return {enabled:gl.shadowMap.enabled,type:gl.shadowMap.type,lights};},
   refreshShadows(){gl.shadowMap.needsUpdate=true;invalidate();},
   culling(enabled:boolean){scene.userData.benchmarkDisableCulling=!enabled;invalidate();},
   freeze(){for(const clock of ambientClocks)clock.uniform.value=clock.initial;invalidate();},
   clocks(){return [...ambientClocks].map(clock=>clock.uniform.value);},
   buffers(){return [...instanceVisibility].map(e=>({id:e.mesh.uuid,version:e.mesh.instanceMatrix.version,updates:e.updates,count:e.bounds.length}));},
   referenceBounds(enabled:boolean){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de trocar os limites diagnósticos');
    undoReferenceBounds();undoReferenceBounds=()=>{};
    const entries=[...instanceVisibility],restore:Array<()=>void>=[],matrix=new Matrix4();let spheres=0;
    // Rebuild the legacy reference from original geometry/matrices, independently
    // of the packed values. These objects exist only during the opt-in comparison.
    for(const entry of entries){
     entry.setSpatial(false);entry.restore();if(!enabled)continue;
     const bounds=Array.from({length:entry.bounds.length},(_,i)=>entry.mesh.geometry.boundingSphere!.clone().applyMatrix4(matrix.fromArray(entry.matrices,i*16)));
     const original=entry.bounds.intersects;entry.bounds.intersects=(frustum,index)=>frustum.intersectsSphere(bounds[index]);spheres+=bounds.length;
     restore.push(()=>{entry.bounds.intersects=original;entry.restore();});
    }
    undoReferenceBounds=()=>restore.forEach(fn=>fn());invalidate();return {enabled,spheres};
   },
   visibilityStats(){let sphereTests=0,regionTests=0;for(const e of instanceVisibility){sphereTests+=e.sphereTests;regionTests+=e.regionTests;}return {sphereTests,regionTests};},
   profileVisibility(spatial:boolean,steps=240){
    if(state.current.active||profiling||!Number.isInteger(steps)||steps<1||steps>1000)throw new Error('Pare a amostra e use até 1000 passos');
    const entries=[...instanceVisibility],probe=camera.clone() as OrthographicCamera;
    const reference=camera.position.clone(),originalZoom=(camera as OrthographicCamera).zoom;
    const before=api.visibilityStats();let elapsedMs=0,countChecksum=0;
    // Synthetic CPU-only camera path: no draw, no presentation/FPS claim.
    // Mode changes and cold index construction are outside the timing window.
    entries.forEach(e=>e.setSpatial(spatial));
    try{
     for(let step=0;step<steps;step++){
      const a=step/steps*Math.PI*2;probe.position.copy(reference);probe.position.x+=Math.sin(a)*80;probe.position.z+=Math.cos(a)*65;
      probe.zoom=originalZoom*(.7+.6*(1+Math.sin(a*3)));probe.updateProjectionMatrix();probe.updateMatrixWorld();
      const start=performance.now();entries.forEach(e=>e.select(probe));elapsedMs+=performance.now()-start;
      for(const e of entries)countChecksum=(Math.imul(countChecksum,31)+e.mesh.count)>>>0;
     }
     const after=api.visibilityStats();return {spatial,steps,elapsedMs,countChecksum,sphereTests:after.sphereTests-before.sphereTests,regionTests:after.regionTests-before.regionTests,includesRendering:false};
    }finally{entries.forEach(e=>e.select(camera));invalidate();}
   },
   async profileMaterials(frames=3){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de medir materiais');
    profiling=true;
    try{return {...await profileMaterials(gl,invalidate,frames,frameRenderer),depthPrepass:frameRenderer.enabled};}finally{profiling=false;invalidate();}
   },
   depthPrepass(enabled:boolean){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de alterar a passagem experimental');
    frameRenderer.automatic=false;frameRenderer.enabled=enabled;invalidate();
   },
   depthOrder(enabled:boolean){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de alterar a ordem de profundidade');
    frameRenderer.frontToBack=enabled;invalidate();
   },
   depthFrontFaces(enabled:boolean){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de alterar as faces de profundidade');
    frameRenderer.frontFaces=enabled;invalidate();
   },
   isolatedModels(enabled:boolean){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de alterar os lotes');
    undoIsolatedBatch();undoIsolatedBatch=()=>{};
    let result={sourceDraws:0,batchDraws:0};
    if(enabled){if(!api.multiDraw)throw new Error('WEBGL_multi_draw indisponível');const batch=batchIsolatedModels(scene);undoIsolatedBatch=batch.dispose;result={sourceDraws:batch.sourceDraws,batchDraws:batch.batchDraws};}
    gl.shadowMap.needsUpdate=true;invalidate();return result;
   },
   leafEmptyMasks(enabled:boolean){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de alterar o cálculo das folhas');
    undoLeafMask();undoLeafMask=()=>{};
    const result=enabled?skipEmptyLeafTones(scene):null;
    if(result)undoLeafMask=result.dispose;
    invalidate();return {materials:result?.materials??0};
   },
   leafHashes(enabled:boolean,cells=false){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de alterar o cache das folhas');
    undoLeafHash();undoLeafHash=()=>{};
    let result={materials:0,texels:0,bytes:0};
    if(enabled){const cache=cacheLeafHashes(gl,scene,cells);undoLeafHash=cache.dispose;result={materials:cache.materials,texels:cache.texels,bytes:cache.bytes};}
    invalidate();return result;
   },
   spatialVisibility(enabled:boolean){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de alterar a seleção espacial');
    for(const entry of instanceVisibility)entry.setSpatial(enabled);invalidate();
   },
   backgroundOrder(mode:'original'|'late'|'late-strict'){
    if(state.current.active||profiling)throw new Error('Pare a amostra antes de alterar a ordem diagnóstica');
    undoBackgroundOrder();undoBackgroundOrder=()=>{};
    if(mode==='original'){invalidate();return;}
    const restore:Array<()=>void>=[];
    scene.traverse(object=>{
     if(!(object instanceof Mesh)||Array.isArray(object.material))return;
     const material=object.material,key=material.customProgramCacheKey();
     const land=key==='valley-land',water=key.startsWith('valley-water-3-false-false-');
     if(!land&&!water)return;
     const order=object.renderOrder,depth=material.depthFunc;
     object.renderOrder=land?1:2;
     if(land&&mode==='late-strict')material.depthFunc=LessDepth;
     restore.push(()=>{object.renderOrder=order;material.depthFunc=depth;});
    });
    undoBackgroundOrder=()=>restore.forEach(fn=>fn());invalidate();
   },
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
  return()=>{undoReferenceBounds();undoWarmup();undoLeafMask();undoLeafHash();undoIsolatedBatch();undoBackgroundOrder();undoBatch();frameRenderer.render=original;context.bufferSubData=originalUpload;pending.forEach(q=>context.deleteQuery(q));delete (window as unknown as {ecoBenchmark?:typeof api}).ecoBenchmark;};
 },[gl,scene,camera,invalidate]);
 return null;
}
