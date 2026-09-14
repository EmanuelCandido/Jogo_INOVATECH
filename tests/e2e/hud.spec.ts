import { test, expect } from '@playwright/test';
import { open } from '../helpers';

test('abertura, Impactus e continuação do progresso', async ({ page }, info) => {
  await page.goto('/');
  const play = page.getByRole('button', { name: 'JOGAR', exact: true });
  await expect(play).toBeVisible();
  await expect(page.getByRole('region', { name: 'Apresentação do companheiro' })).toHaveCount(0);
  await expect(play).toBeEnabled({ timeout: 45000 });
  await page.screenshot({ path: info.outputPath('hud-title.png'), animations: 'disabled' });
  await play.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.speaker-plate')).toHaveText('Impactus');
  await expect(page.locator('.dialogue-body')).toContainText('Olá! Vamos transformar nossa cidade em um lugar melhor?');
  await expect(page.getByAltText('Robô companheiro da jornada')).toHaveJSProperty('naturalWidth', 768);
  await page.screenshot({ path: info.outputPath('hud-intro.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Continuar →', exact: true }).click();
  await page.reload();
  await expect(play).toHaveCount(0);
  await expect(page.locator('.dialogue-body p')).toContainText('À primeira vista');
});

test('pergunta, custos e alternativas acessíveis sobre a cidade', async ({ page }, info) => {
  const saved = open(undefined, 'pollution_01');
  await page.addInitScript(value => {
    localStorage.setItem('ecoquest.save.v1', value);
  }, JSON.stringify({ version: 1, data: saved }));
  await page.goto('/');
  const choices = page.locator('.alternative');
  await expect(choices).toHaveCount(3);
  await expect(choices.first()).toBeEnabled({ timeout: 45000 });
  for (const choice of await choices.all()) {
    await expect(choice).toBeInViewport({ ratio: 1 });
    await expect(choice.locator('.choice-cost')).toHaveAccessibleName(/\d+ moedas/);
    const bounds = await choice.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  const portrait = await page.locator('.robot-stage').boundingBox();
  const dialogue = await page.locator('.dialogue-box').boundingBox();
  expect(portrait!.y).toBeGreaterThanOrEqual(0);
  expect(portrait!.y + portrait!.height).toBeLessThan(dialogue!.y + 25);
  // A flex layout can leave the panel visible while collapsing its question.
  const body = page.locator('.dialogue-body');
  expect(await body.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  await expect(body.getByRole('heading')).toBeInViewport({ ratio: 1 });
  for (const control of await page.locator('.balance, .header-actions button').all()) {
    const bounds = (await control.boundingBox())!;
    const overlaps = portrait!.x < bounds.x + bounds.width && portrait!.x + portrait!.width > bounds.x
      && portrait!.y < bounds.y + bounds.height && portrait!.y + portrait!.height > bounds.y;
    expect(overlaps).toBe(false);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('hud-question.png'), animations: 'disabled' });
  if (info.project.name === 'small') {
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(body.getByRole('heading')).toBeInViewport({ ratio: 1 });
    for (const choice of await choices.all()) {
      await choice.scrollIntoViewIfNeeded();
      // Chromium rounds fractional scrollport edges down by a subpixel.
      await expect(choice).toBeInViewport({ ratio: .99 });
    }
    await expect(page.locator('.footer')).toBeHidden();
    await page.screenshot({ path: info.outputPath('hud-landscape.png'), animations: 'disabled' });
  }
  await page.getByRole('button', { name: 'Decidir depois · voltar ao mapa' }).click();
  await page.getByRole('button', { name: 'Centralizar mapa' }).click();
  await expect(page.locator('.marker')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('hud-map.png'), animations: 'disabled' });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data);
  expect(stored.coins).toBe(saved.coins);
  expect(stored.decisions).toEqual([]);
});
