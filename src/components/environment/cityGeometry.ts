import {suspend} from 'suspend-react';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {publicAsset} from '../../assets/publicAsset';
import {unpackGeometries} from '../../assets/geometryPack';
import type {CitySurfaces} from './citySurfaces';
import {restoreSurfaceAttributes} from './surfaceAttributes';

/** Built by scripts/generate-city-surfaces.mjs from createSurfaces(). */
export const citySurfacesPath='assets/generated/city-surfaces.bin.gz';
async function download(){
 try{
  const response=await fetch(publicAsset(citySurfacesPath));
  if(!response.ok)return null;
  const bytes=await response.arrayBuffer(),head=new Uint8Array(bytes,0,2);
  // Some servers already remove the gzip layer through Content-Encoding.
  if(head[0]!==0x1f||head[1]!==0x8b)return bytes;
  if(typeof DecompressionStream==='undefined')return null;
  return await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 }catch{return null;}
}
// Start the download with the module, alongside the models, not at first render.
let request:Promise<ArrayBuffer|(()=>CitySurfaces)>|null=null;
export function prefetchCitySurfaces(){
 // The fallback module (and the map computations it evaluates) is only
 // loaded when the prepared file cannot be used.
 request??=Promise.all([download(),MeshoptDecoder.ready]).then(async([bytes])=>bytes??(await import('./citySurfaces')).createSurfaces);
 return request;
}
if(typeof window!=='undefined')prefetchCitySurfaces();
/** Precomputed ground surfaces. Building them in the browser took seconds of
 * uninterrupted main-thread work on phones, freezing the loading animation.
 * Falls back to computing them when the prepared file is unavailable. */
export function useCitySurfaces():()=>CitySurfaces{
 const source=suspend(prefetchCitySurfaces,['city-surfaces']);
 if(typeof source==='function')return source;
 return ()=>{
  const surfaces=unpackGeometries(source,MeshoptDecoder);
  for(const [name,geometry] of Object.entries(surfaces))restoreSurfaceAttributes(name,geometry);
  return surfaces as unknown as CitySurfaces;
 };
}
