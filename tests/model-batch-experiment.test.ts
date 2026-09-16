import {afterEach,describe,expect,it,vi} from 'vitest';
import {BatchedMesh,BoxGeometry,Group,InstancedMesh,InterleavedBuffer,InterleavedBufferAttribute,Matrix4,MeshStandardMaterial,OrthographicCamera,Scene,type WebGLRenderer} from 'three';
import {instanceVisibility,optimizeInstances} from '../src/game/instanceVisibility';
import {batchIsolatedModels} from '../src/game/modelBatchExperiment';

afterEach(()=>{instanceVisibility.clear();vi.restoreAllMocks();});
function fixture(){
 const scene=new Scene(),material=new MeshStandardMaterial(),meshes:InstancedMesh[]=[];
 for(let i=0;i<5;i++){
  const group=new Group();group.userData.modelUrl=`/assets/models/example-${i}.glb`;scene.add(group);
  const mesh=new InstancedMesh(new BoxGeometry(i+1,1,1),material,1);mesh.setMatrixAt(0,new Matrix4().makeTranslation(i*3,.2,0));group.add(mesh);optimizeInstances(mesh,1);meshes.push(mesh);
 }
 return {scene,meshes};
}
describe('agrupamento diagnóstico de modelos isolados',()=>{
 it('reutiliza a seleção e recupera a câmera após sombras, zoom e mudança de grupo',()=>{
  const prepare=vi.spyOn(BatchedMesh.prototype,'onBeforeRender'),{scene}=fixture(),result=batchIsolatedModels(scene);
  const batch=scene.getObjectByName('diagnostic-isolated-models') as BatchedMesh,camera=new OrthographicCamera(-20,20,20,-20,.1,100),shadow=new OrthographicCamera(-100,100,100,-100,.1,500);
  camera.position.z=30;camera.updateMatrixWorld();shadow.position.y=80;shadow.lookAt(0,0,0);shadow.updateMatrixWorld();scene.updateMatrixWorld(true);
  const draw=(c=camera)=>batch.onBeforeRender({} as WebGLRenderer,scene,c,batch.geometry,batch.material as MeshStandardMaterial,null as never);
  draw();draw();expect(prepare).toHaveBeenCalledTimes(1);
  camera.zoom=2;camera.updateProjectionMatrix();draw();expect(prepare).toHaveBeenCalledTimes(2);
  draw(shadow);draw();draw();expect(prepare).toHaveBeenCalledTimes(4);
  batch.matrix.makeTranslation(2,0,0);scene.updateMatrixWorld(true);draw();expect(prepare).toHaveBeenCalledTimes(5);result.dispose();
 });
 it('mantém os componentes de posições e cores normalizadas em buffers intercalados',()=>{
  const {scene,meshes}=fixture(),positions:number[]=[],colors:number[]=[];
  for(const mesh of meshes){
   const source=mesh.geometry.attributes.position,data=new Float32Array(source.count*5),tints=new Uint8Array(source.count*4);
   for(let i=0;i<source.count;i++){
    const xyz=[source.getX(i),source.getY(i),source.getZ(i)];data.set([9,...xyz,7],i*5);positions.push(...xyz);
    const rgb=[i*7%256,i*13%256,255-i];tints.set([...rgb,88],i*4);colors.push(...rgb);
   }
   mesh.geometry.setAttribute('position',new InterleavedBufferAttribute(new InterleavedBuffer(data,5),3,1));
   mesh.geometry.setAttribute('color',new InterleavedBufferAttribute(new InterleavedBuffer(tints,4),3,0,true));
  }
  const result=batchIsolatedModels(scene),batch=scene.getObjectByName('diagnostic-isolated-models') as BatchedMesh;
  expect(result.sourceDraws).toBe(5);expect(Array.from(batch.geometry.attributes.position.array)).toEqual(positions);expect(Array.from(batch.geometry.attributes.color.array)).toEqual(colors);result.dispose();
 });
 it('copia as matrizes e mantém os recursos e a restauração das fontes',()=>{
  const {scene,meshes}=fixture(),entries=[...instanceVisibility],disposed=vi.fn();
  meshes.forEach(mesh=>mesh.geometry.addEventListener('dispose',disposed));
  const result=batchIsolatedModels(scene),batch=scene.getObjectByName('diagnostic-isolated-models') as BatchedMesh;
  expect(result.sourceDraws).toBe(5);expect(result.batchDraws).toBe(1);expect(instanceVisibility.size).toBe(0);
  for(let i=0;i<meshes.length;i++){
   expect(batch.getMatrixAt(i,new Matrix4()).elements).toEqual(Array.from(entries[i].matrices));
   expect(meshes[i].visible).toBe(false);expect(meshes[i].userData.sourceInstances).toBe(1);
  }
  result.dispose();result.dispose();expect(disposed).not.toHaveBeenCalled();
  expect(instanceVisibility.size).toBe(5);expect(meshes.every(mesh=>mesh.visible)).toBe(true);expect(batch.parent).toBe(null);
 });
 it('não torna visível um modelo oculto por seu grupo',()=>{
  const {scene,meshes}=fixture();meshes[0].parent!.visible=false;
  const result=batchIsolatedModels(scene);expect(result.sourceDraws).toBe(4);expect(meshes[0].visible).toBe(true);expect(meshes[0].parent!.visible).toBe(false);expect(instanceVisibility.size).toBe(1);result.dispose();
 });
});
