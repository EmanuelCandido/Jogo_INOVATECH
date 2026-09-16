import { test, expect, type Page } from '@playwright/test';
import { OrthographicCamera, Vector3 } from 'three';
import { overview } from '../helpers';
import { problemById } from '../../src/content/problems';

type Pose = { position: number[]; quaternion: number[]; zoom: number };
type Sample = Pose & { time: number; dialogue: boolean; characterOpacity: number; boxOpacity: number };
type DiagnosticWindow = Window & {
  ecoBenchmark: { cameraState: () => Pose };
  flight: Sample[];
  recordingFlight: boolean;
};
const cameraPose = (page: Page) => page.evaluate(() => (window as unknown as DiagnosticWindow).ecoBenchmark.cameraState());

async function expectCenteredProblem(page: Page) {
  const { width, height } = page.viewportSize()!;
  await expect.poll(async () => {
    const pose = await cameraPose(page);
    const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 850);
    camera.position.fromArray(pose.position);
    camera.quaternion.fromArray(pose.quaternion);
    camera.zoom = pose.zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const point = new Vector3(...problemById.pollution_02.camera.target).project(camera);
    return Math.hypot(point.x * width / 2, point.y * height / 2);
  }, { timeout: 15000 }).toBeLessThan(.05);
}

async function expectOriginalPortrait(page: Page) {
  const { width, height } = page.viewportSize()!;
  const portrait = (await page.locator('.robot-stage').boundingBox())!;
  const box = (await page.locator('.dialogue-box').boundingBox())!;
  if (width > height) {
    expect(portrait.width).toBeGreaterThan(180);
    expect(portrait.x + portrait.width).toBeLessThan(box.x);
  } else {
    expect(portrait.width).toBeGreaterThan(width * .7);
    expect(Math.abs(portrait.x - box.x)).toBeLessThan(2);
  }
  await expect(page.locator('.robot-stage')).toBeInViewport({ ratio: .99 });
}

for (const reducedMotion of [false, true]) {
  test(`preview before the original portrait and dialogue (reduced motion: ${reducedMotion})`, async ({ page, isMobile }, info) => {
    test.skip(!isMobile, 'Mobile mission presentation');
    test.setTimeout(120000);
    const saved = overview();
    saved.problemStates.accessibility_01 = 'SOLVED';
    saved.problemStates.pollution_01 = 'SOLVED';
    saved.problemStates.pollution_02 = 'AVAILABLE';
    saved.settings = { ...saved.settings, quality: 'MINIMUM', ambientAnimation: false, reducedMotion };
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
        const character = document.querySelector('.problem-dialogue .character-stage');
        const box = document.querySelector('.problem-dialogue .dialogue-box');
        w.flight.push({ ...w.ecoBenchmark.cameraState(), time: performance.now(), dialogue: !!box,
          characterOpacity: character ? Number(getComputedStyle(character).opacity) : 0,
          boxOpacity: box ? Number(getComputedStyle(box).opacity) : 0 });
        if (w.recordingFlight) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.locator('.marker[data-problem="pollution_02"]').click();
    await expectCenteredProblem(page);
    // Both the flight and its settled preview must be free of visual overlays.
    await expect(page.locator('.narrative-stage, .quest-panel, .topbar, .camera-status')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath('mission-preview.png') });
    await page.touchscreen.tap(6, 115);
    await expect(page.locator('.dialogue-box')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Observação do companheiro' })).toBeVisible({ timeout: 10000 });
    await page.locator('.problem-dialogue').evaluate(async el => {
      await Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished));
    });
    const flight = await page.evaluate(() => {
      const w = window as unknown as DiagnosticWindow;
      w.recordingFlight = false;
      return w.flight;
    });
    const arrived = await cameraPose(page);
    const settled = flight.find(p => Math.abs(p.zoom - arrived.zoom) < .001 &&
      p.position.every((value, i) => Math.abs(value - arrived.position[i]) < .001))!;
    const revealed = flight.find(p => p.dialogue)!;
    expect(revealed.time - settled.time).toBeGreaterThanOrEqual(2100);
    if (!reducedMotion) {
      expect(new Set(flight.map(p => p.zoom.toFixed(2))).size).toBeGreaterThan(3);
      expect(flight.some(p => p.characterOpacity > 0 && p.characterOpacity < .95)).toBe(true);
      expect(flight.some(p => p.boxOpacity > 0 && p.boxOpacity < .95)).toBe(true);
    } else {
      expect(await page.locator('.robot-stage, .dialogue-box').evaluateAll(elements =>
        elements.every(el => getComputedStyle(el).animationName === 'none'))).toBe(true);
    }
    expect(await page.locator('canvas').boundingBox()).toEqual(canvasBefore);
    await expectOriginalPortrait(page);
    await page.screenshot({ path: info.outputPath('mission-comment.png') });

    await page.touchscreen.tap(6, 115);
    await expect(page.getByRole('region', { name: 'Contexto do problema' })).toBeVisible();
    await page.getByRole('button', { name: 'Pensar nas soluções →' }).click();
    await expect(page.locator('.alternative')).toHaveCount(3);
    await expectOriginalPortrait(page);
    expect(await cameraPose(page)).toEqual(arrived);
    await page.screenshot({ path: info.outputPath('mission-question.png') });

    const portraitSize = page.viewportSize()!;
    await page.setViewportSize({ width: 844, height: 390 });
    await expectCenteredProblem(page);
    await expectOriginalPortrait(page);
    for (const choice of await page.locator('.alternative').all()) {
      await choice.scrollIntoViewIfNeeded();
      await expect(choice).toBeInViewport({ ratio: .99 });
    }
    await page.screenshot({ path: info.outputPath('mission-landscape.png') });
    await page.setViewportSize(portraitSize);
    await expectCenteredProblem(page);
    await page.locator('.alternative').first().click();
    await expect(page.getByRole('region', { name: 'Resultado da decisão' })).toBeVisible();
    await expectOriginalPortrait(page);
    await page.screenshot({ path: info.outputPath('mission-result.png') });
    await page.getByRole('button', { name: 'Voltar à cidade →' }).click();
    await expect(page.getByRole('button', { name: 'Centralizar mapa' })).toBeEnabled({ timeout: 15000 });
    expect(errors).toEqual([]);
  });
}
