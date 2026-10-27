import { CONFIG } from "./config.js";
import { showSaveWarningToast } from "./ui-feedback.js";

const KEY = "questLady_v3";
const LEGACY_KEY = "questLady_v2";

const EVE_SCREENS = ["eve-name", "eve-excitement", "eve-packing", "eve-survey", "eve-pass"];

const BIDI_OVERRIDE = /[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/g;
const CONTROL_CHARS = /[\p{Cc}\p{Cf}]/gu;
const MAX_GUEST_NAME_LEN = 40;
const MAX_HERALD_NAME_LEN = 24;

/** Normalize and strip unsafe chars from guest names (inserted via textContent only). */
export function sanitizeGuestName(raw) {
  if (raw == null) return "";
  let name = String(raw).normalize("NFC");
  name = name.replace(BIDI_OVERRIDE, "").replace(CONTROL_CHARS, "");
  name = name.replace(/^lady\s+/i, "").trim();
  if (name.length > MAX_GUEST_NAME_LEN) name = name.slice(0, MAX_GUEST_NAME_LEN);
  return name;
}

/** Herald name gate — trim leading spaces, max 24. */
export function sanitizeHeraldName(raw) {
  if (raw == null) return "";
  let name = String(raw).normalize("NFC").trim();
  name = name.replace(BIDI_OVERRIDE, "").replace(CONTROL_CHARS, "");
  name = name.replace(/^lady\s+/i, "").trim();
  if (name.length > MAX_HERALD_NAME_LEN) name = name.slice(0, MAX_HERALD_NAME_LEN);
  return name;
}

const PROGRESS_SCREENS = [
  ...EVE_SCREENS,
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

export function isAdventurerDisplayName(name) {
  return /^adventurer$/i.test(String(name || "").trim());
}

export function parseGuestName() {
  const fromUrl = sanitizeGuestName(queryParam("name"));
  const fromSave = sanitizeGuestName(
    typeof state === "undefined" ? "" : state?.eveAdventurerName || ""
  );
  const name = fromUrl || fromSave;
  if (!name) {
    const fallback = CONFIG.defaultTitle || "my lady";
    const formal = fallback.charAt(0).toUpperCase() + fallback.slice(1);
    return { display: fallback, formal, isLady: false };
  }
  return { display: name, formal: name, isLady: !isAdventurerDisplayName(name) };
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
    consentShared: false,
    scheduledDate: CONFIG.scheduledDate,
    timeZone: CONFIG.timeZone,
    serverRevision: 0,
    syncStatus: "local",
    horseId: "chestnut",
    eveComplete: false,
    eveAdventurerName: "",
    eveExcitement: 3,
    eveHeraldAnswers: {},
    evePacking: [],
    eveOutcome: "",
    chapter1Step: 0,
    chapter1Answers: {},
    chapter1ReplayCount: 0,
    chapter1InviteEverAccepted: false,
    chapter1SealedName: "",
    chapter1CompletedReportedForReplay: -1,
    steedName: "Clover",
    steedClass: "",
    affection: 0,
    fed: false,
    rating: 3,
    ratingBonus: false,
    ratingChip: "",
    todayVibe: "",
    dragonChoice: "",
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
  const base = defaultState();
  let eveComplete = input.eveComplete;
  if (eveComplete === undefined && input.lastScreen) {
    const legacySkip = ![...EVE_SCREENS, "title"].includes(input.lastScreen);
    if (legacySkip) eveComplete = true;
  }
  return {
    ...base,
    ...input,
    schemaVersion: 3,
    eveComplete: eveComplete ?? base.eveComplete,
    eveHeraldAnswers:
      input.eveHeraldAnswers && typeof input.eveHeraldAnswers === "object"
        ? input.eveHeraldAnswers
        : base.eveHeraldAnswers,
    evePacking: Array.isArray(input.evePacking) ? input.evePacking : base.evePacking,
    chapter1Answers:
      input.chapter1Answers && typeof input.chapter1Answers === "object"
        ? input.chapter1Answers
        : base.chapter1Answers,
    chapter1Step: Number.isFinite(Number(input.chapter1Step)) ? Number(input.chapter1Step) : base.chapter1Step,
    chapter1ReplayCount: Number(input.chapter1ReplayCount) || 0,
    chapter1InviteEverAccepted: Boolean(input.chapter1InviteEverAccepted),
    chapter1SealedName:
      typeof input.chapter1SealedName === "string" ? input.chapter1SealedName : base.chapter1SealedName,
    chapter1CompletedReportedForReplay: Number.isFinite(Number(input.chapter1CompletedReportedForReplay))
      ? Number(input.chapter1CompletedReportedForReplay)
      : base.chapter1CompletedReportedForReplay,
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

export function setGuestName(raw) {
  const name = sanitizeGuestName(raw);
  if (!name) return false;
  state.eveAdventurerName = name;
  guest.display = name;
  guest.formal = name;
  guest.isLady = !isAdventurerDisplayName(name);
  return true;
}

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

/** Reset Chapter I only; preserve Chapter II progress and schedule metadata. */
export function resetChapterOneProgress() {
  const keep = {
    chapter1InviteEverAccepted: state.chapter1InviteEverAccepted,
    chapter1SealedName: state.chapter1SealedName,
    chapter1CompletedReportedForReplay: state.chapter1CompletedReportedForReplay,
    chapterTwoStarted: state.chapterTwoStarted,
    chapterTwoComplete: state.chapterTwoComplete,
    chapterTwoOpenedEarly: state.chapterTwoOpenedEarly,
    scheduledDate: state.scheduledDate,
    timeZone: state.timeZone,
    serverRevision: state.serverRevision,
    syncStatus: state.syncStatus,
    partyBuff: state.partyBuff,
    favoriteMoment: state.favoriteMoment,
    questBadge: state.questBadge,
    futureQuest: state.futureQuest,
    steedName: state.steedName,
    horseId: state.horseId,
    consentShared: state.consentShared,
  };
  state.chapter1ReplayCount = (state.chapter1ReplayCount || 0) + 1;
  state.eveComplete = false;
  state.chapterOneComplete = false;
  state.chapter = "chapter-one";
  state.eveOutcome = "";
  state.eveExcitement = 3;
  state.eveHeraldAnswers = {};
  state.evePacking = [];
  state.chapter1Step = 0;
  state.chapter1Answers = {};
  state.eveAdventurerName = "";
  state.secondDate = "";
  state.honestNo = false;
  state.lastScreen = "eve-name";
  Object.assign(state, keep);
  saveState();
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
