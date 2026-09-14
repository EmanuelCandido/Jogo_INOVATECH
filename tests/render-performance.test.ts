import {describe,it,expect,vi} from 'vitest';
import {BoxGeometry,Color,Group,InstancedMesh,Matrix4,MeshBasicMaterial,MeshStandardMaterial,OrthographicCamera} from 'three';
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
  expect(result).toMatchObject({frames:100,p50:10,p95:10,p99:10,onePercentLow:10});
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
