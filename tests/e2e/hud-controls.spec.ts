import { test, expect, type Page } from '@playwright/test';
import { overview } from '../helpers';
import { mapReady } from './helpers';

async function enterCity(page:Page) {
  const progress=overview();
  progress.coins=1500;
  progress.settings={...progress.settings,quality:'HIGH',reducedMotion:false,ambientAnimation:false};
  await page.addInitScript(value=>localStorage.setItem('ecoquest.save.v1',value),JSON.stringify({version:1,data:progress}));
  await page.goto('/');
  await mapReady(page);
}

test('controles da loja mantêm categorias, foco e mapa protegido durante a saída',async({page},info)=>{
  test.setTimeout(120000);
  await enterCity(page);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.screenshot({path:info.outputPath('hud-map.png'),animations:'disabled'});
  const launch=page.getByRole('button',{name:'Loja',exact:true});
  await launch.click();
  const shop=page.getByRole('dialog',{name:'Loja do Impactus'});
  const back=shop.getByRole('button',{name:'Voltar ao mapa'});
  await expect(back.locator('img')).toHaveCount(0);
  await expect(back.locator('svg')).toHaveCount(1);
  expect(await back.evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('gradient');
  expect((await back.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await page.getByRole('tab',{name:'Jaquetas'}).click();
  await page.getByRole('tab',{name:'Jaquetas'}).press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Chapéus'})).toHaveAttribute('aria-selected','true');
  await page.locator('[data-accessory="hat-bucket"]').click();
  const tabs=page.getByRole('tablist');
  const tabY=(await tabs.boundingBox())!.y;
  await page.locator('.shop-catalogue-scroll').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  expect((await tabs.boundingBox())!.y).toBeCloseTo(tabY,0);
  await expect(back).toBeInViewport({ratio:1});
  await expect(shop.getByRole('button',{name:'SALVAR VISUAL',exact:true})).toBeInViewport({ratio:1});
  await page.locator('.shop-catalogue-scroll').evaluate(el=>{el.scrollTop=0;});
  await expect(page.locator('.accessory-card').first()).toBeInViewport({ratio:.99});
  await page.screenshot({path:info.outputPath('hud-shop.png'),animations:'disabled'});
  if(info.project.name==='small'){
    await page.setViewportSize({width:740,height:360});
    await expect(tabs).toBeInViewport({ratio:1});
    await expect(page.locator('.accessory-card').first()).toBeInViewport({ratio:.99});
    expect(await page.locator('.shop-catalogue-scroll').evaluate(el=>el.clientHeight)).toBeGreaterThan(50);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(740);
    await page.screenshot({path:info.outputPath('hud-shop-landscape.png'),animations:'disabled'});
    await page.setViewportSize({width:360,height:640});
  }
  await back.click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(back).toBeFocused();
  await back.click();
  const transition=await page.getByRole('button',{name:'Sair sem salvar'}).evaluate(button=>{
    (button as HTMLButtonElement).click();
    return new Promise(resolve=>requestAnimationFrame(()=>resolve({
      state:document.querySelector('.hud-overlay')?.getAttribute('data-state'),
      blocked:(document.querySelector('.game-hud') as HTMLElement).inert,
      controlsBlocked:(document.querySelector('.hud-overlay-content') as HTMLElement).inert,
    })));
  });
  expect(transition).toEqual({state:'closing',blocked:true,controlsBlocked:true});
  await expect(page.locator('.hud-overlay')).toHaveCount(0);
  await expect(launch).toBeFocused();
  expect(errors).toEqual([]);
});

test('missões e configurações usam controles nativos e fecham pelo teclado',async({page},info)=>{
  test.setTimeout(120000);
  await enterCity(page);
  await page.getByRole('button',{name:/^Missões/}).click();
  await page.getByRole('button',{name:'Dar energia ao Impactus',exact:true}).click();
  await page.getByRole('button',{name:'Resgatar: Dar energia ao Impactus',exact:true}).click();
  await expect(page.getByRole('button',{name:'Resgatada: Dar energia ao Impactus'})).toBeDisabled();
  await expect(page.locator('.round-close img,.mission-go img')).toHaveCount(0);
  await page.screenshot({path:info.outputPath('hud-missions.png'),animations:'disabled'});
  await page.keyboard.press('Escape');
  await expect(page.locator('.hud-overlay')).toHaveCount(0);
  const settingsButton=page.getByRole('button',{name:'Configurações',exact:true});
  await settingsButton.click();
  const settings=page.getByRole('dialog',{name:'Configurações',exact:true});
  const close=settings.getByRole('button',{name:'Fechar configurações'});
  await expect(close.locator('img')).toHaveCount(0);
  await settings.getByRole('button',{name:'Recomeçar a história'}).focus();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await expect(close).toBeInViewport({ratio:1});
  await page.locator('.settings-scroll').evaluate(el=>{el.scrollTop=0;});
  await page.screenshot({path:info.outputPath('hud-settings.png'),animations:'disabled'});
  await settings.getByLabel('Reduzir movimentos').check();
  expect(await close.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
  await page.keyboard.press('Escape');
  await expect(page.locator('.hud-overlay')).toHaveCount(0);
  await expect(settingsButton).toBeFocused();
});
