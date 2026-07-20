import { Game } from "./game/game";
import { attachKeyboard } from "./input/keyboard";
import { setupXR } from "./input/xr";
import { Hud } from "./render/hud";
import { Renderer } from "./render/renderer";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

const renderer = new Renderer(canvas);
const game = new Game();
const hud = new Hud(() => {
  game.reset();
  renderer.redraw(game);
  hud.update(game);
});

// Wire game events → view.
game.onChange = () => {
  renderer.redraw(game);
  hud.update(game);
};
game.onGameOver = () => hud.showGameOver(game);

attachKeyboard(game);
void setupXR(game, renderer);

// Gravity loop, driven by Babylon's render clock.
renderer.scene.onBeforeRenderObservable.add(() => {
  game.tick(renderer.engine.getDeltaTime());
});

// First paint.
renderer.redraw(game);
hud.update(game);
