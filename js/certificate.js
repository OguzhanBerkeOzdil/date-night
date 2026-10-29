import { QUEST_DATE_LABEL } from "./app-config.js?v=20261209";
import { adventurerDisplayName } from "./chapter2-callbacks.js?v=20261209";
import { adventurerProfileFromAnswers } from "./chapter1-survey-data.js?v=20261209";
import { layoutBulletNoteRows } from "./certificate-bullet.js?v=20261209";
import { buildRealmCertificateNotes } from "./certificate-notes.js?v=20261209";
import { horseById } from "./horses.js?v=20261209";
import { certificatePassSubtitle, certificateSummonedForLine } from "./quest-date.js?v=20261209";
import { state } from "./state.js?v=20261209";
import { dayLabelForDecree } from "./decree.js?v=20261209";
import { showAppToast } from "./ui-feedback.js?v=20261209";

export const CERT_WIDTH = 1080;
export const CERT_MIN_HEIGHT = 1120;
/** Flat parchment starts below the top scroll roll. */
export const CERT_TOP_RESERVE = 124;
/** Parchment bottom roll + baked wax seal — keep body text above this. */
export const CERT_BOTTOM_RESERVE = 210;
const BODY_MARGIN_X = 100;
const BODY_MAX_W = CERT_WIDTH - 200;

