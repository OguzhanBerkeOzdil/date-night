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
  feedback.submitFeedback({ _subject: "T", idempotencyId: "local-1", part: "eve" });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(contacted, false);
  assert.equal(feedback.__getFeedbackQueueForTest().length, 0);
  assert.equal(feedback.__getSentIdsForTest().has("local-1"), true);
  globalThis.fetch = originalFetch;
  if (originalLocation === undefined) delete globalThis.location;
  else globalThis.location = originalLocation;
});
