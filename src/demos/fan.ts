import { ArrowCursor, EventDispatcher, Hole, Timeline, Twister, art } from "../pc";
import type { Demo } from "./types";

/** Spec: reference/specs/fan.md */
const demo: Demo = {
  id: "fan",
  title: "Don't touch that Fan!",
  description:
    "What do you expect will happen when you move your cursor on the fan? This is a very basic example of visual force feedback. Click the fan to switch it off and on.",
  icon: "fan.gif",
  width: 300,
  height: 300,
  background: "#333333",
  fps: 25,
  original: "fan.swf",
  engine: { scaleToAlpha: false },
  async build({ stage, engine }) {
    const [f1, f2, f3, f4] = await Promise.all([1, 2, 3, 4].map((i) => art(`demos/fan/fan-${i}.svg`, { hit: true })));

    // The fan sprite: a 9-frame timeline at 25 fps.
    const fan = stage.addChild(new Timeline({ frames: 9, fps: 25 })).set({ x: 125.05, y: 77 });
    let playing = true;

    fan.placeAlways(new Hole({ strength: 3, shape: "U-shaped", plateauDiameter: 0, style: "None", rolloverCursorStyle: "Finger", rolloverCursorSound: "pop" }).set({ x: 1, y: 0, scale: 0.6470032 }), 1);
    // As in the SWF, the twister only exists on frames 1-7: a fresh instance on every loop.
    fan.place(() => new Twister({ strength: 18, shape: "U-shaped", plateauDiameter: 10, spin: "Right Out", style: "None", vortexStyle: "None" }).set({ scale: 0.6672821 }), 1, 7, 7);
    fan.place(f4, 8, 9, 7);
    fan.place(f1, 1, 3, 18);
    fan.place(f2, 4, 5, 18);
    fan.place(f3, 6, 7, 18);

    fan.script(1, () => (playing = true));
    fan.script(9, (tl) => (playing ? tl.gotoAndPlay(3) : tl.gotoAndPlay(8)));

    // The EventDispatcher makes the whole fan clip dispatch pc_* events.
    fan.addBehaviour(new EventDispatcher({ pc_mousedown: () => (playing = !playing) }));
    fan.begin(true);

    stage.addChild(await ArrowCursor.create({ grip: 50, inertia: 10 }));
    engine.placeCursors(150, 250);
  },
};

export default demo;
