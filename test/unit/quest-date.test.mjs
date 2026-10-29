import { test } from "node:test";
import assert from "node:assert/strict";
import {
  certificatePassSubtitle,
  chapterLockButtonLabel,
  chapterLockKicker,
  chapterLockMessage,
  chapterLockSubline,
  chapterLockTitle,
  chapterTwoIsAvailable,
  dateKeyInTimeZone,
  formatQuestDate,
  questDayHasArrived,
  questPassPresentLine,
  questPassSummonSubtitle,
  todayQuestDateLabel,
} from "../../js/quest-date.js?v=20261211";

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

test("the production Chapter II switch is open on October 28", () => {
  const questMorning = new Date("2026-10-28T08:00:00Z");
  assert.equal(chapterTwoIsAvailable({ now: questMorning }), true);
});

test("owner release never bypasses the scheduled date and readable date works", () => {
  assert.equal(chapterTwoIsAvailable({ scheduledDate: "2099-01-01", released: true }), false);
  assert.match(formatQuestDate("2026-10-28", "Europe/Warsaw"), /28 October/);
});

test("the ride-day option follows the current Warsaw calendar date", () => {
  const beforeWarsawMidnight = new Date("2026-10-29T22:30:00Z");
  const afterWarsawMidnight = new Date("2026-10-29T23:30:00Z");
  assert.match(todayQuestDateLabel({ now: beforeWarsawMidnight }), /29 October/);
  assert.match(todayQuestDateLabel({ now: afterWarsawMidnight }), /30 October/);
});

test("quest day copy switches from tomorrow to today on QUEST_DATE_ISO", () => {
  const before = new Date("2026-10-27T12:00:00Z");
  const onDay = new Date("2026-10-29T08:00:00Z");
  assert.equal(questDayHasArrived({ now: before }), false);
  assert.equal(questDayHasArrived({ now: onDay }), true);
  assert.match(questPassSummonSubtitle({ now: before }), /tomorrow/i);
  assert.match(questPassSummonSubtitle({ now: onDay }), /today/i);
  assert.match(questPassPresentLine({ now: onDay }), /today/i);
});

test("chapter lock copy and button when Chapter II is open", () => {
  const onDay = new Date("2026-10-28T08:00:00Z");
  const opts = { now: onDay, scheduledDate: "2026-10-28", released: true };
  assert.match(chapterLockKicker(opts), /seal broken/i);
  assert.match(chapterLockTitle(opts), /open/i);
  assert.match(chapterLockMessage(opts), /begin today's adventure/i);
  assert.match(chapterLockSubline(opts), /potatoes/i);
  assert.equal(chapterLockButtonLabel(opts), "Begin Chapter II");
});

test("chapter lock kicker stays sealed before release day", () => {
  const before = new Date("2026-10-27T12:00:00Z");
  const opts = { now: before, scheduledDate: "2026-10-28", released: true };
  assert.match(chapterLockKicker(opts), /sealed/i);
  assert.match(chapterLockSubline(opts), /will not accept early bribes/i);
});

test("certificate pass subtitle stays sealed until Chapter II is available", () => {
  const onDay = new Date("2026-10-28T08:00:00Z");
  assert.match(
    certificatePassSubtitle({
      now: onDay,
      scheduledDate: "2026-10-28",
      released: false,
    }),
    /seal pending/i
  );
  assert.match(
    certificatePassSubtitle({
      now: onDay,
      scheduledDate: "2026-10-28",
      released: true,
    }),
    /officially unlocked/i
  );
});
