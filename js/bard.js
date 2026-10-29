import { COPY } from "./config.js?v=20261209";
import { hideDialogue, say, setPortrait, setSteedName } from "./dialogue.js?v=20261209";
import { unlock } from "./achievements.js?v=20261209";
import { state } from "./state.js?v=20261209";

const BARD_SCREENS = new Set([
  "summons",
  "sheet",
  "journal",
  "tavern",
  "potion",
  "stars",
  "oracle",
  "decree",
]);

let pool = [];
let taps = 0;
let hideTimer = null;

function refillPool() {
  pool = [...COPY.bardLines];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
}

function nextLine() {
  if (!pool.length) refillPool();
  return pool.pop();
}

function reciteBardLine() {
  if (hideTimer) clearTimeout(hideTimer);
  const line = nextLine().replace(/\{steed\}/g, state.steedName || "the steed");
  setPortrait("");
  setSteedName("The Bard");
  say([line], () => hideDialogue());
  taps++;
  if (taps >= 3) unlock("bard");
  hideTimer = window.setTimeout(() => hideDialogue(), 4000);
}

export function initBardQuill() {
  const btn = document.getElementById("btnBardHud");
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    reciteBardLine();
  });
  document.querySelectorAll(".screen__inner .bard-quill").forEach((el) => el.remove());
}

export function syncBardQuill(screenId) {
  const btn = document.getElementById("btnBardHud");
  if (!btn) return;
  const on = BARD_SCREENS.has(screenId);
  btn.classList.toggle("hidden", !on);
}
