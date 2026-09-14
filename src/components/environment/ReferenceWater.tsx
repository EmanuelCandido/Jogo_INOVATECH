import {useMemo} from 'react';
import type {MeshStandardMaterial} from 'three';
import {useAmbientTime} from '../../game/useAmbientTime';
import {useResolvedGraphics} from '../../stores/graphicsStore';

/** No coastline constants from the former map: channel UVs provide real banks. */
export function ReferenceWater({channel=false,polluted=false,fall=false,mouth=-65}:{channel?:boolean;polluted?:boolean;fall?:boolean;mouth?:number}){
 const {animate,waterEffects}=useResolvedGraphics(),time=useAmbientTime(animate);
 const compile=useMemo(()=>(s:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  s.uniforms.valleyTime=time.current;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 riverPoint;varying vec2 riverUV;').replace('#include <begin_vertex>','#include <begin_vertex>\nriverPoint=position;riverUV=uv;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 riverPoint;varying vec2 riverUV;uniform float valleyTime;
   float vh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(vh(i),vh(i+vec2(1,0)),f.x),mix(vh(i+vec2(0,1)),vh(i+vec2(1,1)),f.x),f.y);}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=riverPoint.xz;float t=valleyTime;
   float warp=vn(p*.22+vec2(t*.04,-t*.025));
   float broad=vn((p+warp*2.3)*vec2(.52,.83)+vec2(t*.065,0));
   float fine=vn(mat2(.8,-.6,.6,.8)*p*vec2(1.2,3.1)-t*.10+warp);
   float height=(broad-.5)*.7+(fine-.5)*.3;
   float bank=${channel?'pow(abs(riverUV.y*2.-1.),5.)':'0.'};
   diffuseColor.rgb*=.95+height*.065;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.69,.62),bank*.27);
   float fleck=smoothstep(.73,.9,fine)*smoothstep(.48,.75,broad);
   diffuseColor.rgb+=vec3(.19,.27,.26)*fleck*.055;
   ${channel?`float distanceFromMouth=riverPoint.x*${(-110/Math.hypot(110,145)).toFixed(8)}+riverPoint.z*${(-145/Math.hypot(110,145)).toFixed(8)};
   diffuseColor.a*=smoothstep(${(mouth-14).toFixed(1)},${(mouth+14).toFixed(1)},distanceFromMouth);`:''}
   ${fall?`float stream=vn(vec2(riverUV.x*4.,riverUV.y*8.+t*1.1));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.81,.94,.92),stream*.7);`:''}
  `);
  if(waterEffects)s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition),rx=cross(sy,normal),ry=cross(normal,sx);float det=dot(sx,rx);
   normal=normalize(abs(det)*normal-.003*sign(det)*(dFdx(height)*rx+dFdy(height)*ry));
  `);
 },[channel,fall,waterEffects,mouth]);
 return <meshStandardMaterial color={fall?'#70cddc':polluted?'#477b7b':channel?'#27b6d0':'#168eaf'} transparent={channel} depthWrite={!channel} roughness={.76} metalness={0} side={2} onBeforeCompile={compile} customProgramCacheKey={()=>`valley-water-3-${channel}-${fall}-${waterEffects}-${mouth}`}/>;
}
