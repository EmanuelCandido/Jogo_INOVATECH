import type {MeshStandardMaterial} from 'three';
function mountainShader(shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0]){
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 mountainPoint;')
  .replace('#include <begin_vertex>','#include <begin_vertex>\nmountainPoint=position;');
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 mountainPoint;
 float mountainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float mountainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mountainHash(i),mountainHash(i+vec2(1,0)),f.x),mix(mountainHash(i+vec2(0,1)),mountainHash(i+vec2(1,1)),f.x),f.y);}
 `).replace('#include <color_fragment>',`#include <color_fragment>
 vec3 p=mountainPoint;
 float meadow=mountainNoise(p.xz*.29)*.6+mountainNoise(p.xz*.83)*.3+mountainNoise(p.xz*3.7)*.1;
 float strata=sin(p.y*5.+mountainNoise(p.xz*.38)*3.);
 float rock=smoothstep(5.,15.,p.y);
 diffuseColor.rgb*=mix(.89,1.065,meadow)*(1.+rock*(strata*.035+(mountainNoise(p.xz*9.)-.5)*.10));
 `);
}
export function MountainMaterial(){return <meshStandardMaterial vertexColors roughness={1} onBeforeCompile={mountainShader} customProgramCacheKey={()=>'mountain-strata-v1'}/>;}
