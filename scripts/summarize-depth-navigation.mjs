import {readFile,writeFile} from 'node:fs/promises';
const stage=process.argv[2];if(!stage||!/^[a-z0-9][a-z0-9_-]*$/i.test(stage))throw new Error('Informe uma medição válida');
const report=JSON.parse(await readFile(`docs/performance/${stage}/results.json`,'utf8'));
if(!report.compareFrontFaces||!report.depthPrepass||report.errors.length||report.measurements.some(s=>!s.maximumGuard?.valid))throw new Error('Comparação incompleta ou inválida');
const median=values=>{const a=values.filter(Number.isFinite).sort((a,b)=>a-b),n=a.length;return n?(a[(n-1)>>1]+a[n>>1])/2:null;};
const summary={device:report.device,mobileEmulation:report.mobileEmulation,presentationVerified:false,measurements:[]};
for(const name of [...new Set(report.measurements.map(m=>m.name))])for(const frontFaces of [false,true]){
 const s=report.measurements.filter(m=>m.name===name&&m.depthFrontFaces===frontFaces);
 if(!s.length)throw new Error('Modo sem amostras');
 summary.measurements.push({name,frontFaces,runs:s.length,fps:median(s.map(m=>m.frame?.meanFps)),p95:median(s.map(m=>m.frame?.p95)),cpu:median(s.map(m=>m.cpu?.p50)),gpu:median(s.map(m=>m.gpu?.p50)),gpuSamples:s.map(m=>m.gpu?.frames??0),uploads:median(s.map(m=>m.bufferUploadBytes)),calls:median(s.map(m=>m.calls)),triangles:median(s.map(m=>m.triangles))});
}
await writeFile(`docs/performance/${stage}/summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
