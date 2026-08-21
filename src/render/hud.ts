import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { LAYER_COLORS, WELL } from "../config";
import type { Game } from "../game/game";

const { h } = WELL;
const FONT = "system-ui, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

/** Vertical pitch of one row of the layer key, in pixels. */
const ROW = 34;
/** Distance from the centre divider out to each number. */
const GAP = 26;

const hex = (c: number): string => "#" + c.toString(16).padStart(6, "0");

/**
 * Scores, and the layer key down the middle of the screen.
 *
 * The key is the legend for the well's depth colouring: one row per layer,
 * numbered in that layer's colour, ordered mouth-at-top so the column mirrors
 * the shaft rather than fighting it. Each number is printed on both sides of
 * the divider so each player reads the copy nearest their own half.
 */
export class Hud {
  private readonly scores: TextBlock[] = [];

  constructor(ui: AdvancedDynamicTexture) {
    this.scores.push(this.buildScore(ui, "1P", -25));
    this.scores.push(this.buildScore(ui, "2P", 25));
    this.buildLayerKey(ui);
  }

  /** `offsetPct` is a shift from canvas centre, so -25 lands mid left-half. */
  private buildScore(
    ui: AdvancedDynamicTexture,
    label: string,
    offsetPct: number
  ): TextBlock {
    const name = new TextBlock(`${label}_name`, label);
    name.color = "#8fa0d8";
    name.fontSize = 22;
    name.fontFamily = FONT;
    name.fontWeight = "700";
    name.height = "28px";
    name.top = "30px";
    name.left = `${offsetPct}%`;
    name.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    ui.addControl(name);

    const score = new TextBlock(`${label}_score`, "0");
    score.color = "#eef2ff";
    score.fontSize = 42;
    score.fontFamily = FONT;
    score.fontWeight = "700";
    score.height = "52px";
    score.top = "60px";
    score.left = `${offsetPct}%`;
    score.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    ui.addControl(score);
    return score;
  }

  private buildLayerKey(ui: AdvancedDynamicTexture): void {
    for (let row = 0; row < h; row++) {
      const layer = h - row; // mouth at the top of the column
      const color = hex(LAYER_COLORS[layer - 1]);
      const y = (row - (h - 1) / 2) * ROW;

      for (const dir of [-1, 1]) {
        const t = new TextBlock(
          `key_${layer}_${dir < 0 ? "left" : "right"}`,
          String(layer)
        );
        t.color = color;
        t.fontSize = 24;
        t.fontFamily = FONT;
        t.fontWeight = "700";
        // A TextBlock is 100% wide by default, so aligning the *control* moves
        // nothing and both numbers render centred on top of one another —
        // which is what turned "7 | 7" into "77". Give each a fixed box and
        // offset that box from the centre instead.
        t.width = `${GAP}px`;
        t.height = `${ROW}px`;
        t.left = `${dir * GAP}px`;
        t.top = `${y}px`;
        t.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        t.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        ui.addControl(t);
      }
    }
  }

  update(p1: Game, p2: Game): void {
    this.scores[0].text = String(p1.score);
    this.scores[1].text = String(p2.score);
  }
}
