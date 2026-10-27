import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SCREENS = ["eve-gate", "eve-excitement", "eve-herald", "eve-packing", "eve-pass", "eve-honest"];

for (const screen of SCREENS) {
  for (const project of ["mobile-390", "desktop-1440"]) {
    test(`today axe: ${screen} @ ${project}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== project);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/?name=Ayse");
      await page.evaluate((id) => window.__questNavigate(id), screen);
      await page.waitForSelector(`.screen[data-screen="${screen}"].screen--active`);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad, JSON.stringify(bad, null, 2)).toHaveLength(0);
    });
  }
}
