import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";

import { MUSIC_SRC } from "../../js/app-config.js?v=20261214";

test("the supplied quest soundtrack is configured and present", async () => {
  assert.equal(MUSIC_SRC, "../assets/audio/quest-theme.mp3");
  const audioPath = new URL("../../assets/audio/quest-theme.mp3", import.meta.url);
  const info = await stat(audioPath);
  assert.ok(info.size > 1_000_000, "soundtrack should be the supplied full MP3");
});
