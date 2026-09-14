// Inventory of visible bearing paths, not a structural strength calculation.
// Every open span keeps its measured length and its two identified ends.
import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},plugins:[{
 name:'inspect-prepared-population',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/config/referenceMap.ts'))return code.replaceAll('import.meta.env?.SSR','false');},
}]});
try{
 const map=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const {roadStructures,structuralSupports}=await server.ssrLoadModule('/src/config/roadStructures.ts');
 const {layoutFor,attachmentWorld}=await server.ssrLoadModule('/src/assets/modelLayout.ts');
 const {sampleLine,lineLength,segmentDistance:pointSegment}=await server.ssrLoadModule('/src/config/spatial.ts');
 const gap=(point,poly)=>map.pointInFootprint(point,poly)?0:Math.min(...poly.map((p,i)=>pointSegment(point,p,poly[(i+1)%poly.length])));
 const range=p=>{const b=layoutFor(p.asset).bounds,ys=[];for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]])ys.push(attachmentWorld(p,[x,y,z])[1]);return [Math.min(...ys),Math.max(...ys)];};
 const walls=roadStructures.filter(p=>p.asset==='prop.roadRetaining').map(p=>({poly:map.placementFootprint(p),heights:range(p)}));
 const caps=structuralSupports.map(s=>({s,poly:map.placementFootprint(s.parts[2]),heights:range(s.parts[2])}));
 const routes=[...map.mapRoads,map.roadViaduct,map.monorail,map.centralRail,...map.stationConcourses];
 const result=[];
 for(const route of routes){
  const length=lineLength(route.points),n=Math.ceil(length/.5),samples=[],width=route.width+(route.kind==='rail'?.12:route.kind==='walk'?0:1.35);
  for(let i=0;i<=n;i++){
   const distance=length*i/n,{point:p,tangent:t}=sampleLine(route.points,distance),floor=map.roadHeightAt(route,p),land=map.onReferenceLand(...p),ground=land?map.terrainY(...p):-1.2;
   let bearing=null;
   if(floor<.14||land&&floor-.425<=ground+.03)bearing={type:'ground'};
   if(!bearing){const cap=caps.find(c=>Math.abs(c.s.top-floor)<.21&&gap(p,c.poly)<.03);if(cap)bearing={type:'pier',owner:cap.s.road,point:cap.s.point};}
   if(!bearing&&route.kind==='walk')for(const [index,s]of map.railFacilities.entries()){
    if(Math.abs(s.height-floor)>.02)continue;
    if(gap(p,s.footprint)<.05){bearing={type:'platform-slab',owner:index};break;}
    if(gap(p,s.groundFootprints[1])<.05){bearing={type:'lift-core',owner:index};break;}
    if(gap(p,s.groundFootprints[0])<.05&&Math.hypot(p[0]-s.stairsTop[0],p[1]-s.stairsTop[1])<1.3){bearing={type:'stair-head',owner:index};break;}
   }
   if(!bearing&&land&&route.kind==='road'){
    const sides=[-1,1].map(side=>[p[0]-t[1]*(width/2-.14)*side,p[1]+t[0]*(width/2-.14)*side]);
    if(sides.every(q=>walls.some(w=>gap(q,w.poly)<.08&&w.heights[0]<=map.terrainY(...q)+.04&&w.heights[1]>=floor-.425-.03)))bearing={type:'paired-retaining-walls'};
   }
   samples.push({distance,point:p,floor,ground,bearing});
  }
  const spans=[];let start=-1;
  for(let i=0;i<=samples.length;i++){
   if(i<samples.length&&!samples[i].bearing){if(start<0)start=i;continue;}
   if(start<0)continue;
   const left=samples[start-1],right=samples[i];
   spans.push({from:samples[start].point,to:samples[i-1].point,length:(right?.distance??length)-(left?.distance??0),left:left?.bearing??null,right:right?.bearing??null});start=-1;
  }
  const counts={};for(const s of samples)if(s.bearing)counts[s.bearing.type]=(counts[s.bearing.type]??0)+1;
  result.push({id:route.id,length,samples:samples.length,bearingSamples:counts,spans});
 }
 const unresolved=result.flatMap(r=>r.spans.filter(s=>!s.left||!s.right).map(s=>({route:r.id,...s})));
 await writeFile('docs/validation/structure-span-inventory.json',JSON.stringify({generatedAt:new Date().toISOString(),basis:'Prepared population; placed cap/retaining geometry bounds, ground and station sockets; strength not evaluated',routes:result,unresolved},null,2));
 console.log(JSON.stringify({routes:result.length,spans:result.reduce((n,r)=>n+r.spans.length,0),unresolved},null,2));
}finally{await server.close();}
