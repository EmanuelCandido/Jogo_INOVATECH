import {expect,it} from 'vitest';
import sharp from 'sharp';
import {bodySilhouettes} from '../src/ui/wardrobe/bodySilhouettes';
import {wornArtwork} from '../src/ui/wardrobe/wornArtwork';

// Regression points in the cape fragments reported during the 2D review:
// behind an elbow/hand, beside a thigh, and between the legs. These are fixed
// coordinates in the original illustrations, not derived from the masks.
const capePixels={
  character_intro:[[246,531],[435,481],[347,552],[546,528]],
  character_thinking:[[606,448],[246,522],[365,545],[565,520]],
  character_alert:[[578,483],[379,564],[487,527],[578,545]],
  character_success:[[581,430],[315,578],[389,550],[612,520]],
  character_failure:[[573,600],[241,538],[372,565],[652,532]],
} as const;
const bodyPixels={
  character_intro:[[201,520],[302,514],[407,506],[334,590],[467,603]],
  character_thinking:[[225,370],[625,392],[401,522],[329,584],[483,603]],
  character_alert:[[147,304],[524,475],[301,492],[309,610],[486,609]],
  character_success:[[152,237],[562,322],[303,490],[229,580],[495,600]],
  character_failure:[[176,280],[662,425],[252,543],[302,516],[337,596],[481,605]],
} as const;

it('retira os fragmentos de capa e conserva membros nas cinco poses',async()=>{
  for(const pose of Object.keys(capePixels) as (keyof typeof capePixels)[]){
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768"><path d="${bodySilhouettes[pose]}" fill="white"/></svg>`;
    const {data,info}=await sharp(new TextEncoder().encode(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const alpha=(x:number,y:number)=>data[(y*768+x)*info.channels+3];
    for(const [x,y]of capePixels[pose])expect(alpha(x,y),`${pose}: capa em ${x},${y}`).toBe(0);
    for(const [x,y]of bodyPixels[pose])expect(alpha(x,y),`${pose}: corpo em ${x},${y}`).toBe(255);
  }
});

it('exporta chapéu, alças e mochila em camadas com transparência real',async()=>{
  for(const collection of Object.keys(wornArtwork))for(const part of ['head','straps','back']){
    const file=`public/assets/accessories/fitted/${collection}-${part}.webp`;
    const meta=await sharp(file).metadata();
    expect(meta.width).toBe(768);expect(meta.height).toBe(768);expect(meta.hasAlpha).toBe(true);
    const stats=await sharp(file).stats();expect(stats.channels[3].min).toBe(0);expect(stats.channels[3].max).toBe(255);
    // Worn layers contain no face/eyes, legs or feet from the source sheets.
    const {data}=await sharp(file).extract({left:0,top:610,width:768,height:158}).raw().toBuffer({resolveWithObject:true});
    let maxAlpha=0;
    for(let i=3;i<data.length;i+=4)maxAlpha=Math.max(maxAlpha,data[i]);
    expect(maxAlpha).toBe(0);
  }
});
