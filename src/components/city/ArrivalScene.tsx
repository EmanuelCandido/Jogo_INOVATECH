import {useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Color,InstancedMesh,Mesh,MeshBasicMaterial,Object3D,OctahedronGeometry,Vector3,type OrthographicCamera} from 'three';
import {arrivalBeatAt,arrivalCamera,arrivalHero,arrivalShadow,arrivalShockwave,arrivalSite,arrivalTimes,type Arrival,type ArrivalCameraStart} from '../../game/arrival';
import {mapBaseZoom} from '../../game/mapNavigation';
import {preparationActivity} from '../../game/resourcePreparation';
import {useGame} from '../../stores/gameStore';
import {arrivalStage,paintArrival} from '../../ui/cinematic/arrivalStage';

const flat=-Math.PI/2;
type Particle={angle:number;speed:number;up:number;size:number;life:number;delay:number;color:string};
/** Dust kicked up by the landing and a few lightning-coloured sparks. */
function planLanding():Particle[]{
 let seed=20261001;const random=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
 return Array.from({length:34},(_,i)=>{
  const spark=i>=20;
  return {angle:i/(spark?14:20)*Math.PI*2+random()*.5,speed:spark?2.2+random()*1.6:1.3+random()*1.1,up:spark?2.4+random()*1.8:.5+random()*.6,
   size:spark?.07+random()*.05:.11+random()*.09,life:spark?.75+random()*.25:.9+random()*.3,delay:random()*.06,
   color:spark?['#ffe187','#c9a6ff','#ffffff'][i%3]:['#cdbb98','#b9a57f','#e2d6bb'][i%3]};
 });
}

/** Drives the arrival: the cinematic clock, the camera, the landing effects in
 * the city and, after the camera moved, Impactus' place on the screen. */
function Timeline({arrival}:{arrival:Arrival}){
 const {camera,size,gl,invalidate}=useThree();
 const start=useRef<ArrivalCameraStart|null>(null),resume=useRef(true);
 const shadow=useRef<Mesh>(null),rings=[useRef<Mesh>(null),useRef<Mesh>(null)],dust=useRef<InstancedMesh>(null);
 const particles=useMemo(planLanding,[]),geometry=useMemo(()=>new OctahedronGeometry(1,0),[]),material=useMemo(()=>new MeshBasicMaterial({toneMapped:false}),[]);
 const scratch=useMemo(()=>({point:new Vector3(),forward:new Vector3(),dummy:new Object3D()}),[]);
 useLayoutEffect(()=>{
  const mesh=dust.current;if(!mesh)return;
  const color=new Color();particles.forEach((p,i)=>mesh.setColorAt(i,color.set(p.color)));
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 },[particles]);
 useLayoutEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
 useEffect(()=>{
  const wake=()=>{resume.current=true;invalidate();};
  document.addEventListener('visibilitychange',wake);wake();
  return()=>{document.removeEventListener('visibilitychange',wake);invalidate();};
 },[invalidate]);
 useFrame((_state,delta)=>{
  if(document.hidden)return;
  const current=useGame.getState();
  if(current.arrival?.sequence!==arrival.sequence)return;
  if(current.progress.settings.reducedMotion){current.finishArrival(arrival.sequence);return;}
  preparationActivity(gl.domElement).touch();
  const ortho=camera as OrthographicCamera,{point,forward,dummy}=scratch;
  if(!start.current){
   // Start from the shot on screen: its target is where the view meets the ground.
   camera.getWorldDirection(forward);
   point.copy(camera.position).addScaledVector(forward,-camera.position.y/forward.y);
   start.current={target:point.toArray(),offset:camera.position.clone().sub(point).toArray(),zoom:ortho.zoom};
  }
  // A background tab or a slow first frame must not consume the animation.
  if(resume.current)resume.current=false;
  else arrival.clock.value+=Math.min(delta,.1);
  const t=arrival.clock.value;
  const shot=arrivalCamera(t,start.current,mapBaseZoom(size.width,size.height));
  camera.position.set(...shot.position);ortho.zoom=shot.zoom;
  camera.lookAt(...shot.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  point.set(...arrivalSite).project(camera);
  paintArrival(t,arrivalHero(t,size.width,size.height,[(point.x+1)/2*size.width,(1-point.y)/2*size.height]));
  // Ground effects are sized from his feet on screen, whatever the zoom.
  const feet=Math.max(1,arrivalStage.size*.16/shot.zoom);
  const fall=arrivalShadow(t);
  if(shadow.current){
   shadow.current.scale.setScalar(feet*fall.radius);
   (shadow.current.material as MeshBasicMaterial).opacity=fall.opacity;shadow.current.visible=fall.opacity>0;
  }
  rings.forEach((ring,i)=>{
   const wave=arrivalShockwave(t,i*.12),mesh=ring.current;if(!mesh)return;
   mesh.visible=wave!==null;
   if(wave){mesh.scale.setScalar(feet*wave.radius);(mesh.material as MeshBasicMaterial).opacity=wave.opacity;}
  });
  const mesh=dust.current;
  if(mesh){
   let visible=0;
   particles.forEach((p,i)=>{
    const age=(t-arrivalTimes.landed-p.delay)/p.life;
    if(age<=0||age>=1)dummy.scale.setScalar(0);
    else{
     visible++;
     const reach=feet*p.speed*(1-(1-age)**2);
     dummy.position.set(Math.cos(p.angle)*reach,feet*(p.up*age-2.4*age*age)+.15,Math.sin(p.angle)*reach);
     dummy.rotation.set(age*9,age*6,0);
     dummy.scale.setScalar(feet*p.size*Math.min(1,age*8)*(1-age*age));
    }
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   });
   mesh.instanceMatrix.needsUpdate=true;mesh.visible=visible>0;
  }
  const beat=arrivalBeatAt(t);
  if(beat!==arrival.beat)current.arrivalBeat(arrival.sequence,beat);
  if(t>=arrivalTimes.end)current.finishArrival(arrival.sequence);
  else invalidate();
 },-60);
 return <group position={arrivalSite} name="Chegada de Impactus">
  {/* Paving sits a little above the terrain; the shadow under his feet is
     always drawn, the waves follow the ground just above it. */}
  <mesh ref={shadow} rotation-x={flat} position-y={.2} renderOrder={7} visible={false}>
   <circleGeometry args={[1,40]}/>
   <meshBasicMaterial color="#1d0b3d" transparent opacity={0} depthWrite={false} depthTest={false} toneMapped={false}/>
  </mesh>
  {rings.map((ring,i)=><mesh key={i} ref={ring} rotation-x={flat} position-y={.22+i*.01} renderOrder={6} visible={false}>
   <ringGeometry args={[.8,1,64]}/>
   <meshBasicMaterial color={i?'#ffe187':'#c9a6ff'} transparent opacity={0} depthWrite={false} toneMapped={false}/>
  </mesh>)}
  <instancedMesh ref={dust} args={[geometry,material,particles.length]} frustumCulled={false} visible={false}/>
 </group>;
}

export function ArrivalDirector(){
 const arrival=useGame(s=>s.arrival);
 return arrival&&<Timeline key={arrival.sequence} arrival={arrival}/>;
}
