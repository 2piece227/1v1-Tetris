// Tiny WebAudio synth. Deliberately asset-free: no files to load means nothing
// to break on GitHub Pages and nothing to wait for when the headset opens the
// page cold at a festival.
export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  // Browsers refuse to start an AudioContext before a user gesture. Entering VR
  // or pressing a key counts, so we create it lazily on the first sound.
  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** One enveloped oscillator. `slideTo` glides the pitch over the note. */
  private tone(
    freq: number,
    durMs: number,
    opts: { type?: OscillatorType; gain?: number; slideTo?: number; delayMs?: number } = {}
  ): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const { type = "sine", gain = 0.15, slideTo, delayMs = 0 } = opts;

    const t0 = ctx.currentTime + delayMs / 1000;
    const dur = durMs / 1000;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);

    // Short attack, exponential decay — reads as "percussive" without a sample.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(env).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Call once from a real user gesture so the first real sound isn't swallowed. */
  unlock(): void {
    this.ensure();
  }

  move(): void {
    this.tone(320, 45, { type: "square", gain: 0.05 });
  }

  rotate(): void {
    this.tone(480, 60, { type: "square", gain: 0.06, slideTo: 620 });
  }

  /** Piece touched down and became part of the stack. */
  lock(): void {
    this.tone(150, 130, { type: "triangle", gain: 0.18, slideTo: 90 });
  }

  /** Rising arpeggio — one extra note per simultaneous layer. */
  clear(n: number): void {
    const root = 523.25; // C5
    const steps = [0, 4, 7, 12, 16, 19];
    for (let i = 0; i < Math.min(n + 1, steps.length); i++) {
      this.tone(root * Math.pow(2, steps[i] / 12), 260, {
        type: "sine",
        gain: 0.16,
        delayMs: i * 70,
      });
    }
  }

  gameOver(): void {
    this.tone(330, 700, { type: "sawtooth", gain: 0.12, slideTo: 80 });
  }
}
