/** Shared layout for quest pass PNG (canvas + tests). */

export const PASS_WIDTH = 900;
export const PASS_HEIGHT = 1200;

/** Flat parchment body ends; bottom scroll roll begins below this Y. */
export const PASS_ROLL_REGION_TOP = 1032;

export const PASS_BOTTOM_ROLL_SAMPLE = {
  x: 40,
  y: PASS_ROLL_REGION_TOP,
  w: 615,
  h: PASS_HEIGHT - PASS_ROLL_REGION_TOP,
};

export function passSealRect(width = PASS_WIDTH, _height = PASS_HEIGHT) {
  const size = 118;
  const centerY = 910;
  return {
    x: Math.round(width / 2 - size / 2),
    y: Math.round(centerY - size / 2),
    w: size,
    h: size,
    bottom: Math.round(centerY + size / 2),
  };
}

/**
 * Cover the parchment's baked-in wax seal using nearby clean texture (does not touch the bottom roll).
 */
export function coverBakedPassSeal(g, parchment, width, height) {
  const seal = passSealRect(width, height);
  const pad = 10;
  const destX = seal.x - pad;
  const destY = seal.y - pad;
  const destW = seal.w + pad * 2;
  const destH = seal.h + pad * 2;
  const sampleY = Math.max(120, seal.y - destH - 24);

  if (!parchment.naturalWidth) {
    g.fillStyle = "#ebe0cc";
    g.fillRect(destX, destY, destW, destH);
    return;
  }

  const sx = parchment.naturalWidth / width;
  const sy = parchment.naturalHeight / height;
  g.drawImage(
    parchment,
    destX * sx,
    sampleY * sy,
    destW * sx,
    destH * sy,
    destX,
    destY,
    destW,
    destH
  );
}
