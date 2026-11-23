import {
  Art,
  ArrowCursor,
  ButtonMaker,
  Clip,
  Dimmer,
  Node,
  Target,
  Timeline,
  WallMaker,
  art,
  circle,
  loadArt,
  pathShape,
  preload,
  type ArtInfo,
  type ButtonMakerParams,
  type TargetParams,
} from "../pc";
import type { Demo } from "./types";

const PARAMS_A: TargetParams = { strength: 10, plateauDiameter: 20, shape: "Sine-shaped", style: "None", showBullseye: false, tint: 0xdd2424 };
const PARAMS_C: TargetParams = { strength: 6, plateauDiameter: 2, shape: "Sine-shaped", style: "Disc with shading", showBullseye: true, tint: 0xdd2424 };

// Wall-ring tween, frames 28..56 of sprite 27: [alphaMult, blur].
const RING: Record<number, [number, number]> = {};
[0, 5, 10, 15, 21, 26, 31, 36, 41, 46, 51, 57, 62, 67].forEach((a, i) => (RING[28 + i] = [a, 55 - (i * 15) / 14]));
for (let f = 42; f <= 46; f++) RING[f] = [72, 40];
[49, 44, 38, 33, 27, 22, 16, 11, 5, 0].forEach((a, i) => (RING[47 + i] = [a, 55]));

/** PC_ButtonMaker (spec: rolloverCursorStyle="Finger", no sound). */
const finger = (p: ButtonMakerParams) => new ButtonMaker({ ...p, rolloverCursorStyle: "Finger" });

const frames = (dir: string, n: number) => Array.from({ length: n }, (_, i) => `demos/delete_button/${dir}/frame-${String(i + 1).padStart(2, "0")}.svg`);

