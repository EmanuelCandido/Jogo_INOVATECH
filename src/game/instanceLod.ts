import {BufferAttribute,BufferGeometry,type InstancedMesh} from 'three';
import {MeshoptSimplifier} from 'meshoptimizer';

/** Screen-space detail for repeated models (trees, vehicles, people).
 * The camera is orthographic, so every instance shares one scale on screen:
 * zoom × device pixel ratio pixels per world unit. Each level is a subset of
 * the original triangles, reusing the same vertices, normals and colours; it
 * is drawn only when its error stays below 0.9 pixel (the approved limit is 1). Models,
 * placements and quantities never change, and the shadow pass always uses
 * the full model. No asset file is modified. */
const levelErrors=[.004,.008,.016,.032];
export interface LodLevel {geometry:BufferGeometry;error:number;triangles:number}
export interface LodEntry {mesh:InstancedMesh;full:BufferGeometry;levels:LodLevel[];worldScale:number;active:BufferGeometry}
export const lodEntries=new Set<LodEntry>();
const cache=new WeakMap<BufferGeometry,Promise<{levels:LodLevel[];extent:number}>>();
const params=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);
// Diagnostic switch for comparisons: ?lod=0 keeps every model complete.
export const lodEnabled=params.get('lod')!=='0';
// ?lodpx= overrides the threshold for measurements only.
export const maxErrorPixels=Number(params.get('lodpx'))||.9;

function positionsOf(geometry:BufferGeometry){
 const source=geometry.getAttribute('position'),positions=new Float32Array(source.count*3);
 for(let i=0;i<source.count;i++){positions[i*3]=source.getX(i);positions[i*3+1]=source.getY(i);positions[i*3+2]=source.getZ(i);}
 return positions;
}
// Normals and vertex colours guide the simplifier, so it may cross the
// shading seams of cylinders and boxes without visibly changing their colour.
const attributeWeights=[.5,.5,.5,1,1,1];
function attributesOf(geometry:BufferGeometry){
 const normal=geometry.getAttribute('normal'),color=geometry.getAttribute('color'),count=geometry.getAttribute('position').count,values=new Float32Array(count*6);
 for(let i=0;i<count;i++){
  if(normal){values[i*6]=normal.getX(i);values[i*6+1]=normal.getY(i);values[i*6+2]=normal.getZ(i);}
  if(color){values[i*6+3]=color.getX(i);values[i*6+4]=color.getY(i);values[i*6+5]=color.getZ(i);}
 }
 return values;
}
async function buildLevels(geometry:BufferGeometry){
 await MeshoptSimplifier.ready;
 const positions=positionsOf(geometry),attributes=attributesOf(geometry),count=geometry.getAttribute('position').count;
 const indices=geometry.index?Uint32Array.from(geometry.index.array as ArrayLike<number>):Uint32Array.from({length:count},(_,i)=>i);
 const extent=MeshoptSimplifier.getScale(positions,3),levels:LodLevel[]=[];
 let previous=indices.length;
 for(const relative of levelErrors){
  // Absolute error in the model's units. The returned error is the measured
  // deviation (with attributes, a conservative bound on the geometric one).
  const [simplified,error]=MeshoptSimplifier.simplifyWithAttributes(indices,positions,3,attributes,6,attributeWeights,null,0,relative*extent,['ErrorAbsolute','Permissive']);
  // Keep only levels that remove a meaningful share of the triangles.
  if(simplified.length===0||simplified.length>previous*.9)continue;
  previous=simplified.length;
  const lod=new BufferGeometry();
  for(const [name,attribute] of Object.entries(geometry.attributes))lod.setAttribute(name,attribute);
  lod.setIndex(new BufferAttribute(count>65535?simplified:Uint16Array.from(simplified),1));
  lod.boundingBox=geometry.boundingBox;lod.boundingSphere=geometry.boundingSphere;
  levels.push({geometry:lod,error:Math.max(error,1e-6),triangles:simplified.length/3});
 }
 return {levels,extent};
}

/** Register an instanced mesh whose instance matrices already include the
 * model's own node transform. Returns a disposer. */
export function registerInstanceLod(mesh:InstancedMesh,full:BufferGeometry,instanceMatrices:Float32Array){
 if(!lodEnabled||!MeshoptSimplifier.supported)return()=>{};
 let disposed=false,entry:LodEntry|null=null;
 let promise=cache.get(full);if(!promise){promise=buildLevels(full);cache.set(full,promise);}
 promise.then(({levels})=>{
  if(disposed||!levels.length)return;
  // The largest instance decides: its error in world units bounds all others.
  let worldScale=0;const e=instanceMatrices;
  for(let i=0;i<e.length;i+=16)worldScale=Math.max(worldScale,Math.hypot(e[i],e[i+1],e[i+2]),Math.hypot(e[i+4],e[i+5],e[i+6]),Math.hypot(e[i+8],e[i+9],e[i+10]));
  entry={mesh,full,levels,worldScale,active:full};lodEntries.add(entry);
 }).catch(error=>console.warn('Detalhe por distância indisponível',error));
 return()=>{disposed=true;if(entry){lodEntries.delete(entry);entry.mesh.geometry=entry.full;}};
}
/** Coarsest level whose error stays under maxErrorPixels on screen. */
export function chooseLevel(entry:LodEntry,pixelsPerUnit:number){
 let chosen=entry.full;
 for(const level of entry.levels)if(level.error*entry.worldScale*pixelsPerUnit<=maxErrorPixels)chosen=level.geometry;else break;
 return chosen;
}
/** Called before each render. Shadow refreshes draw every model complete. */
export function applyInstanceLod(pixelsPerUnit:number,shadowRefresh:boolean){
 let changed=false;
 for(const entry of lodEntries){
  const target=shadowRefresh?entry.full:chooseLevel(entry,pixelsPerUnit);
  if(entry.active!==target){entry.active=target;entry.mesh.geometry=target;changed=true;}
 }
 return changed;
}
