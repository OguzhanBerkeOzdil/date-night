/** Cross-device Chapter I seed via ?seed= base64url JSON (compact keys). */

import { CHAPTER1_QUESTIONS } from "./chapter1-survey-data.js?v=20261214";

export const SEED_MAX_BYTES = 4096;
export const SEED_SCHEMA_VERSION = 1;

const QUESTION_IDS = new Set(CHAPTER1_QUESTIONS.map((q) => q.id));

function choiceMap(questionId) {
  const q = CHAPTER1_QUESTIONS.find((item) => item.id === questionId);
  if (!q?.choices) return null;
  return new Map(q.choices.map((c) => [c.id, c]));
}

export function sanitizeSeedText(value, maxLen = 120) {
  if (value == null) return "";
  let text = "";
  for (const ch of String(value)) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code === 127) continue;
    text += ch;
  }
  return text
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLen);
}

function normalizeAnswer(questionId, raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = sanitizeSeedText(raw.id || raw.i, 40);
  const label = sanitizeSeedText(raw.label || raw.l, 120);
  const freeText = sanitizeSeedText(raw.freeText || raw.f, 80);

  if (questionId === "gerald") {
    const value = Number(raw.value ?? raw.v);
    if (!Number.isFinite(value) || value < 0 || value > 1000) return null;
    const unitLabel = label || `${value} potatoes`;
    return { id: "gerald", value, label: unitLabel };
  }

  const choices = choiceMap(questionId);
  if (!choices) return null;

  if (id && choices.has(id)) {
    const canonical = choices.get(id);
    if (canonical.freeText && freeText) {
      return { id, label: freeText || canonical.label, freeText };
    }
    return { id, label: label || canonical.label };
  }

  if (label) {
    return { id: id || "custom", label, ...(freeText ? { freeText } : {}) };
  }
  return null;
}

export function compactSeedPayload(input) {
  const survey = input.survey || input.chapter1Answers || input.a || {};
  const packing = Array.isArray(input.packing) ? input.packing : input.p || [];
  return {
    v: SEED_SCHEMA_VERSION,
    n: sanitizeSeedText(input.name || input.n || input.eveAdventurerName, 24),
    e: Number(input.excitement ?? input.e) || undefined,
    p: packing.map((item) => sanitizeSeedText(item, 40)).filter(Boolean).slice(0, 12),
    h: sanitizeSeedText(input.horse || input.horseId || input.h, 32),
    o: sanitizeSeedText(input.outcome || input.o, 24),
    a: survey,
  };
}

export function validateSeedPayload(data) {
  if (!data || typeof data !== "object") return { ok: false, error: "invalid" };
  if (data.v !== SEED_SCHEMA_VERSION) return { ok: false, error: "version" };

  const answers = {};
  const rawAnswers = data.a;
  if (rawAnswers && typeof rawAnswers === "object") {
    for (const [key, val] of Object.entries(rawAnswers)) {
      if (!QUESTION_IDS.has(key)) continue;
      const normalized = normalizeAnswer(key, val);
      if (normalized) answers[key] = normalized;
    }
  }

  const payload = {
    v: SEED_SCHEMA_VERSION,
    n: sanitizeSeedText(data.n, 24),
    e: Number.isFinite(Number(data.e)) ? Math.min(5, Math.max(1, Number(data.e))) : undefined,
    p: Array.isArray(data.p) ? data.p.map((x) => sanitizeSeedText(x, 40)).filter(Boolean).slice(0, 12) : [],
    h: sanitizeSeedText(data.h, 32),
    o: sanitizeSeedText(data.o, 24),
    answers,
  };

  return { ok: true, payload };
}

