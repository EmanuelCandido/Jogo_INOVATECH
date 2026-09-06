import {useEffect,useMemo} from 'react';
import {Html} from '@react-three/drei';
import {BufferGeometry,Float32BufferAttribute,Color} from 'three';
import {problems,categories} from '../../content/problems';
import {useGame} from '../../stores/gameStore';
import {situationVisuals,type VisualKey} from '../../config/situationVisuals';
import {riverCenter} from '../../config/terrain';
import {AssetBatch} from './AssetBatch';
import {preloadAsset} from '../Asset';
import {DetailInstances} from '../environment/Landscape';
import {WaterMaterial} from '../environment/WaterMaterial';
import type {Progress} from '../../game/types';
export function situationVisualKey(s:Progress,id:string):VisualKey{
 const state=s.problemStates[id];
 if(state==='SOLVED')return 'solved';
 if(state==='TEMPORARILY_SOLVED'||(state==='ACTIVE'&&s.decisions.findLast(d=>d.problemId===id)?.effectiveness==='TEMPORARY'))return 'temporary';
 return 'initial';
}
function RiverCondition({state}:{state:VisualKey}){
 const geometry=useMemo(()=>{
  const points:number[]=[],indices:number[]=[],colors:number[]=[];
  const pollution=new Color(state==='solved'?'#159ed2':state==='temporary'?'#658f7a':'#71815a');
  for(let i=0;i<=30;i++){
   const x=-20+i/3,z=riverCenter(x);
   points.push(x,-.625,z-1.38,x,-.625,z+1.38);
   const color=new Color('#008de9').lerp(pollution,Math.sin(i/30*Math.PI)**.6);
   colors.push(...color.toArray(),...color.toArray());
   if(i<30){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[state]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} receiveShadow><WaterMaterial color="#ffffff" vertexColors/></mesh>;
}
export function SituationLayers({interactive}:{interactive:boolean}){
 const s=useGame(v=>v.progress),select=useGame(v=>v.select),revisit=useGame(v=>v.revisit);
 useEffect(()=>{
  const ids=new Set(Object.values(situationVisuals).flatMap(states=>Object.values(states).flatMap(v=>v.assets.map(a=>a.asset))));
  ids.forEach(preloadAsset);
 },[]);
 return <group name="Situações da cidade">
  <RiverCondition state={situationVisualKey(s,'health_01')}/>
  {problems.map(p=>{
   const state=s.problemStates[p.id],key=situationVisualKey(s,p.id),v=situationVisuals[p.id][key],category=categories[p.category];
   return <group key={p.id} name={p.id} userData={{problem:p.id,state,visualState:key}}>
    <group position={p.worldPosition}><AssetBatch placements={v.assets}/><DetailInstances details={v.details}/></group>
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
