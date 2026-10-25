import { playDing, vibrate } from "./audio.js";
import { state, saveState } from "./state.js";
import { icons } from "./icons.js";

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
  charm: { id: "charm", title: "Critical Charm", desc: "Rolled a natural 20 on every stat." },
  charts: { id: "charts", title: "Off the Charts", desc: "Broke the rating scale." },
  dragon: { id: "dragon", title: "Dragon Befriender", desc: "Defeated doubt with a single word." },
  fanum: { id: "fanum", title: "Ancient Law Respected", desc: "Accepted the fanum tax. Gracefully." },
  alchemist: { id: "alchemist", title: "Master Alchemist", desc: "Brewed a perfect date potion." },
  fortune: { id: "fortune", title: "Fortune Favoured", desc: "Drew a card from the oracle." },
  heart: { id: "heart", title: "Stole His Heart", desc: "Rarity: 1 of 1." },
  stubborn: { id: "stubborn", title: "Stubborn Thumb", desc: "Tried to say no 3 times. Bold.", bonus: true },
  fate: { id: "fate", title: "Fate Tempter", desc: "The coin refused to choose.", bonus: true },
};

export function unlock(id, silent = false) {
  if (!DEFS[id] || state.achievements.includes(id)) return;
  state.achievements.push(id);
  saveState();
  if (!silent) toast(DEFS[id]);
}

function toast(def) {
  const wrap = document.getElementById("achievementToasts");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = "achievement-toast";
  el.innerHTML = `${icons.shield}<span class="achievement-toast__label">${def.title}</span>`;
  wrap.appendChild(el);
  playDing();
  vibrate([30, 40, 30]);
  setTimeout(() => el.classList.add("achievement-toast--out"), 2500);
  setTimeout(() => el.remove(), 2900);
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
