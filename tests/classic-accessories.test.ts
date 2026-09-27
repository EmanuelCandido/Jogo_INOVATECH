import {expect,it} from 'vitest';
import sharp from 'sharp';
import {classicHats,classicCapes} from '../src/ui/wardrobe/classicArtwork';
import {accessories,normalizeWardrobe} from '../src/game/wardrobe';

it('preserva os identificadores dos seis chapéus e seis capas já comprados',()=>{
  const hats=accessories.filter(a=>a.slot==='hat'&&!a.collection).map(a=>a.id);
  const capes=accessories.filter(a=>a.slot==='cape'&&!a.collection).map(a=>a.id);
  expect(Object.keys(classicHats)).toEqual(hats);
  expect(Object.keys(classicCapes)).toEqual(capes);
  const owned=[...capes,...hats];
  const equipped={cape:'cape-galaxy',jacket:null,hat:'hat-bucket'};
  expect(normalizeWardrobe({owned,equipped})).toEqual({owned,equipped});
});

it('separa chapéus e capas do rosto, do fundo e dos pés do personagem',async()=>{
  const signatures=new Set<string>();
  for(const id of [...Object.keys(classicHats),...Object.keys(classicCapes)]){
    const image=sharp('public/assets/accessories/classic-v2/'+id+'.webp');
    const metadata=await image.metadata();
    expect(metadata.width).toBe(768);expect(metadata.height).toBe(768);expect(metadata.hasAlpha).toBe(true);
    const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const alpha=(x:number,y:number)=>data[(y*info.width+x)*4+3];
    for(const [x,y]of [[0,0],[767,767],[350,690],[292,220],[348,269]]){
      expect(alpha(x,y),id+' não pode incluir corpo ou fundo em '+x+','+y).toBe(0);
    }
    let opaque=0,maxAlphaBelow=0;
    for(let y=0;y<768;y++)for(let x=0;x<768;x++){
      const a=alpha(x,y);if(a>0)opaque++;
      if(y>(id.startsWith('hat-')?270:645))maxAlphaBelow=Math.max(maxAlphaBelow,a);
    }
    expect(opaque).toBeGreaterThan(3000);
    expect(maxAlphaBelow,id+' possui restos de corpo ou pixels fora do caimento').toBe(0);
    const stats=await sharp(data,{raw:{width:768,height:768,channels:4}}).stats();
    signatures.add(stats.channels.map(c=>c.sum).join(','));
  }
  expect(signatures.size).toBe(12);
});
