import {
  FEEDBACK_APP_ID,
  FORM_SOURCE_URL,
  FORM_SUBMIT_ENDPOINT,
  GOOGLE_FORMS_ENDPOINT,
  GOOGLE_FORMS_ENTRY,
} from "./app-config.js?v=20261211";

const QUEUE_KEY = "questFeedbackQueue_v1";
const SENT_IDS_KEY = "questFeedbackSentIds_v1";
const RETRY_META_KEY = "questFeedbackRetry_v1";
const TRANSIENT_RETRY_DELAY_MS = 15 * 60 * 1000;
const RATE_LIMIT_RETRY_DELAY_MS = 6 * 60 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 6 * 60 * 60 * 1000;

const inFlight = new Map();
let flushTask = null;
let retryTimer = null;

function compactQueue(items) {
  const valid = Array.isArray(items) ? items.filter((item) => item?.idempotencyId) : [];
  const hasCompletion = valid.some((item) => item.part === "completion");
  if (!hasCompletion) return valid;
  // The completion snapshot contains every Chapter II choice. Drop superseded
  // start/decree mail so one playthrough produces one useful email.
  return valid.filter((item) => !["chapter-two-start", "main"].includes(item.part));
}

function readQueue() {
  try {
    return compactQueue(JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"));
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(compactQueue(items)));
  } catch {
    /* ignore */
  }
}

function readSentIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SENT_IDS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function writeSentIds(set) {
  try {
    localStorage.setItem(SENT_IDS_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

function readRetryMeta() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RETRY_META_KEY) || "{}");
    return {
      attempts: Math.max(0, Number(parsed.attempts) || 0),
      nextAttemptAt: Math.max(0, Number(parsed.nextAttemptAt) || 0),
      lastHttpStatus: Math.max(0, Number(parsed.lastHttpStatus) || 0),
    };
  } catch {
    return { attempts: 0, nextAttemptAt: 0, lastHttpStatus: 0 };
  }
}

function writeRetryMeta(meta) {
  try {
    localStorage.setItem(RETRY_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

function clearRetryMeta() {
  try {
    localStorage.removeItem(RETRY_META_KEY);
  } catch {
    /* ignore */
  }
}

function recordRetry(error) {
  const previous = readRetryMeta();
  const attempts = previous.attempts + 1;
  const status = Number(error?.status) || 0;
  const delay = status === 429
    ? RATE_LIMIT_RETRY_DELAY_MS
    : Math.min(TRANSIENT_RETRY_DELAY_MS * (2 ** (attempts - 1)), MAX_RETRY_DELAY_MS);
  const meta = { attempts, nextAttemptAt: Date.now() + delay, lastHttpStatus: status };
  writeRetryMeta(meta);
  return meta;
}

function basePayload(fields) {
  return {
    _subject: fields._subject,
    _template: "table",
    _captcha: "false",
    _url: FORM_SOURCE_URL,
    ...fields,
  };
}

function isLocalPreview() {
  if (typeof location === "undefined") return false;
  if (globalThis.__ALLOW_LOCAL_FEEDBACK_TEST__ === true) return false;
  return location.hostname === "127.0.0.1" || location.hostname === "localhost";
}

async function postPayload(body) {
  // Local development and Playwright runs must never email the real recipient.
  if (isLocalPreview()) return { local: true };
  const googleFormsEndpoint = globalThis.__FEEDBACK_PROVIDER_FOR_TEST__ === "formsubmit"
    ? ""
    : globalThis.__FEEDBACK_PROVIDER_FOR_TEST__ || GOOGLE_FORMS_ENDPOINT;
  if (googleFormsEndpoint) {
    // Google Forms accepts a simple form-encoded request without a CORS
    // preflight. The response is intentionally opaque; network failures still
    // reject and remain in the local retry queue.
    const params = new URLSearchParams({
      [GOOGLE_FORMS_ENTRY]: JSON.stringify({ appId: FEEDBACK_APP_ID, ...body }),
    });
    await fetch(googleFormsEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: params.toString(),
    });
    return { local: false };
  }
  const res = await fetch(FORM_SUBMIT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = new Error(`feedback ${res.status}`);
    error.status = res.status;
    throw error;
  }
  // FormSubmit can report an application-level failure in a successful HTTP
  // response. Treat that as undelivered so the payload remains retryable.
  if (typeof res.clone === "function") {
    const data = await res.clone().json().catch(() => null);
    if (data?.success === false) {
      const error = new Error(data.message || "feedback rejected");
      error.status = /rate limit/i.test(data.message || "") ? 429 : res.status;
      throw error;
    }
  }
  return { local: false };
}

function scheduleRetry() {
  if (typeof window === "undefined" || retryTimer) return;
  const wait = Math.max(1_000, readRetryMeta().nextAttemptAt - Date.now());
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    void flushFeedbackQueue();
  }, wait);
}

