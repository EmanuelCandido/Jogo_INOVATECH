import {Matrix4,SRGBColorSpace,Vector2,WebGLRenderTarget,type Camera,type Material,type Mesh,type Object3D,type OrthographicCamera,type Scene,type WebGLRenderer} from 'three';

/** The city is static except for water and surf. With the camera still, the
 * last complete frame is kept and only those animated surfaces are drawn
 * again over it, every frame: the still image is the same, at a fraction of
 * the cost. Anything else that changes (scene, size, shadows, transitions)
 * draws a new complete frame.
 *
 * The frame lives in one multisampled target (4 samples, like the canvas'
 * own antialiasing) that persists between frames, and is copied to a canvas
 * without antialiasing. Opaque water is redrawn in place: each sample passes
 * the depth test exactly where water was the nearest surface, so edges keep
 * their samples. The surf and river mouths blend over that fresh water. The
 * target is flagged like an XR target so three applies the same tone mapping
 * and sRGB output as on screen, with the same shader programs.
 *
 * While the map is dragged or zoomed, the camera looks in one fixed direction
 * without perspective, so the new view is the previous image shifted (drag)
 * or scaled (zoom). The previous image is moved on the GPU and only the strips
 * that come into view are drawn. A drag is shifted by whole pixels, so the
 * image stays sharp; the camera is drawn up to half a pixel from its exact
 * place. The water waits, and a complete frame is drawn as soon as the finger
 * leaves the screen, so every still image is the same as before. */
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
// ?cache=0 draws every frame completely, as before. Benchmarks keep their
// established path unless they ask for this one.
export const staticFrameEnabled=params.get('cache')!=='0'&&(params.get('benchmark')!=='1'||params.get('cache')==='1');
// ?mover=0 keeps the still-frame cache but draws every moving frame completely.
const movingEnabled=params.get('mover')!=='0';
const ambientLayer=31,debug=params.has('cacheDebug');
/** Time without camera motion, with no finger on the map, before the sharp frame. */
const settleMs=180;
/** Share of the screen drawn anew above which a moving frame is drawn completely. */
const maxNewArea=.6;
/** View kept around the screen while moving, in pixels, and how far ahead
 * of a drag strips are drawn: frames of the current speed, at least minAhead. */
const margin=64,lookahead=2,minAhead=12;
/** Share of new area above which a zoomed frame becomes the next reference. */
const rebaseArea=.25;

/** Materials animated by the ambient clock (water, surf) carry userData.ambient. */
export const isAmbientMaterial=(m:Material)=>m.userData.ambient===true;
function isAmbient(o:Object3D){
 const m=(o as Mesh).material;
 return !!(o as Mesh).isMesh&&!!m&&(Array.isArray(m)?m.some(isAmbientMaterial):isAmbientMaterial(m));
}

let quiet=false,dirty=true;
/** Frames drawn completely, from the kept frame, or moved, and why frames were redrawn. */
export const staticFrameStats={full:0,reused:0,moved:0,strips:0,drawMs:0,moveMs:0,reasons:{} as Record<string,number>,last:null as unknown};
// ?cacheDebug exposes the counters for measurements in ordinary games.
if(debug&&typeof window!=='undefined')(window as unknown as {ecoStaticFrame:typeof staticFrameStats}).ecoStaticFrame=staticFrameStats;
const reason=(r:string)=>{staticFrameStats.reasons[r]=(staticFrameStats.reasons[r]??0)+1;};
/** Wrap a demand-mode invalidate: every request marks the kept frame stale,
 * except the ambient animation's and the map navigation's own requests. */
export function trackInvalidate<T extends (...args:never[])=>void>(invalidate:T):T{
 return ((...args:never[])=>{
  if(!quiet){dirty=true;if(debug)reason(new Error().stack?.split('\n').slice(2,5).map(l=>l.trim()).join(' < ')??'?');}
  invalidate(...args);
 }) as T;
}
function quietly(invalidate:()=>void){quiet=true;try{invalidate();}finally{quiet=false;}}
/** Request a frame for the ambient animation only. */
export const ambientInvalidate=quietly;
/** Request a frame for a camera move only (map drag, zoom, keys). */
export const cameraInvalidate=quietly;
/** Request a frame to measure what is on screen, without redrawing the city. */
export const measureInvalidate=quietly;
export function markStaticFrameDirty(){dirty=true;}
/** Whether something besides the camera and water changed since the last frame. */
export const staticFrameDirty=()=>dirty;

