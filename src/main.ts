import { Sfx } from "./audio/sfx";
import { Game } from "./game/game";
import { attachKeyboard } from "./input/keyboard";
import { Renderer } from "./render/renderer";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const startCard = document.getElementById("start") as HTMLElement;
const banner = document.getElementById("banner") as HTMLElement;
const bannerText = document.getElementById("bannerText") as HTMLElement;

const renderer = new Renderer(canvas);
const sfx = new Sfx();

const p1 = new Game();
const p2 = new Game();
const players = [p1, p2];

/** ready: start card up · playing: live · over: win card up */
type Phase = "ready" | "playing" | "over";
let phase: Phase = "ready";

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
  for (const g of players) g.reset();
  startCard.classList.remove("show");
  banner.classList.remove("show");
  phase = "playing";
  draw();
}

function endRound(loser: Game): void {
  if (phase !== "playing") return;
  phase = "over";
  bannerText.textContent = `${loser === p1 ? "2P" : "1P"} 승리`;
  banner.classList.add("show");
  sfx.gameOver();
}

/** Back to the start card, so the next pair at the cabinet sees it. */
function toStartCard(): void {
  phase = "ready";
  banner.classList.remove("show");
  startCard.classList.add("show");
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
  if (phase === "ready" && (e.code === "Space" || e.code === "Enter")) startRound();
  else if (phase === "over" && (e.code === "Space" || e.code === "Enter")) toStartCard();
});
window.addEventListener("keydown", (e) => {
  // F5 would reload and lose the cabinet's fullscreen window.
  if (e.code === "F5") e.preventDefault();
});

document.getElementById("startBtn")!.addEventListener("click", startRound);
document.getElementById("restartBtn")!.addEventListener("click", toStartCard);

// Gravity for both wells, off one clock.
renderer.scene.onBeforeRenderObservable.add(() => {
  if (phase !== "playing") return;
  const dt = renderer.engine.getDeltaTime();
  for (const g of players) g.tick(dt);
});

draw();
