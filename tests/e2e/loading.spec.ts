import {overview} from '../helpers';
import { test, expect } from "@playwright/test";
import { NarrativeManager } from "../../src/game/NarrativeManager";
import { ProblemManager } from "../../src/game/ProblemManager";

test("abertura animada aparece antes do código do jogo e carrega o favicon", async ({ page }, info) => {
  let release!: () => void;
  const bundle = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/assets/index-*.js", async route => { await bundle; await route.continue(); });
  try {
    await page.goto("./", { waitUntil: "commit" });
    const screen = page.getByRole("region", { name: "Carregamento de Eco City" });
    await expect(screen).toBeVisible();
    await expect(screen.getByRole("progressbar")).toBeVisible();
    await expect(page.locator("#root")).toBeEmpty();
    await expect(page.locator('.loading-impactus')).toHaveJSProperty('complete', true);
    expect(await page.locator('.loading-impactus').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    expect(await page.locator('.loading-impactus').evaluate(el => getComputedStyle(el).animationName)).toBe('loading-float');
    const favicon = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href');
    const icon = await page.request.get(new URL(favicon!, page.url()).href);
    expect(icon.ok()).toBe(true);
    expect(await icon.text()).toContain('Eco City — Impactus');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('abertura.png') });
    release();
    await expect(screen).toBeHidden({ timeout: 60000 });
    await expect(page.getByRole('button', { name: 'JOGAR', exact: true })).toBeEnabled();
  } finally { release(); }
});

test("save restaurado aguarda modelos antes de retornar à cidade", async ({ page }, info) => {
  let progress = overview();
  progress = ProblemManager.select(progress, "accessibility_01");
  progress = NarrativeManager.next(NarrativeManager.next(NarrativeManager.cameraArrived(progress)));
  progress = ProblemManager.decide(progress, "ramp");
  await page.addInitScript(saved => localStorage.setItem("ecoquest.save.v1", saved),
    JSON.stringify({ version: 1, data: progress }));
  let release!: () => void;
  const models = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/assets/models/*.glb", async route => {
    await models;
    await route.continue();
  });
  try {
    const requested = page.waitForRequest("**/assets/models/*.glb");
    await page.goto("./");
    await requested;
    const screen = page.getByRole("region", { name: "Carregamento de Eco City" });
    await expect(screen).toBeVisible();
    await expect(screen).toHaveAttribute('aria-busy', 'true');
    const returnButton = page.getByRole("button", { name: "Voltar à cidade" });
    await expect(returnButton).toHaveCount(0);
    await expect(screen.getByRole("status")).toContainText("Preparando a cidade");
    await page.mouse.click(6, 115);
    await page.keyboard.press('Escape');
    await expect(page.locator('.interface')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath('aguardando-modelos.png') });
    release();
    await expect(screen).toBeHidden({ timeout: 60000 });
    await expect(page.locator('[data-effectiveness="COMPLETE"]')).toBeVisible();
    await returnButton.click();
    await expect(page.getByRole("button", { name: "Analisar: Lixo nas ruas" })).toBeVisible();
    await expect(page.locator(".balance")).toContainText("1.350");
    await expect(page.getByText('A cidade guarda novas histórias.', { exact: true })).toHaveCount(0);
  } finally {
    release();
  }
});

test("falha no modelo mostra uma ação real para tentar novamente", async ({ page }) => {
  let fail = true;
  await page.route('**/assets/models/*.glb', route => fail ? route.abort() : route.continue());
  await page.goto('./');
  await expect(page.locator('.loading-error')).toBeVisible({ timeout: 60000 });
  await expect(page.locator('#game-loading')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.interface')).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('button', { name: 'JOGAR', exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.locator('#game-loading')).toBeHidden();
});

test("abertura respeita movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release!: () => void;
  const bundle = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/index-*.js', async route => { await bundle; await route.continue(); });
  try {
    await page.goto('./', { waitUntil: 'commit' });
    await expect(page.locator('#game-loading')).toBeVisible();
    expect(await page.locator('.loading-impactus').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    expect(await page.locator('.loading-track span').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    release();
    await expect(page.getByRole('button', { name: 'JOGAR', exact: true })).toBeVisible({ timeout: 60000 });
  } finally { release(); }
});

test("falha no código principal permite recarregar sem depender de React", async ({ page }) => {
  await page.route('**/assets/index-*.js', route => route.abort());
  await page.goto('./');
  await expect(page.locator('.loading-error')).toBeVisible();
  await expect(page.locator('#game-loading')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#root')).toBeEmpty();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
});
