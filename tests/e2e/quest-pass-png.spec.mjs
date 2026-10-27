import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("quest pass PNG loads assets without 404 and is not flat", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  const badUrls = [];
  page.on("response", (res) => {
    if (res.status() === 404) badUrls.push(res.url());
  });
  page.on("pageerror", (err) => badUrls.push(`error:${err.message}`));

  await page.goto("/?name=Ayse");
  const variance = await page.evaluate(async () => {
    const mod = await import("/js/today/pass.js");
    const canvas = await mod.renderQuestPassCanvas("Ayse");
    const ctx = canvas.getContext("2d");
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let min = 255;
    let max = 0;
    for (let y = 0; y < height; y += 8) {
      for (let x = 0; x < width; x += 8) {
        const i = (y * width + x) * 4;
        const v = data[i];
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
    return max - min;
  });

  const asset404 = badUrls.filter((u) => /parchment|wax-seal/i.test(u));
  expect(asset404).toEqual([]);
  expect(variance).toBeGreaterThan(25);

  const sealCheck = await page.evaluate(async () => {
    const pass = await import("/js/today/pass.js");
    const { analyzeQuestPassSeal, analyzePassBottomRoll } = await import(
      "/js/pass-seal-analysis.js"
    );
    const parchment = new Image();
    parchment.src = "/assets/images/parchment.webp";
    await parchment.decode();
    const canvas = await pass.renderQuestPassCanvas("Ayse");
    return {
      seal: analyzeQuestPassSeal(canvas),
      roll: analyzePassBottomRoll(canvas, parchment),
    };
  });
  expect(sealCheck.seal.hasMaroonFrame).toBe(false);
  expect(sealCheck.seal.sealOverlapsRoll).toBe(false);
  expect(sealCheck.seal.waxBlobCount).toBeLessThanOrEqual(1);
  expect(sealCheck.roll.resemblesSource).toBe(true);
  expect(sealCheck.roll.whiteStripPixels).toBeLessThan(4);
  expect(sealCheck.roll.flatBandVariance).toBeGreaterThan(40);
});
