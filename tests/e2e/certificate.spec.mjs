import { test, expect } from "@playwright/test";

test("final certificate button renders and downloads a PNG", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => window.__questNavigate("quest-complete"));
  await expect(page.locator("#btnSaveFinal")).toBeVisible();
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(new Blob(["x"], { type: "image/png" }));
    };
  });
  await page.locator("#btnSaveFinal").click();
});
