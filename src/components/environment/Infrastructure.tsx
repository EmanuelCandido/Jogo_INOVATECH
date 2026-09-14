import {RiverBanks} from './RiverBanks';
import {mountainGeometry} from './mountainGeometry';
import {useEffect,useMemo} from 'react';
import {ExtrudeGeometry,Shape} from 'three';
import {infrastructure} from '../../config/infrastructure';
import {lotPaving} from '../../config/districts';
import {coastline,landOutlines} from '../../config/terrain';
import {AssetBatch} from '../city/AssetBatch';
import type {Placement} from '../../game/types';
import {Waterfront} from './Waterfront';
import {CivicScenery} from './CivicScenery';
import {ParkGarden} from './ParkGarden';
import {CoastalAvenue} from './CoastalAvenue';
import {Landscape} from './Landscape';
import {GrassMaterial} from './GrassMaterial';
import {WaterMaterial} from './WaterMaterial';
import {MountainMaterial} from './MountainMaterial';
import {mountainRocks} from '../../config/mountainRocks';
import {pierShoreOpening} from '../../config/publicSpaces';
import {Beach} from './Beach';
function Mainland(){
  const geometry=useMemo(()=>{
    const land=landOutlines().map(points=>{const shape=new Shape();points.forEach((p,i)=>i?shape.lineTo(p.x,-p.z):shape.moveTo(p.x,-p.z));shape.closePath();return new ExtrudeGeometry(shape,{depth:1.4,bevelEnabled:false,steps:1});});
    const hills=mountainGeometry();
    return {land,hills};
  },[]);
  useEffect(()=>()=>{geometry.land.forEach(g=>g.dispose());geometry.hills.dispose();},[geometry]);
  const rocks=useMemo<Placement[]>(()=>coastline.filter((p,i)=>p.z>-58&&p.z<42&&!pierShoreOpening(p.x,p.z)&&i%3===0).map((p,i)=>({asset:'prop.rock',position:[p.x,-.51,p.z],scale:[1.1+i%3*.17,2.35+(i%3)*.15,1.08],rotation:[0,i*1.7,0]})),[]);
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.65,0]} receiveShadow><planeGeometry args={[2500,2500]} /><WaterMaterial color='#008de9'/></mesh>
    {geometry.land.map((g,i)=><mesh key={i} geometry={g} rotation={[-Math.PI/2,0,0]} position={[0,-1.42,0]} receiveShadow castShadow>
      <GrassMaterial attach='material-0'/><meshStandardMaterial attach='material-1' color='#b7a58e' roughness={1}/>
    </mesh>)}
    <mesh geometry={geometry.hills} receiveShadow castShadow><MountainMaterial/></mesh>
    <Beach/>
    <AssetBatch placements={rocks}/>
    <AssetBatch placements={mountainRocks}/>
  </>;
}
const pavedInfrastructure=[...infrastructure,...lotPaving];
export function Infrastructure(){return <group><Mainland/><RiverBanks/><Waterfront/><CivicScenery/><ParkGarden/><Landscape/><CoastalAvenue/><AssetBatch placements={pavedInfrastructure}/></group>;}
