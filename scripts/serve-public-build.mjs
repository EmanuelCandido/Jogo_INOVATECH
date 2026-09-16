import {createServer} from 'node:http';
import {readFile,readdir,realpath} from 'node:fs/promises';
import {resolve,relative,extname,sep} from 'node:path';
import {gzipSync} from 'node:zlib';

// A dedicated, immutable build snapshot. No source files, directory listing,
// proxying, uploads or filesystem routes are exposed by this public preview.
const root=await realpath(resolve('.tools/ecoquest-public/dist'));
const files=new Map();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.glb':'model/gltf-binary','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
async function collect(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  if(entry.name.startsWith('.')||entry.isSymbolicLink())continue;
  const path=resolve(directory,entry.name);
  if(entry.isDirectory()){await collect(path);continue;}
  const ext=extname(path),type=types[ext];if(!entry.isFile()||!type)continue;
  const name='/'+relative(root,path).split(sep).join('/'),body=await readFile(path);
  const compressed=/^\.(html|js|css|json|svg|ttf|glb|txt)$/.test(ext)?gzipSync(body):null;
  files.set(name,{body,gzip:compressed&&compressed.length<body.length?compressed:null,type});
 }
}
await collect(root);
if(!files.has('/index.html'))throw new Error('Build index missing');
createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 const file=files.get(pathname==='/'?'/index.html':pathname);
 if(!file){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return;}
 const gzip=file.gzip&&/\bgzip\b/.test(req.headers['accept-encoding']??''),body=gzip?file.gzip:file.body;
 res.writeHead(200,{'Content-Type':file.type,'Content-Length':body.length,'X-Content-Type-Options':'nosniff','Cache-Control':pathname==='/'||pathname.endsWith('.html')?'no-cache':'public, max-age=3600',Vary:'Accept-Encoding',...(gzip?{'Content-Encoding':'gzip'}:{})});
 res.end(req.method==='HEAD'?undefined:body);
}).listen(4184,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:4184',files:files.size,root})));
