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

/** Former overlay position (drawn wax seal) — must stay empty when using baked art only. */
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
