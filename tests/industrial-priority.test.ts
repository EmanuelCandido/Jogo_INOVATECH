import {expect,it} from 'vitest';
import {industrialGatePriority as priority} from '../src/config/servicePriority';
import {mapRoads,distanceToRoute,onReferenceLand,referenceTraffic,referenceTrees,placementFootprint,roadHeightAt,worldPoint} from '../src/config/referenceMap';
import {corridorGap,convexHull,polygonGap,type Point} from '../src/config/spatial';
import {OrthographicCamera,Vector3} from 'three';
import {attachmentWorld,layoutFor} from '../src/assets/modelLayout';

it('reserva a preferência do acesso principal e sinaliza somente a faixa de chegada do ramal',()=>{
 const road=mapRoads.find(r=>r.id===priority.yielding)!;
 expect(road.usage).toBe('freight');
 expect(priority.priority).toEqual(['ponte-industrial','patio-industrial']);
 for(const id of priority.priority){
  const main=mapRoads.find(r=>r.id===id)!;
  expect(distanceToRoute(...road.points.at(-1)!,main)).toBeLessThan(.001);
 }
 for(const line of [priority.triangle,...priority.line]){
  for(const point of line){
   expect(onReferenceLand(...point)).toBe(true);
   expect(distanceToRoute(...point,road)+priority.width/2).toBeLessThan(road.width/2);
   for(const id of priority.priority)expect(distanceToRoute(...point,mapRoads.find(r=>r.id===id)!)).toBeGreaterThan(2.5);
   expect(priority.height(point)).toBeCloseTo(roadHeightAt(road,point)+.061);
  }
  for(const truck of referenceTraffic)expect(corridorGap(placementFootprint(truck),line,priority.width),truck.asset+' '+truck.position).toBeGreaterThan(.1);
 }
});

it('mantém a sinalização visível por inteiro pela câmera do jogador sem remover árvores',()=>{
 const camera=new OrthographicCamera(-100,100,100,-100,.1,1000);
 camera.position.set(110,130,145);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const project=(p:[number,number,number]):Point=>{const v=new Vector3(...p).project(camera);return [v.x,v.y];};
 const mark=convexHull([...priority.triangle,...priority.line.flat()].map(p=>project(worldPoint(...p,priority.height(p))))),conflicts=[];
 for(const tree of referenceTrees){
  const b=layoutFor(tree.asset)!.bounds,points:Point[]=[];
  for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]])points.push(project(attachmentWorld(tree,[x,y,z])));
  if(polygonGap(mark,convexHull(points))<=0)conflicts.push(tree.position);
 }
 expect(referenceTrees).toHaveLength(5686);
 expect(conflicts).toEqual([]);
});
