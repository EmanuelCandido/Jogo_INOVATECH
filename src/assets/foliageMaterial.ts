import {finishHardSurfaces} from './surfaceFinish';
import {finishRoofGrass} from './roofGrassMaterial';
import {Mesh,MeshStandardMaterial,type Object3D} from 'three';

const foliageNames=new Set(['eco.leaf','eco.leaflight','eco.oakleaf','eco.mapleleaf','eco.firleaf','eco.flower','eco.petal','eco.bloomshade']);
const finished=new WeakSet<MeshStandardMaterial>();
/** Painted, pointed leaves with veins; no pebble-like bump or alpha overdraw.
 * Triplanar projection avoids a visible seam on the rounded crowns.
 */
export function finishFoliage(scene:Object3D,economical=false){
 finishHardSurfaces(scene);
 scene.traverse(o=>{
  if(!(o instanceof Mesh))return;
  for(const material of Array.isArray(o.material)?o.material:[o.material]){
   if(!(material instanceof MeshStandardMaterial)||finished.has(material))continue;
   if(material.name==='eco.roofgrass'){finished.add(material);finishRoofGrass(material);continue;}
   if(!foliageNames.has(material.name))continue;
   finished.add(material);material.roughness=.92;
   const fir=material.name==='eco.firleaf',flower=/flower|petal|bloom/.test(material.name);
   material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 foliagePoint; varying vec3 foliageNormal;')
     .replace('#include <begin_vertex>','#include <begin_vertex>\nfoliagePoint=position; foliageNormal=normal;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
     varying vec3 foliagePoint; varying vec3 foliageNormal;
     float leafHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
     vec2 paintedLeaf(vec2 uv){
      vec2 id=floor(uv),q=fract(uv)-.5;
      float seed=leafHash(id),angle=seed*6.283;
      q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;
      q.y+=.05*sin(seed*31.);
      float lengthwise=abs(q.y)/.49;
      float width=${fir?'.095':'.31'}*max(.02,1.-pow(lengthwise,1.5));
      float edge=${flower?'length(q)-(.27+.06*cos(atan(q.y,q.x)*5.))':'abs(q.x)-width'};
      float aa=max(fwidth(edge),.006);
      float mask=(1.-smoothstep(-aa,aa,edge))*(1.-smoothstep(.94,1.02,lengthwise));
      float midrib=(1.-smoothstep(.008,.018+aa,abs(q.x)))*mask;
      float ribs=1.-smoothstep(.018,.035+aa,abs(fract(q.y*7.-abs(q.x)*4.)-.5));
      float halfShade=q.x<0.?.86:1.08;
      float tone=(.91+seed*.35)*halfShade+midrib*.20+ribs*mask*.055;
      float rim=(1.-smoothstep(.0,.026+aa,abs(edge)))*.12;
      return vec2(mask,tone-rim);
     }
     float paintedBranch(vec2 uv){
      vec2 back=paintedLeaf(uv),front=paintedLeaf(uv+vec2(.47,.61));
      float value=mix(.72,back.y,back.x);
      return mix(value,front.y,front.x*.92);
     }
    `).replace('#include <color_fragment>',`#include <color_fragment>
     vec3 fp=foliagePoint*${fir?'7.0':flower?'6.5':'5.0'};
     vec3 weights=pow(abs(normalize(foliageNormal)),vec3(5.));weights/=dot(weights,vec3(1.));
     float leaves=paintedBranch(fp.yz)*weights.x+paintedBranch(fp.xz)*weights.y+paintedBranch(fp.xy)*weights.z;
     float footprint=max(length(dFdx(fp)),length(dFdy(fp)));
     float detail=1.-smoothstep(.30,1.1,footprint);
     diffuseColor.rgb*=mix(.94,leaves,detail);
    `);
   };
   material.customProgramCacheKey=()=>`foliage-painted-v3-${economical}-${fir}-${flower}`;
   material.needsUpdate=true;
  }
 });
}
