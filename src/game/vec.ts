// Integer 3D vector used for the game grid. Kept separate from Babylon's
// Vector3 so the pure game logic has no rendering dependency.
export interface IVec3 {
  x: number;
  y: number;
  z: number;
}

export const v = (x: number, y: number, z: number): IVec3 => ({ x, y, z });

export const add = (a: IVec3, b: IVec3): IVec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

export type Axis = "x" | "y" | "z";

// Rotate an integer offset 90° around an axis. dir = +1 (CW) or -1 (CCW).
// Standard right-handed 90° rotations; offsets stay integer.
export function rotate(p: IVec3, axis: Axis, dir: 1 | -1): IVec3 {
  switch (axis) {
    case "x": // around X: (y,z) plane
      return dir === 1 ? { x: p.x, y: -p.z, z: p.y } : { x: p.x, y: p.z, z: -p.y };
    case "y": // around Y: (x,z) plane
      return dir === 1 ? { x: p.z, y: p.y, z: -p.x } : { x: -p.z, y: p.y, z: p.x };
    case "z": // around Z: (x,y) plane
      return dir === 1 ? { x: -p.y, y: p.x, z: p.z } : { x: p.y, y: -p.x, z: p.z };
  }
}
