import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts'),sp=await server.ssrLoadModule('/src/config/spatial.ts');
 for(const [i,s]of m.railFacilities.entries()){
 const points=s.footprint.slice(0,23).map((p,j)=>{const q=s.footprint[s.footprint.length-1-j];return [(p[0]+q[0])/2,(p[1]+q[1])/2];});
 for(const d of [3,6,9,12,15,18]){const q=sp.sampleLine(points,d),p=m.placement('prop.roadFooting',...q.point,1,m.facing(...q.tangent)),poly=m.placementFootprint(p);
 console.log(i,d,JSON.stringify({point:q.point,lots:[...m.buildingLots,...m.stationAccessLots].filter(l=>sp.polygonGap(poly,l.footprint)<.4).map(l=>l.id),paths:m.pedestrianNetwork.links.filter(l=>sp.corridorGap(poly,[...l.points,l.sidewalk],1.4)<.3).map(l=>l.id),roads:m.mapRoads.filter(r=>sp.corridorGap(poly,r.points,r.width+1.35)<.4).map(r=>r.id)}));
 }
 }
}finally{await server.close();}
