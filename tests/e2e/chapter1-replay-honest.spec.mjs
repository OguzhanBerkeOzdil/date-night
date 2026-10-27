import { test, expect } from "@playwright/test";
import { completeEveToLock, completeEveName } from "./helpers/eve-path.mjs";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;
  });
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("replay hides Not today and cannot honest-decline accepted invite", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390" && testInfo.project.name !== "mobile-320");
  await page.goto("/");
  await page.locator("#btnNewGame").click();
  await completeEveToLock(page);

  await page.evaluate(() => window.__questNavigate("eve-pass"));
  await page.locator("#btnPlayChapter1Again").click();
  await page.locator("#chapter1ReplayAccept").click();
  await page.waitForSelector('[data-screen="eve-name"].screen--active');

  const honest = page.locator("#btnEveHonest");
  await expect(honest).toBeHidden();

  await page.evaluate(() => document.getElementById("btnEveHonest")?.click());
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(saved.honestNo).toBe(false);
  expect(saved.chapter).not.toBe("declined");
  await expect(page.locator('section[data-screen="eve-name"].screen--active')).toBeVisible();
});

test("return to pass mid-replay does not send completed replay email", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  const posts = [];
  await page.route("**/formsubmit.co/**", (route) => {
    posts.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' });
  });

  await page.goto("/");
  await page.locator("#btnNewGame").click();
  await completeEveToLock(page);

  await page.locator("#btnPlayChapter1AgainLock").click();
  await page.locator("#chapter1ReplayAccept").click();
  await completeEveName(page, "Mina");
  await page.locator("#btnExcitementNext").click();
  await page.locator("#btnPackingNext").click();
  await page.waitForSelector('[data-screen="eve-survey"].screen--active');

  await page.evaluate(() => window.__questNavigate("chapter-lock"));
  await page.locator("#btnBackToPass").click();
  await page.waitForSelector('[data-screen="eve-pass"].screen--active');
  await page.waitForTimeout(300);

  const completedReplays = posts.filter(
    (p) => String(p.outcome || "").includes("completed") && String(p.outcome || "").includes("replay")
  );
  expect(completedReplays.length).toBe(0);
  await expect(page.locator("#passName")).not.toHaveText("");
});

test("replay confirm dialog has parchment panel over lock screen", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390" && testInfo.project.name !== "mobile-320");
  await page.goto("/");
  await page.locator("#btnNewGame").click();
  await completeEveToLock(page);
  await page.locator("#btnPlayChapter1AgainLock").click();

  const dialog = page.locator("#chapter1ReplayConfirm");
  await expect(dialog).toBeVisible();
  const panelBg = await page.locator("#chapter1ReplayConfirm .quest-confirm__panel").evaluate((el) => {
    return getComputedStyle(el).backgroundImage;
  });
  expect(panelBg).not.toBe("none");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
