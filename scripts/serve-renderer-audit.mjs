import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const base=resolve('.tools/renderer-audit'),publicDir=resolve('public');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.glb':'model/gltf-binary'};
for(const [variant,port]of [['reference',4181],['current',4182]]){
 const root=resolve(base,variant,'dist');
 createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),relative=pathname==='/'?'index.html':pathname.slice(1);
   const candidates=[resolve(root,relative),resolve(publicDir,relative)];let data,file;
   for(const [i,path]of candidates.entries()){
    const allowed=i?publicDir:root;if(!path.startsWith(allowed+sep))continue;
    try{if(!(await stat(path)).isFile())continue;data=await readFile(path);file=path;break;}catch{}
   }
   if(!file){res.writeHead(404);res.end();return;}
   res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(400);res.end();}
 }).listen(port,'127.0.0.1',()=>console.log(`${variant}: http://127.0.0.1:${port}`));
}
