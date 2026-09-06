import {useMemo} from 'react';
import {Html} from '@react-three/drei';
import {Asset} from './Asset';
import {AssetBatch} from './city/AssetBatch';
import {Infrastructure} from './environment/Infrastructure';
import {districtBuildings,districtProps,forest,regionLabels} from '../config/districts';
import {environment} from '../config/world';
import {useGame} from '../stores/gameStore';
import type {Placement} from '../game/types';
import {useResolvedGraphics} from '../stores/graphicsStore';
import {keepDetail} from '../config/graphics';
import {DetailedCity} from './environment/DetailedCity';
import {inSituationClearing} from '../config/situationSites';
import {SituationLayers} from './city/SituationLayers';
export function City({interactive}:{interactive:boolean}){
 const phase=useGame(s=>s.progress.phase),q=useResolvedGraphics();
 const vegetation=useMemo(()=>Object.entries(forest.filter((p,i)=>!inSituationClearing(p.position[0],p.position[2])&&keepDetail(i,q.forestDensity)).reduce<Record<string,Placement[]>>((tiles,p)=>{
  const key=Math.floor(p.position[0]/12)+','+Math.floor(p.position[2]/12);(tiles[key]??=[]).push(p);return tiles;
 },{})),[q.forestDensity]);
 const props=useMemo(()=>districtProps.filter((p,i)=>{
  if(!/^prop\.(car\.|bus)/.test(p.asset))return true;
  // The transport situation owns only this stretch of the existing avenue.
  if(p.position[0]>1&&p.position[0]<20&&Math.abs(p.position[2]+11)<1)return false;
  return keepDetail(i,q.traffic);
 }),[q.traffic]);
 return <group>
  <Infrastructure/><DetailedCity/>
  {environment.map((p,i)=><Asset key={i} {...p}/>)}
  <AssetBatch placements={[...districtBuildings,...props]}/>
  {vegetation.map(([key,placements])=><AssetBatch key={key} placements={placements} castShadow={placements.some(p=>p.position[0]>-34&&p.position[2]>-29&&p.position[2]<30)}/>)}
  {phase==='OVERVIEW'&&regionLabels.map(r=><Html key={r.name} position={r.position} center zIndexRange={[3,1]}><span className="region-label">{r.name}</span></Html>)}
  <SituationLayers interactive={interactive}/>
 </group>;
}
