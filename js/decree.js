import { CONFIG, tarotForKey } from "./config.js?v=20261209";
import {
  adventurerDisplayName,
  decreeCompanionLogLine,
  decreeSteedClassLine,
  provisionsForDecree,
} from "./chapter2-callbacks.js?v=20261209";
import { state } from "./state.js?v=20261209";
import { achievementCount } from "./achievements.js?v=20261209";
import { showAppToast } from "./ui-feedback.js?v=20261209";

function questAnswerLine() {
  const answers = {
    yes: "Quest invitation: accepted",
    maybe: "Quest invitation: accepted, with sensible curiosity",
    no: "Quest invitation: respectfully declined",
  };
  return answers[state.secondDate] || "Quest invitation: accepted";
}

function futureQuestLine() {
  const answers = {
    yes: "Another side quest: yes",
    maybe: "Another side quest: maybe — ask later",
    "not-now": "Another side quest: not right now",
  };
  return answers[state.futureQuest] || "Another side quest: no answer recorded";
}

export function dayLabelForDecree() {
  const raw = (state.day || "").trim();
  if (!raw) return "";
  const sep = raw.indexOf(" · ");
  return sep > 0 ? raw.slice(0, sep).trim() : raw;
}

export function whenWeRideLine() {
  const day = dayLabelForDecree() || "—";
  const time = (state.time || "").trim();
  if (!time || day === "—" || day.includes(time)) return `When we ride: ${day}`;
  return `When we ride: ${day} · ${time}`;
}

export function buildPassText() {
  const tarotMeta = state.tarotKey ? tarotForKey(state.tarotKey) : null;
  return [
    "QUEST PLAN READY · LOG NO. 002",
    `Issued to: ${adventurerDisplayName(state)}, ${decreeSteedClassLine(state)}`,
    decreeCompanionLogLine(state.chapter1Answers),
    `Steed: ${state.steedName}`,
    `Adventure energy: ${state.rating || 3}/5${state.ratingChip ? ` · ${state.ratingChip}` : ""}`,
    `The quest could feel like: ${state.todayVibe || "—"}`,
    questAnswerLine(),
    `Provisions: ${provisionsForDecree(state).join("; ") || "—"}`,
    `Activities: ${state.activities.join("; ") || "—"}`,
    `Potion: ${state.potionName || "—"}`,
    whenWeRideLine(),
    ...(state.tarotCard
      ? [`Oracle's clue: ${state.tarotCard} (${tarotMeta?.short || "—"})`]
      : []),
    `Note for the quest: ${state.notes || "—"}`,
    `Achievements found: ${achievementCount()}`,
    "Quest plan sealed. Details may still change without angering the horse.",
  ].join("\n");
}

export function buildCompletionText() {
  return [
    "SECOND QUEST COMPLETE · LOG NO. 002",
    `Adventurer: ${adventurerDisplayName(state)}, ${decreeSteedClassLine(state)}`,
    `Steed: ${state.steedName}`,
    `Party buff: ${state.partyBuff || "Improvised courage"}`,
    `Favourite moment: ${state.favoriteMoment || "Not recorded"}`,
    `Quest badge: ${state.questBadge || "Quest completed"}`,
    futureQuestLine(),
    "Final status: the sequel was survived.",
    "No dragons were harmed. One horse remains opinionated.",
  ].join("\n");
}

export function buildSummaryText(mode = "auto") {
  const resolved = mode === "auto" ? (state.chapterTwoComplete ? "completion" : "pass") : mode;
  return resolved === "completion" ? buildCompletionText() : buildPassText();
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderDecreeCanvas(mode = "auto") {
  await document.fonts.ready;
  const text = buildSummaryText(mode);
  const title = text.split("\n")[0];
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1400;
  const ctx = canvas.getContext("2d");

  const parchment = new Image();
  parchment.src = "assets/images/parchment.webp";
  await parchment.decode().catch(() => undefined);
  if (parchment.complete && parchment.naturalWidth) {
    ctx.drawImage(parchment, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#f4e8d0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const frame = 126;
  const innerX = 156;
  const innerW = canvas.width - innerX * 2;
  const flatTop = 220;
  const flatBottom = canvas.height - 310;
  const sigY = flatBottom - 36;

  ctx.strokeStyle = "#6b2d3a";
  ctx.lineWidth = 6;
  ctx.strokeRect(frame - 14, frame - 14, canvas.width - 2 * (frame - 14), canvas.height - 2 * (frame - 14));
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 2;
  ctx.strokeRect(frame, frame, canvas.width - 2 * frame, canvas.height - 2 * frame);

  ctx.fillStyle = "#4a1f28";
  ctx.font = '700 38px "Cinzel", serif';
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, flatTop - 52);

  ctx.textAlign = "left";
  ctx.font = '400 25px "Crimson Pro", serif';
  const rendered = text
    .split("\n")
    .slice(1)
    .flatMap((paragraph) => wrapLines(ctx, paragraph, innerW));
  const lineH = 31;
  const available = sigY - flatTop - 44;
  let y = flatTop + Math.max(0, (available - rendered.length * lineH) / 2);
  for (const line of rendered) {
    ctx.fillText(line, innerX, y);
    y += lineH;
  }

  ctx.font = 'italic 26px "Dancing Script", cursive';
  ctx.fillText(adventurerDisplayName(state), innerX, sigY);
  ctx.fillText(CONFIG.fromName, innerX + innerW - 220, sigY);
  return canvas;
}

export async function decreeToBlob(mode = "auto") {
  const canvas = await renderDecreeCanvas(mode);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("decree toBlob returned null"));
    }, "image/png");
  });
}

export async function downloadDecreePng(mode = "auto") {
  const resolved = mode === "auto" ? (state.chapterTwoComplete ? "completion" : "pass") : mode;
  try {
    const blob = await decreeToBlob(resolved);
    const anchor = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    anchor.href = objectUrl;
    anchor.download = resolved === "completion" ? "second-quest-complete.png" : "full-quest-log.png";
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    showAppToast("Quest log download started.");
  } catch {
    showAppToast("Couldn't save the decree image — try Copy pass instead.");
  }
}

function whatsAppFallbackUrl(text) {
  const num = CONFIG.whatsappNumber?.replace(/\D/g, "");
  const encoded = encodeURIComponent(text);
  return num ? `https://wa.me/${num}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export async function shareDecree(mode = "auto") {
  const resolved = mode === "auto" ? (state.chapterTwoComplete ? "completion" : "pass") : mode;
  const summary = buildSummaryText(resolved);
  const fileName = resolved === "completion" ? "second-quest-complete.png" : "full-quest-log.png";
  const title = resolved === "completion" ? "Second quest complete" : "Full quest complete";
  const waUrl = whatsAppFallbackUrl(summary);
  const popup = window.open("about:blank", "quest-share");
  if (popup) popup.opener = null;

  let blob = null;
  try {
    blob = await decreeToBlob(resolved);
  } catch {
    showAppToast("Couldn't prepare the decree image — sharing text only.");
  }

  const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;
  const canShareFiles = file && navigator.share && navigator.canShare?.({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({ files: [file], title, text: summary });
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
      await navigator.share({ title, text: summary });
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
