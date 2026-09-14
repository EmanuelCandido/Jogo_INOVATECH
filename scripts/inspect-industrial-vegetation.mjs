import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},plugins:[{
 name:'inspect-prepared-population',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/config/referenceMap.ts'))return code.replaceAll('import.meta.env?.SSR','false');},
}]});
try{
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const {polygonGap,corridorGap}=await server.ssrLoadModule('/src/config/spatial.ts');
 const conflicts=[];
 for(const tree of m.referenceTrees){
  const poly=m.placementFootprint(tree);
  for(const apron of m.industrialAprons){
   const yard=polygonGap(poly,apron.footprint),staff=corridorGap(poly,apron.staffPath,1.4);
   if(yard<.3||staff<.3)conflicts.push({asset:tree.asset,position:m.compositionPoint(tree.position[0],tree.position[2]),factory:apron.id,yard,staff});
  }
 }
 const report={trees:m.referenceTrees.length,conflicts};
 await writeFile('docs/validation/industrial-vegetation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await server.close();}
