import {test, expect} from '@playwright/test';
import {open} from '../helpers';

for (const reducedMotion of [false, true]) {
  test(`double tap cannot spend coins when choices appear (reduced motion: ${reducedMotion})`, async ({page, isMobile}) => {
    test.setTimeout(120000);
    const saved = open();
    saved.settings = {...saved.settings, quality: 'MINIMUM', ambientAnimation: false, reducedMotion};
    await page.addInitScript(value => {
      if (!localStorage.getItem('ecoquest.save.v1')) localStorage.setItem('ecoquest.save.v1', value);
    }, JSON.stringify({version: 1, data: saved}));
    await page.goto('/');
    const first = page.locator('.alternative').first();
    await expect(first).toBeEnabled({timeout: 60000});
    const box = (await first.boundingBox())!;
    const point = {x: box.x + box.width / 2, y: box.y + box.height / 2};

    // Replay the preceding line and touch exactly where the first alternative
    // will appear, using real pointer input rather than calling game actions.
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('ecoquest.save.v1')!);
      state.data.phase = 'CONTEXT';
      localStorage.setItem('ecoquest.save.v1', JSON.stringify(state));
    });
    await page.reload();
    await expect(page.locator('.dialogue-continue')).toBeEnabled({timeout: 60000});
    if (isMobile) {
      await page.touchscreen.tap(point.x, point.y);
      await page.touchscreen.tap(point.x, point.y);
    } else {
      await page.mouse.dblclick(point.x, point.y, {delay: 80});
    }
    await expect(first).toBeEnabled();
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data);
    expect(await read()).toMatchObject({phase: 'QUESTION', coins: saved.coins, decisions: []});
    // Even a late compatibility click with no new pointerdown is rejected.
    await first.dispatchEvent('click', {detail: 1, bubbles: true});
    expect(await read()).toMatchObject({phase: 'QUESTION', coins: saved.coins, decisions: []});
    if (isMobile) await first.tap();
    else { await first.focus(); await page.keyboard.press('Enter'); }
    await expect(page.getByRole('region', {name: 'Resultado da decisão'})).toBeVisible();
    expect((await read()).decisions).toHaveLength(1);
  });
}
