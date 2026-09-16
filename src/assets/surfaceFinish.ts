import {Mesh,MeshStandardMaterial,type Object3D} from 'three';
export type SurfaceKind='paint'|'metal'|'wood'|'concrete'|'paving'|'asphalt'|'glass'|'grass'|'sportsGrass'|'soil';
type Compiler=MeshStandardMaterial['onBeforeCompile'];
const done=new WeakSet<MeshStandardMaterial>(),compilers=new Map<SurfaceKind,Compiler>();
const kinds:Record<string,SurfaceKind>={
 'concrete':'paving','roofdeck':'concrete','stone':'concrete','sidewalk':'paving',
 'glass':'glass','glassdark':'glass','autoglass':'glass','lawn':'grass',
 'fieldturf':'sportsGrass','fieldstripe':'sportsGrass',
 'wood':'wood','woodlight':'wood','wooddark':'wood','trunk':'wood',
 'metal':'metal','alloy':'metal','rubber':'asphalt',
 'white':'paint','trim':'paint','cream':'paint','coral':'paint','pink':'paint','sage':'paint','teal':'paint','navy':'paint','red':'paint','blue':'paint','signal':'paint','roof':'paint','orange':'paint',
};
export function surfaceShader(kind:SurfaceKind):Compiler{
 if(compilers.has(kind))return compilers.get(kind)!;
 const compile:Compiler=shader=>{
  const world=['paving','concrete','asphalt','grass','sportsGrass','soil'].includes(kind);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 surfacePoint; varying vec3 surfaceDirection;')
   .replace('#include <begin_vertex>',`#include <begin_vertex>
    surfacePoint=position;surfaceDirection=normal;
    ${world?`vec4 finishWorld=vec4(position,1.);
    #ifdef USE_BATCHING
      finishWorld=batchingMatrix*finishWorld;surfaceDirection=mat3(batchingMatrix)*surfaceDirection;
    #endif
    #ifdef USE_INSTANCING
      finishWorld=instanceMatrix*finishWorld;surfaceDirection=mat3(instanceMatrix)*surfaceDirection;
    #endif
    surfacePoint=(modelMatrix*finishWorld).xyz;surfaceDirection=mat3(modelMatrix)*surfaceDirection;`:''}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 surfacePoint;varying vec3 surfaceDirection;
   float finishHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float finishNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(finishHash(i),finishHash(i+vec2(1,0)),f.x),mix(finishHash(i+vec2(0,1)),finishHash(i+vec2(1,1)),f.x),f.y);}
   // The existing filter already removes this term at zero weight. Keep all
   // derivatives outside conditional flow; only skip pure noise arithmetic.
   float finishFilteredNoise(vec2 p,float weight){if(weight==0.)return 0.;return (finishNoise(p)-.5)*weight;}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   vec3 n=abs(normalize(surfaceDirection));
   vec2 p=n.y>n.x&&n.y>n.z?surfacePoint.xz:n.x>n.z?surfacePoint.zy:surfacePoint.xy;
   float broad=finishNoise(p*3.1)-.5;
   vec2 grainPoint=p*${kind==='wood'?'vec2(32.,2.2)':kind==='metal'?'vec2(130.,3.)':kind==='asphalt'?'vec2(36.)':'vec2(65.)'};
   float footprint=max(length(dFdx(grainPoint)),length(dFdy(grainPoint)));
   float fine=finishFilteredNoise(grainPoint,1.-smoothstep(.4,1.4,footprint));
   float surfaceTone=${kind==='wood'?'broad*.09+fine*.14':kind==='concrete'||kind==='paving'?'broad*.045+fine*.065':kind==='asphalt'?'(finishNoise(p*.7)-.5)*.07+fine*.17':kind==='metal'?'broad*.013+fine*.045':'broad*.017+fine*.025'};
   ${kind==='paving'?`// Metre-sized slabs stay continuous across scaled and instanced paths.
   vec2 slab=p/vec2(.62,.78);slab.x+=mod(floor(slab.y),2.)*.5;
   vec2 edge=min(fract(slab),1.-fract(slab));
   float aa=max(fwidth(slab.x),fwidth(slab.y));
   float joint=1.-smoothstep(.009,.009+aa,min(edge.x,edge.y));
   surfaceTone+=(finishHash(floor(slab))-.5)*.038-joint*.105*(1.-smoothstep(.22,.8,aa))*step(.8,n.y);`:''}
   ${kind==='wood'?`float fibresDetail=1.-smoothstep(.3,1.4,footprint);
   if(fibresDetail>0.){
    float fibres=finishNoise(p*vec2(85.,2.)+vec2(finishNoise(p*3.)*2.,0.));
    surfaceTone+=(fibres-.5)*.06*fibresDetail;
   }`:''}
   ${kind==='glass'?`// Soft sky reflections, a quiet darker lower pane, no stone noise.
   float sky=smoothstep(.1,.95,fract(surfacePoint.y/.77));
   float reflection=exp(-pow(sin(p.x*1.25+p.y*.38+.5)*3.8,2.));
   float pane=finishHash(floor(vec2(p.x/.68,surfacePoint.y/.77)));
   surfaceTone=(sky-.5)*.15+(pane-.5)*.055;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.43,.73,.82),reflection*.13);
   diffuseColor.rgb+=vec3(.018,.024,.028)*sky;`:''}
   ${kind==='grass'?`float meadow=finishNoise(p*.29)*.6+finishNoise(p*.83)*.3+finishNoise(p*3.7)*.1;
   vec2 blades=p*vec2(51.,19.);float bladeAA=max(length(dFdx(blades)),length(dFdy(blades)));
   float grassDetail=1.-smoothstep(.3,1.3,bladeAA),grassFine=0.;
   if(grassDetail>0.)grassFine=(finishNoise(blades+vec2(finishNoise(p*8.)*3.,0.))-.5)*grassDetail;
   surfaceTone=mix(-.085,.055,meadow)+grassFine*.13;`:''}
   ${kind==='sportsGrass'?`// Fine mown turf: low contrast and filtered at distant zooms.
   vec2 blades=p*vec2(48.,21.);float bladeAA=max(length(dFdx(blades)),length(dFdy(blades)));
   float sportsDetail=1.-smoothstep(.25,1.2,bladeAA),sportsFine=0.;
   if(sportsDetail>0.)sportsFine=(finishNoise(blades)-.5)*.035*sportsDetail;
   surfaceTone=(finishNoise(p*1.8)-.5)*.018+sportsFine;`:''}
   ${kind==='soil'?`// Irregular compacted earth, with broad damp patches and filtered grit.
   float soilLarge=finishNoise(p*.17+vec2(13.7,8.2));
   float soilMedium=finishNoise(p*.83+vec2(4.1,17.3));
   vec2 gritPoint=p*29.;float gritAA=max(length(dFdx(gritPoint)),length(dFdy(gritPoint)));
   float grit=finishFilteredNoise(gritPoint,1.-smoothstep(.4,1.5,gritAA));
   surfaceTone=(soilLarge-.5)*.23+(soilMedium-.5)*.10+grit*.10;
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.82,.85,.83),smoothstep(.55,.8,soilLarge)*.45);`:''}
   diffuseColor.rgb*=1.+surfaceTone;
  `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor+surfaceTone*.4,.08,1.);
  `);
 };
 compilers.set(kind,compile);return compile;
}
/** Match texture to material semantics; never put stone noise on glass or turf. */
export function finishHardSurfaces(scene:Object3D){
 scene.traverse(o=>{
  if(!(o instanceof Mesh))return;
  for(const material of Array.isArray(o.material)?o.material:[o.material]){
   if(!(material instanceof MeshStandardMaterial)||done.has(material))continue;
   const key=material.name.replace(/^eco\./,''),kind=key.startsWith('paint_')?'paint':kinds[key];
   if(!kind)continue;
   if(kind==='glass'){material.roughness=.27;material.metalness=.10;}
   done.add(material);material.onBeforeCompile=surfaceShader(kind);material.customProgramCacheKey=()=>`surface-finish-v3-${kind}`;material.needsUpdate=true;
  }
 });
}
