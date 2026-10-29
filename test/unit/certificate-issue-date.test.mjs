import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

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
  globalThis.location = { search: "", pathname: "/", href: "http://localhost/" };
});

test("certificate summoned line uses Warsaw issue date, not configured quest day", async () => {
  const stateMod = await import("../../js/state.js?v=20261214");
  stateMod.__resetModuleForTest();
  const questDate = await import("../../js/quest-date.js?v=20261214");
  const now = new Date("2026-10-29T10:00:00+02:00");
  const questState = {
    timeZone: "Europe/Warsaw",
    certificatePassIssuedAt: "",
  };
  questDate.pinCertificateIssueDate(questState, "pass", { now });
  assert.equal(questState.certificatePassIssuedAt, "2026-10-29");
  const line = questDate.certificateSummonedForIssueLine(questState, "pass", { now });
  assert.match(line, /Summoned for today's quest \(Thursday 29 October 2026\)/);
});

test("pinned pass issue date survives re-render on another calendar day", async () => {
  const stateMod = await import("../../js/state.js?v=20261214");
  stateMod.__resetModuleForTest();
  stateMod.__setStateForTest({
    timeZone: "Europe/Warsaw",
    certificatePassIssuedAt: "2026-10-29",
    chapter1Answers: {},
    steedName: "Clover",
  });
  const { buildCertificateLines } = await import("../../js/certificate.js?v=20261214");
  const later = new Date("2026-11-03T10:00:00+02:00");
  const lines = buildCertificateLines("pass", { now: later, persistIssueDate: false });
  const summoned = lines.find((l) => l.startsWith("Summoned for"));
  assert.match(summoned, /29 October 2026/);
  assert.doesNotMatch(summoned, /3 November/);
});

test("completion certificate uses its own pinned issue date", async () => {
  const questDate = await import("../../js/quest-date.js?v=20261214");
  const questState = { timeZone: "Europe/Warsaw" };
  const nov3 = new Date("2026-11-03T10:00:00+02:00");
  questDate.pinCertificateIssueDate(questState, "completion", { now: nov3 });
  const line = questDate.certificateSummonedForIssueLine(questState, "completion", { now: nov3 });
  assert.match(line, /Tuesday 3 November 2026/);
});
