import {expect,it} from 'vitest';
import {junctionPriority,circulationCrossings,mapRoads,roadViaduct,distanceToRoute,blocksJunctionMarking,referenceTraffic,placementFootprint,roadHeightAt} from '../src/config/referenceMap';
import {polygonGap} from '../src/config/spatial';
import {ribbon} from '../src/components/environment/referenceGeometry';
import {compositionPoint} from '../src/config/referenceMap';
import {viaductTraffic} from '../src/config/referenceDetails';
import {roadProfiles} from '../src/config/referenceMap';

it('liga a entrada norte da rua escolar uma única vez e preserva o percurso do bairro',()=>{
 const road=mapRoads.find(r=>r.id==='bairro-escola')!;
 expect(roadProfiles.junctions.filter(j=>j.roads.includes(road.id)&&j.roads.includes('avenida-botanica')&&j.point[1]>0)).toHaveLength(1);
 expect(distanceToRoute(-49.99872384015332,-2.3265070461944775,road)).toBeLessThan(.001);
 expect(distanceToRoute(-61.416223992466854,-21.31076388041259,road)).toBeLessThan(.001);
});

it('não sobrepõe faixas de pedestres de encontros consecutivos',()=>{
 const crossings=circulationCrossings.crossings,roads=[...mapRoads,roadViaduct],conflicts=[];
 for(let i=0;i<crossings.length;i++)for(let j=i+1;j<crossings.length;j++){
  const a=crossings[i],b=crossings[j];
  const ah=roadHeightAt(roads.find(r=>r.id===a.road)!,a.point),bh=roadHeightAt(roads.find(r=>r.id===b.road)!,b.point);
  if(Math.abs(ah-bh)<.2&&polygonGap(a.footprint,b.footprint)<.05)conflicts.push({a:a.road,from:a.point,b:b.road,to:b.point});
 }
 expect(conflicts).toEqual([]);
});

it('coloca retenção na faixa de entrada, antes de cada travessia, com preferência consistente',()=>{
 expect(junctionPriority).toHaveLength(circulationCrossings.crossings.length);
 const errors=[];
 for(const mark of junctionPriority){
  const road=[...mapRoads,roadViaduct].find(r=>r.id===mark.road)!;
  if(mark.yielding&&mark.lines.length<2)errors.push({road:road.id,reason:'preferência sem triângulo',node:mark.crossing.node});
  for(const line of mark.lines){
   const geometry=ribbon(line,mark.width),p=geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){
    const uv=compositionPoint(p.getX(i),p.getZ(i));
    if(distanceToRoute(...uv,road)>road.width/2)errors.push({road:road.id,reason:'fora do asfalto',at:uv});
   }
   geometry.dispose();
  }
  for(const area of mark.reservations)for(const crossing of circulationCrossings.crossings){
   const other=[...mapRoads,roadViaduct].find(r=>r.id===crossing.road)!;
   if(Math.abs(roadHeightAt(road,mark.crossing.point)-roadHeightAt(other,crossing.point))>.2)continue;
   if(polygonGap(area,crossing.footprint)<.05)errors.push({road:road.id,reason:'sobre a travessia',at:mark.crossing.point,other:other.id});
  }
  const frame=mark.crossing,mid=mark.lines[0].reduce((p,q)=>[p[0]+q[0]/2,p[1]+q[1]/2],[0,0]);
  const side=(mid[0]-frame.point[0])*(-frame.direction*frame.tangent[1])+(mid[1]-frame.point[1])*(frame.direction*frame.tangent[0]);
  if(side<=0)errors.push({road:road.id,reason:'faixa contrária',side});
 }
 expect(errors).toEqual([]);
});

it('mantém as marcações livres dos veículos da cidade e do viaduto',()=>{
 expect([...referenceTraffic,...viaductTraffic].filter(blocksJunctionMarking).map(p=>({at:p.position,asset:p.asset,footprint:placementFootprint(p)}))).toEqual([]);
});
