import {createServer} from 'vite';
import clip from 'polygon-clipping';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try {
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const {corridorPolygon,multiPolygonArea}=await server.ssrLoadModule('/src/config/streetLayout.ts');
 const {layoutFor}=await server.ssrLoadModule('/src/assets/modelLayout.ts');
 const crossings=[];
 const routes=[...m.mapRoads,m.roadViaduct,m.monorail,m.centralRail];
 for(let i=0;i<routes.length;i++)for(let j=i+1;j<routes.length;j++){
  const a=routes[i],b=routes[j];
  const overlap=clip.intersection(corridorPolygon(a,a.kind==='rail'?.06:.675),corridorPolygon(b,b.kind==='rail'?.06:.675));
  if(multiPolygonArea(overlap)<.025)continue;
  const points=overlap.flatMap(p=>p[0]);
  const gaps=points.map(p=>m.roadHeightAt(a,p)-m.roadHeightAt(b,p));
  const lo=Math.min(...gaps),hi=Math.max(...gaps);
  crossings.push({a:a.id,b:b.id,rail:a.kind==='rail'||b.kind==='rail',area:multiPolygonArea(overlap),minDelta:lo,maxDelta:hi,point:points[0]});
 }
 const report={crossings,facilities:m.railFacilities.map(s=>({...s,route:s.route.id})),lots:m.buildingLots.filter(l=>l.id==='estacao-central'||l.id.startsWith('industria')).map(l=>({id:l.id,point:[l.u,l.v],footprint:l.footprint,layout:layoutFor(l.placement.asset)})),models:Object.fromEntries(['prop.stationCanopy','building.centralStation','prop.playground'].map(id=>[id,layoutFor(id)])),paths:m.pedestrianNetwork.links.filter(l=>l.points.length>5)};
 await writeFile('docs/circulation-inspection.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({railCrossings:crossings.filter(c=>c.rail),facilities:report.facilities.map(({name,centre,t,n,lift,access,accessHeight,height})=>({name,centre,t,n,lift,access,accessHeight,height})),lots:report.lots,models:report.models},null,2));
} finally {await server.close();}
