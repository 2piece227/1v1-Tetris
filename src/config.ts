// ─── Game tuning ────────────────────────────────────────────────────────────
// The well (pit) the pieces fall into. w = x axis, d = z axis, h = y (height).
// Keep w*d small so layers fill fast enough to be satisfying at a festival.
export const WELL = { w: 5, d: 5, h: 12 } as const;

// Size of one cell cube in Babylon world units (metres in VR).
export const CELL = 0.09;

// Gravity: how long (ms) between automatic one-step drops, per level.
export const BASE_DROP_MS = 900;
export const MIN_DROP_MS = 140;
export const SOFT_DROP_MS = 60; // while soft-drop is held

// How many cleared layers to advance a level.
export const LAYERS_PER_LEVEL = 6;

// Score awarded for clearing n layers at once (index = n).
export const LAYER_SCORE = [0, 100, 300, 600, 1000, 1500];

// Where the well sits in the room for VR (metres). The player stands and looks
// down-forward into it. y is the height of the well's BOTTOM off the floor.
export const WELL_ANCHOR = { x: 0, y: 0.75, z: -0.55 } as const;
