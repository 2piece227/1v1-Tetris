import {
  AdvancedDynamicTexture,
  Control,
  Rectangle,
  TextBlock,
} from "@babylonjs/gui";
import { LAYER_COLORS, WELL } from "../config";
import type { Game } from "../game/game";

const { h } = WELL;
const FONT = "system-ui, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

const hex = (c: number): string => "#" + c.toString(16).padStart(6, "0");

/**
 * Scores, and the layer key down the middle of the screen.
 *
 * The key is the legend for the well's depth colouring: one row per layer,
 * numbered, in that layer's colour. It reads bottom-up the way the well is
 * built — layer 7 at the top of the column, layer 1 at the bottom — so the
 * column mirrors the shaft rather than fighting it.
 *
 * It sits on the centre divider and prints each number twice, once on either
 * side. Both players then read the key nearest their own half instead of one
 * of them squinting across the screen.
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
    name.top = "18px";
    name.left = `${offsetPct}%`;
    name.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    ui.addControl(name);

    const score = new TextBlock(`${label}_score`, "0");
    score.color = "#eef2ff";
    score.fontSize = 42;
    score.fontFamily = FONT;
    score.fontWeight = "700";
    score.height = "52px";
    score.top = "44px";
    score.left = `${offsetPct}%`;
    score.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    ui.addControl(score);
    return score;
  }

  private buildLayerKey(ui: AdvancedDynamicTexture): void {
    const column = new Rectangle("layerKey");
    column.width = "150px";
    column.height = `${h * 34}px`;
    column.thickness = 0;
    column.background = "transparent";
    column.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    column.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    ui.addControl(column);

    for (let row = 0; row < h; row++) {
      const layer = h - row; // 1-based, mouth at the top of the column
      const color = hex(LAYER_COLORS[layer - 1]);

      const line = new Rectangle(`key_row${layer}`);
      line.width = "100%";
      line.height = "34px";
      line.thickness = 0;
      line.background = "transparent";
      line.top = `${row * 34 - (h * 34) / 2 + 17}px`;
      line.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      column.addControl(line);

      for (const side of ["left", "right"] as const) {
        const t = new TextBlock(`key_${layer}_${side}`, String(layer));
        t.color = color;
        t.fontSize = 24;
        t.fontFamily = FONT;
        t.fontWeight = "700";
        t.horizontalAlignment =
          side === "left"
            ? Control.HORIZONTAL_ALIGNMENT_LEFT
            : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        if (side === "left") t.paddingLeft = "12px";
        else t.paddingRight = "12px";
        line.addControl(t);
      }
    }
  }

  update(p1: Game, p2: Game): void {
    this.scores[0].text = String(p1.score);
    this.scores[1].text = String(p2.score);
  }
}
