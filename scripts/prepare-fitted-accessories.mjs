import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {wornArtwork,backArtwork} from '../src/ui/wardrobe/wornArtwork.ts';

const source='assets-source/ui/wardrobe/fitted';
const output='public/assets/accessories/fitted';
await mkdir(output,{recursive:true});
const svg=content=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">${content}</svg>`);
const details={};
for(const [id,art] of Object.entries(wornArtwork)){
  const reference=await sharp(source+'/'+art.source+'.png').resize(768,768).ensureAlpha().png().toBuffer();
  for(const part of ['head','straps']){
    const result=await sharp(reference).composite([{input:svg(`<path d="${art[part]}" fill="white"/>`),blend:'dest-in'}]).webp({quality:94,alphaQuality:100}).toBuffer();
    await writeFile(`${output}/${id}-${part}.webp`,result);
    details[`${id}-${part}`]={source:art.source+'.png',bytes:result.length};
  }
  const rear=backArtwork[id];
  // The authored source sheets include a baked backdrop. Silhouette extraction
  // makes real alpha, with neither checkerboard pixels nor hidden robot limbs.
  const sheet=await sharp(source+'/back-layers.png').resize(2048,683).png().toBuffer();
  const clipped=svg(`<defs><clipPath id="part"><path d="${rear.path}"/></clipPath></defs><g transform="${rear.transform}"><image href="data:image/png;base64,${sheet.toString('base64')}" width="2048" height="683" clip-path="url(#part)"/></g>`);
  const result=await sharp(clipped).webp({quality:94,alphaQuality:100}).toBuffer();
  await writeFile(`${output}/${id}-back.webp`,result);
  details[`${id}-back`]={source:'back-layers.png',bytes:result.length};
}
await sharp(source+'/repair-worn.png').resize(768,768).webp({quality:94,alphaQuality:100}).toFile(output+'/repair-worn.webp');
await writeFile(source+'/exports.json',JSON.stringify(details,null,2)+'\n');
console.log('Exportadas nove camadas 2D com alfa real, registradas em 768×768.');
