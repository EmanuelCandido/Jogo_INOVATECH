import {afterEach,describe,expect,it,vi} from 'vitest';
import {BoxGeometry,Mesh,MeshStandardMaterial,OrthographicCamera,Scene,type WebGLRenderer} from 'three';
import {profileMaterials} from '../src/game/materialProfile';

afterEach(()=>vi.unstubAllGlobals());
function fixture(disjoint=false){
 const deleted=vi.fn(),begin=vi.fn(),end=vi.fn();
 const gl={getContext:()=>({
  QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,getExtension:()=>({GPU_DISJOINT_EXT:3,TIME_ELAPSED_EXT:4}),
  getParameter:()=>disjoint,isContextLost:()=>false,createQuery:()=>({}),beginQuery:begin,endQuery:end,deleteQuery:deleted,
  getQueryParameter:(_query:unknown,key:number)=>key===1?true:1000000,
 }),renderBufferDirect:vi.fn()} as unknown as WebGLRenderer;
 const scene=new Scene(),camera=new OrthographicCamera(),geometry=new BoxGeometry();
 const depth=new MeshStandardMaterial(),color=new MeshStandardMaterial();depth.name='depth';color.name='color';
 const mesh=new Mesh(geometry,color);
 const native=vi.fn((material:MeshStandardMaterial)=>gl.renderBufferDirect(camera,scene,geometry,material,mesh,null));
 gl.render=native as unknown as WebGLRenderer['render'];
 const frame={render:()=>{native(depth);native(color);}};
 vi.stubGlobal('requestAnimationFrame',(callback:()=>void)=>{queueMicrotask(callback);return 1;});
 return {gl,frame,deleted,begin,end,native};
}
describe('perfil do quadro completo',()=>{
 it('conta três quadros externos, incluindo profundidade e cor em cada um',async()=>{
  const {gl,frame,begin,end,native,deleted}=fixture(),original=frame.render,direct=gl.renderBufferDirect;
  const profile=await profileMaterials(gl,()=>frame.render(),3,frame);
  expect(profile.frames).toBe(3);expect(profile.valid).toBe(true);
  expect(profile.groups).toHaveLength(2);
  for(const group of profile.groups){expect(group.draws).toBe(3);expect(group.samples).toBe(3);expect(group.gpuMsPerFrame).toBe(1);}
  expect(native).toHaveBeenCalledTimes(6);expect(begin).toHaveBeenCalledTimes(6);expect(end).toHaveBeenCalledTimes(6);
  expect(deleted).toHaveBeenCalledTimes(6);expect(frame.render).toBe(original);expect(gl.renderBufferDirect).toBe(direct);expect(gl.render).toBe(native);
 });
 it('descarta resultados disjoint e restaura os métodos',async()=>{
  const {gl,frame,deleted}=fixture(true),original=frame.render;
  const profile=await profileMaterials(gl,()=>frame.render(),1,frame);
  expect(profile.valid).toBe(false);expect(profile.groups.every(group=>group.gpuMsPerFrame===null)).toBe(true);
  expect(deleted).toHaveBeenCalledTimes(2);expect(frame.render).toBe(original);
 });
});
