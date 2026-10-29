import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HORSE_BREEDS,
  horseById,
  horseFedImageUrl,
  horseImageUrl,
  horseHasArt,
} from "../../js/horses.js?v=20261210";

test("has ten horse breeds including joke steed", () => {
  assert.equal(HORSE_BREEDS.length, 10);
  assert.ok(HORSE_BREEDS.some((h) => h.id === "definitely-a-horse"));
});

test("horseImageUrl uses assets/horses path", () => {
  assert.equal(horseImageUrl("palomino"), "assets/horses/palomino.webp");
  assert.equal(horseFedImageUrl("palomino"), "assets/horses/fed/palomino.webp");
  assert.equal(horseById("unknown").id, "chestnut");
  assert.equal(horseHasArt("palomino"), true);
  assert.equal(horseHasArt("bay"), false);
});
