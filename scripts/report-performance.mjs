import {readFile,writeFile} from 'node:fs/promises';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const before=await read('docs/performance/before/results.json'),after=await read('docs/performance/after/results.json');
const verification=await read('docs/performance/verification/results.json');
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const names={overview:'Panorama',centre:'Centro',forest:'Mata',port:'Porto',beach:'Praia',situation:'Situação'};
const n=value=>value.toLocaleString('pt-BR',{maximumFractionDigits:1}),rows=[];
for(const [key,name] of Object.entries(names)){
 const a=before.measurements.filter(m=>m.name===key),b=after.measurements.filter(m=>m.name===key);
 if(a.length!==3||b.length!==3||a.some(m=>!m.frame)||b.some(m=>!m.frame))throw Error(`Amostras incompletas: ${key}`);
 for(const m of b)if(m.instances!==a[0].instances||m.width!==a[0].width||m.height!==a[0].height||JSON.stringify(m.settings)!==JSON.stringify(a[0].settings))throw Error(`Configuração diferente: ${key}`);
 const p50Before=median(a.map(m=>m.frame.p50)),p50After=median(b.map(m=>m.frame.p50));
 rows.push({name,callsBefore:median(a.map(m=>m.calls)),callsAfter:median(b.map(m=>m.calls)),trianglesBefore:median(a.map(m=>m.triangles)),trianglesAfter:median(b.map(m=>m.triangles)),p50Before,p50After,p95Before:median(a.map(m=>m.frame.p95)),p95After:median(b.map(m=>m.frame.p95)),cpuBefore:median(a.map(m=>m.cpu.p50)),cpuAfter:median(b.map(m=>m.cpu.p50)),speedup:p50Before/p50After});
}
let md=`# Resultados da versão compilada\n\nTrês amostras de 30 segundos por câmera; valores medianos entre as três execuções. Ultra, 1.280 × 800 pixels, sombras de 4.096 pixels e animação congelada. Mesmos 36.573 componentes instanciados.\n\n**Renderer: ${after.device.renderer}.** Comparativo renderizado pela CPU, sem temporizador de GPU. Estes valores não estimam o FPS de outro computador ou celular.\n\n`;
md+='| Área | Chamadas antes → depois | Triângulos antes → depois | Quadro p50, ms antes → depois | Ganho de taxa |\n|---|---:|---:|---:|---:|\n';
for(const r of rows)md+=`| ${r.name} | ${n(r.callsBefore)} → ${n(r.callsAfter)} | ${n(r.trianglesBefore)} → ${n(r.trianglesAfter)} | ${n(r.p50Before)} → ${n(r.p50After)} | ${n(r.speedup)}× |\n`;
md+='\n| Área | Quadro p95, ms antes → depois | CPU da chamada de renderização p50, ms antes → depois |\n|---|---:|---:|\n';
for(const r of rows)md+=`| ${r.name} | ${n(r.p95Before)} → ${n(r.p95After)} | ${n(r.cpuBefore)} → ${n(r.cpuAfter)} |\n`;
md+=`\nO ganho de taxa usa a razão entre os tempos p50. CPU mede somente a chamada de renderização; inclui o descarte, mas não todo o processamento de entrada e React. Intervalos entre quadros incluem o trabalho do renderer por software.\n\n`;
md+=`Inventário final: ${after.measurements[0].meshes} meshes (antes: ${before.measurements[0].meshes}); ${after.measurements[0].geometries} geometrias e ${after.measurements[0].textures} texturas reportadas pelo renderer. Arrays adicionais das instâncias: ${n(after.measurements[0].sourceBytes/1024/1024)} MiB, sem contar os objetos de limites. Isso não é uma medição total de VRAM.\n\n`;
md+=`A comparação com descarte ligado/desligado passou nas ${verification.comparisons.length} vistas: erro máximo ${Math.max(...verification.comparisons.map(c=>c.max))} por canal. Também passaram a estabilidade dos buffers ao mudar o painel, o movimento, a pausa em segundo plano e a opção de desligar animação.\n\n`;
const hardware=await read('docs/performance/intel-uhd/results.json');
md+=`## Medição adicional na Intel UHD\n\n${hardware.runs} amostras de ${hardware.seconds} segundos por câmera, Ultra, 1.280 × 800, densidade completa e **animação ligada**. Renderer: ${hardware.device.renderer}. Extensão de temporização de GPU disponível. Esta bateria mede a versão final; não existe baseline anterior nessa GPU.\n\n`;
md+='| Área | Intervalo dos callbacks p50, ms | CPU render p50, ms | GPU p50, ms | GPU p95, ms |\n|---|---:|---:|---:|---:|\n';
for(const [key,name] of Object.entries(names)){
 const samples=hardware.measurements.filter(m=>m.name===key);
 md+=`| ${name} | ${n(median(samples.map(m=>m.frame.p50)))} | ${n(median(samples.map(m=>m.cpu.p50)))} | ${n(median(samples.map(m=>m.gpu.p50)))} | ${n(median(samples.map(m=>m.gpu.p95)))} |\n`;
}
md+='\nOs callbacks ficaram próximos de 16,7 ms, mas os tempos de GPU são maiores em várias regiões. Por isso, **não interpretamos o agendamento de aproximadamente 60 callbacks/s como 60 quadros fisicamente apresentados**. O teste é headless, o trabalho é assíncrono e o tempo de GPU também pode incluir espera/preempção. A apresentação no monitor e a influência de outros processos não foram isoladas. [Dados completos da Intel UHD](intel-uhd/results.json).\n\n';
md+='Arquivos completos: [antes](before/results.json), [depois](after/results.json), [verificação visual e de comportamento](verification/results.json). [Descrição da implementação e limitações](../DESEMPENHO-IMPLEMENTADO.md).\n';
await writeFile('docs/performance/RESULTADOS.md',md);await writeFile('docs/performance/summary.json',JSON.stringify(rows,null,2));console.log(rows);
