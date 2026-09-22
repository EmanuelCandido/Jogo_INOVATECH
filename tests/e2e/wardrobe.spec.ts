import { test, expect, type Page } from '@playwright/test';
import { overview } from '../helpers';
import { mapReady } from './helpers';
import sharp from 'sharp';

async function seed(page:Page,coins=1500){
  const progress=overview();progress.coins=coins;
  await page.addInitScript(value=>{
    if(!sessionStorage.getItem('wardrobe-seeded')){
      localStorage.setItem('ecoquest.save.v1',value);sessionStorage.setItem('wardrobe-seeded','true');
    }
  },JSON.stringify({version:1,data:progress}));
  await page.goto('/');
}
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data);

test('compra, combina, persiste e mostra o visual nos diálogos',async({page,isMobile},info)=>{
  test.setTimeout(180000);await seed(page);await mapReady(page);
  await page.getByRole('button',{name:'Loja',exact:true}).click();
  const shop=page.getByRole('dialog',{name:'Loja do Impactus'});
  await expect(shop).toBeVisible();
  await page.locator('[data-accessory="cape-comet"]').click();
  await expect(page.getByRole('button',{name:'SALVAR VISUAL',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Comprar por 80'}).click();
  await page.getByRole('tab',{name:'Jaquetas'}).click();
  await page.locator('[data-accessory="jacket-forest"]').click();
  await page.getByRole('button',{name:'Comprar por 120'}).click();
  await page.getByRole('tab',{name:'Chapéus'}).click();
  await page.locator('[data-accessory="hat-explorer"]').click();
  await page.getByRole('button',{name:'Comprar por 80'}).click();
  await page.getByRole('button',{name:'SALVAR VISUAL',exact:true}).click();
  expect((await saved(page)).coins).toBe(1220);
  const expected={cape:'cape-comet',jacket:'jacket-forest',hat:'hat-explorer'};
  expect((await saved(page)).wardrobe.equipped).toEqual(expected);
  const avatar=shop.locator('.character-avatar');
  await expect(avatar.locator('[data-slot="jacket"] > image').first()).toHaveAttribute('href',/rendered\/jacket-base\.webp$/);
  await expect(avatar.locator('[data-slot="hat"] image')).toHaveAttribute('href',/rendered\/hat-explorer\.webp$/);
  await expect(avatar).toHaveAttribute('data-cape','cape-comet');await expect(avatar).toHaveAttribute('data-jacket','jacket-forest');await expect(avatar).toHaveAttribute('data-hat','hat-explorer');
  const image=await avatar.locator('img').boundingBox();expect(image!.width/image!.height).toBeCloseTo(1,2);
  await expect(shop.locator('.save-outfit')).toBeInViewport({ratio:1});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('shop-combination.png'),animations:'disabled'});
  if(isMobile){
    const portrait=page.viewportSize()!;
    await page.setViewportSize({width:844,height:390});
    await expect(shop.locator('.save-outfit')).toBeInViewport({ratio:1});
    await expect(shop.locator('.shop-avatar')).toBeInViewport({ratio:1});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath('shop-landscape.png'),animations:'disabled'});
    await page.setViewportSize(portrait);
  }
  await page.getByRole('button',{name:'Voltar ao mapa',exact:true}).click();
  await page.reload();await mapReady(page);
  await page.getByRole('button',{name:'Loja',exact:true}).click();
  await expect(shop.locator('.character-avatar')).toHaveAttribute('data-hat','hat-explorer');
  await page.getByRole('tab',{name:'Chapéus'}).click();await page.getByRole('button',{name:'Retirar chapéu'}).click();
  await page.getByRole('button',{name:'Voltar ao mapa',exact:true}).click();
  await page.getByRole('button',{name:'Sair sem salvar'}).click();
  expect((await saved(page)).wardrobe.equipped).toEqual(expected);
  await page.getByRole('button',{name:/^Missões/}).click();
  await page.locator('.city-quests summary').click();
  await page.locator('.city-quest:enabled').first().click();
  await expect(page.locator('.problem-dialogue .character-avatar')).toHaveAttribute('data-hat','hat-explorer',{timeout:20000});
  await expect(page.locator('.problem-dialogue .character-avatar')).toHaveAttribute('data-jacket','jacket-forest');
  await page.screenshot({path:info.outputPath('dialogue-outfit.png'),animations:'disabled'});
});

