/**
 * Painted-style placeholder WebPs for Chapter I survey (replace with final art later).
 * Run: node scripts/generate-chapter1-placeholders.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outChars = join(root, "assets/characters");
const outEquip = join(root, "assets/equipment");

const SIZE = 480;

const PALETTE = {
  parchment: "#f4e8d0",
  burgundy: "#6b2d3a",
  gold: "#c9a227",
  forest: "#2d4a35",
  sky: "#8eb4c8",
};

async function paintedCircle(name, colors) {
  const [a, b, c] = colors;
  const svg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="55%" stop-color="${b}"/>
      <stop offset="100%" stop-color="${c}"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${PALETTE.parchment}" opacity="0.15"/>
  <ellipse cx="${SIZE / 2}" cy="${SIZE * 0.55}" rx="${SIZE * 0.38}" ry="${SIZE * 0.42}" fill="url(#g)" opacity="0.95"/>
  <ellipse cx="${SIZE / 2}" cy="${SIZE * 0.38}" rx="${SIZE * 0.28}" ry="${SIZE * 0.3}" fill="${b}" opacity="0.85"/>
</svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 82, effort: 4 }).toBuffer();
}

async function paintedItem(colors) {
  const [a, b] = colors;
  const svg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${PALETTE.parchment}" opacity="0.12"/>
  <path d="M${SIZE * 0.5} ${SIZE * 0.12} L${SIZE * 0.68} ${SIZE * 0.88} L${SIZE * 0.32} ${SIZE * 0.88} Z" fill="${a}" stroke="${PALETTE.burgundy}" stroke-width="6"/>
  <rect x="${SIZE * 0.42}" y="${SIZE * 0.35}" width="${SIZE * 0.16}" height="${SIZE * 0.35}" rx="8" fill="${b}" opacity="0.9"/>
</svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 82, effort: 4 }).toBuffer();
}

const characters = {
  "lucius-bard.webp": [PALETTE.gold, "#e8c96a", PALETTE.burgundy],
  "reginald-paladin.webp": ["#9aa8b8", "#d8e0e8", PALETTE.burgundy],
  "marta-tavern.webp": ["#c4784a", "#8b4a2a", PALETTE.forest],
  "royal-goose.webp": ["#f0f0e8", "#d0d0c0", "#6a6a60"],
  "gerald-accountant.webp": ["#7a8a6a", "#4a5a40", PALETTE.burgundy],
};

const equipment = {
  "sword.webp": [PALETTE.sky, "#c0c8d0"],
  "longbow.webp": [PALETTE.forest, "#5a7a50"],
  "lute.webp": [PALETTE.gold, "#a87830"],
  "staff.webp": ["#8b6ac8", "#5a3a98"],
  "frying-pan.webp": ["#4a4a4a", "#888"],
  "flower.webp": ["#e88aa8", "#7cb86a"],
};

await mkdir(outChars, { recursive: true });
await mkdir(outEquip, { recursive: true });

for (const [file, colors] of Object.entries(characters)) {
  const buf = await paintedCircle(file, colors);
  await sharp(buf).resize(512, 512, { fit: "inside" }).webp({ quality: 80 }).toFile(join(outChars, file));
  console.log("wrote", join("assets/characters", file));
}

for (const [file, colors] of Object.entries(equipment)) {
  const buf = await paintedItem(colors);
  await sharp(buf).resize(512, 512, { fit: "inside" }).webp({ quality: 80 }).toFile(join(outEquip, file));
  console.log("wrote", join("assets/equipment", file));
}
