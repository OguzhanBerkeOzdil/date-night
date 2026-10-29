import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

let sanitizeGuestName;

beforeEach(async () => {
  globalThis.location = { search: "", pathname: "/", href: "http://localhost/" };
  const S = await import("../../js/state.js?v=20261214");
  sanitizeGuestName = S.sanitizeGuestName;
});

test("sanitizeGuestName NFC-normalizes and strips control chars", () => {
  assert.equal(sanitizeGuestName("e\u0301"), "é");
  assert.equal(sanitizeGuestName("Test\u0007Name"), "TestName");
});

test("sanitizeGuestName strips bidi override chars", () => {
  assert.equal(sanitizeGuestName("\u202Elady\u202C Ayse"), "Ayse");
});

test("sanitizeGuestName caps length at 40", () => {
  const long = "A".repeat(50);
  assert.equal(sanitizeGuestName(long).length, 40);
});

test("sanitizeGuestName strips lady prefix", () => {
  assert.equal(sanitizeGuestName("lady Elif"), "Elif");
});

test("Adventurer display name is not titled Lady", async () => {
  const { isAdventurerDisplayName } = await import("../../js/state.js?v=20261214");
  assert.equal(isAdventurerDisplayName("Adventurer"), true);
  assert.equal(isAdventurerDisplayName("Ayse"), false);
});
