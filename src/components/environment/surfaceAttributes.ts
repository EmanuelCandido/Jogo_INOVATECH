import {Float32BufferAttribute,type BufferGeometry} from 'three';
import {landColor} from './referenceGeometry';
import {worldPoint} from '../../config/referenceMap';

/** Attributes the browser rebuilds quickly instead of downloading them:
 * flat-surface normals (the same computeVertexNormals call that created them)
 * and the terrain tint (the same formula, from each vertex's map point and
 * height). scripts/generate-city-surfaces.mjs checks both against the
 * originals before leaving them out of the file. */
export const derivableAttributes=(name:string)=>name==='land'?['color','position']:['normal'];
/** Terrain vertices are map points lifted to a height: keep only the height. */
export function heightsOf(geometry:BufferGeometry){
 const position=geometry.getAttribute('position'),heights=new Float32Array(position.count);
 for(let i=0;i<position.count;i++)heights[i]=position.getY(i);
 return heights;
}
export function restoreSurfaceAttributes(name:string,geometry:BufferGeometry){
 const heights=geometry.getAttribute('height');
 if(heights&&!geometry.getAttribute('position')){
  const uv=geometry.getAttribute('uv'),positions=new Float32Array(uv.count*3);
  for(let i=0;i<uv.count;i++)positions.set(worldPoint(uv.getX(i),uv.getY(i),heights.getX(i)),i*3);
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.deleteAttribute('height');
 }
 if(!geometry.getAttribute('normal'))geometry.computeVertexNormals();
 if(name==='land'&&!geometry.getAttribute('color')){
  const uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position'),colors=new Float32Array(uv.count*3);
  for(let i=0;i<uv.count;i++)colors.set(landColor(uv.getX(i),uv.getY(i),position.getY(i)),i*3);
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
 }
 return geometry;
}
