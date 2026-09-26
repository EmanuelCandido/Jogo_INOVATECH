import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,EXTMeshoptCompression} from '@gltf-transform/extensions';
import {quantize,reorder} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';

await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
/** Reads and writes the app's GLBs, including meshopt-compressed ones. */
export function modelIO(){
 return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
}
/** Lossless-looking download compression for the city models.
 * POSITION stays float: the foliage, roof grass and surface-finish shaders
 * read object-space `position`, which quantization would rescale.
 * Normals use 12-bit precision and vertex colours are already 8-bit.
 */
export async function compressModel(doc){
 if(doc.getRoot().listExtensionsUsed().some(e=>e.extensionName===EXTMeshoptCompression.EXTENSION_NAME))return;
 await doc.transform(
  reorder({encoder:MeshoptEncoder,target:'size'}),
  quantize({pattern:/^(NORMAL|COLOR_0)$/,quantizeNormal:12,quantizeColor:8}),
 );
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.FILTER});
}
