import { test, expect } from "@playwright/test";
import { tabTo, activate, waitForScreen } from "./helpers/keyboard.mjs";
import { runQuestToDecreeKeyboard, runQuestToDragonKeyboard } from "./helpers/quest-path.mjs";

const KEYBOARD_PROJECTS = new Set(["mobile-390", "desktop-1440"]);

test.use({ hasTouch: false });

test.beforeEach(async ({ page }, testInfo) => {
  if (!KEYBOARD_PROJECTS.has(testInfo.project.name)) {
    test.skip();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

test("keyboard-only: title through decree", async ({ page }) => {
  await runQuestToDecreeKeyboard(page);
  await expect(page.locator("#decreePreview")).toContainText("ADVENTURER'S PASS");
});

test("keyboard-only: title through honest-no", async ({ page }) => {
  await runQuestToDragonKeyboard(page);
  await tabTo(page, "#btnNo");
  await activate(page);
  await waitForScreen(page, "honest-no");
  await expect(page.locator('[data-screen="honest-no"].screen--active .title')).toContainText(
    "honest answer"
  );
});
