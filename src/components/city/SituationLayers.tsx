import {trafficSituation} from '../../config/trafficSituation';
import {useEffect} from 'react';
import {Html,useProgress} from '@react-three/drei';
import {problems,categories} from '../../content/problems';
import {useGame} from '../../stores/gameStore';
import {situationVisuals} from '../../config/situationVisuals';
import {SituationScene,dumpCollectionTarget} from './ResolutionScene';
import {situationVisualKey} from '../../game/situationState';
export {situationVisualKey} from '../../game/situationState';
import {preloadAsset} from '../Asset';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {situationAnchors} from '../../config/referenceMap';
import {useThree} from '@react-three/fiber';
import {preparationActivity,schedulePreparation} from '../../game/resourcePreparation';
export const situationPreloadStatus={pending:false};
export function SituationLayers({interactive}:{interactive:boolean}){
 const gl=useThree(s=>s.gl);
 const {tier}=useResolvedGraphics();
 const s=useGame(v=>v.progress),select=useGame(v=>v.select),revisit=useGame(v=>v.revisit);
 useEffect(()=>{
  situationPreloadStatus.pending=true;
  const ids=[...new Set(['prop.cleanupTruck',...Object.values(situationVisuals).flatMap(states=>Object.values(states).flatMap(v=>v.assets.map(a=>a.asset)))])];
  let index=0;const activity=preparationActivity(gl.domElement);
  const job=schedulePreparation(gl.domElement,'models',()=>{
   // Visible loads and interaction have priority; retain every future outcome.
   if(index<ids.length)preloadAsset(ids[index++],tier);
   const more=index<ids.length;if(!more)situationPreloadStatus.pending=false;return more;
  },()=>!document.hidden&&!activity.busy()&&!useProgress.getState().active,500);
  return()=>{job.cancel();situationPreloadStatus.pending=false;};
 },[tier,gl]);
 return <group name="Situações da cidade">
  {problems.map(p=>{
   const state=s.problemStates[p.id],key=situationVisualKey(s,p.id),states=p.id==='pollution_02'?trafficSituation:situationVisuals[p.id],category=categories[p.category];
   return <group key={p.id} name={p.id} userData={{problem:p.id,state,visualState:key}}>
    <group position={p.worldPosition} rotation={[0,situationAnchors[p.id].yaw??0,0]}><SituationScene problemId={p.id} states={states} collection={p.id==='pollution_01'?dumpCollectionTarget:undefined}/></group>
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

