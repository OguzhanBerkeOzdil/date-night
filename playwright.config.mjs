import { defineConfig } from "@playwright/test";

const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-320", width: 320, height: 640 },
  { name: "mobile-360", width: 360, height: 740 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "node tests/helpers/static-server.mjs",
    port: 4173,
    reuseExistingServer: true,
  },
  projects: viewports.map((vp) => ({
    name: vp.name,
    use: {
      browserName: "chromium",
      viewport: { width: vp.width, height: vp.height },
      ...(vp.width < 1024 ? { hasTouch: true, isMobile: true } : {}),
    },
  })),
});
