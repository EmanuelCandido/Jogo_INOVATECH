import {describe,it,expect,vi} from 'vitest';
import {BoxGeometry,Color,Frustum,Group,InstancedMesh,Matrix4,MeshBasicMaterial,MeshStandardMaterial,OrthographicCamera} from 'three';
import {sharedModelMaterial} from '../src/assets/sharedMaterials';
import {InstanceVisibility,optimizeInstances,instanceVisibility} from '../src/game/instanceVisibility';
import {frameTask} from '../src/game/frameTask';
import {frameMetrics} from '../src/game/frameMetrics';

function fixture(){
 const mesh=new InstancedMesh(new BoxGeometry(),new MeshBasicMaterial(),3);
 const m=new Matrix4();
 [0,20,-20].forEach((x,i)=>{mesh.setMatrixAt(i,m.makeTranslation(x,0,0));mesh.setColorAt(i,new Color(['red','green','blue'][i]));});
 const camera=new OrthographicCamera(-2,2,2,-2,.1,100);camera.position.set(0,0,10);camera.updateMatrixWorld();
 return {mesh,camera};
}
describe('renderização com a mesma cidade',()=>{
 it('compacta matrizes e cores sem perder fontes; recupera objetos ao voltar a câmera',()=>{
  const {mesh,camera}=fixture(),v=new InstanceVisibility(mesh),sources=v.matrices.slice();
  v.select(camera);expect(mesh.count).toBe(1);expect(mesh.instanceMatrix.array[12]).toBe(0);
  const version=mesh.instanceMatrix.version;v.select(camera);expect(mesh.instanceMatrix.version).toBe(version);
  camera.position.x=20;camera.updateMatrixWorld();v.select(camera);
  expect(mesh.count).toBe(1);expect(mesh.instanceMatrix.array[12]).toBe(20);expect(mesh.instanceColor!.array[1]).toBeGreaterThan(0);
  camera.position.x=100;camera.updateMatrixWorld();v.select(camera);expect(mesh.count).toBe(0);
  camera.position.x=-20;camera.updateMatrixWorld();v.select(camera);expect(mesh.count).toBe(1);expect(mesh.instanceMatrix.array[12]).toBe(-20);
  expect(v.matrices).toEqual(sources);
 });
 it('restaura todos os lançadores, inclusive fora da câmera, antes de gerar a sombra',()=>{
  const {mesh,camera}=fixture(),v=new InstanceVisibility(mesh);
  v.select(camera);v.restore();expect(mesh.count).toBe(3);expect(mesh.instanceMatrix.array).toEqual(v.matrices);expect(mesh.instanceColor!.array).toEqual(v.colors);
  v.select(camera);expect(mesh.count).toBe(1);
 });
 it('mantém buffers intactos ao mover a câmera sem mudar a seleção visível',()=>{
  const {mesh,camera}=fixture(),v=new InstanceVisibility(mesh);
  v.select(camera);
  const version=mesh.instanceMatrix.version,colorVersion=mesh.instanceColor!.version,updates=v.updates;
  for(const x of [.1,.2,.3]){camera.position.x=x;camera.updateMatrixWorld();v.select(camera);}
  expect(mesh.count).toBe(1);expect(v.updates).toBe(updates);
  expect(mesh.instanceMatrix.version).toBe(version);expect(mesh.instanceColor!.version).toBe(colorVersion);
 });
 it('atualiza só os slots alterados e preserva uploads pendentes ao compactar após sombra',()=>{
  const {mesh,camera}=fixture(),v=new InstanceVisibility(mesh);
  camera.position.x=20;camera.updateMatrixWorld();v.select(camera);
  expect(mesh.instanceMatrix.updateRanges).toEqual([{start:0,count:16}]);
  expect(mesh.instanceColor!.updateRanges).toEqual([{start:0,count:3}]);
  mesh.instanceMatrix.clearUpdateRanges();mesh.instanceColor!.clearUpdateRanges();
  v.restore(); // The full shadow upload has not reached WebGL yet.
  v.select(camera);
  expect(mesh.instanceMatrix.updateRanges).toEqual([{start:0,count:48}]);
  expect(mesh.instanceColor!.updateRanges).toEqual([{start:0,count:9}]);
  expect(mesh.instanceMatrix.array[12]).toBe(20);
 });
 it('recupera a cauda oculta sem uploads e preserva cores após seleções vazias',()=>{
  const {mesh,camera}=fixture(),v=new InstanceVisibility(mesh);
  v.select(camera);camera.left=-30;camera.right=30;camera.updateProjectionMatrix();
  const version=mesh.instanceMatrix.version;v.select(camera);
  expect(mesh.count).toBe(3);expect(mesh.instanceMatrix.version).toBe(version);
  camera.position.x=100;camera.updateMatrixWorld();v.select(camera);expect(mesh.count).toBe(0);
  camera.position.x=0;camera.updateMatrixWorld();v.select(camera);
  expect(mesh.count).toBe(3);expect(mesh.instanceMatrix.array).toEqual(v.matrices);expect(mesh.instanceColor!.array).toEqual(v.colors);
 });
 it('mantém a seleção e os atributos equivalentes durante um percurso com sombras',()=>{
  const {mesh,camera}=fixture(),v=new InstanceVisibility(mesh),frustum=new Frustum(),clip=new Matrix4();
  const sourceBounds=Array.from({length:mesh.count},(_,i)=>{mesh.getMatrixAt(i,clip);return mesh.geometry.boundingSphere!.clone().applyMatrix4(clip);});
  for(let step=0;step<80;step++){
   camera.position.x=Math.sin(step*.3)*40;camera.zoom=.2+(step%9)*.25;camera.updateProjectionMatrix();camera.updateMatrixWorld();
   if(step%7===0)v.restore();
   v.select(camera);
   frustum.setFromProjectionMatrix(clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(mesh.matrixWorld));
   const ids=sourceBounds.map((bound,i)=>frustum.intersectsSphere(bound)?i:-1).filter(i=>i>=0);
   expect(mesh.count).toBe(ids.length);
   ids.forEach((id,slot)=>{
    expect(Array.from(mesh.instanceMatrix.array.slice(slot*16,(slot+1)*16))).toEqual(Array.from(v.matrices.slice(id*16,(id+1)*16)));
    expect(Array.from(mesh.instanceColor!.array.slice(slot*3,(slot+1)*3))).toEqual(Array.from(v.colors!.slice(id*3,(id+1)*3)));
   });
  }
 });
 it('considera a extensão da geometria e a transformação do grupo de uma situação',()=>{
  const {mesh,camera}=fixture(),group=new Group();group.add(mesh);group.position.x=4;
  mesh.setMatrixAt(0,new Matrix4().makeScale(6,1,1));group.updateMatrixWorld(true);
  const v=new InstanceVisibility(mesh);v.select(camera);expect(mesh.count).toBe(1); // centre outside, edge inside
  group.position.x=40;group.updateMatrixWorld(true);v.select(camera);expect(mesh.count).toBe(0);
 });
 it('remove registros ao desmontar ou trocar a variante e recalcula o limite completo',()=>{
  const {mesh}=fixture(),size=instanceVisibility.size;
  mesh.count=1;const dispose=optimizeInstances(mesh,3);
  expect(mesh.boundingSphere!.radius).toBeGreaterThan(20);expect(instanceVisibility.size).toBe(size+1);
  dispose();expect(instanceVisibility.size).toBe(size);
 });
 it('consolida uma rajada de entrada e entrega o último movimento ao terminar o gesto',()=>{
  const scheduled:FrameRequestCallback[]=[],cancel=vi.fn(),run=vi.fn();
  const task=frameTask(run,fn=>{scheduled.push(fn);return scheduled.length;},cancel);
  task.schedule();task.schedule();task.schedule();expect(scheduled).toHaveLength(1);
  task.flush();expect(run).toHaveBeenCalledTimes(1);expect(cancel).toHaveBeenCalledWith(1);
  task.schedule();scheduled[1](0);expect(run).toHaveBeenCalledTimes(2);
  task.schedule();task.cancel();task.flush();expect(run).toHaveBeenCalledTimes(2);
 });
 it('mede percentis e o 1% mais lento em tempos de quadro, ignorando valores inválidos',()=>{
  const result=frameMetrics([...Array(99).fill(10),100,0,NaN]);
  expect(result).toMatchObject({frames:100,p50:10,p95:10,p99:10,onePercentLow:10,over33Ms:1,over50Ms:1});
  expect(result!.meanFps).toBeCloseTo(1000/10.9);
  expect(frameMetrics([])).toBeNull();
 });
 it('compartilha somente materiais com a mesma aparência e o mesmo shader',()=>{
  const a=new MeshStandardMaterial({color:'#987654',roughness:.827,metalness:.156});
  const b=a.clone(),rough=a.clone(),glass=a.clone(),shader=a.clone();rough.roughness=.3;glass.transparent=true;glass.opacity=.5;
  shader.customProgramCacheKey=()=> 'different-texture';
  expect(sharedModelMaterial(a)).toBe(sharedModelMaterial(b));
  for(const different of [rough,glass,shader])expect(sharedModelMaterial(different)).not.toBe(sharedModelMaterial(a));
 });
});
