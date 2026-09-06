import { NodeIO } from "@gltf-transform/core";
import { dedup, prune, weld } from "@gltf-transform/functions";
import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
const io = new NodeIO();
await mkdir("public/assets/models", { recursive: true });
const report = [];
for (const name of await readdir("assets-source/raw")) {
  if (!name.endsWith(".glb")) continue;
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
  await io.write(output, doc);
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
