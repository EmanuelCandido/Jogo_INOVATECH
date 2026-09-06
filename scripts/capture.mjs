import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-webgl"],
});
for (const [name, options] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["mobile", { ...devices["Pixel 7"] }],
  [
    "small",
    { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
  ],
]) {
  if (process.argv[2] && name !== process.argv[2]) continue;
  const page = await browser.newPage(options);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.url().includes("/assets/models/") && !response.ok())
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("http://127.0.0.1:5173");
  await page.waitForLoadState("networkidle");
  await page.locator(".scene-loading").waitFor({ state: "hidden" });
  await page.waitForTimeout(2400);
  await page.screenshot({ path: `docs/screenshots/${name}-intro.png` });
  await page.getByRole("button", { name: "Continuar →", exact: true }).click();
  await page.getByRole("button", { name: "Vamos conhecer a cidade" }).click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `docs/screenshots/${name}-overview.png` });
  await page
    .getByRole("button", { name: "Analisar: Uma praça para todos" })
    .click();
  await page.getByRole("button", { name: "Pensar nas soluções" }).click();
  await page.waitForTimeout(1600);
  console.log(name, "question viewport", await page.evaluate(() => ({
    x: scrollX, y: scrollY, innerWidth,
    viewport: { width: visualViewport.width, offsetLeft: visualViewport.offsetLeft, scale: visualViewport.scale },
    game: document.querySelector('.game').getBoundingClientRect().toJSON(),
  })));
  await page.screenshot({ path: `docs/screenshots/${name}-question.png` });
  await page.locator(".alternative").first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `docs/screenshots/${name}-full.png` });
  console.log(
    name,
    await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      buttons: [...document.querySelectorAll(".result button")].map((b) => ({
        text: b.textContent,
        rect: b.getBoundingClientRect().toJSON(),
      })),
    })),
  );
  await page.close();
  if (errors.length) throw new Error(`${name}: ${errors.join("; ")}`);
}
await browser.close();
