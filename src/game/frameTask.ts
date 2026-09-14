/** Coalesce input bursts; flush before a gesture changes or ends. */
export function frameTask(run:()=>void,request=(fn:FrameRequestCallback)=>requestAnimationFrame(fn),cancel=(id:number)=>cancelAnimationFrame(id)){
 let id:number|null=null;
 return {
  schedule(){if(id===null)id=request(()=>{id=null;run();});},
  flush(){if(id!==null){cancel(id);id=null;run();}},
  cancel(){if(id!==null)cancel(id);id=null;},
 };
}
