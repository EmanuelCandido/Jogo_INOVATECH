import {Suspense,useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame,useThree} from '@react-three/fiber';
import {Group} from 'three';
import {assetRegistry} from '../../assets/registry';
import {modelUrl} from '../../assets/modelLayout';
import {situationVisuals,type SituationVisual,type VisualKey} from '../../config/situationVisuals';
import {dumpScenery,dumpManeuver,dumpCollectionTarget} from '../../config/dumpSite';
import {facing,worldPoint} from '../../config/referenceMap';
import type {LandscapeDetail} from '../../config/landscape';
import type {Placement,Vec3} from '../../game/types';
import {planVisualChanges,resolutionEase,resolutionRange,sampleVisualChange,type Resolution,type VisualChange} from '../../game/resolution';
import {situationVisualKey} from '../../game/situationState';
import {preparationActivity} from '../../game/resourcePreparation';
import {useGame} from '../../stores/gameStore';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {AssetBatch} from './AssetBatch';
import {DetailInstances} from '../environment/Landscape';

function Timeline({resolution,interactive}:{resolution:Resolution;interactive:boolean}) {
 const {tier}=useResolvedGraphics(),{gl,invalidate}=useThree();
 const resume=useRef(true),lastShadow=useRef(0);
 const urls=useMemo(()=>{
  const variants=situationVisuals[resolution.problemId];
  const placements=[...variants[resolution.from].assets,...variants[resolution.to].assets];
  if(resolution.problemId==='pollution_01')placements.push(...dumpScenery[resolution.from],...dumpScenery[resolution.to],{asset:'prop.cleanupTruck',position:[0,0,0]});
  return [...new Set(placements.map(p=>assetRegistry[p.asset]).filter(a=>a.kind==='glb').map(a=>modelUrl(a,tier)))];
 },[resolution,tier]);
 // Start the clock only after the actual outcome's models have decoded.
 useGLTF(urls);
 useEffect(()=>{
  const wake=()=>{resume.current=true;invalidate();};
  document.addEventListener('visibilitychange',wake);wake();
  return()=>document.removeEventListener('visibilitychange',wake);
 },[invalidate]);
 useEffect(()=>{invalidate();},[interactive,invalidate]);
 useFrame((_state,delta)=>{
  if(!interactive||document.hidden)return;
  const current=useGame.getState();
  if(current.resolution!==resolution)return;
  if(current.progress.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches){current.finishResolution(resolution.sequence);return;}
  preparationActivity(gl.domElement).touch();
  // A background tab or a late model must not consume the visible animation.
  if(resume.current)resume.current=false;
  else resolution.clock.value=Math.min(1,resolution.clock.value+Math.min(delta,.1)/resolution.duration);
  const now=performance.now();
  if(now-lastShadow.current>180||resolution.clock.value===1){gl.shadowMap.needsUpdate=true;lastShadow.current=now;}
  invalidate();
  if(resolution.clock.value===1)current.finishResolution(resolution.sequence);
 },-50);
 return null;
}
export function ResolutionDirector({interactive}:{interactive:boolean}) {
 const resolution=useGame(s=>s.resolution);
 return resolution&&<Suspense fallback={null}><Timeline key={resolution.sequence} resolution={resolution} interactive={interactive}/></Suspense>;
}

type Item=Placement|LandscapeDetail;
function MovingItem({change,resolution,collection}:{change:VisualChange<Item>;resolution:Resolution;collection?:Vec3}) {
 const ref=useRef<Group>(null),item=change.after??change.before!;
 const local=useMemo(()=>({...item,position:[0,0,0] as Vec3,scale:[1,1,1] as Vec3,rotation:[0,0,0] as Vec3}),[item]);
 const apply=()=>{
  const pose=sampleVisualChange(change,resolution.clock.value,collection),group=ref.current;
  if(!group)return;
  group.visible=pose.visible;group.position.set(...pose.position);group.scale.set(...pose.scale);group.rotation.set(...pose.rotation);
 };
 useLayoutEffect(apply,[change,resolution,collection]);
 useFrame(apply);
 return <group ref={ref} name={'Transformação: '+('asset'in item?item.asset:item.shape)}>
  {'asset'in local?<AssetBatch placements={[local]}/>:<DetailInstances details={[local]}/>}
 </group>;
}
function ChangingVisual({before,after,resolution,collection}:{before:SituationVisual;after:SituationVisual;resolution:Resolution;collection?:Vec3}) {
 const assets=useMemo(()=>planVisualChanges(before.assets,after.assets),[before,after]);
 const details=useMemo(()=>planVisualChanges(before.details,after.details),[before,after]);
 return <group name="Obras e recuperação em andamento">
  <AssetBatch placements={assets.stable}/><DetailInstances details={details.stable}/>
  {assets.changes.map((change,i)=><MovingItem key={'asset'+i} change={change} resolution={resolution} collection={collection}/>)}
  {details.changes.map((change,i)=><MovingItem key={'detail'+i} change={change} resolution={resolution}/>)}
 </group>;
}
export function SituationScene({problemId,states,collection}:{problemId:string;states:Record<VisualKey,SituationVisual>;collection?:Vec3}) {
 const key=useGame(s=>situationVisualKey(s.progress,problemId));
 const resolution=useGame(s=>s.resolution?.problemId===problemId?s.resolution:null);
 if(resolution)return <ChangingVisual before={states[resolution.from]} after={states[resolution.to]} resolution={resolution} collection={collection}/>;
 const visual=states[key];
 return <><AssetBatch placements={visual.assets}/><DetailInstances details={visual.details}/></>;
}

export function CleanupTruck() {
 const resolution=useGame(s=>s.resolution?.problemId==='pollution_01'?s.resolution:null);
 return resolution&&<MovingTruck resolution={resolution}/>;
}
function MovingTruck({resolution}:{resolution:Resolution}) {
 const ref=useRef<Group>(null);
 const vehicle=useMemo<Placement[]>(()=>[{asset:'prop.cleanupTruck',position:[0,0,0],scale:[1.3,1.3,1.3]}],[]);
 useFrame(()=>{
  if(!ref.current)return;
  const t=resolution.clock.value;
  const sample=t<.20?resolutionEase(t/.20)*36:t<.70?36:36+resolutionEase(resolutionRange(t,.70,.99))*(dumpManeuver.length-1-36);
  const a=dumpManeuver[Math.floor(sample)],b=dumpManeuver[Math.min(dumpManeuver.length-1,Math.floor(sample)+1)],f=sample%1;
  ref.current.position.set(...worldPoint(a.point[0]+(b.point[0]-a.point[0])*f,a.point[1]+(b.point[1]-a.point[1])*f,.08));
  ref.current.rotation.y=facing(a.heading[0]+(b.heading[0]-a.heading[0])*f,a.heading[1]+(b.heading[1]-a.heading[1])*f);
  ref.current.visible=t>0&&t<.99;
  ref.current.scale.setScalar(resolutionEase(resolutionRange(t,0,.035))*(1-resolutionEase(resolutionRange(t,.955,.99))));
 });
 return <group ref={ref} visible={false} name="Caminhão recolhendo os resíduos"><AssetBatch placements={vehicle}/></group>;
}

export const dumpVisuals:Record<VisualKey,SituationVisual>={
 initial:{assets:dumpScenery.initial,details:[]},temporary:{assets:dumpScenery.temporary,details:[]},solved:{assets:dumpScenery.solved,details:[]},
};
export {dumpCollectionTarget};
