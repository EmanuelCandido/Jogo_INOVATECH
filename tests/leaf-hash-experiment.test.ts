import {describe,expect,it,vi} from 'vitest';
import {BoxGeometry,Mesh,MeshStandardMaterial,RedFormat,RGBAFormat,FloatType,Scene,ShaderLib,WebGLRenderTarget,type WebGLRenderer} from 'three';
import {finishFoliage} from '../src/assets/foliageMaterial';
import {cacheLeafHashes} from '../src/game/leafHashExperiment';

function fixture(){
 const scene=new Scene(),material=new MeshStandardMaterial();material.name='eco.leaf';
 scene.add(new Mesh(new BoxGeometry(),material),new Mesh(new BoxGeometry(),material));finishFoliage(scene);
 const previous=new WebGLRenderTarget(2,2),setRenderTarget=vi.fn(),render=vi.fn();
 const gl={extensions:{has:()=>true},getRenderTarget:()=>previous,setRenderTarget,render,autoClear:false,xr:{enabled:true},shadowMap:{needsUpdate:true},getContext:()=>({FRAMEBUFFER:1,FRAMEBUFFER_COMPLETE:2,checkFramebufferStatus:()=>2})} as unknown as WebGLRenderer;
 return {scene,material,gl,previous,setRenderTarget,render};
}
describe('cache numérico experimental das folhas',()=>{
 it('atualiza o sampler de um programa reutilizado quando a textura é recriada',()=>{
  const {scene,material,gl,setRenderTarget,previous}=fixture(),first=cacheLeafHashes(gl,scene);
  const shader={...ShaderLib.standard,uniforms:{}} as Parameters<MeshStandardMaterial['onBeforeCompile']>[0];
  material.onBeforeCompile(shader,gl);const uniform=shader.uniforms.leafHashCache;
  first.dispose();expect(uniform.value).toBe(null);
  const second=cacheLeafHashes(gl,scene),target=setRenderTarget.mock.calls[2][0] as WebGLRenderTarget;
  // Reusing a compiled program does not invoke onBeforeCompile again.
  expect(uniform.value).toBe(target.texture);second.dispose();expect(uniform.value).toBe(null);previous.dispose();
 });
 it.each([false,true])('instala uma vez por material e restaura os callbacks, o alvo e os estados (células=%s)',cells=>{
  const {scene,material,gl,previous,setRenderTarget}=fixture(),compile=material.onBeforeCompile,key=material.customProgramCacheKey;
  const cache=cacheLeafHashes(gl,scene,cells),target=setRenderTarget.mock.calls[0][0] as WebGLRenderTarget,dispose=vi.spyOn(target,'dispose');
  expect(cache.materials).toBe(1);expect(cache.bytes).toBe(cells?262144:65536);expect(target.texture.format).toBe(cells?RGBAFormat:RedFormat);expect(target.texture.type).toBe(FloatType);
  expect(setRenderTarget).toHaveBeenLastCalledWith(previous);expect([gl.autoClear,gl.xr.enabled,gl.shadowMap.needsUpdate]).toEqual([false,true,true]);
  const shader={...ShaderLib.standard,uniforms:{}} as Parameters<MeshStandardMaterial['onBeforeCompile']>[0];
  material.onBeforeCompile(shader,gl);expect(shader.uniforms.leafHashCache.value).toBe(target.texture);
  cache.dispose();cache.dispose();expect(dispose).toHaveBeenCalledTimes(1);expect(material.onBeforeCompile).toBe(compile);expect(material.customProgramCacheKey).toBe(key);previous.dispose();
 });
 it('recupera o renderer e mantém o material intacto se a preparação falhar',()=>{
  const {scene,material,gl,previous,setRenderTarget,render}=fixture(),compile=material.onBeforeCompile,key=material.customProgramCacheKey;
  render.mockImplementation(()=>{throw new Error('preparation failed');});
  expect(()=>cacheLeafHashes(gl,scene)).toThrow('preparation failed');
  expect(setRenderTarget).toHaveBeenLastCalledWith(previous);expect([gl.autoClear,gl.xr.enabled,gl.shadowMap.needsUpdate]).toEqual([false,true,true]);
  expect(material.onBeforeCompile).toBe(compile);expect(material.customProgramCacheKey).toBe(key);previous.dispose();
 });
});
