import type {MeshStandardMaterial} from 'three';
// World coordinates keep the tonal variation continuous across the mainland and hills.
function grassShader(shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0]){
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 grassPosition;')
  .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ngrassPosition=(modelMatrix*vec4(transformed,1.0)).xz;');
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 varying vec2 grassPosition;
 float grassHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float grassNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(grassHash(i),grassHash(i+vec2(1,0)),f.x),mix(grassHash(i+vec2(0,1)),grassHash(i+vec2(1,1)),f.x),f.y);}
 `).replace('#include <color_fragment>',`#include <color_fragment>
 float meadow=grassNoise(grassPosition*.29)*.6+grassNoise(grassPosition*.83)*.3+grassNoise(grassPosition*3.7)*.1;
 diffuseColor.rgb*=mix(.89,1.065,meadow);
 `);
}
export function GrassMaterial({attach}:{attach?:string}){return <meshStandardMaterial attach={attach} color='#7ac764' roughness={1} onBeforeCompile={grassShader} customProgramCacheKey={()=>'meadow-v1'}/>;}
