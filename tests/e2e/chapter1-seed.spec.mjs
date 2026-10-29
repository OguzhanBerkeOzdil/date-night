import { test, expect } from "@playwright/test";
import {
  buildWireSeedFromOwnerJson,
  encodeSeedToBase64Url,
} from "../../js/seed-link.js?v=20261209";

const FAKE = {
  name: "Seed Adventurer",
  excitement: 4,
  packing: ["snacks"],
  horse: "chestnut",
  outcome: "yes",
  survey: {
    class: { id: "potato", label: "Pacifist potato farmer" },
    weapon: { id: "sword", label: "Sword" },
    companion: { id: "goose", label: "Goose (traitor — will betray you)" },
    tavern: { id: "mead", label: "Mead" },
    gerald: { value: 500, label: "500 potatoes" },
  },
};

test("seed link pre-fills recap on a fresh device", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  const token = encodeSeedToBase64Url(buildWireSeedFromOwnerJson(FAKE));
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: undefined,
  });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
    globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__ = true;
  });
  await page.goto(`/?seed=${token}`);
  await page.waitForFunction(() => !globalThis.location.search.includes("seed="));
  await page.evaluate(() => window.__questNavigate("chapter-two-start"));
  await page.waitForSelector('[data-screen="chapter-two-start"].screen--active');
  await expect(page.locator("#questRecap")).toContainText("Pacifist potato farmer");
  await context.close();
});
