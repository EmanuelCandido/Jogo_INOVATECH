import {useEffect,useMemo,useRef} from 'react';
import type {MeshStandardMaterial} from 'three';
import {Color} from 'three';
import {useFrame} from '@react-three/fiber';
import {useGame} from '../../stores/gameStore';
import {resolutionEase,resolutionRange} from '../../game/resolution';
import {surfaceShader} from '../../assets/surfaceFinish';
import {dumpSite,type DumpStage} from '../../config/dumpSite';
import {mapBasis} from '../../config/referenceMap';

/** Material-only finish: a feathered soil boundary and tyre wear following
 * the reserved truck route. Only the short restoration animates its color. */
export function DumpGroundMaterial({stage}:{stage:DumpStage}){
 const material=useRef<MeshStandardMaterial>(null),recovery=useRef({value:stage==='solved'?1:0});
 const resolution=useGame(s=>s.resolution?.problemId==='pollution_01'?s.resolution:null);
 const colors=useMemo(()=>({initial:new Color('#a68d6c'),temporary:new Color('#a9a285'),solved:new Color('#92bd66')}),[]);
 const apply=(t:number)=>{
  if(!material.current)return;
  const from=resolution?.from??stage,to=resolution?.to??stage;
  material.current.color.copy(colors[from]).lerp(colors[to],t);
  recovery.current.value=(from==='solved'?1:0)+((to==='solved'?1:0)-(from==='solved'?1:0))*t;
 };
 useEffect(()=>apply(0),[resolution,stage]);
 useFrame(()=>{if(resolution)apply(resolutionEase(resolutionRange(resolution.clock.value,.38,.87)));});
 const compile=useMemo<MeshStandardMaterial['onBeforeCompile']>(()=>(shader,renderer)=>{
  surfaceShader('soil')(shader,renderer);
  shader.uniforms.dumpRecovery=recovery.current;
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   uniform float dumpRecovery;
   float dumpSegment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}
   float dumpArc(vec2 p,vec2 centre,float lo,float hi){vec2 d=p-centre;float a=atan(d.y,d.x);if(a>=lo&&a<=hi)return abs(length(d)-3.);return min(length(d-3.*vec2(cos(lo),sin(lo))),length(d-3.*vec2(cos(hi),sin(hi))));}
  `);
  const glslNumber=(value:number)=>Number.isInteger(value)?`${value}.0`:String(value);
  const edge= dumpSite.footprint.map((a,i)=>{const b=dumpSite.footprint[(i+1)%dumpSite.footprint.length];return `dumpEdge=min(dumpEdge,dumpSegment(dumpUV,vec2(${a.map(glslNumber).join(',')}),vec2(${b.map(glslNumber).join(',')})));`;}).join('\n');
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`
   vec2 dumpUV=vec2(dot(surfacePoint.xz,vec2(${mapBasis.rx},${mapBasis.rz})),dot(surfacePoint.xz,vec2(${mapBasis.dx},${mapBasis.dz})));
   float dumpEdge=1000.;${edge}
   float dumpNoise=finishNoise(dumpUV*.72)+.35*finishNoise(dumpUV*2.1);
   diffuseColor.a*=smoothstep(.08,.8,dumpEdge-(dumpNoise-.25)*.45);
   float dumpRoute=min(dumpSegment(dumpUV,vec2(90.,33.),vec2(99.,33.)),min(dumpArc(dumpUV,vec2(99.,36.),-1.5707963,3.1415927),dumpArc(dumpUV,vec2(93.,36.),-1.5707963,0.)));
   float dumpWear=(1.-smoothstep(.65,1.2,dumpRoute))*(.5+.5*finishNoise(dumpUV*1.3));
   float dumpAA=max(fwidth(dumpRoute),.025);
   float dumpTyres=1.-smoothstep(.055,.055+dumpAA,abs(dumpRoute-.46));
   float dumpEarth=finishNoise(dumpUV*.24+vec2(9.,2.));
   diffuseColor.rgb*=.88+.22*dumpEarth;
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.68,.66,.60),(dumpWear*.45+dumpTyres*.20)*(1.-dumpRecovery));
   #include <roughnessmap_fragment>
  `);
 },[]);
 return <meshStandardMaterial ref={material} color={colors[resolution?.from??stage]} roughness={1} side={2} transparent depthWrite={false} onBeforeCompile={compile} customProgramCacheKey={()=>'dump-finish-v2-recovery'}/>;
}
