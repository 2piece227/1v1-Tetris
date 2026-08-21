import { WELL } from "../config";
import { IVec3, add } from "./vec";

const EMPTY = -1;
const { w, d, h } = WELL;

// Flat store of the settled blocks. Value is a colour hex, or EMPTY.
export class Grid {
  readonly cells: Int32Array = new Int32Array(w * d * h).fill(EMPTY);

  private idx(x: number, y: number, z: number): number {
    return x + w * (z + d * y);
  }

  inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < w && z >= 0 && z < d && y >= 0 && y < h;
  }

  get(x: number, y: number, z: number): number {
    return this.cells[this.idx(x, y, z)];
  }

  isFilled(x: number, y: number, z: number): boolean {
    return this.get(x, y, z) !== EMPTY;
  }

  /** How many of a layer's w*d cells are occupied. Drives the depth gauge. */
  layerFill(y: number): number {
    let n = 0;
    for (let z = 0; z < d; z++)
      for (let x = 0; x < w; x++) if (this.isFilled(x, y, z)) n++;
    return n;
  }

  /** Cells in one layer, for turning layerFill into a fraction. */
  static readonly LAYER_CELLS = w * d;

  // Can these piece cells (offsets) sit at world position `pos`?
  canPlace(cells: IVec3[], pos: IVec3): boolean {
    for (const cell of cells) {
      const p = add(pos, cell);
      if (!this.inBounds(p.x, p.y, p.z)) return false;
      if (this.isFilled(p.x, p.y, p.z)) return false;
    }
    return true;
  }

  lock(cells: IVec3[], pos: IVec3, color: number): void {
    for (const cell of cells) {
      const p = add(pos, cell);
      if (this.inBounds(p.x, p.y, p.z)) this.cells[this.idx(p.x, p.y, p.z)] = color;
    }
  }

  // Remove every completely-filled horizontal layer and let the blocks above
  // fall down by the number of layers removed. Returns how many were cleared.
  clearFullLayers(): number {
    let cleared = 0;
    for (let y = 0; y < h; y++) {
      if (this.isLayerFull(y)) {
        this.removeLayer(y);
        cleared++;
        y--; // re-check the same y, everything above just dropped into it
      }
    }
    return cleared;
  }

  private isLayerFull(y: number): boolean {
    for (let z = 0; z < d; z++)
      for (let x = 0; x < w; x++) if (!this.isFilled(x, y, z)) return false;
    return true;
  }

  // Delete layer `y`, shift every layer above it down by one, clear the top.
  private removeLayer(y: number): void {
    for (let yy = y; yy < h - 1; yy++)
      for (let z = 0; z < d; z++)
        for (let x = 0; x < w; x++)
          this.cells[this.idx(x, yy, z)] = this.get(x, yy + 1, z);
    for (let z = 0; z < d; z++)
      for (let x = 0; x < w; x++) this.cells[this.idx(x, h - 1, z)] = EMPTY;
  }

  reset(): void {
    this.cells.fill(EMPTY);
  }

  // Iterate all filled cells — used by the renderer.
  forEachFilled(fn: (x: number, y: number, z: number, color: number) => void): void {
    for (let y = 0; y < h; y++)
      for (let z = 0; z < d; z++)
        for (let x = 0; x < w; x++) {
          const col = this.get(x, y, z);
          if (col !== EMPTY) fn(x, y, z, col);
        }
  }
}
