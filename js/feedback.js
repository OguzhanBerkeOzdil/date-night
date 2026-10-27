import { FORM_SUBMIT_ENDPOINT } from "./app-config.js";

const QUEUE_KEY = "questFeedbackQueue_v1";
const SENT_IDS_KEY = "questFeedbackSentIds_v1";

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
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

function basePayload(fields) {
  return {
    _subject: fields._subject,
    _template: "table",
    _captcha: "false",
    ...fields,
  };
}

function isLocalPreview() {
  if (typeof location === "undefined") return false;
  return location.hostname === "127.0.0.1" || location.hostname === "localhost";
}

async function postPayload(body) {
  // Local development and Playwright runs must never email the real recipient.
  if (isLocalPreview()) return;
  const res = await fetch(FORM_SUBMIT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`feedback ${res.status}`);
}

/**
 * Fire-and-forget feedback. Queues on failure; skips duplicate idempotencyId.
 */
export function submitFeedback(fields) {
  const id = fields.idempotencyId;
  if (!id) return;

  const sent = readSentIds();
  if (sent.has(id)) return;

  const body = basePayload(fields);
  const task = async () => {
    try {
      await postPayload(body);
      sent.add(id);
      writeSentIds(sent);
      const q = readQueue().filter((item) => item.idempotencyId !== id);
      writeQueue(q);
    } catch {
      const q = readQueue();
      if (!q.some((item) => item.idempotencyId === id)) {
        q.push(body);
        writeQueue(q);
      }
    }
  };
  void task();
}

/** Flush queued submissions (call on load and when online). */
export function flushFeedbackQueue() {
  const q = readQueue();
  if (!q.length) return;
  for (const body of q) {
    const id = body.idempotencyId;
    if (!id || readSentIds().has(id)) continue;
    submitFeedback(body);
  }
}

export function __resetFeedbackForTest() {
  writeQueue([]);
  writeSentIds(new Set());
}

export function __getFeedbackQueueForTest() {
  return readQueue();
}

export function __getSentIdsForTest() {
  return readSentIds();
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => flushFeedbackQueue());
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => flushFeedbackQueue());
  } else {
    flushFeedbackQueue();
  }
}
