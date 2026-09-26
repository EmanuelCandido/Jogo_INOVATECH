import {useCallback} from 'react';
import {useAmbientTime} from '../../game/useAmbientTime';
import {DataTexture,LinearFilter,RGBAFormat,type MeshStandardMaterial} from 'three';
import {coastline} from '../../config/terrain';
import {useResolvedGraphics} from '../../stores/graphicsStore';

// A shared 1 KB shoreline lookup gives shallows their actual coastal shape.
const bytes=new Uint8Array(256*4);
for(let i=0;i<256;i++){
 const z=-100+i/255*200,j=coastline.findIndex(p=>p.z>=z),a=coastline[Math.max(0,j-1)],b=coastline[Math.max(0,j)];
 const x=a.x+(b.x-a.x)*(z-a.z)/Math.max(.0001,b.z-a.z),v=Math.round((x+100)/200*65535);
 bytes.set([v>>8,v&255,0,255],i*4);
}
const shoreTexture=new DataTexture(bytes,256,1,RGBAFormat);
shoreTexture.minFilter=shoreTexture.magFilter=LinearFilter;shoreTexture.needsUpdate=true;

/** Colour, shoals and broad ripples remain on mobile; fine normals are optional. */
export function WaterMaterial({color,vertexColors=false,pond=false}:{color:string;vertexColors?:boolean;pond?:boolean}){
 const {waterEffects,animate}=useResolvedGraphics(),time=useAmbientTime(animate);
 const compile=useCallback((shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  shader.uniforms.waterTime=time.current;shader.uniforms.shoreTexture={value:shoreTexture};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 waterPosition; varying vec2 basinUV;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nbasinUV=position.xy;')
   .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nwaterPosition=(modelMatrix*vec4(transformed,1.0)).xz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec2 waterPosition; varying vec2 basinUV; uniform float waterTime; uniform sampler2D shoreTexture;
   float waterHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float waterNoise(vec2 p){
    vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);
    return mix(mix(waterHash(i),waterHash(i+vec2(1,0)),f.x),mix(waterHash(i+vec2(0,1)),waterHash(i+vec2(1,1)),f.x),f.y);
   }
  `).replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=waterPosition;
   vec2 shoreSample=texture2D(shoreTexture,vec2(clamp((p.y+100.)/200.,0.,1.)*255./256.+.5/256.,.5)).rg;
   float coastX=dot(shoreSample,vec2(65280.,255.))/65535.*200.-100.;
   float bend=clamp((p.x+18.)/20.,0.,1.);
   float center=-45.5+sin((p.x+20.)/18.)*.4-13.*bend*bend*(3.-2.*bend);
   float riverDepth=1.4-abs(p.y-center);
   float beach=3.1*pow(max(0.,sin(clamp((p.y+8.)/19.,0.,1.)*3.14159)),.6);
   float shoreDistance=${pond?'(1.-length(basinUV))*2.1':'max(p.x-coastX-beach,riverDepth)'};
   float shoal=exp(-max(shoreDistance,0.)*.18);
   // Two drifting, warped fields break the former evenly spaced sine bands.
   vec2 drift=vec2(waterTime*.045,-waterTime*.025);
   float warp=waterNoise(p*.23+drift);
   vec2 warped=p+vec2(warp*2.1,waterNoise(p*.19+17.4-drift)*1.8);
   float broad=waterNoise(warped*vec2(.43,.77)+drift);
   float small=waterNoise(mat2(.8,-.6,.6,.8)*warped*vec2(1.1,2.3)-drift*1.7);
   float swell=(broad-.5)*.8+(small-.5)*.2;
   float ripple=sin(p.x*3.9+p.y*2.7+warp*5.-waterTime*.6)*.025;
   float waterHeight=swell${waterEffects?'+ripple':''};
   float shimmer=smoothstep(.64,.88,small)*smoothstep(.38,.7,broad);
   float foamBand=1.-smoothstep(.04,.25,abs(shoreDistance-(.12+warp*.13)));
   float foam=foamBand*smoothstep(.38,.72,waterNoise(p*1.7+drift))*.23${pond?'':'*(1.-smoothstep(.05,.5,beach))'};
   // Preserve the pollution tint carried by vertex colours in the mission reach.
   diffuseColor.rgb*=.83+waterHeight*.09+shoal*.08;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.025,.43,.46),shoal*.38);
   diffuseColor.rgb+=vec3(.08,.14,.15)*shimmer*.055;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.63,.88,.85),foam);
  `);
  if(waterEffects)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition);
   vec3 rx=cross(sy,normal),ry=cross(normal,sx);
   float det=dot(sx,rx);
   normal=normalize(abs(det)*normal-.038*sign(det)*(dFdx(waterHeight)*rx+dFdy(waterHeight)*ry));
  `);
 },[waterEffects,pond]);
 return <meshStandardMaterial key={`${waterEffects}-${pond}`} color={color} vertexColors={vertexColors} roughness={waterEffects?.36:.45} metalness={.04} onBeforeCompile={compile} customProgramCacheKey={()=>`water-soft-v5-${waterEffects}-${pond}`} userData={{ambient:true}}/>;
}
