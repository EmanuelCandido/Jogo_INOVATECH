import { test, expect, type Page } from '@playwright/test';
import { OrthographicCamera, Vector3 } from 'three';
import { overview } from '../helpers';
import { problemById } from '../../src/content/problems';
import { problemViewport } from '../../src/game/problemFraming';

type Pose = { position: number[]; quaternion: number[]; zoom: number };
type DiagnosticWindow = Window & {
  ecoBenchmark: { cameraState: () => Pose };
  flight: Pose[];
  recordingFlight: boolean;
};
const cameraPose = (page: Page) => page.evaluate(() => (window as unknown as DiagnosticWindow).ecoBenchmark.cameraState());

async function expectClearProblem(page: Page) {
  const { width, height } = page.viewportSize()!;
  const view = problemViewport(width, height)!;
  await expect.poll(async () => {
    const pose = await cameraPose(page);
    const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 850);
    camera.position.fromArray(pose.position);
    camera.quaternion.fromArray(pose.quaternion);
    camera.zoom = pose.zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const point = new Vector3(...problemById.pollution_02.camera.target).project(camera);
    return Math.hypot((point.x + 1) * width / 2 - view.x - view.width / 2,
      (1 - point.y) * height / 2 - view.y - view.height / 2);
  }, { timeout: 15000 }).toBeLessThan(1);
  for (const selector of ['.robot-stage', '.dialogue-box', '.choice-list']) {
    if (!await page.locator(selector).count()) continue;
    const bounds = await page.locator(selector).boundingBox();
    if (!bounds) continue;
    const overlaps = bounds.x < view.x + view.width && bounds.x + bounds.width > view.x
      && bounds.y < view.y + view.height && bounds.y + bounds.height > view.y;
    expect(overlaps, `${selector} must leave the mission viewport clear`).toBe(false);
  }
  const portrait = (await page.locator('.robot-stage').boundingBox())!;
  for (const control of await page.locator('.header-actions > *').all()) {
    const bounds = (await control.boundingBox())!;
    expect(portrait.x < bounds.x + bounds.width && portrait.x + portrait.width > bounds.x
      && portrait.y < bounds.y + bounds.height && portrait.y + portrait.height > bounds.y,
    'the portrait must not overlap the balance or menu').toBe(false);
  }
  expect(await page.locator('.problem-dialogue').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
}

test('mobile keeps the problem visible through the zoom, dialogue, choices and rotation', async ({ page, isMobile }, info) => {
  test.skip(!isMobile, 'Compact mission layout');
  test.setTimeout(120000);
  const saved = overview();
  saved.problemStates.accessibility_01 = 'SOLVED';
  saved.problemStates.pollution_01 = 'SOLVED';
  saved.problemStates.pollution_02 = 'AVAILABLE';
  saved.settings = { ...saved.settings, quality: 'MINIMUM', ambientAnimation: false, reducedMotion: false };
  await page.addInitScript(value => localStorage.setItem('ecoquest.save.v1', value), JSON.stringify({ version: 1, data: saved }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?benchmark=1');
  await expect(page.getByRole('button', { name: 'Centralizar mapa' })).toBeEnabled({ timeout: 60000 });
  const canvasBefore = await page.locator('canvas').boundingBox();
  await page.evaluate(() => {
    const w = window as unknown as DiagnosticWindow;
    w.flight = [];
    w.recordingFlight = true;
    const sample = () => {
      w.flight.push(w.ecoBenchmark.cameraState());
      if (w.recordingFlight) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.locator('.marker[data-problem="pollution_02"]').click();
  await expect(page.getByRole('region', { name: 'Observação do companheiro' })).toBeVisible({ timeout: 15000 });
  await expectClearProblem(page);
  const flight = await page.evaluate(() => {
    const w = window as unknown as DiagnosticWindow;
    w.recordingFlight = false;
    return w.flight;
  });
  expect(new Set(flight.map(p => p.zoom.toFixed(2))).size).toBeGreaterThan(3);
  for (let i = 1; i < flight.length; i++) expect(flight[i].zoom).toBeGreaterThanOrEqual(flight[i - 1].zoom - .001);
  expect(await page.locator('canvas').boundingBox()).toEqual(canvasBefore);
  const arrived = await cameraPose(page);
  await page.screenshot({ path: info.outputPath('mission-comment.png') });

  // A tap on the clear city area still advances just one line.
  await page.touchscreen.tap(6, 115);
  await expect(page.getByRole('region', { name: 'Contexto do problema' })).toBeVisible();
  await expectClearProblem(page);
  await page.getByRole('button', { name: 'Pensar nas soluções →' }).click();
  await expect(page.locator('.alternative')).toHaveCount(3);
  await expectClearProblem(page);
  await page.waitForTimeout(250);
  expect(await cameraPose(page)).toEqual(arrived);
  await page.screenshot({ path: info.outputPath('mission-question.png') });

  const portraitSize = page.viewportSize()!;
  await page.setViewportSize({ width: 844, height: 390 });
  await expectClearProblem(page);
  for (const choice of await page.locator('.alternative').all()) {
    await choice.scrollIntoViewIfNeeded();
    await expect(choice).toBeInViewport({ ratio: .99 });
  }
  await page.screenshot({ path: info.outputPath('mission-landscape.png') });
  await page.setViewportSize(portraitSize);
  await expectClearProblem(page);
  await page.locator('.alternative').first().click();
  await expect(page.getByRole('region', { name: 'Resultado da decisão' })).toBeVisible();
  await expectClearProblem(page);
  await page.screenshot({ path: info.outputPath('mission-result.png') });
  await page.getByRole('button', { name: 'Voltar à cidade →' }).click();
  await expect(page.getByRole('button', { name: 'Centralizar mapa' })).toBeEnabled({ timeout: 15000 });
  expect(errors).toEqual([]);
});
