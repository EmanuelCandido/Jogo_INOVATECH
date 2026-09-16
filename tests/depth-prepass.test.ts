import {describe,it,expect,vi} from 'vitest';
import {BackSide,BoxGeometry,Color,DoubleSide,FrontSide,Mesh,MeshStandardMaterial,OrthographicCamera,Scene,type WebGLRenderer} from 'three';
import {createDepthPrepass,depthFrameRenderer} from '../src/game/depthPrepass';
import type {RenderItem} from 'three/src/renderers/webgl/WebGLRenderLists.js';

function fixture(){
 const direct=vi.fn(),scene=new Scene(),camera=new OrthographicCamera();
 scene.background=new Color('#dcebee');
 const mesh=new Mesh(new BoxGeometry(),new MeshStandardMaterial());scene.add(mesh);
 const gl={renderBufferDirect:direct,shadowMap:{enabled:true,needsUpdate:false,autoUpdate:false},autoClear:true,info:{autoReset:true},xr:{isPresenting:false}} as unknown as WebGLRenderer;
 return {gl,direct,scene,camera,mesh,experiment:createDepthPrepass(gl)};
}
describe('passagem de profundidade',()=>{
 it.each([FrontSide,BackSide,DoubleSide])('preserva todas as faces na cor ao limitar apenas a profundidade (%s)',side=>{
  const {gl,direct,scene,camera,mesh,experiment}=fixture();mesh.material.side=side;
  const render=()=>gl.renderBufferDirect(camera,scene,mesh.geometry,mesh.material,mesh,null);
  experiment.render(render,scene,camera,false,true);
  const depth=direct.mock.calls[0][3];expect(depth.side).toBe(side===DoubleSide?FrontSide:side);
  expect(direct.mock.calls[1][3]).toBe(mesh.material);expect(mesh.material.side).toBe(side);
  const version=depth.version;experiment.render(render,scene,camera,false,true);expect(depth.version).toBe(version);
  experiment.render(render,scene,camera);expect(depth.side).toBe(side);expect(mesh.material.side).toBe(side);
  expect(direct.mock.calls.every(call=>call[2]===mesh.geometry)).toBe(true);experiment.dispose();
 });
 it('ordena somente a profundidade e preserva os comparadores de cor e transparência',()=>{
  const {gl,scene,camera,experiment}=fixture();
  const items=[{id:1,z:.8,groupOrder:0,renderOrder:0},{id:2,z:.2,groupOrder:0,renderOrder:0},{id:3,z:.1,groupOrder:0,renderOrder:1}];
  const color=(a:Pick<RenderItem,'id'>,b:Pick<RenderItem,'id'>)=>b.id-a.id,transparent=vi.fn(),orders:number[][]=[];
  const sort=vi.fn((opaque:typeof color,alpha:typeof transparent)=>{orders.push([...items].sort(opaque).map(item=>item.id));expect(alpha).toBe(transparent);});
  const list={sort};gl.sortObjects=true;gl.renderLists={get:()=>list} as unknown as WebGLRenderer['renderLists'];
  experiment.render(()=>list.sort(color,transparent),scene,camera,true);
  expect(orders).toEqual([[2,1,3],[3,2,1]]);expect(list.sort).toBe(sort);
  experiment.render(()=>list.sort(color,transparent),scene,camera);
  expect(orders.slice(2)).toEqual([[3,2,1],[3,2,1]]);experiment.dispose();
 });
 it('restaura a ordenação quando a passagem de profundidade falha',()=>{
  const {gl,scene,camera,experiment}=fixture(),sort=vi.fn(),list={sort};
  gl.sortObjects=true;gl.renderLists={get:()=>list} as unknown as WebGLRenderer['renderLists'];
  expect(()=>experiment.render(()=>{throw new Error('depth failed');},scene,camera,true)).toThrow('depth failed');
  expect(list.sort).toBe(sort);experiment.dispose();
 });
 it('mantém uma única entrada de quadro e não empilha wrappers no renderer',()=>{
  const {gl,scene,camera}=fixture(),native=vi.fn();gl.render=native;
  const frame=depthFrameRenderer(gl);
  expect(depthFrameRenderer(gl)).toBe(frame);
  frame.render(scene,camera);expect(native).toHaveBeenCalledTimes(1);
  frame.enabled=true;frame.render(scene,camera);expect(native).toHaveBeenCalledTimes(3);
  frame.dispose();frame.render(scene,camera);expect(native).toHaveBeenCalledTimes(5);
  expect(gl.render).toBe(native);frame.dispose();
 });
 it('libera o material de profundidade junto com o material de origem',()=>{
  const {gl,direct,scene,camera,mesh,experiment}=fixture();
  const render=()=>gl.renderBufferDirect(camera,scene,mesh.geometry,mesh.material,mesh,null);
  experiment.render(render,scene,camera);
  const depth=direct.mock.calls[0][3],disposed=vi.fn();depth.addEventListener('dispose',disposed);
  mesh.material.dispose();expect(disposed).toHaveBeenCalledTimes(1);
  experiment.dispose();expect(disposed).toHaveBeenCalledTimes(1);
 });
 it('mantém material original na cor, preserva geometria e restaura o renderer',()=>{
  const {gl,direct,scene,camera,mesh,experiment}=fixture(),background=scene.background;
  const states:unknown[]=[];
  const render=vi.fn(()=>{
   states.push([gl.autoClear,gl.info.autoReset,scene.background]);
   gl.renderBufferDirect(camera,scene,mesh.geometry,mesh.material,mesh,null);
  });
  experiment.render(render,scene,camera);
  expect(states).toEqual([[true,true,background],[false,false,null]]);
  expect(direct.mock.calls).toHaveLength(2);
  expect(direct.mock.calls[0][2]).toBe(mesh.geometry);
  expect(direct.mock.calls[0][3].colorWrite).toBe(false);
  expect(direct.mock.calls[1][3]).toBe(mesh.material);
  expect(mesh.material.colorWrite).toBe(true);
  expect(gl.renderBufferDirect).toBe(direct);expect(scene.background).toBe(background);
  expect(gl.autoClear).toBe(true);expect(gl.info.autoReset).toBe(true);
  experiment.dispose();
 });
 it('restaura os estados mesmo se a passagem de cor lançar uma exceção',()=>{
  const {gl,direct,scene,camera,experiment}=fixture(),background=scene.background;
  let calls=0;
  expect(()=>experiment.render(()=>{if(++calls===2)throw new Error('render failed');},scene,camera)).toThrow('render failed');
  expect(gl.renderBufferDirect).toBe(direct);expect(scene.background).toBe(background);
  expect(gl.autoClear).toBe(true);expect(gl.info.autoReset).toBe(true);
  experiment.dispose();
 });
 it('deixa o quadro de atualização das sombras no caminho normal',()=>{
  const {gl,scene,camera,experiment}=fixture(),render=vi.fn();
 gl.shadowMap.needsUpdate=true;experiment.render(render,scene,camera);
  expect(render).toHaveBeenCalledExactlyOnceWith(scene,camera);
  gl.shadowMap.needsUpdate=false;experiment.render(render,scene,camera);
  expect(render).toHaveBeenCalledTimes(2);
  experiment.render(render,scene,camera);expect(render).toHaveBeenCalledTimes(4);experiment.dispose();
 });
 it.each([{transparent:true},{alphaTest:.5},{depthWrite:false},{alphaHash:true}])('não preenche profundidade de material incompatível %j',patch=>{
  const {gl,direct,scene,camera,mesh,experiment}=fixture();Object.assign(mesh.material,patch);
  experiment.render(()=>gl.renderBufferDirect(camera,scene,mesh.geometry,mesh.material,mesh,null),scene,camera);
  expect(direct).toHaveBeenCalledExactlyOnceWith(camera,scene,mesh.geometry,mesh.material,mesh,null);
  experiment.dispose();
 });
});
