import {Material,Mesh,MeshStandardMaterial,type Object3D} from 'three';

const registry=new Map<string,MeshStandardMaterial>(),prepared=new WeakSet<Object3D>();
/** Only immutable GLB materials, after finish shaders have been installed.
 * Loader-owned resources stay alive: never dispose another model's material.
 */
export function sharedModelMaterial(material:Material):Material{
 if(!(material instanceof MeshStandardMaterial))return material;
 const {uuid:_uuid,name:_name,metadata:_metadata,userData:_data,...properties}=material.toJSON();
 const key=JSON.stringify([properties,material.customProgramCacheKey(),material.onBeforeCompile.toString(),
  material.forceSinglePass,material.shadowSide,material.precision,material.clippingPlanes,material.clipIntersection,material.clipShadows]);
 const existing=registry.get(key);if(existing)return existing;
 registry.set(key,material);return material;
}
export function shareModelMaterials(scene:Object3D){
 if(prepared.has(scene))return;prepared.add(scene);
 scene.traverse(o=>{if(o instanceof Mesh)o.material=Array.isArray(o.material)?o.material.map(sharedModelMaterial):sharedModelMaterial(o.material);});
}
