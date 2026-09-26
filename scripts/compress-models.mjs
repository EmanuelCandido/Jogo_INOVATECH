// Compresses the already-exported GLBs in place; optimize-assets does the same
// when it re-exports from assets-source/raw.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {compressModel,modelIO} from './modelIO.mjs';
const io=modelIO(),dir='public/assets/models';let before=0,after=0;
for(const name of await readdir(dir)){
 if(!name.endsWith('.glb'))continue;
 const path=`${dir}/${name}`,source=await readFile(path);
 // Decoding and re-encoding would quantize the normals a second time.
 if((await io.binaryToJSON(source)).json.extensionsUsed?.includes('EXT_meshopt_compression')){before+=source.length;after+=source.length;continue;}
 const doc=await io.readBinary(source);
 await compressModel(doc);
 const binary=Buffer.from(await io.writeBinary(doc));
 before+=source.length;after+=binary.length;
 if(!binary.equals(source))await writeFile(path,binary);
}
console.log(`models: ${(before/1e6).toFixed(1)} MB -> ${(after/1e6).toFixed(1)} MB`);
