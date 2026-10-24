import { CONFIG } from "./config.js";
import { ladyTitle, guest, state } from "./state.js";
import { achievementCount, achievementLabels } from "./achievements.js";

export function buildSummaryText() {
  const rating =
    state.ratingBonus || state.rating >= 11
      ? "11/10 · Legendary"
      : state.ratingChip
        ? `Re-rated: still a 10 (${state.ratingChip})`
        : "10/10";
  const lines = [
    "⚜ ROYAL QUEST DECREE · No. 002",
    `Granted to: ${ladyTitle(guest)}, ${state.steedClass || "Adventurer"}`,
    `Steed: ${state.steedName} (Affection: MAX)`,
    `Today's rating: ${rating}`,
    `Today felt like: ${state.todayVibe || "—"}`,
    `Another quest: AYE (Dragon befriended after ${state.noAttempts} attempts to flee)`,
    `Provisions: ${state.food.join("; ") || "—"}`,
    `Potion: ${state.potionName || "—"}`,
    `Activities: ${state.activities.join("; ") || "—"}`,
    `When we ride: ${state.day || "—"} · ${state.time || "—"}`,
    `Secret ingredient: ${state.notes || "—"}`,
    "Fanum tax: approved by ancient law ✓",
    `Achievements: ${achievementCount()}/10 — ${achievementLabels().join(", ")}`,
    "Sealed with wax (and feelings).",
  ];
  return lines.join("\n");
}

export async function renderDecreeCanvas() {
  await document.fonts.ready;
  const w = 1080;
  const h = 1520;
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
  g.lineWidth = 8;
  g.strokeRect(40, 40, w - 80, h - 80);
  g.strokeStyle = "#c9a227";
  g.lineWidth = 2;
  g.strokeRect(56, 56, w - 112, h - 112);

  g.fillStyle = "#4a1f28";
  g.font = '700 42px "Cinzel", serif';
  g.textAlign = "center";
  g.fillText("ROYAL QUEST DECREE", w / 2, 120);
  g.font = '400 28px "Crimson Pro", serif';
  g.textAlign = "left";
  const text = buildSummaryText().split("\n");
  let y = 180;
  text.forEach((line) => {
    g.fillText(line, 80, y);
    y += 44;
  });

  g.font = 'italic 32px "Dancing Script", cursive';
  g.fillText(ladyTitle(guest), 120, h - 200);
  g.fillText(CONFIG.fromName, w - 320, h - 200);

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
