import { PieceDef, TIERS, tierIndexFor } from "./pieces";

/**
 * Tetris-style bag randomiser, with the bag's contents driven by score.
 *
 * A bag deals one of every piece in a shuffled order before any piece repeats,
 * which is what stops a booth player from getting four screws in a row and
 * concluding the game is broken. Plain random sampling has no such guarantee.
 *
 * The composition escalates through TIERS as the score climbs. Crossing a
 * threshold discards whatever is left of the current bag so the newly unlocked
 * pieces show up immediately rather than up to a bag later — at 100 points the
 * point is to *feel* the corner piece disappear.
 *
 * Note on the top tier: a layer of the 4x4 well is 16 cells, and 16 cannot be
 * made from fives and fours other than as four fours. Once pentominoes are in
 * the bag, clearing a layer generally means orienting pieces so they straddle
 * layers. That is intended to be hard, but it is a real cliff at 1000 points.
 */
export class Bag {
  private queue: PieceDef[] = [];
  private tier = -1;

  constructor(private readonly rand: () => number = Math.random) {}

  /** The tier the bag is currently dealing from. */
  get tierIndex(): number {
    return this.tier;
  }

  /** Draw the next piece for the given score, refilling and re-tiering as needed. */
  take(score: number): PieceDef {
    const tier = tierIndexFor(score);
    if (tier !== this.tier) {
      this.tier = tier;
      this.queue.length = 0;
    }
    if (this.queue.length === 0) this.refill();
    return this.queue.pop()!;
  }

  reset(): void {
    this.tier = -1;
    this.queue.length = 0;
  }

  private refill(): void {
    this.queue = [...TIERS[this.tier].pieces];
    // Fisher-Yates. Dealing with pop() means the shuffle order is consumed from
    // the end, which is fine — every permutation is equally likely either way.
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }
}
