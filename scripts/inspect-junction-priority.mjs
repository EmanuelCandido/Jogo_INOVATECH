// Geometry-only diagnosis. Use the saved population to avoid rebuilding trees
// and traffic; final integration tests must still run the full authoring path.
import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({
 server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},
 plugins:[{name:'inspect-prepared-population',enforce:'pre',transform(code,id){
  if(id.replaceAll('\\','/').endsWith('/src/config/referenceMap.ts'))return code.replaceAll('import.meta.env?.SSR','false');
 }}],
});
try{
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const {polygonGap}=await server.ssrLoadModule('/src/config/spatial.ts');
 const roads=[...m.mapRoads,m.roadViaduct],errors=[],crossingConflicts=[];
 const crossings=m.circulationCrossings.crossings;
 for(let i=0;i<crossings.length;i++)for(let j=i+1;j<crossings.length;j++){
  const a=crossings[i],b=crossings[j];
  if(Math.abs(m.roadHeightAt(roads.find(r=>r.id===a.road),a.point)-m.roadHeightAt(roads.find(r=>r.id===b.road),b.point))<.2&&polygonGap(a.footprint,b.footprint)<.05)crossingConflicts.push({a:a.road,from:a.point,b:b.road,to:b.point});
 }
 for(const mark of m.junctionPriority)for(const [piece,area] of mark.reservations.entries())for(const crossing of m.circulationCrossings.crossings){
  const road=roads.find(r=>r.id===mark.road),other=roads.find(r=>r.id===crossing.road);
  if(Math.abs(m.roadHeightAt(road,mark.crossing.point)-m.roadHeightAt(other,crossing.point))>.2)continue;
  const gap=polygonGap(area,crossing.footprint);
  if(gap<.05)errors.push({road:mark.road,piece,gap,mark:mark.crossing,other:crossing,lines:mark.lines});
 }
 await writeFile('docs/validation/junction-geometry.json',JSON.stringify({source:'authored routes, prepared population',marks:m.junctionPriority.length,errors,crossingConflicts},null,2));
 console.log(JSON.stringify({marks:m.junctionPriority.length,errors,crossingConflicts},null,2));
}finally{await server.close();}
