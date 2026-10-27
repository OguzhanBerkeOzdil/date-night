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

test("realm certificate notes include base lines and pacifist personalization", async () => {
  const stateMod = await import("../../js/state.js");
  stateMod.__resetModuleForTest();
  stateMod.__setStateForTest({
    chapter1Answers: { weapon: { id: "pacifist", label: "I'm a pacifist" } },
  });
  const { buildRealmCertificateNotes } = await import("../../js/certificate-notes.js");
  const notes = buildRealmCertificateNotes();
  assert.ok(notes.some((n) => n.includes("frying pan")));
  assert.ok(notes.some((n) => n.includes("Reginald is still crying")));
});

test("buildCertificateLines includes official notes section", async () => {
  const stateMod = await import("../../js/state.js");
  stateMod.__resetModuleForTest();
  const { buildCertificateLines } = await import("../../js/certificate.js");
  const lines = buildCertificateLines();
  assert.ok(lines.some((l) => l.startsWith("Official notes from the realm")));
  assert.ok(lines.some((l) => l.includes("Not redeemable for dragons")));
});
