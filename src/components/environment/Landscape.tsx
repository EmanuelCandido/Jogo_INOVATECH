import {useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {BoxGeometry,BufferGeometry,Color,ConeGeometry,CylinderGeometry,Float32BufferAttribute,InstancedMesh,Object3D,SphereGeometry,TorusGeometry} from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {useThree} from '@react-three/fiber';
import {gardenBeds,gardenWalks,landscapeAssets,landscapeDetails,type LandscapeDetail,type LandscapeShape} from '../../config/landscape';
import {terrainHeight} from '../../config/terrain';
import {AssetBatch} from '../city/AssetBatch';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {keepDetail} from '../../config/graphics';
import {inSituationClearing} from '../../config/situationSites';

function GardenGround(){
 const {undergrowth}=useResolvedGraphics();
 const geometry=useMemo(()=>{
  const positions:number[]=[],colors:number[]=[],indices:number[]=[];
  const edge=new Color('#7fc065');
  for(const [i,bed] of gardenBeds.entries()){
   if(!keepDetail(i,undergrowth))continue;
   const start=positions.length/3,center=new Color(bed.color);
   positions.push(bed.x,terrainHeight(bed.x,bed.z)+.008,bed.z);colors.push(...center.toArray());
   for(const f of [.7,1])for(const [x,z] of bed.points){
    const px=bed.x+(x-bed.x)*f,pz=bed.z+(z-bed.z)*f;
    positions.push(px,terrainHeight(px,pz)+.008,pz);colors.push(...(f===1?edge:center).toArray());
   }
   for(let i=0;i<24;i++){
    const a=start+1+i,b=start+1+(i+1)%24;
    indices.push(start,b,a,a,b,b+24,a,b+24,a+24);
   }
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[undergrowth]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>;
}
function DetailBatch({shape,items}:{shape:LandscapeShape;items:LandscapeDetail[]}){
 const ref=useRef<InstancedMesh>(null);
 const {smoothGeometry,tier}=useResolvedGraphics(),{gl,invalidate}=useThree();
 const geometry=useMemo(()=>{
  if(shape==='patch'){
   const positions=[0,0,0],indices:number[]=[];
   for(let i=0;i<40;i++){const a=i*Math.PI/20,r=.94+.035*Math.sin(a*5)+.025*Math.cos(a*3);positions.push(Math.cos(a)*r,0,Math.sin(a)*r);indices.push(0,(i+1)%40+1,i+1);}
   const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  if(shape==='box')return smoothGeometry?new RoundedBoxGeometry(1,1,1,1,.035):new BoxGeometry();
  if(shape==='leaf'||shape==='smoke')return new SphereGeometry(1,smoothGeometry?12:6,smoothGeometry?8:4);
  if(shape==='cylinder')return new CylinderGeometry(1,1,1,10);
  if(shape==='ring')return new TorusGeometry(1,.12,6,smoothGeometry?20:12);
  const cone=new ConeGeometry(1,1,12,1,true).toNonIndexed();
  const c:number[]=[];
  for(let i=0;i<cone.attributes.position.count;i++){
   const shade=Math.floor(i/3)%2===0?1:.58;c.push(shade,shade,shade);
  }
  cone.setAttribute('color',new Float32BufferAttribute(c,3));return cone;
 },[shape,smoothGeometry]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useLayoutEffect(()=>{
  const object=new Object3D();
  items.forEach((p,i)=>{
   object.position.set(...p.position);object.rotation.set(...p.rotation??[0,0,0]);object.scale.set(...p.scale);object.updateMatrix();
   ref.current!.setMatrixAt(i,object.matrix);ref.current!.setColorAt(i,new Color(p.color));
  });
  ref.current!.instanceMatrix.needsUpdate=true;ref.current!.instanceColor!.needsUpdate=true;ref.current!.computeBoundingSphere();
  gl.shadowMap.needsUpdate=true;invalidate();
 // R3F reconstructs the InstancedMesh when its geometry constructor argument
 // changes. The new object needs both transforms and colours, even for the same items.
 },[items,geometry,gl,invalidate]);
 return <instancedMesh name={`details-${shape}`} ref={ref} args={[geometry,undefined,items.length]} castShadow={shape!=='smoke'&&shape!=='patch'&&tier!=='MINIMUM'&&tier!=='LOW'} receiveShadow>
  <meshStandardMaterial roughness={.92} vertexColors={shape==='canopy'} side={shape==='canopy'?2:0} transparent={shape==='smoke'} opacity={shape==='smoke'?.3:1} depthWrite={shape!=='smoke'}/>
 </instancedMesh>;
}
export function DetailInstances({details}:{details:LandscapeDetail[]}){
 const groups=useMemo(()=>(['box','leaf','cylinder','canopy','ring','smoke','patch'] as const).map(shape=>({shape,items:details.filter(p=>p.shape===shape)})).filter(g=>g.items.length),[details]);
 return <>{groups.map(g=><DetailBatch key={g.shape} {...g}/>)}</>;
}
export function Landscape(){
 const q=useResolvedGraphics();
 const details=useMemo(()=>landscapeDetails.filter(p=>!p.category||(!inSituationClearing(p.position[0],p.position[2])&&keepDetail(p.cluster!,q.undergrowth)&&(p.category!=='flower'||keepDetail(p.cluster!,q.flowers)))),[q.undergrowth,q.flowers]);
 const trees=useMemo(()=>landscapeAssets.filter((p,i)=>!inSituationClearing(p.position[0],p.position[2])&&keepDetail(i,Math.max(.3,q.forestDensity))),[q.forestDensity]);
 return <group><GardenGround/><DetailInstances details={details}/><AssetBatch placements={trees}/><AssetBatch placements={gardenWalks}/></group>;
}
