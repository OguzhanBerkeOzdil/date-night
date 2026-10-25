import { CONFIG } from "./config.js";

const KEY = "questLady_v2";

export function parseGuestName() {
  const raw = (new URLSearchParams(location.search).get("name") || "").trim();
  let name = raw.replace(/^lady\s+/i, "").trim();
  if (!name) {
    const fallback = CONFIG.defaultTitle || "my lady";
    const formal = fallback.charAt(0).toUpperCase() + fallback.slice(1);
    return { display: fallback, formal, isLady: false };
  }
  return { display: name, formal: name, isLady: true };
}

/** Title line: "Lady Elif" or "My Lady" */
export function questOfTitle() {
  if (guest.isLady) return `Lady ${guest.formal}`;
  return "My Lady";
}

export function ladyTitle() {
  return questOfTitle();
}

export function grantedToLabel() {
  return questOfTitle();
}

export function letterSalutation() {
  if (guest.isLady) return `Dear ${guest.formal},`;
  return "To the lady of this quest,";
}

export function defaultState() {
  return {
    steedName: "Clover",
    steedClass: "",
    affection: 0,
    fed: false,
    rating: 10,
    ratingBonus: false,
    ratingChip: "",
    todayVibe: "",
    secondDate: "",
    noAttempts: 0,
    food: [],
    activities: [],
    potionBase: "",
    potionName: "",
    vibe: "",
    notes: "",
    day: "",
    time: "Morning ride",
    fanumTax: true,
    tarotCard: "",
    tarotKey: "",
    achievements: [],
    honestNo: false,
    lastScreen: "title",
    stats: {},
  };
}

export function hasQuestSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    const progressed = [
      "steed",
      "sheet",
      "rating",
      "journal",
      "dragon",
      "tavern",
      "potion",
      "stars",
      "oracle",
      "decree",
    ];
    return progressed.includes(d.lastScreen);
  } catch (_) {
    return false;
  }
}

export let state = loadState();
export const guest = parseGuestName();

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch (_) {}
  return defaultState();
}

export function saveState() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {}
}

export function resetState() {
  state = defaultState();
  localStorage.removeItem(KEY);
}

/** Fresh quest progress; keeps sound preferences in localStorage. */
export function beginNewQuest() {
  state = defaultState();
  saveState();
}
