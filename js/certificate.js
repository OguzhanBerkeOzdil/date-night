import { QUEST_DATE_LABEL } from "./app-config.js";
import { adventurerProfileFromAnswers } from "./chapter1-survey-data.js";
import { horseById } from "./horses.js";
import { grantedToLabel, state } from "./state.js";
import { dayLabelForDecree } from "./decree.js";
import { showAppToast } from "./ui-feedback.js";

export function buildCertificateLines() {
  const horse = horseById(state.horseId || "chestnut");
  const rideDay = dayLabelForDecree() || QUEST_DATE_LABEL;
  const profile = adventurerProfileFromAnswers(state.chapter1Answers);
  return [
    "ROYAL QUEST CERTIFICATE",
    "Second quest: officially unlocked",
    "",
    `Adventurer: ${grantedToLabel()}`,
    `Steed: ${horse.coat} — named "${state.steedName || horse.defaultName}"`,
    `Summoned for: ${rideDay}`,
    "",
    "Adventurer profile (Chapter I):",
    `Class: ${profile.class}`,
    `Weapon: ${profile.weapon}`,
    `Companion: ${profile.companion}`,
    "",
    "Signed under wax (and mild chaos).",
    "No destiny speeches. Just a good plan.",
  ];
}

export async function renderCertificateCanvas() {
  await document.fonts.ready;
  const w = 1080;
  const h = 720;
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

  g.strokeStyle = "#6b2d3a";
  g.lineWidth = 5;
  g.strokeRect(48, 48, w - 96, h - 96);
  g.strokeStyle = "#c9a227";
  g.lineWidth = 2;
  g.strokeRect(64, 64, w - 128, h - 128);

  g.fillStyle = "#4a1f28";
  g.font = '700 42px "Cinzel", serif';
  g.textAlign = "center";
  g.fillText("ROYAL QUEST CERTIFICATE", w / 2, 130);

  g.font = '600 28px "Cinzel", serif';
  g.fillText("Second quest: officially unlocked", w / 2, 180);

  g.textAlign = "left";
  g.font = '400 26px "Crimson Pro", serif';
  const lines = buildCertificateLines().filter((l) => !l.startsWith("ROYAL QUEST"));
  let y = 240;
  for (const line of lines) {
    if (!line) {
      y += 12;
      continue;
    }
    g.fillText(line, 100, y);
    y += 36;
  }

  const seal = new Image();
  seal.src = "assets/images/wax-seal.webp";
  await seal.decode().catch(() => {});
  if (seal.complete && seal.naturalWidth) {
    g.drawImage(seal, w - 220, h - 200, 120, 120);
  }

  return c;
}

export async function downloadCertificatePng() {
  try {
    const c = await renderCertificateCanvas();
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
