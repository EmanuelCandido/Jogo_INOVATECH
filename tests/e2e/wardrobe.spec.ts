import { test, expect, type Page } from '@playwright/test';
import { overview } from '../helpers';
import { mapReady } from './helpers';
import sharp from 'sharp';
import {accessories, accessoryCollections} from '../../src/game/wardrobe';

async function seed(page:Page,coins=1500,legacy=false){
  const progress=overview();progress.coins=coins;
  if(legacy)progress.wardrobe.owned=accessories.filter(a=>!a.collection).map(a=>a.id);
  await page.addInitScript(value=>{
    if(!sessionStorage.getItem('wardrobe-seeded')){
      localStorage.setItem('ecoquest.save.v1',value);sessionStorage.setItem('wardrobe-seeded','true');
    }
  },JSON.stringify({version:1,data:progress}));
  await page.goto('/');
}
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data);

function expectSamePixels(first:Uint8Array,second:Uint8Array){
  expect(first.length).toBe(second.length);
  let maxDifference=0;
  for(let i=0;i<first.length;i++)maxDifference=Math.max(maxDifference,Math.abs(first[i]-second[i]));
  // ANGLE may round composited pixels by one 8-bit channel value on a phone.
  // Keep this strict enough to catch clothing/occlusion or positioning changes.
  expect(maxDifference).toBeLessThanOrEqual(1);
}

test('experimenta, mistura coleções, compra uma vez e leva o visual aos diálogos',async({page,isMobile},info)=>{
  test.setTimeout(180000);await seed(page);await mapReady(page);
  const navigation=page.getByRole('navigation',{name:'Atividades da cidade'});
  expect((await navigation.boundingBox())!.x).toBeGreaterThan(page.viewportSize()!.width/2);
  await page.getByRole('button',{name:'Loja',exact:true}).click();
  const shop=page.getByRole('dialog',{name:'Loja do Impactus'});
  const avatar=shop.locator('.shop-avatar .character-avatar');
  await page.getByRole('button',{name:'Experimentar Jardim de Bolso',exact:true}).click();
  expect((await saved(page)).coins).toBe(1500);
  await expect(avatar).toHaveAttribute('data-cape','pack-garden');
  await page.getByRole('button',{name:'Comparar',exact:true}).click();
  await expect(avatar).toHaveAttribute('data-cape','cape-star');
  await page.getByRole('button',{name:'Voltar à prévia'}).click();
  await page.getByRole('tab',{name:'Peças',exact:true}).click();
  await page.getByRole('button',{name:'Trajes',exact:true}).click();
  await page.locator('[data-accessory="vest-repair"]').click();
  await page.getByRole('button',{name:'Cabeça',exact:true}).click();
  await page.locator('[data-accessory="head-solar"]').click();
  const expected={cape:'pack-garden',jacket:'vest-repair',hat:'head-solar'};
  expect((await saved(page)).wardrobe.equipped).toEqual({cape:'cape-star',jacket:null,hat:null});
  // Two events in the same frame must not duplicate a charge or inventory entry.
  await page.getByRole('button',{name:'Comprar e usar',exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});
  expect((await saved(page)).coins).toBe(980);
  expect((await saved(page)).wardrobe.equipped).toEqual(expected);
  expect((await saved(page)).wardrobe.owned).toHaveLength(4);
  await expect(avatar.locator('[data-part="torso"]')).toHaveAttribute('href',/fitted\/repair-worn.webp$/);
  await expect(avatar.locator('[data-slot="jacket"]')).toHaveAttribute('data-fitting','illustrated-on-body');
  await expect(avatar.locator('canvas')).toHaveCount(0);
  await expect(avatar.locator('[data-slot="hat"] image')).toHaveAttribute('href',/fitted\/solar-head.webp$/);
  await expect(avatar.locator('[data-slot="backpack"] image')).toHaveAttribute('href',/fitted\/garden-back.webp$/);
  const image=await avatar.locator('img').boundingBox();expect(image!.width/image!.height).toBeCloseTo(1,2);
  await expect(shop.locator('.save-outfit')).toBeInViewport({ratio:1});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('shop-combination.png'),animations:'disabled'});
  if(isMobile){
    const portrait=page.viewportSize()!;await page.setViewportSize({width:844,height:390});
    await expect(shop.locator('.save-outfit')).toBeInViewport({ratio:1});
    await expect(shop.locator('.shop-avatar')).toBeInViewport({ratio:1});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath('shop-landscape.png'),animations:'disabled'});
    await page.setViewportSize(portrait);
  }
  await page.getByRole('button',{name:'Voltar ao mapa',exact:true}).click();
  await page.reload();await mapReady(page);
  await page.getByRole('button',{name:'Loja',exact:true}).click();
  await expect(avatar).toHaveAttribute('data-hat','head-solar');
  await page.getByRole('tab',{name:/Meu armário/}).click();
  await page.getByRole('button',{name:'Cabeça',exact:true}).click();
  await expect(page.locator('[data-accessory="head-solar"]')).toBeVisible();
  await page.getByRole('button',{name:'Retirar da cabeça'}).click();
  await page.getByRole('button',{name:'Voltar ao mapa',exact:true}).click();
  await page.getByRole('button',{name:'Sair sem salvar'}).click();
  expect((await saved(page)).wardrobe.equipped).toEqual(expected);
  await page.getByRole('button',{name:/^Missões/}).click();
  await page.locator('.city-quests summary').click();
  await page.locator('.city-quest:enabled').first().click();
  await expect(page.locator('.problem-dialogue .character-avatar')).toHaveAttribute('data-hat','head-solar',{timeout:20000});
  await expect(page.locator('.problem-dialogue .character-avatar')).toHaveAttribute('data-cape','pack-garden');
  await page.screenshot({path:info.outputPath('dialogue-outfit.png'),animations:'disabled'});
});

