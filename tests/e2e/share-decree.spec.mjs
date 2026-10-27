import { test, expect } from "@playwright/test";
import { reachDecreeMouse } from "./helpers/quest-path.mjs";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

test("share AbortError does not open WhatsApp fallback", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await reachDecreeMouse(page);
  await page.evaluate(() => {
    const blob = new Blob(["x"], { type: "image/png" });
    window.__decreeBlob = blob;
  });
  await page.evaluate(() => {
    navigator.canShare = () => true;
    navigator.share = async () => {
      const err = new Error("cancelled");
      err.name = "AbortError";
      throw err;
    };
  });

  const popups = [];
  page.on("popup", (p) => popups.push(p.url()));

  await page.locator("#btnShare").click();
  await page.waitForTimeout(800);

  const waPopups = popups.filter((u) => /whatsapp/i.test(u));
  expect(waPopups).toHaveLength(0);
});

test("share technical error falls back to WhatsApp", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await reachDecreeMouse(page);
  await page.evaluate(() => {
    navigator.canShare = () => true;
    navigator.share = async () => {
      throw new Error("share failed");
    };
  });

  let popupUrl = "";
  page.on("popup", async (p) => {
    await p.waitForLoadState("domcontentloaded").catch(() => {});
    popupUrl = p.url();
  });

  await page.locator("#btnShare").click();
  await page.waitForTimeout(1500);
  expect(popupUrl).toMatch(/whatsapp/i);
});

test("copy shows manual message when clipboard fails", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await reachDecreeMouse(page);
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("denied");
    };
  });
  await page.locator("#btnCopy").click();
  await expect(page.locator("#copyToast")).toContainText("copy manually");
});

test("copy shows Copied when clipboard succeeds", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await reachDecreeMouse(page);
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {};
  });
  await page.locator("#btnCopy").click();
  await expect(page.locator("#copyToast")).toContainText("Copied!");
});

test("save PNG failure shows toast", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await reachDecreeMouse(page);
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (cb) {
      cb(null);
    };
  });
  await page.locator("#btnSavePng").click();
  await expect(page.locator(".app-toast")).toContainText("Couldn't save");
});
