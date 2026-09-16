import {cp,mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'vite';

const root=process.cwd(),out=resolve('.tools/renderer-audit');await mkdir(out,{recursive:true});
const files=['src/app/World.tsx','src/assets/roofGrassMaterial.ts','src/assets/surfaceFinish.ts','src/components/city/GraphicsRuntime.tsx','src/components/city/ShaderWarmup.tsx','src/components/city/SituationLayers.tsx','src/components/environment/Beach.tsx','src/config/graphics.ts','src/game/CameraDirector.tsx','src/game/frameMetrics.ts','src/game/instanceVisibility.ts','src/game/useMapNavigation.ts'];
const audit=await readFile('scripts/audit-renderer/Audit.tsx','utf8');
const manifest={date:new Date().toISOString(),checkpoint:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),files,variants:[]};
for(const variant of ['current','reference']){
 const dir=resolve(out,variant);await mkdir(dir,{recursive:true});
 await cp(resolve(root,'src'),resolve(dir,'src'),{recursive:true});
 await mkdir(resolve(dir,'assets-source'),{recursive:true});
 for(const name of await readdir(resolve(root,'assets-source')))if(name.endsWith('.json'))await cp(resolve(root,'assets-source',name),resolve(dir,'assets-source',name));
 for(const name of ['package.json','index.html','vite.config.ts'])await cp(resolve(root,name),resolve(dir,name));
 if(variant==='reference')for(const name of files)await writeFile(resolve(dir,name),execFileSync('git',['show',`HEAD:${name}`]));
 // Both builds keep the current interface/content. Remove the normal render
 // owner and install an identical diagnostic owner; it starts with ONE pass.
 const worldPath=resolve(dir,'src/app/World.tsx');let world=await readFile(worldPath,'utf8');
 world=world.replace("import {DepthPrepass} from '../components/city/DepthPrepass';",'').replace('<DepthPrepass/>','');
 await writeFile(worldPath,world);await writeFile(resolve(dir,'src/components/city/Benchmark.tsx'),audit);
 const hashes={};for(const name of files)hashes[name]=createHash('sha256').update(await readFile(resolve(dir,name))).digest('hex');
 await build({root:dir,publicDir:resolve(root,'public'),build:{outDir:'dist',copyPublicDir:false,emptyOutDir:false}});
 manifest.variants.push({variant,hashes});console.log(JSON.stringify({built:variant}));
}
await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2));
