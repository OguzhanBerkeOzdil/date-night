import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAPTER_I_TESTA_OWNER, chapter1TestaSeedToken } from "./fixtures/chapter1-testa-seed.mjs";

const workspace = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ARTIFACT_DIR = join(workspace, "tests/e2e/artifacts/ch1-empty-profile");

const PLAIN_CH2_SAVE = {
  schemaVersion: 3,
  chapter: "chapter-two-active",
  chapterOneComplete: true,
  chapterTwoStarted: true,
  chapterTwoComplete: false,
  chapter1Answers: {},
  eveAdventurerName: "",
  steedName: "Sir Biscuit",
  steedClass: "",
  steedClassPicked: false,
  horseId: "palomino",
  scheduledDate: "2020-01-01",
  timeZone: "Europe/Warsaw",
  lastScreen: "sheet",
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
    globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__ = true;
  });
});

async function captureShot(page, testInfo, vp, name) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const fileName = `${vp}-${name}.png`;
  const buf = await page.screenshot({ fullPage: true });
  await writeFile(join(ARTIFACT_DIR, fileName), buf);
  await testInfo.attach(fileName, { body: buf, contentType: "image/png" });
}

for (const vp of ["mobile-390", "desktop-1440"]) {
  test(`plain link sheet has no em-dash class card @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await page.addInitScript((save) => {
      localStorage.setItem("questLady_v3", JSON.stringify(save));
    }, PLAIN_CH2_SAVE);
    await page.goto("/");
    await page.evaluate(() => window.__questNavigate("sheet"));
    await page.waitForSelector('section[data-screen="sheet"].screen--active');
    await expect(page.getByText("From your Chapter I census")).toHaveCount(0);
    await expect(page.locator("#classChosen")).not.toContainText("Class on file");
    await expect(page.locator("#classChosen")).not.toContainText("—");
    await captureShot(page, testInfo, vp, "01-sheet-plain");
  });

  test(`plain link certificate omits empty profile lines @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await page.addInitScript((save) => {
      localStorage.setItem("questLady_v3", JSON.stringify(save));
    }, { ...PLAIN_CH2_SAVE, lastScreen: "decree" });
    await page.goto("/");
    await page.evaluate(async () => {
      const { buildCertificateLines, renderCertificateCanvas } = await import("/js/certificate.js");
      const lines = buildCertificateLines("pass");
      if (lines.join("\n").match(/Class:/)) throw new Error("unexpected Class line");
      const canvas = await renderCertificateCanvas("pass");
      canvas.id = "certPreviewShot";
      canvas.style.cssText = "display:block;max-width:100%;margin:0 auto;";
      document.body.innerHTML = "";
      document.body.appendChild(canvas);
    });
    await captureShot(page, testInfo, vp, "02-certificate-plain");
  });

  test(`seed certificate shows Chapter I class @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    const token = chapter1TestaSeedToken();
    await page.addInitScript((save) => {
      localStorage.setItem("questLady_v3", JSON.stringify(save));
    }, {
      ...PLAIN_CH2_SAVE,
      chapter1Answers: CHAPTER_I_TESTA_OWNER.survey,
      eveAdventurerName: "Testa",
      lastScreen: "decree",
    });
    await page.goto(`/?seed=${token}`);
    await page.evaluate(async () => {
      const { buildCertificateLines, renderCertificateCanvas } = await import("/js/certificate.js");
      const text = buildCertificateLines("pass").join("\n");
      if (!text.includes("Class: Pacifist potato farmer")) throw new Error("missing seed class");
      const canvas = await renderCertificateCanvas("pass");
      canvas.id = "certPreviewShot";
      canvas.style.cssText = "display:block;max-width:100%;margin:0 auto;";
      document.body.innerHTML = "";
      document.body.appendChild(canvas);
    });
    await captureShot(page, testInfo, vp, "03-certificate-seed");
  });
}
