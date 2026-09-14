import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const report={unreachable:m.pedestrianNetwork.unreachable,links:m.pedestrianNetwork.links.length,lots:m.buildingLots.filter(l=>m.pedestrianNetwork.unreachable.includes(l.id)).map(l=>({id:l.id,position:[l.u,l.v],footprint:l.footprint,roads:m.mapRoads.map(r=>({id:r.id,distance:m.distanceToRoute(l.u,l.v,r),height:m.roadHeightAt(r,[l.u,l.v])})).filter(r=>r.distance<16)}))};
 await writeFile('docs/validation/ground-entrances-current.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await server.close();}
