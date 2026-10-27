#!/usr/bin/env node
/**
 * Build a cross-device ?seed= link from owner JSON (FormSubmit-style choices payload).
 *
 * Usage: node scripts/make-seed-link.mjs path/to/answers.json
 *
 * JSON shape:
 * {
 *   "name": "Adventurer",
 *   "excitement": 4,
 *   "packing": ["cloak"],
 *   "horse": "chestnut",
 *   "outcome": "yes",
 *   "survey": { "class": { "id": "bard", "label": "Bard" }, ... }
 * }
 */
import { readFile } from "node:fs/promises";
import { buildWireSeedFromOwnerJson, encodeSeedToBase64Url } from "../js/seed-link.js";

const SITE = "https://oguzhanberkeozdil.github.io/date-night/";
const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/make-seed-link.mjs <answers.json>");
  process.exit(1);
}

const raw = JSON.parse(await readFile(file, "utf8"));
const wire = buildWireSeedFromOwnerJson(raw);
const token = encodeSeedToBase64Url(wire);
const url = `${SITE}?seed=${token}`;

console.log(url);
console.log("\n(No QR library in this repo — paste the link above or generate a QR yourself.)");
