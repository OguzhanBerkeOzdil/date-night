import {
  PASS_BOTTOM_ROLL_SAMPLE,
  PASS_ROLL_REGION_TOP,
  passSealRect,
} from "./quest-pass-layout.js?v=20261212";

const BURGUNDY_FRAME = { r: 107, g: 45, b: 58 };

function isWaxRed(r, g, b) {
  return r > 150 && g < 120 && b < 120 && r - g > 40;
}

/** Bright overlay from wax-seal.webp (not parchment baked heart). */
function isBrightDrawnWax(r, g, b) {
  return r > 165 && g < 95 && b < 95 && r - g > 55;
}

function nearBurgundyStroke(r, g, b) {
  return (
    Math.abs(r - BURGUNDY_FRAME.r) < 18 &&
    Math.abs(g - BURGUNDY_FRAME.g) < 18 &&
    Math.abs(b - BURGUNDY_FRAME.b) < 18
  );
}

function regionStats(data, width, x0, y0, w, h) {
  let min = 255;
  let max = 0;
  let white = 0;
  let count = 0;
  for (let y = y0; y < y0 + h; y += 2) {
    for (let x = x0; x < x0 + w; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      min = Math.min(min, r);
      max = Math.max(max, r);
      if (r > 252 && g > 252 && b > 252) white++;
      count++;
    }
  }
  return { variance: max - min, white, count };
}

/**
 * Compare bottom roll to scaled parchment (no flat overlay / white strip).
 * @param {HTMLCanvasElement} canvas
 * @param {ImageBitmap|HTMLImageElement|null} parchment
 */
export function analyzePassBottomRoll(canvas, parchment) {
  const { width: w, height: h } = canvas;
  const sample = PASS_BOTTOM_ROLL_SAMPLE;
  const ctx = canvas.getContext("2d");
  const rendered = ctx.getImageData(sample.x, sample.y, sample.w, sample.h);

  const refCanvas = document.createElement("canvas");
  refCanvas.width = w;
  refCanvas.height = h;
  const refCtx = refCanvas.getContext("2d");
  if (parchment?.naturalWidth) {
    refCtx.drawImage(parchment, 0, 0, w, h);
  } else {
    refCtx.fillStyle = "#f4e8d0";
    refCtx.fillRect(0, 0, w, h);
  }
  const reference = refCtx.getImageData(sample.x, sample.y, sample.w, sample.h);

  let meanAbsDiff = 0;
  let n = 0;
  for (let i = 0; i < rendered.data.length; i += 4) {
    meanAbsDiff +=
      Math.abs(rendered.data[i] - reference.data[i]) +
      Math.abs(rendered.data[i + 1] - reference.data[i + 1]) +
      Math.abs(rendered.data[i + 2] - reference.data[i + 2]);
    n += 3;
  }
  meanAbsDiff /= n || 1;

  const full = ctx.getImageData(0, 0, w, h);
  const flatBand = regionStats(full.data, w, 40, 795, 615, 140);
  const rightStrip = regionStats(full.data, w, 655, sample.y, 35, sample.h);

  return {
    meanAbsDiff,
    rollVariance: regionStats(rendered.data, sample.w, 0, 0, sample.w, sample.h).variance,
    flatBandVariance: flatBand.variance,
    whiteStripPixels: rightStrip.white,
    resemblesSource: meanAbsDiff < 18 && flatBand.variance > 40 && rightStrip.white < 4,
  };
}

/** @returns {{ sealOverlapsRoll: boolean, hasMaroonFrame: boolean, waxBlobCount: number }} */
export function analyzeQuestPassSeal(canvas) {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  const { data } = ctx.getImageData(0, 0, w, h);
  const seal = passSealRect(w, h);

  let hasMaroonFrame = false;
  for (let x = 38; x <= 44; x += 2) {
    for (let y = 38; y <= 44; y += 2) {
      const i = (y * w + x) * 4;
      if (nearBurgundyStroke(data[i], data[i + 1], data[i + 2])) {
        hasMaroonFrame = true;
        break;
      }
    }
  }

  let brightInDrawRect = 0;
  let waxInRoll = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const gch = data[i + 1];
      const b = data[i + 2];
      const inDrawRect =
        x >= seal.x && x <= seal.x + seal.w && y >= seal.y && y <= seal.y + seal.h;
      if (inDrawRect && isBrightDrawnWax(r, gch, b)) brightInDrawRect++;
      if (y >= PASS_ROLL_REGION_TOP && isWaxRed(r, gch, b)) waxInRoll++;
    }
  }

  const sealOverlapsRoll = seal.bottom >= PASS_ROLL_REGION_TOP;
  const hasDrawnWaxSeal = brightInDrawRect > 12;
  const usesBakedSealOnly = !hasDrawnWaxSeal && waxInRoll >= 8;
  const waxBlobCount = hasDrawnWaxSeal ? 2 : usesBakedSealOnly ? 1 : 0;

  return {
    sealOverlapsRoll,
    hasMaroonFrame,
    waxBlobCount,
    waxInRoll,
    hasDrawnWaxSeal,
    usesBakedSealOnly,
  };
}

/** Certificate must not overlay a second wax seal above the parchment bake. */
export function analyzeCertificateSeal(canvas, parchment) {
  const { width: w, height: h } = canvas;
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, w, h);
  const overlayX = Math.round(w / 2 - 80);
  const overlayY = Math.max(0, h - 400);
  const overlayW = 160;
  const overlayH = 220;
  let brightInOverlay = 0;
  for (let y = overlayY; y < overlayY + overlayH; y += 2) {
    for (let x = overlayX; x < overlayX + overlayW; x += 2) {
      const i = (y * w + x) * 4;
      if (isBrightDrawnWax(data[i], data[i + 1], data[i + 2])) brightInOverlay++;
    }
  }
  const hasDrawnWaxSeal = brightInOverlay > 12;

  const bottomY = Math.max(0, h - 200);
  const rendered = ctx.getImageData(40, bottomY, w - 80, h - bottomY);
  const refCanvas = document.createElement("canvas");
  refCanvas.width = w;
  refCanvas.height = h;
  const refCtx = refCanvas.getContext("2d");
  if (parchment?.naturalWidth) {
    refCtx.drawImage(parchment, 0, 0, w, h);
  } else {
    refCtx.fillStyle = "#f4e8d0";
    refCtx.fillRect(0, 0, w, h);
  }
  const reference = refCtx.getImageData(40, bottomY, w - 80, h - bottomY);
  let meanAbsDiff = 0;
  let n = 0;
  for (let i = 0; i < rendered.data.length; i += 4) {
    meanAbsDiff +=
      Math.abs(rendered.data[i] - reference.data[i]) +
      Math.abs(rendered.data[i + 1] - reference.data[i + 1]) +
      Math.abs(rendered.data[i + 2] - reference.data[i + 2]);
    n += 3;
  }
  meanAbsDiff /= n || 1;

  return {
    hasDrawnWaxSeal,
    usesBakedSealOnly: !hasDrawnWaxSeal && meanAbsDiff < 22,
    meanAbsDiff,
  };
}
