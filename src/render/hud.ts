import type { Game } from "../game/game";

// Thin wrapper over the DOM overlay declared in index.html.
export class Hud {
  private score = document.querySelector<HTMLElement>("#hud .score")!;
  private sub = document.querySelector<HTMLElement>("#hud .sub")!;
  private overlay = document.querySelector<HTMLElement>("#overlay")!;
  private finalScore = document.querySelector<HTMLElement>("#overlay .finalScore")!;

  constructor(onRestart: () => void) {
    document.querySelector<HTMLButtonElement>("#restartBtn")!.addEventListener("click", () => {
      this.hideGameOver();
      onRestart();
    });
  }

  update(game: Game): void {
    this.score.textContent = String(game.score);
    this.sub.textContent = `레이어 ${game.layers} · 레벨 ${game.level}`;
  }

  showGameOver(game: Game): void {
    this.finalScore.textContent = `점수 ${game.score}`;
    this.overlay.classList.add("show");
  }

  hideGameOver(): void {
    this.overlay.classList.remove("show");
  }
}
