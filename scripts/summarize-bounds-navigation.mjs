import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const stage=process.argv[2];if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe uma medição válida');
const report=JSON.parse(await readFile(`docs/performance/${stage}/results.json`,'utf8'));
assert.equal(report.compareBounds,true);assert.deepEqual(report.errors,[]);assert.ok(report.runs>=4&&report.runs%4===0);
assert.equal(report.measurements.length,report.runs*2);
for(const sample of report.measurements){assert.deepEqual(sample.maximumGuard,{valid:true,violations:[]});assert.equal(sample.instances,34005);}
const median=values=>{const a=values.filter(Number.isFinite).sort((a,b)=>a-b),n=a.length;assert.ok(n);return (a[(n-1)>>1]+a[n>>1])/2;};
const summary={device:report.device,mobileEmulation:report.mobileEmulation,timedInput:report.timedInput??false,collectionBetweenRuns:report.collectionBetweenRuns??false,presentationVerified:false,measurements:[]};
for(const name of [...new Set(report.measurements.map(m=>m.name))])for(const reference of [true,false]){
 const samples=report.measurements.filter(m=>m.name===name&&m.referenceBounds===reference);
 assert.equal(samples.length,report.runs/2);
 summary.measurements.push({name,reference,runs:samples.length,fps:median(samples.map(m=>m.frame.meanFps)),p95:median(samples.map(m=>m.frame.p95)),cpu:median(samples.map(m=>m.cpu.p50)),gpu:median(samples.map(m=>m.gpu.p50)),gpuSamples:samples.map(m=>m.gpu.frames),uploads:median(samples.map(m=>m.bufferUploadBytes)),inputTiming:samples.map(m=>m.inputTiming??null),measuredSeconds:samples.map(m=>m.frame.frames/m.frame.meanFps)});
}
await writeFile(`docs/performance/${stage}/summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
