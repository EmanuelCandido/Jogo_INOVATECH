import {readdir,stat,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

// Impactus' arrival poses (src/ui/cinematic/arrivalPoses.ts). The sources are
// ImageGen cutouts on the same 1254 px square as the dialogue poses; this only
// drops the few stray pixels left around the cutout and converts to WebP.
const source=new URL('../assets-source/ui/arrival/',import.meta.url),target=new URL('../public/assets/portraits/robot/arrival/',import.meta.url);
const report=[];
for(const file of (await readdir(source)).filter(f=>f.endsWith('.png')).sort()){
 const {data,info}=await sharp(fileURLToPath(new URL(file,source))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info;
 if(data[3]!==0||data[(w-1)*4+3]!==0)throw Error(`${file} has an opaque corner.`);
 // Connected areas of visible pixels: Impactus is one large area, specks are tiny.
 const label=new Int32Array(w*h).fill(-1),areas=[];
 for(let i=0;i<w*h;i++){
  if(label[i]>=0||data[i*4+3]<8)continue;
  const pixels=[i];label[i]=areas.length;
  for(let k=0;k<pixels.length;k++){
   const p=pixels[k],x=p%w;
   for(const q of [x>0?p-1:-1,x<w-1?p+1:-1,p-w,p+w])if(q>=0&&q<w*h&&label[q]<0&&data[q*4+3]>=8){label[q]=areas.length;pixels.push(q);}
  }
  areas.push(pixels);
 }
 const largest=Math.max(...areas.map(a=>a.length));
 let removed=0;
 for(const pixels of areas)if(pixels.length<largest*.002){removed+=pixels.length;for(const p of pixels)data[p*4+3]=0;}
 // Faint pixels outside every kept area are cleared too.
 for(let i=0;i<w*h;i++)if(data[i*4+3]>0&&data[i*4+3]<8)data[i*4+3]=0;
 const name=file.replace('.png','.webp');
 await sharp(data,{raw:{width:w,height:h,channels:4}}).resize(768,768).webp({quality:90,alphaQuality:100,effort:6}).toFile(fileURLToPath(new URL(name,target)));
 const bytes=(await stat(new URL(name,target))).size;
 report.push({file:name,removedPixels:removed,webpBytes:bytes});
}
await writeFile(new URL('manifest.json',target),JSON.stringify(report,null,2)+'\n');
console.table(report);
