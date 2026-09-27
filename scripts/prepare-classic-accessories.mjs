import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import {classicHats,classicCapes} from '../src/ui/wardrobe/classicArtwork.ts';

const source='assets-source/ui/wardrobe/classic-v2';
const output='public/assets/accessories/classic-v2';
await mkdir(output,{recursive:true});
const svg=body=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768">'+body+'</svg>');
const exports={};
for(const [id,art] of Object.entries(classicHats)){
  const image=await sharp(source+'/'+id+'.png').resize(768,768).ensureAlpha().png().toBuffer();
  const mask=svg('<defs><mask id="cut"><path d="'+art.cut+'" fill="white"/>'+(art.holes?'<path d="'+art.holes+'" fill="black"/>':'')+'</mask></defs><rect x="170" width="430" height="270" fill="white" mask="url(#cut)"/>');
  const layer=await sharp(image).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  await sharp(layer).webp({quality:94,alphaQuality:100}).toFile(output+'/'+id+'.webp');
  exports[id]={source:id+'.png',width:768,height:768};
}
for(const [id,art] of Object.entries(classicCapes)){
  const input=await sharp(source+'/'+id+'.png').resize(1792,896).png().toBuffer();
  const [nx,ny]=art.neck,s=art.scale,vertical=s*1.23;
  const rear=svg('<g transform="translate('+(356-nx*s)+' '+(295-ny*vertical)+') scale('+s+' '+vertical+')"><image href="data:image/png;base64,'+input.toString('base64')+'" width="1792" height="896"/></g>');
  await sharp(rear).webp({quality:94,alphaQuality:100}).toFile(output+'/'+id+'.webp');
  exports[id]={source:id+'.png',width:768,height:768};
}
await writeFile(source+'/exports.json',JSON.stringify(exports,null,2)+'\n');
console.log('Exportados seis chapéus vestidos e seis capas 2D independentes.');
