/** Placeholder Sir Berke portraits — replace with final art at same paths. */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "../assets/characters");
await mkdir(out, { recursive: true });

const variants = {
  "sir-berke-stand.webp": ["#6b2d3a", "#c9a227"],
  "sir-berke-wave.webp": ["#4a1f28", "#e8c96a"],
  "sir-berke-shield.webp": ["#5a6a7a", "#8b7355"],
};

for (const [file, [a, b]] of Object.entries(variants)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <ellipse cx="256" cy="300" rx="140" ry="160" fill="${b}" opacity="0.9"/>
    <circle cx="256" cy="180" r="90" fill="${a}"/>
    <rect x="180" y="240" width="152" height="120" rx="20" fill="${a}" opacity="0.85"/>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(join(out, file));
  console.log("wrote", file);
}
