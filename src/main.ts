import { Sfx } from "./audio/sfx";
import { PieceFeed } from "./game/bag";
import { Game } from "./game/game";
import { attachKeyboard } from "./input/keyboard";
import { Renderer } from "./render/renderer";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const startCard = document.getElementById("start") as HTMLElement;
const banner = document.getElementById("banner") as HTMLElement;
const bannerText = document.getElementById("bannerText") as HTMLElement;

const renderer = new Renderer(canvas);
const sfx = new Sfx();

// One sequence, two cursors: both players are dealt identical pieces in
// identical order. `players` is filled after construction on purpose — the feed
// reads scores through it, and during construction it is empty and reports 0,
// which is what both scores are at that point anyway.
const players: Game[] = [];
const feed = new PieceFeed(() =>
  players.reduce((best, g) => Math.max(best, g.score), 0)
);
const p1 = new Game(feed);
const p2 = new Game(feed);
players.push(p1, p2);

/** ready: start card up · playing: live · over: win card up */
type Phase = "ready" | "playing" | "over";
let phase: Phase = "ready";

/**
 * How long the win card ignores the drop buttons.
 *
 * Players hammer the drop button, and the press that ends the round is usually
 * one of several already on the way. Without a lockout the win card is
 * dismissed in the same burst that caused it and nobody ever reads who won.
 */
const WIN_CARD_LOCKOUT_MS = 900;
let overSince = 0;

function draw(): void {
  renderer.redraw(p1, p2);
}

/**
 * ATTACK HOOK — deliberately empty.
 *
 * Two candidate rules are still on the table and they produce different games:
 *
 *   a) Classic: clearing n layers pushes n garbage layers into the opponent's
 *      well, each with one cell missing at a random column.
 *   b) Same-hole: the missing cell stays in the same column for consecutive
 *      attacks, so stringing clears together builds the opponent a shaft rather
 *      than a random mess.
 *
 * (b) rewards repeat clears and makes the well readable; (a) is what players
 * already expect. Wire whichever is chosen in here — `victim.grid` is the only
 * thing it needs to touch, and `Grid` already owns the layer shifting that
 * pushing garbage up requires.
 */
function sendAttack(_attacker: Game, _victim: Game, _layers: number): void {
  /* undecided — see above */
}

function startRound(): void {
  if (phase === "playing") return;
  overSince = 0;
  feed.reset(); // once per round, before the players rewind their cursors
  for (const g of players) g.reset();
  startCard.classList.remove("show");
  banner.classList.remove("show");
  phase = "playing";
  draw();
}

function endRound(loser: Game): void {
  if (phase !== "playing") return;
  phase = "over";
  overSince = performance.now();
  bannerText.textContent = `${loser === p1 ? "2P" : "1P"} 승리`;
  banner.classList.add("show");
  sfx.gameOver();
}

/** Back to the start card. Reachable from the win card, not automatic. */
function toStartCard(): void {
  phase = "ready";
  banner.classList.remove("show");
  startCard.classList.add("show");
  feed.reset();
  for (const g of players) g.reset();
  draw();
}

for (const me of players) {
  const other = me === p1 ? p2 : p1;
  me.onChange = draw;
  me.onMove = () => sfx.move();
  me.onRotate = () => sfx.rotate();
  me.onLock = () => sfx.lock();
  me.onClear = (n) => {
    sfx.clear(n);
    sendAttack(me, other, n);
  };
  me.onGameOver = () => endRound(me);
}

attachKeyboard(p1, p2, sfx, () => phase === "playing");

// Start on keyUP, not keydown: the keydown that dismisses the card would
// otherwise fall straight through to the freshly-enabled bindings and hard drop
// the first piece the instant the round begins.
window.addEventListener("keyup", (e) => {
  if (e.code === "F5") return;
  const go = e.code === "Space" || e.code === "Enter";
  // From the win card a drop button starts the next round outright. Sending
  // players back to the start card first is one extra press between them and a
  // rematch, and at a cabinet that press is the whole queue waiting.
  if (!go) {
    if (phase === "over" && e.code === "Escape") toStartCard();
    return;
  }
  if (phase === "ready") startRound();
  else if (phase === "over" && performance.now() - overSince >= WIN_CARD_LOCKOUT_MS)
    startRound();
});
window.addEventListener("keydown", (e) => {
  // F5 would reload and lose the cabinet's fullscreen window.
  if (e.code === "F5") e.preventDefault();
});

document.getElementById("startBtn")!.addEventListener("click", startRound);
document.getElementById("restartBtn")!.addEventListener("click", startRound);

// Gravity for both wells, off one clock.
renderer.scene.onBeforeRenderObservable.add(() => {
  if (phase !== "playing") return;
  const dt = renderer.engine.getDeltaTime();
  for (const g of players) g.tick(dt);
});

draw();
