import { CONFIG } from "./config.js";
import { showSaveWarningToast } from "./ui-feedback.js";

const KEY = "questLady_v2";

const PROGRESS_SCREENS = [
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

function snapshotIsUndoable(snap) {
  return Boolean(snap && PROGRESS_SCREENS.includes(snap.lastScreen));
}

function readSnapshotFromStorage() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch (_) {
    return null;
  }
}

export function hasQuestSave() {
  return snapshotIsUndoable(readSnapshotFromStorage());
}

export let state = loadState();
export const guest = parseGuestName();

let pendingUndoSnapshot = null;
let questResetInFlight = false;

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
  } catch (_) {
    showSaveWarningToast();
  }
}

export function resetState() {
  state = defaultState();
  try {
    localStorage.removeItem(KEY);
  } catch (_) {
    showSaveWarningToast();
  }
}

/** Restore quest after a New Game undo (in-memory snapshot). */
export function undoLastNewQuest() {
  if (!pendingUndoSnapshot) return false;
  state = { ...defaultState(), ...pendingUndoSnapshot };
  pendingUndoSnapshot = null;
  saveState();
  return true;
}

export function clearPendingUndo() {
  pendingUndoSnapshot = null;
}

/**
 * Fresh quest progress; keeps sound preferences in localStorage.
 * Snapshots at most one undoable save; ignores re-entry and empty overwrites.
 */
export function beginNewQuest() {
  if (questResetInFlight) return false;
  questResetInFlight = true;
  try {
    const snap = readSnapshotFromStorage();
    if (snapshotIsUndoable(snap)) {
      const pendingOk = snapshotIsUndoable(pendingUndoSnapshot);
      if (!pendingOk) pendingUndoSnapshot = snap;
    }
    state = defaultState();
    saveState();
    return true;
  } finally {
    questResetInFlight = false;
  }
}

/** Test helpers */
export function __setStateForTest(next) {
  state = { ...defaultState(), ...next };
}

export function __getStorageKey() {
  return KEY;
}

export function __resetModuleForTest() {
  state = defaultState();
  pendingUndoSnapshot = null;
  questResetInFlight = false;
}

export function __getPendingUndoSnapshot() {
  return pendingUndoSnapshot;
}
