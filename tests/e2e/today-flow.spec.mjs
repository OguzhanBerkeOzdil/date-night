import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("eve flow through quest pass", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.goto("/today/?name=Ayse");
  await page.locator("#btnGateNext").click();
  await expect(page.locator('[data-screen="excitement"].today-screen--active')).toBeVisible();
  await page.locator("#btnExcitementNext").click();
  await page.locator("#heraldChoices button").first().click();
  await page.locator("#heraldChoices button").first().click();
  await page.locator("#heraldChoices button").first().click();
  await page.locator("#btnHeraldNext").click();
  await page.locator("#btnPackingNext").click();
  await expect(page.locator("#passName")).toHaveText("Ayse");
});

test("honest exit on eve", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/today/");
  await page.locator("#stickyHonestExit").click();
  await expect(page.locator('[data-screen="honest"].today-screen--active')).toBeVisible();
});
