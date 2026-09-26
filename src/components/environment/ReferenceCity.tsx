import {outsideTrafficSituation} from '../../config/trafficSituation';
import {DumpGroundMaterial} from './DumpGroundMaterial';
import {roadStructures} from '../../config/roadStructures';
import {stationGuardrails} from '../../config/stationPerimeters';
import {dumpSite} from '../../config/dumpSite';
import {situationVisualKey} from '../../game/situationState';
import {SituationScene,CleanupTruck,dumpVisuals,dumpCollectionTarget} from '../city/ResolutionScene';
import {resolutionEase,resolutionRange} from '../../game/resolution';
import type {SituationVisual,VisualKey} from '../../config/situationVisuals';
import {worldPoint,frontYaw} from '../../config/referenceMap';
import {useEffect,useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import {Color} from 'three';
import {surfaceShader} from '../../assets/surfaceFinish';
import {Surface} from '../Asset';
import {AssetBatch} from '../city/AssetBatch';
import {DetailInstances} from './Landscape';
import {ReferenceWater} from './ReferenceWater';
import {Beach} from './Beach';
import {TransportSigns} from './TransportSigns';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {useGame} from '../../stores/gameStore';
import {keepDetail} from '../../config/graphics';
import {referenceAssets,referenceTrees,referenceTraffic,referenceFurniture,compositionPoint} from '../../config/referenceMap';
import {referenceDetails,referenceVisitorGroups,referenceLitter,riversideAssets,industrialSmoke,viaductTraffic} from '../../config/referenceDetails';
import {useCitySurfaces} from './cityGeometry';

// This alias keeps geometry construction independent of React render state.
import {terrainY as importHeight} from '../../config/referenceMap';
const forestObjects=referenceAssets.filter(p=>p.asset==='prop.stump'||(p.asset==='prop.excavator'&&compositionPoint(p.position[0],p.position[2])[0]<40&&compositionPoint(p.position[0],p.position[2])[1]>65));
const permanentAssets=referenceAssets.filter(p=>!forestObjects.includes(p));
const forestInitial:SituationVisual={assets:forestObjects,details:[]};
const forestVisuals:Record<VisualKey,SituationVisual>={initial:forestInitial,temporary:forestInitial,solved:{assets:forestObjects.filter(p=>p.asset==='prop.stump').map(p=>({...p,asset:'tree.oak',scale:[1,1,1]})),details:[]}};
const smokeInitial:SituationVisual={assets:[],details:industrialSmoke()};
const smokeVisuals:Record<VisualKey,SituationVisual>={initial:smokeInitial,temporary:smokeInitial,solved:{assets:[],details:industrialSmoke(true)}};
const litterInitial:SituationVisual={assets:[],details:referenceLitter};
const litterVisuals:Record<VisualKey,SituationVisual>={initial:litterInitial,temporary:litterInitial,solved:{assets:[],details:[]}};
export function ReferenceCity(){
 const buildSurfaces=useCitySurfaces(),q=useResolvedGraphics(),surfaces=useMemo(buildSurfaces,[]);
 const cleanRiver=useGame(s=>s.progress.problemStates.health_01==='SOLVED');
 const regrown=useGame(s=>s.progress.problemStates.nature_01==='SOLVED'),dumpStage=useGame(s=>situationVisualKey(s.progress,'pollution_01'));
 const forestResolution=useGame(s=>s.resolution?.problemId==='nature_01'?s.resolution:null);
 const originalLandColors=useMemo(()=>new Float32Array(surfaces.land.getAttribute('color').array),[surfaces]);
 const recoveredLandColors=useMemo(()=>{const positions=surfaces.land.getAttribute('position'),recovered=new Float32Array(originalLandColors);
  for(let i=0;i<positions.count;i++){const [u,v]=compositionPoint(positions.getX(i),positions.getZ(i)),clearing=((u-17)/19)**2+((v-80)/11)**2;
   const c=new Color().fromArray(originalLandColors,i*3);c.lerp(new Color('#92bd66'),Math.max(0,Math.min(1,(1.08-clearing)*5)));c.toArray(recovered,i*3);
  }return recovered;
 },[surfaces,originalLandColors]);
 const applyLand=(amount:number)=>{const colors=surfaces.land.getAttribute('color');for(let i=0;i<originalLandColors.length;i++)colors.array[i]=originalLandColors[i]+(recoveredLandColors[i]-originalLandColors[i])*amount;colors.needsUpdate=true;};
 useEffect(()=>{applyLand(forestResolution?0:regrown?1:0);},[regrown,forestResolution,surfaces,recoveredLandColors]);
 useFrame(()=>{if(forestResolution)applyLand(forestResolution.to==='solved'?resolutionEase(resolutionRange(forestResolution.clock.value,.4,.88)):0);});
 const trees=useMemo(()=>referenceTrees.filter((_,i)=>keepDetail(i,q.forestDensity)),[q.forestDensity]);
 const traffic=useMemo(()=>[...referenceTraffic.filter(outsideTrafficSituation),...viaductTraffic].filter((_,i)=>keepDetail(i,q.traffic)),[q.traffic]);
 const visitors=useMemo(()=>referenceVisitorGroups.filter((_,i)=>keepDetail(i,q.visitors)).flat(),[q.visitors]);
 const furnishing=useMemo(()=>[...referenceFurniture,...riversideAssets],[]);
 useEffect(()=>()=>{for(const [key,g]of Object.entries(surfaces))if(key!=='beach')g.dispose();},[surfaces]);
 return <group name='Cidade do vale — composição da referência'>
  <mesh geometry={surfaces.land} receiveShadow><meshStandardMaterial vertexColors roughness={1} side={2} onBeforeCompile={surfaceShader('grass')} customProgramCacheKey={()=>'valley-land'}/></mesh>
  <mesh geometry={surfaces.sea} receiveShadow><ReferenceWater/></mesh>
  <mesh geometry={surfaces.river} receiveShadow><ReferenceWater channel/></mesh>
  <mesh geometry={surfaces.canal} receiveShadow><ReferenceWater channel polluted={!cleanRiver} mouth={-27}/></mesh>
  <mesh geometry={surfaces.reservoir} receiveShadow><ReferenceWater/></mesh>
  <mesh geometry={surfaces.falls}><ReferenceWater fall/></mesh>
  <Beach surface={surfaces.beach}/>
  <mesh geometry={surfaces.ruined} receiveShadow><Surface id='asphalt.damaged'/></mesh>
  <mesh geometry={surfaces.yard} receiveShadow><DumpGroundMaterial stage={dumpStage}/></mesh>
  <mesh geometry={surfaces.dumpAccess} receiveShadow><Surface id='asphalt.default'/></mesh>
  <mesh geometry={surfaces.service} receiveShadow><meshStandardMaterial color='#a2a599' roughness={1} side={2} onBeforeCompile={surfaceShader('concrete')}/></mesh>
  <mesh geometry={surfaces.safety} receiveShadow><meshStandardMaterial color='#ebc55b' roughness={1} side={2}/></mesh>
  <group name='Lixão ambiental' userData={{stage:dumpStage}} position={worldPoint(...dumpSite.centre)} rotation={[0,frontYaw,0]}><SituationScene problemId="pollution_01" states={dumpVisuals} collection={dumpCollectionTarget}/></group>
  <CleanupTruck/>
  <mesh geometry={surfaces.walks} receiveShadow><Surface id='sidewalk.default'/></mesh>
  <mesh geometry={surfaces.sidewalks} receiveShadow><Surface id='sidewalk.default'/></mesh>
  <mesh geometry={surfaces.roads} receiveShadow><Surface id='asphalt.default'/></mesh>
  <mesh geometry={surfaces.paths} receiveShadow><Surface id='sidewalk.default'/></mesh>
  <mesh geometry={surfaces.cycles} receiveShadow><meshStandardMaterial color='#d78065' roughness={.95} side={2} onBeforeCompile={surfaceShader('asphalt')}/></mesh>
  <mesh geometry={surfaces.marks} receiveShadow><meshStandardMaterial color='#fff2d7' roughness={.92} side={2}/></mesh>
  <mesh geometry={surfaces.edging} castShadow receiveShadow><meshStandardMaterial color='#d6d7be' side={2} onBeforeCompile={surfaceShader('concrete')}/></mesh>
  <mesh geometry={surfaces.railDeck} castShadow receiveShadow><Surface id='sidewalk.default'/></mesh>
  <mesh geometry={surfaces.railMetal} receiveShadow><meshStandardMaterial color='#65808a' metalness={.5} roughness={.4} side={2}/></mesh>
  <AssetBatch placements={permanentAssets}/><SituationScene problemId="nature_01" states={forestVisuals}/><AssetBatch placements={traffic}/>
  <AssetBatch placements={roadStructures}/>
  <AssetBatch placements={stationGuardrails}/>
  <TransportSigns/>
  <AssetBatch placements={furnishing}/><AssetBatch placements={trees} castShadow={q.shadows}/>
  <DetailInstances details={referenceDetails}/><DetailInstances details={visitors}/><SituationScene problemId="health_02" states={smokeVisuals}/>
  <SituationScene problemId="health_01" states={litterVisuals}/>
 </group>;
}
