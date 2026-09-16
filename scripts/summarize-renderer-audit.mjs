import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const median=a=>{const s=a.toSorted((a,b)=>a-b),n=s.length;return n?(s[(n-1)>>1]+s[n>>1])/2:null;};
const rows=[];
for(const gpu of ['intel','rtx']){
 const report=JSON.parse(await readFile(`docs/performance/renderer-audit-${gpu}-headless/results.json`,'utf8'));
 assert.ok(report.finished,`${gpu}: incomplete`);assert.deepEqual(report.errors,[]);
 for(const key of ['models','instances','width','height','settings','camera'])assert.deepEqual(report.current.baseline[key],report.reference.baseline[key]);
 for(const view of ['overview','zoomed'])for(const mode of ['reference','single','depth']){
  const all=report.samples.filter(s=>s.view===view&&(mode==='reference'?s.variant==='reference':s.variant==='current'&&s.prepass===(mode==='depth')));
  const main=all.filter(s=>!s.instrumented),diagnostic=all.filter(s=>s.instrumented);
  assert.equal(main.length,2);assert.equal(diagnostic.length,1);
  for(const s of all){assert.deepEqual(s.violations,[]);assert.deepEqual(s.camera,main[0].camera);}
  rows.push({gpu,view,mode,runs:main.length,fps:median(main.map(s=>s.frame.fps)),p95:median(main.map(s=>s.frame.p95)),cpuP50:median(main.map(s=>s.cpu.p50)),gpuDiagnosticP50:median(diagnostic.map(s=>s.gpu?.p50).filter(x=>x!=null)),gpuSamples:diagnostic.map(s=>s.gpu?.frames??0),instrumentedFps:median(diagnostic.map(s=>s.frame.fps)),calls:main[0].calls,triangles:main[0].triangles,renderer:report.current.device.renderer});
 }
}
const output={date:new Date().toISOString(),viewport:[1920,1080],canvas:[2880,1620],headless:true,presentationVerified:false,rows};
await mkdir('docs/performance/renderer-audit-summary',{recursive:true});
await writeFile('docs/performance/renderer-audit-summary/results.json',JSON.stringify(output,null,2));
for(const r of rows)console.log(JSON.stringify(r));
