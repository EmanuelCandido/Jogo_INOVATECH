import {useEffect,useMemo} from 'react';
import {BufferGeometry,ExtrudeGeometry,Float32BufferAttribute,Shape,Vector3} from 'three';
import {infrastructure} from '../../config/infrastructure';
import {lotPaving} from '../../config/districts';
import {coastline,landOutlines,terrainHeight} from '../../config/terrain';
import {AssetBatch} from '../city/AssetBatch';
import type {Placement} from '../../game/types';
import {Waterfront} from './Waterfront';
import {CivicScenery} from './CivicScenery';
import {ParkGarden} from './ParkGarden';
import {CoastalAvenue} from './CoastalAvenue';
import {Landscape} from './Landscape';
import {GrassMaterial} from './GrassMaterial';
import {WaterMaterial} from './WaterMaterial';
import {pierShoreOpening} from '../../config/publicSpaces';
function ribbon(points:Vector3[],width:number,height:number,taper=false){
  const vertices:number[]=[],indices:number[]=[];
  points.forEach((p,i)=>{
    const t=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();
    const n=new Vector3(-t.z,0,t.x).multiplyScalar(width/2*(taper?Math.sin(i/(points.length-1)*Math.PI)**.6:1));
    vertices.push(p.x+n.x,height,p.z+n.z,p.x-n.x,height,p.z-n.z);
    if(i<points.length-1){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
  });
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function Mainland(){
  const geometry=useMemo(()=>{
    const land=landOutlines().map(points=>{const shape=new Shape();points.forEach((p,i)=>i?shape.lineTo(p.x,-p.z):shape.moveTo(p.x,-p.z));shape.closePath();return new ExtrudeGeometry(shape,{depth:1.4,bevelEnabled:false,steps:1});});
    const beach=ribbon(coastline.filter(p=>p.z>-8&&p.z<11),7,-.31,true);
    const foam=ribbon(coastline.filter(p=>p.z>-60&&p.z<70).map(p=>new Vector3(p.x+.8,0,p.z+.4)),.18,-.635);
    // Low undulating terrain behind the city, joined to flat street level.
    const vertices:number[]=[],indices:number[]=[];
    for(let iz=0;iz<=32;iz++)for(let ix=0;ix<=40;ix++){
      const x=-43.5+ix*.5,z=-30+iz*.5;vertices.push(x,terrainHeight(x,z)-.018,z);
      if(ix<40&&iz<32){const j=iz*41+ix;indices.push(j,j+41,j+1,j+1,j+41,j+42);}
    }
    const hills=new BufferGeometry();hills.setAttribute('position',new Float32BufferAttribute(vertices,3));hills.setIndex(indices);hills.computeVertexNormals();
    return {land,beach,foam,hills};
  },[]);
  useEffect(()=>()=>{geometry.land.forEach(g=>g.dispose());geometry.beach.dispose();geometry.foam.dispose();geometry.hills.dispose();},[geometry]);
  const rocks=useMemo<Placement[]>(()=>coastline.filter((p,i)=>p.z>-58&&p.z<42&&!pierShoreOpening(p.x,p.z)&&i%3===0).map((p,i)=>({asset:'prop.rock',position:[p.x,-.51,p.z],scale:[1.1+i%3*.17,2.35+(i%3)*.15,1.08],rotation:[0,i*1.7,0]})),[]);
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.65,0]} receiveShadow><planeGeometry args={[2500,2500]} /><WaterMaterial color='#008de9'/></mesh>
    {geometry.land.map((g,i)=><mesh key={i} geometry={g} rotation={[-Math.PI/2,0,0]} position={[0,-1.42,0]} receiveShadow castShadow>
      <GrassMaterial attach='material-0'/><meshStandardMaterial attach='material-1' color='#b7a58e' roughness={1}/>
    </mesh>)}
    <mesh geometry={geometry.hills} receiveShadow><GrassMaterial/></mesh>
    <mesh geometry={geometry.beach} receiveShadow><meshStandardMaterial color='#f0dba5' side={2}/></mesh>
    <mesh geometry={geometry.foam}><meshBasicMaterial color='#9ce5ee' side={2}/></mesh>
    <AssetBatch placements={rocks}/>
  </>;
}
export function Infrastructure(){return <group><Mainland/><Waterfront/><CivicScenery/><ParkGarden/><Landscape/><CoastalAvenue/><AssetBatch placements={[...infrastructure,...lotPaving]}/></group>;}
