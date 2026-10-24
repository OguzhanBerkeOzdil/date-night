import { CONFIG } from "./config.js";
import { grantedToLabel, state } from "./state.js";
import { achievementCount, achievementLabelsMain, achievementLabelsBonus } from "./achievements.js";

function fleeAttemptsPhrase(n) {
  const count = Math.max(0, Number(n) || 0);
  return count === 1 ? "1 attempt to flee" : `${count} attempts to flee`;
}

function questAnswerLine() {
  if (state.honestNo) {
    return "Another quest: respectfully declined (thank you for your honesty)";
  }
  if (state.secondDate === "yes") {
    return `Another quest: AYE (befriended the Dragon of Doubt after ${fleeAttemptsPhrase(state.noAttempts)})`;
  }
  return "Another quest: —";
}

function fanumLine() {
  if (state.fanumTax) return "Fanum tax: approved by ancient law ✓";
  return "Fanum tax: waived by royal mercy (he'll survive)";
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
    fanumLine(),
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

  const frame = 88;
  const innerX = 128;
  const innerW = w - innerX * 2;
  const flatTop = 200;
  const flatBottom = h - 260;
  const sigY = flatBottom - 36;

  g.strokeStyle = "#6b2d3a";
  g.lineWidth = 6;
  g.strokeRect(frame - 12, frame - 12, w - 2 * (frame - 12), h - 2 * (frame - 12));
  g.strokeStyle = "#c9a227";
  g.lineWidth = 2;
  g.strokeRect(frame, frame, w - 2 * frame, h - 2 * frame);

  g.fillStyle = "#4a1f28";
  g.font = '700 38px "Cinzel", serif';
  g.textAlign = "center";
  g.fillText("ROYAL QUEST DECREE · No. 002", w / 2, flatTop - 52);

  g.textAlign = "left";
  g.font = '400 25px "Crimson Pro", serif';
  const bodyParagraphs = buildSummaryText()
    .split("\n")
    .filter((line) => !line.startsWith("ROYAL QUEST"));

  const rendered = [];
  for (const paragraph of bodyParagraphs) {
    rendered.push(...wrapLines(g, paragraph, innerW));
  }

  const lineH = 32;
  const blockH = rendered.length * lineH;
  const sigBlock = 44;
  const available = sigY - flatTop - sigBlock;
  let y = flatTop + Math.max(0, (available - blockH) / 2);

  for (const line of rendered) {
    g.fillText(line, innerX, y);
    y += lineH;
  }

  g.font = 'italic 26px "Dancing Script", cursive';
  g.fillText(grantedToLabel(), innerX, sigY);
  g.fillText(CONFIG.fromName, innerX + innerW - 220, sigY);

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
