// ─── Game tuning (arcade 1v1) ───────────────────────────────────────────────
// Diverged from the VR build: this is a two-player cabinet game played on one
// screen, so rounds have to be short and both wells have to be readable at a
// glance from a metre away.

// Ten layers rather than the VR build's eighteen. A versus round wants to be
// decided in a minute or two, and a shallow well is what forces that.
export const WELL = { w: 4, d: 4, h: 7 } as const;

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
//
// Rainbow bottom to top: index 0 is the floor (red), index 6 the mouth (violet).
export const LAYER_COLORS = [
  0xff1e1e, // 1 빨
  0xff6a00, // 2 주  — pushed red-ward; the old #ff9500 sat too near the yellow
  0xf5f000, // 3 노  — purer and lighter, so it separates from orange by value
  0x21c74a, // 4 초
  0x1f7bff, // 5 파
  0x3d2fb5, // 6 남  — clearly darker than the blue above it
  0xa83fd4, // 7 보
] as const;

/**
 * Stored on garbage cells. The renderer paints settled blocks by depth, not by
 * what put them there, so this never reaches the screen — garbage takes the
 * colour of whatever layer it ends up on, same as everything else. It exists so
 * the grid holds a real value rather than a piece colour that would be a lie.
 */
export const GARBAGE_COLOR = 0x6b7280;

/** Colour for a settled cell at grid height y, clamped for safety. */
export function layerColor(y: number): number {
  return LAYER_COLORS[Math.min(Math.max(y, 0), LAYER_COLORS.length - 1)];
}
