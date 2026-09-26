import { getBounds } from "@gltf-transform/core";
import { dedup, prune, weld } from "@gltf-transform/functions";
import { readdir, mkdir, stat, writeFile,readFile } from "node:fs/promises";
import { compressModel, modelIO } from "./modelIO.mjs";
const io = modelIO();
const metadataPath='assets-source/model-attachments.json';
const metadata=JSON.parse(await readFile(metadataPath,'utf8'));
async function writeModel(path,binary){
  for(let attempt=0;;attempt++){
    try{return await writeFile(path,binary);}catch(error){
      // Sync clients can hold an existing GLB briefly during a batch export.
      if(attempt>=5||!['EBUSY','EPERM','UNKNOWN'].includes(error.code))throw error;
      await new Promise(resolve=>setTimeout(resolve,100*(attempt+1)));
    }
  }
}
await mkdir("public/assets/models", { recursive: true });
const selection=process.argv.includes('--only')?new Set(process.argv[process.argv.indexOf('--only')+1].split(',')):null;
const previousReport=JSON.parse(await readFile('assets-source/optimization-report.json','utf8').catch(()=>'[]'));
const report = selection?previousReport.filter(r=>!selection.has(r.name.replace(/(-low)?\.glb$/,''))):[];
for (const name of await readdir("assets-source/raw")) {
  if (!name.endsWith(".glb")) continue;
  if(selection&&!selection.has(name.replace(/(-low)?\.glb$/,'')))continue;
  const input = `assets-source/raw/${name}`,
    output = `public/assets/models/${name}`;
  const doc = await io.read(input);
  // AO is a low-frequency multiplier: normalized 8-bit RGB(A) is sufficient.
  const packedColors = new Set();
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const color = primitive.getAttribute("COLOR_0");
      if (!color || packedColors.has(color)) continue;
      packedColors.add(color);
      const source = color.getArray();
      if (source instanceof Uint8Array) continue;
      const divisor = source instanceof Uint16Array && color.getNormalized() ? 65535 : 1;
      color.setArray(Uint8Array.from(source, value => Math.round(Math.max(0, Math.min(1, value / divisor)) * 255))).setNormalized(true);
    }
  }
  await doc.transform(weld(), dedup(), prune());
  const bounds=getBounds(doc.getRoot().listScenes()[0]);
  await compressModel(doc);
  const binary=await io.writeBinary(doc),existing=await readFile(output).catch(()=>null);
  // Avoid rewriting unchanged files while OneDrive or Vite is reading them.
  if(!existing||!existing.equals(Buffer.from(binary)))await writeModel(output,binary);
  if(!name.endsWith('-low.glb')){
    const key=name.replace('.glb','');
    metadata[key]={...metadata[key],bounds};
  }
  report.push({
    name,
    before: (await stat(input)).size,
    after: (await stat(output)).size,
    meshes: doc.getRoot().listMeshes().length,
  });
}
await writeFile(
  "assets-source/optimization-report.json",
  JSON.stringify(report, null, 2),
);
console.table(report);
// Final export bounds are authoritative; rotated Blender object boxes can
// overestimate the shape before material batches are joined and optimized.
await writeFile(metadataPath,JSON.stringify(metadata,null,2));
