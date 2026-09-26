import {SRGBColorSpace,Vector2,WebGLRenderTarget,type Camera,type Material,type Mesh,type Object3D,type Scene,type WebGLRenderer} from 'three';

/** The city is static except for water and surf. With the camera still, the
 * last complete frame is kept and only those animated surfaces are drawn
 * again over it, every frame: the still image is the same, at a fraction of
 * the cost. Anything else that changes (camera, scene, size, shadows,
 * transitions) draws a new complete frame.
 *
 * The frame lives in one multisampled target (4 samples, like the canvas'
 * own antialiasing) that persists between frames, and is copied to a canvas
 * without antialiasing. Opaque water is redrawn in place: each sample passes
 * the depth test exactly where water was the nearest surface, so edges keep
 * their samples. The surf and river mouths blend over that fresh water. The
 * target is flagged like an XR target so three applies the same tone mapping
 * and sRGB output as on screen, with the same shader programs. */
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
// ?cache=0 draws every frame completely, as before. Benchmarks keep their
// established path unless they ask for this one.
export const staticFrameEnabled=params.get('cache')!=='0'&&(params.get('benchmark')!=='1'||params.get('cache')==='1');
const ambientLayer=31,debug=params.has('cacheDebug');

/** Materials animated by the ambient clock (water, surf) carry userData.ambient. */
export const isAmbientMaterial=(m:Material)=>m.userData.ambient===true;
function isAmbient(o:Object3D){
 const m=(o as Mesh).material;
 return !!(o as Mesh).isMesh&&!!m&&(Array.isArray(m)?m.some(isAmbientMaterial):isAmbientMaterial(m));
}

let ambientRequest=false,dirty=true;
/** Frames drawn completely or from the kept frame, and why frames were redrawn. */
export const staticFrameStats={full:0,reused:0,reasons:{} as Record<string,number>};
const reason=(r:string)=>{staticFrameStats.reasons[r]=(staticFrameStats.reasons[r]??0)+1;};
/** Wrap a demand-mode invalidate: every request marks the kept frame stale,
 * except the ambient animation's own requests. */
export function trackInvalidate<T extends (...args:never[])=>void>(invalidate:T):T{
 return ((...args:never[])=>{
  if(!ambientRequest){dirty=true;if(debug)reason(new Error().stack?.split('\n').slice(2,5).map(l=>l.trim()).join(' < ')??'?');}
  invalidate(...args);
 }) as T;
}
/** Request a frame for the ambient animation only. */
export function ambientInvalidate(invalidate:()=>void){ambientRequest=true;try{invalidate();}finally{ambientRequest=false;}}
export function markStaticFrameDirty(){dirty=true;}

export function createStaticFrame(gl:WebGLRenderer){
 const context=gl.getContext() as WebGL2RenderingContext;
 const frame=new WebGLRenderTarget(1,1,{samples:Math.min(4,gl.capabilities.maxSamples),depthBuffer:true,stencilBuffer:false});
 frame.texture.colorSpace=SRGBColorSpace;frame.resolveDepthBuffer=false;
 // Plain 8-bit storage for both the samples and the resolved copy: the shader
 // already encodes sRGB, as it does for the canvas.
 frame.texture.internalFormat='RGBA8';
 // Same tone mapping, sRGB encoding and 8-bit storage as the canvas.
 (frame as unknown as {isXRRenderTarget:boolean}).isXRRenderTarget=true;
 // Real multisampled buffers, which keep their samples between frames.
 (gl.properties.get(frame) as {__useRenderToTexture?:boolean}).__useRenderToTexture=false;
 const size=new Vector2(),last={world:new Float64Array(16),projection:new Float64Array(16),width:0,height:0,valid:false};
 let ambient=0;
 const sameCamera=(camera:Camera)=>{
  const w=camera.matrixWorld.elements,p=camera.projectionMatrix.elements;let same=true;
  for(let i=0;i<16;i++){if(last.world[i]!==w[i]||last.projection[i]!==p[i])same=false;last.world[i]=w[i];last.projection[i]=p[i];}
  return same;
 };
 const present=(width:number,height:number)=>{
  // Rendering resolved the samples into the target's texture; copy it out.
  const resolved=(gl.properties.get(frame) as {__webglFramebuffer?:WebGLFramebuffer}).__webglFramebuffer??null;
  gl.state.bindFramebuffer(context.READ_FRAMEBUFFER,resolved);gl.state.bindFramebuffer(context.DRAW_FRAMEBUFFER,null);
  gl.state.setScissorTest(false);gl.state.buffers.color.setMask(true);
  context.blitFramebuffer(0,0,width,height,0,0,width,height,context.COLOR_BUFFER_BIT,context.NEAREST);
 };
 return {
  /** `draw` renders the complete scene (it may use a depth prepass). */
  render(scene:Scene,camera:Camera,draw:(scene:Scene,camera:Camera)=>void){
   gl.getDrawingBufferSize(size);
   const width=Math.floor(size.x),height=Math.floor(size.y);
   if(width!==last.width||height!==last.height){
    // Grow only: moving at a lower resolution uses a corner of the same
    // buffers instead of reallocating them at every start and stop.
    if(width>frame.width||height>frame.height)frame.setSize(Math.max(width,frame.width),Math.max(height,frame.height));
    frame.viewport.set(0,0,width,height);frame.scissor.set(0,0,width,height);
    last.width=width;last.height=height;last.valid=false;
   }
   camera.updateMatrixWorld();
   const cameraSame=sameCamera(camera);
   const reuse=last.valid&&!dirty&&cameraSame&&ambient>0&&!gl.shadowMap.needsUpdate&&!scene.overrideMaterial;
   if(!reuse)reason(!last.valid?'first':dirty?'requested':!cameraSame?'camera':!ambient?'no-water':gl.shadowMap.needsUpdate?'shadows':'override');
   if(reuse)staticFrameStats.reused++;else staticFrameStats.full++;
   dirty=false;
   const autoClear=gl.autoClear,layers=camera.layers.mask,previous=gl.getRenderTarget();
   try{
    gl.setRenderTarget(frame);
    if(reuse){
     // Only the animated surfaces, in three's usual order: opaque, then blended.
     gl.autoClear=false;camera.layers.set(ambientLayer);scene.userData.dynamicPass=true;
     gl.render(scene,camera);
    }else{
     ambient=0;
     scene.traverse(o=>{
      if((o as {isLight?:boolean}).isLight)o.layers.enable(ambientLayer);
      else if(isAmbient(o)){o.layers.enable(ambientLayer);ambient++;}
     });
     draw(scene,camera);last.valid=true;
    }
    present(width,height);
   }finally{
    camera.layers.mask=layers;gl.autoClear=autoClear;scene.userData.dynamicPass=false;
    gl.setRenderTarget(previous);
   }
  },
  dispose(){frame.dispose();},
 };
}
