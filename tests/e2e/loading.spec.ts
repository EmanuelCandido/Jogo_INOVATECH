import {overview} from '../helpers';
import { test, expect } from "@playwright/test";
import { initialProgress } from "../../src/game/save";
import { NarrativeManager } from "../../src/game/NarrativeManager";
import { ProblemManager } from "../../src/game/ProblemManager";

test("save restaurado aguarda modelos antes de retornar à cidade", async ({ page }) => {
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
    await page.goto("/");
    await requested;
    await expect(page.locator('[data-effectiveness="COMPLETE"]')).toBeVisible();
    const returnButton = page.getByRole("button", { name: "Voltar à cidade" });
    await expect(returnButton).toBeDisabled();
    await expect(page.getByRole("status")).toContainText("Preparando a cidade");
    release();
    await returnButton.click();
    await expect(page.getByRole("button", { name: "Analisar: Lixo nas ruas" })).toBeVisible();
    await expect(page.locator(".balance")).toContainText("1.350");
  } finally {
    release();
  }
});
