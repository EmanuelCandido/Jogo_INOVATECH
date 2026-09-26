// Precompute the static city ground (roads, sidewalks, terrain, water) that
// the browser used to build on the main thread during loading. On phones it
// took long enough to freeze the loading animation. esbuild bundles the same
// TypeScript sources so Node runs them at native speed.
import {build} from 'esbuild';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {gzipSync,gunzipSync as gunzip} from 'node:zlib';
import {resolve} from 'node:path';
const entry=resolve('.tools/city-surfaces-entry.ts'),bundle=resolve('.tools/city-surfaces.mjs'),out='public/assets/generated/city-surfaces.bin.gz';
await mkdir('.tools',{recursive:true});
await writeFile(entry,`export {createSurfaces} from '../src/components/environment/citySurfaces';\nexport {packGeometries,unpackGeometries} from '../src/assets/geometryPack';\nexport {BufferGeometry,BufferAttribute} from 'three';\nexport {derivableAttributes,restoreSurfaceAttributes,heightsOf} from '../src/components/environment/surfaceAttributes';\n`);
try{
 await build({entryPoints:[entry],bundle:true,format:'esm',platform:'node',outfile:bundle,logLevel:'error'});
 const {BufferGeometry,BufferAttribute,createSurfaces,packGeometries,unpackGeometries,derivableAttributes,restoreSurfaceAttributes,heightsOf}=await import(pathToFileURL(bundle).href);
 await MeshoptEncoder.ready;await MeshoptDecoder.ready;
 // Version 0 of the vertex codec, the one glTF's meshopt extension uses.
 const encoder={encodeVertexBuffer:(s,c,z)=>MeshoptEncoder.encodeVertexBufferLevel(s,c,z,2,0),encodeIndexBuffer:(s,c,z)=>MeshoptEncoder.encodeIndexBuffer(s,c,z)};
 const surfaces=createSurfaces(),omit={};
 // Leave out attributes the browser rebuilds identically (colours within 1e-5).
 for(const [name,g] of Object.entries(surfaces))for(const key of derivableAttributes(name)){
  const original=g.getAttribute(key);if(!original)continue;
  const probe=g.clone();probe.deleteAttribute(key);if(key==='position')probe.setAttribute('height',new BufferAttribute(heightsOf(g),1));restoreSurfaceAttributes(name,probe);
  const rebuilt=probe.getAttribute(key).array,a=original.array;let worst=0;
  for(let i=0;i<a.length;i++)worst=Math.max(worst,Math.abs(a[i]-rebuilt[i]));
  if(key==='normal'?worst===0:worst<1e-4)(omit[name]??=[]).push(key);
  else console.log(`${name}.${key} kept: rebuilt differs by ${worst}`);
 }
 // Terrain positions travel as heights; the reader lifts its map points.
 const shipped=Object.fromEntries(Object.entries(surfaces).map(([name,g])=>{
  if(!omit[name]?.includes('position'))return [name,g];
  const copy=new BufferGeometry();for(const [k,a] of Object.entries(g.attributes))copy.setAttribute(k,a);copy.setIndex(g.index);copy.setAttribute('height',new BufferAttribute(heightsOf(g),1));return [name,copy];
 }));
 const packed=Buffer.from(packGeometries(shipped,encoder,omit));
 // Prove the file is lossless before shipping it.
 const decoded=unpackGeometries(packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength),MeshoptDecoder);
 for(const [name,g] of Object.entries(surfaces)){
  const d=decoded[name];
  restoreSurfaceAttributes(name,d);
  for(const [key,a] of Object.entries(g.attributes))if(omit[name]?.includes(key)){let w=0;for(let i=0;i<a.array.length;i++)w=Math.max(w,Math.abs(a.array[i]-d.attributes[key].array[i]));if(w>=1e-4)throw new Error(`${name}.${key} diverge ${w}`);}else if(!Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength).equals(Buffer.from(d.attributes[key].array.buffer)))throw new Error(`${name}.${key} diverge`);
  if(g.index){const a=g.index.array,b=d.index.array;if(a.length!==b.length)throw new Error(`${name}.index diverge`);
   for(let i=0;i<a.length;i+=3){const ok=[0,1,2].some(r=>a[i]===b[i+r]&&a[i+1]===b[i+(r+1)%3]&&a[i+2]===b[i+(r+2)%3]);if(!ok)throw new Error(`${name}.index triângulo ${i/3} diverge`);}}
 }
 await mkdir('public/assets/generated',{recursive:true});
 // Static hosts do not compress unknown binary types; the browser inflates it.
 const compressed=gzipSync(packed,{level:9}),previous=await readFile(out).catch(()=>null);
 if(!previous||!gunzip(previous).equals(packed))await writeFile(out,compressed);
 console.log(`City surfaces prepared: ${(compressed.length/1e6).toFixed(2)} MB compressed, ${(packed.length/1e6).toFixed(2)} MB decoded.`);
}finally{await rm(entry,{force:true});await rm(bundle,{force:true});}
