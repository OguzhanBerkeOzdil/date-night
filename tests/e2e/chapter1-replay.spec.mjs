import { test, expect } from "@playwright/test";
import { completeEveToLock, skipChapter1Survey, completeEveName } from "./helpers/eve-path.mjs";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;
  });
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("play again resets Chapter I without duplicate completed idempotency", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  const posts = [];
  await page.route("**/formsubmit.co/**", (route) => {
    posts.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' });
  });

  await page.goto("/");
  await page.locator("#btnNewGame").click();
  await completeEveToLock(page);

  await page.evaluate(() => window.__questNavigate("eve-pass"));
  await page.waitForSelector('[data-screen="eve-pass"].screen--active');
  await page.locator("#btnPlayChapter1Again").click();
  await expect(page.locator("#chapter1ReplayConfirm")).toBeVisible();
  await page.locator("#chapter1ReplayAccept").click();
  await page.waitForSelector('[data-screen="eve-name"].screen--active');

  const mid = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(mid.chapterOneComplete).toBe(false);
  expect(mid.chapter1ReplayCount).toBe(1);

  await completeEveName(page, "Mina");
  await page.locator("#btnExcitementNext").click();
  await page.locator("#btnPackingNext").click();
  await skipChapter1Survey(page);
  await page.waitForSelector('[data-screen="eve-pass"].screen--active');
  await page.waitForTimeout(400);

  const completed = posts.filter((p) => String(p.outcome || "").includes("completed"));
  const ids = completed.map((p) => p.idempotencyId);
  expect(completed.length).toBeGreaterThanOrEqual(2);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.some((id) => /-r\d+$/.test(id))).toBe(true);
});
