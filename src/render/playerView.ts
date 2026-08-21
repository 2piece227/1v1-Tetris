import {
  Color3,
  Color4,
  FreeCamera,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
  Viewport,
} from "@babylonjs/core";
import { CELL, TOPDOWN, WELL, layerColor } from "../config";
import type { Game } from "../game/game";

const { w, d, h } = WELL;
const WELL_H = h * CELL;

/** grid cell -> position inside this player's wellRoot */
function cellToLocal(x: number, y: number, z: number): Vector3 {
  return new Vector3(
    (x - (w - 1) / 2) * CELL,
    y * CELL + CELL / 2,
    (z - (d - 1) / 2) * CELL
  );
}

/**
 * One player's well, camera and meshes.
 *
 * Both players share a single scene, so every mesh here is stamped with this
 * view's layer mask and the camera is set to match. Without that each camera
 * would draw both wells on top of each other — they sit at the same world
 * position deliberately, so the two halves of the screen frame identically and
 * neither player gets the better angle.
 */
export class PlayerView {
  readonly root: TransformNode;
  readonly camera: FreeCamera;

  private readonly solidPool: Mesh[] = [];
  private readonly piecePool: Mesh[] = [];
  private readonly ghostPool: Mesh[] = [];
  private readonly guidePool: Mesh[] = [];
  private readonly solidMaster: Mesh;
  private readonly pieceMaster: Mesh;
  private readonly ghostMaster: Mesh;
  private readonly guideMaster: Mesh;
  private readonly matByColor = new Map<number, StandardMaterial>();

  constructor(
    private readonly scene: Scene,
    private readonly mask: number,
    viewport: Viewport
  ) {
    this.root = new TransformNode("wellRoot", scene);

    // The Blockout shot: straight down the shaft from above its mouth. Pitching
    // a FreeCamera by rotation sidesteps the gimbal case setTarget hits when the
    // view direction is parallel to the up axis.
    this.camera = new FreeCamera(
      "cam",
      new Vector3(0, WELL_H + TOPDOWN.eyeCells * CELL, 0),
      scene
    );
    this.camera.rotation = new Vector3(Math.PI / 2, 0, 0);
    this.camera.fov = TOPDOWN.fov;
    this.camera.minZ = 0.01;
    this.camera.viewport = viewport;
    this.camera.layerMask = mask;
    this.camera.inputs.clear(); // fixed shot; a cabinet has no camera controls

    // Settled blocks: solid, and coloured by depth rather than by piece.
    this.solidMaster = this.master(
      MeshBuilder.CreateBox("solid", { size: CELL * 0.9 }, scene)
    );

    // The live piece is a hollow cage. Seen from directly above, a solid piece
    // sits on top of everything it is about to land on and hides exactly the
    // part of the well the player needs to judge. Edges only, interior clear.
    this.pieceMaster = this.master(
      MeshBuilder.CreateBox("piece", { size: CELL * 0.94 }, scene)
    );
    const pm = new StandardMaterial("pieceMat", scene);
    pm.diffuseColor = new Color3(1, 1, 1);
    pm.emissiveColor = new Color3(1, 1, 1);
    // Not fully zero: the mesh still has to be submitted for the edge pass to
    // run, and a hint of fill keeps the cage from reading as flat line art.
    pm.alpha = 0.05;
    pm.disableDepthWrite = true;
    this.pieceMaster.material = pm;
    this.edged(this.pieceMaster);

    this.ghostMaster = this.master(
      MeshBuilder.CreateBox("ghost", { size: CELL * 0.88 }, scene)
    );
    const gm = new StandardMaterial("ghostMat", scene);
    gm.diffuseColor = new Color3(0.65, 0.75, 1);
    gm.emissiveColor = new Color3(0.3, 0.4, 0.75);
    gm.alpha = 0.22;
    gm.disableDepthWrite = true;
    this.ghostMaster.material = gm;

    // Looking down the shaft a piece and its landing spot occupy the same
    // screen pixel, so the guide pillar is the only thing saying how far apart
    // they are. It matters more here than it did in VR, not less.
    this.guideMaster = this.master(
      MeshBuilder.CreateBox(
        "guide",
        { width: CELL * 0.13, height: 1, depth: CELL * 0.13 },
        scene
      )
    );
    const gdm = new StandardMaterial("guideMat", scene);
    gdm.diffuseColor = new Color3(0.55, 0.7, 1);
    gdm.emissiveColor = new Color3(0.4, 0.55, 0.95);
    gdm.alpha = 0.4;
    gdm.disableDepthWrite = true;
    this.guideMaster.material = gdm;

    this.buildShaft();
  }

  private master(mesh: Mesh): Mesh {
    mesh.isVisible = false;
    mesh.isPickable = false;
    mesh.layerMask = this.mask;
    mesh.parent = this.root;
    return mesh;
  }

  /** Bright cage outline. Clones do not inherit an edges renderer. */
  private edged(mesh: Mesh): Mesh {
    mesh.enableEdgesRendering();
    mesh.edgesWidth = 5;
    mesh.edgesColor = new Color4(1, 1, 1, 1);
    return mesh;
  }

