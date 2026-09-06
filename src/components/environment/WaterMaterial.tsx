import {useCallback,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {MeshStandardMaterial} from 'three';
import {useResolvedGraphics} from '../../stores/graphicsStore';

/** Fine ripples use the existing water mesh: no reflection scene or extra render target. */
export function WaterMaterial({color,vertexColors=false}:{color:string;vertexColors?:boolean}){
 const {waterEffects,animate}=useResolvedGraphics(),time=useRef({value:0});
 useFrame(()=>{if(animate)time.current.value=performance.now()/1000;});
 const compile=useCallback((shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  shader.uniforms.waterTime=time.current;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 waterPosition;')
   .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nwaterPosition=(modelMatrix*vec4(transformed,1.0)).xz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 waterPosition; uniform float waterTime;')
   .replace('#include <color_fragment>',`#include <color_fragment>
    vec2 p=waterPosition;
    float warp=sin(p.x*.31-p.y*.24)*.65+sin(p.y*.57+p.x*.17)*.35;
    float wave=sin(p.x*1.7+p.y*.83+warp+waterTime*.65)*.55
      +sin(p.x*-.72+p.y*2.21+warp*1.8-waterTime*.43)*.3
      +sin(p.x*3.1+p.y*.35+waterTime*.18)*.15;
    float glint=pow(max(0.0,wave),10.0);
    diffuseColor.rgb*=.985+wave*.025;
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.6,.92,1.),glint*.07);
   `);
 },[]);
 return waterEffects?<meshStandardMaterial key="ripples" color={color} vertexColors={vertexColors} roughness={.32} onBeforeCompile={compile} customProgramCacheKey={()=>'water-ripples-v2'}/>:<meshStandardMaterial key="plain" color={color} vertexColors={vertexColors} roughness={.5}/>;
}
