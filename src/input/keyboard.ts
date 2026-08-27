import type { Sfx } from "../audio/sfx";
import type { Game } from "../game/game";

/**
 * Two players on one keyboard.
 *
 * The layout assumes a cabinet panel per player: a four-way stick for movement
 * plus four buttons. That is eight inputs, which fits a standard arcade panel —
 * the VR build's six rotation directions would not. Each axis therefore gets a
 * single button that always turns the same way; press it four times to come
 * back round. A USB arcade encoder presents itself as a keyboard, so these are
 * the codes to map the panel to.
 *
 * Bindings are keyed off `event.code`, not `event.key`: a physical panel button
 * should not change meaning if the machine boots with a different keyboard
 * layout, and `code` is layout-independent.
 */
interface Binding {
  moveLeft: string;
  moveRight: string;
  moveAway: string;
  moveToward: string;
  rotX: string;
  rotY: string;
  rotZ: string;
  hardDrop: string;
}

export const P1_KEYS: Binding = {
  moveLeft: "KeyA",
  moveRight: "KeyD",
  moveAway: "KeyW",
  moveToward: "KeyS",
  rotX: "KeyQ",
  rotY: "KeyE",
  rotZ: "KeyR",
  hardDrop: "Space",
};

export const P2_KEYS: Binding = {
  moveLeft: "ArrowLeft",
  moveRight: "ArrowRight",
  moveAway: "ArrowUp",
  moveToward: "ArrowDown",
  rotX: "KeyU",
  rotY: "KeyI",
  rotZ: "KeyO",
  hardDrop: "Enter",
};

function bind(game: Game, keys: Binding, sfx: Sfx, enabled: () => boolean): void {
  window.addEventListener("keydown", (e) => {
    if (e.repeat) {
      // Held keys must not machine-gun. Auto-repeat on hard drop buries the
      // well in one press; on rotation it spins the piece past where you
      // wanted it. Movement is the one place a repeat would be useful, and it
      // is dropped too so that every binding behaves the same way.
      e.preventDefault();
      return;
    }
    sfx.unlock();
    if (!enabled()) return; // start card is up, or the round is decided
    let used = true;
    switch (e.code) {
      case keys.moveLeft: game.tryMove(-1, 0); break;
      case keys.moveRight: game.tryMove(1, 0); break;
      case keys.moveAway: game.tryMove(0, 1); break;
      case keys.moveToward: game.tryMove(0, -1); break;
      case keys.rotX: game.tryRotate("x", 1); break;
      case keys.rotY: game.tryRotate("y", 1); break;
      case keys.rotZ: game.tryRotate("z", 1); break;
      case keys.hardDrop: game.hardDrop(); break;
      default: used = false;
    }
    if (used) e.preventDefault();
  });
}

/**
 * `enabled` gates play so the start card and the win card can swallow input
 * without the bindings having to know anything about game phase.
 */
export function attachKeyboard(
  p1: Game,
  p2: Game,
  sfx: Sfx,
  enabled: () => boolean
): void {
  bind(p1, P1_KEYS, sfx, enabled);
  bind(p2, P2_KEYS, sfx, enabled);
}
