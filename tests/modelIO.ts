import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';

await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
/** Reads the app's meshopt-compressed GLBs (see scripts/modelIO.mjs). */
export function modelIO(){
 return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
}
