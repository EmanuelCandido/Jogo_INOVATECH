import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Export the same vector artwork used by the layered avatar, so the catalogue
// previews and the wearable parts always have a single editable source.
const cache=path.resolve('.tools/accessory-export');
const output=path.resolve('public/assets/accessories');
await mkdir(cache,{recursive:true});await mkdir(output,{recursive:true});
async function load(source,name){
  const text=await readFile(source,'utf8');
  const compiled=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const file=path.join(cache,name+'.mjs');await writeFile(file,compiled);
  return import(pathToFileURL(file).href);
}
const {accessories}=await load('src/game/wardrobe.ts','catalogue');
const {AccessoryArt}=await load('src/ui/wardrobe/AccessoryArt.tsx','art');
for(const item of accessories){
  const svg=renderToStaticMarkup(React.createElement(AccessoryArt,{item})).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');
  await writeFile(path.join(output,item.id+'.svg'),svg);
}
console.log(`Exportados ${accessories.length} acessórios para ${output}`);
