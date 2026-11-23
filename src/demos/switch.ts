import { Art, ArrowCursor, Dimmer, Hole, Node, Pushgutter, Timeline, WallMaker, loadArt, type Keyframe, type RoundParams } from "../pc";
import type { Demo } from "./types";

/*
 * Spec: reference/specs/switch.md
 *
 * Sprite 18 is a Timeline whose toolkit objects are placed with factories: every (re)entry
 * is a fresh instance with no rollover state, as in Flash. The state machine depends on it
 * (e.g. sensor A → B must not re-trigger "off_rollover").
 */

const FPS = 25;

/**
 * Toolkit depths 2-14 are mirrored (20 - d) so the tree (heartbeat) order is newest first, like AVM1's
 * onEnterFrame order: E/K rollin then beats C/D/G/J rollout in the same frame. They are hidden under the
 * opaque base (d20) either way.
 */
const tk = (d: number) => 20 - d;

function text(html: string, x: number, y: number, w: number, align: "left" | "center") {
  const n = new Node().set({ x, y });
  n.el.style.cssText += `width:${w}px;font:13px/17px Arial,Helvetica,sans-serif;color:#999999;text-align:${align};white-space:nowrap;user-select:none;pointer-events:none`;
  n.el.innerHTML = html;
  return n;
}

/**
 * The knob (sprite 11 at d21) carries a ColorMatrixFilter that the spec missed: grey when off, red when on
 * (as Ruffle renders it and the site icon shows). Rows R, G, B of the Flash 4x5 matrix (alpha row is identity).
 */
const KNOB_FILTERS: Record<number, number[]> = {
  1: [0.3518, 0.6947, 0.0935, 0, -43.09, 0.3518, 0.6947, 0.0935, 0, -43.09, 0.3518, 0.6947, 0.0935, 0, -43.09],
  25: [0.367, 0.7887, -0.0157, 0, -43.09, 0.3236, 0.6913, 0.1251, 0, -43.09, 0.4318, 0.6224, 0.0858, 0, -43.09],
  26: [0.3823, 0.8826, -0.1249, 0, -43.09, 0.2955, 0.6879, 0.1567, 0, -43.09, 0.5117, 0.5501, 0.0782, 0, -43.09],
  27: [0.3975, 0.9766, -0.2341, 0, -43.09, 0.2673, 0.6845, 0.1883, 0, -43.09, 0.5917, 0.4778, 0.0705, 0, -43.09],
  28: [0.4128, 1.0705, -0.3433, 0, -43.09, 0.2391, 0.681, 0.2199, 0, -43.09, 0.6716, 0.4055, 0.0629, 0, -43.09],
  29: [0.428, 1.1645, -0.4525, 0, -43.09, 0.2109, 0.6776, 0.2514, 0, -43.09, 0.7516, 0.3332, 0.0552, 0, -43.09],
  30: [0.7658, 3.2463, -2.8721, 0, -43.09, -0.4133, 0.6019, 0.9515, 0, -43.09, 2.523, -1.2687, -0.1143, 0, -43.09],
  62: [0.664, 2.6186, -2.1425, 0, -43.09, -0.2251, 0.6247, 0.7404, 0, -43.09, 1.9889, -0.7857, -0.0632, 0, -43.09],
  63: [0.5621, 1.9909, -1.413, 0, -43.09, -0.0369, 0.6475, 0.5293, 0, -43.09, 1.4547, -0.3027, -0.0121, 0, -43.09],
  64: [0.4876, 1.5316, -0.8792, 0, -43.09, 0.1008, 0.6643, 0.3749, 0, -43.09, 1.064, 0.0507, 0.0253, 0, -43.09],
  65: [0.4536, 1.3224, -0.6361, 0, -43.09, 0.1636, 0.6719, 0.3045, 0, -43.09, 0.8859, 0.2117, 0.0424, 0, -43.09],
  66: [0.4197, 1.1132, -0.3929, 0, -43.09, 0.2263, 0.6795, 0.2342, 0, -43.09, 0.7079, 0.3727, 0.0594, 0, -43.09],
  67: [0.3858, 0.9039, -0.1497, 0, -43.09, 0.2891, 0.6871, 0.1638, 0, -43.09, 0.5298, 0.5337, 0.0764, 0, -43.09],
};
function knobFilterFrame(f: number) {
  if ((f >= 25 && f <= 29) || (f >= 62 && f <= 67)) return f;
  return f >= 30 && f <= 61 ? 30 : 1;
}
/** SVG feColorMatrix versions of KNOB_FILTERS (offsets scaled from 0..255 to 0..1). */
function knobFilterDefs(): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  for (const [f, m] of Object.entries(KNOB_FILTERS)) {
    const filter = svg.appendChild(document.createElementNS(ns, "filter"));
    filter.id = `switch-knob-${f}`;
    filter.setAttribute("color-interpolation-filters", "sRGB");
    const cm = filter.appendChild(document.createElementNS(ns, "feColorMatrix"));
    const rows = [0, 5, 10].map((i) => [...m.slice(i, i + 4), m[i + 4] / 255]);
    cm.setAttribute("values", [...rows.flat(), 0, 0, 0, 1, 0].join(" "));
  }
  return svg;
}

