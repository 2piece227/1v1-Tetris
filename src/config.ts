// ─── Game tuning (arcade 1v1) ───────────────────────────────────────────────
// Diverged from the VR build: this is a two-player cabinet game played on one
// screen, so rounds have to be short and both wells have to be readable at a
// glance from a metre away.

// Ten layers rather than the VR build's eighteen. A versus round wants to be
// decided in a minute or two, and a shallow well is what forces that.
export const WELL = { w: 4, d: 4, h: 12 } as const;

// One cell in Babylon world units. Arbitrary here — unlike the VR build these
// are not metres, they only have to be consistent with the camera framing.
export const CELL = 0.075;

// Gravity: milliseconds between automatic one-step drops.
// NOTE: inherited from the VR build, where it was deliberately slowed for
// first-timers in a headset. At 2000ms a piece takes ~20s to reach the floor
// unaided, which is almost certainly too slow for a competitive round — see
// the note in the handover. Left unchanged because the arcade pacing has not
// been decided yet.
export const BASE_DROP_MS = 2000;
export const MIN_DROP_MS = 460;
export const LEVEL_SPEEDUP_MS = 155;

export const LAYERS_PER_LEVEL = 5;
export const LAYER_SCORE = [0, 100, 300, 600, 1000, 1500];

// ─── Split-screen staging ───────────────────────────────────────────────────
// Both players share one canvas; each gets half of it and its own camera.
// Player wells live at the same world position but on separate rendering
// layers, so neither camera can see the other player's well.
export const LAYER_1P = 0x1;
export const LAYER_2P = 0x2;

// Top-down camera, Blockout style: the eye sits above the mouth of the well
// looking straight down the shaft, so depth reads as perspective foreshortening
// and the stack recedes below you.
export const TOPDOWN = {
  /** Height of the eye above the top of the well, in cell units. */
  eyeCells: 6.5,
  /** Vertical field of view in radians. Narrow keeps the shaft walls steep. */
  fov: 0.9,
} as const;

// ─── Layer colours ──────────────────────────────────────────────────────────
// A settled block is coloured by the layer it sits in, not by the piece it came
// from. Looking straight down the shaft everything overlaps, so a fixed colour
// per depth is what lets a player tell at a glance how high the stack has got —
// this is the job the side gauge used to do, moved into the well itself.

/** Hue travelled from the floor to the mouth: red, round past violet to pink. */
const HUE_SPAN = 330;
/** Saturation and lightness alternate layer to layer — see layerColor. */
const SAT_EVEN = 1.0;
const SAT_ODD = 0.85;
const LIGHT_EVEN = 0.58;
const LIGHT_ODD = 0.4;

/**
 * Stored on garbage cells. The renderer paints settled blocks by depth, not by
 * what put them there, so this never reaches the screen — garbage takes the
 * colour of whatever layer it ends up on, same as everything else. It exists so
 * the grid holds a real value rather than a piece colour that would be a lie.
 */
export const GARBAGE_COLOR = 0x6b7280;

function hslToRgb(hDeg: number, s: number, l: number): number {
  const h = (((hDeg % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    const u = (t + 1) % 1;
    if (u < 1 / 6) return p + (q - p) * 6 * u;
    if (u < 1 / 2) return q;
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6;
    return p;
  };
  const to8 = (v: number): number => Math.round(Math.min(1, Math.max(0, v)) * 255);
  return (to8(channel(h + 1 / 3)) << 16) | (to8(channel(h)) << 8) | to8(channel(h - 1 / 3));
}

/**
 * Colour for a settled cell at grid height y.
 *
 * Generated rather than listed, so the well can be any depth and every layer
 * still gets its own colour. Hue climbs steadily from the floor to the mouth,
 * which is what makes depth readable at a glance.
 *
 * Hue alone is not enough. Spread over a dozen layers, neighbours land close
 * together — worst of all through the blues, where perception is compressed.
 * Measured on what actually reaches the screen (the renderer darkens blocks to
 * 62%), the smooth ramp this replaces put adjacent layers as little as 8.5 dE
 * apart, which is barely a difference at all. Alternating saturation and
 * lightness as well means neighbours differ along three axes instead of one:
 * the closest pair is now 20.7 dE and the average 38.5, up from 23.5, without
 * dulling any layer — every one is still a saturated rainbow colour.
 */
export function layerColor(y: number): number {
  const top = WELL.h - 1;
  const t = top <= 0 ? 0 : Math.min(Math.max(y, 0), top) / top;
  const odd = y % 2 !== 0;
  return hslToRgb(
    t * HUE_SPAN,
    odd ? SAT_ODD : SAT_EVEN,
    odd ? LIGHT_ODD : LIGHT_EVEN
  );
}
