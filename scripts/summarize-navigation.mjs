import {readFile,writeFile} from 'node:fs/promises';

const groups=process.argv.slice(2).map(arg=>arg.split(','));
if(groups.length!==2||groups.some(g=>!g.length||g.some(s=>!/^[a-z0-9][a-z0-9_-]*$/i.test(s))))throw new Error('Informe duas medições, ou duas listas separadas por vírgulas');
const reports=await Promise.all(groups.map(group=>Promise.all(group.map(stage=>readFile(`docs/performance/${stage}/results.json`,'utf8').then(JSON.parse)))));
const [before,after]=groups.map(group=>group.length===1?group[0]:group);
const [a,b]=reports.map(group=>({...group[0],measurements:group.flatMap(r=>r.measurements),errors:group.flatMap(r=>r.errors)}));
const median=values=>{const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b),n=sorted.length;return n?(sorted[(n-1)>>1]+sorted[n>>1])/2:null;};
const summarize=(report,name)=>{
 const samples=report.measurements.filter(s=>s.name===name);
 const tails=samples.map(s=>s.frame?.p95).filter(Number.isFinite);
 return {runs:samples.length,meanFps:median(samples.map(s=>s.frame?.meanFps)),frameP95:median(tails),frameP95Range:tails.length?[Math.min(...tails),Math.max(...tails)]:null,gpuP50:median(samples.map(s=>s.gpu?.p50)),gpuSamples:samples.map(s=>s.gpu?.frames??0),cpuP50:median(samples.map(s=>s.cpu?.p50)),bufferUploadBytes:median(samples.map(s=>s.bufferUploadBytes)),visibilityChecks:{sphereTests:median(samples.map(s=>s.visibilityChecks?.sphereTests)),regionTests:median(samples.map(s=>s.visibilityChecks?.regionTests))},maximumGuardsPass:samples.length>0&&samples.every(s=>s.maximumGuard?.valid)};
};
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
const invariant=report=>({models:report.baseline.modelUrls,instances:report.baseline.instances,width:report.baseline.width,height:report.baseline.height,settings:report.baseline.settings,renderer:report.device.renderer,viewport:report.viewport});
const summary={before,after,sameReference:reports.flat().every(r=>same(invariant(r),invariant(a))),errors:[...a.errors,...b.errors],mobileEmulation:b.mobileEmulation,presentationVerified:false,target60FpsVerified:false,measurements:[...new Set(a.measurements.map(s=>s.name))].map(name=>({name,before:summarize(a,name),after:summarize(b,name)}))};
if(!summary.sameReference||summary.errors.length||summary.measurements.some(m=>!m.before.maximumGuardsPass||!m.after.maximumGuardsPass))throw new Error('Referências incompatíveis ou execução com erro');
const filename=groups.some(g=>g.length>1)?'aggregate-summary.json':'summary.json';
await writeFile(`docs/performance/${groups[1][0]}/${filename}`,JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
