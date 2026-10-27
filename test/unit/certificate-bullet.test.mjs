import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutBulletNoteRows } from "../../js/certificate-bullet.js";

test("wrapped bullet uses hanging indent without extra bullets", () => {
  const measure = (text) => text.length * 8;
  const note =
    "• Pacifist potato farmer certified to carry a decorative sword (unloaded) and other very long realm paperwork";
  const { rows } = layoutBulletNoteRows(measure, note, 200);
  assert.ok(rows.length >= 2);
  assert.ok(rows[0].text.startsWith("• "));
  for (let i = 1; i < rows.length; i++) {
    assert.equal(rows[i].text.startsWith("• "), false, `row ${i} should not repeat bullet`);
    assert.ok(rows[i].indent > 0);
  }
});
