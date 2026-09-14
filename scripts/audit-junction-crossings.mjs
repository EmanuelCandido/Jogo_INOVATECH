import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {circulationCrossings:result}=await server.ssrLoadModule('/src/config/circulationCrossings.ts');
 await writeFile('docs/junction-crossings.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({crossings:result.crossings.length,unresolved:result.unresolved},null,2));
}finally{await server.close();}
