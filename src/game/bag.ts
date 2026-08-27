import { PieceDef, TIERS, tierIndexFor } from "./pieces";

/**
 * One shuffled piece sequence, shared by both players.
 *
 * Versus has to be fair, and fair means neither player can lose to a worse
 * draw. So there is a single sequence and each player holds their own cursor
 * into it: both see exactly the same pieces in the same order, each at their
 * own pace. Giving the two sides separate bags — even seeded identically —
 * does not achieve this, because the two players consume randomness at
 * different rates as soon as anything about their games differs.
 *
 * Position `i` is generated once and cached, so whoever reaches it first fixes
 * it for both. The player who is ahead therefore decides which difficulty tier
 * the deeper part of the sequence was built under, and the player behind then
 * receives those same pieces when they get there.
 *
 * Within a tier this is a standard bag: every piece is dealt once, in shuffled
 * order, before any repeats. Plain random sampling would let a booth player
 * draw four screws running and conclude the game is broken.
 */
export class PieceFeed {
  private seq: PieceDef[] = [];
  private queue: PieceDef[] = [];
  private tier = -1;

  /**
   * `difficultyScore` is the single score the tier is read from — with one
   * shared sequence there can only be one, so a versus round escalates for
   * both players at once rather than per-player.
   */
  constructor(
    private readonly difficultyScore: () => number,
    private readonly rand: () => number = Math.random
  ) {}

  get tierIndex(): number {
    return Math.max(0, this.tier);
  }

  get tierLabel(): string {
    return TIERS[this.tierIndex].label;
  }

  /** The piece at position `i` of the shared sequence, generating as needed. */
  at(i: number): PieceDef {
    while (this.seq.length <= i) this.extend();
    return this.seq[i];
  }

  /** Start a fresh sequence. Call once per round, not once per player. */
  reset(): void {
    this.seq.length = 0;
    this.queue.length = 0;
    this.tier = -1;
  }

  private extend(): void {
    const tier = tierIndexFor(this.difficultyScore());
    if (tier !== this.tier) {
      // Crossing a threshold drops the rest of the current bag so the newly
      // unlocked pieces appear right away rather than up to a bag later.
      this.tier = tier;
      this.queue.length = 0;
    }
    if (this.queue.length === 0) this.refill();
    this.seq.push(this.queue.pop()!);
  }

  private refill(): void {
    this.queue = [...TIERS[this.tier].pieces];
    // Fisher-Yates. Dealing with pop() consumes the shuffle from the end, which
    // is fine — every permutation is equally likely either way.
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }
}
