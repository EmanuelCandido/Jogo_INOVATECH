export function frameMetrics(values:number[]){
 const sorted=values.filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
 if(!sorted.length)return null;
 const percentile=(p:number)=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)];
 const tail=sorted.slice(-Math.max(1,Math.ceil(sorted.length*.01)));
 return {frames:sorted.length,meanMs:sorted.reduce((a,b)=>a+b,0)/sorted.length,p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),onePercentLow:1000/(tail.reduce((a,b)=>a+b,0)/tail.length)};
}
