import { CONFIG } from "./config.js";

const KEY = "questLady_v2";

export function parseGuestName() {
  const raw = (new URLSearchParams(location.search).get("name") || "").trim();
  let name = raw.replace(/^lady\s+/i, "").trim();
  if (!name) return { display: CONFIG.defaultTitle, formal: CONFIG.defaultTitle, isLady: false };
  return { display: name, formal: name, isLady: true };
}

export function ladyTitle(nameInfo) {
  return nameInfo.isLady ? `Lady ${nameInfo.formal}` : nameInfo.formal;
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
    time: "",
    fanumTax: true,
    tarotCard: "",
    achievements: [],
    honestNo: false,
    stats: {},
  };
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
