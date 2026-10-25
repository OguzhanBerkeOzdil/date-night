import { COPY } from "./config.js";
import { hideDialogue, say, setPortrait, setSteedName } from "./dialogue.js";
import { unlock } from "./achievements.js";
import { state } from "./state.js";

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

export function initBardQuill() {
  document.querySelectorAll(".screen[data-screen]").forEach((section) => {
    const id = section.dataset.screen;
    if (!BARD_SCREENS.has(id)) return;
    const inner = section.querySelector(".screen__inner");
    if (!inner || inner.querySelector(".bard-quill")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bard-quill";
    btn.setAttribute("aria-label", "The bard recites a line");
    btn.textContent = "🪶";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      reciteBardLine();
    });
    inner.appendChild(btn);
  });
}

export function syncBardQuill(screenId) {
  document.querySelectorAll(".bard-quill").forEach((btn) => {
    const on = BARD_SCREENS.has(screenId);
    btn.classList.toggle("hidden", !on);
  });
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
