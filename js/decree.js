import { CONFIG, tarotForKey } from "./config.js";
import { grantedToLabel, state } from "./state.js";
import { achievementCount, achievementLabelsMain, achievementLabelsBonus } from "./achievements.js";
import { showAppToast } from "./ui-feedback.js";

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

/** Day label only (chip/calendar), without sky-dial time duplicated in decree. */
export function dayLabelForDecree() {
  const raw = (state.day || "").trim();
  if (!raw) return "";
  const sep = raw.indexOf(" · ");
  if (sep > 0) return raw.slice(0, sep).trim();
  return raw;
}

export function whenWeRideLine() {
  const day = dayLabelForDecree() || "—";
  const time = (state.time || "").trim();
  if (!time || day === "—") return `When we ride: ${day}`;
  if (day.includes(time)) return `When we ride: ${day}`;
  return `When we ride: ${day} · ${time}`;
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

  const tarotMeta = state.tarotKey ? tarotForKey(state.tarotKey) : null;
  const oracleLine = state.tarotCard
    ? `Oracle's card: ${state.tarotCard} (${tarotMeta?.short || "—"})`
    : null;

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
    whenWeRideLine(),
    ...(oracleLine ? [oracleLine] : []),
    `Secret ingredient: ${state.notes || "—"}`,
    fanumLine(),
    achLine,
    "Sealed with wax (and one horse hair, for authenticity).",
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

  const lineH = 30;
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
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("decree toBlob returned null"));
    }, "image/png");
  });
}

export async function downloadDecreePng() {
  try {
    const blob = await decreeToBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "royal-quest-decree.png";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    showAppToast("Couldn't save the decree image — try Copy decree instead.");
  }
}

function whatsAppFallbackUrl(text) {
  const num = CONFIG.whatsappNumber?.replace(/\D/g, "");
  const encoded = encodeURIComponent(text);
  return num ? `https://wa.me/${num}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export async function shareDecree() {
  const text = buildSummaryText();
  const waUrl = whatsAppFallbackUrl(text);
  const popup = window.open("about:blank", "_blank", "noopener,noreferrer");

  let blob = null;
  try {
    blob = await decreeToBlob();
  } catch {
    showAppToast("Couldn't prepare the decree image — sharing text only.");
  }

  const file =
    blob ? new File([blob], "royal-quest-decree.png", { type: "image/png" }) : null;
  const canShareFiles =
    file && navigator.share && navigator.canShare?.({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: "Royal Quest Decree",
        text,
      });
      popup?.close();
      return;
    } catch (err) {
      if (err?.name === "AbortError") {
        popup?.close();
        return;
      }
    }
  } else if (navigator.share) {
    try {
      await navigator.share({ title: "Royal Quest Decree", text });
      popup?.close();
      return;
    } catch (err) {
      if (err?.name === "AbortError") {
        popup?.close();
        return;
      }
    }
  }

  if (popup && !popup.closed) {
    popup.location.href = waUrl;
    return;
  }
  const opened = window.open(waUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    showAppToast("Pop-up blocked — copy the decree or try again from the share button.");
  }
}
