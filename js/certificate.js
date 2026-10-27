import { QUEST_DATE_LABEL } from "./app-config.js";
import { adventurerDisplayName } from "./chapter2-callbacks.js";
import { adventurerProfileFromAnswers } from "./chapter1-survey-data.js";
import { buildRealmCertificateNotes } from "./certificate-notes.js";
import { horseById } from "./horses.js";
import { state } from "./state.js";
import { dayLabelForDecree } from "./decree.js";
import { showAppToast } from "./ui-feedback.js";

export const CERT_WIDTH = 1080;
export const CERT_MIN_HEIGHT = 1120;
/** Parchment bottom roll + baked wax seal — keep body text above this. */
export const CERT_BOTTOM_RESERVE = 210;

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

function typography(scale) {
  return {
    title: `700 ${Math.round(42 * scale)}px "Cinzel", serif`,
    subtitle: `600 ${Math.round(28 * scale)}px "Cinzel", serif`,
    body: `400 ${Math.round(26 * scale)}px "Crimson Pro", serif`,
    note: `400 ${Math.round(22 * scale)}px "Crimson Pro", serif`,
    section: `600 ${Math.round(24 * scale)}px "Cinzel", serif`,
    blank: 10 * scale,
    lineBody: 32 * scale,
    lineNote: 30 * scale,
  };
}

function drawBodyLines(g, lines, startY, maxW, scale = 1) {
  const t = typography(scale);
  let y = startY;
  for (const line of lines) {
    if (!line) {
      y += t.blank;
      continue;
    }
    const isNote = line.startsWith("• ");
    g.font = isNote
      ? t.note
      : line.startsWith("Official notes")
        ? t.section
        : t.body;
    if (isNote && g.measureText(line).width > maxW) {
      const words = line.slice(2).split(" ");
      let row = "• ";
      for (const word of words) {
        const test = `${row}${word} `;
        if (g.measureText(test).width > maxW && row !== "• ") {
          g.fillText(row.trimEnd(), 100, y);
          y += t.lineNote - 2;
          row = `• ${word} `;
        } else {
          row = test;
        }
      }
      g.fillText(row.trimEnd(), 100, y);
      y += t.lineNote;
    } else {
      g.fillText(line, 100, y);
      y += isNote ? t.lineNote : t.lineBody;
    }
  }
  return y;
}

function measureBodyEnd(g, lines, maxW, scale) {
  return drawBodyLines(g, lines, 0, maxW, scale);
}

/** Pick a scale so body copy fills flat parchment without overlapping the bottom roll. */
export function certificateBodyScale(lines, canvasHeight = CERT_MIN_HEIGHT) {
  const maxW = CERT_WIDTH - 200;
  const bodyTop = 200;
  const available = canvasHeight - CERT_BOTTOM_RESERVE - bodyTop;
  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = CERT_WIDTH;
  measureCanvas.height = 400;
  const g = measureCanvas.getContext("2d");
  g.fillStyle = "#4a1f28";

  let scale = 1;
  let end = measureBodyEnd(g, lines, maxW, scale);
  while (end < available * 0.9 && scale < 1.38) {
    scale += 0.04;
    end = measureBodyEnd(g, lines, maxW, scale);
  }
  while (end > available && scale > 0.92) {
    scale -= 0.03;
    end = measureBodyEnd(g, lines, maxW, scale);
  }
  return { scale, contentEnd: end, bodyStart: bodyTop };
}

export async function renderCertificateCanvas(mode = "pass") {
  await document.fonts.ready;
  const w = CERT_WIDTH;
  const lines = buildCertificateLines(mode);
  const subtitle = lines[1];
  const bodyLines = lines.filter((l) => l !== "ROYAL QUEST CERTIFICATE" && l !== subtitle);

  let h = CERT_MIN_HEIGHT;
  let layout = certificateBodyScale(bodyLines, h);
  if (layout.contentEnd + CERT_BOTTOM_RESERVE + 40 > h) {
    h = Math.round(layout.contentEnd + CERT_BOTTOM_RESERVE + 48);
    layout = certificateBodyScale(bodyLines, h);
  }

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

  const { scale, contentEnd, bodyStart } = layout;
  const available = h - CERT_BOTTOM_RESERVE - bodyStart;
  const yOffset = Math.max(0, (available - contentEnd) * 0.12);
  const t = typography(scale);

  g.fillStyle = "#4a1f28";
  g.font = t.title;
  g.textAlign = "center";
  g.fillText("ROYAL QUEST CERTIFICATE", w / 2, 108 * scale);

  g.font = t.subtitle;
  g.fillText(subtitle, w / 2, 158 * scale);

  g.textAlign = "left";
  drawBodyLines(g, bodyLines, bodyStart + yOffset, w - 200, scale);

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
