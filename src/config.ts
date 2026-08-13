// ─── Game tuning ────────────────────────────────────────────────────────────
// The well (pit) the pieces fall into. w = x axis, d = z axis, h = y (height).
// 4x4x8 keeps a festival round short and, more importantly, keeps the depth
// judgement tractable for someone who has never worn a headset before.
export const WELL = { w: 4, d: 4, h: 8 } as const;

// Size of one cell cube in Babylon world units (metres in VR).
// 0.11 makes the tank 44cm across and 88cm tall — chunky enough to read at a
// glance, small enough to take in without moving your head.
export const CELL = 0.11;

// Gravity: how long (ms) between automatic one-step drops, per level.
// Deliberately slow. A first-timer spends the first few seconds just working
// out which way is which; anything faster and the round is over before that.
export const BASE_DROP_MS = 1400;
export const MIN_DROP_MS = 320;
export const SOFT_DROP_MS = 70; // while soft-drop is held
export const LEVEL_SPEEDUP_MS = 110; // shaved off BASE_DROP_MS per level

// How many cleared layers to advance a level.
export const LAYERS_PER_LEVEL = 5;

// Score awarded for clearing n layers at once (index = n).
export const LAYER_SCORE = [0, 100, 300, 600, 1000, 1500];

// ─── VR staging ─────────────────────────────────────────────────────────────
// The tank sits on a pedestal like an aquarium on a table. `y` is the height of
// the tank's BOTTOM off the floor; the pedestal fills the gap down to the floor.
// bottom 0.40 + height 0.88 puts the rim at 1.28m — below eye level, so you
// look *down* into it naturally instead of at its side.
export const WELL_ANCHOR = { x: 0, y: 0.4, z: -0.7 } as const;

// How far in front of the player the tank is planted when a VR session starts
// (and on every recenter).
export const XR_DISTANCE = 0.7;
