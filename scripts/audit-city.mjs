import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {cityLots,forest,districtProps}=await server.ssrLoadModule('/src/config/districts.ts');
 const {coastRoadSamples}=await server.ssrLoadModule('/src/config/coastalRoad.ts');
 const {referencePixel}=await server.ssrLoadModule('/src/config/referenceFrame.ts');
 const {gardenBeds,gardenSites,gardenWalks,landscapeAssets,landscapeDetails}=await server.ssrLoadModule('/src/config/landscape.ts');
 console.log(JSON.stringify({landscape:{beds:gardenBeds.length,furnishedSpaces:gardenSites.length,privateGardens:gardenSites.filter(s=>s.name.startsWith('quintal')).length,cafeTerraces:gardenSites.filter(s=>s.name.startsWith('esplanada')).length,walks:gardenWalks.length,trees:landscapeAssets.length,instancedDetails:landscapeDetails.length,...(process.argv.includes('--details')?{sites:gardenSites}:{})}},null,2));
 console.log(JSON.stringify({buildings:cityLots.length,woodlandInstances:forest.length,streetObjects:districtProps.length,coastalRoadSamples:coastRoadSamples.length,landmarks:cityLots.filter(l=>['building.school','building.hospital','building.civic','building.office'].includes(l.building.asset)).map(l=>({asset:l.building.asset,world:l.building.position,referencePixel:referencePixel(l.building.position[0],l.building.position[2]).map(Math.round)}))},null,2));
}finally{await server.close();}
