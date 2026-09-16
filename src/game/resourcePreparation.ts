/** Optional preparation yields to interaction. A held gesture stays busy even
 * when no new pointer/key event arrives; release starts a short quiet period. */
export function createPreparationActivity(now=()=>performance.now()){
 const holds=new Set<object>();let last=-Infinity;
 return {touch(){last=now();},hold(owner:object){holds.add(owner);last=now();},release(owner:object){if(holds.delete(owner))last=now();},busy(){return holds.size>0||now()-last<500;}};
}
const activities=new WeakMap<object,ReturnType<typeof createPreparationActivity>>();
export function preparationActivity(target:object){
 let activity=activities.get(target);if(!activity){activity=createPreparationActivity();activities.set(target,activity);}return activity;
}
type PreparationStats={pending:boolean;cancelled:boolean;started:number;completed:number;deferred:number;maxStepMs:number;errors:number};
type Preparation={stats:PreparationStats;cancel:()=>void};
const jobs=new WeakMap<object,Map<string,Preparation>>();
const pauses=new WeakMap<object,Set<object>>();
export function pausePreparation(target:object,owner:object,paused:boolean){
 if(!paused){pauses.get(target)?.delete(owner);return;}
 let owners=pauses.get(target);if(!owners){owners=new Set();pauses.set(target,owners);}owners.add(owner);
}
export function preparationSnapshot(target:object){return Object.fromEntries([...(jobs.get(target)??[])].map(([name,job])=>[name,{...job.stats}]));}
export function preparationPending(target:object,name:string){return jobs.get(target)?.get(name)?.stats.pending??false;}
export function preparationRunning(target:object){for(const job of jobs.get(target)?.values()??[])if(job.stats.pending&&job.stats.started>job.stats.completed)return true;return false;}
export function cancelPreparation(target:object,name:string){jobs.get(target)?.get(name)?.cancel();}

/** One indivisible unit per idle callback, with no overlapping async units.
 * Four milliseconds is an admission budget, not a preemption guarantee: shader
 * creation cannot be interrupted. After 500 ms without admission, one unit may
 * run ONLY when canRun allows it. Repeated short idle callbacks must not reset
 * that deadline and starve the queue forever. */
export function schedulePreparation(target:object,name:string,step:()=>boolean|Promise<boolean>,canRun:()=>boolean,delay=600,interval=80){
 let group=jobs.get(target);if(!group){group=new Map();jobs.set(target,group);}group.get(name)?.cancel();
 const stats:PreparationStats={pending:true,cancelled:false,started:0,completed:0,deferred:0,maxStepMs:0,errors:0};
 let timer:number|undefined,idle:number|undefined,waitingSince=performance.now()+delay;
 const cancel=()=>{stats.cancelled=true;stats.pending=false;if(timer!==undefined)window.clearTimeout(timer);if(idle!==undefined)window.cancelIdleCallback(idle);};
 const schedule=(ms=80)=>{if(stats.pending)timer=window.setTimeout(()=>{
  timer=undefined;
  if('requestIdleCallback' in window)idle=window.requestIdleCallback(run,{timeout:500});
  else void run({didTimeout:true,timeRemaining:()=>0});
 },ms);};
 const run=async(deadline:IdleDeadline)=>{
  idle=undefined;if(!stats.pending)return;
  if(pauses.get(target)?.size||!canRun()||(!deadline.didTimeout&&deadline.timeRemaining()<4&&performance.now()-waitingSince<500)){stats.deferred++;schedule();return;}
  const started=performance.now();stats.started++;
  try{
   const result=step();stats.maxStepMs=Math.max(stats.maxStepMs,performance.now()-started);
   const more=await result;stats.completed++;
   if(stats.cancelled)return;
   // Downloads retain their spacing. Ready shader units can use the next idle
   // callback without an extra 80 ms pause; blocked work always backs off above.
   if(more){waitingSince=performance.now()+interval;schedule(interval);}else stats.pending=false;
  }catch{stats.errors++;stats.pending=false;/* Visible rendering keeps normal error handling. */}
 };
 const job={stats,cancel};group.set(name,job);schedule(delay);return job;
}
