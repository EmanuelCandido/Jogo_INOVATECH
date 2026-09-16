import type {WebGLRenderer} from 'three';

/** Diagnostic only: per-draw queries perturb timing, so use them to rank work,
 * never to certify frame time. No visibility, material or shadow changes. */
export async function profileMaterials(gl:WebGLRenderer,invalidate:()=>void,frames=3,frameRenderer:Pick<WebGLRenderer,'render'>=gl){
 if(!Number.isInteger(frames)||frames<1||frames>10)throw new Error('Use de 1 a 10 quadros de perfil');
 const context=gl.getContext() as WebGL2RenderingContext;
 const timer=context.getExtension('EXT_disjoint_timer_query_webgl2');
 if(!timer)throw new Error('Temporizador de GPU indisponível');
 const render=frameRenderer.render,direct=gl.renderBufferDirect;
 const pending:Array<{query:WebGLQuery;key:string}>=[];
 const groups=new Map<string,{draws:number;gpuMs:number;samples:number}>();
 let completed=0,collecting=false,disjoint=false;
 // Count complete application frames, including depth and color passes.
 frameRenderer.render=function(...args){
  collecting=completed<frames;
  try{return render.apply(this,args);}finally{if(collecting)completed++;collecting=false;}
 };
 gl.renderBufferDirect=function(...args){
  if(!collecting)return direct.apply(this,args);
  const material=args[3],cache=material.customProgramCacheKey();
  const key=`${material.name||material.type} | ${cache.length<120?cache:material.type}`;
  const group=groups.get(key)??{draws:0,gpuMs:0,samples:0};groups.set(key,group);group.draws++;
  const query=context.createQuery();
  if(query)context.beginQuery(timer.TIME_ELAPSED_EXT,query);
  try{return direct.apply(this,args);}finally{
   if(query){context.endQuery(timer.TIME_ELAPSED_EXT);pending.push({query,key});}
  }
 };
 try{
  await new Promise<void>((resolve,reject)=>{
   const deadline=performance.now()+30000;
   const poll=()=>{
    if(context.isContextLost())return reject(new Error('Contexto WebGL perdido durante o perfil'));
    disjoint ||= !!context.getParameter(timer.GPU_DISJOINT_EXT);
    for(let i=pending.length-1;i>=0;i--){
     const {query,key}=pending[i];
     if(disjoint||context.getQueryParameter(query,context.QUERY_RESULT_AVAILABLE)){
      if(!disjoint){const group=groups.get(key)!;group.gpuMs+=context.getQueryParameter(query,context.QUERY_RESULT)/1e6;group.samples++;}
      context.deleteQuery(query);pending.splice(i,1);
     }
    }
    if(completed>=frames&&!pending.length)return resolve();
    if(performance.now()>deadline)return reject(new Error('Tempo esgotado ao consultar GPU'));
    if(completed<frames)invalidate();
    requestAnimationFrame(poll);
   };
   requestAnimationFrame(poll);
  });
  return {frames:completed,valid:!disjoint,includesQueryOverhead:true,groups:[...groups].map(([key,value])=>({key,...value,gpuMsPerFrame:disjoint?null:value.gpuMs/completed})).sort((a,b)=>b.gpuMs-a.gpuMs)};
 }finally{
  frameRenderer.render=render;gl.renderBufferDirect=direct;pending.forEach(({query})=>context.deleteQuery(query));
 }
}
