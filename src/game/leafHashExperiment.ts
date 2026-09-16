import {Camera,FloatType,GLSL3,Mesh,MeshStandardMaterial,NearestFilter,PlaneGeometry,RawShaderMaterial,RedFormat,RGBAFormat,Scene,WebGLRenderTarget,type Texture,type WebGLRenderer} from 'three';

const hash='fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453)';
const originalHash=`float leafHash(vec2 p){return ${hash};}`;
// Three reuses compiled programs without calling onBeforeCompile again. Keep
// the uniform object stable and update its value when a cache is recreated.
const hashUniforms=new WeakMap<MeshStandardMaterial,{value:Texture|null}>();

/** GPU-generated numeric cache, not a lower-resolution leaf texture. The leaf
 * shape, veins, filtering and three projections keep their original arithmetic.
 * Values outside the cache continue through the original hash function.
 */
export function cacheLeafHashes(gl:WebGLRenderer,scene:Scene,cells=false){
 if(!gl.extensions.has('EXT_color_buffer_float'))throw new Error('Cache exige alvo de renderização float');
 const size=128,half=size/2;
 const target=new WebGLRenderTarget(size,size,{format:cells?RGBAFormat:RedFormat,type:FloatType,minFilter:NearestFilter,magFilter:NearestFilter,depthBuffer:false,stencilBuffer:false,generateMipmaps:false});
 const cellValues=`float seed=${hash},angle=seed*6.283;`;
 const geometry=new PlaneGeometry(2,2),material=new RawShaderMaterial({glslVersion:GLSL3,depthTest:false,depthWrite:false,toneMapped:false,
  vertexShader:'precision highp float; in vec3 position; void main(){gl_Position=vec4(position,1.);}',
  fragmentShader:`precision highp float; out vec4 value; void main(){vec2 p=floor(gl_FragCoord.xy)-vec2(${half}.);${cells?`${cellValues}value=vec4(seed,cos(angle),sin(angle),sin(seed*31.));`:`value=vec4(${hash},0.,0.,1.);`}}`,
 });
 const quad=new Mesh(geometry,material),preparation=new Scene();quad.frustumCulled=false;preparation.add(quad);
 const previous=gl.getRenderTarget(),autoClear=gl.autoClear,xr=gl.xr.enabled,shadows=gl.shadowMap.needsUpdate;
 try{
  gl.xr.enabled=false;gl.autoClear=true;gl.setRenderTarget(target);
  const context=gl.getContext();if(context.checkFramebufferStatus(context.FRAMEBUFFER)!==context.FRAMEBUFFER_COMPLETE)throw new Error('Alvo float indisponível');
  gl.render(preparation,new Camera());
 }catch(error){target.dispose();throw error;}
 finally{gl.setRenderTarget(previous);gl.autoClear=autoClear;gl.xr.enabled=xr;gl.shadowMap.needsUpdate=shadows;geometry.dispose();material.dispose();}
 const materials=new Set<MeshStandardMaterial>(),restore:Array<()=>void>=[];
 scene.traverse(object=>{
  if(!(object instanceof Mesh))return;
  for(const source of Array.isArray(object.material)?object.material:[object.material])if(source instanceof MeshStandardMaterial&&source.customProgramCacheKey().startsWith('foliage-painted-'))materials.add(source);
 });
 for(const source of materials){
  const compile=source.onBeforeCompile,key=source.customProgramCacheKey;
  const uniform=hashUniforms.get(source)??{value:null};uniform.value=target.texture;hashUniforms.set(source,uniform);
  source.onBeforeCompile=function(shader,renderer){
   compile.call(this,shader,renderer);
   if(!shader.fragmentShader.includes(originalHash))throw new Error('Função de folhas não reconhecida');
   shader.uniforms.leafHashCache=uniform;
   const inside=`all(equal(p,floor(p)))&&all(greaterThanEqual(p,vec2(-${half}.)))&&all(lessThan(p,vec2(${half}.)))`;
   shader.fragmentShader=shader.fragmentShader.replace(originalHash,cells?`uniform highp sampler2D leafHashCache;
    vec4 leafCell(vec2 p){
     if(${inside})return texelFetch(leafHashCache,ivec2(p)+ivec2(${half}),0);
     ${cellValues}return vec4(seed,cos(angle),sin(angle),sin(seed*31.));
    }`:`uniform highp sampler2D leafHashCache;
    float leafHash(vec2 p){
     if(${inside})return texelFetch(leafHashCache,ivec2(p)+ivec2(${half}),0).r;
     return ${hash};
    }`);
   if(cells){
    const replacements=[['float seed=leafHash(id),angle=seed*6.283;','vec4 cell=leafCell(id);float seed=cell.x;'],['q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;','q=mat2(cell.y,-cell.z,cell.z,cell.y)*q;'],['q.y+=.05*sin(seed*31.);','q.y+=.05*cell.w;']];
    for(const [before,after]of replacements){if(!shader.fragmentShader.includes(before))throw new Error('Estado de folha não reconhecido');shader.fragmentShader=shader.fragmentShader.replace(before,after);}
   }
  };
  source.customProgramCacheKey=()=>`${key.call(source)}-${cells?'cell':'hash'}-cache-v1-${size}`;source.needsUpdate=true;
  restore.push(()=>{uniform.value=null;source.onBeforeCompile=compile;source.customProgramCacheKey=key;source.needsUpdate=true;});
 }
 let disposed=false;
 return {materials:materials.size,texels:size*size,bytes:size*size*(cells?16:4),dispose:()=>{if(disposed)return;disposed=true;restore.splice(0).forEach(fn=>fn());target.dispose();}};
}
