import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {cityDecorations}=await server.ssrLoadModule('/src/config/cityDetails.ts');
 const {graphicsPresets,graphicsTiers,keepDetail}=await server.ssrLoadModule('/src/config/graphics.ts');
 const {forest,districtProps}=await server.ssrLoadModule('/src/config/districts.ts');
 const {landscapeDetails}=await server.ssrLoadModule('/src/config/landscape.ts');
 console.log(JSON.stringify({kinds:cityDecorations.reduce((a,g)=>(a[g.kind]=(a[g.kind]??0)+1,a),{}),profiles:graphicsTiers.map(tier=>{
  const q=graphicsPresets[tier],groups=cityDecorations.filter(g=>g.tier<=q.cityDetail);
  return {tier,forest:forest.filter((_,i)=>keepDetail(i,q.forestDensity)).length,streetObjects:districtProps.filter((p,i)=>!/^prop\.(car\.|bus)/.test(p.asset)||keepDetail(i,q.traffic)).length,gardenParts:landscapeDetails.filter(p=>!p.category||(keepDetail(p.cluster,q.undergrowth)&&(p.category!=='flower'||keepDetail(p.cluster,q.flowers)))).length,extraGroups:groups.length,extraParts:groups.reduce((n,g)=>n+g.details.length+g.assets.length,0),shadowSize:q.shadowSize,maxPixels:q.maxPixels};
 })},null,2));
}finally{await server.close();}
