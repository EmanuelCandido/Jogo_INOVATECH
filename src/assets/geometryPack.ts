import {BufferAttribute,BufferGeometry} from 'three';

/** Binary container for precomputed BufferGeometries.
 * Layout: u32 header length, JSON header, then 4-byte aligned chunks.
 * Chunks may use meshoptimizer's lossless vertex/index codecs (the same
 * decoder the compressed GLBs already need). Every attribute keeps its
 * original typed array type, item size and exact values; triangles keep their
 * order and winding (the index codec may rotate the vertices of a triangle).
 */
type ArrayKind='f32'|'u16'|'u32';
type Codec='vertex'|'index';
interface Chunk {kind:ArrayKind;offset:number;length:number;bytes:number;codec?:Codec}
interface PackedAttribute extends Chunk {itemSize:number;normalized:boolean}
interface PackedGeometry {attributes:Record<string,PackedAttribute>;index?:Chunk;groups:{start:number;count:number;materialIndex?:number}[]}
interface Header {version:2;geometries:Record<string,PackedGeometry>}
export interface GeometryEncoder {
 encodeVertexBuffer(source:Uint8Array,count:number,size:number):Uint8Array;
 encodeIndexBuffer(source:Uint8Array,count:number,size:number):Uint8Array;
}
export interface GeometryDecoder {
 decodeVertexBuffer(target:Uint8Array,count:number,size:number,source:Uint8Array):void;
 decodeIndexBuffer(target:Uint8Array,count:number,size:number,source:Uint8Array):void;
}
const constructors={f32:Float32Array,u16:Uint16Array,u32:Uint32Array};
function kindOf(array:ArrayLike<number>):ArrayKind{
 if(array instanceof Float32Array)return 'f32';
 if(array instanceof Uint16Array)return 'u16';
 if(array instanceof Uint32Array)return 'u32';
 throw new Error('Tipo de atributo não suportado');
}
const bytesOf=(a:ArrayBufferView)=>new Uint8Array(a.buffer,a.byteOffset,a.byteLength);
/** `omit` lists attributes the reader rebuilds itself, per geometry. */
export function packGeometries(geometries:Record<string,BufferGeometry>,encoder?:GeometryEncoder,omit:Record<string,string[]>={}){
 const chunks:Uint8Array[]=[],header:Header={version:2,geometries:{}};
 let offset=0;
 const add=(array:Float32Array|Uint16Array|Uint32Array,itemSize:number,codec?:Codec):Chunk=>{
  let data=bytesOf(array),used:Codec|undefined;
  const size=itemSize*array.BYTES_PER_ELEMENT;
  if(encoder&&codec==='index'&&array.length%3===0)data=encoder.encodeIndexBuffer(data,array.length,array.BYTES_PER_ELEMENT),used='index';
  else if(encoder&&codec==='vertex'&&size%4===0&&size<=256)data=encoder.encodeVertexBuffer(data,array.length/itemSize,size),used='vertex';
  const chunk:Chunk={kind:kindOf(array),offset,length:array.length,bytes:data.byteLength,...(used?{codec:used}:{})};
  chunks.push(data);offset+=Math.ceil(data.byteLength/4)*4;return chunk;
 };
 for(const [name,geometry] of Object.entries(geometries)){
  const entry:PackedGeometry={attributes:{},groups:geometry.groups.map(g=>({...g}))};
  for(const [key,attribute] of Object.entries(geometry.attributes)){
   if(omit[name]?.includes(key))continue;
   const a=attribute as BufferAttribute;
   entry.attributes[key]={...add(a.array as Float32Array,a.itemSize,'vertex'),itemSize:a.itemSize,normalized:a.normalized};
  }
  if(geometry.index)entry.index=add(geometry.index.array as Uint16Array|Uint32Array,1,'index');
  header.geometries[name]=entry;
 }
 const json=new TextEncoder().encode(JSON.stringify(header)),start=Math.ceil((4+json.length)/4)*4;
 const out=new Uint8Array(start+offset);
 new DataView(out.buffer).setUint32(0,json.length,true);out.set(json,4);
 let position=start;
 for(const chunk of chunks){out.set(chunk,position);position+=Math.ceil(chunk.byteLength/4)*4;}
 return out;
}
/** Always returns fresh arrays, so callers may mutate attributes. */
export function unpackGeometries(buffer:ArrayBuffer,decoder?:GeometryDecoder){
 const length=new DataView(buffer).getUint32(0,true);
 const header=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,4,length))) as Header;
 if(header.version!==2)throw new Error('Versão de geometria desconhecida');
 const start=Math.ceil((4+length)/4)*4;
 const read=(c:Chunk,itemSize:number)=>{
  const Type=constructors[c.kind],source=new Uint8Array(buffer,start+c.offset,c.bytes);
  if(!c.codec)return new Type(buffer.slice(start+c.offset,start+c.offset+c.bytes));
  if(!decoder)throw new Error('Decodificador de geometria ausente');
  const target=new Type(c.length),bytes=bytesOf(target);
  if(c.codec==='index')decoder.decodeIndexBuffer(bytes,c.length,Type.BYTES_PER_ELEMENT,source);
  else decoder.decodeVertexBuffer(bytes,c.length/itemSize,itemSize*Type.BYTES_PER_ELEMENT,source);
  return target;
 };
 const result:Record<string,BufferGeometry>={};
 for(const [name,entry] of Object.entries(header.geometries)){
  const geometry=new BufferGeometry();
  for(const [key,a] of Object.entries(entry.attributes))geometry.setAttribute(key,new BufferAttribute(read(a,a.itemSize),a.itemSize,a.normalized));
  if(entry.index)geometry.setIndex(new BufferAttribute(read(entry.index,1),1));
  for(const g of entry.groups)geometry.addGroup(g.start,g.count,g.materialIndex);
  result[name]=geometry;
 }
 return result;
}
