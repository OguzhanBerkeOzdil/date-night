import { CONFIG } from "./config.js";
import { CHAPTER_TWO_RELEASED } from "./app-config.js";

export function dateKeyInTimeZone(date = new Date(), timeZone = CONFIG.timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function chapterTwoIsAvailable({
  scheduledDate = CONFIG.scheduledDate,
  timeZone = CONFIG.timeZone,
  released = CHAPTER_TWO_RELEASED,
  now = new Date(),
} = {}) {
  const testOverride = globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__;
  const effectiveReleased =
    typeof testOverride === "boolean" ? testOverride : released;
  if (!effectiveReleased) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate || "")) return false;
  return dateKeyInTimeZone(now, timeZone) >= scheduledDate;
}

export function chapterTwoOpensTomorrow({ scheduledDate = CONFIG.scheduledDate, timeZone = CONFIG.timeZone, now = new Date() } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate || "")) return true;
  return dateKeyInTimeZone(now, timeZone) < scheduledDate;
}

export function chapterLockMessage({
  scheduledDate = CONFIG.scheduledDate,
  timeZone = CONFIG.timeZone,
  released = CHAPTER_TWO_RELEASED,
  now = new Date(),
} = {}) {
  const testOverride = globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__;
  const effectiveReleased =
    typeof testOverride === "boolean" ? testOverride : released;
  if (chapterTwoOpensTomorrow({ scheduledDate, timeZone, now })) {
    return "The quest continues tomorrow. Berke is still polishing the seal.";
  }
  if (!effectiveReleased) {
    return "Berke is polishing the seal — check back soon.";
  }
  return `Berke will unseal Chapter II on ${formatQuestDate(scheduledDate, timeZone)} morning.`;
}

export function chapterTwoPassClosingLine({
  scheduledDate = CONFIG.scheduledDate,
  timeZone = CONFIG.timeZone,
  now = new Date(),
} = {}) {
  if (chapterTwoOpensTomorrow({ scheduledDate, timeZone, now })) {
    return "Chapter II opens tomorrow. Rest, hydrate, and do not let the horse plan the whole date.";
  }
  return "Chapter II unlocks when Berke flips the seal. Hydrate anyway.";
}

export function formatQuestDate(
  scheduledDate = CONFIG.scheduledDate,
  timeZone = CONFIG.timeZone,
  locale = "en-GB"
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate || "")) return "the scheduled day";
  const [year, month, day] = scheduledDate.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}