export function buildCertificateLines(mode = "pass") {
  const horse = horseById(state.horseId || "chestnut");
  const rideDay = dayLabelForDecree() || QUEST_DATE_LABEL;
  const profile = adventurerProfileFromAnswers(state.chapter1Answers);
  const adventurer = adventurerDisplayName(state);
  const subtitle =
    mode === "completion"
      ? "Second quest: survived (snacks included)"
      : certificatePassSubtitle();
  const summonedLine = certificateSummonedForLine({ rideDayLabel: rideDay });
  return [
    "ROYAL QUEST CERTIFICATE",
    subtitle,
    "",
    `Adventurer: ${adventurer}`,
    `Steed: ${horse.coat} — named "${state.steedName || horse.defaultName}"`,
    summonedLine,
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

export function typography(scale) {
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

/** Title/subtitle baselines and first body baseline from scale (below top roll). */
export function certificateHeaderLayout(scale) {
  const titlePx = Math.round(42 * scale);
  const subtitlePx = Math.round(28 * scale);
  const titleY = CERT_TOP_RESERVE + titlePx;
  const subtitleY = titleY + Math.round(14 * scale) + subtitlePx;
  const gapAfterSubtitle = Math.round(22 * scale);
  const subtitleDescent = Math.round(subtitlePx * 0.35);
  const bodyStart = subtitleY + subtitleDescent + gapAfterSubtitle;
  return {
    titleY,
    subtitleY,
    bodyStart,
    titleTop: titleY - titlePx,
    subtitleBottom: subtitleY + subtitleDescent,
    titlePx,
    subtitlePx,
  };
}

function lineBox(baselineY, fontPx, kind = "body") {
  const ascent = fontPx * (kind === "title" ? 0.92 : 0.78);
  const descent = fontPx * 0.28;
  return { top: baselineY - ascent, bottom: baselineY + descent };
}

function drawBulletNoteBlock(g, noteLine, x, y, maxW, t) {
  g.font = t.note;
  const { rows } = layoutBulletNoteRows((text) => g.measureText(text).width, noteLine, maxW);
  for (const row of rows) {
    g.fillText(row.text, x + row.indent, y);
    y += row.indent > 0 ? t.lineNote - 2 : t.lineNote;
  }
  return y;
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
    if (isNote) {
      y = drawBulletNoteBlock(g, line, BODY_MARGIN_X, y, maxW, t);
    } else {
      g.fillText(line, BODY_MARGIN_X, y);
      y += t.lineBody;
    }
  }
  return y;
}

function measureBodyHeight(g, lines, maxW, scale) {
  return drawBodyLines(g, lines, 0, maxW, scale);
}

/** Pick scale so body fits between header and bottom reserve. */
export function certificateBodyScale(bodyLines, canvasHeight = CERT_MIN_HEIGHT) {
  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = CERT_WIDTH;
  measureCanvas.height = 400;
  const g = measureCanvas.getContext("2d");
  g.fillStyle = "#4a1f28";

  let scale = 1;
  const fits = (s) => {
    const hdr = certificateHeaderLayout(s);
    const available = canvasHeight - CERT_BOTTOM_RESERVE - hdr.bodyStart;
    const bodyHeight = measureBodyHeight(g, bodyLines, BODY_MAX_W, s);
    return { available, bodyHeight, hdr, ok: bodyHeight <= available };
  };

  let metrics = fits(scale);
  while (metrics.bodyHeight < metrics.available * 0.9 && scale < 1.38) {
    scale += 0.04;
    metrics = fits(scale);
  }
  while (!metrics.ok && scale > 0.88) {
    scale -= 0.03;
    metrics = fits(scale);
  }
  metrics = fits(scale);
  return {
    scale,
    bodyStart: metrics.hdr.bodyStart,
    bodyHeight: metrics.bodyHeight,
    header: metrics.hdr,
  };
}

/**
 * Line boxes for overlap guards (header vs body, body vs bottom reserve).
 * @param {CanvasRenderingContext2D} g
 */
export function certificateLineBoxes(g, mode, canvasHeight = CERT_MIN_HEIGHT) {
  const lines = buildCertificateLines(mode);
  const subtitle = lines[1];
  const bodyLines = lines.filter((l) => l !== "ROYAL QUEST CERTIFICATE" && l !== subtitle);
  const layout = certificateBodyScale(bodyLines, canvasHeight);
  const { scale, bodyHeight, header } = layout;
  const t = typography(scale);
  const available = canvasHeight - CERT_BOTTOM_RESERVE - header.bodyStart;
  const extra = Math.max(0, available - bodyHeight);
  const bodyY = header.bodyStart + Math.min(extra * 0.1, 16);

  const titlePx = Math.round(42 * scale);
  const subtitlePx = Math.round(28 * scale);

  const boxes = [
    { kind: "title", text: "ROYAL QUEST CERTIFICATE", ...lineBox(header.titleY, titlePx, "title") },
    { kind: "subtitle", text: subtitle, ...lineBox(header.subtitleY, subtitlePx, "subtitle") },
  ];

  let y = bodyY;
  for (const line of bodyLines) {
    if (!line) {
      y += t.blank;
      continue;
    }
    const isNote = line.startsWith("• ");
    const fontPx = isNote
      ? Math.round(22 * scale)
      : line.startsWith("Official notes")
        ? Math.round(24 * scale)
        : Math.round(26 * scale);
    g.font = isNote
      ? t.note
      : line.startsWith("Official notes")
        ? t.section
        : t.body;
    if (isNote) {
      g.font = t.note;
      const { rows } = layoutBulletNoteRows((text) => g.measureText(text).width, line, BODY_MAX_W);
      for (const row of rows) {
        boxes.push({ kind: "body", text: row.text, ...lineBox(y, fontPx) });
        y += row.indent > 0 ? t.lineNote - 2 : t.lineNote;
      }
    } else {
      boxes.push({ kind: "body", text: line, ...lineBox(y, fontPx) });
      y += t.lineBody;
    }
  }

  return {
    scale,
    canvasHeight,
    bodyStart: bodyY,
    bodyEnd: y,
    bottomLimit: canvasHeight - CERT_BOTTOM_RESERVE,
    header,
    boxes,
  };
}

/** @returns {{ ok: boolean, issues: string[] }} */
export function validateCertificateLayout(metrics) {
  const issues = [];
  const title = metrics.boxes.find((b) => b.kind === "title");
  const subtitle = metrics.boxes.find((b) => b.kind === "subtitle");
  const body = metrics.boxes.filter((b) => b.kind === "body");
  const minGap = 6;

  if (title.top < CERT_TOP_RESERVE) {
    issues.push("title overlaps top roll");
  }
  if (subtitle.top < title.bottom + minGap) {
    issues.push("subtitle overlaps title");
  }
  if (body.length && body[0].top < subtitle.bottom + minGap) {
    issues.push("body overlaps subtitle");
  }
  for (let i = 1; i < body.length; i++) {
    if (body[i].top < body[i - 1].bottom - 1) {
      issues.push(`body lines overlap: ${i}`);
    }
  }
  if (metrics.bodyEnd > metrics.bottomLimit) {
    issues.push("body overlaps bottom reserve");
  }
  return { ok: issues.length === 0, issues };
}

export async function renderCertificateCanvas(mode = "pass") {
  await document.fonts.ready;
  const w = CERT_WIDTH;
  const lines = buildCertificateLines(mode);
  const subtitle = lines[1];
  const bodyLines = lines.filter((l) => l !== "ROYAL QUEST CERTIFICATE" && l !== subtitle);

  let h = CERT_MIN_HEIGHT;
  let layout = certificateBodyScale(bodyLines, h);
  if (layout.bodyStart + layout.bodyHeight + CERT_BOTTOM_RESERVE + 32 > h) {
    h = Math.round(layout.bodyStart + layout.bodyHeight + CERT_BOTTOM_RESERVE + 40);
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

  const { scale, bodyHeight, header } = layout;
  const available = h - CERT_BOTTOM_RESERVE - header.bodyStart;
  const extra = Math.max(0, available - bodyHeight);
  const bodyY = header.bodyStart + Math.min(extra * 0.1, 16);
  const t = typography(scale);

  g.fillStyle = "#4a1f28";
  g.font = t.title;
  g.textAlign = "center";
  g.fillText("ROYAL QUEST CERTIFICATE", w / 2, header.titleY);

  g.font = t.subtitle;
  g.fillText(subtitle, w / 2, header.subtitleY);

  g.textAlign = "left";
  drawBodyLines(g, bodyLines, bodyY, BODY_MAX_W, scale);

  return c;
}

export async function downloadCertificatePng(mode = "pass") {
  try {
    const c = await renderCertificateCanvas(mode);
    const blob = await new Promise((resolve, reject) => {
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob null"))), "image/png");
    });
    const a = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = "quest-certificate.png";
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    showAppToast("Quest certificate download started.");
  } catch {
    showAppToast("Couldn't save the certificate — try again in a moment.");
  }
}