/** Spec knob y table. */
function knobY(f: number) {
  const up = [-8.8, -10.25, -11.65, -13.1];
  const down = [-13.5, -12.45, -11.45, -10.45, -9.45, -8.4];
  if (f >= 25 && f <= 28) return up[f - 25];
  if (f >= 29 && f <= 61) return -14.5;
  if (f >= 62 && f <= 67) return down[f - 62];
  return -7.4;
}

const demo: Demo = {
  id: "switch",
  title: "Sweet Switch",
  description:
    "The mundane task of setting a switch is aesthetically enhanced by a subtle force under the switch that drags the cursor along as the button is being switched. Compare it with the regular switch next to it.",
  icon: "switch.gif",
  width: 400,
  height: 400,
  background: "#333333",
  fps: FPS,
  original: "switch.swf",
  engine: { baseForce: 100, combineForces: "Add", speedLimit: "high speed", scaleToAlpha: false, bouncingBalls: true },
  async build({ stage, engine }) {
    const [baseInfo, knobInfo, wallInfo] = await Promise.all(
      ["switch-base.svg", "switch-knob.svg", "switch-wall-guide.svg"].map((f) => loadArt(`demos/switch/${f}`)),
    );
    stage.el.appendChild(knobFilterDefs());
    const cursor = await ArrowCursor.create({ cursorStyle: "Arrow", grip: 50, inertia: 10 });
    // `_root.cursor.gotoAndStop("finger")`: changes only the picture, not the cursor's style name.
    const finger = () => cursor.showStyle("Finger");
    const arrow = () => cursor.showStyle("Arrow");

    type H = Partial<Record<"rollin" | "rollover" | "rollout" | "mousedown", () => void>>;
    const wire = <T extends Node>(obj: T, h: H): T => {
      for (const [k, fn] of Object.entries(h)) obj.on(`pc_${k}`, fn);
      return obj;
    };

    const makeSwitch = () => {
      let status = "off";
      let dragswitch = true;
      const go = (f: string) => sw.gotoAndPlay(f);

      const hole = (x: number, y: number, sx: number, sy: number, p: RoundParams, h: H) => () =>
        wire(new Hole({ style: "None", rolloverCursorStyle: "Null", rolloverCursorSound: "", ...p }).set({ x, y, scaleX: sx, scaleY: sy }), h);
      const CYAN = 0x00ffff;
      const RED = 0xdd2424;

      const offSensor: H = { rollin: () => go("off_rollover"), rollover: () => sw.play(), rollout: () => (arrow(), sw.gotoAndStop("off_rollout")) };
      const offDimple: H = { rollin: finger, rollover: finger, rollout: () => go("off_rollout"), mousedown: () => go("turn_on") };
      const onSensor: H = { rollin: () => go("on_rollover"), rollover: () => sw.play(), rollout: () => (arrow(), go("on_rollout")) };
      const onDimple: H = { rollover: finger, rollout: () => (arrow(), go("on_rollout")), mousedown: () => go("turn_off") };

      const sensor = (y: number, strength: number, h: H) =>
        hole(-13.25, y, 0.26620483, 0.35488892, { strength, shape: "U-shaped", plateauDiameter: 20, tint: RED }, h);
      const dimple = (y: number, strength: number, plateauDiameter: number, h: H, style: RoundParams["style"] = "None") =>
        hole(-6.15, y, 0.13000488, 0.13000488, { strength, shape: "Sine-shaped", plateauDiameter, style, tint: CYAN }, h);
      const dragTarget = (x: number, y: number, sx: number, sy: number, to: string) =>
        hole(
          x,
          y,
          sx,
          sy,
          { strength: 3, shape: "Sine-shaped", plateauDiameter: 4, style: "Circle with shading", tint: CYAN },
          {
            rollin: () => (finger(), dragswitch && go(to)),
            rollout: finger,
          },
        );
      const pusher = (x: number, y: number, rotation: number, sx: number, plateauDiameter: number) => () =>
        wire(
          new Pushgutter({
            strength: 3,
            pushStrength: 3,
            shape: "U-shaped",
            plateauDiameter,
            arrowStyle: "Still",
            graphicsStyle: "None",
            tint: RED,
            rolloverCursorStyle: "Null",
            rolloverCursorSound: "",
          }).set({ x, y, rotation, scaleX: sx, scaleY: 0.3999939 }),
          { rollover: finger },
        );
      const muter = () =>
        wire(
          new Dimmer({ scope: "Mouse", dimmingFactor: 0, tint: 0xeeabab, rolloverCursorStyle: "Null", rolloverCursorSound: "" }).set({
            x: -10.6,
            y: -14.25,
            scaleX: 0.22059631,
            scaleY: 0.28419495,
          }),
          { rollover: finger },
        );
      // Sprite 15: the invisible wall guide (alpha 0) leaving only a pocket along the knob's travel.
      const wall = () => {
        const w = new Node().set({ x: -16.65, y: -22.75, alpha: 0 });
        w.addChild(new Art(wallInfo, { hit: true }));
        w.addBehaviour(new WallMaker());
        return w;
      };

      const sw = new Timeline({
        frames: 71,
        fps: FPS,
        play: true,
        labels: {
          off_rollout: 2,
          off_rollover: 4,
          off_inside: 12,
          off_inside_forawhile: 19,
          turn_on: 24,
          on_rollout: 35,
          on_rollover: 42,
          on_go_inside: 47,
          on_inside: 51,
          on_inside_forawhile: 56,
          turn_off: 61,
        },
      });

      const knobKeys: Record<number, Keyframe> = {};
      for (let f = 1; f <= 71; f++) {
        knobKeys[f] = (n) => {
          n.y = knobY(f);
          n.el.style.filter = `url(#switch-knob-${knobFilterFrame(f)})`;
        };
      }
      sw.place(text("off", -6.75, -31, 18.75, "left"), 1, 28, 1);
      sw.place(text("on", -6.75, -31, 18.75, "left"), 29, 71, 1);
      sw.place(new Art(baseInfo), 1, 71, 20);
      sw.place(new Art(knobInfo).set({ x: -11.5 }), 1, 71, 21, knobKeys);
      sw.place(sensor(-14.5, 0, offSensor), 1, 4, tk(2)); // A
      sw.place(sensor(-14.5, 2, offSensor), 5, 11, tk(2)); // B
      sw.place(dimple(-4.15, 3, 2, offDimple), 6, 16, tk(8)); // C
      sw.place(dimple(-4.15, 0, 5, offDimple), 17, 23, tk(8)); // D
      sw.place(dragTarget(-4.05, -11.4, 0.08804321, 0.08355713, "turn_on"), 19, 23, tk(14)); // E
      sw.place(pusher(-4.5, 12.1, -90, 0.08253479, 5), 24, 31, tk(2)); // P↑
      sw.place(wall, 24, 31, tk(8)); // W
      sw.place(muter, 24, 31, tk(12)); // M
      sw.place(sensor(-21, 0, onSensor), 39, 42, tk(2)); // F
      sw.place(dimple(-10.15, 3, 2, { ...onDimple, mousedown: () => (console.log("turn off"), go("turn_off")) }), 42, 52, tk(8)); // G
      sw.place(sensor(-21, 2, onSensor), 43, 48, tk(2)); // H
      sw.place(dimple(-10.15, 1, 3, onDimple, "Circle"), 53, 60, tk(8)); // J
      sw.place(dragTarget(-3.75, -0.1, 0.0821228, 0.0821228, "turn_off"), 56, 60, tk(14)); // K
      sw.place(pusher(5.5, -12, 90, 0.06851196, 4), 61, 71, tk(2)); // P↓
      sw.place(wall, 61, 70, tk(8)); // W
      sw.place(muter, 61, 71, tk(12)); // M

      sw.script(1, () => {
        dragswitch = true;
        if (status === "on") {
          sw.gotoAndStop("on_rollout");
          sw.play();
        }
      });
      sw.script(2, () => sw.stop());
      sw.script(19, () => sw.stop());
      sw.script(24, finger);
      sw.script(31, () => {
        status = "on";
        sw.gotoAndStop("on_go_inside");
        sw.play();
      });
      sw.script(35, () => sw.play());
      sw.script(41, () => sw.stop());
      sw.script(56, () => sw.stop());
      sw.script(61, finger);
      sw.script(71, () => {
        status = "off";
        sw.gotoAndStop("off_inside");
        sw.play();
      });
      return sw;
    };

    const left = stage.addChild(makeSwitch()).set({ name: "switch_on", x: 123.05, y: 94.2 });
    // Root dimmer (Global forces → 0 %) over the right switch. Mouse dimmer and wall are not forces, so they still act.
    stage.addChild(
      new Dimmer({ scope: "Global forces", dimmingFactor: 0, tint: 0x333333, rolloverCursorStyle: "Null", rolloverCursorSound: "" }).set({
        x: 242,
        y: 76,
        scaleX: 0.27975464,
        scaleY: 0.39988708,
        alpha: 51 / 256,
      }),
    );
    const right = stage.addChild(makeSwitch()).set({ name: "switch_on2", x: 254.95, y: 94.2 });
    left.begin();
    right.begin();
    stage.addChild(text("with visual<br>force feedback", 70.6, 127.75, 109.7, "center"));
    stage.addChild(text("regular<br>(no feedback)", 201.6, 127.75, 109.7, "center"));

    stage.addChild(cursor).set({ name: "cursor" });
    engine.placeCursors(392.5, 84);
  },
};

export default demo;