  /**
   * Wireframe shaft: a rectangle at every layer boundary plus the four corner
   * edges. Seen from directly above these nest inside one another, and the rate
   * at which they shrink is what makes depth legible from a top-down view.
   */
  private buildShaft(): void {
    const hx = (w * CELL) / 2;
    const hz = (d * CELL) / 2;
    const lines: Vector3[][] = [];
    const colors: Color4[][] = [];

    const ring = (y: number, shade: number): void => {
      const pts = [
        new Vector3(-hx, y, -hz),
        new Vector3(hx, y, -hz),
        new Vector3(hx, y, hz),
        new Vector3(-hx, y, hz),
        new Vector3(-hx, y, -hz),
      ];
      lines.push(pts);
      colors.push(
        pts.map(() => new Color4(0.3 * shade, 0.45 * shade, 0.85 * shade, 1))
      );
    };

    for (let layer = 0; layer <= h; layer++) {
      ring(layer * CELL, 0.35 + 0.65 * (layer / h));
    }

    const corners: [number, number][] = [
      [-hx, -hz],
      [hx, -hz],
      [hx, hz],
      [-hx, hz],
    ];
    for (const [cx, cz] of corners) {
      lines.push([new Vector3(cx, 0, cz), new Vector3(cx, WELL_H, cz)]);
      colors.push([new Color4(0.2, 0.3, 0.6, 1), new Color4(0.45, 0.6, 1, 1)]);
    }

    const floor = new Color4(0.22, 0.3, 0.55, 1);
    for (let x = 0; x <= w; x++) {
      lines.push([
        new Vector3(-hx + x * CELL, 0, -hz),
        new Vector3(-hx + x * CELL, 0, hz),
      ]);
      colors.push([floor, floor]);
    }
    for (let z = 0; z <= d; z++) {
      lines.push([
        new Vector3(-hx, 0, -hz + z * CELL),
        new Vector3(hx, 0, -hz + z * CELL),
      ]);
      colors.push([floor, floor]);
    }

    const frame = MeshBuilder.CreateLineSystem(
      "shaft",
      { lines, colors },
      this.scene
    );
    frame.parent = this.root;
    frame.layerMask = this.mask;
    frame.isPickable = false;
  }

  private solidMat(color: number): StandardMaterial {
    let m = this.matByColor.get(color);
    if (!m) {
      m = new StandardMaterial("m" + color, this.scene);
      const c = Color3.FromHexString("#" + color.toString(16).padStart(6, "0"));
      m.diffuseColor = c;
      m.emissiveColor = c.scale(0.4);
      m.specularColor = new Color3(0.25, 0.25, 0.3);
      this.matByColor.set(color, m);
    }
    return m;
  }

  private borrow(pool: Mesh[], master: Mesh, i: number, edges = false): Mesh {
    let mesh = pool[i];
    if (!mesh) {
      mesh = master.clone(master.name + "_" + pool.length, this.root)!;
      mesh.isVisible = true;
      mesh.layerMask = this.mask;
      if (edges) this.edged(mesh);
      pool.push(mesh);
    }
    mesh.setEnabled(true);
    return mesh;
  }

  private hideFrom(pool: Mesh[], used: number): void {
    for (let i = used; i < pool.length; i++) pool[i].setEnabled(false);
  }

  redraw(game: Game): void {
    // Settled stack, coloured by depth.
    let s = 0;
    game.grid.forEachFilled((x, y, z) => {
      const mesh = this.borrow(this.solidPool, this.solidMaster, s++);
      mesh.position.copyFrom(cellToLocal(x, y, z));
      mesh.material = this.solidMat(layerColor(y));
    });
    this.hideFrom(this.solidPool, s);

    let p = 0;
    let g = 0;
    let guides = 0;

    if (!game.gameOver) {
      for (const c of game.cells) {
        const cage = this.borrow(this.piecePool, this.pieceMaster, p++, true);
        cage.position.copyFrom(
          cellToLocal(game.pos.x + c.x, game.pos.y + c.y, game.pos.z + c.z)
        );
      }

      const gp = game.ghostPos();
      if (game.pos.y - gp.y > 0) {
        for (const c of game.cells) {
          const cx = game.pos.x + c.x;
          const cz = game.pos.z + c.z;

          const ghost = this.borrow(this.ghostPool, this.ghostMaster, g++);
          ghost.position.copyFrom(cellToLocal(gp.x + c.x, gp.y + c.y, gp.z + c.z));

          const top = cellToLocal(cx, game.pos.y + c.y, cz).y;
          const bottom = cellToLocal(cx, gp.y + c.y, cz).y;
          const pillar = this.borrow(this.guidePool, this.guideMaster, guides++);
          const at = cellToLocal(cx, 0, cz);
          pillar.position.set(at.x, (top + bottom) / 2, at.z);
          pillar.scaling.y = Math.max(0.001, top - bottom);
        }
      }
    }

    this.hideFrom(this.piecePool, p);
    this.hideFrom(this.ghostPool, g);
    this.hideFrom(this.guidePool, guides);
  }
}
