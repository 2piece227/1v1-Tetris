import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { CELL, WELL, WELL_ANCHOR } from "../config";
import type { Game } from "../game/game";

const { w, d, h } = WELL;
const WELL_H = h * CELL;

// grid cell (integer) -> local position inside wellRoot
function cellToLocal(x: number, y: number, z: number): Vector3 {
  return new Vector3(
    (x - (w - 1) / 2) * CELL,
    y * CELL + CELL / 2,
    (z - (d - 1) / 2) * CELL
  );
}

export class Renderer {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: ArcRotateCamera;
  readonly wellRoot: TransformNode;

  private readonly solidPool: Mesh[] = [];
  private readonly ghostPool: Mesh[] = [];
  private readonly solidMaster: Mesh;
  private readonly ghostMaster: Mesh;
  private readonly matByColor = new Map<number, StandardMaterial>();

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { stencil: true, antialias: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.02, 0.025, 0.04, 1);

    this.wellRoot = new TransformNode("wellRoot", this.scene);

    // Desktop camera orbits the well; VR replaces the active camera itself.
    this.camera = new ArcRotateCamera(
      "cam",
      -Math.PI / 2,
      1.02,
      2.4,
      new Vector3(0, WELL_H * 0.5, 0),
      this.scene
    );
    this.camera.attachControl(canvas, true);
    // Arrow keys must control the piece, not orbit the camera — drop the
    // camera's built-in keyboard input. Mouse drag still orbits (desktop only).
    this.camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
    this.camera.lowerRadiusLimit = 1.2;
    this.camera.upperRadiusLimit = 6;
    this.camera.wheelPrecision = 40;

    const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.1), this.scene);
    hemi.intensity = 0.75;
    hemi.groundColor = new Color3(0.1, 0.12, 0.2);
    const dir = new DirectionalLight("dir", new Vector3(-0.4, -1, -0.6), this.scene);
    dir.intensity = 0.85;

    // Master boxes are hidden templates the pools clone from.
    this.solidMaster = MeshBuilder.CreateBox("solid", { size: CELL * 0.92 }, this.scene);
    this.solidMaster.isVisible = false;
    this.solidMaster.parent = this.wellRoot;

    this.ghostMaster = MeshBuilder.CreateBox("ghost", { size: CELL * 0.9 }, this.scene);
    this.ghostMaster.isVisible = false;
    this.ghostMaster.parent = this.wellRoot;
    const gm = new StandardMaterial("ghostMat", this.scene);
    gm.diffuseColor = new Color3(0.6, 0.68, 1);
    gm.emissiveColor = new Color3(0.15, 0.18, 0.3);
    gm.alpha = 0.22;
    this.ghostMaster.material = gm;

    this.buildWellFrame();
    this.placeForDesktop();

    window.addEventListener("resize", () => this.engine.resize());
    this.engine.runRenderLoop(() => this.scene.render());
  }

  // ── Well frame: floor grid + wire outline for depth perception ────────────
  private buildWellFrame(): void {
    const hx = (w * CELL) / 2;
    const hz = (d * CELL) / 2;
    const lineColor = new Color3(0.35, 0.42, 0.7);

    const lines: Vector3[][] = [];
    // Floor grid
    for (let x = 0; x <= w; x++)
      lines.push([new Vector3(-hx + x * CELL, 0, -hz), new Vector3(-hx + x * CELL, 0, hz)]);
    for (let z = 0; z <= d; z++)
      lines.push([new Vector3(-hx, 0, -hz + z * CELL), new Vector3(hx, 0, -hz + z * CELL)]);
    // Vertical corner pillars
    const corners = [
      [-hx, -hz],
      [hx, -hz],
      [hx, hz],
      [-hx, hz],
    ];
    for (const [cx, cz] of corners)
      lines.push([new Vector3(cx, 0, cz), new Vector3(cx, WELL_H, cz)]);
    // Top rim
    for (let i = 0; i < corners.length; i++) {
      const [ax, az] = corners[i];
      const [bx, bz] = corners[(i + 1) % corners.length];
      lines.push([new Vector3(ax, WELL_H, az), new Vector3(bx, WELL_H, bz)]);
    }

    const frame = MeshBuilder.CreateLineSystem("frame", { lines }, this.scene);
    frame.color = lineColor;
    frame.parent = this.wellRoot;
    frame.isPickable = false;
  }

  private solidMat(color: number): StandardMaterial {
    let m = this.matByColor.get(color);
    if (!m) {
      m = new StandardMaterial("m" + color, this.scene);
      const c = Color3.FromHexString("#" + color.toString(16).padStart(6, "0"));
      m.diffuseColor = c;
      m.emissiveColor = c.scale(0.28);
      m.specularColor = new Color3(0.2, 0.2, 0.2);
      this.matByColor.set(color, m);
    }
    return m;
  }

  private borrow(pool: Mesh[], master: Mesh, i: number): Mesh {
    let mesh = pool[i];
    if (!mesh) {
      mesh = master.clone("c" + pool.length, this.wellRoot)!;
      mesh.isVisible = true;
      pool.push(mesh);
    }
    mesh.setEnabled(true);
    return mesh;
  }

  redraw(game: Game): void {
    let s = 0;
    const put = (x: number, y: number, z: number, color: number) => {
      const mesh = this.borrow(this.solidPool, this.solidMaster, s++);
      mesh.position.copyFrom(cellToLocal(x, y, z));
      mesh.material = this.solidMat(color);
    };

    game.grid.forEachFilled(put);
    if (!game.gameOver)
      for (const c of game.cells)
        put(game.pos.x + c.x, game.pos.y + c.y, game.pos.z + c.z, game.current.color);

    for (let i = s; i < this.solidPool.length; i++) this.solidPool[i].setEnabled(false);

    // Ghost (landing preview) — only when it is below the live piece.
    let g = 0;
    if (!game.gameOver) {
      const gp = game.ghostPos();
      if (gp.y < game.pos.y) {
        for (const c of game.cells) {
          const mesh = this.borrow(this.ghostPool, this.ghostMaster, g++);
          mesh.position.copyFrom(cellToLocal(gp.x + c.x, gp.y + c.y, gp.z + c.z));
        }
      }
    }
    for (let i = g; i < this.ghostPool.length; i++) this.ghostPool[i].setEnabled(false);
  }

  placeForDesktop(): void {
    this.wellRoot.position.set(0, 0, 0);
    this.camera.setTarget(new Vector3(0, WELL_H * 0.5, 0));
  }

  placeForXR(): void {
    this.wellRoot.position.set(WELL_ANCHOR.x, WELL_ANCHOR.y, WELL_ANCHOR.z);
  }
}
