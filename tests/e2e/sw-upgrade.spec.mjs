import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startDualBuildServer } from "../helpers/dual-build-server.mjs";

const workspace = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = 4175;
const baseURL = `http://127.0.0.1:${PORT}`;
const TARGET_VERSION = "20261124";

function assertCommitExists(commit) {
  try {
    execSync(`git cat-file -e ${commit}^{commit}`, { cwd: workspace, stdio: "pipe" });
  } catch {
    throw new Error(
      `Git commit ${commit} is not available in this checkout. CI needs actions/checkout fetch-depth: 0.`
    );
  }
}

async function extractCommit(commit, dest) {
  assertCommitExists(commit);
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  execSync(`git archive ${commit} | tar -x -C "${dest}"`, { cwd: workspace, stdio: "pipe" });
}

async function evaluateIgnoringNav(page, fn, arg) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      return await page.evaluate(fn, arg);
    } catch (err) {
      const msg = String(err);
      if (!msg.includes("Execution context was destroyed")) throw err;
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(150);
    }
  }
  throw new Error("page.evaluate failed after navigation retries");
}

async function waitForUpgrade(page, expectedVersion) {
  await expect
    .poll(
      async () =>
        evaluateIgnoringNav(page, async (ver) => {
          const keys = await caches.keys();
          const hasOldShell = keys.some((k) => k === "quest-shell-20261026");
          const hasNewShell = keys.some((k) => k.includes(ver));
          const reg = await navigator.serviceWorker.getRegistrations();
          const swUrls = reg.map(
            (r) => r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || ""
          );
          const controlled = Boolean(navigator.serviceWorker.controller);
          let mainOk = false;
          try {
            const res = await fetch(`./js/main.js?v=${ver}`, { cache: "no-store" });
            mainOk = res.ok && res.url.includes(`v=${ver}`);
          } catch (_) {
            mainOk = false;
          }
          return {
            hasOldShell,
            hasNewShell,
            controlled,
            mainOk,
            swUrls,
            keys,
          };
        }, expectedVersion),
      { timeout: 15000 }
    )
    .toMatchObject({
      hasOldShell: false,
      hasNewShell: true,
      controlled: true,
      mainOk: true,
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

  await waitForUpgrade(page, TARGET_VERSION);
  expect(swErrors).toEqual([]);

  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

async function runSingleAutoReloadUpgrade(page, oldCommit) {
  const oldRoot = join(workspace, "tests/fixtures/.sw-upgrade-cache", `qa16-${oldCommit}`);
  await extractCommit(oldCommit, oldRoot);
  const server = await startDualBuildServer({ oldRoot, newRoot: workspace, port: PORT });

  const swErrors = [];
  page.on("pageerror", (err) => {
    const msg = String(err);
    if (msg.includes("ServiceWorker") || msg.includes("service worker")) swErrors.push(msg);
  });

  await page.goto(`${baseURL}/?name=Ayse`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.removeItem("quest-sw-session-reloaded");
    sessionStorage.removeItem("quest-sw-auto-reload-count");
    sessionStorage.removeItem("quest-sw-pending-reload");
    localStorage.setItem(
      "questLady_v2",
      JSON.stringify({ lastScreen: "dragon", steedName: "KeepMe", rating: 10 })
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
    timeout: 15000,
  });

  await page.evaluate(async () => {
    const foreign = await caches.open("other-app-v1");
    await foreign.put("/other-app-dummy", new Response("keep-me"));
  });

  await page.request.post(`${baseURL}/__test/use-new-build`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  await waitForUpgrade(page, TARGET_VERSION);
  expect(swErrors).toEqual([]);

  const metrics = await evaluateIgnoringNav(page, async (ver) => {
    const autoReloads = sessionStorage.getItem("quest-sw-auto-reload-count");
    const save = JSON.parse(localStorage.getItem("questLady_v2") || "{}");
    const keys = await caches.keys();
    const regs = await navigator.serviceWorker.getRegistrations();
    const swUrls = regs
      .map((r) => r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || "")
      .filter(Boolean);
    const foreign = await caches.open("other-app-v1");
    const foreignRes = await foreign.match("/other-app-dummy");
    const questKeys = keys.filter((k) => k.startsWith("quest-"));
    return {
      autoReloads,
      steedName: save.steedName,
      swUrls,
      questKeys,
      foreignOk: foreignRes ? await foreignRes.text() : null,
      hasOld61101: keys.includes("quest-shell-20261101"),
      hasOld61102: keys.some((k) => k.includes(ver)),
    };
  }, TARGET_VERSION);

  expect(metrics.autoReloads).toBe("1");
  expect(metrics.steedName).toBe("KeepMe");
  expect(metrics.foreignOk).toBe("keep-me");
  expect(metrics.hasOld61101).toBe(false);
  expect(metrics.hasOld61102).toBe(true);
  expect(metrics.questKeys.every((k) => k.includes(TARGET_VERSION))).toBe(true);
  expect(metrics.swUrls.filter((u) => u.includes("sw.js")).length).toBe(1);
  expect(metrics.swUrls[0]).toMatch(/\/sw\.js$/);

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

test("single auto-reload from 4dc3a62 (sw.js?v=20261031)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await runSingleAutoReloadUpgrade(page, "4dc3a62");
});

test("single auto-reload from 7f07b48 (sw.js?v=20261101)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await runSingleAutoReloadUpgrade(page, "7f07b48");
});
