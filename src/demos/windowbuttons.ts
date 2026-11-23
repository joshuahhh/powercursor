import { ArrowCursor, ButtonMaker, Dimmer, Node, Target, Timeline, art, type Art } from "../pc";
import type { Demo } from "./types";

type Kind = "min" | "plus" | "cross";
const ICON: Record<Kind, string> = { min: "icon-min", plus: "icon-plus", cross: "icon-close" };
// Icon positions (sprite 19 local) in the "up" state; "down" is (18.3, 18.5) for all.
const ICON_UP: Record<Kind, [number, number]> = { min: [17.3, 17.5], plus: [17.8, 17.0], cross: [17.3, 17.5] };

/** Content offset and alpha on each window frame 1..67 (spec: Window (sprite 26)). */
function contentKey(f: number): [number, number, number] {
  if (f >= 11 && f <= 26) return [-31, 48, 1];
  if (f >= 27 && f <= 49) return [-129, 124, 1];
  if (f === 50) return [-129, 124, 0];
  if (f >= 51 && f <= 66) {
    const i = f - 51;
    const xs = [-121.4, -113.8, -106.25, -98.65, -91.05, -83.45, -75.9, -68.3, -60.7, -53.1, -45.55, -37.95, -30.35, -22.75, -15.2, -7.6];
    const ys = [116.7, 109.4, 102.1, 94.8, 87.55, 80.25, 72.95, 65.65, 58.35, 51.05, 43.75, 36.45, 29.2, 21.9, 14.6, 7.3];
    return [xs[i], ys[i], (15 * (f - 50) + (f >= 59 ? 1 : 0)) / 256];
  }
  return [0, 0, 1];
}

/** Spec: reference/specs/windowbuttons.md */
const demo: Demo = {
  id: "windowbuttons",
  title: "Windowbuttons",
  description:
    "Those small buttons in the corner of windows can be difficult to click. Window A has buttons augmented with a force target, which drags the cursor to the center and makes them easier to click than the regular ones in window B. Scientific research points out that the usability of the augmented buttons is significantly higher. Do you notice the difference?",
  icon: "windowbuttons.gif",
  width: 400,
  height: 200,
  background: "#333333",
  fps: 25,
  original: "windowbuttons.swf",
  engine: { baseForce: 100, combineForces: "Add", speedLimit: "high speed", scaleToAlpha: false, bouncingBalls: true, hideAllObjects: false },
  async build({ stage, engine }) {
    const dir = "demos/windowbuttons/";
    const load = (f: string) => art(dir + f);

    /** Sprite 19: a window button (20 frames). Clicking calls `jump(kind)` at "up". */
    async function windowButton(kind: Kind, jump: (k: Kind) => void): Promise<Timeline> {
      const b = new Timeline({ frames: 20, labels: { out: 1, over: 5, down: 10, up: 15 } });
      b.name = kind;
      b.placeAlways(new Target({ strength: 4, plateauDiameter: 10, shape: "U-shaped", style: "None", showBullseye: false })).set({
        x: 6.75,
        y: 6.65,
        scale: 0.23808,
      });
      b.placeAlways((await art(dir + "button-up.svg", { hit: true })).set({ x: 18.4, y: 18.6, scaleX: 0.49933, scaleY: 0.5 }));
      b.place((await load("button-pressed-overlay.svg")).set({ x: 18.4, y: 18.6, scaleX: 0.49931, scaleY: 0.49731 }), 10, 14);
      const icon: Art = b.placeAlways(await load(ICON[kind] + ".svg"));
      icon.img.style.imageRendering = "pixelated";
      const up = () => icon.set({ x: ICON_UP[kind][0], y: ICON_UP[kind][1] });
      b.script(1, (tl) => (up(), tl.stop()));
      b.script(5, (tl) => (up(), tl.stop()));
      b.script(10, (tl) => (icon.set({ x: 18.3, y: 18.5 }), tl.stop()));
      b.script(15, () => (up(), jump(kind)));
      // Hit area = the whole clip (button art + the Target's square-bounded disc).
      b.addBehaviour(new ButtonMaker({ out: "out", over: "over", down: "down", up: "up", rolloverCursorStyle: "Default" }));
      return b;
    }

    /** Sprite 26: a window (67 frames); only the instance name picks the letter. */
    async function windowClip(name: string, x: number, y: number): Promise<Timeline> {
      const w = new Timeline({ frames: 67, labels: { plus: 1, min: 11, cross: 27 }, fps: 25 });
      w.set({ name, x, y });
      // Mask (shape 3, clipDepth 50): clips everything inside to (18, 0.55)-(140.5, 123.05).
      // Clipped-out content still hit-tests, as in Flash (in "cross" its Targets sit below the windows).
      const clipped = w.addChild(new Node());
      clipped.el.style.clipPath = "polygon(18px 0.55px, 140.5px 0.55px, 140.5px 123.05px, 18px 123.05px)";
      clipped.addChild(await load("window-backdrop-black.svg"));
      const content = clipped.addChild(new Node());
      content.addChild(await load("window-content-base.svg"));
      const jump = (k: Kind) => w.gotoAndPlay(k);
      // Depth order: plus (3), cross (17), min (31), letter (45).
      content.addChild(await windowButton("plus", jump)).set({ x: 67.8, y: -4 });
      content.addChild(await windowButton("cross", jump)).set({ x: 87.8, y: -4.1 });
      content.addChild(await windowButton("min", jump)).set({ x: 47.1, y: -4.05 });
      // Sprite 23: "A" in the window named A, "B" in the other one.
      content.addChild(await load(name === "A" ? "letter-A.svg" : "letter-B.svg")).set({ x: 22, y: 27.75, alpha: 77 / 256 });
      clipped.addChild(await load("window-outline.svg"));

      for (let f = 1; f <= 67; f++) {
        const [cx, cy, ca] = contentKey(f);
        w.script(f, () => content.set({ x: cx, y: cy, alpha: ca }));
      }
      for (const f of [1, 10, 11, 26]) w.script(f, (tl) => tl.stop());
      return w;
    }

    stage.addChild(await windowClip("A", 44.5, 45.5));
    // Window B's buttons are "regular" because of this invisible Dimmer over them (its square is hidden behind window B).
    stage
      .addChild(new Dimmer({ scope: "Global forces", dimmingFactor: 0, directionDependency: "None", dirDepAngle: 0, tint: 0xeeabab }))
      .set({ x: 223, y: 48.1, scaleX: 1.099, scaleY: 1.1805 });
    stage.addChild(await windowClip("", 198.5, 45.5));

    stage.addChild(await ArrowCursor.create({ cursorStyle: "Arrow", grip: 50, inertia: 10 }));
    engine.placeCursors(392.5, 84);
  },
};

export default demo;
