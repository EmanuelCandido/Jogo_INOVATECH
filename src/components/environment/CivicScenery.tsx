import {useEffect,useMemo} from 'react';
import {ExtrudeGeometry,Path,Shape,ShapeGeometry} from 'three';
import {AssetBatch} from '../city/AssetBatch';
import {box} from '../../config/infrastructure';
import {railCurve} from '../../config/railway';
import type {Placement} from '../../game/types';
import {inPublicSpace} from '../../config/publicSpaces';
const details:Placement[]=[];
const length=railCurve.getLength();
for(let d=0;d<length;d+=.32){
 const t=d/length,p=railCurve.getPointAt(t),v=railCurve.getTangentAt(t),angle=Math.atan2(v.x,v.z);
 details.push({...box('ground.asphalt',[p.x,.035,p.z],[1.15,.07,.35]),rotation:[0,angle,0]});
 details.push({...box('ground.wood',[p.x,.10,p.z],[1.02,.065,.12]),rotation:[0,angle,0]});
 for(const side of [-1,1])details.push({...box('road.crossing',[p.x+v.z*.33*side,.15,p.z-v.x*.33*side],[.045,.05,.35]),rotation:[0,angle,0]});
}
details.push({asset:'prop.football',position:[-15,0,-23]});
// Each fence section terminates on an actual post. The space between sections is
// a truck-width gate; no rail is allowed to project from an unaligned loop sample.
for(const [a,b] of [[.2,2.4],[6.6,12.4],[16.6,22.9],[27.1,35.8]]){
 const count=Math.ceil((b-a)/.75);
 for(let i=0;i<=count;i++){
  const x=a+(b-a)*i/count;
  details.push(box('ground.court',[x,.55,-33.5],[.055,1.1,.055]));
  details.push(box('road.crossing',[x,1.115,-33.5],[.085,.045,.085]));
  details.push(box('ground.sidewalk',[x,.05,-33.5],[.14,.1,.14]));
 }
 for(const y of [.2,.46,.73,1.07])details.push(box('ground.court',[(a+b)/2,y,-33.5],[b-a,.025,.025]));
}
// Residential pools and service parking remain inside their blocks.
for(const [x,z] of [[23.2,32.1],[-24.9,11]]){
 details.push(box('ground.sidewalk',[x,.03,z],[1.5,.06,1.8]));
 details.push(box('ground.pool',[x,.07,z],[1.25,.02,1.55]));
}
for(const [x,z] of [[-15,4],[-25,-19.4],[35,3.9]]){
 details.push(box('ground.asphalt',[x,.026,z],[5.2,.05,1.6]));
 for(let i=0;i<7;i++)details.push(box('road.crossing',[x-2.5+i*.82,.06,z],[.025,.018,1.4]));
}
function Tunnel(){
 const geometry=useMemo(()=>{
  const arch=new Shape();arch.moveTo(-1.45,0);arch.lineTo(-1.45,1.4);arch.absarc(0,1.4,1.45,Math.PI,0,true);arch.lineTo(1.45,0);arch.closePath();
  const hole=new Path();hole.moveTo(-1.03,0);hole.lineTo(1.03,0);hole.lineTo(1.03,1.35);hole.absarc(0,1.35,1.03,0,Math.PI,false);hole.closePath();arch.holes.push(hole);
  const opening=new Shape();opening.moveTo(-1.025,0);opening.lineTo(1.025,0);opening.lineTo(1.025,1.35);opening.absarc(0,1.35,1.025,0,Math.PI,false);opening.closePath();
  return {arch:new ExtrudeGeometry(arch,{depth:.75,bevelEnabled:true,bevelSize:.06,bevelThickness:.04,bevelSegments:1,steps:1}),opening:new ShapeGeometry(opening)};
 },[]);
 useEffect(()=>()=>{geometry.arch.dispose();geometry.opening.dispose();},[geometry]);
 return <group name='railway-portal' position={[-34.5,.03,-15.9]} rotation={[0,-.23,0]}>
  <mesh geometry={geometry.arch} castShadow receiveShadow><meshStandardMaterial color='#a9a599'/></mesh>
  <mesh geometry={geometry.opening} position={[0,0,.755]}><meshBasicMaterial color='#27372f'/></mesh>
  {Array.from({length:13},(_,i)=>{const a=(i+.5)*Math.PI/13;return <mesh key={i} position={[Math.cos(a)*1.26,1.4+Math.sin(a)*1.26,.82]} rotation={[0,0,a-Math.PI/2]} castShadow><boxGeometry args={[.28,.35,.12]}/><meshStandardMaterial color={i%2?'#c7bfa7':'#b4ae9c'}/></mesh>;})}
  {[-1,1].map(side=><group key={side}>
    <mesh position={[side*1.28,.68,.81]} receiveShadow castShadow><boxGeometry args={[.35,1.36,.15]}/><meshStandardMaterial color='#bfb9a7'/></mesh>
    <mesh position={[side*1.59,.51,.24]} receiveShadow castShadow><boxGeometry args={[.38,1.02,1.08]}/><meshStandardMaterial color='#aaa590'/></mesh>
    {[.32,.65,.98].map(y=><mesh key={y} position={[side*1.28,y,.895]}><boxGeometry args={[.35,.022,.008]}/><meshStandardMaterial color='#8e907f'/></mesh>)}
  </group>)}
 </group>;
}
export function CivicScenery(){return <group>
 <AssetBatch placements={details}/><Tunnel/>
 {[[6.4,11.5],[13,11.8],[17.7,9.5],[1.9,21.8],[-7.7,-1.8]].filter(([x,z])=>!inPublicSpace(x,z,.55)).map(([x,z])=><group key={`${x}-${z}`} position={[x,.03,z]}>
  <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.55,20]}/><meshStandardMaterial color='#ad9470'/></mesh>
  {[0,1,2,3,4,5,6].map(i=><mesh key={i} position={[Math.cos(i)*.32,.14,Math.sin(i)*.32]}><sphereGeometry args={[.12,6,4]}/><meshStandardMaterial color={i%2?'#f9c257':'#ed94b3'}/></mesh>)}
 </group>)}
</group>;}
