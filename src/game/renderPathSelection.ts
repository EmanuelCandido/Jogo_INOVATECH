type Sample={mean:number;p95:number;frames:number};
const order=[false,true,true,false] as const;
const summarize=(values:number[]):Sample=>{
 const sorted=values.toSorted((a,b)=>a-b);
 return {mean:values.reduce((sum,v)=>sum+v,0)/values.length,p95:sorted[Math.ceil(sorted.length*.95)-1],frames:values.length};
};

/** Compare whole frame intervals in ABBA order, with no GPU queries or waits.
 * Call before rendering: an interval belongs to the previous frame's path.
 * Changes to scene/camera/interaction discard the entire unfinished comparison.
 */
export function createRenderPathSelection(initial=true){
 let preferred=initial,enabled=initial,stage:'waiting'|'warmup'|'sampling'|'complete'='waiting';
 let last=0,since=0,warmFrames=0,block=0,elapsed=0,discarded=0;
 const values:number[]=[],samples:Sample[]=[];
 const restart=(now:number)=>{
  if(stage==='sampling'||stage==='warmup')discarded++;
  stage='waiting';since=now;last=now;block=0;elapsed=0;warmFrames=0;values.length=0;samples.length=0;enabled=preferred;
 };
 const begin=(now:number)=>{stage='warmup';since=now;warmFrames=0;elapsed=0;values.length=0;enabled=order[block];};
 return {
  get complete(){return stage==='complete';},
  get preferred(){return preferred;},
  reset(now=0){restart(now);},
  snapshot(){return {stage,enabled,preferred,block,discarded,samples:samples.map(s=>({...s}))};},
  tick(now:number,eligible:boolean){
   if(stage==='complete')return preferred;
   const interval=last?now-last:0;last=now;
   if(!eligible||!Number.isFinite(interval)||interval<0||interval>1000){restart(now);return enabled;}
   if(stage==='waiting'){
    if(!since)since=now;
    if(now-since>=1000)begin(now);
   }else if(stage==='warmup'){
    // Let compiled programs and the GPU queue settle before recording a path.
    if(++warmFrames>=6&&now-since>=600){stage='sampling';values.length=0;elapsed=0;}
   }else if(interval>0){
    values.push(interval);elapsed+=interval;
    if(values.length>=12&&elapsed>=800){
     samples.push(summarize(values));block++;
     if(block<order.length)begin(now);
     else{
      // Extra geometry must pay for itself in BOTH opposite-order pairs.
      // A refresh-rate tie favors one pass; noisy, contradictory pairs do not
      // justify the extra pass either. No visual setting changes with this choice.
      preferred=samples[1].mean<samples[0].mean*.95&&samples[2].mean<samples[3].mean*.95&&samples[1].p95<=samples[0].p95*1.05&&samples[2].p95<=samples[3].p95*1.05;
      enabled=preferred;stage='complete';values.length=0;
     }
    }
   }
   return enabled;
  },
 };
}
