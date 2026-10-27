import { test, expect } from "@playwright/test";

test("all three quest answers remain visible and stable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?name=Ayse");
  await page.evaluate(() => window.__questNavigate("dragon"));
  for (const selector of ["#btnYes", "#btnMaybe", "#btnNo"]) {
    await expect(page.locator(selector)).toBeVisible();
    const before = await page.locator(selector).boundingBox();
    await page.locator(selector).hover();
    const after = await page.locator(selector).boundingBox();
    expect(after.x).toBeCloseTo(before.x, 0);
    expect(after.y).toBeCloseTo(before.y, 0);
  }
});