export function encodeSeedToBase64Url(compact) {
  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  if (bytes.length > SEED_MAX_BYTES) {
    throw new Error(`Seed too large (${bytes.length} bytes, max ${SEED_MAX_BYTES})`);
  }
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeSeedFromBase64Url(encoded) {
  if (!encoded || typeof encoded !== "string") return null;
  const pad = encoded.length % 4 === 0 ? "" : "=".repeat(4 - (encoded.length % 4));
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/") + pad;
  let bin;
  try {
    bin = atob(b64);
  } catch {
    return null;
  }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (bytes.length > SEED_MAX_BYTES) return null;
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function parseSeedFromSearch(search = "") {
  const seed = new URLSearchParams(search).get("seed");
  if (!seed) return null;
  const raw = decodeSeedFromBase64Url(seed);
  const checked = validateSeedPayload(raw);
  if (!checked.ok) return null;
  return checked.payload;
}

function isEmptyAnswers(answers) {
  return !answers || typeof answers !== "object" || Object.keys(answers).length === 0;
}

/** Merge seed into quest state without overwriting existing local progress. */
export function mergeSeedIntoState(current, seedPayload) {
  const next = { ...current };
  const answers = { ...(current.chapter1Answers || {}) };

  if (seedPayload.n && !(current.eveAdventurerName || "").trim()) {
    next.eveAdventurerName = seedPayload.n;
  }
  if (seedPayload.e != null && !current.eveExcitement) {
    next.eveExcitement = seedPayload.e;
  }
  if (seedPayload.p?.length && (!current.evePacking || current.evePacking.length === 0)) {
    next.evePacking = [...seedPayload.p];
  }
  if (seedPayload.h && (!current.horseId || current.horseId === "chestnut")) {
    next.horseId = seedPayload.h;
  }
  if (seedPayload.o && !current.eveOutcome) {
    next.eveOutcome = seedPayload.o;
  }

  for (const [qid, ans] of Object.entries(seedPayload.answers || {})) {
    if (!answers[qid]) answers[qid] = ans;
  }
  next.chapter1Answers = answers;

  const surveyCount = Object.keys(seedPayload.answers || {}).length;
  if (surveyCount >= 3 && !current.chapterOneComplete) {
    next.chapterOneComplete = true;
    next.eveComplete = true;
    next.chapter1Step = 9;
    next.chapter1InviteEverAccepted = true;
    if (!current.chapter1SealedName && seedPayload.n) {
      next.chapter1SealedName = seedPayload.n;
    }
  }

  if (isEmptyAnswers(current.chapter1Answers) && surveyCount > 0) {
    next.chapter = current.chapterTwoStarted || current.chapterTwoComplete ? current.chapter : "chapter-one";
  }

  return next;
}

export function stripSeedFromUrl() {
  if (typeof globalThis.location === "undefined" || !globalThis.history?.replaceState) return;
  const url = new URL(globalThis.location.href);
  if (!url.searchParams.has("seed")) return;
  url.searchParams.delete("seed");
  const next = `${url.pathname}${url.search}${url.hash}`;
  globalThis.history.replaceState(null, "", next);
}

export function buildWireSeedFromOwnerJson(input) {
  const compact = compactSeedPayload(input);
  const checked = validateSeedPayload({ v: SEED_SCHEMA_VERSION, ...compact, a: compact.a });
  if (!checked.ok) throw new Error(`Invalid seed: ${checked.error}`);
  const p = checked.payload;
  return {
    v: SEED_SCHEMA_VERSION,
    n: p.n,
    ...(p.e != null ? { e: p.e } : {}),
    ...(p.p?.length ? { p: p.p } : {}),
    ...(p.h ? { h: p.h } : {}),
    ...(p.o ? { o: p.o } : {}),
    a: p.answers,
  };
}

export function applyQuestSeedFromUrl(getState, saveStateFn) {
  const seed = parseSeedFromSearch(globalThis.location?.search || "");
  if (!seed) return false;
  const current = getState();
  const merged = mergeSeedIntoState(current, seed);
  Object.assign(current, merged);
  saveStateFn();
  stripSeedFromUrl();
  return true;
}
