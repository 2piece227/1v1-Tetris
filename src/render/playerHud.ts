import {
  AdvancedDynamicTexture,
  Control,
  Rectangle,
  TextBlock,
} from "@babylonjs/gui";
import { GAUGE_WIDTH_FRAC, WELL } from "../config";
import { Grid } from "../game/grid";
import type { Game } from "../game/game";

const { h } = WELL;
const FONT = "system-ui, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

/**
 * Score readout plus the depth gauge, for one player.
 *
 * The gauge is the thing Blockout puts beside the pit, and in a top-down view
 * it is not decoration: looking straight down the shaft, a full layer and an
 * empty one three below it are the same handful of pixels. The gauge is the
 * only place the player can actually read how full each layer is and how close
 * the stack is to the mouth.
 *
 * Rows run mouth-at-top to floor-at-bottom, matching the way the shaft recedes
 * on screen.
 */
export class PlayerHud {
  private readonly scoreText: TextBlock;
  private readonly tracks: Rectangle[] = [];
  private readonly fills: Rectangle[] = [];

  constructor(ui: AdvancedDynamicTexture, side: "left" | "right", label: string) {
    const align =
      side === "left"
        ? Control.HORIZONTAL_ALIGNMENT_LEFT
        : Control.HORIZONTAL_ALIGNMENT_RIGHT;
    // Each player owns half the canvas, so a column at the outer edge of the
    // full-screen UI lands at the outer edge of that player's half.
    const pad = "2%";

    const column = new Rectangle(`hud_${label}`);
    column.width = `${GAUGE_WIDTH_FRAC * 50}%`; // fraction of one half-screen
    column.height = "84%";
    column.thickness = 0;
    column.background = "transparent";
    column.horizontalAlignment = align;
    column.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    if (side === "left") column.paddingLeft = pad;
    else column.paddingRight = pad;
    ui.addControl(column);

    const name = new TextBlock(`${label}_name`, label);
    name.color = "#8fa0d8";
    name.fontSize = 26;
    name.fontFamily = FONT;
    name.fontWeight = "700";
    name.height = "34px";
    name.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    column.addControl(name);

    this.scoreText = new TextBlock(`${label}_score`, "0");
    this.scoreText.color = "#eef2ff";
    this.scoreText.fontSize = 40;
    this.scoreText.fontFamily = FONT;
    this.scoreText.fontWeight = "700";
    this.scoreText.height = "50px";
    this.scoreText.top = "34px";
    this.scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    column.addControl(this.scoreText);

    // One row per layer, top of the column being the mouth of the well.
    const rowsTop = 96;
    const rowH = 100 / h;
    for (let i = 0; i < h; i++) {
      const track = new Rectangle(`${label}_t${i}`);
      track.width = "100%";
      track.height = `${rowH * 0.72}%`;
      track.top = `${rowsTop + (i * rowH * 10)}px`;
      track.thickness = 1;
      track.color = "#2c3560";
      track.background = "#12172c";
      track.cornerRadius = 3;
      track.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      column.addControl(track);
      this.tracks.push(track);

      const fill = new Rectangle(`${label}_f${i}`);
      fill.width = "0%";
      fill.height = "100%";
      fill.thickness = 0;
      fill.background = "#3f6fd8";
      fill.cornerRadius = 2;
      fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      track.addControl(fill);
      this.fills.push(fill);
    }
  }

  update(game: Game): void {
    this.scoreText.text = String(game.score);

    // Which layers the live piece and its landing spot sit in, so the player
    // can find themselves on the gauge.
    const live = new Set<number>();
    const landing = new Set<number>();
    if (!game.gameOver) {
      const gp = game.ghostPos();
      for (const c of game.cells) {
        live.add(game.pos.y + c.y);
        landing.add(gp.y + c.y);
      }
    }

    for (let i = 0; i < h; i++) {
      const layer = h - 1 - i; // row 0 is the mouth
      const frac = game.grid.layerFill(layer) / Grid.LAYER_CELLS;
      const fill = this.fills[i];
      fill.width = `${Math.round(frac * 100)}%`;
      // A layer one cell short of clearing is the most important thing on the
      // gauge, so it gets its own colour rather than just more blue.
      fill.background =
        frac === 1 ? "#f5d020" : frac >= (Grid.LAYER_CELLS - 1) / Grid.LAYER_CELLS ? "#ff8a3d" : "#3f6fd8";

      const track = this.tracks[i];
      if (live.has(layer)) {
        track.color = "#ffffff";
        track.thickness = 2;
      } else if (landing.has(layer)) {
        track.color = "#7c8bff";
        track.thickness = 2;
      } else {
        track.color = "#2c3560";
        track.thickness = 1;
      }
    }
  }
}
