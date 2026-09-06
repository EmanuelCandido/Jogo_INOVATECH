import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

// Format conversion only: background removal is performed with imagegen.
const directory=new URL('../public/assets/portraits/robot/',import.meta.url);
const names=['Apresentação','Reflexão','Alerta','Comemoração','Preocupação'];
const manifest=[];
for(let i=1;i<=5;i++){
 const png=await readFile(new URL(`source/pose-${i}.png`,directory));
 const {width,height,hasAlpha}=await sharp(png).metadata();
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let clear=0,opaque=0;
 for(let p=3;p<data.length;p+=4){if(data[p]===0)clear++;if(data[p]>=245)opaque++;}
 if(!hasAlpha||clear<width*height*.1||opaque<width*height*.1)throw Error(`Pose ${i} does not have a valid transparent cutout.`);
 if(data[3]!==0||data[(info.width-1)*4+3]!==0)throw Error(`Pose ${i} has an opaque corner.`);
 // Embed the unmodified source bytes: the SVG preserves every PNG pixel.
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">Companheiro — ${names[i-1]}</title><desc>Recorte PNG incorporado sem perda. Não é uma vetorização por traçados.</desc><image width="${width}" height="${height}" href="data:image/png;base64,${png.toString('base64')}"/></svg>\n`;
 await writeFile(new URL(`pose-${i}.svg`,directory),svg);
 await sharp(png).resize(768,768,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:90,alphaQuality:100,effort:6}).toFile(fileURLToPath(new URL(`pose-${i}.webp`,directory)));
 const webp=await readFile(new URL(`pose-${i}.webp`,directory));
 const embedded=Buffer.from(svg.match(/base64,([^\"]+)/)[1],'base64');
 if(!embedded.equals(png))throw Error(`Pose ${i}: SVG embedding changed source bytes.`);
 manifest.push({pose:i,name:names[i-1],width,height,transparentPixels:clear,sourceSha256:createHash('sha256').update(png).digest('hex'),svgBytes:Buffer.byteLength(svg),webpBytes:webp.length});
}
await writeFile(new URL('manifest.json',directory),JSON.stringify(manifest,null,2)+'\n');
console.table(manifest.map(({pose,transparentPixels,svgBytes,webpBytes})=>({pose,transparentPixels,svgBytes,webpBytes})));
