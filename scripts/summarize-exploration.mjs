import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const pairs=[['desktop','exploration-before','exploration-packed-desktop'],['mobile-emulation','exploration-mobile-before','exploration-packed-mobile']];
const median=values=>{const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;};
const timing=rows=>({samples:rows.length,fps:median(rows.map(s=>s.result.frame.meanFps)),fpsRange:[Math.min(...rows.map(s=>s.result.frame.meanFps)),Math.max(...rows.map(s=>s.result.frame.meanFps))],p95Ms:median(rows.map(s=>s.result.frame.p95)),cpuP50Ms:median(rows.map(s=>s.result.cpu.p50)),gpuP50Ms:median(rows.map(s=>s.result.gpu.p50)),longTasks:rows.reduce((n,s)=>n+s.tasks.values.length,0)});
const outputs=[];
for(const [profile,beforeStage,afterStage]of pairs){
 const reports=await Promise.all([beforeStage,afterStage].map(stage=>readFile(`docs/performance/${stage}/results.json`,'utf8').then(JSON.parse)));
 const [before,after]=reports;
 for(const report of reports){
  assert.ok(report.finished);assert.equal(report.failure,undefined);assert.deepEqual(report.errors,[]);
  assert.equal(report.measurements.length,report.laps+2);
  for(const entry of report.measurements){
   assert.deepEqual(entry.result.maximumGuard,{valid:true,violations:[]});assert.equal(entry.result.instances,34005);
   assert.deepEqual(entry.result.modelUrls,before.baseline.modelUrls);assert.equal(entry.result.sourceBytes,before.baseline.sourceBytes);
   assert.deepEqual([entry.result.width,entry.result.height],[before.baseline.width,before.baseline.height]);
  }
 }
 const samples=reports.map(report=>({stage:report.stage,readyMs:report.readyMs,measuredSeconds:report.measurements.reduce((sum,s)=>sum+s.result.frame.frames/s.result.frame.meanFps,0),first:timing(report.measurements.filter(s=>s.name==='first-exploration')),warm:timing(report.measurements.filter(s=>s.name==='warm-reference')),repeats:timing(report.measurements.filter(s=>s.name.startsWith('repeat-'))),longTaskObserverSupported:report.measurements.every(s=>s.tasks.supported),heap:report.memory.filter(m=>m.forcedCollection).map(m=>({label:m.label,...m.heap,geometries:m.snapshot.geometries,textures:m.snapshot.textures,programs:m.snapshot.programs})),bundles:report.bundles}));
 const checkpoints=['warm-baseline','repeat-5','repeat-10'].map(label=>{
  const [b,a]=reports.map(r=>r.memory.find(m=>m.label===label));assert.ok(b?.forcedCollection&&a?.forcedCollection);
  return {label,heapDeltaBytes:a.heap.usedSize-b.heap.usedSize,backingStorageDeltaBytes:a.heap.backingStorageSize-b.heap.backingStorageSize,heapPlusBackingDeltaBytes:a.heap.usedSize+a.heap.backingStorageSize-b.heap.usedSize-b.heap.backingStorageSize};
 });
 outputs.push({profile,renderer:after.device.renderer,canvas:[after.baseline.width,after.baseline.height],samples,checkpoints});
}
const out='docs/performance/packed-bounds-summary';await mkdir(out,{recursive:true});
await writeFile(`${out}/results.json`,JSON.stringify({date:new Date().toISOString(),presentationVerified:false,physicalPhones:false,notes:['Heap and backing storage are CDP isolate counters, not total process memory or VRAM.','Collections occur between timed laps.','Driver cache is uncontrolled; bootstrap can warm it.','CPU values cover the render wrapper, not every callback in the frame.','GPU and navigation timings are separate browser sessions, with possible thermal/driver variance.'],profiles:outputs},null,2));
for(const output of outputs)console.log(JSON.stringify(output));
