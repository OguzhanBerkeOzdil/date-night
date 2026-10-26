import { hasQuestSave } from "./state.js";

/** Update Continue visibility — safe to call from any module (no main.js re-import). */
export function syncContinueButton() {
  const btn = document.getElementById("btnContinue");
  if (!btn) return;
  if (hasQuestSave()) btn.classList.remove("hidden");
  else btn.classList.add("hidden");
}
