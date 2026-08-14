import {
  WebXRDefaultExperience,
  WebXRState,
  type WebXRInputSource,
} from "@babylonjs/core";
import type { Sfx } from "../audio/sfx";
import type { Game } from "../game/game";
import type { Renderer } from "../render/renderer";

// Turns an analog stick value into discrete steps with auto-repeat, so holding
// the stick keeps moving/rotating the piece at a steady rate (DAS-style).
class Stepper {
  private cooldown = 0;
  private readonly FIRST = 220; // ms before first repeat
  private readonly REPEAT = 130; // ms between repeats
  constructor(private readonly onStep: (dir: 1 | -1) => void) {}

  update(value: number, dtMs: number): void {
    if (Math.abs(value) < 0.35) {
      this.cooldown = 0; // released → next push fires immediately
      return;
    }
    this.cooldown -= dtMs;
    if (this.cooldown <= 0) {
      this.onStep(value > 0 ? 1 : -1);
      this.cooldown = this.cooldown < -this.FIRST ? this.REPEAT : this.FIRST;
    }
  }
}

const THUMBSTICK = "xr-standard-thumbstick";
const TRIGGER = "xr-standard-trigger";
const SQUEEZE = "xr-standard-squeeze";

export async function setupXR(
  game: Game,
  renderer: Renderer,
  sfx: Sfx
): Promise<WebXRDefaultExperience | null> {
  let xr: WebXRDefaultExperience;
  try {
    xr = await renderer.scene.createDefaultXRExperienceAsync({
      // This game is thumbstick and buttons only. Every extra default feature
      // is geometry Babylon draws into the room that the player then has to
      // work out the meaning of — near-interaction spheres on the controllers,
      // hand meshes, teleport targets on the floor. Pointer selection stays
      // because the game-over restart button is picked with the controller ray.
      disableTeleportation: true,
      disableNearInteraction: true,
      disableHandTracking: true,
    });
  } catch {
    return null; // e.g. desktop browser without WebXR — keyboard still works
  }
  if (!xr.baseExperience) return null;

  // Drop the tank an arm's length in front of wherever the player is actually
  // standing. Also bound to the left X button, because at a festival the next
  // person in line will be standing somewhere else entirely.
  const recenter = (): void => {
    const cam = xr.baseExperience.camera;
    renderer.placeForXR(cam.position.clone(), cam.getForwardRay().direction.clone());
  };

  xr.baseExperience.onStateChangedObservable.add((state) => {
    if (state === WebXRState.IN_XR) {
      sfx.unlock(); // entering VR is the user gesture WebAudio needs
      // The head pose is not usable on the session's first frame.
      renderer.scene.onAfterRenderObservable.addOnce(() => recenter());
    } else if (state === WebXRState.NOT_IN_XR) {
      renderer.placeForDesktop();
    }
  });

  // Per-hand analog stick steppers.
  const moveX = new Stepper((d) => game.tryMove(d, 0));
  const moveZ = new Stepper((d) => game.tryMove(0, d));
  const yaw = new Stepper((d) => game.tryRotate("y", d === 1 ? 1 : -1));
  const pitch = new Stepper((d) => game.tryRotate("x", d === 1 ? 1 : -1));

  const leftStick = { x: 0, y: 0 };
  const rightStick = { x: 0, y: 0 };

  xr.input.onControllerAddedObservable.add((controller: WebXRInputSource) => {
    controller.onMotionControllerInitObservable.add((mc) => {
      const hand = mc.handedness;
      const stick = mc.getComponent(THUMBSTICK);
      const trigger = mc.getComponent(TRIGGER);
      const squeeze = mc.getComponent(SQUEEZE);

      stick?.onAxisValueChangedObservable.add((axes) => {
        const target = hand === "left" ? leftStick : rightStick;
        target.x = axes.x;
        target.y = axes.y;
      });

      if (hand === "right") {
        // trigger → hard drop (on press)
        trigger?.onButtonStateChangedObservable.add((c) => {
          if (c.pressed && c.value > 0.6) game.hardDrop();
        });
        // A / B → rotate around Z
        mc.getComponent("a-button")?.onButtonStateChangedObservable.add((c) => {
          if (c.pressed) game.tryRotate("z", 1);
        });
        mc.getComponent("b-button")?.onButtonStateChangedObservable.add((c) => {
          if (c.pressed) game.tryRotate("z", -1);
        });
      } else {
        // left squeeze / trigger → soft drop while held
        const setSoft = (c: { pressed: boolean }) => {
          game.softDropping = c.pressed;
        };
        squeeze?.onButtonStateChangedObservable.add(setSoft);
        trigger?.onButtonStateChangedObservable.add(setSoft);
        // left X → re-plant the tank in front of me
        mc.getComponent("x-button")?.onButtonStateChangedObservable.add((c) => {
          if (c.pressed) recenter();
        });
      }
    });
  });

  // Poll stick values every frame for smooth auto-repeat.
  renderer.scene.onBeforeRenderObservable.add(() => {
    const dt = renderer.engine.getDeltaTime();
    moveX.update(leftStick.x, dt);
    moveZ.update(-leftStick.y, dt); // stick up is −y; away from the player is +z
    yaw.update(rightStick.x, dt);
    pitch.update(-rightStick.y, dt);
  });

  return xr;
}
