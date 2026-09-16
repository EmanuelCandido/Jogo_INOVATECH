import type {MeshStandardMaterial} from 'three';

/** Fine turf colour for green roofs, independent of the tree leaf pattern. */
export function finishRoofGrass(material:MeshStandardMaterial){
 material.roughness=.98;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 turfPoint;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nturfPoint=position.xz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec2 turfPoint;
   float turfHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float turfNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(turfHash(i),turfHash(i+vec2(1,0)),f.x),mix(turfHash(i+vec2(0,1)),turfHash(i+vec2(1,1)),f.x),f.y);}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   float turf=turfNoise(turfPoint*3.5);
   vec2 blades=turfPoint*vec2(75.,25.);
   float footprint=max(length(dFdx(blades)),length(dFdy(blades)));
   float detail=1.-smoothstep(.3,1.2,footprint);
   // Compute the footprint for every fragment, then skip noise only where its
   // unchanged filter makes the contribution exactly zero.
   float fine=.5;if(detail>0.)fine=turfNoise(blades);
   diffuseColor.rgb*=.94+turf*.09+(fine-.5)*.075*detail;
  `);
 };
 material.customProgramCacheKey=()=> 'roof-turf-v2';material.needsUpdate=true;
}
