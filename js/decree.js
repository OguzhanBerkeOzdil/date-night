import { CONFIG } from "./config.js";
import { grantedToLabel, guest, state, letterSalutation } from "./state.js";
import { achievementCount, achievementLabelsMain, achievementLabelsBonus } from "./achievements.js";

function questAnswerLine() {
  if (state.honestNo) {
    return "Another quest: respectfully declined (thank you for your honesty)";
  }
  if (state.secondDate === "yes") {
    return `Another quest: AYE (befriended the Dragon of Doubt after ${state.noAttempts} attempts to flee)`;
  }
  return "Another quest: —";
}

export function buildSummaryText() {
  const rating =
    state.ratingBonus || state.rating >= 11
      ? "11/10 · Legendary"
      : state.ratingChip
        ? `Re-rated: still a 10 (${state.ratingChip})`
        : "10/10";
  const mainAch = achievementLabelsMain();
  const bonusAch = achievementLabelsBonus();
  const achLine = `Achievements: ${achievementCount()}/10 — ${mainAch.join(", ") || "—"}${
    bonusAch.length ? ` (+ bonus: ${bonusAch.join(", ")})` : ""
  }`;

  const lines = [
    "ROYAL QUEST DECREE · No. 002",
    `Granted to: ${grantedToLabel()}, ${state.steedClass || "Adventurer"}`,
    `Steed: ${state.steedName} (Affection: MAX)`,
    `Today's rating: ${rating}`,
    `Today felt like: ${state.todayVibe || "—"}`,
    questAnswerLine(),
    `Provisions: ${state.food.join("; ") || "—"}`,
    `Potion: ${state.potionName || "—"}`,
    `Activities: ${state.activities.join("; ") || "—"}`,
    `When we ride: ${state.day || "—"} · ${state.time || "—"}`,
    `Secret ingredient: ${state.notes || "—"}`,
    "Fanum tax: approved by ancient law ✓",
    achLine,
    "Sealed with wax (and feelings).",
  ];
  return lines.join("\n");
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderDecreeCanvas() {
  await document.fonts.ready;
  const w = 1080;
  const h = 1400;
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

  const margin = 72;
  g.strokeStyle = "#6b2d3a";
  g.lineWidth = 6;
  g.strokeRect(margin - 16, margin - 16, w - 2 * (margin - 16), h - 2 * (margin - 16));
  g.strokeStyle = "#c9a227";
  g.lineWidth = 2;
  g.strokeRect(margin, margin, w - 2 * margin, h - 2 * margin);

  let y = margin + 56;
  g.fillStyle = "#4a1f28";
  g.font = '700 40px "Cinzel", serif';
  g.textAlign = "center";
  g.fillText("ROYAL QUEST DECREE · No. 002", w / 2, y);
  y += 48;

  g.textAlign = "left";
  g.font = '400 26px "Crimson Pro", serif';
  const bodyLines = buildSummaryText()
    .split("\n")
    .filter((line) => !line.startsWith("ROYAL QUEST"));

  const maxW = w - margin * 2;
  for (const paragraph of bodyLines) {
    const wrapped = wrapLines(g, paragraph, maxW);
    for (const line of wrapped) {
      if (y > h - margin - 80) break;
      g.fillText(line, margin, y);
      y += 34;
    }
    y += 6;
  }

  g.font = 'italic 28px "Dancing Script", cursive';
  g.fillText(grantedToLabel(), margin, h - margin - 36);
  g.fillText(CONFIG.fromName, w - margin - 200, h - margin - 36);

  return c;
}

export async function decreeToBlob() {
  const c = await renderDecreeCanvas();
  return new Promise((r) => c.toBlob(r, "image/png"));
}

export async function downloadDecreePng() {
  const blob = await decreeToBlob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "royal-quest-decree.png";
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function shareDecree() {
  const text = encodeURIComponent(buildSummaryText());
  const num = CONFIG.whatsappNumber?.replace(/\D/g, "");
  const waUrl = num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;

  let blob;
  try {
    blob = await decreeToBlob();
  } catch (_) {}

  if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], "decree.png", { type: "image/png" })] })) {
    try {
      await navigator.share({
        files: [new File([blob], "royal-quest-decree.png", { type: "image/png" })],
        title: "Royal Quest Decree",
        text: buildSummaryText(),
      });
      return;
    } catch (_) {}
  }
  window.open(waUrl, "_blank", "noopener,noreferrer");
}