test('as nove peças têm artes distintas, carregam e não mudam a escala do corpo',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await seed(page);await page.getByRole('button',{name:'Loja',exact:true}).click();
  const avatar=page.locator('.shop-avatar .character-avatar');
  const originalBounds=await avatar.locator('.character-base').boundingBox();
  const originalSprite=await avatar.locator('.character-base').getAttribute('src');
  for(const collection of accessoryCollections){
    await page.getByRole('button',{name:'Experimentar '+collection.name,exact:true}).click();
    await expect(avatar).toHaveAttribute('data-cape',collection.outfit.cape);
    await expect(avatar).toHaveAttribute('data-jacket',collection.outfit.jacket!);
    await expect(avatar).toHaveAttribute('data-hat',collection.outfit.hat!);
    await expect(avatar.locator('.character-base')).toHaveAttribute('src',originalSprite!);
    await expect(avatar.locator('canvas')).toHaveCount(0);
    await expect(avatar.locator('[data-part="backpack-straps"]')).toHaveCount(1);
    const bounds=(await avatar.locator('.character-base').boundingBox())!;
    for(const key of ['x','y','width','height'] as const)expect(bounds[key]).toBeCloseTo(originalBounds![key],2);
    expect(await avatar.locator('image').evaluateAll(async elements=>{
      const sources=[...new Set(elements.map(el=>el.getAttribute('href')!).filter(Boolean))];
      return Promise.all(sources.map(async src=>{const image=new Image();image.src=src;await image.decode();return image.naturalWidth>0;}));
    })).not.toContain(false);
    // Transparent layers use the full original sprite canvas. Their element
    // bounds are not the visible silhouette; preserve the body's registration
    // above and verify that worn gear no longer uses product catalogue photos.
    await expect(avatar.locator('[data-slot="hat"]')).toHaveAttribute('data-fitting','worn-silhouette');
    await expect(avatar.locator('[data-slot="backpack"]')).toHaveAttribute('data-fitting','worn-side-view');
    await expect(avatar.locator('[data-slot="hat"] image')).toHaveAttribute('href',new RegExp('fitted/'+collection.id+'-head.webp$'));
    await expect(avatar.locator('[data-slot="backpack"] image')).toHaveAttribute('href',new RegExp('fitted/'+collection.id+'-back.webp$'));
    await page.screenshot({path:info.outputPath('collection-'+collection.id+'.png'),animations:'disabled'});
  }
  expect((await saved(page)).coins).toBe(1500);expect((await saved(page)).wardrobe.owned).toEqual(['cape-star']);
  await page.getByRole('tab',{name:'Peças',exact:true}).click();
  await page.getByRole('button',{name:'Cabeça',exact:true}).click();
  await page.getByRole('button',{name:'Retirar da cabeça'}).click();
  await expect(avatar.locator('[data-slot="hat"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Trajes',exact:true}).click();
  await page.getByRole('button',{name:'Retirar traje'}).click();
  await expect(avatar.locator('[data-slot="jacket"]')).toHaveCount(0);
  await expect(avatar.locator('[data-slot="backpack"]')).toHaveCount(1);
});

