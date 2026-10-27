import { PASS_ROLL_REGION_TOP, passSealRect } from "./quest-pass-layout.js";

const BURGUNDY_FRAME = { r: 107, g: 45, b: 58 };

function isWaxRed(r, g, b) {
  return r > 150 && g < 120 && b < 120 && r - g > 40;
}

function nearBurgundyStroke(r, g, b) {
  return (
    Math.abs(r - BURGUNDY_FRAME.r) < 18 &&
    Math.abs(g - BURGUNDY_FRAME.g) < 18 &&
    Math.abs(b - BURGUNDY_FRAME.b) < 18
  );
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

  let waxInSeal = 0;
  let waxInRoll = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (!isWaxRed(data[i], data[i + 1], data[i + 2])) continue;
      const inSeal =
        x >= seal.x && x <= seal.x + seal.w && y >= seal.y && y <= seal.y + seal.h;
      const inRoll = y >= PASS_ROLL_REGION_TOP;
      if (inSeal) waxInSeal++;
      if (inRoll) waxInRoll++;
    }
  }

  const sealOverlapsRoll = seal.bottom >= PASS_ROLL_REGION_TOP;
  const waxBlobCount = waxInRoll > 40 ? 2 : waxInSeal > 20 ? 1 : 0;

  return {
    sealOverlapsRoll,
    hasMaroonFrame,
    waxBlobCount,
    waxInRoll,
    waxInSeal,
  };
}
