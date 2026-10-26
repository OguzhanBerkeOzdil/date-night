import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

test("dragon Yes hides Nay and honest link within 100ms", async ({ page }) => {
  await page.goto("/?name=Ayse");
  await page.evaluate(() => window.__questNavigate("dragon"));
  await page.waitForSelector('[data-screen="dragon"].screen--active');
  await page.waitForFunction(
    () => document.getElementById("realNoLink")?.classList.contains("honest-link--armed"),
    null,
    { timeout: 8000 }
  );

  await page.evaluate(() => document.getElementById("btnYes")?.click());

  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const link = document.getElementById("realNoLink");
          const nay = document.getElementById("btnNo");
          const linkOff =
            link?.classList.contains("dragon-resolved-hide") &&
            link?.getAttribute("aria-hidden") === "true";
          const nayOff =
            nay?.classList.contains("dragon-resolved-hide") &&
            nay?.getAttribute("aria-hidden") === "true";
          const linkStyle = link ? getComputedStyle(link).visibility : "";
          const nayStyle = nay ? getComputedStyle(nay).visibility : "";
          return linkOff && nayOff && linkStyle === "hidden" && nayStyle === "hidden";
        }),
      { timeout: 100, intervals: [5, 10, 15] }
    )
    .toBe(true);
});
