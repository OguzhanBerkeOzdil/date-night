import { CONFIG } from "./config.js";
import { showSaveWarningToast } from "./ui-feedback.js";

const KEY = "questLady_v3";
const LEGACY_KEY = "questLady_v2";

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
  "chapter-lock",
  "chapter-two-start",
  "chapter-two-pause",
  "chapter-two-finish",
  "quest-complete",
  "honest-no",
];

function queryParam(name) {
  try {
    return (new URLSearchParams(globalThis.location?.search || "").get(name) || "").trim();
  } catch {
    return "";
  }
}

export function parseGuestName() {
  const raw = queryParam("name");
  const name = raw.replace(/^lady\s+/i, "").trim();
  if (!name) {
    const fallback = CONFIG.defaultTitle || "my lady";
    const formal = fallback.charAt(0).toUpperCase() + fallback.slice(1);
    return { display: fallback, formal, isLady: false };
  }
  return { display: name, formal: name, isLady: true };
}

export function inviteTokenFromUrl() {
  const value = queryParam("invite");
  return /^[A-Za-z0-9_-]{32,256}$/.test(value) ? value : "";
}

export function questOfTitle() {
  return guest.isLady ? `Lady ${guest.formal}` : "My Lady";
}

export function ladyTitle() {
  return questOfTitle();
}

export function grantedToLabel() {
  return questOfTitle();
}

export function letterSalutation() {
  return guest.isLady ? `Dear ${guest.formal},` : "To the adventurer of this quest,";
}

export function defaultState() {
  return {
    schemaVersion: 3,
    chapter: "chapter-one",
    chapterOneComplete: false,
    chapterTwoStarted: false,
    chapterTwoComplete: false,
    chapterTwoOpenedEarly: false,
    consentShared: false,
    scheduledDate: CONFIG.scheduledDate,
    timeZone: CONFIG.timeZone,
    serverRevision: 0,
    syncStatus: "local",
    steedName: "Clover",
    steedClass: "",
    affection: 0,
    fed: false,
    rating: 3,
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
    time: "Evening stars",
    fanumTax: true,
    tarotCard: "",
    tarotKey: "",
    achievements: [],
    honestNo: false,
    partyBuff: "",
    favoriteMoment: "",
    questBadge: "",
    futureQuest: "",
    lastScreen: "title",
    stats: {},
  };
}

function normalizeState(value) {
  const input = value && typeof value === "object" ? value : {};
  return {
    ...defaultState(),
    ...input,
    schemaVersion: 3,
    food: Array.isArray(input.food) ? input.food : [],
    activities: Array.isArray(input.activities) ? input.activities : [],
    achievements: Array.isArray(input.achievements) ? input.achievements : [],
    stats: input.stats && typeof input.stats === "object" ? input.stats : {},
  };
}

function snapshotIsUndoable(snap) {
  return Boolean(snap && PROGRESS_SCREENS.includes(snap.lastScreen));
}

function readRawStorage() {
  try {
    const current = localStorage.getItem(KEY);
    if (current) return JSON.parse(current);
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return JSON.parse(legacy);
  } catch {
    return null;
  }
  return null;
}

function readSnapshotFromStorage() {
  const raw = readRawStorage();
  return raw ? normalizeState(raw) : null;
}

export function hasQuestSave() {
  return snapshotIsUndoable(readSnapshotFromStorage());
}

export let state = loadState();
export const guest = parseGuestName();

let pendingUndoSnapshot = null;
let questResetInFlight = false;

export function loadState() {
  return normalizeState(readRawStorage());
}

function emitSaved() {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new CustomEvent("quest:state-saved"));
}

export function saveState({ notifySync = true } = {}) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    if (snapshotIsUndoable(state)) clearPendingUndo();
    if (notifySync) emitSaved();
  } catch {
    showSaveWarningToast();
  }
}

export function applyRemoteState(next, serverRevision = 0) {
  state = normalizeState({
    ...next,
    serverRevision: Number(serverRevision) || 0,
    syncStatus: "saved",
  });
  saveState({ notifySync: false });
}

export function updateSyncMeta({ status, revision, scheduledDate, timeZone } = {}) {
  if (status) state.syncStatus = status;
  if (Number.isFinite(Number(revision))) state.serverRevision = Number(revision);
  if (scheduledDate) state.scheduledDate = scheduledDate;
  if (timeZone) state.timeZone = timeZone;
  saveState({ notifySync: false });
}

export function resetState() {
  state = defaultState();
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    showSaveWarningToast();
  }
}

export function undoLastNewQuest() {
  if (!pendingUndoSnapshot) return false;
  state = normalizeState(pendingUndoSnapshot);
  pendingUndoSnapshot = null;
  saveState();
  return true;
}

export function clearPendingUndo() {
  pendingUndoSnapshot = null;
}

export function beginNewQuest() {
  if (questResetInFlight) return false;
  questResetInFlight = true;
  try {
    const snap = readSnapshotFromStorage();
    if (snapshotIsUndoable(snap)) pendingUndoSnapshot = snap;
    state = defaultState();
    saveState();
    return true;
  } finally {
    questResetInFlight = false;
  }
}

export function __setStateForTest(next) {
  state = normalizeState(next);
}

export function __getStorageKey() {
  return KEY;
}

export function __getLegacyStorageKey() {
  return LEGACY_KEY;
}

export function __resetModuleForTest() {
  state = defaultState();
  pendingUndoSnapshot = null;
  questResetInFlight = false;
}

export function __getPendingUndoSnapshot() {
  return pendingUndoSnapshot;
}
