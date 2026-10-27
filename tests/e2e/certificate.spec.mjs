import { test, expect } from "@playwright/test";
import { reachDecreeMouse } from "./helpers/quest-path.mjs";

test("quest certificate button saves PNG", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, body: "{}" })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await reachDecreeMouse(page);
  await expect(page.locator("#btnSaveCertificate")).toBeVisible();
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (cb) {
      cb(new Blob(["x"], { type: "image/png" }));
    };
  });
  await page.locator("#btnSaveCertificate").click();
});
