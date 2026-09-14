import {expect,it} from 'vitest';
import {roadGuardrailRuns} from '../src/config/roadGuardrails';
import {mapRoads,roadViaduct,roadHeightAt,distanceToRoute,pedestrianNetwork,type MapPoint} from '../src/config/referenceMap';
import {segmentDistance} from '../src/config/spatial';

it('mantém os segmentos completos de guarda-corpo fora de ruas e acessos no mesmo nível',()=>{
 const roads=[...mapRoads,roadViaduct],errors:unknown[]=[];
 expect(roadGuardrailRuns.length).toBeGreaterThan(10);
 for(const run of roadGuardrailRuns)for(let i=1;i<run.points.length;i++){
  const a=run.points[i-1],b=run.points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1));
  for(let j=0;j<=steps;j++){
   const t=j/steps,p:MapPoint=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],y=run.heights[i-1]+t*(run.heights[i]-run.heights[i-1]);
   for(const other of roads)if(other.id!==run.road&&Math.abs(roadHeightAt(other,p)-y)<1.25&&distanceToRoute(...p,other)<other.width/2+.76)errors.push({road:run.road,other:other.id,p});
   for(const link of pedestrianNetwork.links)if(Math.abs(link.accessHeight-y)<.45&&[...link.points,link.sidewalk].some((q,k,all)=>k>0&&segmentDistance(p,all[k-1],q)<.91))errors.push({road:run.road,entrance:link.id,p});
  }
 }
 expect(errors.slice(0,12)).toEqual([]);
});
