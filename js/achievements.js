import { playDing, vibrate } from "./audio.js?v=20261210";
import { state, saveState } from "./state.js?v=20261210";
import { icons } from "./icons.js?v=20261210";

export const MAIN_ACHIEVEMENT_IDS = [
  "seal",
  "whisperer",
  "snack",
  "charm",
  "charts",
  "dragon",
  "fanum",
  "alchemist",
  "fortune",
  "heart",
];

const DEFS = {
  seal: { id: "seal", title: "Seal Breaker", desc: "You opened a royal letter. Very official of you." },
  whisperer: { id: "whisperer", title: "Horse Whisperer", desc: "Gave 5 head scratches." },
  snack: { id: "snack", title: "Snack Diplomat", desc: "Bribed a horse with a carrot. Classic." },
  charm: { id: "charm", title: "Critical Charm", desc: "Rolled a natural 20. The dice have a favourite." },
  charts: { id: "charts", title: "Off the Charts", desc: "Broke the rating scale." },
  dragon: { id: "dragon", title: "Dragon Befriender", desc: "Defeated doubt with a single word." },
  fanum: { id: "fanum", title: "Ancient Law Respected", desc: "Accepted the fanum tax. Gracefully." },
  alchemist: { id: "alchemist", title: "Master Alchemist", desc: "Brewed a perfect date potion." },
  fortune: { id: "fortune", title: "Fortune Favoured", desc: "Drew a card from the oracle." },
  heart: { id: "heart", title: "Stole the Show", desc: "Rarity: 1 of 1. Quest complete." },
  stubborn: { id: "stubborn", title: "Stubborn Thumb", desc: "Tried to say no 3 times. Bold.", bonus: true },
  fate: { id: "fate", title: "Fate Tempter", desc: "The coin refused to choose.", bonus: true },
  bard: { id: "bard", title: "Bard's Favourite Audience", desc: "Heard 3 lines from the bard. Survived the cheese.", bonus: true },
};

const MAX_ACHIEVEMENT_TOASTS = 1;
const TOAST_VISIBLE_MS = 2500;
const SUPPRESS_TOAST_SCREENS = new Set(["chapter-two-finish", "quest-complete", "honest-no"]);
const toastQueue = [];
let toastDrainActive = false;
let toastPausedForChoices = false;

export function clearAchievementToasts() {
  const wrap = document.getElementById("achievementToasts");
  if (wrap) wrap.replaceChildren();
  toastQueue.length = 0;
  toastDrainActive = false;
  toastPausedForChoices = false;
}

/** Campfire finish / honest screens: never cover choice buttons with toasts. */
export function syncAchievementToastsForScreen(screenId) {
  if (SUPPRESS_TOAST_SCREENS.has(screenId)) {
    const wrap = document.getElementById("achievementToasts");
    if (wrap) wrap.replaceChildren();
    toastPausedForChoices = true;
    toastDrainActive = false;
    return;
  }
  if (toastPausedForChoices) {
    toastPausedForChoices = false;
    drainToastQueue();
  }
}

export function unlock(id, silent = false) {
  if (!DEFS[id] || state.achievements.includes(id)) return;
  state.achievements.push(id);
  saveState();
  if (!silent) enqueueToast(DEFS[id]);
}

function enqueueToast(def) {
  toastQueue.push(def);
  drainToastQueue();
}

function drainToastQueue() {
  if (toastDrainActive || toastPausedForChoices) return;
  if (SUPPRESS_TOAST_SCREENS.has(document.body?.dataset?.screen || "")) return;
  toastDrainActive = true;
  const step = () => {
    if (toastPausedForChoices || SUPPRESS_TOAST_SCREENS.has(document.body?.dataset?.screen || "")) {
      toastDrainActive = false;
      return;
    }
    const wrap = document.getElementById("achievementToasts");
    if (!wrap) {
      toastDrainActive = false;
      return;
    }
    while (wrap.children.length >= MAX_ACHIEVEMENT_TOASTS) {
      wrap.firstElementChild?.remove();
    }
    const def = toastQueue.shift();
    if (!def) {
      toastDrainActive = false;
      return;
    }
    const el = document.createElement("div");
    el.className = "achievement-toast";
    el.innerHTML = `${icons.shield}<span class="achievement-toast__label">${def.title}</span>`;
    wrap.appendChild(el);
    playDing();
    vibrate([30, 40, 30]);
    window.setTimeout(() => el.classList.add("achievement-toast--out"), TOAST_VISIBLE_MS);
    window.setTimeout(() => {
      el.remove();
      step();
    }, TOAST_VISIBLE_MS + 450);
  };
  step();
}

export function achievementCount() {
  return MAIN_ACHIEVEMENT_IDS.filter((id) => state.achievements.includes(id)).length;
}

export function achievementLabelsMain() {
  return MAIN_ACHIEVEMENT_IDS.filter((id) => state.achievements.includes(id)).map((id) => DEFS[id].title);
}

export function achievementLabelsBonus() {
  return state.achievements
    .filter((id) => DEFS[id]?.bonus)
    .map((id) => DEFS[id].title);
}

if (typeof window !== "undefined") {
  window.__questUnlock = unlock;
}
