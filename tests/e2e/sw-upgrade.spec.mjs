import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startDualBuildServer } from "../helpers/dual-build-server.mjs";

const workspace = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = 4175;
const baseURL = `http://127.0.0.1:${PORT}`;

async function extractCommit(commit, dest) {
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  execSync(`git archive ${commit} | tar -x -C "${dest}"`, { cwd: workspace, stdio: "pipe" });
}

async function waitForUpgrade(page, expectedVersion) {
  await expect
    .poll(
      async () =>
        page.evaluate(async (ver) => {
          const keys = await caches.keys();
          const hasOldShell = keys.some((k) => k === "quest-shell-20261026");
          const hasNewShell = keys.some((k) => k.includes(ver));
          const onlyQuestCaches = keys.filter((k) => k.startsWith("quest-"));
          const reg = await navigator.serviceWorker.getRegistration("./");
          const controlled = Boolean(navigator.serviceWorker.controller);
          let mainOk = false;
          let swEvalOk = Boolean(reg?.active?.scriptURL);
          try {
            const res = await fetch(`./js/main.js?v=${ver}`, { cache: "no-store" });
            mainOk = res.ok && res.url.includes(`v=${ver}`);
          } catch (_) {
            mainOk = false;
          }
          return {
            hasOldShell,
            hasNewShell,
            onlyQuestCaches,
            controlled,
            mainOk,
            swEvalOk,
            keys,
          };
        }, expectedVersion),
      { timeout: 10000 }
    )
    .toMatchObject({
      hasOldShell: false,
      hasNewShell: true,
      controlled: true,
      mainOk: true,
      swEvalOk: true,
    });
}

test.describe.configure({ mode: "serial" });

async function runUpgradeScenario(page, oldCommit) {
  const oldRoot = join(workspace, "tests/fixtures/.sw-upgrade-cache", oldCommit);
  await extractCommit(oldCommit, oldRoot);
  const server = await startDualBuildServer({ oldRoot, newRoot: workspace, port: PORT });

  const swErrors = [];
  page.on("pageerror", (err) => {
    if (String(err).includes("ServiceWorker") || String(err).includes("service worker")) {
      swErrors.push(String(err));
    }
  });

  await page.goto(`${baseURL}/?name=Ayse`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 15000 });

  await page.request.post(`${baseURL}/__test/use-new-build`);
  await page.reload({ waitUntil: "domcontentloaded" });

  await waitForUpgrade(page, "20261031");
  expect(swErrors).toEqual([]);

  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("upgrades from classic SW build 2028511 (quest-shell-20261026)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await runUpgradeScenario(page, "2028511");
});

test("upgrades from module SW build a8b1897", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await runUpgradeScenario(page, "a8b1897");
});
