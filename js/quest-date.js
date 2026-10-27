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
  if (!released) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate || "")) return false;
  return dateKeyInTimeZone(now, timeZone) >= scheduledDate;
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