test('todas as jaquetas e chapéus carregam, combinam e podem ser retirados',async({page},info)=>{
  await seed(page);await page.getByRole('button',{name:'Loja',exact:true}).click();
  const avatar=page.locator('.shop-avatar .character-avatar');
  const hats=['explorer','artist','bucket','cap','inventor','crown'];
  const jackets=['trail','forest','ocean','sun','city','cosmos'];
  for(let i=0;i<6;i++){
    await page.getByRole('tab',{name:'Jaquetas'}).click();
    await page.locator(`[data-accessory="jacket-${jackets[i]}"]`).click();
    await page.getByRole('tab',{name:'Chapéus'}).click();
    await page.locator(`[data-accessory="hat-${hats[i]}"]`).click();
    await expect(avatar).toHaveAttribute('data-jacket',`jacket-${jackets[i]}`);
    await expect(avatar).toHaveAttribute('data-hat',`hat-${hats[i]}`);
    const hat=avatar.locator('[data-slot="hat"] image');
    await expect(hat).toHaveAttribute('href',new RegExp(`rendered/hat-${hats[i]}\\.webp$`));
    // Validate browser decoding of the actual artwork, not only its label.
    expect(await avatar.locator('image').evaluateAll(async elements=>{
      const sources=[...new Set(elements.map(el=>el.getAttribute('href')!).filter(Boolean))];
      return Promise.all(sources.map(async src=>{const image=new Image();image.src=src;await image.decode();return image.naturalWidth>0;}));
    })).not.toContain(false);
    const bounds=await hat.boundingBox(), frame=await avatar.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(frame!.y-1);
    expect(bounds!.x).toBeGreaterThanOrEqual(frame!.x-1);
    expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(frame!.x+frame!.width+1);
    await page.screenshot({path:info.outputPath(`rendered-${hats[i]}.png`),animations:'disabled'});
  }
  await page.getByRole('button',{name:'Retirar chapéu'}).click();
  await expect(avatar.locator('[data-slot="hat"]')).toHaveCount(0);
  await expect(avatar.locator('[data-slot="jacket"]')).toHaveCount(1);
  await page.getByRole('tab',{name:'Jaquetas'}).click();
  await page.getByRole('button',{name:'Retirar jaqueta'}).click();
  await expect(avatar.locator('[data-slot="jacket"]')).toHaveCount(0);
  expect((await saved(page)).coins).toBe(1500);
});

test('vestir a jaqueta preserva os pixels da capa abaixo das mãos',async({page})=>{
  await seed(page);await page.getByRole('button',{name:'Loja',exact:true}).click();
  await page.locator('[data-accessory="cape-comet"]').click();
  await page.getByRole('tab',{name:'Chapéus'}).click();
  await page.locator('[data-accessory="hat-crown"]').click();
  const avatar=page.locator('.shop-avatar .character-avatar');
  const before=await avatar.screenshot({animations:'disabled'});
  await page.getByRole('tab',{name:'Jaquetas'}).click();
  await page.locator('[data-accessory="jacket-forest"]').click();
  const after=await avatar.screenshot({animations:'disabled'});
  const {width,height}=await sharp(before).metadata();
  const top=Math.ceil(height!*.72);
  const region={left:0,top,width:width!,height:height!-top};
  const first=await sharp(before).extract(region).raw().toBuffer();
  const second=await sharp(after).extract(region).raw().toBuffer();
  expect(first.equals(second)).toBe(true);
});

test('missões resgatam uma vez e permitem comprar com saldo exato',async({page},info)=>{
  await seed(page,0);
  await page.getByRole('button',{name:/^Missões/}).click();
  await page.getByRole('button',{name:'Dar energia ao Impactus',exact:true}).click();
  const claim=page.getByRole('button',{name:'Resgatar: Dar energia ao Impactus',exact:true});
  await claim.click();
  expect((await saved(page)).coins).toBe(80);
  await expect(page.getByRole('button',{name:'Resgatada: Dar energia ao Impactus'})).toBeDisabled();
  await page.screenshot({path:info.outputPath('missions.png'),animations:'disabled'});
  await page.getByRole('button',{name:'Fechar missões'}).click();
  await page.getByRole('button',{name:'Loja',exact:true}).click();
  await page.locator('[data-accessory="cape-legend"]').click();
  await expect(page.getByRole('button',{name:'Faltam 220 moedas'})).toBeDisabled();
  await page.locator('[data-accessory="cape-comet"]').click();
  await page.getByRole('button',{name:'Comprar por 80'}).click();
  await page.getByRole('button',{name:'SALVAR VISUAL',exact:true}).click();
  expect((await saved(page)).coins).toBe(0);
  await expect(page.getByRole('button',{name:/Comprar por/})).toHaveCount(0);
  await page.getByRole('button',{name:'Voltar ao mapa',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:/^Missões/}).click();
  await expect(page.getByRole('button',{name:'Resgatada: Dar energia ao Impactus'})).toBeDisabled();
});

test('teclado fica na tela aberta e Escape devolve o foco',async({page})=>{
  await seed(page);const trigger=page.getByRole('button',{name:'Loja',exact:true});
  await trigger.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.game-hud')).toHaveAttribute('inert','');
  await expect(page.locator('.world')).toHaveAttribute('inert','');
  await page.getByRole('tab',{name:'Capas'}).focus();await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Jaquetas'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('region',{name:'Configurações'})).toHaveCount(0);
});
