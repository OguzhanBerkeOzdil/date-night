import { test, expect } from "@playwright/test";
import { reachEvePass } from "./helpers/eve-path.mjs";

function overlaps(a, b) {
  if (!a || !b) return false;
  const ar = a.x + a.width;
  const ab = a.y + a.height;
  const br = b.x + b.width;
  const bb = b.y + b.height;
  return !(ar <= b.x || a.x >= br || ab <= b.y || a.y >= bb);
}

async function assertCameoClearOfInteractives(page, targets) {
  const cameo = await page.locator("#sirBerkeCameo").boundingBox();
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

  test(`Sir Berke cameo clears final pass controls @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await page.goto("/?name=Test");
    await reachEvePass(page);
    await expect(page.locator("#sirBerkeCameo")).toBeVisible();
    await assertCameoClearOfInteractives(page, [
      "#btnSavePass",
      "#btnEveContinue",
      "#passClosing",
      "#passName",
      ".title",
    ]);
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
  expect(lines.some((l) => l.includes("No destiny speeches"))).toBe(false);
  expect(lines.some((l) => /Second quest: (officially unlocked|seal pending)/i.test(l))).toBe(true);
});

test("certificate uses adventurer name without Lady prefix", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("questLady_v3", JSON.stringify({
      schemaVersion: 3,
      eveAdventurerName: "Test",
      chapter1SealedName: "Test",
      lastScreen: "title",
    }));
  });
  await page.goto("/");
  const adventurerLine = await page.evaluate(async () => {
    const { buildCertificateLines } = await import("/js/certificate.js");
    return buildCertificateLines().find((l) => l.startsWith("Adventurer:"));
  });
  expect(adventurerLine).toBe("Adventurer: Test");
});

test("certificate PNG keeps parchment baked seal only", async ({ page }) => {
  await page.goto("/?name=Test");
  const sealCheck = await page.evaluate(async () => {
    const { renderCertificateCanvas } = await import("/js/certificate.js");
    const { analyzeCertificateSeal } = await import("/js/pass-seal-analysis.js");
    const parchment = new Image();
    parchment.src = "/assets/images/parchment.webp";
    await parchment.decode();
    const canvas = await renderCertificateCanvas();
    return analyzeCertificateSeal(canvas, parchment);
  });
  expect(sealCheck.hasDrawnWaxSeal).toBe(false);
  expect(sealCheck.usesBakedSealOnly).toBe(true);
});

for (const mode of ["pass", "completion"]) {
  test(`certificate layout has no line overlap (${mode})`, async ({ page }) => {
    await page.goto("/?name=Test");
    const result = await page.evaluate(async (m) => {
      const {
        renderCertificateCanvas,
        certificateLineBoxes,
        validateCertificateLayout,
        CERT_MIN_HEIGHT,
      } = await import("/js/certificate.js");
      const canvas = await renderCertificateCanvas(m);
      const g = canvas.getContext("2d");
      const metrics = certificateLineBoxes(g, m, canvas.height);
      const check = validateCertificateLayout(metrics);
      const metricsDefault = certificateLineBoxes(g, m, CERT_MIN_HEIGHT);
      const checkDefault = validateCertificateLayout(metricsDefault);
      return { check, checkDefault, height: canvas.height };
    }, mode);
    expect(result.check.ok).toBe(true);
    expect(result.check.issues).toEqual([]);
    expect(result.checkDefault.ok).toBe(true);
    expect(result.checkDefault.issues).toEqual([]);
  });
}
