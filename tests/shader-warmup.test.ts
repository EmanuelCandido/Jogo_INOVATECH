import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {BoxGeometry,Camera,Group,InstancedMesh,Mesh,MeshStandardMaterial,Scene,type WebGLRenderer} from 'three';
import {shaderCompilationPending,startShaderWarmup,warmupRoots,wholeShaderWarmup} from '../src/game/shaderWarmup';

let idle:IdleRequestCallback[];
beforeEach(()=>{vi.useFakeTimers();idle=[];vi.stubGlobal('window',{setTimeout,clearTimeout,requestIdleCallback:(cb:IdleRequestCallback)=>{idle.push(cb);return idle.length;},cancelIdleCallback:()=>{}});});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
async function tick(ms:number){await vi.advanceTimersByTimeAsync(ms);const callbacks=idle.splice(0);for(const cb of callbacks)cb({didTimeout:false,timeRemaining:()=>10});await Promise.resolve();await Promise.resolve();await Promise.resolve();}
describe('preparação incremental dos shaders',()=>{
 it('o controle da cena inteira cancela a fila e aguarda sua unidade em voo',async()=>{
  const scene=new Scene(),mesh=new Mesh(),camera=new Camera();scene.add(mesh);let resolve!:(object:Mesh)=>void;
  const first=new Promise<Mesh>(done=>{resolve=done;}),compileAsync=vi.fn().mockReturnValueOnce(first).mockResolvedValue(scene);
  const gl={domElement:{},compileAsync} as unknown as WebGLRenderer,invalidate=vi.fn();
  const job=startShaderWarmup(gl,scene,camera,()=>true,invalidate);await tick(600);
  const whole=wholeShaderWarmup(gl,scene,camera);expect(job.stats.cancelled).toBe(true);expect(compileAsync).toHaveBeenCalledOnce();expect(shaderCompilationPending(gl)).toBe(true);
  resolve(mesh);await whole;expect(shaderCompilationPending(gl)).toBe(false);expect(compileAsync).toHaveBeenLastCalledWith(scene,camera);expect(invalidate).not.toHaveBeenCalled();
 });
 it('cobre uma vez cada renderizável sem alterar pais, instâncias ou materiais',()=>{
  const scene=new Scene(),group=new Group(),a=new InstancedMesh(new BoxGeometry(),new MeshStandardMaterial(),3),b=new Mesh(a.geometry,a.material),nested=new Mesh(a.geometry,a.material);
  scene.add(group);group.add(a,b);a.add(nested);b.visible=false;
  expect(warmupRoots(scene)).toEqual([a,b]);expect(a.parent).toBe(group);expect(nested.parent).toBe(a);expect(a.count).toBe(3);
  a.geometry.dispose();a.material.dispose();
 });
 it('usa os objetos originais com a cena de iluminação e ignora os removidos',async()=>{
  const scene=new Scene(),a=new Mesh(),b=new Mesh(),camera=new Camera();scene.add(a,b);
  const compileAsync=vi.fn(async()=>a),gl={domElement:{},compileAsync} as unknown as WebGLRenderer,invalidate=vi.fn();
  const job=startShaderWarmup(gl,scene,camera,()=>true,invalidate);await tick(600);
  expect(compileAsync).toHaveBeenCalledExactlyOnceWith(a,camera,scene);scene.remove(b);await tick(80);
  expect(compileAsync).toHaveBeenCalledOnce();expect(invalidate).toHaveBeenCalledOnce();expect(job.stats.pending).toBe(false);
 });
 it('a substituição aguarda compilação em voo antes de iniciar outra',async()=>{
  const scene=new Scene(),a=new Mesh(),camera=new Camera();scene.add(a);let resolve!:(object:Mesh)=>void;
  const compileAsync=vi.fn(()=>new Promise<Mesh>(done=>{resolve=done;})),gl={domElement:{},compileAsync} as unknown as WebGLRenderer;
  const oldInvalidate=vi.fn();startShaderWarmup(gl,scene,camera,()=>true,oldInvalidate);await tick(600);
  const next=startShaderWarmup(gl,scene,camera,()=>true,vi.fn());await tick(600);expect(compileAsync).toHaveBeenCalledOnce();
  resolve(a);await tick(80);expect(oldInvalidate).not.toHaveBeenCalled();expect(compileAsync).toHaveBeenCalledTimes(2);
  next.cancel();resolve(a);await tick(1000);
 });
});
