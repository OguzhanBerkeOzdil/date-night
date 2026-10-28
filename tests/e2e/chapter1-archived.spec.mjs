import { test, expect } from "@playwright/test";

for (const project of ["mobile-390", "desktop-1440"]) {
  test(`production skips the finished Chapter I @ ${project}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== project);
    await page.addInitScript(() => localStorage.clear());
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator('[data-screen="chapter-two-start"].screen--active')).toBeVisible();
    await expect(page.locator("#btnNewGame")).toBeHidden();
    await expect(page.locator("#btnPlayChapter1Again")).toBeHidden();
    await expect(page.locator("#btnPlayChapter1AgainLock")).toBeHidden();

    await page.evaluate(() => window.__questNavigate("eve-name"));
    await expect(page.locator('[data-screen="chapter-two-start"].screen--active')).toBeVisible();
    await expect(page.locator('[data-screen="eve-name"].screen--active')).toHaveCount(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("the old /today Chapter I link returns to Chapter II", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/today/");
  await page.waitForURL(/\/$/);
  await expect(page.locator('[data-screen="chapter-two-start"].screen--active')).toBeVisible();
});