test('vestir a jaqueta preserva os pixels da capa abaixo das mãos',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await seed(page,1500,true);await page.getByRole('button',{name:'Loja',exact:true}).click();
  // Isolate garment pixels from the showroom glow's GPU blur/dithering.
  await page.addStyleTag({content:'.shop-avatar .character-avatar {background:#f7f5fc}'});
  await page.getByRole('tab',{name:/Meu armário/}).click();
  await page.locator('[data-accessory="cape-comet"]').click();
  await page.getByRole('button',{name:'Cabeça',exact:true}).click();
  await page.locator('[data-accessory="hat-crown"]').click();
  const avatar=page.locator('.shop-avatar .character-avatar');
  const before=await avatar.screenshot({animations:'disabled',path:info.outputPath('cape-before.png')});
  await page.getByRole('button',{name:'Trajes',exact:true}).click();
  await page.locator('[data-accessory="jacket-forest"]').click();
  const after=await avatar.screenshot({animations:'disabled',path:info.outputPath('cape-after.png')});
  const {width,height}=await sharp(before).metadata();
  const top=Math.ceil(height!*.72);
  const region={left:0,top,width:width!,height:height!-top};
  const first=await sharp(before).extract(region).raw().toBuffer();
  const second=await sharp(after).extract(region).raw().toBuffer();
  expectSamePixels(first,second);
});

test('chapéu maré encaixa na testa e mantém o rosto e o corpo no mesmo tamanho',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await seed(page,1500,true);await page.getByRole('button',{name:'Loja',exact:true}).click();
  await page.addStyleTag({content:'.shop-avatar .character-avatar {background:#f7f5fc}'});
  await page.getByRole('tab',{name:/Meu armário/}).click();
  // Reproduce the reported outfit and keep the preview label/compositing state
  // identical in both captures; only the hat changes.
  await page.getByRole('button',{name:'Trajes',exact:true}).click();
  await page.locator('[data-accessory="jacket-ocean"]').click();
  const avatar=page.locator('.shop-avatar .character-avatar');
  const before=await avatar.screenshot({animations:'disabled',path:info.outputPath('hat-before.png')});
  const initialBounds=await avatar.locator('.character-base').boundingBox();
  await page.getByRole('button',{name:'Cabeça',exact:true}).click();
  await page.locator('[data-accessory="hat-bucket"]').click();
  const after=await avatar.screenshot({animations:'disabled',path:info.outputPath('hat-after.png')});
  expect(await avatar.locator('.character-base').boundingBox()).toEqual(initialBounds);
  const {width,height}=await sharp(before).metadata();
  // The old empty hat interior covered this part of the helmet. Its rear rim
  // now sits behind the head; the face and body below the brim stay untouched.
  const regions=[
    {left:Math.round(width!*.50),top:Math.round(height!*.287),width:Math.max(1,Math.floor(width!*.045)),height:Math.max(1,Math.floor(height!*.012))},
    {left:0,top:Math.ceil(height!*.36),width:width!,height:height!-Math.ceil(height!*.36)},
  ];
  for(const region of regions){
    const first=await sharp(before).extract(region).raw().toBuffer();
    const second=await sharp(after).extract(region).raw().toBuffer();
    expectSamePixels(first,second);
  }
});

test('missões resgatam uma vez e permitem comprar uma peça com saldo exato',async({page},info)=>{
  // This flow initializes the full city twice, including after the save reload.
  test.setTimeout(120000);
  await seed(page,30);
  await page.getByRole('button',{name:/^Missões/}).click();
  await page.getByRole('button',{name:'Dar energia ao Impactus',exact:true}).click();
  await page.getByRole('button',{name:'Resgatar: Dar energia ao Impactus',exact:true}).click();
  expect((await saved(page)).coins).toBe(110);
  await expect(page.getByRole('button',{name:'Resgatada: Dar energia ao Impactus'})).toBeDisabled();
  await page.screenshot({path:info.outputPath('missions.png'),animations:'disabled'});
  await page.getByRole('button',{name:'Fechar missões'}).click();
  await page.getByRole('button',{name:'Loja',exact:true}).click();
  await page.getByRole('tab',{name:'Peças',exact:true}).click();
  await page.getByRole('button',{name:'Cabeça',exact:true}).click();
  await page.locator('[data-accessory="head-solar"]').click();
  await expect(page.getByRole('button',{name:'Moedas insuficientes'})).toBeDisabled();
  await expect(page.locator('.shop-message')).toHaveText('Faltam 30 moedas para este visual.');
  await page.locator('[data-accessory="head-garden"]').click();
  await page.getByRole('button',{name:'Comprar e usar',exact:true}).click();
  expect((await saved(page)).coins).toBe(0);
  await expect(page.getByRole('button',{name:'Visual equipado',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Voltar ao mapa',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:/^Missões/}).click();
  await expect(page.getByRole('button',{name:'Resgatada: Dar energia ao Impactus'})).toBeDisabled();
});

test('teclado fica na tela aberta e Escape devolve o foco',async({page})=>{
  await seed(page);const trigger=page.getByRole('button',{name:'Loja',exact:true});
  await trigger.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.game-hud')).toHaveAttribute('inert','');
  await expect(page.locator('.world')).toHaveAttribute('inert','');
  await page.getByRole('tab',{name:'Coleções',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Peças',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
