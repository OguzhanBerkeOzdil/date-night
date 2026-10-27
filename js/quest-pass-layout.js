/** Shared layout for quest pass PNG (canvas + tests). */

export const PASS_WIDTH = 900;
export const PASS_HEIGHT = 1200;

/** Flat parchment body ends; bottom scroll roll begins below this Y. */
export const PASS_ROLL_REGION_TOP = 1032;

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

/** Mask baked-in art in the roll so only our wax seal is visible. */
export function maskPassRollArtwork(g, parchment, width, height) {
  const patchTop = Math.floor(height * 0.78);
  const patchH = height - patchTop + 4;
  if (parchment.naturalWidth) {
    g.drawImage(parchment, 0, 180, width, 220, 0, patchTop, width, patchH);
  } else {
    g.fillStyle = "#ebe0cc";
    g.fillRect(0, patchTop, width, patchH);
  }
}
