import { defineConfig, devices } from "@playwright/test";
const environment=(globalThis as unknown as {process:{env:Record<string,string>}}).process.env;
const hardware=environment.ECO_HARDWARE==='1';
const externalURL=environment.ECO_BASE_URL;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // These projects render the whole city with CPU-based SwiftShader. Concurrent
  // browsers contend for the same cores and turn navigation waits into timeouts.
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: externalURL??"http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    launchOptions: { args: hardware?["--enable-gpu","--use-angle=d3d11"]:["--use-angle=swiftshader", "--enable-webgl"] },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "small",
      use: {
        viewport: { width: 360, height: 640 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  // A supplied URL validates an already built version, including its exact
  // asset hashes, without rebuilding it as a side effect of browser tests.
  webServer: externalURL?undefined:{
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
