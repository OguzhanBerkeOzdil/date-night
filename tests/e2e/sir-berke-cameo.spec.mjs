import { test, expect } from "@playwright/test";

function overlaps(a, b) {
  if (!a || !b) return false;
  const ar = a.x + a.width;
  const ab = a.y + a.height;
  const br = b.x + b.width;
  const bb = b.y + b.height;
  return !(ar <= b.x || a.x >= br || ab <= b.y || a.y >= bb);
}

async function assertCameoClearOfInteractives(page, targets) {
  const cameo = await page.locator("#sirBerkeImg").boundingBox();
  for (const sel of targets) {
    const el = page.locator(sel).first();
    if (!(await el.count())) continue;
    if (!(await el.isVisible())) continue;
    const box = await el.boundingBox();
    expect(overlaps(cameo, box)).toBe(false);
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const vp of ["mobile-320", "mobile-390", "desktop-1440"]) {
  test(`Sir Berke cameo does not cover buttons @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await page.goto("/?name=Ayse");
    await page.locator("#btnNewGame").click();
    await page.waitForSelector('[data-screen="eve-name"].screen--active');
    await expect(page.locator("#sirBerkeCameo")).toBeVisible();
    await assertCameoClearOfInteractives(page, [
      "#btnEveHonest",
      "#btnHeraldNameConfirm",
      "#btnHeraldNameAdventurer",
    ]);

    await page.locator("#btnHeraldNameConfirm").click();
    await page.locator("#btnExcitementNext").click();
    await page.locator("#btnPackingNext").click();
    await page.waitForSelector('[data-screen="eve-survey"].screen--active');
    await page.locator("#btnSurveySkip").click();
    await page.waitForSelector("#surveyCharacter", { hasText: "Sir Reginald" });
    await expect(page.locator("#sirBerkeCameo")).toBeVisible();
    await assertCameoClearOfInteractives(page, ["#btnSurveySkip", ".weapon-card"]);
  });
}

test("certificate PNG builder includes realm notes", async ({ page }) => {
  await page.goto("/?name=Ayse");
  const lines = await page.evaluate(async () => {
    const { buildCertificateLines } = await import("/js/certificate.js");
    return buildCertificateLines();
  });
  expect(lines.some((l) => l.includes("Official notes from the realm"))).toBe(true);
  expect(lines.some((l) => l.includes("Gerald has filed"))).toBe(true);
});
