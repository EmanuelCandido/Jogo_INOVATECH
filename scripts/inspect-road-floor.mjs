import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},plugins:[{
 name:'inspect-prepared-population',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/config/referenceMap.ts'))return code.replaceAll('import.meta.env?.SSR','false');},
}]});
try{
 const m=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const {roadHeightSampler}=await server.ssrLoadModule('/src/config/roadProfiles.ts');
 const {polygon}=await server.ssrLoadModule('/src/components/environment/referenceGeometry.ts');
 const {segmentDistance}=await server.ssrLoadModule('/src/config/spatial.ts');
 const simplify=process.argv.includes('--simplify');
 const contour=ring=>{
  if(!simplify)return ring;
  const result=ring.slice();let changed=true;
  while(changed&&result.length>3){changed=false;for(let i=result.length-1;i>=0;i--){if(result.length<=3)break;const a=result[(i+result.length-1)%result.length],b=result[i],c=result[(i+1)%result.length];if(segmentDistance(b,a,c)<.002){result.splice(i,1);changed=true;}}}
  return result;
 };
 const floor=roadHeightSampler(m.mapRoads.map(r=>({...r,heights:r.points.map((_,i)=>m.routeHeight(r,i))})));
 const anomalies=[],heightErrors=[];let triangles=0,vertices=0,maximumError=0;const started=performance.now();
 for(const p of m.streetLayout.asphalt){
  const g=polygon(contour(p[0]),(u,v)=>floor(u,v)+.038,false,p.slice(1).map(contour),1.6),uv=g.getAttribute('uv'),position=g.getAttribute('position'),index=g.index;
  triangles+=(index?.count??uv.count)/3;vertices+=position.count;
  for(let i=0;i<(index?.count??uv.count);i+=3){
   const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j),center=[0,1].map(k=>ids.reduce((n,j)=>n+(k?uv.getY(j):uv.getX(j)),0)/3);
   const [a,b,c]=ids.map(j=>[position.getX(j),position.getY(j),position.getZ(j)]),u=b.map((n,k)=>n-a[k]),v=c.map((n,k)=>n-a[k]);
   const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],slope=Math.hypot(normal[0],normal[2])/Math.max(1e-12,Math.abs(normal[1]));
   const error=Math.abs((a[1]+b[1]+c[1])/3-(floor(...center)+.038));
   maximumError=Math.max(maximumError,error);
   if(error>.02)heightErrors.push({center,error,area:Math.abs(normal[1])/2,slope});
   if(slope>.16){const delta=.002,du=(floor(center[0]+delta,center[1])-floor(center[0]-delta,center[1]))/(2*delta),dv=(floor(center[0],center[1]+delta)-floor(center[0],center[1]-delta))/(2*delta);anomalies.push({center,slope,fieldSlope:Math.hypot(du,dv),heights:ids.map(j=>floor(uv.getX(j),uv.getY(j))),points:ids.map(j=>[uv.getX(j),uv.getY(j)])});}
  }g.dispose();
 }
 anomalies.sort((a,b)=>b.slope-a.slope);
 const suffix=simplify?'-simplified':'';
 await writeFile(`docs/validation/road-floor-anomalies${suffix}.json`,JSON.stringify(anomalies,null,2));
 heightErrors.sort((a,b)=>b.error-a.error);
 await writeFile(`docs/validation/road-floor-height-errors${suffix}.json`,JSON.stringify(heightErrors,null,2));
 const metrics={triangles,vertices,preparationMs:performance.now()-started,count:anomalies.length,centroidErrors:heightErrors.length,maximumError,maximumHeightError:heightErrors.slice(0,5)};
 await writeFile(`docs/validation/road-floor-metrics${suffix}.json`,JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics,null,2));
}finally{await server.close();}
