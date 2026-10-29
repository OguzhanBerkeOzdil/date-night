import { CHAPTER_ONE_ARCHIVED } from "./app-config.js?v=20261211";

const CHAPTER_ONE_SCREENS = new Set([
  "eve-name",
  "eve-excitement",
  "eve-packing",
  "eve-survey",
  "eve-pass",
  "eve-honest",
]);

/** Production phase gate with a test-only in-memory override. */
export function chapterOneIsArchived() {
  const override = globalThis.__CHAPTER_ONE_ARCHIVED_OVERRIDE__;
  return typeof override === "boolean" ? override : CHAPTER_ONE_ARCHIVED;
}

/** Prevent stale links or browser history from reopening the finished chapter. */
export function isArchivedChapterOneScreen(screenId) {
  return chapterOneIsArchived() && CHAPTER_ONE_SCREENS.has(screenId);
}
