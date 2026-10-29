import { CONFIG } from "./config.js?v=20261214";
import { CHAPTER_TWO_RELEASED, QUEST_DATE_ISO, QUEST_DATE_LABEL } from "./app-config.js?v=20261214";

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

/** True on/after QUEST_DATE_ISO in Warsaw (Chapter I quest day). */
export function questDayHasArrived({
  questDate = QUEST_DATE_ISO,
  timeZone = CONFIG.timeZone,
  now = new Date(),
} = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(questDate || "")) return false;
  return dateKeyInTimeZone(now, timeZone) >= questDate;
}

export function questPassSummonSubtitle(opts) {
  return questDayHasArrived(opts) ? "Summoned for today's quest" : "Summoned for tomorrow's quest";
}

export function questPassPresentLine(opts) {
  return questDayHasArrived(opts)
    ? "Present this to the realm today."
    : "Present this to the realm tomorrow.";
}

export function questPassSealUntilLine(opts) {
  return questDayHasArrived(opts) ? "Seal it for today's quest" : "Seal it until tomorrow";
}

export function certificateIssueDateField(mode = "pass") {
  return mode === "completion" ? "certificateCompletionIssuedAt" : "certificatePassIssuedAt";
}

/** Warsaw calendar date (YYYY-MM-DD) for certificate issue, pinned in save state when persist is set. */
export function pinCertificateIssueDate(
  questState,
  mode = "pass",
  { now = new Date(), save } = {}
) {
  const field = certificateIssueDateField(mode);
  if (questState[field]) return questState[field];
  const timeZone = questState.timeZone || CONFIG.timeZone;
  questState[field] = dateKeyInTimeZone(now, timeZone);
  save?.();
  return questState[field];
}

export function getCertificateIssueDateIso(questState, mode = "pass", { now = new Date(), timeZone } = {}) {
  const field = certificateIssueDateField(mode);
  if (questState[field]) return questState[field];
  const tz = timeZone || questState.timeZone || CONFIG.timeZone;
  return dateKeyInTimeZone(now, tz);
}

export function certificateIssuedDayLabel(questState, mode = "pass", opts = {}) {
  const tz = opts.timeZone || questState.timeZone || CONFIG.timeZone;
  const iso = getCertificateIssueDateIso(questState, mode, opts);
  return formatQuestDate(iso, tz);
}

/** Certificate / quest-log summoned line using the issue date (not configured quest day). */
export function certificateSummonedForIssueLine(questState, mode = "pass", opts = {}) {
  const label = certificateIssuedDayLabel(questState, mode, opts);
  return `Summoned for today's quest (${label})`;
}

export function certificateSummonedForLine({
  rideDayLabel = QUEST_DATE_LABEL,
  ...opts
} = {}) {
  if (questDayHasArrived(opts)) {
    return `Summoned for today's quest (${rideDayLabel})`;
  }
  return `Summoned for: ${rideDayLabel}`;
}

export function certificatePassSubtitle(opts = {}) {
  if (chapterTwoIsAvailable(opts)) {
    return "Second quest: officially unlocked";
  }
  return "Second quest: seal pending (wax still cooling)";
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
  if (chapterTwoIsAvailable({ scheduledDate, timeZone, now, released: effectiveReleased })) {
    return "Your Chapter I answers are sealed. Tap below to begin today's adventure.";
  }
  return `Berke will unseal Chapter II on ${formatQuestDate(scheduledDate, timeZone)} morning.`;
}

export function chapterLockKicker({
  scheduledDate = CONFIG.scheduledDate,
  timeZone = CONFIG.timeZone,
  released = CHAPTER_TWO_RELEASED,
  now = new Date(),
} = {}) {
  if (chapterTwoIsAvailable({ scheduledDate, timeZone, now, released })) {
    return "Chapter II · seal broken";
  }
  return "Chapter II · sealed";
}

export function chapterLockSubline({
  scheduledDate = CONFIG.scheduledDate,
  timeZone = CONFIG.timeZone,
  released = CHAPTER_TWO_RELEASED,
  now = new Date(),
} = {}) {
  if (chapterTwoIsAvailable({ scheduledDate, timeZone, now, released })) {
    return "The calendar dragon finally accepted the bribe. It was potatoes.";
  }
  return "The horse is resting. The calendar dragon will not accept early bribes.";
}

export function chapterLockTitle({
  scheduledDate = CONFIG.scheduledDate,
  timeZone = CONFIG.timeZone,
  released = CHAPTER_TWO_RELEASED,
  now = new Date(),
} = {}) {
  const testOverride = globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__;
  const effectiveReleased =
    typeof testOverride === "boolean" ? testOverride : released;
  if (chapterTwoIsAvailable({ scheduledDate, timeZone, now, released: effectiveReleased })) {
    return "Chapter II is open";
  }
  if (chapterTwoOpensTomorrow({ scheduledDate, timeZone, now })) {
    return "The quest continues tomorrow";
  }
  return "Chapter II · sealed";
}

export function chapterLockButtonLabel(opts = {}) {
  return chapterTwoIsAvailable(opts) ? "Begin Chapter II" : "Check again";
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
  const anchor = new Date(Date.UTC(year, month - 1, day, 12));
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(anchor);
  const pick = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${pick("weekday")} ${pick("day")} ${pick("month")} ${pick("year")}`.trim();
}

export function todayQuestDateLabel({
  now = new Date(),
  timeZone = CONFIG.timeZone,
  locale = "en-GB",
} = {}) {
  return formatQuestDate(dateKeyInTimeZone(now, timeZone), timeZone, locale);
}