function prioritizeQueue(items) {
  return [...items].sort((a, b) => {
    const priority = (item) => (item.part === "completion" ? 0 : item.part === "honest" ? 1 : 2);
    return priority(a) - priority(b);
  });
}

/**
 * Fire-and-forget feedback. Queues on failure; skips duplicate idempotencyId.
 */
export function submitFeedback(fields) {
  const id = fields.idempotencyId;
  if (!id) return Promise.resolve({ status: "invalid" });

  const sent = readSentIds();
  if (sent.has(id)) {
    return Promise.resolve({ status: isLocalPreview() ? "local" : "duplicate" });
  }
  if (inFlight.has(id)) return inFlight.get(id);

  const body = basePayload(fields);
  if (body.part === "completion") {
    writeQueue(readQueue().filter((item) => !["chapter-two-start", "main"].includes(item.part)));
  }
  const task = (async () => {
    try {
      const delivery = await postPayload(body);
      sent.add(id);
      writeSentIds(sent);
      const q = readQueue().filter((item) => item.idempotencyId !== id);
      writeQueue(q);
      if (q.length === 0) clearRetryMeta();
      return { status: delivery.local ? "local" : "sent" };
    } catch (error) {
      const q = readQueue();
      if (!q.some((item) => item.idempotencyId === id)) {
        q.push(body);
        writeQueue(q);
      }
      recordRetry(error);
      scheduleRetry();
      return { status: "queued", httpStatus: Number(error?.status) || 0 };
    }
  })().finally(() => inFlight.delete(id));
  inFlight.set(id, task);
  return task;
}

/** Flush queued submissions (call on load and when online). */
export function flushFeedbackQueue({ force = false } = {}) {
  if (flushTask) return flushTask;
  flushTask = (async () => {
    const q = prioritizeQueue(readQueue());
    if (q.length === 0) {
      clearRetryMeta();
      return { status: "empty" };
    }
    if (!force && readRetryMeta().nextAttemptAt > Date.now()) {
      scheduleRetry();
      return { status: "deferred" };
    }
    for (const body of q) {
      const id = body.idempotencyId;
      if (!id || readSentIds().has(id)) continue;
      const result = await submitFeedback(body);
      // Stop after the first failure instead of hammering the free endpoint.
      if (result.status === "queued") break;
    }
  })().finally(() => {
    flushTask = null;
  });
  return flushTask;
}

export function feedbackDeliveryStatus(id) {
  if (!id) return "missing";
  if (readSentIds().has(id)) return isLocalPreview() ? "local" : "sent";
  if (readQueue().some((item) => item.idempotencyId === id)) return "queued";
  if (inFlight.has(id)) return "sending";
  return "missing";
}

export function __resetFeedbackForTest() {
  writeQueue([]);
  writeSentIds(new Set());
  clearRetryMeta();
  if (retryTimer && typeof window !== "undefined") window.clearTimeout(retryTimer);
  retryTimer = null;
}

export function __getFeedbackQueueForTest() {
  return readQueue();
}

export function __getSentIdsForTest() {
  return readSentIds();
}

export function __getFeedbackRetryForTest() {
  return readRetryMeta();
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushFeedbackQueue());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushFeedbackQueue();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void flushFeedbackQueue());
  } else {
    void flushFeedbackQueue();
  }
}
