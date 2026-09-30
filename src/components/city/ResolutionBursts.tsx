import {useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Color,InstancedMesh,MeshBasicMaterial,Object3D,OctahedronGeometry} from 'three';
import {changeMoment,type ChangeRole,type Resolution,type VisualChange} from '../../game/resolution';
import type {LandscapeDetail} from '../../config/landscape';
import type {Placement,Vec3} from '../../game/types';

type Item=Placement|LandscapeDetail;
export interface Particle{origin:Vec3;velocity:Vec3;start:number;life:number;size:number;gravity:number;spin:number;color:string}
const palette={dust:['#cdbb98','#b9a57f','#e2d6bb'],leaf:['#7fbf5f','#5da35a','#a9d46e'],spark:['#ffd65c','#fff3b0','#8fe0a4','#ffffff'],warn:['#f2c14e','#ffe08a']};
const cap=240;
// Deterministic so every replay and test frame is the same.
function random(seed:number){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

/** Small low-poly bursts that mark each step: dust when an obstacle is
 * removed or equipment lands, leaves when a tree grows, and a burst of
 * sparkles over the site when the city finishes changing. One draw call,
 * no shadows and no transparency, so phones keep their frame budget. */
export function planBursts(changes:VisualChange<Item>[],outcome:Resolution['to'],collection?:Vec3):Particle[] {
 const rng=random(changes.length*7919+(outcome==='solved'?1:2)),particles:Particle[]=[];
 const pick=(colors:string[])=>colors[Math.floor(rng()*colors.length)];
 const burst=(at:Vec3,start:number,count:number,kind:'dust'|'leaf'|'spark'|'ring',size=.07)=>{
  for(let i=0;i<count;i++){
   const angle=i/count*Math.PI*2+rng()*.6,speed=.35+rng()*.35;
   const up=kind==='ring'?.08+rng()*.12:kind==='dust'?.3+rng()*.3:.7+rng()*.5;
   const radial=kind==='ring'?speed*1.4:speed*(kind==='spark'?.6:.8);
   particles.push({origin:[at[0],at[1]+.05,at[2]],velocity:[Math.cos(angle)*radial,up,Math.sin(angle)*radial],start:start+rng()*.015,life:kind==='spark'?.12:.11,
    size:size*(.7+rng()*.6),gravity:kind==='spark'?.25:kind==='leaf'?.35:.15,spin:(rng()-.5)*14,color:pick(kind==='leaf'?palette.leaf:kind==='spark'?(outcome==='solved'?palette.spark:palette.warn):palette.dust)});
  }
 };
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 const counts:Partial<Record<ChangeRole,number>>={};
 for(const change of changes){
  const item=change.after??change.before!,{role,time}=changeMoment(change,collection),seen=counts[role]=(counts[role]??0)+1;
  for(let axis=0;axis<3;axis++){bounds.min[axis]=Math.min(bounds.min[axis],item.position[axis]);bounds.max[axis]=Math.max(bounds.max[axis],item.position[axis]);}
  const base:Vec3=[item.position[0],Math.max(0,item.position[1]-(role==='sign'?0:.1)),item.position[2]];
  if(role==='clear'||(role==='waste'&&!collection))burst(base,time,6,'dust');
  else if(role==='build')burst(base,time,8,'ring');
  else if(role==='ground'&&seen%3===1)burst(base,time,4,'ring',.05);
  else if(role==='tree')burst([base[0],base[1]+.5,base[2]],time,7,'leaf');
  else if(role==='sign')burst([base[0],base[1]+.6,base[2]],time,5,'spark',.05);
 }
 if(changes.length&&Number.isFinite(bounds.min[0])){
  // The closing celebration rises across the whole site, fewer for a partial fix.
  const count=outcome==='solved'?30:10;
  for(let i=0;i<count;i++){
   const x=bounds.min[0]+(bounds.max[0]-bounds.min[0])*rng(),z=bounds.min[2]+(bounds.max[2]-bounds.min[2])*rng();
   burst([x,Math.max(0,bounds.min[1])+.3+rng()*.4,z],.82+rng()*.05,1,'spark',.06+rng()*.03);
  }
 }
 return particles.slice(0,cap);
}

export function ResolutionBursts({changes,resolution,collection}:{changes:VisualChange<Item>[];resolution:Resolution;collection?:Vec3}) {
 const mesh=useRef<InstancedMesh>(null);
 const particles=useMemo(()=>planBursts(changes,resolution.to,collection),[changes,resolution.to,collection]);
 const geometry=useMemo(()=>new OctahedronGeometry(1,0),[]),material=useMemo(()=>new MeshBasicMaterial({toneMapped:false}),[]);
 const dummy=useMemo(()=>new Object3D(),[]);
 useLayoutEffect(()=>{
  const target=mesh.current;if(!target)return;
  const color=new Color();
  particles.forEach((p,i)=>target.setColorAt(i,color.set(p.color)));
  if(target.instanceColor)target.instanceColor.needsUpdate=true;
 },[particles]);
 useLayoutEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
 useFrame(()=>{
  const target=mesh.current;if(!target)return;
  const now=resolution.clock.value;let visible=0;
  particles.forEach((p,i)=>{
   const age=(now-p.start)/p.life;
   if(age<=0||age>=1){dummy.scale.setScalar(0);}
   else{
    visible++;
    dummy.position.set(p.origin[0]+p.velocity[0]*age,p.origin[1]+p.velocity[1]*age-p.gravity*age*age,p.origin[2]+p.velocity[2]*age);
    dummy.rotation.set(age*p.spin,age*p.spin*.7,0);
    dummy.scale.setScalar(p.size*Math.min(1,age*6)*(1-age*age));
   }
   dummy.updateMatrix();target.setMatrixAt(i,dummy.matrix);
  });
  target.instanceMatrix.needsUpdate=true;target.visible=visible>0;
 });
 return particles.length>0&&<instancedMesh ref={mesh} args={[geometry,material,particles.length]} frustumCulled={false} castShadow={false} receiveShadow={false} visible={false} name="Efeitos da transformação"/>;
}
