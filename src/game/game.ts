import {
  BASE_DROP_MS,
  LAYERS_PER_LEVEL,
  LAYER_SCORE,
  MIN_DROP_MS,
  SOFT_DROP_MS,
  WELL,
} from "../config";
import { Grid } from "./grid";
import { PieceDef, randomPiece } from "./pieces";
import { Axis, IVec3, rotate } from "./vec";

const { w, d, h } = WELL;

// Wall-kick candidates tried (in order) when a rotation would otherwise
// collide. Sideways nudges first, then drop the piece down — this is what
// lets horizontal-axis rotations succeed right at the top of the well, where
// the rotated cells would otherwise poke through the ceiling.
const KICKS: IVec3[] = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: -2, z: 0 },
  { x: 0, y: -3, z: 0 },
];

export class Game {
  readonly grid = new Grid();

  current!: PieceDef;
  cells!: IVec3[]; // current rotated offsets
  pos!: IVec3; // pivot position in the well
  next: PieceDef = randomPiece();

  score = 0;
  level = 1;
  layers = 0;
  gameOver = false;
  softDropping = false;

  private dropTimer = 0;

  /** Fired whenever the visible state changes (renderer redraws). */
  onChange: (() => void) | null = null;
  /** Fired when n>0 layers clear (for sound/juice). */
  onClear: ((n: number) => void) | null = null;
  /** Fired once when the game ends. */
  onGameOver: (() => void) | null = null;

  constructor() {
    this.spawn();
  }

  private dropInterval(): number {
    return Math.max(MIN_DROP_MS, BASE_DROP_MS - (this.level - 1) * 90);
  }

  private spawn(): void {
    this.current = this.next;
    this.next = randomPiece();
    this.cells = this.current.cells.map((c) => ({ ...c }));
    const maxY = Math.max(...this.cells.map((c) => c.y));
    this.pos = { x: (w / 2) | 0, y: h - 1 - maxY, z: (d / 2) | 0 };
    this.dropTimer = 0;
    if (!this.grid.canPlace(this.cells, this.pos)) {
      this.gameOver = true;
      this.onGameOver?.();
    }
    this.onChange?.();
  }

  tryMove(dx: number, dz: number): boolean {
    if (this.gameOver) return false;
    const np = { x: this.pos.x + dx, y: this.pos.y, z: this.pos.z + dz };
    if (this.grid.canPlace(this.cells, np)) {
      this.pos = np;
      this.onChange?.();
      return true;
    }
    return false;
  }

  tryRotate(axis: Axis, dir: 1 | -1): boolean {
    if (this.gameOver) return false;
    const rotated = this.cells.map((c) => rotate(c, axis, dir));
    for (const k of KICKS) {
      const np = { x: this.pos.x + k.x, y: this.pos.y + k.y, z: this.pos.z + k.z };
      if (this.grid.canPlace(rotated, np)) {
        this.cells = rotated;
        this.pos = np;
        this.onChange?.();
        return true;
      }
    }
    return false;
  }

  // Move down one step without locking. Returns false if it couldn't move.
  private descend(): boolean {
    const np = { x: this.pos.x, y: this.pos.y - 1, z: this.pos.z };
    if (this.grid.canPlace(this.cells, np)) {
      this.pos = np;
      return true;
    }
    return false;
  }

  hardDrop(): void {
    if (this.gameOver) return;
    while (this.descend()) {
      /* keep falling */
    }
    this.lock();
  }

  private lock(): void {
    this.grid.lock(this.cells, this.pos, this.current.color);
    const n = this.grid.clearFullLayers();
    if (n > 0) {
      this.score += (LAYER_SCORE[Math.min(n, LAYER_SCORE.length - 1)] ?? 0) * this.level;
      this.layers += n;
      this.level = 1 + Math.floor(this.layers / LAYERS_PER_LEVEL);
      this.onClear?.(n);
    }
    this.spawn();
  }

  // Landing position of the current piece (for the ghost preview).
  ghostPos(): IVec3 {
    const p = { ...this.pos };
    while (this.grid.canPlace(this.cells, { x: p.x, y: p.y - 1, z: p.z })) p.y--;
    return p;
  }

  tick(dtMs: number): void {
    if (this.gameOver) return;
    this.dropTimer += dtMs;
    const interval = this.softDropping ? SOFT_DROP_MS : this.dropInterval();
    if (this.dropTimer >= interval) {
      this.dropTimer = 0;
      if (!this.descend()) this.lock();
      else this.onChange?.();
    }
  }

  reset(): void {
    this.grid.reset();
    this.score = 0;
    this.level = 1;
    this.layers = 0;
    this.gameOver = false;
    this.softDropping = false;
    this.next = randomPiece();
    this.spawn();
  }
}
