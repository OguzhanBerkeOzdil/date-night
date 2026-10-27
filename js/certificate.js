import { QUEST_DATE_LABEL } from "./app-config.js";
import { adventurerDisplayName } from "./chapter2-callbacks.js";
import { adventurerProfileFromAnswers } from "./chapter1-survey-data.js";
import { buildRealmCertificateNotes } from "./certificate-notes.js";
import { horseById } from "./horses.js";
import { state } from "./state.js";
import { dayLabelForDecree } from "./decree.js";
import { showAppToast } from "./ui-feedback.js";
import { drawDecreeWaxSeal } from "./wax-seal-art.js";

export function buildCertificateLines(mode = "pass") {
  const horse = horseById(state.horseId || "chestnut");
  const rideDay = dayLabelForDecree() || QUEST_DATE_LABEL;
  const profile = adventurerProfileFromAnswers(state.chapter1Answers);
  const adventurer = adventurerDisplayName(state);
  const subtitle =
    mode === "completion" ? "Second quest: survived (snacks included)" : "Second quest: officially unlocked";
  return [
    "ROYAL QUEST CERTIFICATE",
    subtitle,
    "",
    `Adventurer: ${adventurer}`,
    `Steed: ${horse.coat} — named "${state.steedName || horse.defaultName}"`,
    `Summoned for: ${rideDay}`,
    "",
    "Adventurer profile (Chapter I):",
    `Class: ${profile.class}`,
    `Weapon: ${profile.weapon}`,
    `Companion: ${profile.companion}`,
    "",
    "Official notes from the realm:",
    ...buildRealmCertificateNotes().map((n) => `• ${n}`),
    "",
    "Signed under wax (and mild chaos).",
  ];
}

function drawBodyLines(g, lines, startY, maxW) {
  let y = startY;
  for (const line of lines) {
    if (!line) {
      y += 10;
      continue;
    }
    const isNote = line.startsWith("• ");
    g.font = isNote
      ? '400 20px "Crimson Pro", serif'
      : line.startsWith("Official notes")
        ? '600 22px "Cinzel", serif'
        : '400 24px "Crimson Pro", serif';
    if (isNote && g.measureText(line).width > maxW) {
      const words = line.slice(2).split(" ");
      let row = "• ";
      for (const word of words) {
        const test = `${row}${word} `;
        if (g.measureText(test).width > maxW && row !== "• ") {
          g.fillText(row.trimEnd(), 100, y);
          y += 26;
          row = `• ${word} `;
        } else {
          row = test;
        }
      }
      g.fillText(row.trimEnd(), 100, y);
      y += 28;
    } else {
      g.fillText(line, 100, y);
      y += isNote ? 28 : 32;
    }
  }
  return y;
}

export async function renderCertificateCanvas(mode = "pass") {
  await document.fonts.ready;
  const w = 1080;
  const lines = buildCertificateLines(mode);
  const subtitle = lines[1];
  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = w;
  measureCanvas.height = 400;
  const measureG = measureCanvas.getContext("2d");
  measureG.fillStyle = "#4a1f28";
  const bodyLines = lines.filter((l) => l !== "ROYAL QUEST CERTIFICATE" && l !== subtitle);
  const contentEnd = drawBodyLines(measureG, bodyLines, 0, w - 280);
  const h = Math.max(1120, Math.round(contentEnd + 200));

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");

  const parchment = new Image();
  parchment.src = "assets/images/parchment.webp";
  await parchment.decode().catch(() => {});
  if (parchment.complete && parchment.naturalWidth) {
    g.drawImage(parchment, 0, 0, w, h);
  } else {
    g.fillStyle = "#f4e8d0";
    g.fillRect(0, 0, w, h);
  }

  g.fillStyle = "#4a1f28";
  g.font = '700 42px "Cinzel", serif';
  g.textAlign = "center";
  g.fillText("ROYAL QUEST CERTIFICATE", w / 2, 120);

  g.font = '600 28px "Cinzel", serif';
  g.fillText(subtitle, w / 2, 168);

  g.textAlign = "left";
  const endY = drawBodyLines(g, bodyLines, 220, w - 280);
  drawDecreeWaxSeal(g, w - 118, Math.min(h - 100, endY + 40), 38);

  return c;
}

export async function downloadCertificatePng(mode = "pass") {
  try {
    const c = await renderCertificateCanvas(mode);
    const blob = await new Promise((resolve, reject) => {
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob null"))), "image/png");
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "quest-certificate.png";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    showAppToast("Couldn't save the certificate — try again in a moment.");
  }
}
