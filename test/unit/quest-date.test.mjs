import { test } from "node:test";
import assert from "node:assert/strict";
import { chapterTwoIsAvailable, dateKeyInTimeZone, formatQuestDate } from "../../js/quest-date.js";

test("chapter II remains locked before the Warsaw calendar date", () => {
  const now = new Date("2026-10-27T22:30:00Z");
  assert.equal(dateKeyInTimeZone(now, "Europe/Warsaw"), "2026-10-27");
  assert.equal(chapterTwoIsAvailable({ scheduledDate: "2026-10-28", timeZone: "Europe/Warsaw", released: true, now }), false);
});

test("chapter II opens on the scheduled date only after owner release", () => {
  const now = new Date("2026-10-27T23:01:00Z");
  assert.equal(dateKeyInTimeZone(now, "Europe/Warsaw"), "2026-10-28");
  assert.equal(chapterTwoIsAvailable({ scheduledDate: "2026-10-28", timeZone: "Europe/Warsaw", released: false, now }), false);
  assert.equal(chapterTwoIsAvailable({ scheduledDate: "2026-10-28", timeZone: "Europe/Warsaw", released: true, now }), true);
});

test("owner release never bypasses the scheduled date and readable date works", () => {
  assert.equal(chapterTwoIsAvailable({ scheduledDate: "2099-01-01", released: true }), false);
  assert.match(formatQuestDate("2026-10-28", "Europe/Warsaw"), /28 October/);
});
