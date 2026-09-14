import {trafficSituation} from '../../config/trafficSituation';
import {useEffect} from 'react';
import {Html,useProgress} from '@react-three/drei';
import {problems,categories} from '../../content/problems';
import {useGame} from '../../stores/gameStore';
import {situationVisuals,type VisualKey} from '../../config/situationVisuals';
import {AssetBatch} from './AssetBatch';
import {preloadAsset} from '../Asset';
import {DetailInstances} from '../environment/Landscape';
import type {Progress} from '../../game/types';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {situationAnchors} from '../../config/referenceMap';
export const situationPreloadStatus={pending:false};
export function situationVisualKey(s:Progress,id:string):VisualKey{
 const state=s.problemStates[id];
 if(state==='SOLVED')return 'solved';
 if(state==='TEMPORARILY_SOLVED'||(state==='ACTIVE'&&s.decisions.findLast(d=>d.problemId===id)?.effectiveness==='TEMPORARY'))return 'temporary';
 return 'initial';
}
export function SituationLayers({interactive}:{interactive:boolean}){
 const {tier}=useResolvedGraphics();
 const s=useGame(v=>v.progress),select=useGame(v=>v.select),revisit=useGame(v=>v.revisit);
 useEffect(()=>{
  situationPreloadStatus.pending=true;
  const ids=[...new Set(Object.values(situationVisuals).flatMap(states=>Object.values(states).flatMap(v=>v.assets.map(a=>a.asset))))];
  let index=0,idle:number|undefined,timer:ReturnType<typeof setTimeout>|undefined,stopped=false;
  const schedule=()=>{
   if(stopped)return;
   if(index===ids.length){situationPreloadStatus.pending=false;return;}
   const next=()=>{
    if(stopped)return;
    // Visible assets have priority. Warm upcoming outcomes one at a time.
    if(!useProgress.getState().active)preloadAsset(ids[index++],tier);
    timer=setTimeout(schedule,80);
   };
   if('requestIdleCallback' in window)idle=window.requestIdleCallback(next,{timeout:500});else timer=setTimeout(next,80);
  };
  timer=setTimeout(schedule,500);
  return()=>{stopped=true;clearTimeout(timer);if(idle!==undefined)window.cancelIdleCallback(idle);};
 },[tier]);
 return <group name="Situações da cidade">
  {problems.map(p=>{
   const state=s.problemStates[p.id],key=situationVisualKey(s,p.id),v=p.id==='pollution_02'?trafficSituation[key]:situationVisuals[p.id][key],category=categories[p.category];
   return <group key={p.id} name={p.id} userData={{problem:p.id,state,visualState:key}}>
    <group position={p.worldPosition} rotation={[0,situationAnchors[p.id].yaw??0,0]}><AssetBatch placements={v.assets}/><DetailInstances details={v.details}/></group>
    {s.phase==='OVERVIEW'&&['AVAILABLE','TEMPORARILY_SOLVED'].includes(state)&&<Html position={p.markerPosition} center zIndexRange={[20,10]}>
     <button className={'marker '+category.shape} style={{'--marker-color':category.color} as React.CSSProperties}
      onClick={()=>state==='TEMPORARILY_SOLVED'?revisit(p.id):select(p.id)} disabled={!interactive} aria-label={'Analisar: '+p.title} data-problem={p.id} data-visual-state={key}>
      <span className="marker-icon">{p.markerIcon}</span><span className="marker-label">{p.title}<b>{state==='TEMPORARILY_SOLVED'?'Reavaliar':'Explorar'} →</b></span>
     </button>
    </Html>}
   </group>;
  })}
 </group>;
}

