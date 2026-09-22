import {createServer} from 'vite';
import {writeFile,readFile} from 'node:fs/promises';
const server=await createServer({configLoader:'runner',server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts');
 if(m.pedestrianNetwork.unreachable.length)throw new Error('Unreachable entrances: '+m.pedestrianNetwork.unreachable.join(', '));
 const keys=['referenceAssets','referenceTrees','referenceTraffic','referenceFurniture','buildingLots','pedestrianNetwork','streetLayout','dumpTurnHandles'];
 const json=JSON.stringify(Object.fromEntries(keys.map(k=>[k,m[k]])));
 const path='src/config/reference-layout.json';
 if(await readFile(path,'utf8').catch(()=>'')!==json)await writeFile(path,json);
 console.log(`Layout prepared: ${m.buildingLots.length} buildings, ${m.referenceTrees.length} trees, ${m.pedestrianNetwork.links.length} pedestrian links.`);
 const details=await server.ssrLoadModule('/src/config/referenceDetails.ts');
 const riversidePath='src/config/riverside-layout.json',riverside=JSON.stringify(details.riversidePreparation);
 if(await readFile(riversidePath,'utf8').catch(()=>'')!==riverside)await writeFile(riversidePath,riverside);
 console.log(`Riverside prepared: ${details.riversideAssets.length} placements.`);
}catch(error){console.error(error.message);process.exitCode=1;}finally{await server.close();}
