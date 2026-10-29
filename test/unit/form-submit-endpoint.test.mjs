import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FORM_SOURCE_URL,
  FORM_SUBMIT_ENDPOINT,
} from "../../js/app-config.js?v=20261212";

test("FormSubmit uses alias endpoint without raw email", () => {
  assert.match(FORM_SUBMIT_ENDPOINT, /2ee0a4c67c7dbdb0028492bf48d9df9a/);
  assert.doesNotMatch(FORM_SUBMIT_ENDPOINT, /@/);
  assert.equal(FORM_SOURCE_URL, "https://oguzhanberkeozdil.github.io/date-night/");
});
