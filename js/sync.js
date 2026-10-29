import { RUNTIME_CONFIG } from "./runtime-config.js?v=20261211";
import {
  applyRemoteState,
  inviteTokenFromUrl,
  state,
  updateSyncMeta,
} from "./state.js?v=20261211";

const SAFE_STATE_KEYS = [
  "schemaVersion",
  "chapter",
  "chapterOneComplete",
  "chapterTwoStarted",
  "chapterTwoComplete",
  "consentShared",
  "scheduledDate",
  "timeZone",
  "horseId",
  "eveComplete",
  "eveAdventurerName",
  "eveExcitement",
  "eveHeraldAnswers",
  "evePacking",
  "eveOutcome",
  "steedName",
  "steedClass",
  "affection",
  "fed",
  "rating",
  "ratingBonus",
  "ratingChip",
  "todayVibe",
  "dragonChoice",
  "secondDate",
  "food",
  "activities",
  "potionBase",
  "potionName",
  "vibe",
  "notes",
  "day",
  "time",
  "fanumTax",
  "tarotCard",
  "tarotKey",
  "achievements",
  "honestNo",
  "partyBuff",
  "favoriteMoment",
  "questBadge",
  "futureQuest",
  "lastScreen",
  "stats",
];

let inviteToken = "";
let syncTimer = null;
let syncChain = Promise.resolve();
let initialized = false;

function $(id) {
  return document.getElementById(id);
}

function safeSnapshot() {
  return Object.fromEntries(SAFE_STATE_KEYS.map((key) => [key, structuredClone(state[key])]));
}

function renderStatus(status, detail = "") {
  const el = $("syncStatus");
  if (!el) return;
  const labels = {
    local: "Saved on this device",
    loading: "Loading private quest…",
    saving: "Saving…",
    saved: "Saved privately",
    offline: "Will sync when online",
    error: "Sync failed",
    unavailable: "Private sync not configured",
  };
  el.textContent = detail || labels[status] || labels.local;
  el.dataset.status = status;
  el.classList.toggle("hidden", status === "local" && !inviteToken);
  updateSyncMeta({ status });
}

async function callApi(body) {
  const response = await fetch(RUNTIME_CONFIG.questApiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || `Quest sync failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function saveNow() {
  if (!inviteToken || !RUNTIME_CONFIG.questApiUrl || !state.consentShared) return;
  if (!navigator.onLine) {
    renderStatus("offline");
    return;
  }
  renderStatus("saving");
  try {
    const result = await callApi({
      action: "save",
      token: inviteToken,
      revision: state.serverRevision,
      state: safeSnapshot(),
    });
    updateSyncMeta({ revision: result.revision, status: "saved" });
    renderStatus("saved");
  } catch (error) {
    if (!navigator.onLine) renderStatus("offline");
    else if (error.status === 409) {
      renderStatus("error", "Changed on another device — reload to continue");
    } else {
      renderStatus("error", "Unable to sync. Your device copy is safe.");
    }
  }
}

export function queueQuestSync({ immediate = false } = {}) {
  if (!inviteToken || !state.consentShared) return;
  if (syncTimer) window.clearTimeout(syncTimer);
  const enqueue = () => {
    syncTimer = null;
    syncChain = syncChain.then(saveNow, saveNow);
  };
  if (immediate) enqueue();
  else syncTimer = window.setTimeout(enqueue, 450);
}

export function configureQuestSync({ token = inviteToken, apiUrl } = {}) {
  inviteToken = token;
  if (apiUrl) globalThis.__QUEST_API_URL__ = apiUrl;
  initialized = false;
}

export function __resetQuestSyncForTest() {
  if (syncTimer) globalThis.clearTimeout?.(syncTimer);
  syncTimer = null;
  syncChain = Promise.resolve();
  inviteToken = "";
  initialized = false;
}

export async function initQuestSync() {
  if (initialized) return { status: state.syncStatus };
  initialized = true;
  const rawInvite = new URLSearchParams(location.search).get("invite") || "";
  inviteToken = inviteTokenFromUrl();

  window.addEventListener("quest:state-saved", () => queueQuestSync());
  window.addEventListener("online", () => queueQuestSync({ immediate: true }));
  window.addEventListener("offline", () => {
    if (inviteToken && state.consentShared) renderStatus("offline");
  });

  if (rawInvite && !inviteToken) return { status: "invalid" };
  if (!inviteToken) {
    renderStatus("local");
    return { status: "local" };
  }
  if (!RUNTIME_CONFIG.questApiUrl) {
    renderStatus("unavailable");
    return { status: "unavailable" };
  }

  renderStatus("loading");
  try {
    const result = await callApi({ action: "load", token: inviteToken });
    if (result.state) applyRemoteState(result.state, result.revision);
    updateSyncMeta({
      status: result.state ? "saved" : "local",
      revision: result.revision || 0,
      scheduledDate: result.scheduledDate,
      timeZone: result.timeZone,
    });
    renderStatus(result.state ? "saved" : "local", result.state ? "Private quest restored" : "Ready on this device");
    return { status: "ready", result };
  } catch (error) {
    if (error.status === 404 || error.status === 410) return { status: "invalid" };
    renderStatus(navigator.onLine ? "error" : "offline", "Unable to load the private quest");
    return { status: "error" };
  }
}
