import {useEffect,useMemo} from 'react';
import {BufferGeometry,Float32BufferAttribute,Vector3} from 'three';
import {coastRoadCurve,coastRoadSamples} from '../../config/coastalRoad';
import {straightRoadPlacements,box} from '../../config/infrastructure';
import {AssetBatch} from '../city/AssetBatch';
import type {Placement} from '../../game/types';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {keepDetail} from '../../config/graphics';
function inJunction(x:number,z:number,padding=.05){return straightRoadPlacements.some(r=>Math.abs(x-r.position[0])<r.scale![0]/2+padding&&Math.abs(z-r.position[2])<r.scale![2]/2+padding);}
function strip(offset:number,width:number,height:number,cut=false){
 const vertices:number[]=[],indices:number[]=[];
 coastRoadSamples.forEach((p,i)=>{
  const tangent=coastRoadCurve.getTangentAt(i/(coastRoadSamples.length-1)),normal=new Vector3(tangent.z,0,-tangent.x);
  const center=p.clone().addScaledVector(normal,offset);
  const a=center.clone().addScaledVector(normal,width/2),b=center.clone().addScaledVector(normal,-width/2);
  vertices.push(a.x,height,a.z,b.x,height,b.z);
  if(i>0&&(!cut||(!inJunction(a.x,a.z,.18)&&!inJunction(b.x,b.z,.18)))){
   const j=i*2;indices.push(j-2,j-1,j,j-1,j+1,j);
  }
 });
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
const props:Placement[]=[],length=coastRoadCurve.getLength();
for(const z of [-11,2,14]){
 const index=coastRoadSamples.reduce((best,p,i)=>Math.abs(p.z-z)<Math.abs(coastRoadSamples[best].z-z)?i:best,0);
 for(const side of [-1,1]){
  const t=index/(coastRoadSamples.length-1)+side*1.8/length,p=coastRoadCurve.getPointAt(t),v=coastRoadCurve.getTangentAt(t),n=new Vector3(v.z,0,-v.x);
  for(let i=-3;i<=3;i++)props.push({...box('road.crossing',[p.x+n.x*i*.24,.063,p.z+n.z*i*.24],[.13,.014,.5]),rotation:[0,Math.atan2(v.x,v.z),0]});
 }
}
for(let d=2;d<length-1;d+=.85){
 const t=d/length,p=coastRoadCurve.getPointAt(t),v=coastRoadCurve.getTangentAt(t),n=new Vector3(v.z,0,-v.x),edge=p.clone().addScaledVector(n,1.62);
 if(inJunction(edge.x,edge.z,.7)||Math.abs(edge.z+3)<1.1||Math.abs(edge.z+16.5)<1.1)continue;
 props.push(box('road.crossing',[edge.x,.31,edge.z],[.07,.47,.07]));
 props.push({...box('road.crossing',[edge.x,.54,edge.z],[.06,.055,.89]),rotation:[0,Math.atan2(v.x,v.z),0]});
}
for(let d=2;d<length-2;d+=1.65){
 const t=d/length,p=coastRoadCurve.getPointAt(t),v=coastRoadCurve.getTangentAt(t);
 if(!inJunction(p.x,p.z,1.8))props.push({...box('road.crossing',[p.x,.058,p.z],[.055,.015,.64]),rotation:[0,Math.atan2(v.x,v.z),0]});
}
for(let d=4,i=0;d<length-3;d+=4.6,i++){
 const t=d/length,p=coastRoadCurve.getPointAt(t),v=coastRoadCurve.getTangentAt(t),n=new Vector3(v.z,0,-v.x),side=i%2?1:-1;
 if(!inJunction(p.x,p.z,2.1)){
  props.push({asset:['prop.car.gold','prop.car.blue','prop.car.coral','prop.car.white'][i%4],position:[p.x+n.x*.43*side,.045,p.z+n.z*.43*side],scale:[.86,.86,.86],rotation:[0,Math.atan2(v.x,v.z)+(side<0?Math.PI:0),0]});
 }
 const lamp=p.clone().addScaledVector(n,-1.5);
 if(!inJunction(lamp.x,lamp.z,.35))props.push({asset:'prop.lamp',position:[lamp.x,.09,lamp.z],scale:[.8,.8,.8]});
}
export function CoastalAvenue(){
 const {traffic}=useResolvedGraphics();
 const visibleProps=useMemo(()=>props.filter((p,i)=>!p.asset.startsWith('prop.car.')||keepDetail(i,traffic)),[traffic]);
 const meshes=useMemo(()=>[strip(0,2,.046),strip(1.24,.48,.094,true),strip(-1.24,.48,.094,true)],[]);
 useEffect(()=>()=>meshes.forEach(g=>g.dispose()),[meshes]);
 return <group>{meshes.map((g,i)=><mesh key={i} geometry={g} receiveShadow><meshStandardMaterial color={i?'#e5ddca':'#555866'} side={2}/></mesh>)}<AssetBatch placements={visibleProps}/></group>;
}
