import {useEffect,useMemo} from 'react';
import {useAmbientTime} from '../../game/useAmbientTime';
import type {BufferGeometry,MeshStandardMaterial} from 'three';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {beachGeometry} from './beachGeometry';

export function Beach({surface}:{surface?:BufferGeometry}){
 const geometry=useMemo(()=>surface??beachGeometry(),[surface]),{animate}=useResolvedGraphics(),time=useAmbientTime(animate,1.4);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 const compile=useMemo(()=> (shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  shader.uniforms.swashTime=time.current;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 beachPoint;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nbeachPoint=uv;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec2 beachPoint;uniform float swashTime;
   float sandHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float sandNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sandHash(i),sandHash(i+vec2(1,0)),f.x),mix(sandHash(i+vec2(0,1)),sandHash(i+vec2(1,1)),f.x),f.y);}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   float along=beachPoint.x,u=beachPoint.y;
   // Each section arrives a little later, preventing a rigid parallel white line.
   float phase=fract(swashTime*.135+sin(along*.44)*.025+sin(along*1.17)*.014);
   float advance=phase<.28?smoothstep(0.,.28,phase):1.-smoothstep(.28,1.,phase);
   float irregular=(sandNoise(vec2(along*.85,swashTime*.11))-.5)*.065+(sandNoise(vec2(along*3.7,swashTime*.14))-.5)*.018;
   float front=.935-advance*.26+irregular;
   float aa=max(fwidth(u),.003),wet=smoothstep(.62,.85,u);
   float grainAA=max(fwidth(along*53.),fwidth(u*180.));
   float grainDetail=1.-smoothstep(.4,1.4,grainAA),grain=.5;
   if(grainDetail>0.)grain=sandNoise(vec2(along*53.,u*180.));
   diffuseColor.rgb*=1.-wet*.18+(grain-.5)*.065*grainDetail;
   float wash=smoothstep(front-aa,front+.085,u)*(.32+advance*.13);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.08,.52,.55),wash);
   float foam=exp(-pow((u-front)/(.009+aa*1.3),2.));
   float lace=.25+.75*smoothstep(.18,.78,sandNoise(vec2(along*8.,u*115.)+swashTime*.12));
   foam*=lace*(.38+advance*.52);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.94,.89),foam);
   // Fade into the actual sea beneath before the beach crosses its water level.
   // This removes the hard opaque border without adding another water pass.
   diffuseColor.a*=1.-smoothstep(.805,.88,u);
  `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=mix(.96,.42,wet*.7+wash*.3);
  `);
 },[]);
 return <mesh name='beach-swash' geometry={geometry} receiveShadow>
  <meshStandardMaterial color='#f0dba5' side={2} transparent depthWrite={false} onBeforeCompile={compile} customProgramCacheKey={()=>'sand-swash-v3'} userData={{swashTime:time.current,ambient:true}}/>
 </mesh>;
}