type Rect=[x:number,y:number,width:number,height:number];
/** An outer rectangle minus a covered one, both as [x0,y0,x1,y1]: up to four rectangles. */
function uncovered(outer:readonly number[],covered:readonly number[]):Rect[]{
 const [x0,y0,x1,y1]=outer,a0=Math.max(x0,covered[0]),b0=Math.max(y0,covered[1]),a1=Math.min(x1,covered[2]),b1=Math.min(y1,covered[3]);
 if(a1<=a0||b1<=b0)return [[x0,y0,x1-x0,y1-y0]];
 const out:Rect[]=[];
 if(a0>x0)out.push([x0,y0,a0-x0,y1-y0]);
 if(x1>a1)out.push([a1,y0,x1-a1,y1-y0]);
 if(b0>y0)out.push([a0,y0,a1-a0,b0-y0]);
 if(y1>b1)out.push([a0,b1,a1-a0,y1-b1]);
 return out;
}

export function createStaticFrame(gl:WebGLRenderer,requestFrame:()=>void){
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
 // Two plain images for moving frames: the reference and the one being built.
 const moved=[0,1].map(()=>{
  const t=new WebGLRenderTarget(1,1,{samples:0,depthBuffer:false,stencilBuffer:false});
  t.texture.internalFormat='RGBA8';t.texture.generateMipmaps=false;
  return t;
 });
 const framebuffer=(t:WebGLRenderTarget)=>{gl.initRenderTarget(t);return (gl.properties.get(t) as {__webglFramebuffer?:WebGLFramebuffer}).__webglFramebuffer??null;};
 const size=new Vector2(),last={width:0,height:0,valid:false};
 // Projection × view of the camera at the previous frame, of the image on
 // screen, and of the moving reference image.
 const cameraView=new Matrix4(),shown=new Matrix4(),shownProjection=new Matrix4(),base=new Matrix4(),baseProjection=new Matrix4(),mapping=new Matrix4(),scratch=new Matrix4();
 // Moving state: which plain image is the reference, which is on screen.
 let ambient=0,moving=false,reference=0,display=0,settle:ReturnType<typeof setTimeout>|undefined;
 const arm=()=>{
  clearTimeout(settle);
  settle=setTimeout(()=>{
   // Keep moving frames while a finger is still on the map.
   if(gl.domElement.classList.contains('dragging')){arm();return;}
   dirty=true;requestFrame();
  },settleMs);
 };
 const blit=(from:WebGLFramebuffer|null,to:WebGLFramebuffer|null,s:Rect,d:Rect,linear=false)=>{
  // Three's binding cache does not follow READ_FRAMEBUFFER when it binds
  // FRAMEBUFFER, so both are also bound directly.
  gl.state.bindFramebuffer(context.READ_FRAMEBUFFER,from);gl.state.bindFramebuffer(context.DRAW_FRAMEBUFFER,to);
  context.bindFramebuffer(context.READ_FRAMEBUFFER,from);context.bindFramebuffer(context.DRAW_FRAMEBUFFER,to);
  gl.state.setScissorTest(false);gl.state.buffers.color.setMask(true);
  context.blitFramebuffer(s[0],s[1],s[0]+s[2],s[1]+s[3],d[0],d[1],d[0]+d[2],d[1]+d[3],context.COLOR_BUFFER_BIT,linear?context.LINEAR:context.NEAREST);
 };
 // Rendering resolved the samples into the target's texture.
 const resolved=()=>(gl.properties.get(frame) as {__webglFramebuffer?:WebGLFramebuffer}).__webglFramebuffer??null;
 const whole=(width:number,height:number):Rect=>[0,0,width,height];
 const fullView=(width:number,height:number)=>{frame.viewport.set(0,0,width,height);frame.scissor.set(0,0,width,height);frame.scissorTest=false;};

 /** Screen rectangle → pieces in an image stored with a wrap-around origin:
  * [screen x, screen y, width, height, stored x, stored y]. Stored images keep
  * a margin around the screen, so they are (width + 2·margin) wide. */
 const pieces=(r:Rect,o:readonly number[],width:number,height:number)=>{
  const split=(x:number,w:number,shift:number,n:number)=>{
   const at=((x+shift)%n+n)%n;
   return at+w<=n?[[x,w,at]]:[[x,n-at,at],[x+n-at,w-(n-at),0]];
  };
  const out:number[][]=[];
  for(const [x,w,sx] of split(r[0],r[2],o[0]+margin,width+2*margin))for(const [y,h,sy] of split(r[1],r[3],o[1]+margin,height+2*margin))if(w>0&&h>0)out.push([x,y,w,h,sx,sy]);
  return out;
 };
 // Per plain image: where screen pixel (0,0) is stored (a drag only moves
 // this origin, so the image is never copied), and the part of the view
 // around the screen it holds, as [x0,y0,x1,y1] in screen pixels.
 const origin=[[0,0],[0,0]],holds=[[0,0,0,0],[0,0,0,0]];
 /** Copy a rectangle of a plain framebuffer into a stored image at screen rectangle r. */
 const store=(from:WebGLFramebuffer|null,s:Rect,index:number,r:Rect,width:number,height:number)=>{
  const out=framebuffer(moved[index]);
  for(const [x,y,w,h,sx,sy] of pieces(r,origin[index],width,height))blit(from,out,[s[0]+x-r[0],s[1]+y-r[1],w,h],[sx,sy,w,h]);
 };
 /** Show a stored image on the canvas. */
 const show=(index:number,width:number,height:number)=>{
  const from=framebuffer(moved[index]);
  for(const [x,y,w,h,sx,sy] of pieces(whole(width,height),origin[index],width,height))blit(from,null,[sx,sy,w,h],[x,y,w,h]);
 };

 /** Draw the view as the previous image moved plus the newly visible strips.
  * Returns false when the move cannot be expressed that way. */
 const move=(scene:Scene,camera:Camera,view:Matrix4,width:number,height:number,draw:(scene:Scene,camera:Camera)=>void)=>{
  const ortho=camera as OrthographicCamera;
  if(!ortho.isOrthographicCamera||ortho.view?.enabled)return false;
  if(!moving){
   // The complete frame on screen becomes the reference.
   origin[0]=[0,0];holds[0]=[0,0,width,height];
   store(resolved(),whole(width,height),0,whole(width,height),width,height);
   reference=0;base.copy(shown);baseProjection.copy(shownProjection);moving=true;
  }
  // Reference NDC → current NDC. Same direction and no perspective: a scale
  // and an offset in x and y, independent of depth.
  const m=mapping.multiplyMatrices(view,scratch.copy(base).invert()).elements;
  const straight=Math.abs(m[1])+Math.abs(m[2])+Math.abs(m[3])+Math.abs(m[4])+Math.abs(m[6])+Math.abs(m[7])+Math.abs(m[8])+Math.abs(m[9])<1e-6&&Math.abs(m[15]-1)<1e-9;
  if(!straight||Math.abs(m[0]-m[5])>1e-6*m[0])return false;
  const pan=ortho.projectionMatrix.equals(baseProjection);
  const scale=pan?1:m[0];
  if(scale<.4||scale>3)return false;
  // Reference pixel p appears at p·scale + offset (GL pixels, from the bottom).
  const ox=(m[12]+1-scale)*width/2,oy=(m[13]+1-scale)*height/2;
  const screen=[0,0,width,height],limit=[-margin,-margin,width+margin,height+margin];
  let rx=0,ry=0,target:number,strips:Rect[],covers:number[];
  if(pan){
   // Whole pixels: the image is only shifted. The rest of the view is drawn
   // for the camera moved by the same fraction of a pixel.
   const ix=Math.round(ox),iy=Math.round(oy);rx=ox-ix;ry=oy-iy;
   const h=holds[reference];
   const kept=[Math.max(h[0]+ix,limit[0]),Math.max(h[1]+iy,limit[1]),Math.min(h[2]+ix,limit[2]),Math.min(h[3]+iy,limit[3])];
   if(kept[0]<=0&&kept[1]<=0&&kept[2]>=width&&kept[3]>=height){strips=[];covers=kept;}
   else{
    // Draw ahead of the motion: the view that the next frames of this drag
    // will reveal, so strips are drawn every few frames instead of each one.
    const ahead=(v:number)=>Math.min(margin,Math.max(minAhead,Math.abs(v)*lookahead));
    covers=[ix>0?-ahead(ix):0,iy>0?-ahead(iy):0,ix<0?width+ahead(ix):width,iy<0?height+ahead(iy):height];
    strips=uncovered(covers,kept);
   }
   if(strips.reduce((a,r)=>a+r[2]*r[3],0)/(width*height)>maxNewArea)return false;
   // The reference itself: screen pixel p now shows what was at p - i.
   target=reference;const o=origin[target];
   o[0]=o[0]-ix;o[1]=o[1]-iy;
   if(!strips.length)holds[target]=kept;
  }else{
   if(origin[reference][0]||origin[reference][1]){
    // Scaling needs a plain layout: unwrap the dragged image once.
    const other=1-reference,h=holds[reference],r:Rect=[h[0],h[1],h[2]-h[0],h[3]-h[1]];
    origin[other]=[0,0];holds[other]=[...h];
    const src=framebuffer(moved[reference]),out=framebuffer(moved[other]);
    for(const [x,y,w,hh,sx,sy] of pieces(r,origin[reference],width,height))blit(src,out,[sx,sy,w,hh],[x+margin,y+margin,w,hh]);
    reference=other;
   }
   // The part of the reference that lands on the screen, scaled.
   const h=holds[reference];
   const x0=Math.max(0,Math.round(h[0]*scale+ox)),y0=Math.max(0,Math.round(h[1]*scale+oy)),x1=Math.min(width,Math.round(h[2]*scale+ox)),y1=Math.min(height,Math.round(h[3]*scale+oy));
   const to:Rect=[x0,y0,Math.max(0,x1-x0),Math.max(0,y1-y0)];
   const sx0=Math.max(h[0],Math.round((x0-ox)/scale)),sy0=Math.max(h[1],Math.round((y0-oy)/scale)),sx1=Math.min(h[2],Math.round((x1-ox)/scale)),sy1=Math.min(h[3],Math.round((y1-oy)/scale));
   const from:Rect=[sx0,sy0,Math.max(0,sx1-sx0),Math.max(0,sy1-sy0)];
   if(debug)staticFrameStats.last={scale,ox,oy,from,to};
   strips=uncovered(screen,[x0,y0,x1,y1]);covers=screen;
   if(strips.reduce((a,r)=>a+r[2]*r[3],0)/(width*height)>maxNewArea)return false;
   target=1-reference;origin[target]=[0,0];holds[target]=[...screen];
   if(to[2]&&to[3]&&from[2]&&from[3])blit(framebuffer(moved[reference]),framebuffer(moved[target]),[from[0]+margin,from[1]+margin,from[2],from[3]],[to[0]+margin,to[1]+margin,to[2],to[3]],true);
  }
  const fresh=strips.reduce((a,r)=>a+r[2]*r[3],0)/(width*height);
  const layers=camera.layers.mask,frameWidth=frame.width,frameHeight=frame.height;
  try{
   // Instance culling below may request another frame: that is not a change.
   quiet=true;
   for(const r of strips){
    // Only this rectangle: the camera's view is cut to it, so culling skips
    // everything outside and each pixel is drawn once. It is drawn in the
    // corner of the target, and three resolves only that corner.
    ortho.setViewOffset(width,height,r[0]+rx,height-r[1]-r[3]-ry,r[2],r[3]);
    frame.viewport.set(0,0,r[2],r[3]);frame.scissor.set(0,0,r[2],r[3]);frame.scissorTest=true;
    frame.width=r[2];frame.height=r[3];
    gl.setRenderTarget(frame);
    const t=performance.now();draw(scene,camera);staticFrameStats.drawMs+=performance.now()-t;
    frame.width=frameWidth;frame.height=frameHeight;
    store(resolved(),[0,0,r[2],r[3]],target,r,width,height);
    staticFrameStats.strips++;
   }
   if(strips.length)holds[target]=covers;
  }finally{
   quiet=false;frame.width=frameWidth;frame.height=frameHeight;
   if(ortho.view?.enabled)ortho.clearViewOffset();
   camera.layers.mask=layers;fullView(width,height);gl.setRenderTarget(frame);
  }
  // Drawn camera: moved by the fraction of a pixel that was rounded away.
  shown.copy(view);shownProjection.copy(ortho.projectionMatrix);
  if(rx||ry)shown.premultiply(scratch.makeTranslation(-2*rx/width,-2*ry/height,0));
  display=target;
  // A drag is exact, so it is the next reference; a zoom becomes one once
  // enough of it was drawn anew.
  if(pan||fresh>rebaseArea){reference=target;base.copy(shown);baseProjection.copy(ortho.projectionMatrix);}
  return true;
 };

 const timed=(fn:()=>boolean)=>{const t=performance.now(),r=fn();staticFrameStats.moveMs+=performance.now()-t;return r;};
 return {
  /** `draw` renders the complete scene (it may use a depth prepass). */
  render(scene:Scene,camera:Camera,draw:(scene:Scene,camera:Camera)=>void){
   gl.getDrawingBufferSize(size);
   const width=Math.floor(size.x),height=Math.floor(size.y);
   if(width!==last.width||height!==last.height){
    // Grow only: moving at a lower resolution uses a corner of the same
    // buffers instead of reallocating them at every start and stop.
    if(width+2*margin>frame.width||height+2*margin>frame.height){
     // Room for the margin kept around the screen while moving.
     const w=Math.max(width+2*margin,frame.width),h=Math.max(height+2*margin,frame.height);
     // Allocate now, at the full size: later renders shrink width and height
     // for a moment to resolve only a corner.
     frame.setSize(w,h);for(const t of moved)t.setSize(w,h);
     gl.initRenderTarget(frame);for(const t of moved)gl.initRenderTarget(t);
    }
    last.width=width;last.height=height;last.valid=false;moving=false;
   }
   fullView(width,height);
   camera.updateMatrixWorld();
   const view=scratch.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
   const cameraSame=view.equals(cameraView);cameraView.copy(view);
   // Three leaves needsUpdate set while shadows are off; only a live shadow
   // map needs a complete frame.
   const shadowRefresh=gl.shadowMap.enabled&&(gl.shadowMap.needsUpdate||gl.shadowMap.autoUpdate);
   const requested=dirty,steady=!requested&&!shadowRefresh&&!scene.overrideMaterial;
   // Requests made while this frame is drawn are for the next one.
   dirty=false;
   const reuse=steady&&last.valid&&!moving&&cameraSame&&ambient>0;
   const autoClear=gl.autoClear,layers=camera.layers.mask,previous=gl.getRenderTarget();
   let presentFrom:WebGLFramebuffer|null=null,presentMoved=false;
   const frameWidth=frame.width,frameHeight=frame.height;
   try{
    // The screen uses the corner of the larger target; three then resolves
    // only that corner after each render.
    frame.width=width;frame.height=height;
    gl.setRenderTarget(frame);
    if(reuse){
     staticFrameStats.reused++;
     // Only the animated surfaces, in three's usual order: opaque, then blended.
     gl.autoClear=false;camera.layers.set(ambientLayer);scene.userData.dynamicPass=true;
     gl.render(scene,camera);
     presentFrom=resolved();
    }else if(steady&&moving&&cameraSame){
     // Still between moves (water ticks): the moved image stays on screen.
     staticFrameStats.moved++;presentMoved=true;
    }else if(movingEnabled&&steady&&(last.valid||moving)&&!cameraSame&&timed(()=>move(scene,camera,cameraView,width,height,draw))){
     staticFrameStats.moved++;presentMoved=true;last.valid=false;arm();
    }else{
     reason(!last.valid&&!moving?'first':requested?'requested':!cameraSame?'camera':shadowRefresh?'shadows':scene.overrideMaterial?'override':'no-water');
     staticFrameStats.full++;
     clearTimeout(settle);moving=false;
     ambient=0;
     scene.traverse(o=>{
      if((o as {isLight?:boolean}).isLight)o.layers.enable(ambientLayer);
      else if(isAmbient(o)){o.layers.enable(ambientLayer);ambient++;}
     });
     draw(scene,camera);last.valid=true;shown.copy(cameraView);shownProjection.copy(camera.projectionMatrix);
     presentFrom=resolved();
    }
    if(presentMoved)show(display,width,height);else blit(presentFrom,null,whole(width,height),whole(width,height));
   }finally{
    camera.layers.mask=layers;gl.autoClear=autoClear;scene.userData.dynamicPass=false;
    frame.width=frameWidth;frame.height=frameHeight;
    gl.setRenderTarget(previous);
   }
  },
  dispose(){clearTimeout(settle);frame.dispose();for(const t of moved)t.dispose();},
 };
}
