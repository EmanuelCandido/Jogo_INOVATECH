import { test, expect, type Page } from '@playwright/test';
import { story } from '../../src/content/story';
import {resetMap} from './helpers';

async function tap(page: Page, x: number, y: number, touch: boolean) {
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

test('tocar na tela avança uma fala e preserva menus, gestos e escolhas', async ({ page }, info) => {
  test.setTimeout(180000);
  const touch = !!info.project.use.hasTouch;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'JOGAR', exact: true }).click();
  const copy = page.locator('.dialogue-body p');
  const viewport = page.viewportSize()!;
  await expect(copy).toHaveText(story.intro[0]);
  await page.screenshot({ path: info.outputPath('current-intro.png'), animations: 'disabled' });

  // Empty map area, bottom edge, portrait and dialogue all continue the story.
  await tap(page, 6, 115, touch);
  await expect(copy).toHaveText(story.intro[1]);
  await tap(page, 6, viewport.height - 8, touch);
  await expect(copy).toHaveText(story.intro[2]);
  const portrait = (await page.locator('.robot-stage').boundingBox())!;
  await tap(page, portrait.x + portrait.width / 2, portrait.y + 40, touch);
  await expect(copy).toHaveText(story.intro[3]);

  // A scroll or a drag over the reading area must not dismiss its contents.
  const body = (await page.locator('.dialogue-body').boundingBox())!;
  if (touch) {
    const session = await page.context().newCDPSession(page);
    const x = body.x + 20, y = body.y + body.height - 5;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 40 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(body.x + 10, body.y + 10);
    await page.mouse.down();
    await page.mouse.move(body.x + 10, body.y + 45, { steps: 5 });
    await page.mouse.up();
  }
  await expect(copy).toHaveText(story.intro[3]);
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await tap(page, body.x + 15, body.y + 10, touch);
  await expect(copy).toHaveText(story.intro[4]);

  // The existing button owns its click, so bubbling cannot skip a second line.
  await page.getByRole('button', { name: 'Continuar →', exact: true }).click();
  await expect(copy).toHaveText(story.intro[5]);
  await tap(page, 6, 115, touch);
  await expect(copy).toHaveText(story.intro[6]);
  await tap(page, 6, 115, touch);
  await expect(copy).toHaveText(story.intro[7]);
  await tap(page, 6, 115, touch);
  await expect(page.locator('.alternative')).toHaveCount(3);
  await tap(page, 6, 115, touch);
  await expect(page.locator('.alternative')).toHaveCount(3);
  await page.getByRole('button', { name: 'Configurações', exact: true }).click();
  await page.getByRole('heading', { name: 'Som e gráficos' }).click();
  await tap(page, 6, 115, touch);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data.phase)).toBe('TUTORIAL_QUESTION');
  await page.getByRole('button', { name: 'Fechar configurações' }).click();
  await expect(page.locator('.alternative')).toHaveCount(3);
  await page.locator('[data-choice-id="observe"]').click();
  await expect(page.getByRole('region', { name: 'Resultado da decisão' })).toBeVisible();
  await tap(page, 6, 115, touch);
  await resetMap(page);

  // Context and results accept the same gesture; questions still need a choice.
  await page.locator('.marker[data-problem="pollution_01"]').click();
  await expect(page.getByRole('region', { name: 'Observação do companheiro' })).toBeVisible({timeout:15000});
  await tap(page, 6, 115, touch);
  await expect(page.getByRole('region', { name: 'Contexto do problema' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('current-context.png'), animations: 'disabled' });
  await tap(page, 6, 115, touch);
  await expect(page.locator('.alternative')).toHaveCount(3);
  await page.screenshot({ path: info.outputPath('current-question.png'), animations: 'disabled' });
  await tap(page, 6, 115, touch);
  await expect(page.locator('.alternative')).toHaveCount(3);
  await page.locator('[data-choice-id="collection"]').click();
  await expect(page.getByRole('region', { name: 'Resultado da decisão' })).toBeVisible({timeout:20000});
  await tap(page, 6, 115, touch);
  await resetMap(page);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data.decisions)).toHaveLength(1);
  expect(errors).toEqual([]);
});
