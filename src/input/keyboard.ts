import type { Sfx } from "../audio/sfx";
import type { Game } from "../game/game";

// Desktop controls — also the fastest way to test without a headset.
// Keyed off `event.key` (always populated) rather than `event.code`, so it
// works across layouts and with synthetic events.
export function attachKeyboard(game: Game, sfx: Sfx): void {
  window.addEventListener("keydown", (e) => {
    sfx.unlock(); // first keypress is the user gesture WebAudio waits for
    const k = e.key.toLowerCase();
    let used = true;
    switch (k) {
      case "arrowleft": game.tryMove(-1, 0); break;
      case "arrowright": game.tryMove(1, 0); break;
      case "arrowup": game.tryMove(0, -1); break;
      case "arrowdown": game.tryMove(0, 1); break;
      case "q": game.tryRotate("x", 1); break;
      case "w": game.tryRotate("x", -1); break;
      case "a": game.tryRotate("y", 1); break;
      case "s": game.tryRotate("y", -1); break;
      case "z": game.tryRotate("z", 1); break;
      case "x": game.tryRotate("z", -1); break;
      case " ": if (!e.repeat) game.hardDrop(); break;
      case "shift": game.softDropping = true; break;
      default: used = false;
    }
    if (used) e.preventDefault();
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") game.softDropping = false;
  });
}
