import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

let feedback;

beforeEach(async () => {
  globalThis.localStorage = {
    _m: new Map(),
    getItem(k) {
      return this._m.has(k) ? this._m.get(k) : null;
    },
    setItem(k, v) {
      this._m.set(k, String(v));
    },
    removeItem(k) {
      this._m.delete(k);
    },
  };
  feedback = await import("../../js/feedback.js");
  feedback.__resetFeedbackForTest();
});

test("submitFeedback queues when fetch fails", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  feedback.submitFeedback({
    _subject: "Test",
    idempotencyId: "test-1",
    part: "eve",
    name: "Ayse",
  });
  await new Promise((r) => setTimeout(r, 20));
  const q = feedback.__getFeedbackQueueForTest();
  assert.equal(q.length, 1);
  assert.equal(q[0].idempotencyId, "test-1");
  globalThis.fetch = original;
});

test("idempotency prevents duplicate enqueue", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  feedback.submitFeedback({ _subject: "T", idempotencyId: "dup-1", part: "eve" });
  feedback.submitFeedback({ _subject: "T", idempotencyId: "dup-1", part: "eve" });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(feedback.__getFeedbackQueueForTest().length, 1);
  globalThis.fetch = original;
});

test("local previews never contact FormSubmit or queue test feedback", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocation = globalThis.location;
  let contacted = false;
  globalThis.location = { hostname: "127.0.0.1" };
  globalThis.fetch = async () => {
    contacted = true;
    throw new Error("local preview must not reach the network");
  };
  const result = await feedback.submitFeedback({
    _subject: "T",
    idempotencyId: "local-1",
    part: "eve",
  });
  assert.equal(contacted, false);
  assert.equal(result.status, "local");
  assert.equal(feedback.feedbackDeliveryStatus("local-1"), "local");
  assert.equal(feedback.__getFeedbackQueueForTest().length, 0);
  assert.equal(feedback.__getSentIdsForTest().has("local-1"), true);
  globalThis.fetch = originalFetch;
  if (originalLocation === undefined) delete globalThis.location;
  else globalThis.location = originalLocation;
});

test("completion feedback replaces queued Chapter II progress mail", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    const error = new Error("rate limited");
    error.status = 429;
    throw error;
  };
  await feedback.submitFeedback({
    _subject: "Start",
    idempotencyId: "start-1",
    part: "chapter-two-start",
  });
  await feedback.submitFeedback({
    _subject: "Decree",
    idempotencyId: "decree-1",
    part: "main",
  });
  const result = await feedback.submitFeedback({
    _subject: "Complete",
    idempotencyId: "complete-1",
    part: "completion",
  });
  assert.equal(result.status, "queued");
  assert.deepEqual(
    feedback.__getFeedbackQueueForTest().map((item) => item.idempotencyId),
    ["complete-1"]
  );
  globalThis.fetch = original;
});

test("an application-level rejection stays queued even when HTTP is successful", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    clone: () => ({
      json: async () => ({ success: false, message: "Rate limit exceeded" }),
    }),
  });

  const result = await feedback.submitFeedback({
    _subject: "Complete",
    idempotencyId: "complete-soft-failure",
    part: "completion",
  });

  assert.equal(result.status, "queued");
  assert.deepEqual(
    feedback.__getFeedbackQueueForTest().map((item) => item.idempotencyId),
    ["complete-soft-failure"]
  );
  globalThis.fetch = original;
});

test("rate limiting persists a long cooldown and automatic flush respects it", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return { ok: false, status: 429 };
  };

  const before = Date.now();
  await feedback.submitFeedback({
    _subject: "Complete",
    idempotencyId: "complete-cooldown",
    part: "completion",
  });
  const retry = feedback.__getFeedbackRetryForTest();
  assert.equal(retry.lastHttpStatus, 429);
  assert.ok(retry.nextAttemptAt >= before + (5 * 60 * 60 * 1000));

  globalThis.fetch = async () => {
    calls += 1;
    return { ok: true, status: 200 };
  };
  const result = await feedback.flushFeedbackQueue();
  assert.equal(result.status, "deferred");
  assert.equal(calls, 1);
  globalThis.fetch = original;
});
