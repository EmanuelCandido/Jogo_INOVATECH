import {describe,it,expect} from 'vitest';
import {BoxGeometry,BufferGeometry,Float32BufferAttribute,PlaneGeometry} from 'three';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import {packGeometries,unpackGeometries} from '../src/assets/geometryPack';
import {chooseLevel,maxErrorPixels,type LodEntry} from '../src/game/instanceLod';

const encoder={encodeVertexBuffer:(s:Uint8Array,c:number,z:number)=>MeshoptEncoder.encodeVertexBufferLevel(s,c,z,2,0),encodeIndexBuffer:(s:Uint8Array,c:number,z:number)=>MeshoptEncoder.encodeIndexBuffer(s,c,z)};
const buffer=(bytes:Uint8Array)=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;

describe('superfícies pré-calculadas',()=>{
 it('recupera atributos e triângulos exatamente, com e sem compressão',async()=>{
  await MeshoptEncoder.ready;await MeshoptDecoder.ready;
  const plane=new PlaneGeometry(7,3,40,12),box=new BoxGeometry(1,2,3).toNonIndexed(),colored=new PlaneGeometry(2,2,3,3);
  colored.setAttribute('color',new Float32BufferAttribute(Array.from({length:colored.getAttribute('position').count*3},(_,i)=>Math.sin(i)*.5+.5),3));
  const source={plane,box,colored};
  for(const [bytes,decoder] of [[packGeometries(source),undefined],[packGeometries(source,encoder),MeshoptDecoder]] as const){
   const result=unpackGeometries(buffer(bytes),decoder);
   for(const [name,g] of Object.entries(source) as [string,BufferGeometry][]){
    for(const key of Object.keys(g.attributes))expect(Array.from(result[name].getAttribute(key).array),`${name}.${key}`).toEqual(Array.from(g.getAttribute(key).array));
    const a=g.index?Array.from(g.index.array):null,b=result[name].index?Array.from(result[name].index!.array):null;
    expect(b?.length,name).toBe(a?.length);
    // The index codec may rotate a triangle's vertices, never change it.
    if(a&&b)for(let i=0;i<a.length;i+=3)expect([0,1,2].some(r=>a[i]===b[i+r]&&a[i+1]===b[i+(r+1)%3]&&a[i+2]===b[i+(r+2)%3])).toBe(true);
   }
  }
 });
 it('omite atributos que o navegador reconstrói',()=>{
  const plane=new PlaneGeometry(1,1,2,2),result=unpackGeometries(buffer(packGeometries({plane},undefined,{plane:['normal']})));
  expect(result.plane.getAttribute('normal')).toBeUndefined();
  expect(result.plane.getAttribute('position').count).toBe(9);
 });
});

describe('detalhe por tamanho na tela',()=>{
 const full=new BufferGeometry(),fine=new BufferGeometry(),coarse=new BufferGeometry();
 const entry={full,worldScale:2,levels:[{geometry:fine,error:.01,triangles:50},{geometry:coarse,error:.05,triangles:10}]} as unknown as LodEntry;
 it('usa o modelo completo quando o erro passaria do limite em pixels',()=>{
  expect(chooseLevel(entry,maxErrorPixels/(.01*2)*1.01)).toBe(full);
 });
 it('escolhe o nível mais simples cujo erro fica abaixo do limite',()=>{
  expect(chooseLevel(entry,maxErrorPixels/(.01*2))).toBe(fine);
  expect(chooseLevel(entry,maxErrorPixels/(.05*2))).toBe(coarse);
 });
});
