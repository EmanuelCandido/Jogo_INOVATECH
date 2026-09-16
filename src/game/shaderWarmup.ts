import {type Camera,type Object3D,type Scene,type WebGLRenderer} from 'three';
import {cancelPreparation,preparationActivity,schedulePreparation} from './resourcePreparation';

const compiling=new WeakMap<WebGLRenderer,Promise<Object3D>>();
export function shaderCompilationPending(gl:WebGLRenderer){return compiling.has(gl);}
/** Diagnostic control using the previous whole-scene preparation, after the
 * current unit has completed. Used to compare pixels within one loaded scene. */
export async function wholeShaderWarmup(gl:WebGLRenderer,scene:Scene,camera:Camera){
 cancelPreparation(gl.domElement,'shaders');await compiling.get(gl);
 const start=performance.now(),ready=gl.compileAsync(scene,camera),cpuMs=performance.now()-start;
 compiling.set(gl,ready);try{await ready;}finally{compiling.delete(gl);}return {cpuMs};
}
/** Each root is passed unchanged to Three, preserving instancing, material
 * variants and the real scene's lights/environment. Do not reparent or clone
 * renderables. A renderable's descendants are already covered by compileAsync. */
export function warmupRoots(scene:Object3D){
 const roots:Object3D[]=[];
 const visit=(object:Object3D)=>{
  const renderable=object as Object3D&{isMesh?:boolean;isPoints?:boolean;isLine?:boolean;isSprite?:boolean};
  if(renderable.isMesh||renderable.isPoints||renderable.isLine||renderable.isSprite)roots.push(object);
  else for(const child of object.children)visit(child);
 };
 visit(scene);return roots;
}
export function startShaderWarmup(gl:WebGLRenderer,scene:Scene,camera:Camera,canRun:()=>boolean,invalidate:()=>void){
 const roots=warmupRoots(scene),activity=preparationActivity(gl.domElement);let index=0;
 const job=schedulePreparation(gl.domElement,'shaders',async()=>{
  const object=roots[index++];if(!object)return false;
  let parent:Object3D|null=object;while(parent&&parent!==scene)parent=parent.parent;
  if(parent){
   const ready=gl.compileAsync(object,camera,scene);compiling.set(gl,ready);
   try{await ready;}finally{compiling.delete(gl);}
  }
  if(index<roots.length)return true;
  roots.length=0;if(!job.stats.cancelled)invalidate();return false;
 },()=>!compiling.has(gl)&&!activity.busy()&&canRun(),600,0);
 const cancel=job.cancel;job.cancel=()=>{roots.length=0;cancel();};return job;
}
