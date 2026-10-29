import test from "node:test";
import assert from "node:assert/strict";

import {
  chapterOneIsArchived,
  isArchivedChapterOneScreen,
} from "../../js/quest-phase.js?v=20261209";

test("Chapter I is archived in production", () => {
  delete globalThis.__CHAPTER_ONE_ARCHIVED_OVERRIDE__;
  assert.equal(chapterOneIsArchived(), true);
  assert.equal(isArchivedChapterOneScreen("eve-name"), true);
  assert.equal(isArchivedChapterOneScreen("chapter-two-start"), false);
});

test("archived Chapter I remains available only to explicit QA fixtures", () => {
  globalThis.__CHAPTER_ONE_ARCHIVED_OVERRIDE__ = false;
  assert.equal(chapterOneIsArchived(), false);
  assert.equal(isArchivedChapterOneScreen("eve-pass"), false);
  delete globalThis.__CHAPTER_ONE_ARCHIVED_OVERRIDE__;
});
