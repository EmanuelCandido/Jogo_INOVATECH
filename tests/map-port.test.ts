import {describe,it,expect} from 'vitest';
import {Box3,OrthographicCamera,Plane,Raycaster,Vector2,Vector3} from 'three';
import {mapBaseZoom,mapFootprint,clampTarget,mapLimits} from '../src/game/mapNavigation';
import {harborContainers} from '../src/config/harbor';
import {cityLots,districtProps} from '../src/config/districts';
import {onLand} from '../src/config/terrain';
import {roadPlacements} from '../src/config/infrastructure';
import {layoutFor,attachmentWorld} from '../src/assets/modelLayout';
import type {Placement} from '../src/game/types';
function bounds(p:Placement){
 const b=layoutFor(p.asset)!.bounds,box=new Box3();
 for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]])box.expandByPoint(new Vector3(...attachmentWorld(p,[x,y,z])));
 return box;
}
describe('limites visíveis e organização do porto',()=>{
 it('mantém os quatro cantos da câmera dentro do mapa após arrasto ou zoom extremos',()=>{
  for(const [w,h] of [[1440,900],[412,839],[360,640],[2560,1080],[360,1100]])for(const zoom of [1,1.25,2,3.5])for(const direction of [[-999,-999],[-999,999],[999,-999],[999,999]]){
   const cam=new OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,700);cam.zoom=mapBaseZoom(w,h)*zoom;
   const [x,z]=clampTarget(...direction as [number,number],mapFootprint(cam.zoom,w,h));
   cam.position.set(x+110,130,z+145);cam.lookAt(x,0,z);cam.updateProjectionMatrix();cam.updateMatrixWorld();
   for(const u of [-1,1])for(const v of [-1,1]){
    const ray=new Raycaster();ray.setFromCamera(new Vector2(u,v),cam);
    const hit=ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3())!;
    expect(hit.x).toBeGreaterThanOrEqual(mapLimits.minX-.001);expect(hit.x).toBeLessThanOrEqual(mapLimits.maxX+.001);
    expect(hit.z).toBeGreaterThanOrEqual(mapLimits.minZ-.001);expect(hit.z).toBeLessThanOrEqual(mapLimits.maxZ+.001);
   }
  }
 });
 it('organiza mais carga em pilhas apoiadas, fora das ruas, edifícios, caminhões e guindastes',()=>{
  expect(harborContainers.length).toBeGreaterThan(40);
  const obstacles=[...cityLots.map(l=>bounds(l.building)),...districtProps.filter(p=>p.asset==='prop.truck'||p.asset==='prop.crane').map(bounds),...roadPlacements.map(p=>new Box3().setFromCenterAndSize(new Vector3(...p.position),new Vector3(...p.scale!)))];
  const boxes=harborContainers.map(bounds);
  for(const [i,p] of harborContainers.entries()){
   const b=boxes[i];
   for(const x of [b.min.x,b.max.x])for(const z of [b.min.z,b.max.z])expect(onLand(x,z),`contêiner na água ${p.position}`).toBe(true);
   for(const o of obstacles)expect(b.intersectsBox(o),`carga obstrui ${p.position}`).toBe(false);
   for(let j=i+1;j<boxes.length;j++)expect(b.intersectsBox(boxes[j]),`pilhas sobrepostas ${i}/${j}`).toBe(false);
   if(p.position[1]>.11){
    const below=boxes.find(o=>o!==b&&Math.abs(o.min.x-b.min.x)<.01&&Math.abs(o.min.z-b.min.z)<.01&&o.max.y<b.min.y&&b.min.y-o.max.y<.06);
    expect(below,`contêiner sem apoio ${p.position}`).toBeDefined();
   }
  }
 });
});
