import {describe,expect,it} from 'vitest';
import {BoxGeometry,Frustum,InstancedMesh,Matrix4,MeshBasicMaterial,OrthographicCamera,PerspectiveCamera,Plane,Sphere,Vector3} from 'three';
import {PackedBounds} from '../src/game/packedBounds';
import {InstanceVisibility} from '../src/game/instanceVisibility';

describe('limites compactos com a precisão original',()=>{
 it('conserva todos os doubles e copia a esfera temporária sem reter sua referência',()=>{
  const bounds=new PackedBounds(2),sphere=new Sphere(new Vector3(-0,1+Number.EPSILON,1e-100),Math.PI);
  bounds.set(0,sphere);sphere.center.set(1e100,-1e100,Number.MIN_VALUE);sphere.radius=1+Number.EPSILON;bounds.set(1,sphere);
  sphere.center.set(0,0,0);sphere.radius=0;
  expect(Array.from(bounds.values)).toEqual([-0,1+Number.EPSILON,1e-100,Math.PI,1e100,-1e100,Number.MIN_VALUE,1+Number.EPSILON]);
  expect(bounds.values.byteLength).toBe(2*4*8);
 });
 it('preserva tangência e os vizinhos que Float32 arredondaria para dentro da câmera',()=>{
  const planes=[new Plane(new Vector3(1,0,0),1),new Plane(new Vector3(-1,0,0),1),new Plane(new Vector3(0,1,0),1),new Plane(new Vector3(0,-1,0),1),new Plane(new Vector3(0,0,1),1),new Plane(new Vector3(0,0,-1),1)];
  const frustum=new Frustum(...planes),bounds=new PackedBounds(1);
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1])for(const offset of [-4*Number.EPSILON,0,4*Number.EPSILON]){
   const sphere=new Sphere(new Vector3().setComponent(axis,sign*(2+offset)),1);bounds.set(0,sphere);
   expect(bounds.intersects(frustum,0)).toBe(frustum.intersectsSphere(sphere));
   expect(bounds.intersects(frustum,0)).toBe(offset<=0);
  }
 });
 it('reproduz as esferas originais após translações, reflexões, escala e cisalhamento',()=>{
  const geometry=new BoxGeometry(3,7,11).translate(2.3,-1.2,4.1),mesh=new InstancedMesh(geometry,new MeshBasicMaterial(),64),matrix=new Matrix4();
  for(let i=0;i<64;i++)mesh.setMatrixAt(i,matrix.set((i%3-1)*.7,.21,0,i*13.12,.17,1+i*.03,.11,-i*.5,0,.27,2.1-i*.09,90-i*2.3,0,0,0,1));
  geometry.computeBoundingSphere();
  const reference=Array.from({length:mesh.count},(_,i)=>{mesh.getMatrixAt(i,matrix);return geometry.boundingSphere!.clone().applyMatrix4(matrix);});
  const visibility=new InstanceVisibility(mesh);
  expect(Array.from(visibility.bounds.values)).toEqual(reference.flatMap(sphere=>[...sphere.center.toArray(),sphere.radius]));
 });
 it('reproduz a Three em 128 câmeras ortográficas e perspectivas com limites de várias escalas',()=>{
  let seed=2615;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const source=Array.from({length:1024},()=>new Sphere(new Vector3((random()-.5)*300,(random()-.5)*30,(random()-.5)*300),random()**3*80));
  const bounds=new PackedBounds(source.length);source.forEach((sphere,i)=>bounds.set(i,sphere));
  const cameras=[new OrthographicCamera(-60,60,40,-40,.1,1000),new PerspectiveCamera(55,1.7,.1,1000)],frustum=new Frustum(),matrix=new Matrix4();
  for(const camera of cameras)for(let step=0;step<64;step++){
   camera.position.set(Math.sin(step*.2)*140,10+step,Math.cos(step*.2)*140);camera.lookAt(0,0,0);camera.zoom=.2+(step%11)*.3;camera.updateProjectionMatrix();camera.updateMatrixWorld();
   frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   expect(source.map((_,i)=>bounds.intersects(frustum,i))).toEqual(source.map(sphere=>frustum.intersectsSphere(sphere)));
  }
 });
 it('aceita um lote vazio sem selecionar ou restaurar instâncias inexistentes',()=>{
  const mesh=new InstancedMesh(new BoxGeometry(),new MeshBasicMaterial(),0),visibility=new InstanceVisibility(mesh),camera=new OrthographicCamera(-1,1,1,-1,.1,10);
  visibility.select(camera);visibility.restore();expect(mesh.count).toBe(0);expect(visibility.bounds.values.byteLength).toBe(0);expect(mesh.instanceMatrix.updateRanges).toEqual([]);
 });
});