/** Spec: reference/specs/delete_button.md */
const demo: Demo = {
  id: "delete_button",
  title: "Confirm Button",
  description:
    "After clicking the Delete button – which initiates an unrecommended action – the system asks for a confirmation, whereby the cursor is pushed towards the 'no' button which cancels the action. An example of mixed initiative.",
  icon: "delete_button.jpg",
  width: 400,
  height: 400,
  background: "#333333",
  fps: 25,
  original: "delete_button.swf",
  engine: { baseForce: 100, combineForces: "Add", speedLimit: "high speed", scaleToAlpha: false, bouncingBalls: true, hideAllObjects: false },
  async build({ stage, engine }) {
    const dir = "demos/delete_button/";
    // Stage-aligned layers (registration = sprite 27's origin), placed at sprite-27 (0, 0).
    const [bezel, textStart, textSure, textOk, ringArt] = await Promise.all(
      ["bezel", "text-start", "text-sure", "text-ok", "wall-ring"].map((f) => art(`${dir}${f}.svg`)),
    );
    // Art for the clips the timeline re-creates (factories below need it loaded).
    const [yesUp, yesDown, noUp, noDown, greenDisc] = await Promise.all(
      ["btn-yes", "btn-yes-down", "btn-no", "btn-no-down", "dialog-disc-green"].map((f) => loadArt(`${dir}${f}.svg`)),
    );
    const [bigFrames, okFrames] = await Promise.all([preload(frames("big-button", 31)), preload(frames("ok-button", 23))]);

    // Sprite 27: the whole demo, a 64-frame state machine.
    const demoClip = stage.addChild(
      new Timeline({ frames: 64, fps: 25, labels: { "Nuke 'em": 1, NO: 1, OVER: 6, down: 13, "Sure?": 17, up: 20, "Yes!": 47, YES: 47, OK: 57, replay: 61 } }),
    );
    demoClip.set({ x: 91.05, y: 65.3 });
    // Everything with rollover state or a playhead is placed by factory: a fresh instance whenever the playhead enters its range.

    // Depth 1: Target A, the "lure" (frames 1-10), then the wall ring (28-56).
    demoClip.place(() => new Target(PARAMS_A).set({ x: -9, y: -8, scale: 2.4203 }), 1, 10, 1);
    // Sprite 22: the ring is a wall (WallMaker); its hole sits inside the disc, trapping the cursor.
    const ring = new Node().set({ x: -118, y: -107 });
    const ringPath = new Path2D();
    ringPath.arc(232.95, 226, 222.97, 0, 2 * Math.PI);
    ringPath.moveTo(230.55 + 110.27, 218.7);
    ringPath.arc(230.55, 218.7, 110.27, 0, 2 * Math.PI);
    ring.hitShape = pathShape(ringPath, "evenodd");
    ring.addChild(ringArt);
    ring.addBehaviour(new WallMaker());
    demoClip.place(ring, 28, 56, 1);
    for (const [f, [a, blur]] of Object.entries(RING)) {
      demoClip.script(Number(f), () => {
        ringArt.alpha = a / 256;
        // Flash blur = 3 box passes of width `blur`: a Gaussian with sigma ≈ blur / 2.
        ringArt.el.style.filter = `blur(${blur / 2}px)`;
      });
    }

    // Depth 4: Target B pushes to NO (14-43), Target C on NO (44-46), Target A' on the OK disc (47-64).
    demoClip.place(() => new Target({ ...PARAMS_A, strength: 30, plateauDiameter: 10, tint: 0x999999 }).set({ x: 2.05, y: -53.95, scale: 3.1689 }), 14, 43, 4);
    demoClip.place(() => new Target(PARAMS_C).set({ x: 117.05, y: 58.05, scale: 0.82941 }), 44, 46, 4);
    demoClip.place(() => new Target(PARAMS_A).set({ x: -9, y: -8, scale: 2.4203 }), 47, 64, 4);
    // Depth 12: invisible Dimmer halving mouse motion (14-43), then Target C' on YES (44-46).
    const dimmer = () =>
      new Dimmer({ scope: "Mouse", dimmingFactor: 50, directionDependency: "None", dirDepAngle: 0, tint: 0xffffff }).set({
        x: -47.9,
        y: -60.9,
        scale: 3.5984,
        alpha: 0,
      });
    demoClip.place(dimmer, 14, 43, 12);
    demoClip.place(() => new Target(PARAMS_C).set({ x: 21.55, y: 60.55, scale: 0.82941 }), 44, 46, 12);

    demoClip.place(bezel, 1, 64, 20);

    // Depth 24, sprite 7: the DELETE button (1-26). Hit area = its disc.
    const bigButton = () => {
      const b = new Clip(bigFrames, { labels: { out: 1, over: 8, down: 20, up: 25 } });
      b.hitShape = circle(113, 113, 113);
      b.onFrame = (f) => {
        // Frame 1 also calls _parent.gotoAndPlay("out"): sprite 27 has no such label, a no-op.
        if (f === 1 || f === 24 || f === 31) b.stop();
        else if (f === 20 || f === 25) {
          demoClip.gotoAndPlay(f === 20 ? "down" : "up");
          b.play();
        }
      };
      b.addBehaviour(finger({ out: "out", over: "over", down: "down", up: "up" }));
      return b;
    };
    demoClip.place(bigButton, 1, 26, 24);

    // Depth 24, sprite 18: the green dialog disc (27-46). Rolling out of it once armed resets the demo
    // (the wall ring, from one frame later, keeps the cursor inside, so this rarely fires).
    const green = () => {
      const g = new Timeline({ frames: 14, labels: { over: 5, out: 9 } });
      g.placeAlways(new Art(greenDisc));
      g.hitShape = circle(113, 113, 113);
      let init = false;
      g.script(1, () => (init = false));
      g.script(5, (tl) => ((init = true), tl.stop()));
      // else-branch: `gotoAndStop("over"); play();` — AVM1 runs frame 5's stop() after the play(), so it ends stopped.
      g.script(9, (tl) => (init ? demoClip.gotoAndPlay(1) : tl.gotoAndStop("over")));
      g.script(12, (tl) => tl.stop());
      g.begin(); // frame 1 runs before ButtonMaker's constructor jumps to "out"
      g.addBehaviour(finger({ out: "out", over: "over", down: "over", up: "over" }));
      return g;
    };
    demoClip.place(green, 27, 46, 24);

    // Depth 24, sprite 23: the OK / replay disc (47-64).
    const okButton = () => {
      const b = new Clip(okFrames, { labels: { out: 1, over: 5, down: 15, up: 20 } });
      b.hitShape = circle(113, 113, 113);
      b.onFrame = (f) => {
        if (f === 1 || f === 11 || f === 15) b.stop();
        else if (f === 20) demoClip.gotoAndPlay("replay");
      };
      b.addBehaviour(finger({ out: "out", over: "over", down: "down", up: "up" }));
      return b;
    };
    demoClip.place(okButton, 47, 64, 24);

    // "DELETE / HARDISK" (sic) is what the SWF renders, so the art keeps it (the 2008 thumbnail says HARDDISK).
    demoClip.place(textStart, 1, 16, 30);
    demoClip.place(textOk, 47, 64, 30);

    // Sprite 13: YES / NO (17-46). Releasing jumps sprite 27 to the instance name: "YES", or "OVER" (the start) for NO.
    const smallButton = (name: string, up: ArtInfo, down: ArtInfo, cx: number, cy: number) => () => {
      const b = new Timeline({ frames: 10, labels: { up: 8 } });
      b.name = name;
      b.place(new Art(up), 1, 2);
      b.place(new Art(down), 3, 10);
      b.hitShape = circle(cx - 91.05, cy - 65.3, 80.95 / 2);
      b.script(1, (tl) => tl.stop());
      b.script(8, () => demoClip.gotoAndPlay(name));
      b.addBehaviour(finger({ out: 1, over: 1, down: 3, up: "up" }));
      return b;
    };
    demoClip.place(smallButton("OVER", noUp, noDown, 251.03, 165.78), 17, 46, 30);
    demoClip.place(smallButton("YES", yesUp, yesDown, 154.53, 167.78), 17, 46, 35);
    demoClip.place(textSure, 17, 46, 41);

    for (const f of [1, 6, 13, 44, 57]) demoClip.script(f, (tl) => tl.stop());
    demoClip.script(61, (tl) => tl.gotoAndStop("over")); // lower-case: matches OVER (frame 6)

    stage.addChild(await ArrowCursor.create({ cursorStyle: "Arrow", grip: 50, inertia: 10 }));
    engine.placeCursors(370.5, 59);
  },
};

export default demo;
