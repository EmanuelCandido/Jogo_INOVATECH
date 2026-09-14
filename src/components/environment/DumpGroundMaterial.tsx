import {useMemo} from 'react';
import type {MeshStandardMaterial} from 'three';
import {surfaceShader} from '../../assets/surfaceFinish';
import {dumpSite,type DumpStage} from '../../config/dumpSite';
import {mapBasis} from '../../config/referenceMap';

/** Material-only finish: a feathered soil boundary and tyre wear following
 * the reserved truck route. No extra meshes or per-frame work. */
export function DumpGroundMaterial({stage}:{stage:DumpStage}){
 const compile=useMemo<MeshStandardMaterial['onBeforeCompile']>(()=>(shader,renderer)=>{
  surfaceShader(stage==='solved'?'grass':'soil')(shader,renderer);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
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
   ${stage==='solved'?'':`
   float dumpRoute=min(dumpSegment(dumpUV,vec2(90.,33.),vec2(99.,33.)),min(dumpArc(dumpUV,vec2(99.,36.),-1.5707963,3.1415927),dumpArc(dumpUV,vec2(93.,36.),-1.5707963,0.)));
   float dumpWear=(1.-smoothstep(.65,1.2,dumpRoute))*(.5+.5*finishNoise(dumpUV*1.3));
   float dumpAA=max(fwidth(dumpRoute),.025);
   float dumpTyres=1.-smoothstep(.055,.055+dumpAA,abs(dumpRoute-.46));
   float dumpEarth=finishNoise(dumpUV*.24+vec2(9.,2.));
   diffuseColor.rgb*=.88+.22*dumpEarth;
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.68,.66,.60),dumpWear*.45+dumpTyres*.20);
   `}
   #include <roughnessmap_fragment>
  `);
 },[stage]);
 return <meshStandardMaterial key={stage} color={stage==='solved'?'#92bd66':stage==='temporary'?'#a9a285':'#a68d6c'} roughness={1} side={2} transparent depthWrite={false} onBeforeCompile={compile} customProgramCacheKey={()=>'dump-finish-v1-'+stage}/>;
}
