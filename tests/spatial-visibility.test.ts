import {describe,expect,it} from 'vitest';
import {BoxGeometry,Color,Frustum,InstancedMesh,Matrix4,MeshBasicMaterial,OrthographicCamera,PerspectiveCamera,Sphere,Vector3} from 'three';
import {SpatialVisibility} from '../src/game/spatialVisibility';
import {InstanceVisibility} from '../src/game/instanceVisibility';
import {PackedBounds} from '../src/game/packedBounds';

function pack(spheres:Sphere[]){const bounds=new PackedBounds(spheres.length);spheres.forEach((sphere,i)=>bounds.set(i,sphere));return bounds;}

function spheres(){
 let seed=1729;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 return Array.from({length:2048},()=>new Sphere(new Vector3(random()*300-150,random()*25,random()*300-150),.2+random()*8));
}
describe('visibilidade por regiões sem alterar seleção',()=>{
 it('reproduz cada esfera do caminho linear em 160 câmeras e dois tipos de projeção',()=>{
  const bounds=spheres(),spatial=new SpatialVisibility(pack(bounds)),frustum=new Frustum(),matrix=new Matrix4();let checked=0;
  const cameras=[new OrthographicCamera(-60,60,40,-40,.1,800),new PerspectiveCamera(55,1.5,.1,800)];
  for(const camera of cameras)for(let step=0;step<80;step++){
   camera.position.set(Math.sin(step*.23)*160,30+step%11*10,Math.cos(step*.23)*160);camera.lookAt(0,0,0);
   camera.zoom=.4+(step%9)*.5;camera.updateProjectionMatrix();camera.updateMatrixWorld();
   frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   const visible=spatial.select(frustum);expect(Array.from(visible)).toEqual(bounds.map(sphere=>+frustum.intersectsSphere(sphere)));checked+=spatial.sphereTests;
  }
  expect(checked).toBeLessThan(bounds.length*160*.55);
 });
 it('mantém esferas tangentes e grandes limites que atravessam regiões',()=>{
  const camera=new OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=5;camera.updateMatrixWorld();
  const frustum=new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const bounds=Array.from({length:128},(_,i)=>new Sphere(new Vector3(2+(i%3-1)*1e-9,i%2?0:2,0),i===3?100:1));
  const spatial=new SpatialVisibility(pack(bounds));expect(Array.from(spatial.select(frustum))).toEqual(bounds.map(s=>+frustum.intersectsSphere(s)));
 });
 it('mantém matrizes, cores, ordem e restauração das sombras com lotes grandes',()=>{
  const bounds=spheres().slice(0,192),mesh=new InstancedMesh(new BoxGeometry(),new MeshBasicMaterial(),bounds.length),matrix=new Matrix4();
  bounds.forEach((s,i)=>{mesh.setMatrixAt(i,matrix.makeTranslation(...s.center.toArray()));mesh.setColorAt(i,new Color(i/192,.4,.8));});
  const selection=new InstanceVisibility(mesh),camera=new OrthographicCamera(-40,40,40,-40,.1,800);selection.setSpatial(true);
  for(let step=0;step<20;step++){
   mesh.position.set(step%3*4,0,-step%5);mesh.rotation.y=step*.11;mesh.scale.set(1+(step%2)*.5,1,1.2);mesh.updateMatrixWorld();
   camera.position.set(step*7-60,100,100);camera.lookAt(step*7-60,0,0);camera.updateMatrixWorld();
   selection.select(camera);const count=mesh.count,matrices=mesh.instanceMatrix.array.slice(0,count*16),colors=mesh.instanceColor!.array.slice(0,count*3);
   selection.setSpatial(false);selection.select(camera);
   expect(mesh.count).toBe(count);expect(mesh.instanceMatrix.array.slice(0,count*16)).toEqual(matrices);expect(mesh.instanceColor!.array.slice(0,count*3)).toEqual(colors);
   selection.setSpatial(true);selection.restore();expect(mesh.count).toBe(bounds.length);expect(mesh.instanceMatrix.array).toEqual(selection.matrices);
  }
 });
});
