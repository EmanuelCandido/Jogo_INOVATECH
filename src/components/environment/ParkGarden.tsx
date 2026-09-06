import {useEffect,useMemo} from 'react';
import {BufferGeometry,CatmullRomCurve3,Float32BufferAttribute,Vector3} from 'three';
import {AssetBatch} from '../city/AssetBatch';
import {planting,paths} from '../../config/park';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {keepDetail} from '../../config/graphics';
import {coastRoadX} from '../../config/coastalRoad';

function ParkPaths(){
 const geometry=useMemo(()=>{
  const positions:number[]=[],indices:number[]=[];
  for(const points of paths){
   const curve=new CatmullRomCurve3(points.map(([x,z])=>new Vector3(x,.06,z)),false,'catmullrom',.2),samples=curve.getPoints(70),start=positions.length/3;
   samples.forEach((p,i)=>{
    const t=curve.getTangent(i/70),n=new Vector3(t.z,0,-t.x).multiplyScalar(.32);
    positions.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);
    if(i<70){const j=start+i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
   });
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color='#e5ddca' side={2}/></mesh>;
}
function Visitor({x,z,y=.09,index}:{x:number;z:number;y?:number;index:number}){
 const colours=['#e96042','#427cbd','#f0bf3c','#eadfd0','#35a487'];
 return <group position={[x,y,z]} rotation={[0,index*1.37,0]} scale={index%5===0?.72:1}>
  <mesh position={[0,.74,0]} castShadow><sphereGeometry args={[.105,8,6]}/><meshStandardMaterial color={index%3?'#d5a47c':'#8d6045'}/></mesh>
  <mesh position={[0,.5,0]} castShadow><capsuleGeometry args={[.095,.24,3,8]}/><meshStandardMaterial color={colours[index%5]}/></mesh>
  {[-1,1].map(side=><group key={side}>
   <mesh position={[side*.06,.18,side*.025]} castShadow><capsuleGeometry args={[.037,.26,2,6]}/><meshStandardMaterial color='#435a70'/></mesh>
   <mesh position={[side*.125,.47,0]} rotation={[0,0,side*.22]} castShadow><capsuleGeometry args={[.025,.2,2,6]}/><meshStandardMaterial color={colours[index%5]}/></mesh>
  </group>)}
 </group>;
}
export function ParkGarden(){const {visitors}=useResolvedGraphics();return <group>
 <ParkPaths/><AssetBatch placements={planting}/>
 {[[9.1,-5],[9.1,-4.5],[9.1,1],[9.1,1.5],[12,7.6],[12.6,7.6],[17.6,-3],[17.6,-2.6],[7,6.6],[7.5,6.6],[5.3,10.5],[5.4,11.3],[11.85,4.7,.43],[-24.3,-11+1.24],[-26,-9.76],[-14.5,12.76],[25.2,12.76],[25.8,12.76],[31.24,-3.5],[31.24,-4],[coastRoadX(-4.5)+1.32,-4.5],[coastRoadX(-5)+1.32,-5]].map(([x,z,y],i)=>keepDetail(i,visitors)?<Visitor key={i} x={x} z={z} y={y} index={i}/>:null)}
 </group>;}

