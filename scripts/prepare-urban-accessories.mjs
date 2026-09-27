import sharp from 'sharp';
import {readFile, mkdir, writeFile} from 'node:fs/promises';

const source='assets-source/ui/wardrobe/urban';
const output='public/assets/accessories/urban';
const {assets}=JSON.parse(await readFile(source+'/prompts.json','utf8'));
await mkdir(output,{recursive:true});
const dimensions={};
for(const {id} of assets){
  const input=source+'/'+id+'.png';
  const meta=await sharp(input).metadata();
  if(!meta.hasAlpha)throw new Error(id+' precisa de transparência real.');
  const trimmed=await sharp(input).trim({threshold:2}).png().toBuffer({resolveWithObject:true});
  dimensions[id]={width:trimmed.info.width,height:trimmed.info.height,ratio:trimmed.info.height/trimmed.info.width};
  await sharp(trimmed.data).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).webp({quality:92,alphaQuality:100}).toFile(output+'/'+id+'.webp');
}
await writeFile(source+'/dimensions.json',JSON.stringify(dimensions,null,2)+'\n');
console.log(dimensions);
