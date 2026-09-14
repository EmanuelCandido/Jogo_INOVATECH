import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},plugins:[{
 name:'inspect-prepared-population',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/config/referenceMap.ts'))return code.replaceAll('import.meta.env?.SSR','false');},
}]});
try{
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const {roadHeightSampler,heightAlongRoad}=await server.ssrLoadModule('/src/config/roadProfiles.ts');
 const roads=m.mapRoads.map(r=>({...r,heights:r.points.map((_,i)=>m.routeHeight(r,i))})),floor=roadHeightSampler(roads);
 const requested=process.argv.slice(2).map(s=>s.split(',').map(Number));
 for(const point of requested.length?requested:[[-4.761938810348511,52.405320485432945],[-5.222315788269043,53.157938639322914],[7.088996569315593,-10.776361147562662]]){
  const values=[];for(const d of [-.001,0,.001]){const p=[point[0]+d,point[1]];values.push({p,height:floor(...p),roads:roads.map(r=>({id:r.id,...heightAlongRoad(r,r.heights,p)})).filter(s=>s.distance<4)});}
  console.log(JSON.stringify(values));
 }
}finally{await server.close();}
