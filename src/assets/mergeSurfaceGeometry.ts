import {BufferAttribute,BufferGeometry} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Takes ownership of its inputs, preserving every attribute and triangle.
 * Keep shared vertices in indexed terrain/ribbons instead of expanding them.
 * Unindexed surfaces receive identity indices; no tolerance-based welding is
 * used, so UV seams, hard normals and close but distinct vertices stay intact. */
export function mergeSurfaceGeometry(items:BufferGeometry[]){
 if(!items.length)return new BufferGeometry();
 for(const geometry of items)if(!geometry.index){
  const count=geometry.getAttribute('position').count;
  const indices=count>65535?new Uint32Array(count):new Uint16Array(count);
  for(let i=0;i<count;i++)indices[i]=i;
  geometry.setIndex(new BufferAttribute(indices,1));
 }
 const merged=mergeGeometries(items,false);
 if(!merged)throw new Error('Superfícies com atributos incompatíveis');
 for(const geometry of new Set(items))geometry.dispose();
 return merged;
}
