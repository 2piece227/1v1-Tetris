// ─── Game tuning (arcade 1v1) ───────────────────────────────────────────────
// Diverged from the VR build: this is a two-player cabinet game played on one
// screen, so rounds have to be short and both wells have to be readable at a
// glance from a metre away.

// Ten layers rather than the VR build's eighteen. A versus round wants to be
// decided in a minute or two, and a shallow well is what forces that.
export const WELL = { w: 4, d: 4, h: 10 } as const;

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
export const SOFT_DROP_MS = 100;
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

// Width of the depth gauge beside each well, as a fraction of that player's
// half of the screen.
export const GAUGE_WIDTH_FRAC = 0.13;
