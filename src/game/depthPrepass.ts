import {DoubleSide,FrontSide,LessEqualDepth,Mesh,MeshStandardMaterial,Scene,Texture,type Camera,type WebGLRenderer} from 'three';
import type {RenderItem} from 'three/src/renderers/webgl/WebGLRenderLists.js';
import {createRenderPathSelection} from './renderPathSelection';

function depthOrder(a:RenderItem,b:RenderItem){
 return a.groupOrder-b.groupOrder||a.renderOrder-b.renderOrder||a.z-b.z||a.id-b.id;
}

/** Retains the color pass order and original vertex program of the game's
 * audited opaque finishes (which never discard or write fragment depth).
 * Unsupported depth/alpha rules are skipped.
 */
export function createDepthPrepass(gl:WebGLRenderer){
 let afterShadowRefresh=false;
 const cache=new Map<MeshStandardMaterial,{version:number;depth:MeshStandardMaterial;release:()=>void}>();
 const depthMaterial=(source:MeshStandardMaterial,frontFaces:boolean)=>{
  const side=frontFaces&&source.side===DoubleSide?FrontSide:source.side;
  let entry=cache.get(source);
  if(entry?.version===source.version){
   if(entry.depth.side!==side){entry.depth.side=side;entry.depth.needsUpdate=true;}
   return entry.depth;
  }
  entry?.depth.dispose();
  const depth=source.clone();depth.colorWrite=false;depth.side=side;
  depth.onBeforeCompile=(shader,renderer)=>{
   source.onBeforeCompile(shader,renderer);
   // Keep the exact source vertex transformations, including instancing.
   shader.fragmentShader=`#include <common>
    #include <logdepthbuf_pars_fragment>
    void main(){
     #include <logdepthbuf_fragment>
     gl_FragColor=vec4(0.0);
    }`;
  };
  depth.customProgramCacheKey=()=>`depth-prepass-v1-${source.customProgramCacheKey()}`;
  const release=entry?.release??(()=>{cache.get(source)?.depth.dispose();cache.delete(source);source.removeEventListener('dispose',release);});
  if(!entry)source.addEventListener('dispose',release);
  entry={version:source.version,depth,release};cache.set(source,entry);return depth;
 };
 return {
  render(render:WebGLRenderer['render'],scene:Scene,camera:Camera,frontToBack=false,frontFaces=false){
   // Shadow refresh restores all casters. Leave that frame on the established
   // single-pass path; the following demand frame compacts camera instances.
   if(gl.shadowMap.enabled&&(gl.shadowMap.needsUpdate||gl.shadowMap.autoUpdate)){
    afterShadowRefresh=true;return render.call(gl,scene,camera);
   }
   // Three's shadow upload can share its frame id with the next camera upload.
   // Keep the established single-pass recovery frame too, so stale instance
   // matrices cannot seed depth before the color pass receives the compact ones.
   if(afterShadowRefresh){afterShadowRefresh=false;return render.call(gl,scene,camera);}
   if(scene.overrideMaterial||scene.background instanceof Texture||gl.xr.isPresenting)return render.call(gl,scene,camera);
   const direct=gl.renderBufferDirect,autoClear=gl.autoClear,autoReset=gl.info.autoReset,background=scene.background;
   // Only the outer camera's depth list changes. Restore its sorter before the
   // color pass, including any custom comparator installed by the application.
   const list=frontToBack&&gl.sortObjects&&!camera.reversedDepth?gl.renderLists.get(scene,0):null;
   const sort=list?.sort;
   try{
    if(list&&sort)list.sort=function(_opaque,transparent){return sort.call(this,depthOrder,transparent);};
    gl.renderBufferDirect=function(c,s,geometry,material,object,group){
     if(c!==camera)return direct.call(this,c,s,geometry,material,object,group);
     if(!(object instanceof Mesh)||!(material instanceof MeshStandardMaterial)||material.transparent||!material.depthWrite||!material.depthTest||material.depthFunc!==LessEqualDepth||material.alphaTest>0||material.alphaHash||material.alphaToCoverage||material.stencilWrite||material.clippingPlanes?.length||material.displacementMap||('transmission' in material&&material.transmission))return;
     return direct.call(this,c,s,geometry,depthMaterial(material,frontFaces),object,group);
    };
    render.call(gl,scene,camera);
    if(list&&sort)list.sort=sort;
    gl.renderBufferDirect=direct;
    gl.autoClear=false;gl.info.autoReset=false;
    // A Color background forces a clear even with autoClear disabled in Three.
    scene.background=null;
    render.call(gl,scene,camera);
   }finally{
    if(list&&sort)list.sort=sort;
    gl.renderBufferDirect=direct;gl.autoClear=autoClear;gl.info.autoReset=autoReset;scene.background=background;
   }
  },
  dispose(){for(const entry of [...cache.values()])entry.release();},
 };
}

type FrameRenderer={enabled:boolean;automatic:boolean;selection:ReturnType<typeof createRenderPathSelection>;frontToBack:boolean;frontFaces:boolean;render:WebGLRenderer['render'];dispose:()=>void};
const renderers=new WeakMap<WebGLRenderer,FrameRenderer>();
/** One outer frame entry point, so diagnostics time both passes as one frame.
 * Does not stack patches on WebGLRenderer.render during React effect replays.
 */
export function depthFrameRenderer(gl:WebGLRenderer):FrameRenderer{
 let frame=renderers.get(gl);
 if(!frame){
  const prepass=createDepthPrepass(gl);
  frame={enabled:false,automatic:true,selection:createRenderPathSelection(),frontToBack:false,frontFaces:false,render:(scene,camera)=>{
   if(frame!.enabled&&scene instanceof Scene)prepass.render(gl.render,scene,camera,frame!.frontToBack,frame!.frontFaces);
   else gl.render(scene,camera);
  },dispose:()=>prepass.dispose()};
  renderers.set(gl,frame);
 }
 return frame;
}
