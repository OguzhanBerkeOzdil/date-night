import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ARTIFACT_DIR = join(workspace, "tests/e2e/artifacts/certificate-issue-date");

const BASE_SAVE = {
  schemaVersion: 3,
  chapter: "chapter-two-active",
  chapterOneComplete: true,
  chapterTwoStarted: true,
  chapterTwoComplete: false,
  chapter1Answers: {},
  eveAdventurerName: "",
  steedName: "Clover",
  horseId: "chestnut",
  scheduledDate: "2020-01-01",
  timeZone: "Europe/Warsaw",
  lastScreen: "decree",
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
    globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__ = true;
  });
});

async function captureCertificate(page, testInfo, vp, name) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const fileName = `${vp}-${name}.png`;
  const buf = await page.screenshot({ fullPage: true });
  await writeFile(join(ARTIFACT_DIR, fileName), buf);
  await testInfo.attach(fileName, { body: buf, contentType: "image/png" });
}

async function bootAndRenderCertificate(page, issuedIso) {
  await page.addInitScript(
    ({ save, iso }) => {
      localStorage.setItem(
        "questLady_v3",
        JSON.stringify({ ...save, certificatePassIssuedAt: iso })
      );
    },
    { save: BASE_SAVE, iso: issuedIso }
  );
  await page.goto("/");
  await page.evaluate(async () => {
    const { buildCertificateLines, renderCertificateCanvas } = await import("/js/certificate.js");
    window.__certSummoned = buildCertificateLines("pass", { persistIssueDate: false }).find((l) =>
      l.startsWith("Summoned")
    );
    const canvas = await renderCertificateCanvas("pass");
    canvas.style.cssText = "display:block;max-width:100%;margin:0 auto;";
    document.body.innerHTML = "";
    document.body.appendChild(canvas);
  });
}

for (const vp of ["mobile-390", "desktop-1440"]) {
  test(`certificate shows issue date 29 Oct 2026 @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await bootAndRenderCertificate(page, "2026-10-29");
    await expect.poll(() => page.evaluate(() => window.__certSummoned)).toContain(
      "Thursday 29 October 2026"
    );
    await captureCertificate(page, testInfo, vp, "01-issued-2026-10-29");
  });

  test(`certificate shows issue date 3 Nov 2026 @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await bootAndRenderCertificate(page, "2026-11-03");
    await expect.poll(() => page.evaluate(() => window.__certSummoned)).toContain(
      "Tuesday 3 November 2026"
    );
    await captureCertificate(page, testInfo, vp, "02-issued-2026-11-03");
  });
}
