import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("eve flow through quest pass", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.goto("/?name=Ayse");
  await page.locator("#btnNewGame").click();
  await page.waitForSelector('[data-screen="eve-gate"].screen--active');
  await page.locator("#guestNameInput").fill("Ayse");
  await page.locator("#btnGateNext").click();
  await page.waitForSelector('[data-screen="eve-excitement"].screen--active');
  await page.locator("#btnExcitementNext").click();
  for (let i = 0; i < 3; i++) {
    await page.locator("#heraldChoices button").first().click();
    await page.waitForTimeout(700);
  }
  await page.locator("#btnHeraldNext").click();
  await page.locator("#btnPackingNext").click();
  await expect(page.locator("#passName")).toHaveText("Ayse");
});

test("honest exit on eve", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/?name=Ayse");
  await page.locator("#btnNewGame").click();
  await page.waitForSelector('[data-screen="eve-gate"].screen--active');
  await page.locator("#btnEveHonest").click();
  await expect(page.locator('section[data-screen="eve-honest"].screen--active')).toBeVisible();
});
