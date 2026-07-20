import { IVec3 } from "./vec";

export interface PieceDef {
  name: string;
  color: number; // hex RGB
  cells: IVec3[]; // offsets around the piece pivot (0,0,0)
}

const c = (x: number, y: number, z: number): IVec3 => ({ x, y, z });

// A compact Blockout-style set: flat tetrominoes that lie in the y=0 plane
// plus a few genuinely 3D pieces so rotating around all three axes matters.
export const PIECES: PieceDef[] = [
  { name: "I", color: 0x27d3ee, cells: [c(-1, 0, 0), c(0, 0, 0), c(1, 0, 0), c(2, 0, 0)] },
  { name: "O", color: 0xf5d020, cells: [c(0, 0, 0), c(1, 0, 0), c(0, 0, 1), c(1, 0, 1)] },
  { name: "T", color: 0xb46cff, cells: [c(-1, 0, 0), c(0, 0, 0), c(1, 0, 0), c(0, 0, 1)] },
  { name: "L", color: 0xff8a3d, cells: [c(-1, 0, 0), c(0, 0, 0), c(1, 0, 0), c(1, 0, 1)] },
  { name: "S", color: 0x4fd06a, cells: [c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(2, 0, 1)] },
  // 3D pieces:
  { name: "Tripod", color: 0xff5d5d, cells: [c(0, 0, 0), c(1, 0, 0), c(0, 0, 1), c(0, 1, 0)] },
  { name: "Twist", color: 0x5b7dff, cells: [c(0, 0, 0), c(1, 0, 0), c(1, 1, 0), c(1, 0, 1)] },
];

export function randomPiece(): PieceDef {
  return PIECES[(Math.random() * PIECES.length) | 0];
}
