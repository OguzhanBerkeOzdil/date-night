import { hasQuestSave } from "./state.js?v=20261209";
import { chapterOneIsArchived } from "./quest-phase.js?v=20261209";

/** Update Continue visibility — safe to call from any module (no main.js re-import). */
export function syncContinueButton() {
  const btn = document.getElementById("btnContinue");
  const newGame = document.getElementById("btnNewGame");
  const replayButtons = document.querySelectorAll(
    "#btnPlayChapter1Again, #btnPlayChapter1AgainLock"
  );
  if (!btn) return;
  const archived = chapterOneIsArchived();
  newGame?.classList.toggle("hidden", archived);
  replayButtons.forEach((button) => button.classList.toggle("hidden", archived));
  if (archived) {
    btn.textContent = "Continue Chapter II";
    btn.classList.remove("hidden");
    return;
  }
  btn.textContent = "Continue";
  btn.classList.toggle("hidden", !hasQuestSave());
}
